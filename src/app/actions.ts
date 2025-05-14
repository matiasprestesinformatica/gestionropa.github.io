
'use server';

import { generateOutfitExplanation, type GenerateOutfitExplanationInput } from '@/ai/flows/generate-outfit-explanation';
import type { SuggestedOutfit, OutfitItem, Prenda } from '@/types'; // Updated ClothingItem to Prenda
import { placeholderOutfits } from '@/types';
import { supabase } from '@/lib/supabaseClient';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

interface GetOutfitSuggestionParams {
  temperature: [number, number];
  styleId: string;
  useClosetInfo: boolean;
}

export async function getAISuggestionAction(
  params: GetOutfitSuggestionParams
): Promise<SuggestedOutfit | { error: string }> {
  try {
    const { temperature, styleId, useClosetInfo } = params;

    const temperatureRangeString = `${temperature[0]}-${temperature[1]} degrees Celsius`;
    
    const selectedOutfitItems = placeholderOutfits[styleId] || placeholderOutfits['casual']; // Default to casual if styleId is unknown
    
    const outfitDescription = selectedOutfitItems.map(item => item.name).join(', ');

    const aiInput: GenerateOutfitExplanationInput = {
      temperatureRange: temperatureRangeString,
      selectedStyle: styleId.charAt(0).toUpperCase() + styleId.slice(1), // Capitalize styleId for the AI
      outfitDescription: outfitDescription,
      userClosetInformationNeeded: useClosetInfo,
    };

    const aiOutput = await generateOutfitExplanation(aiInput);

    return {
      items: selectedOutfitItems,
      explanation: aiOutput.explanation,
    };
  } catch (error) {
    console.error('Error generating outfit explanation:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred.';
    return { error: `Failed to get suggestion: ${errorMessage}` };
  }
}

// --- Closet Management Actions ---
// Updated Zod schema to use Spanish field names matching the 'prendas' table
const PrendaSchema = z.object({
  nombre: z.string().min(1, "El nombre es requerido."),
  tipo: z.string().min(1, "El tipo es requerido."),
  color: z.string().min(1, "El color es requerido."),
  talla: z.string().min(1, "La talla es requerida."),
  temporada: z.string().min(1, "La temporada es requerida."),
  ocasion: z.string().min(1, "La ocasión es requerida."),
  imagen_url: z.string().url("Debe ser una URL válida.").or(z.literal("")).optional(),
  temperatura_min: z.coerce.number().optional().nullable(),
  temperatura_max: z.coerce.number().optional().nullable(),
  estilo: z.string().min(1, "El estilo es requerido."),
});

export async function addPrendaAction(formData: FormData): Promise<{ data?: Prenda; error?: string; validationErrors?: z.ZodIssue[] }> {
  if (!supabase) return { error: "Supabase client not initialized." };

  const rawFormData = Object.fromEntries(formData.entries());
  const validatedFields = PrendaSchema.safeParse(rawFormData);

  if (!validatedFields.success) {
    return {
      validationErrors: validatedFields.error.issues,
      error: "Validation failed."
    };
  }
  
  const { nombre, tipo, color, talla, temporada, ocasion, imagen_url, temperatura_min, temperatura_max, estilo } = validatedFields.data;

  const newItem = {
    nombre,
    tipo,
    color,
    talla,
    temporada,
    ocasion,
    imagen_url: imagen_url || `https://placehold.co/200x300.png?text=${encodeURIComponent(nombre)}`,
    temperatura_min,
    temperatura_max,
    estilo,
    // user_id: session?.user?.id // Add this if using auth
  };

  try {
    const { data, error } = await supabase
      .from('prendas') // Changed table name to 'prendas'
      .insert([newItem])
      .select()
      .single();

    if (error) throw error;

    revalidatePath('/closet');
    return { data: data as Prenda };
  } catch (error) {
    console.error('Error adding prenda:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred while adding the item.';
    return { error: errorMessage };
  }
}

export async function getPrendasAction(): Promise<{ data?: Prenda[]; error?: string }> {
  if (!supabase) return { error: "Supabase client not initialized.", data: [] };
  
  try {
    const { data, error } = await supabase
      .from('prendas') // Changed table name to 'prendas'
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { data: data as Prenda[] };
  } catch (error) {
    console.error('Error fetching prendas:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred while fetching items.';
    return { error: errorMessage, data: [] };
  }
}

export async function updatePrendaAction(itemId: string, formData: FormData): Promise<{ data?: Prenda; error?: string; validationErrors?: z.ZodIssue[] }> {
  if (!supabase) return { error: "Supabase client not initialized." };

  const rawFormData = Object.fromEntries(formData.entries());
  const validatedFields = PrendaSchema.safeParse(rawFormData);

  if (!validatedFields.success) {
    return {
      validationErrors: validatedFields.error.issues,
      error: "Validation failed."
    };
  }

  const { nombre, tipo, color, talla, temporada, ocasion, imagen_url, temperatura_min, temperatura_max, estilo } = validatedFields.data;
  
  const updatedItem = {
    nombre,
    tipo,
    color,
    talla,
    temporada,
    ocasion,
    imagen_url: imagen_url || `https://placehold.co/200x300.png?text=${encodeURIComponent(nombre)}`,
    temperatura_min,
    temperatura_max,
    estilo,
  };

  try {
    const { data, error } = await supabase
      .from('prendas') // Changed table name to 'prendas'
      .update(updatedItem)
      .eq('id', itemId)
      .select()
      .single();

    if (error) throw error;

    revalidatePath('/closet');
    return { data: data as Prenda };
  } catch (error) {
    console.error('Error updating prenda:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred while updating the item.';
    return { error: errorMessage };
  }
}

export async function deletePrendaAction(itemId: string): Promise<{ success?: boolean; error?: string }> {
  if (!supabase) return { error: "Supabase client not initialized." };

  try {
    const { error } = await supabase
      .from('prendas') // Changed table name to 'prendas'
      .delete()
      .eq('id', itemId);

    if (error) throw error;

    revalidatePath('/closet');
    return { success: true };
  } catch (error) {
    console.error('Error deleting prenda:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred while deleting the item.';
    return { error: errorMessage };
  }
}
