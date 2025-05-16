
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
import { supabase } from '@/lib/supabaseClient';
import { mapDbPrendaToClient } from '@/lib/dataMappers';
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
      console.error("Supabase client is not initialized in getUserClosetInformation tool. Check environment variables.");
      return { closetSummary: "No se pudo acceder a la información del armario debido a un problema de conexión con la base de datos." };
    }
    try {
      const { data: dbData, error: dbError } = await supabase
        .from('prendas')
        .select('*')
        .eq('is_archived', false)
        .eq('estilo', input.style.toLowerCase()); // Filter by style directly in query

      if (dbError) {
        console.error("Supabase error fetching prendas for tool:", dbError);
        return { closetSummary: "No se pudo obtener la información del armario en este momento debido a un error de la base de datos." };
      }
      
      if (!dbData || dbData.length === 0) {
        return { closetSummary: `El armario del usuario no tiene artículos que coincidan con el estilo ${input.style} o están todos archivados.` };
      }

      const allClientPrendas: Prenda[] = dbData.map(mapDbPrendaToClient);
      
      const tempMatch = input.temperatureRange.match(/(-?\d+)\s*-\s*(-?\d+)/);
      let minUserTemp: number | null = null;
      let maxUserTemp: number | null = null;
      if (tempMatch) {
        minUserTemp = parseInt(tempMatch[1], 10);
        maxUserTemp = parseInt(tempMatch[2], 10);
      } else {
        console.warn(`Could not parse temperature range: ${input.temperatureRange}`);
        return { closetSummary: `No se pudo determinar el rango de temperatura para filtrar el armario de estilo ${input.style}.`};
      }

      const relevantPrendas = allClientPrendas.filter(p => {
        if (minUserTemp !== null && maxUserTemp !== null && typeof p.temperatura_min === 'number' && typeof p.temperatura_max === 'number') {
          return p.temperatura_min <= maxUserTemp && p.temperatura_max >= minUserTemp;
        }
        return true; 
      });


      if (relevantPrendas.length === 0) {
        return { closetSummary: `No se encontraron artículos específicos en el armario del usuario que coincidan estrechamente con el estilo ${input.style} para el rango de ${input.temperatureRange}, más allá de los artículos ya sugeridos.` };
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
          summaryParts.push(`una ${type.toLowerCase()}`); 
        }
      }

      if (summaryParts.length === 0) {
         return { closetSummary: `El usuario tiene artículos en el estilo ${input.style} adecuados para diversas condiciones, complementando la sugerencia actual.`};
      }

      return { closetSummary: `Para el estilo ${input.style} y el rango de temperatura de ${input.temperatureRange}, el armario del usuario también incluye ${summaryParts.join(', y ')}. Esto sugiere que el atuendo sugerido puede integrarse bien.` };

    } catch (error) {
      console.error("Error in getUserClosetInformation tool:", error);
      return { closetSummary: "Ocurrió un error al intentar acceder a la información del armario." };
    }
  }
);

