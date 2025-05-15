
'use server';

import { generateOutfitExplanation, type GenerateOutfitExplanationInput } from '@/ai/flows/generate-outfit-explanation';
import type { SuggestedOutfit, OutfitItem, Prenda } from '@/types';
import { supabase } from '@/lib/supabaseClient';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

interface GetOutfitSuggestionParams {
  temperature: [number, number];
  styleId: string;
  useClosetInfo: boolean;
}

// Helper function to shuffle an array (Fisher-Yates shuffle)
function shuffleArray<T>(array: T[]): T[] {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

// Helper to map DB record to client Prenda
// Ahora los nombres de columna de la BD (modelo, fechacompra) coinciden con los de Prenda
function mapDbPrendaToClient(dbRecord: any): Prenda {
  return {
    id: Number(dbRecord.id),
    created_at: String(dbRecord.created_at),
    nombre: dbRecord.nombre,
    tipo: dbRecord.tipo,
    color: dbRecord.color,
    modelo: dbRecord.modelo, // Directamente desde la BD
    temporada: dbRecord.temporada,
    fechacompra: dbRecord.fechacompra, // Directamente desde la BD
    imagen_url: dbRecord.imagen_url,
    temperatura_min: dbRecord.temperatura_min,
    temperatura_max: dbRecord.temperatura_max,
    estilo: dbRecord.estilo,
  };
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
    const allClientPrendas = prendasResult.data;

    if (allClientPrendas.length === 0) {
      return { error: "Your closet is empty. Please add some clothing items first." };
    }

    const [minUserTemp, maxUserTemp] = temperature;

    const filteredPrendas = allClientPrendas.filter(p => {
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
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred while generating suggestion.';
    return { error: `Failed to get suggestion: ${errorMessage}` };
  }
}

// Schema for form data validation
const PrendaFormSchema = z.object({
  nombre: z.string().min(1, "El nombre es requerido."),
  tipo: z.string().min(1, "El tipo es requerido."),
  color: z.string().min(1, "El color es requerido."),
  modelo: z.string().min(1, "El modelo es requerido."),
  temporada: z.string().min(1, "La temporada es requerida."),
  fechacompra: z.string().min(1, "La fecha de compra es requerida."),
  imagen_url: z.string().url("Debe ser una URL válida.").or(z.literal("")).optional(),
  temperatura_min: z.coerce.number().optional().nullable(),
  temperatura_max: z.coerce.number().optional().nullable(),
  estilo: z.string().min(1, "El estilo es requerido."),
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
  
  const { nombre, tipo, color, modelo, temporada, fechacompra, imagen_url, temperatura_min, temperatura_max, estilo } = validatedFields.data;

  // Item to be inserted into DB - no más mapeo necesario, los nombres coinciden
  const itemToInsertToDb = {
    nombre,
    tipo,
    color,
    modelo, // Nombre de columna en BD es 'modelo'
    temporada,
    fechacompra, // Nombre de columna en BD es 'fechacompra'
    imagen_url: imagen_url || `https://placehold.co/200x300.png?text=${encodeURIComponent(nombre)}`,
    temperatura_min,
    temperatura_max,
    estilo,
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

  const { nombre, tipo, color, modelo, temporada, fechacompra, imagen_url, temperatura_min, temperatura_max, estilo } = validatedFields.data;
  
  // Item to be updated in DB - no más mapeo necesario
  const itemToUpdateInDb = {
    nombre,
    tipo,
    color,
    modelo, // Nombre de columna en BD es 'modelo'
    temporada,
    fechacompra, // Nombre de columna en BD es 'fechacompra'
    imagen_url: imagen_url || `https://placehold.co/200x300.png?text=${encodeURIComponent(nombre)}`,
    temperatura_min,
    temperatura_max,
    estilo,
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
    revalidatePath('/'); 
    return { success: true };
  } catch (error) {
    console.error('Error deleting prenda:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred while deleting the item.';
    return { error: errorMessage };
  }
}

