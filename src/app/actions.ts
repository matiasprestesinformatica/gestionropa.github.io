
'use server';

import { generateOutfitExplanation, type GenerateOutfitExplanationInput } from '@/ai/flows/generate-outfit-explanation';
import type { SuggestedOutfit, OutfitItem, Prenda, Look, LookFormData, CalendarAssignment, CalendarAssignmentFormData, PrendaCalendarAssignment, LookCalendarAssignment } from '@/types';
import { supabase } from '@/lib/supabaseClient';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { format, parseISO, isValid, startOfMonth, endOfMonth, formatISO } from 'date-fns';
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
    const outfitItemCount = Math.min(shuffledPrendas.length, 3);
    const selectedClientItems = shuffledPrendas.slice(0, outfitItemCount);

    if (selectedClientItems.length === 0) {
         return { error: "No se pudieron seleccionar artículos para un atuendo de tu armario que coincidan con los criterios." };
    }

    const outfitItems: OutfitItem[] = selectedClientItems.map(p => ({
      id: p.id.toString(),
      name: p.nombre,
      imageUrl: p.imagen_url || `https://placehold.co/300x400.png?text=${encodeURIComponent(p.nombre)}`,
      category: p.tipo,
      color: p.color,
      aiHint: `${p.tipo.toLowerCase()} ${p.color ? p.color.toLowerCase() : ''}`.trim().substring(0,50) || p.nombre.toLowerCase(),
    }));

    const outfitDescription = outfitItems.map(item => item.name).join(', ');
    const temperatureRangeString = `${temperature[0]}-${temperature[1]} degrees Celsius`;

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
  tipo: z.string().min(1, "El tipo es requerido."),
  color: z.string().min(1, "El color es requerido."),
  modelo: z.string().min(1, "El modelo es requerido."),
  temporada: z.string().min(1, "La temporada es requerida."),
  fechacompra: z.string().refine((val) => {
    if (val === '' || val === null || val === undefined) return true; // Allow empty or null
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
      .insert([itemToInsertToDb])
      .select()
      .single();

    if (error) throw error;

    revalidatePath('/closet');
    revalidatePath('/dashboard');
    revalidatePath('/');
    revalidatePath('/archivo');
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
    revalidatePath('/dashboard');
    revalidatePath('/');
    revalidatePath('/archivo');
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
    revalidatePath('/dashboard');
    revalidatePath('/');
    revalidatePath('/archivo');
    revalidatePath('/looks');
    revalidatePath('/calendario');
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
      return { ...assignment, fecha: assignment.fecha };
    });
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
    return { success: true };
  } catch (error) {
    console.error('Error deleting calendar assignment:', error);
    return { error: error instanceof Error ? error.message : 'No se pudo eliminar la asignación.' };
  }
}
