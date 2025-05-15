
'use client';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import type { SuggestedOutfit, OutfitItem } from '@/types';
import { Sparkles, Palette } from 'lucide-react';
import { ColorSwatch } from './ColorSwatch'; // Import ColorSwatch

interface OutfitSuggestionProps {
  suggestion: SuggestedOutfit;
}

function OutfitItemCard({ item }: { item: OutfitItem }) {
  return (
    <Card className="overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-200 rounded-lg flex flex-col">
      <CardContent className="p-0">
        <div className="aspect-[3/4] relative w-full">
          <Image
            src={item.imageUrl}
            alt={item.name}
            fill={true}
            sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            data-ai-hint={item.aiHint}
          />
        </div>
      </CardContent>
      <CardFooter className="p-3 bg-card/80 backdrop-blur-sm mt-auto">
        <div>
          <p className="font-semibold text-sm text-foreground truncate" title={item.name}>{item.name}</p>
          <p className="text-xs text-muted-foreground mb-1">{item.category}</p>
          {item.color && <ColorSwatch colorName={item.color} />}
        </div>
      </CardFooter>
    </Card>
  );
}

export function OutfitSuggestion({ suggestion }: OutfitSuggestionProps) {
  if (!suggestion || !suggestion.items || suggestion.items.length === 0) {
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
  
  const outfitColors = Array.from(new Set(suggestion.items.map(item => item.color).filter(Boolean) as string[]));

  return (
    <div className="mt-8 space-y-6">
      <Card className="shadow-lg rounded-xl">
        <CardHeader>
          <CardTitle className="flex items-center text-xl font-semibold">
            <Sparkles className="mr-2 h-6 w-6 text-primary" />
            Tu Atuendo Sugerido
          </CardTitle>
          {suggestion.previewImageUrl && (
             <CardDescription>Una vista previa de tu look.</CardDescription>
          )}
        </CardHeader>
        <CardContent>
          {suggestion.previewImageUrl && (
            <div className="mb-6 aspect-video relative w-full rounded-lg overflow-hidden shadow-md">
              <Image
                src={suggestion.previewImageUrl}
                alt="Vista previa del atuendo"
                fill={true}
                sizes="100vw"
                className="object-cover"
                data-ai-hint="fashion outfit preview"
              />
            </div>
          )}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-4">
            {suggestion.items.map((item) => (
              <OutfitItemCard key={item.id} item={item} />
            ))}
          </div>
          {outfitColors.length > 0 && (
            <div className="mt-4 pt-4 border-t">
              <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center">
                <Palette className="mr-2 h-4 w-4" /> Paleta de Colores:
              </h4>
              <div className="flex flex-wrap gap-x-3 gap-y-1">
                {outfitColors.map(color => <ColorSwatch key={color} colorName={color} />)}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
