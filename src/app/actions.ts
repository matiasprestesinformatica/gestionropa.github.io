'use server';

import { generateOutfitExplanation, type GenerateOutfitExplanationInput } from '@/ai/flows/generate-outfit-explanation';
import type { SuggestedOutfit, OutfitItem } from '@/types';
import { placeholderOutfits } from '@/types';

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
    // Check if error is an instance of Error and has a message property
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred.';
    return { error: `Failed to get suggestion: ${errorMessage}` };
  }
}
