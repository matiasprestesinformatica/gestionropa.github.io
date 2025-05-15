
'use server';

import { generateOutfitExplanation, type GenerateOutfitExplanationInput } from '@/ai/flows/generate-outfit-explanation';
import type { SuggestedOutfit, OutfitItem, Prenda, Look, LookFormData, CalendarAssignment, CalendarAssignmentFormData, PrendaCalendarAssignment, LookCalendarAssignment, StatisticsSummary, ColorFrequency, StyleUsageStat, TimeActivityStat, IntelligentInsightData, TipoPrenda } from '@/types';
import { PRENDA_COLORS, TIPO_PRENDA_ENUM_VALUES } from '@/types';
import { supabase } from '@/lib/supabaseClient';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { format, parseISO, isValid, startOfMonth, endOfMonth, formatISO, subMonths, getMonth, getYear } from 'date-fns';
import { es } from 'date-fns/locale';
import { mapDbPrendaToClient } from '@/lib/dataMappers';

interface GetOutfitSuggestionParams {
  temperature: [number, number];
  styleId: string;
  useClosetInfo: boolean;
}

function shuffleArray<T>(array: T[]): T[] {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

export async function getAISuggestionAction(
  params: GetOutfitSuggestionParams
): Promise<SuggestedOutfit | { error: string }> {
  if (!supabase) {
    console.error("Supabase client is not initialized in getAISuggestionAction. Check environment variables.");
    return { error: "Error de conexión con la base de datos. Por favor, inténtalo más tarde." };
  }
  try {
    const { temperature, styleId, useClosetInfo } = params;

    const prendasResult = await getPrendasAction();
    if (prendasResult.error || !prendasResult.data) {
      return { error: prendasResult.error || "No se pudieron obtener los artículos de tu armario." };
    }

    const activeClientPrendas = prendasResult.data.filter(p => !p.is_archived);

    if (activeClientPrendas.length === 0) {
      return { error: "Tu armario está vacío o no tiene artículos activos. Por favor, añade algunas prendas primero." };
    }

    const [minUserTemp, maxUserTemp] = temperature;

    const filteredPrendas = activeClientPrendas.filter(p => {
      const styleMatch = p.estilo.toLowerCase() === styleId.toLowerCase();
      const tempMatch = (
        typeof p.temperatura_min === 'number' &&
        typeof p.temperatura_max === 'number' &&
        p.temperatura_min <= maxUserTemp &&
        p.temperatura_max >= minUserTemp
      );
      return styleMatch && tempMatch;
    });

    if (filteredPrendas.length === 0) {
      return { error: "No se encontraron artículos adecuados en tu armario para el estilo y la temperatura seleccionados." };
    }

    const shuffledPrendas = shuffleArray(filteredPrendas);
    const outfitItemCount = Math.min(shuffledPrendas.length, 3); // Suggest up to 3 items
    const selectedClientItems = shuffledPrendas.slice(0, outfitItemCount);

    if (selectedClientItems.length === 0) {
         return { error: "No se pudieron seleccionar artículos para un atuendo de tu armario que coincidan con los criterios." };
    }

    const outfitItems: OutfitItem[] = selectedClientItems.map(p => ({
      id: p.id.toString(),
      name: p.nombre,
      imageUrl: p.imagen_url || `https://placehold.co/300x400.png?text=${encodeURIComponent(p.nombre)}`,
      category: p.tipo as string, 
      color: p.color,
      aiHint: `${p.tipo.toLowerCase()} ${p.color ? p.color.toLowerCase() : ''}`.trim().substring(0,50) || p.nombre.toLowerCase(),
    }));

    const outfitDescription = outfitItems.map(item => item.name).join(', ');
    const temperatureRangeString = `${temperature[0]}-${temperature[1]} grados Celsius`;

    const aiInput: GenerateOutfitExplanationInput = {
      temperatureRange: temperatureRangeString,
      selectedStyle: styleId.charAt(0).toUpperCase() + styleId.slice(1),
      outfitDescription: outfitDescription,
      userClosetInformationNeeded: useClosetInfo,
    };

    const aiOutput = await generateOutfitExplanation(aiInput);

    return {
      items: outfitItems,
      explanation: aiOutput.explanation,
    };
  } catch (error) {
    console.error('Error generating outfit suggestion:', error);
    const errorMessage = error instanceof Error ? error.message : 'Ocurrió un error inesperado al generar la sugerencia.';
    return { error: `No se pudo obtener la sugerencia: ${errorMessage}` };
  }
}

const PrendaFormSchema = z.object({
  nombre: z.string().min(1, "El nombre es requerido."),
  tipo: z.enum(TIPO_PRENDA_ENUM_VALUES, { required_error: "Por favor selecciona un tipo válido."}),
  color: z.enum(PRENDA_COLORS, { errorMap: () => ({ message: "Por favor selecciona un color válido." }) }),
  modelo: z.string().min(1, "El modelo es requerido."),
  temporada: z.string().min(1, "La temporada es requerida."),
  fechacompra: z.string().refine((val) => {
    if (val === '' || val === null || val === undefined) return true; // Allow empty for optional
    const parsedDate = parseISO(val);
    return isValid(parsedDate);
  }, {
    message: "La fecha de compra debe ser válida (YYYY-MM-DD) o estar vacía.",
  }).optional().nullable(),
  imagen_url: z.string().url("Debe ser una URL válida.").or(z.literal("")).optional(),
  temperatura_min: z.coerce.number().optional().nullable(),
  temperatura_max: z.coerce.number().optional().nullable(),
  estilo: z.string().min(1, "El estilo es requerido."),
  is_archived: z.preprocess(val => val === 'on' || val === 'true' || val === true, z.boolean()).optional().default(false),
});


export async function addPrendaAction(formData: FormData): Promise<{ data?: Prenda; error?: string; validationErrors?: z.ZodIssue[] }> {
  if (!supabase) {
    console.error("Supabase client is not initialized in addPrendaAction. Check environment variables.");
    return { error: "Error de conexión con la base de datos. Por favor, inténtalo más tarde." };
  }

  const rawFormData = Object.fromEntries(formData.entries());
  const validatedFields = PrendaFormSchema.safeParse(rawFormData);

  if (!validatedFields.success) {
    return {
      validationErrors: validatedFields.error.issues,
      error: "Falló la validación."
    };
  }

  const { nombre, tipo, color, modelo, temporada, fechacompra, imagen_url, temperatura_min, temperatura_max, estilo, is_archived } = validatedFields.data;

  const itemToInsertToDb = {
    nombre,
    tipo,
    color,
    modelo,
    temporada,
    fechacompra: fechacompra || null, // Will be saved as 'YYYY-MM-DD' or null if empty
    imagen_url: imagen_url || `https://placehold.co/200x300.png?text=${encodeURIComponent(nombre)}`,
    temperatura_min,
    temperatura_max,
    estilo,
    is_archived,
  };

  try {
    const { data: dbData, error } = await supabase
      .from('prendas')
      .insert([itemToInsertToDb])
      .select()
      .single();

    if (error) throw error;

    revalidatePath('/closet');
    revalidatePath('/'); 
    revalidatePath('/archivo');
    revalidatePath('/statistics');
    return { data: mapDbPrendaToClient(dbData) };
  } catch (error) {
    console.error('Error adding prenda:', error);
    const errorMessage = error instanceof Error ? error.message : 'Ocurrió un error inesperado al agregar el artículo.';
    return { error: errorMessage };
  }
}

export async function getPrendasAction(): Promise<{ data?: Prenda[]; error?: string }> {
  if (!supabase) {
    console.error("Supabase client is not initialized in getPrendasAction. Check environment variables.");
    return { error: "Error de conexión con la base de datos. Por favor, inténtalo más tarde.", data: [] };
  }

  try {
    const { data: dbData, error } = await supabase
      .from('prendas')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    const clientData: Prenda[] = dbData.map(mapDbPrendaToClient);
    return { data: clientData };
  } catch (error) {
    console.error('Error fetching prendas:', error);
    const errorMessage = error instanceof Error ? error.message : 'Ocurrió un error inesperado al obtener los artículos.';
    return { error: errorMessage, data: [] };
  }
}

export async function updatePrendaAction(itemId: number, formData: FormData): Promise<{ data?: Prenda; error?: string; validationErrors?: z.ZodIssue[] }> {
  if (!supabase) {
    console.error("Supabase client is not initialized in updatePrendaAction. Check environment variables.");
    return { error: "Error de conexión con la base de datos. Por favor, inténtalo más tarde." };
  }

  const rawFormData = Object.fromEntries(formData.entries());
  const validatedFields = PrendaFormSchema.safeParse(rawFormData);

  if (!validatedFields.success) {
    return {
      validationErrors: validatedFields.error.issues,
      error: "Falló la validación."
    };
  }

  const { nombre, tipo, color, modelo, temporada, fechacompra, imagen_url, temperatura_min, temperatura_max, estilo, is_archived } = validatedFields.data;

  const itemToUpdateInDb = {
    nombre,
    tipo,
    color,
    modelo,
    temporada,
    fechacompra: fechacompra || null,
    imagen_url: imagen_url || `https://placehold.co/200x300.png?text=${encodeURIComponent(nombre)}`,
    temperatura_min,
    temperatura_max,
    estilo,
    is_archived,
  };

  try {
    const { data: dbData, error } = await supabase
      .from('prendas')
      .update(itemToUpdateInDb)
      .eq('id', itemId)
      .select()
      .single();

    if (error) throw error;

    revalidatePath('/closet');
    revalidatePath('/'); 
    revalidatePath('/archivo');
    revalidatePath('/statistics');
    return { data: mapDbPrendaToClient(dbData) };
  } catch (error) {
    console.error('Error updating prenda:', error);
    const errorMessage = error instanceof Error ? error.message : 'Ocurrió un error inesperado al actualizar el artículo.';
    return { error: errorMessage };
  }
}

export async function deletePrendaAction(itemId: number): Promise<{ success?: boolean; error?: string }> {
  if (!supabase) {
    console.error("Supabase client is not initialized in deletePrendaAction. Check environment variables.");
    return { error: "Error de conexión con la base de datos. Por favor, inténtalo más tarde." };
  }

  try {
    const { error } = await supabase
      .from('prendas')
      .delete()
      .eq('id', itemId);

    if (error) throw error;

    revalidatePath('/closet');
    revalidatePath('/');
    revalidatePath('/archivo');
    revalidatePath('/looks');
    revalidatePath('/calendario');
    revalidatePath('/statistics');
    return { success: true };
  } catch (error) {
    console.error('Error deleting prenda:', error);
    const errorMessage = error instanceof Error ? error.message : 'Ocurrió un error inesperado al eliminar el artículo.';
    return { error: errorMessage };
  }
}

// --- Looks Actions ---

export async function getLooksAction(): Promise<{ data?: Look[]; error?: string }> {
  if (!supabase) {
    console.error("Supabase client is not initialized in getLooksAction. Check environment variables.");
    return { error: "Error de conexión con la base de datos. Por favor, inténtalo más tarde.", data: [] };
  }
  try {
    const { data: looksData, error: looksError } = await supabase
      .from('looks')
      .select(`
        *,
        look_prendas (
          prenda_id,
          prendas (*)
        )
      `)
      .order('created_at', { ascending: false });

    if (looksError) throw looksError;
    if (!looksData) return { data: [] };

    const formattedLooks: Look[] = looksData.map(look => ({
      ...look,
      prendas: look.look_prendas.map((lp: any) => mapDbPrendaToClient(lp.prendas))
    }));

    return { data: formattedLooks };
  } catch (error) {
    console.error('Error fetching looks:', error);
    const errorMessage = error instanceof Error ? error.message : 'Ocurrió un error inesperado al obtener los looks.';
    return { error: errorMessage, data: [] };
  }
}

export async function getLookByIdAction(lookId: number): Promise<{ data?: Look; error?: string }> {
  if (!supabase) {
    console.error("Supabase client is not initialized in getLookByIdAction. Check environment variables.");
    return { error: "Error de conexión con la base de datos. Por favor, inténtalo más tarde." };
  }
  try {
    const { data: lookData, error: lookError } = await supabase
      .from('looks')
      .select(`
        *,
        look_prendas (
          prenda_id,
          prendas (*)
        )
      `)
      .eq('id', lookId)
      .single();

    if (lookError) throw lookError;
    if (!lookData) return { error: "Look no encontrado." };

    const formattedLook: Look = {
        ...lookData,
        prendas: lookData.look_prendas.map((lp: any) => mapDbPrendaToClient(lp.prendas))
    };
    return { data: formattedLook };

  } catch (error) {
    console.error('Error fetching look by ID:', error);
    const errorMessage = error instanceof Error ? error.message : 'Ocurrió un error inesperado.';
    return { error: errorMessage };
  }
}


export async function addLookAction(formData: LookFormData): Promise<{ data?: Look; error?: string; validationErrors?: z.ZodIssue[] }> {
  if (!supabase) {
    console.error("Supabase client is not initialized in addLookAction. Check environment variables.");
    return { error: "Error de conexión con la base de datos. Por favor, inténtalo más tarde." };
  }

  if (!formData.nombre || formData.prenda_ids.length === 0) {
    return { error: "El nombre del look y al menos una prenda son requeridos." };
  }

  try {
    const { data: lookData, error: lookError } = await supabase
      .from('looks')
      .insert([{
        nombre: formData.nombre,
        descripcion: formData.descripcion,
        estilo: formData.estilo,
        imagen_url: formData.imagen_url,
      }])
      .select()
      .single();

    if (lookError) throw lookError;
    if (!lookData) throw new Error("Falló la creación del look.");

    const lookId = lookData.id;

    const lookPrendasToInsert = formData.prenda_ids.map(prenda_id => ({
      look_id: lookId,
      prenda_id: prenda_id,
    }));

    const { error: lookPrendasError } = await supabase
      .from('look_prendas')
      .insert(lookPrendasToInsert);

    if (lookPrendasError) throw lookPrendasError;

    revalidatePath('/looks');
    revalidatePath('/statistics');


    const newLookResult = await getLookByIdAction(lookId);
    if (newLookResult.error || !newLookResult.data) {
        return { error: newLookResult.error || "Look creado, pero no se pudo obtener con detalles." };
    }
    return { data: newLookResult.data };

  } catch (error) {
    console.error('Error adding look:', error);
    const errorMessage = error instanceof Error ? error.message : 'Ocurrió un error inesperado al agregar el look.';
    return { error: errorMessage };
  }
}

export async function updateLookAction(lookId: number, formData: LookFormData): Promise<{ data?: Look; error?: string; validationErrors?: z.ZodIssue[] }> {
  if (!supabase) {
    console.error("Supabase client is not initialized in updateLookAction. Check environment variables.");
    return { error: "Error de conexión con la base de datos. Por favor, inténtalo más tarde." };
  }

  if (!formData.nombre || formData.prenda_ids.length === 0) {
    return { error: "El nombre del look y al menos una prenda son requeridos." };
  }

  try {
    const { data: updatedLookData, error: lookError } = await supabase
      .from('looks')
      .update({
        nombre: formData.nombre,
        descripcion: formData.descripcion,
        estilo: formData.estilo,
        imagen_url: formData.imagen_url,
      })
      .eq('id', lookId)
      .select()
      .single();

    if (lookError) throw lookError;
    if (!updatedLookData) throw new Error("Falló la actualización del look.");

    const { error: deleteError } = await supabase
      .from('look_prendas')
      .delete()
      .eq('look_id', lookId);

    if (deleteError) throw deleteError;

    const lookPrendasToInsert = formData.prenda_ids.map(prenda_id => ({
      look_id: lookId,
      prenda_id: prenda_id,
    }));

    const { error: insertError } = await supabase
      .from('look_prendas')
      .insert(lookPrendasToInsert);

    if (insertError) throw insertError;

    revalidatePath('/looks');
    revalidatePath(`/looks/${lookId}`);
    revalidatePath('/statistics');


    const finalLookResult = await getLookByIdAction(lookId);
    if (finalLookResult.error || !finalLookResult.data) {
        return { error: finalLookResult.error || "Look actualizado, pero no se pudo obtener con detalles." };
    }
    return { data: finalLookResult.data };

  } catch (error) {
    console.error('Error updating look:', error);
    const errorMessage = error instanceof Error ? error.message : 'Ocurrió un error inesperado al actualizar el look.';
    return { error: errorMessage };
  }
}

export async function deleteLookAction(lookId: number): Promise<{ success?: boolean; error?: string }> {
  if (!supabase) {
    console.error("Supabase client is not initialized in deleteLookAction. Check environment variables.");
    return { error: "Error de conexión con la base de datos. Por favor, inténtalo más tarde." };
  }
  try {
    const { error } = await supabase
      .from('looks')
      .delete()
      .eq('id', lookId);

    if (error) throw error;

    revalidatePath('/looks');
    revalidatePath('/calendario');
    revalidatePath('/statistics');
    return { success: true };
  } catch (error) {
    console.error('Error deleting look:', error);
    const errorMessage = error instanceof Error ? error.message : 'Ocurrió un error inesperado al eliminar el look.';
    return { error: errorMessage };
  }
}

// --- Calendar Assignments Actions ---

export async function getCalendarAssignmentsAction(
  currentMonthDate: Date
): Promise<{ data?: CalendarAssignment[]; error?: string }> {
  if (!supabase) {
    console.error("Supabase client is not initialized in getCalendarAssignmentsAction. Check environment variables.");
    return { error: "Error de conexión con la base de datos. Por favor, inténtalo más tarde." };
  }

  const startDate = formatISO(startOfMonth(currentMonthDate), { representation: 'date' });
  const endDate = formatISO(endOfMonth(currentMonthDate), { representation: 'date' });

  try {
    const { data: assignmentsData, error } = await supabase
      .from('calendario_asignaciones')
      .select(`
        *,
        prendas (*),
        looks (*, look_prendas(prendas(*)))
      `)
      .gte('fecha', startDate)
      .lte('fecha', endDate)
      .order('fecha', { ascending: true });

    if (error) throw error;

    const formattedAssignments: CalendarAssignment[] = assignmentsData.map((assignment: any) => {
      if (assignment.tipo_asignacion === 'prenda' && assignment.prendas) {
        return {
          ...assignment,
          fecha: assignment.fecha,
          prenda: mapDbPrendaToClient(assignment.prendas),
          look: null,
          look_id: null,
        } as PrendaCalendarAssignment;
      } else if (assignment.tipo_asignacion === 'look' && assignment.looks) {
        return {
          ...assignment,
          fecha: assignment.fecha,
          look: {
            ...assignment.looks,
            prendas: assignment.looks.look_prendas.map((lp: any) => mapDbPrendaToClient(lp.prendas)),
          },
          prenda: null,
          prenda_id: null,
        } as LookCalendarAssignment;
      }
      console.warn("Found assignment without valid prenda or look reference:", assignment.id)
      return { ...assignment, fecha: assignment.fecha, prenda: null, look: null }; 
    }).filter(Boolean) as CalendarAssignment[]; 
    return { data: formattedAssignments };
  } catch (error) {
    console.error('Error fetching calendar assignments:', error);
    const errorMessage = error instanceof Error ? error.message : 'Ocurrió un error inesperado.';
    return { error: errorMessage };
  }
}

export async function addCalendarAssignmentAction(
  formData: CalendarAssignmentFormData
): Promise<{ data?: CalendarAssignment; error?: string }> {
  if (!supabase) {
    console.error("Supabase client is not initialized in addCalendarAssignmentAction. Check environment variables.");
    return { error: "Error de conexión con la base de datos. Por favor, inténtalo más tarde." };
  }
  try {
    const assignmentToInsert: any = {
      fecha: formData.fecha,
      tipo_asignacion: formData.tipo_asignacion,
      nota: formData.nota,
    };
    if (formData.tipo_asignacion === 'prenda') {
      assignmentToInsert.prenda_id = formData.referencia_id;
    } else {
      assignmentToInsert.look_id = formData.referencia_id;
    }

    const { data, error } = await supabase
      .from('calendario_asignaciones')
      .insert(assignmentToInsert)
      .select(`
        *,
        prendas (*),
        looks (*, look_prendas(prendas(*)))
      `)
      .single();

    if (error) throw error;

    revalidatePath('/calendario');
    revalidatePath('/statistics');


    let fullAssignment: CalendarAssignment | undefined;
    if (data.tipo_asignacion === 'prenda' && data.prendas) {
        fullAssignment = {
            ...data,
            fecha: data.fecha,
            prenda: mapDbPrendaToClient(data.prendas),
            look: null, look_id: null
        } as PrendaCalendarAssignment;
    } else if (data.tipo_asignacion === 'look' && data.looks) {
        fullAssignment = {
            ...data,
            fecha: data.fecha,
            look: {
                ...data.looks,
                prendas: data.looks.look_prendas.map((lp: any) => mapDbPrendaToClient(lp.prendas))
            },
            prenda: null, prenda_id: null
        } as LookCalendarAssignment;
    }

    return { data: fullAssignment };

  } catch (error) {
    console.error('Error adding calendar assignment:', error);
    return { error: error instanceof Error ? error.message : 'No se pudo agregar la asignación.' };
  }
}

export async function updateCalendarAssignmentAction(
  assignmentId: number,
  formData: CalendarAssignmentFormData
): Promise<{ data?: CalendarAssignment; error?: string }> {
  if (!supabase) {
    console.error("Supabase client is not initialized in updateCalendarAssignmentAction. Check environment variables.");
    return { error: "Error de conexión con la base de datos. Por favor, inténtalo más tarde." };
  }
  try {
    const assignmentToUpdate: any = {
      fecha: formData.fecha,
      tipo_asignacion: formData.tipo_asignacion,
      nota: formData.nota,
      prenda_id: null,
      look_id: null,
    };
    if (formData.tipo_asignacion === 'prenda') {
      assignmentToUpdate.prenda_id = formData.referencia_id;
    } else {
      assignmentToUpdate.look_id = formData.referencia_id;
    }

    const { data, error } = await supabase
      .from('calendario_asignaciones')
      .update(assignmentToUpdate)
      .eq('id', assignmentId)
      .select(`
        *,
        prendas (*),
        looks (*, look_prendas(prendas(*)))
      `)
      .single();

    if (error) throw error;
    revalidatePath('/calendario');
    revalidatePath('/statistics');


    let fullAssignment: CalendarAssignment | undefined;
    if (data.tipo_asignacion === 'prenda' && data.prendas) {
        fullAssignment = {
            ...data,
            fecha: data.fecha,
            prenda: mapDbPrendaToClient(data.prendas),
            look: null, look_id: null
        } as PrendaCalendarAssignment;
    } else if (data.tipo_asignacion === 'look' && data.looks) {
        fullAssignment = {
            ...data,
            fecha: data.fecha,
            look: {
                ...data.looks,
                prendas: data.looks.look_prendas.map((lp: any) => mapDbPrendaToClient(lp.prendas))
            },
            prenda: null, prenda_id: null
        } as LookCalendarAssignment;
    }

    return { data: fullAssignment };

  } catch (error) {
    console.error('Error updating calendar assignment:', error);
    return { error: error instanceof Error ? error.message : 'No se pudo actualizar la asignación.' };
  }
}

export async function deleteCalendarAssignmentAction(
  assignmentId: number
): Promise<{ success?: boolean; error?: string }> {
  if (!supabase) {
    console.error("Supabase client is not initialized in deleteCalendarAssignmentAction. Check environment variables.");
    return { error: "Error de conexión con la base de datos. Por favor, inténtalo más tarde." };
  }
  try {
    const { error } = await supabase
      .from('calendario_asignaciones')
      .delete()
      .eq('id', assignmentId);

    if (error) throw error;
    revalidatePath('/calendario');
    revalidatePath('/statistics');
    return { success: true };
  } catch (error) {
    console.error('Error deleting calendar assignment:', error);
    return { error: error instanceof Error ? error.message : 'No se pudo eliminar la asignación.' };
  }
}

// --- Statistics Actions ---

export async function getStatisticsSummaryAction(): Promise<{ data?: StatisticsSummary; error?: string }> {
  if (!supabase) {
    console.error("Supabase client is not initialized for statistics. Check environment variables.");
    return { error: "Error de conexión con la base de datos." };
  }
  try {
    const [{ count: totalPrendas, error: prendasError }, { count: totalLooks, error: looksError }] = await Promise.all([
      supabase.from('prendas').select('*', { count: 'exact', head: true }).eq('is_archived', false),
      supabase.from('looks').select('*', { count: 'exact', head: true })
    ]);

    if (prendasError) throw prendasError;
    if (looksError) throw looksError;

    const { data: stylesData, error: stylesError } = await supabase
      .from('prendas')
      .select('estilo') 
      .eq('is_archived', false)
      .neq('estilo', ''); 

    if (stylesError) throw stylesError;
    
    const prendasPorEstiloCount = new Set(stylesData.map(s => s.estilo)).size;


    const currentMonth = new Date();
    const firstDayOfMonth = formatISO(startOfMonth(currentMonth), { representation: 'date' });
    const lastDayOfMonth = formatISO(endOfMonth(currentMonth), { representation: 'date' });

    const { count: looksUsadosEsteMes, error: looksUsadosError } = await supabase
      .from('calendario_asignaciones')
      .select('*', { count: 'exact', head: true })
      .eq('tipo_asignacion', 'look')
      .gte('fecha', firstDayOfMonth)
      .lte('fecha', lastDayOfMonth);

    if(looksUsadosError) console.warn("Error fetching looks used this month:", looksUsadosError.message);


    return {
      data: {
        totalPrendas: totalPrendas || 0,
        totalLooks: totalLooks || 0,
        prendasPorEstiloCount: prendasPorEstiloCount || 0,
        looksUsadosEsteMes: looksUsadosEsteMes || 0,
      }
    };
  } catch (error) {
    console.error('Error fetching statistics summary:', error);
    return { error: error instanceof Error ? error.message : 'Error al obtener el resumen de estadísticas.' };
  }
}


const PRENDA_COLOR_MAP: Record<string, string> = {
  'Rojo': 'hsl(0, 72%, 51%)',       // Red
  'Azul': 'hsl(217, 91%, 60%)',    // Blue
  'Verde': 'hsl(142, 71%, 45%)',   // Green
  'Amarillo': 'hsl(48, 96%, 53%)', // Yellow
  'Negro': 'hsl(0, 0%, 10%)',      // Dark Gray/Near Black for visibility
  'Blanco': 'hsl(0, 0%, 98%)',     // Off-white for visibility
  'Gris': 'hsl(215, 14%, 65%)',    // Gray
  'Marrón': 'hsl(30, 47%, 40%)',   // Brown
  'Naranja': 'hsl(25, 95%, 53%)',  // Orange
  'Violeta': 'hsl(271, 76%, 53%)', // Violet
  'Rosa': 'hsl(339, 82%, 60%)',    // Pink
  'Beige': 'hsl(39, 53%, 82%)',    // Beige
  'Celeste': 'hsl(197, 71%, 73%)', // Light Blue
  'Dorado': 'hsl(45, 89%, 55%)',   // Gold
  'Plateado': 'hsl(210, 17%, 79%)',// Silver
  'Cian': 'hsl(180, 70%, 50%)',    // Cyan
  'Magenta': 'hsl(300, 76%, 58%)',// Magenta
  'Lima': 'hsl(80, 61%, 60%)',     // Lime
  'Oliva': 'hsl(60, 39%, 41%)',    // Olive
  'Turquesa': 'hsl(174, 72%, 56%)',// Turquoise
  'Índigo': 'hsl(240, 50%, 45%)',   // Indigo
  'Salmón': 'hsl(6, 93%, 71%)',    // Salmon
  'Coral': 'hsl(16, 100%, 63%)',   // Coral
  'Lavanda': 'hsl(256, 60%, 75%)', // Lavender
  'Menta': 'hsl(150, 54%, 67%)',   // Mint
  'Caqui': 'hsl(39, 31%, 56%)',    // Khaki
  'Borgoña': 'hsl(348, 70%, 40%)', // Burgundy
  'Fucsia': 'hsl(327, 100%, 54%)', // Fuchsia
  // 'Cuadrille', 'Estampado', 'Multicolor', 'Otro' will use fallback chart colors
};


export async function getColorDistributionStatsAction(): Promise<{ data?: ColorFrequency[]; error?: string }> {
  if (!supabase) {
    console.error("Supabase client is not initialized for getColorDistributionStatsAction.");
    return { error: "Error de conexión con la base de datos." };
  }
  try {
    const { data: prendas, error } = await supabase
      .from('prendas')
      .select('color')
      .eq('is_archived', false)
      .not('color', 'is', null) // Ensure color is not null
      .neq('color', '');         // Ensure color is not an empty string if it's text based

    if (error) {
      console.error("Supabase error in getColorDistributionStatsAction fetching prendas:", error);
      throw error;
    }
    if (!prendas) {
      console.warn("No prendas data returned from Supabase in getColorDistributionStatsAction.");
      return { data: [] };
    }

    const colorCounts: Record<string, number> = {};
    prendas.forEach(p => {
      if (p.color) { 
        colorCounts[p.color] = (colorCounts[p.color] || 0) + 1;
      }
    });

    const chartColorsFallback = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];
    let fallbackIndex = 0;

    const colorFrequencyData: ColorFrequency[] = Object.entries(colorCounts)
      .filter(([, count]) => count > 0) 
      .map(([color, count]) => {
        let fill = PRENDA_COLOR_MAP[color];
        if (!fill) { 
          fill = chartColorsFallback[fallbackIndex % chartColorsFallback.length];
          fallbackIndex++;
        }
        // Ensure 'Blanco' has a visible border or slightly off-white color for charts if needed
        if (color === 'Blanco') { 
            // Using a very light gray for 'Blanco' so it's visible on white chart backgrounds
            // Or ensure your chart component adds a border to the 'Blanco' slice.
             fill = 'hsl(0, 0%, 95%)'; // Slightly off-white
        }
        return { color, count, fill };
      })
      .sort((a, b) => b.count - a.count); 

    return { data: colorFrequencyData };
  } catch (error) {
    console.error('Error fetching color distribution:', error);
    return { error: error instanceof Error ? error.message : 'Error al obtener la distribución de colores.' };
  }
}


