
'use server';

/**
 * @fileOverview Generates an explanation for a suggested outfit based on temperature, style, occasion, and user's closet.
 *
 * - generateOutfitExplanation - A function that generates the outfit explanation.
 * - GenerateOutfitExplanationInput - The input type for the generateOutfitExplanation function.
 * - GenerateOutfitExplanationOutput - The return type for the generateOutfitExplanation function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { supabase } from '@/lib/supabaseClient'; // Import supabase client
import { mapDbPrendaToClient } from '@/lib/dataMappers'; // Import mapper
import type { Prenda } from '@/types';

const GenerateOutfitExplanationInputSchema = z.object({
  temperatureRange: z.string().describe('The temperature range for which the outfit is suggested (e.g., "15-25 degrees Celsius").'),
  selectedStyle: z.string().describe('The user selected style (e.g., "Casual", "Formal", "Bohemian").'),
  outfitDescription: z.string().describe('A description of the suggested outfit (e.g., "Jeans, t-shirt, and sneakers"). This outfit is already selected from the user\'s closet.'),
  userClosetInformationNeeded: z.boolean().describe('Whether information about other items in the user\'s closet should be considered to enrich the explanation.'),
  ocasion: z.string().optional().describe('The occasion for which the outfit is suggested (e.g., "a casual day out", "a business meeting").'),
  previewImageUrl: z.string().url().optional().describe('An optional URL of an image preview of the suggested outfit.')
});
export type GenerateOutfitExplanationInput = z.infer<typeof GenerateOutfitExplanationInputSchema>;

const GenerateOutfitExplanationOutputSchema = z.object({
  explanation: z.string().describe('The explanation for the suggested outfit, considering temperature, style, occasion, and optionally user closet information.'),
});
export type GenerateOutfitExplanationOutput = z.infer<typeof GenerateOutfitExplanationOutputSchema>;


const GetUserClosetInformationToolInputSchema = z.object({
  style: z.string().describe("The style of clothing to filter the closet by."),
  temperatureRange: z.string().describe("The current temperature range, e.g., '15-25 degrees Celsius', to help filter relevant items."),
});

const GetUserClosetInformationToolOutputSchema = z.object({
  closetSummary: z.string().describe("A summary of relevant items in the user's closet for the given style and temperature range. E.g., 'User has several casual tops and jeans suitable for this weather.' or 'No specific complementary items were identified for this exact context, but the user has a diverse wardrobe.'"),
});

const getUserClosetInformation = ai.defineTool(
  {
    name: 'getUserClosetInformation',
    description: "Retrieves a summary of the user's closet items matching a given style and temperature range, to help personalize outfit explanations. This tool focuses on *other* items in the closet that might complement or show versatility with the *already suggested* outfit.",
    inputSchema: GetUserClosetInformationToolInputSchema,
    outputSchema: GetUserClosetInformationToolOutputSchema,
  },
  async (input) => {
    if (!supabase) {
      return { closetSummary: "Could not access closet information due to a database connection issue." };
    }
    try {
      const { data: dbData, error: dbError } = await supabase
        .from('prendas')
        .select('*')
        .eq('estilo', input.style.toLowerCase()) // Filter by style
        .filter('is_archived', 'is', false); // Exclude archived items
        
      if (dbError) {
        console.error("Supabase error fetching prendas for tool:", dbError);
        return { closetSummary: "Could not retrieve closet information at this time due to a database error." };
      }

      const allPrendas: Prenda[] = dbData.map(mapDbPrendaToClient);

      if (allPrendas.length === 0) {
        return { closetSummary: `The user's closet has no items matching the ${input.style} style or they are all archived.` };
      }

      const tempMatch = input.temperatureRange.match(/(-?\d+)\s*-\s*(-?\d+)/);
      let minTemp: number | null = null;
      let maxTemp: number | null = null;
      if (tempMatch) {
        minTemp = parseInt(tempMatch[1], 10);
        maxTemp = parseInt(tempMatch[2], 10);
      }

      const relevantPrendas = allPrendas.filter(p => {
        let tempCondition = true;
        if (minTemp !== null && maxTemp !== null && typeof p.temperatura_min === 'number' && typeof p.temperatura_max === 'number') {
          tempCondition = 
            p.temperatura_min <= maxTemp &&
            p.temperatura_max >= minTemp;
        }
        return tempCondition; // Style is already filtered by DB query
      });

      if (relevantPrendas.length === 0) {
        return { closetSummary: `No specific items found in the user's closet that closely match the ${input.style} style for the ${input.temperatureRange} range, beyond the items already suggested.` };
      }

      const typeCounts: Record<string, number> = {};
      relevantPrendas.forEach(p => {
        typeCounts[p.tipo] = (typeCounts[p.tipo] || 0) + 1;
      });

      const summaryParts: string[] = [];
      for (const [type, count] of Object.entries(typeCounts)) {
        if (count > 1) {
          summaryParts.push(`varias ${type.toLowerCase()}s`);
        } else {
          summaryParts.push(`algunas ${type.toLowerCase()}s`);
        }
      }
      
      if (summaryParts.length === 0) {
         return { closetSummary: `The user has items in the ${input.style} style suitable for various conditions, complementing the current suggestion.`};
      }

      return { closetSummary: `For the ${input.style} style and temperature range of ${input.temperatureRange}, the user's closet also includes ${summaryParts.join(', y ')}. This suggests the suggested outfit can be well integrated.` };

    } catch (error) {
      console.error("Error in getUserClosetInformation tool:", error);
      return { closetSummary: "An error occurred while trying to access closet information." };
    }
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
  prompt: `Eres un asistente de moda IA amigable y experto. Tu tarea es generar una explicación cálida, útil y personalizada para el siguiente atuendo sugerido.
El atuendo ya ha sido seleccionado del armario del usuario.

Detalles del Atuendo:
- Descripción del Atuendo: {{{outfitDescription}}}
- Rango de Temperatura: {{{temperatureRange}}}
- Estilo Seleccionado: {{{selectedStyle}}}
{{#if ocasion}}
- Ocasión: {{{ocasion}}}
{{/if}}
{{#if previewImageUrl}}
- Imagen de Vista Previa: {{media url=previewImageUrl}} (Considera elementos visuales de esta imagen si es relevante, como colores o tipos de prendas específicas de la descripción).
{{/if}}

Instrucciones para la explicación:
1.  Tono: Sé amigable, positivo y da consejos como si fueras un estilista personal.
2.  Contenido:
    *   Explica POR QUÉ esta combinación de prendas (de {{{outfitDescription}}}) es una buena elección considerando el rango de temperatura, el estilo seleccionado y la ocasión (si se proporciona).
    *   No repitas literalmente la descripción del atuendo. En lugar de eso, comenta sobre cómo las piezas funcionan juntas.
    *   Por ejemplo, en lugar de decir "Una camiseta y jeans", podrías decir "La combinación de una camiseta cómoda con unos jeans versátiles crea un look relajado y funcional..."
3.  Personalización (si {{{userClosetInformationNeeded}}} es true):
    *   Utiliza la herramienta 'getUserClosetInformation' para obtener un resumen de OTROS artículos relevantes en el armario del usuario que coincidan con el estilo y la temperatura.
    *   Integra esta información de forma natural. Por ejemplo: "Este conjunto es una excelente opción, y dado que en tu armario tienes [resumen de la herramienta getUserClosetInformation], podrás combinar estas piezas de múltiples maneras." o "Como ya cuentas con varias prendas de estilo {{{selectedStyle}}} que se adaptan a este clima, este atuendo te resultará fácil de armar y muy versátil."
    *   El objetivo es hacer que el usuario sienta que la sugerencia es coherente con lo que ya posee y su estilo.
4.  Naturalidad: Evita frases robóticas. Haz que la explicación fluya como una conversación.
5.  Ejemplo de inicio: "¡Este look es perfecto para..." o "Para un día con temperaturas entre..., te sugiero..."

Genera la explicación.
  `,
});

const generateOutfitExplanationFlow = ai.defineFlow(
  {
    name: 'generateOutfitExplanationFlow',
    inputSchema: GenerateOutfitExplanationInputSchema,
    outputSchema: GenerateOutfitExplanationOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    if (!output) {
      return { explanation: "No se pudo generar una explicación en este momento. Por favor, intenta de nuevo." };
    }
    return output;
  }
);
