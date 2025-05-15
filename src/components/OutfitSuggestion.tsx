'use client';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import type { SuggestedOutfit, OutfitItem } from '@/types';
import { Sparkles, Lightbulb } from 'lucide-react';

interface OutfitSuggestionProps {
  suggestion: SuggestedOutfit;
}

function OutfitItemCard({ item }: { item: OutfitItem }) {
  return (
    <Card className="overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-200 rounded-lg">
      <CardContent className="p-0">
        <div className="aspect-[3/4] relative w-full">
          <Image
            src={item.imageUrl}
            alt={item.name}
            layout="fill"
            objectFit="cover"
            className="transition-transform duration-300 group-hover:scale-105"
            data-ai-hint={item.aiHint}
          />
        </div>
      </CardContent>
      <CardFooter className="p-3 bg-card/80 backdrop-blur-sm">
        <div>
          <p className="font-semibold text-sm text-foreground truncate">{item.name}</p>
          <p className="text-xs text-muted-foreground">{item.category}</p>
        </div>
      </CardFooter>
    </Card>
  );
}

export function OutfitSuggestion({ suggestion }: OutfitSuggestionProps) {
  if (!suggestion.items || suggestion.items.length === 0) {
    return (
      <Card className="shadow-lg rounded-xl mt-8">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">Sugerencia de Atuendo</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No se pudo generar una sugerencia en este momento. Intenta ajustar tus preferencias.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="mt-8 space-y-6">
      <Card className="shadow-lg rounded-xl">
        <CardHeader>
          <CardTitle className="flex items-center text-xl font-semibold">
            <Sparkles className="mr-2 h-6 w-6 text-primary" />
            Tu Atuendo Sugerido
          </CardTitle>
          <CardDescription>Basado en tus preferencias de temperatura y estilo.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {suggestion.items.map((item) => (
              <OutfitItemCard key={item.id} item={item} />
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-lg rounded-xl bg-accent/30 border-accent">
        <CardHeader>
          <CardTitle className="flex items-center text-lg font-semibold text-accent-foreground">
            <Lightbulb className="mr-2 h-5 w-5 text-accent-foreground/80" />
            Explicación Inteligente
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-accent-foreground/90 leading-relaxed whitespace-pre-wrap">
            {suggestion.explanation}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