export async function getStyleUsageStatsAction(): Promise<{ data?: StyleUsageStat[]; error?: string }> {
  if (!supabase) {
    console.error("Supabase client is not initialized for getStyleUsageStatsAction.");
    return { error: "Error de conexión con la base de datos." };
  }
  try {
    const { data: prendas, error } = await supabase
      .from('prendas')
      .select('estilo')
      .eq('is_archived', false)
      .not('estilo', 'is', null) // Ensure estilo is not null
      .neq('estilo', '');        // Ensure estilo is not an empty string

    if (error) {
        console.error("Supabase error in getStyleUsageStatsAction fetching prendas:", error);
        throw error;
    }
    if (!prendas) {
        console.warn("No prendas data returned from Supabase in getStyleUsageStatsAction.");
        return { data: [] };
    }

    const styleCounts: Record<string, number> = {};
    prendas.forEach(p => {
      if (p.estilo) {
        const styleKey = p.estilo.charAt(0).toUpperCase() + p.estilo.slice(1); 
        styleCounts[styleKey] = (styleCounts[styleKey] || 0) + 1;
      }
    });

    const chartColors = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];
    const styleUsageStats: StyleUsageStat[] = Object.entries(styleCounts)
      .filter(([, value]) => value > 0)
      .map(([name, value], index) => ({ name, value, fill: chartColors[index % chartColors.length] }))
      .sort((a, b) => b.value - a.value);

    return { data: styleUsageStats };
  } catch (error) {
    console.error('Error fetching style usage stats:', error);
    return { error: error instanceof Error ? error.message : 'Error al obtener estadísticas de uso de estilos.' };
  }
}

