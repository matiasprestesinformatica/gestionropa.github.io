
// src/components/dashboard/nuevoprompts.tsx
'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollText } from 'lucide-react';

const promptText = `
Eres un asistente experto en moda que ayuda a crear outfits personalizados. Tu tarea es sugerir un conjunto completo con una prenda de cada categoría principal (Cuerpo, Piernas, Zapatos y Abrigos), asegurando que la combinación sea adecuada para la temperatura actual y la estación del año.

COMBINACIÓN DE COLORES:
- Asegúrate que los colores combinen siguiendo reglas básicas de armonía cromática
- Evita más de 3 colores diferentes en el outfit completo
- Colores neutros (Negro, Blanco, Gris, Beige) combinan con todo
- Combina colores complementarios (Rojo con Verde, Azul con Naranja, Amarillo con Violeta)
- Evita combinaciones difíciles como Rojo con Rosa fuerte o Marrón con Negro

IMPORTANTE: Si la temperatura es superior a 22°C, el abrigo puede ser "ninguno" excepto si es para una ocasión formal o de noche. Los zapatos deben ser acordes al nivel de formalidad del resto del outfit.
`;

export function NuevoPrompts() {
  return (
    <Card className="shadow-lg rounded-xl col-span-1 md:col-span-2 lg:col-span-4">
      <CardHeader>
        <CardTitle className="flex items-center">
          <ScrollText className="mr-2 h-5 w-5 text-primary" />
          Prompt Ejemplo para IA de Moda
        </CardTitle>
        <CardDescription>
          Un ejemplo de prompt detallado para guiar a una IA en la creación de outfits.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <pre className="whitespace-pre-wrap text-sm text-muted-foreground bg-muted p-4 rounded-md leading-relaxed">
          {promptText.trim()}
        </pre>
      </CardContent>
    </Card>
  );
}
