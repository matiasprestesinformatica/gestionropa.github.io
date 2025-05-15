
// src/components/InspirationCard.tsx
'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Lightbulb } from 'lucide-react';

interface InspirationCardProps {
  quote: string;
  author?: string;
}

const defaultInspirations: InspirationCardProps[] = [
  { quote: "La moda se desvanece, solo el estilo permanece igual.", author: "Coco Chanel" },
  { quote: "Vístete vulgar y solo verán el vestido, vístete elegante y verán a la mujer.", author: "Coco Chanel" },
  { quote: "La simplicidad es la clave de la verdadera elegancia.", author: "Coco Chanel" },
  { quote: "No sigas las tendencias. No dejes que la moda te posea, decide quién eres, qué quieres expresar por la forma en que te vistes y la forma en que vives.", author: "Gianni Versace" },
  { quote: "El estilo es una forma de decir quién eres sin tener que hablar.", author: "Rachel Zoe" },
  { quote: "La diferencia entre estilo y moda está en la calidad.", author: "Giorgio Armani" },
  { quote: "La moda es armadura para sobrevivir a la realidad de la vida cotidiana.", author: "Bill Cunningham" },
  { quote: "Menos es más. Combina básicos con una prenda statement.", author: "EstilosIA" },
  { quote: "Atrévete a experimentar con un color que normalmente no usarías.", author: "EstilosIA" },
  { quote: "Los accesorios son el signo de exclamación de un outfit.", author: "Michael Kors" },
];


export function InspirationCard() {
  const [inspiration, setInspiration] = React.useState<InspirationCardProps | null>(null);

  React.useEffect(() => {
    setInspiration(defaultInspirations[Math.floor(Math.random() * defaultInspirations.length)]);
  }, []);

  if (!inspiration) return null;

  return (
    <Card className="shadow-md rounded-xl bg-secondary/50 border-secondary mt-6">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center text-md font-semibold text-secondary-foreground">
          <Lightbulb className="mr-2 h-5 w-5 text-secondary-foreground/80" />
          Inspiración del Día
        </CardTitle>
      </CardHeader>
      <CardContent>
        <blockquote className="text-sm text-secondary-foreground/90 italic">
          &ldquo;{inspiration.quote}&rdquo;
        </blockquote>
        {inspiration.author && (
          <p className="text-xs text-muted-foreground mt-2 text-right">- {inspiration.author}</p>
        )}
      </CardContent>
    </Card>
  );
}
