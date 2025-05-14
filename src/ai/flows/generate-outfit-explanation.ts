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
        return `Detailed information about user closet is not available. Faking closet information containing ${input.style} items.`;
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

  {% if userClosetInformationNeeded %}The user has indicated that information about their closet is relevant, use the getUserClosetInformation tool.{% endif %}

  Explain why this outfit is suitable, considering the temperature, selected style, and user closet (if relevant).  Be concise but informative.
  `,
});

const generateOutfitExplanationFlow = ai.defineFlow(
  {
    name: 'generateOutfitExplanationFlow',
    inputSchema: GenerateOutfitExplanationInputSchema,
    outputSchema: GenerateOutfitExplanationOutputSchema,
  },
  async input => {
    let promptInput = input;
    if (input.userClosetInformationNeeded) {
      const closetInfo = await getUserClosetInformation({
        style: input.selectedStyle,
      });
      promptInput = {...input, closetInfo };
    }
    const { output } = await prompt(promptInput);
    return output!;
  }
);