export async function getTimeActivityStatsAction(monthsAgo: number = 6): Promise<{ data?: TimeActivityStat[]; error?: string }> {
  if (!supabase) {
    console.error("Supabase client is not initialized for getTimeActivityStatsAction.");
    return { error: "Error de conexión con la base de datos." };
  }
  try {
    const today = new Date();
    const activityData: Record<string, number> = {};
    const monthLabels: string[] = [];

    for (let i = monthsAgo - 1; i >= 0; i--) {
      const targetMonth = subMonths(today, i);
      const monthKey = format(targetMonth, 'MMM yy', { locale: es });
      monthLabels.push(monthKey);
      activityData[monthKey] = 0;
    }

    const startDate = formatISO(startOfMonth(subMonths(today, monthsAgo -1)), { representation: 'date' });
    const endDate = formatISO(endOfMonth(today), { representation: 'date' });

    const { data, error } = await supabase
      .from('calendario_asignaciones')
      .select('fecha, tipo_asignacion') 
      .gte('fecha', startDate)
      .lte('fecha', endDate);

    if (error) {
        console.error("Supabase error in getTimeActivityStatsAction fetching assignments:", error);
        throw error;
    }
    if (!data) {
        console.warn("No assignments data returned from Supabase in getTimeActivityStatsAction.");
        return {data: []};
    }

    data.forEach(assignment => {
      const assignmentDate = parseISO(assignment.fecha); 
      const monthKey = format(assignmentDate, 'MMM yy', { locale: es });
      if (activityData.hasOwnProperty(monthKey)) {
        activityData[monthKey]++;
      }
    });

    const chartColors = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))', 'hsl(var(--destructive))'];
    const timeActivityStats: TimeActivityStat[] = monthLabels.map((label, index) => ({
      date: label,
      count: activityData[label] || 0,
      fill: chartColors[index % chartColors.length] 
    }));

    return { data: timeActivityStats };
  } catch (error) {
    console.error('Error fetching time activity stats:', error);
    return { error: error instanceof Error ? error.message : 'Error al obtener estadísticas de actividad en el tiempo.' };
  }
}

