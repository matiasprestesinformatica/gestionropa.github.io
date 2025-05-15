
'use server';

import { generateOutfitExplanation, type GenerateOutfitExplanationInput } from '@/ai/flows/generate-outfit-explanation';
import type { SuggestedOutfit, OutfitItem, Prenda, Look, LookFormData, CalendarAssignment, CalendarAssignmentFormData, PrendaCalendarAssignment, LookCalendarAssignment } from '@/types';
import { supabase } from '@/lib/supabaseClient';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { format, parseISO, isValid, startOfMonth, endOfMonth, formatISO } from 'date-fns';
import { mapDbPrendaToClient } from '@/lib/dataMappers'; // Import from new location

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
  try {
    const { temperature, styleId, useClosetInfo } = params;

    if (!supabase) {
      return { error: "Supabase client not initialized. Cannot fetch closet items." };
    }

    const prendasResult = await getPrendasAction(); 
    if (prendasResult.error || !prendasResult.data) {
      return { error: prendasResult.error || "Could not fetch items from your closet." };
    }
    
    const activeClientPrendas = prendasResult.data.filter(p => !p.is_archived);


    if (activeClientPrendas.length === 0) {
      return { error: "Your closet is empty or has no active items. Please add some clothing items first." };
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
      return { error: "No suitable items found in your closet for the selected style and temperature." };
    }

    const shuffledPrendas = shuffleArray(filteredPrendas);
    const outfitItemCount = Math.min(shuffledPrendas.length, 3); 
    const selectedClientItems = shuffledPrendas.slice(0, outfitItemCount);

    if (selectedClientItems.length === 0) {
         return { error: "Could not select any items for an outfit from your closet matching the criteria." };
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
      // ocasion: "a typical day" // Example if you add ocasion to AI input
    };

    const aiOutput = await generateOutfitExplanation(aiInput);

    return {
      items: outfitItems,
      explanation: aiOutput.explanation,
    };
  } catch (error) {
    console.error('Error generating outfit suggestion:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred while generating suggestion.';
    return { error: `Failed to get suggestion: ${errorMessage}` };
  }
}

const PrendaFormSchema = z.object({
  nombre: z.string().min(1, "El nombre es requerido."),
  tipo: z.string().min(1, "El tipo es requerido."),
  color: z.string().min(1, "El color es requerido."),
  modelo: z.string().min(1, "El modelo es requerido."),
  temporada: z.string().min(1, "La temporada es requerida."),
  fechacompra: z.string().refine((val) => val === '' || (val && isValid(parseISO(val))), { 
    message: "La fecha de compra debe ser válida (YYYY-MM-DD) o estar vacía.",
  }).optional().or(z.literal('')), 
  imagen_url: z.string().url("Debe ser una URL válida.").or(z.literal("")).optional(),
  temperatura_min: z.coerce.number().optional().nullable(),
  temperatura_max: z.coerce.number().optional().nullable(),
  estilo: z.string().min(1, "El estilo es requerido."),
  is_archived: z.preprocess(val => val === 'on' || val === 'true' || val === true, z.boolean()).optional().default(false),
});


export async function addPrendaAction(formData: FormData): Promise<{ data?: Prenda; error?: string; validationErrors?: z.ZodIssue[] }> {
  if (!supabase) return { error: "Supabase client not initialized." };

  const rawFormData = Object.fromEntries(formData.entries());
  const validatedFields = PrendaFormSchema.safeParse(rawFormData);

  if (!validatedFields.success) {
    return {
      validationErrors: validatedFields.error.issues,
      error: "Validation failed."
    };
  }
  
  const { nombre, tipo, color, modelo, temporada, fechacompra, imagen_url, temperatura_min, temperatura_max, estilo, is_archived } = validatedFields.data;

  const itemToInsertToDb = {
    nombre,
    tipo,
    color,
    modelo, 
    temporada,
    fechacompra: fechacompra || null, // Store as YYYY-MM-DD string or null
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
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred while adding the item.';
    return { error: errorMessage };
  }
}

export async function getPrendasAction(): Promise<{ data?: Prenda[]; error?: string }> {
  if (!supabase) return { error: "Supabase client not initialized.", data: [] };
  
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
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred while fetching items.';
    return { error: errorMessage, data: [] };
  }
}