export async function generateOutfitExplanation(input: GenerateOutfitExplanationInput): Promise<GenerateOutfitExplanationOutput> {
  if (!ai) {
    console.error("Genkit AI instance is not available in generateOutfitExplanation.");
    return { explanation: "El servicio de IA no está disponible en este momento. Por favor, inténtalo más tarde." };
  }
  return generateOutfitExplanationFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateOutfitExplanationPrompt',
  model: 'googleai/gemini-1.5-flash-latest',
  input: { schema: GenerateOutfitExplanationInputSchema },
  output: { schema: GenerateOutfitExplanationOutputSchema },
  tools: [getUserClosetInformation],
  prompt: `Eres un asistente de moda IA amigable, experto y muy útil. Tu tarea principal es generar una explicación cálida, detallada y personalizada para el siguiente atuendo sugerido, que ya ha sido seleccionado del armario del usuario.

Detalles del Atuendo (ya seleccionado):
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
1.  Tono: Sé amigable, positivo y da consejos como si fueras un estilista personal experto. Usa un lenguaje natural y cercano.
2.  Principios de un Buen Atuendo: Al formular tu explicación, considera que un conjunto bien armado usualmente incluye prendas para las categorías principales: Cuerpo (ej. camisa, remera), Piernas (ej. pantalón, falda), Zapatos y Abrigos (este último, si la temperatura o la ocasión lo ameritan).
3.  Contenido Principal:
    *   Explica POR QUÉ esta combinación de prendas (de {{{outfitDescription}}}) es una buena elección.
    *   No repitas literalmente la descripción del atuendo. En lugar de eso, comenta sobre cómo las piezas funcionan juntas para lograr el estilo {{{selectedStyle}}} y adaptarse al rango de temperatura y ocasión (si se proporciona). Por ejemplo, en lugar de decir "Una camiseta y jeans", podrías decir "La combinación de una camiseta cómoda con unos jeans versátiles crea un look relajado y funcional..."
    *   Relaciona la selección con los "Principios de un Buen Atuendo" (punto 2). Si el atuendo sugerido ({{{outfitDescription}}}) no incluye una prenda para cada categoría principal (Cuerpo, Piernas, Zapatos, Abrigos), explica por qué sigue siendo adecuado (ej. "Para este clima cálido, un abrigo no es necesario, y el enfoque está en la comodidad de la parte superior y los pantalones.").
4.  Combinación de Colores:
    *   Analiza y comenta la armonía de colores en el atuendo {{{outfitDescription}}}.
    *   Asegúrate que los colores combinen siguiendo reglas básicas de armonía cromática.
    *   Idealmente, no debería haber más de 3 colores diferentes en el outfit completo (sin contar variaciones muy sutiles o estampados que integren esos colores).
    *   Recuerda: colores neutros (Negro, Blanco, Gris, Beige) combinan con casi todo. Se pueden combinar colores complementarios (Rojo con Verde, Azul con Naranja, Amarillo con Violeta) con cuidado. Evita combinaciones visualmente conflictivas como Rojo intenso con Rosa fuerte, o Marrón oscuro con Negro (a menos que sea una elección de estilo deliberada y sofisticada).
5.  Adecuación del Abrigo:
    *   Si la temperatura ({{{temperatureRange}}}) es superior a 22°C, un abrigo generalmente no es necesario, a menos que la ocasión ({{{ocasion}}}) sea formal o de noche. Justifica la presencia o ausencia del abrigo.
    *   Los zapatos deben ser acordes al nivel de formalidad del resto del outfit y la ocasión.
6.  Personalización (si {{{userClosetInformationNeeded}}} es true):
    *   Utiliza la herramienta 'getUserClosetInformation' para obtener un resumen de OTROS artículos relevantes en el armario del usuario que coincidan con el estilo y la temperatura.
    *   Integra esta información de forma natural. Por ejemplo: "Este conjunto es una excelente opción, y dado que en tu armario tienes [resumen de la herramienta getUserClosetInformation], podrás combinar estas piezas de múltiples maneras." o "Como ya cuentas con varias prendas de estilo {{{selectedStyle}}} que se adaptan a este clima, este atuendo te resultará fácil de armar y muy versátil."
    *   El objetivo es hacer que el usuario sienta que la sugerencia es coherente con lo que ya posee y su estilo.
7.  Naturalidad: Evita frases robóticas. Haz que la explicación fluya como una conversación.
8.  Ejemplo de inicio: "¡Este look es perfecto para..." o "Para un día con temperaturas entre..., te sugiero..."

Genera la explicación detallada y útil.
  `,
});

const generateOutfitExplanationFlow = ai.defineFlow(
  {
    name: 'generateOutfitExplanationFlow',
    inputSchema: GenerateOutfitExplanationInputSchema,
    outputSchema: GenerateOutfitExplanationOutputSchema,
  },
  async (input) => {
    if (!ai) {
      console.error("Genkit AI instance is not available in generateOutfitExplanationFlow.");
      return { explanation: "El servicio de IA no está disponible para el flujo en este momento." };
    }
    const { output } = await prompt(input);
    if (!output) {
      console.warn("AI prompt did not return an output for input:", JSON.stringify(input));
      return { explanation: "No se pudo generar una explicación en este momento. Por favor, intenta de nuevo." };
    }
    return output;
  }
);