export async function getIntelligentInsightDataAction(): Promise<{data?: IntelligentInsightData; error?: string}> {
    if (!supabase) {
        console.error("Supabase client is not initialized for getIntelligentInsightDataAction.");
        return { error: "Error de conexión con la base de datos." };
    }
    try {
        const styleStatsResult = await getStyleUsageStatsAction();
        if (styleStatsResult.error || !styleStatsResult.data) {
            return { error: styleStatsResult.error || "No se pudieron obtener estadísticas de estilo." };
        }

        const prendasResult = await getPrendasAction();
        if(prendasResult.error || !prendasResult.data) {
            return { error: prendasResult.error || "No se pudieron obtener prendas."};
        }
        const activePrendas = prendasResult.data.filter(p => !p.is_archived && p.estilo);
        const totalPrendasConEstilo = activePrendas.length;

        let dominantStyle: { name: string; percentage: number } | undefined = undefined;

        if (totalPrendasConEstilo > 0 && styleStatsResult.data.length > 0) {
            const mostUsedStyle = styleStatsResult.data[0]; 
            if (mostUsedStyle.value > 0) { 
              const percentage = (mostUsedStyle.value / totalPrendasConEstilo) * 100;
              if (percentage > 50) { 
                  dominantStyle = { name: mostUsedStyle.name, percentage: Math.round(percentage) };
              }
            }
        }

        return { data: { dominantStyle } };

    } catch (error) {
        console.error('Error generating intelligent insight data:', error);
        return { error: error instanceof Error ? error.message : 'Error al generar la información inteligente.' };
    }
}

    