export async function updatePrendaAction(itemId: number, formData: FormData): Promise<{ data?: Prenda; error?: string; validationErrors?: z.ZodIssue[] }> {
  if (!supabase) return { error: "Supabase client not initialized." };

  const rawFormData = Object.fromEntries(formData.entries());
  const validatedFields = PrendaFormSchema.safeParse(rawFormData);

  if (!validatedFields.success) {
    return {
      validationErrors: validatedFields.error.issues,
      error: "Validation failed."
    };
  }

  const { nombre, tipo, color, modelo, temporada, fechacompra, imagen_url, temperatura_min, temperatura_max, estilo, is_archived } = validatedFields.data;
  
  const itemToUpdateInDb = {
    nombre,
    tipo,
    color,
    modelo, 
    temporada,
    fechacompra: fechacompra || null, // Store as YYYY-MM-DD string or null
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
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred while updating the item.';
    return { error: errorMessage };
  }
}

export async function deletePrendaAction(itemId: number): Promise<{ success?: boolean; error?: string }> {
  if (!supabase) return { error: "Supabase client not initialized." };

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
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred while deleting the item.';
    return { error: errorMessage };
  }
}

// --- Looks Actions ---

export async function getLooksAction(): Promise<{ data?: Look[]; error?: string }> {
  if (!supabase) return { error: "Supabase client not initialized.", data: [] };
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
      // @ts-ignore 
      prendas: look.look_prendas.map(lp => mapDbPrendaToClient(lp.prendas)) 
    }));
    
    return { data: formattedLooks };
  } catch (error) {
    console.error('Error fetching looks:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred while fetching looks.';
    return { error: errorMessage, data: [] };
  }
}

export async function getLookByIdAction(lookId: number): Promise<{ data?: Look; error?: string }> {
  if (!supabase) return { error: "Supabase client not initialized." };
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
    if (!lookData) return { error: "Look not found." };
    
    const formattedLook: Look = {
        ...lookData,
        // @ts-ignore
        prendas: lookData.look_prendas.map(lp => mapDbPrendaToClient(lp.prendas))
    };
    return { data: formattedLook };

  } catch (error) {
    console.error('Error fetching look by ID:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred.';
    return { error: errorMessage };
  }
}


export async function addLookAction(formData: LookFormData): Promise<{ data?: Look; error?: string; validationErrors?: z.ZodIssue[] }> {
  if (!supabase) return { error: "Supabase client not initialized." };

  if (!formData.nombre || formData.prenda_ids.length === 0) {
    return { error: "Nombre del look y al menos una prenda son requeridos." };
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
    if (!lookData) throw new Error("Failed to create look.");

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
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred while adding the look.';
    return { error: errorMessage };
  }
}

export async function updateLookAction(lookId: number, formData: LookFormData): Promise<{ data?: Look; error?: string; validationErrors?: z.ZodIssue[] }> {
  if (!supabase) return { error: "Supabase client not initialized." };

  if (!formData.nombre || formData.prenda_ids.length === 0) {
    return { error: "Nombre del look y al menos una prenda son requeridos." };
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
    if (!updatedLookData) throw new Error("Failed to update look.");

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
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred while updating the look.';
    return { error: errorMessage };
  }
}

export async function deleteLookAction(lookId: number): Promise<{ success?: boolean; error?: string }> {
  if (!supabase) return { error: "Supabase client not initialized." };
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
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred while deleting the look.';
    return { error: errorMessage };
  }
}

// --- Calendar Assignments Actions ---

export async function getCalendarAssignmentsAction(
  currentMonthDate: Date
): Promise<{ data?: CalendarAssignment[]; error?: string }> {
  if (!supabase) return { error: "Supabase client not initialized." };

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
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred.';
    return { error: errorMessage };
  }
}

export async function addCalendarAssignmentAction(
  formData: CalendarAssignmentFormData
): Promise<{ data?: CalendarAssignment; error?: string }> {
  if (!supabase) return { error: "Supabase client not initialized." };
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
    return { error: error instanceof Error ? error.message : 'Failed to add assignment.' };
  }
}

export async function updateCalendarAssignmentAction(
  assignmentId: number,
  formData: CalendarAssignmentFormData
): Promise<{ data?: CalendarAssignment; error?: string }> {
  if (!supabase) return { error: "Supabase client not initialized." };
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
    return { error: error instanceof Error ? error.message : 'Failed to update assignment.' };
  }
}

export async function deleteCalendarAssignmentAction(
  assignmentId: number
): Promise<{ success?: boolean; error?: string }> {
  if (!supabase) return { error: "Supabase client not initialized." };
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
    return { error: error instanceof Error ? error.message : 'Failed to delete assignment.' };
  }
}
