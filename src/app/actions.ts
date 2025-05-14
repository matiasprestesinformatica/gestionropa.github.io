
'use server';

import { generateOutfitExplanation, type GenerateOutfitExplanationInput } from '@/ai/flows/generate-outfit-explanation';
import type { SuggestedOutfit, OutfitItem, ClothingItem } from '@/types';
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

const ClothingItemSchema = z.object({
  name: z.string().min(1, "El nombre es requerido."),
  type: z.string().min(1, "El tipo es requerido."),
  color: z.string().min(1, "El color es requerido."),
  size: z.string().min(1, "La talla es requerida."),
  season: z.string().min(1, "La temporada es requerida."),
  occasion: z.string().min(1, "La ocasión es requerida."),
  image_url: z.string().url("Debe ser una URL válida.").or(z.literal("")).optional(),
  min_temp: z.coerce.number().optional().nullable(),
  max_temp: z.coerce.number().optional().nullable(),
  style: z.string().min(1, "El estilo es requerido."),
});

export async function addClothingItemAction(formData: FormData): Promise<{ data?: ClothingItem; error?: string; validationErrors?: z.ZodIssue[] }> {
  if (!supabase) return { error: "Supabase client not initialized." };

  const rawFormData = Object.fromEntries(formData.entries());
  const validatedFields = ClothingItemSchema.safeParse(rawFormData);

  if (!validatedFields.success) {
    return {
      validationErrors: validatedFields.error.issues,
      error: "Validation failed."
    };
  }
  
  const { name, type, color, size, season, occasion, image_url, min_temp, max_temp, style } = validatedFields.data;

  const newItem = {
    name,
    type,
    color,
    size,
    season,
    occasion,
    image_url: image_url || `https://placehold.co/200x300.png?text=${encodeURIComponent(name)}`,
    min_temp,
    max_temp,
    style,
    // user_id: session?.user?.id // Add this if using auth
  };

  try {
    const { data, error } = await supabase
      .from('clothing_items')
      .insert([newItem])
      .select()
      .single(); // Assuming you want the inserted item back

    if (error) throw error;

    revalidatePath('/closet');
    return { data: data as ClothingItem };
  } catch (error) {
    console.error('Error adding clothing item:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred while adding the item.';
    return { error: errorMessage };
  }
}

export async function getClothingItemsAction(): Promise<{ data?: ClothingItem[]; error?: string }> {
  if (!supabase) return { error: "Supabase client not initialized.", data: [] };
  
  try {
    const { data, error } = await supabase
      .from('clothing_items')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { data: data as ClothingItem[] };
  } catch (error) {
    console.error('Error fetching clothing items:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred while fetching items.';
    return { error: errorMessage, data: [] };
  }
}

export async function updateClothingItemAction(itemId: string, formData: FormData): Promise<{ data?: ClothingItem; error?: string; validationErrors?: z.ZodIssue[] }> {
  if (!supabase) return { error: "Supabase client not initialized." };

  const rawFormData = Object.fromEntries(formData.entries());
  const validatedFields = ClothingItemSchema.safeParse(rawFormData);

  if (!validatedFields.success) {
    return {
      validationErrors: validatedFields.error.issues,
      error: "Validation failed."
    };
  }

  const { name, type, color, size, season, occasion, image_url, min_temp, max_temp, style } = validatedFields.data;
  
  const updatedItem = {
    name,
    type,
    color,
    size,
    season,
    occasion,
    image_url: image_url || `https://placehold.co/200x300.png?text=${encodeURIComponent(name)}`,
    min_temp,
    max_temp,
    style,
  };

  try {
    const { data, error } = await supabase
      .from('clothing_items')
      .update(updatedItem)
      .eq('id', itemId)
      .select()
      .single();

    if (error) throw error;

    revalidatePath('/closet');
    return { data: data as ClothingItem };
  } catch (error) {
    console.error('Error updating clothing item:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred while updating the item.';
    return { error: errorMessage };
  }
}

export async function deleteClothingItemAction(itemId: string): Promise<{ success?: boolean; error?: string }> {
  if (!supabase) return { error: "Supabase client not initialized." };

  try {
    const { error } = await supabase
      .from('clothing_items')
      .delete()
      .eq('id', itemId);

    if (error) throw error;

    revalidatePath('/closet');
    return { success: true };
  } catch (error) {
    console.error('Error deleting clothing item:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred while deleting the item.';
    return { error: errorMessage };
  }
}
