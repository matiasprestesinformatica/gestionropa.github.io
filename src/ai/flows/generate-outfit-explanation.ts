
// use server'

/**
 * @fileOverview Generates an explanation for a suggested outfit based on temperature and style.
 *
 * - generateOutfitExplanation - A function that generates the outfit explanation.
 * - GenerateOutfitExplanationInput - The input type for the generateOutfitExplanation function.
 * - GenerateOutfitExplanationOutput - The return type for the generateOutfitExplanation function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateOutfitExplanationInputSchema = z.object({
  temperatureRange: z.string().describe('The temperature range for which the outfit is suggested (e.g., "15-25 degrees Celsius").'),
  selectedStyle: z.string().describe('The user selected style (e.g., "Casual", "Formal", "Bohemian").'),
  outfitDescription: z.string().describe('A description of the suggested outfit (e.g., "Jeans, t-shirt, and sneakers").'),
  userClosetInformationNeeded: z.boolean().describe('Whether or not information about the user\u0027s closet is needed to make the explanation more relevant.')
});
export type GenerateOutfitExplanationInput = z.infer<typeof GenerateOutfitExplanationInputSchema>;

const GenerateOutfitExplanationOutputSchema = z.object({
  explanation: z.string().describe('The explanation for the suggested outfit, considering temperature, style, and optionally user closet information.'),
});
export type GenerateOutfitExplanationOutput = z.infer<typeof GenerateOutfitExplanationOutputSchema>;


const getUserClosetInformation = ai.defineTool(
    {
        name: 'getUserClosetInformation',
        description: 'Retrieves information about the user\u0027s closet to personalize the outfit explanation.',
        inputSchema: z.object({
            style: z.string().describe('The style of clothing to filter the closet by.'),
        }),
        outputSchema: z.string().describe('A description of the relevant items in the user\u0027s closet.'),
    },
    async (input) => {
        // TODO: Implement the actual retrieval of user closet information here.
        // This is a placeholder. In a real application, this would connect to
        // a database or service to fetch the user's closet data.
        // For now, the outfit is already selected from the closet, so this tool's
        // current implementation might provide redundant or conflicting info if not updated.
        return `User's closet items for style ${input.style} were considered in the suggestion.`;
    }
);

export async function generateOutfitExplanation(input: GenerateOutfitExplanationInput): Promise<GenerateOutfitExplanationOutput> {
  return generateOutfitExplanationFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateOutfitExplanationPrompt',
  input: { schema: GenerateOutfitExplanationInputSchema },
  output: { schema: GenerateOutfitExplanationOutputSchema },
  tools: [getUserClosetInformation],
  prompt: `You are an AI fashion assistant that generates explanations for suggested outfits.

The outfit is: {{{outfitDescription}}}
The temperature range is: {{{temperatureRange}}}
The selected style is: {{{selectedStyle}}}

{{#if userClosetInformationNeeded}}
The user has indicated that information about their closet is relevant. Use the getUserClosetInformation tool if you need specific details about other items in their closet for the given style to enrich your explanation. The provided outfitDescription already consists of items from the user's closet.
{{/if}}

Explain why this outfit is suitable, considering the temperature, selected style, and the fact that items are from the user's closet (if {{{userClosetInformationNeeded}}} is true). Be concise but informative.
  `,
});

const generateOutfitExplanationFlow = ai.defineFlow(
  {
    name: 'generateOutfitExplanationFlow',
    inputSchema: GenerateOutfitExplanationInputSchema,
    outputSchema: GenerateOutfitExplanationOutputSchema,
  },
  async input => {
    // The prompt itself will decide if it needs to call the tool based on its instructions
    // and the 'tools' array provided in its definition.
    // The 'input.userClosetInformationNeeded' can guide the LLM's decision.
    // No need to manually call the tool here if it's part of the prompt's toolset.
    const { output } = await prompt(input);
    return output!;
  }
);
