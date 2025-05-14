'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { StyleOption } from '@/types';
import { Shirt, Briefcase, Dumbbell, Feather, Wand2 } from 'lucide-react';

export const styleOptions: StyleOption[] = [
  { id: 'casual', name: 'Casual', icon: Shirt, description: 'Cómodo y relajado para el día a día.' },
  { id: 'formal', name: 'Formal', icon: Briefcase, description: 'Elegante y profesional para eventos especiales.' },
  { id: 'sporty', name: 'Deportivo', icon: Dumbbell, description: 'Funcional y activo para tus entrenamientos.' },
  { id: 'bohemian', name: 'Bohemio', icon: Feather, description: 'Libre y artístico con toques étnicos.' },
];

interface StyleSelectionProps {
  selectedStyle: string | null;
  onStyleSelect: (styleId: string) => void;
}

export function StyleSelection({ selectedStyle, onStyleSelect }: StyleSelectionProps) {
  return (
    <Card className="shadow-lg rounded-xl">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center text-xl font-semibold">
          <Wand2 className="mr-2 h-6 w-6 text-primary" />
          Selecciona tu Estilo
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {styleOptions.map((style) => (
            <Card
              key={style.id}
              onClick={() => onStyleSelect(style.id)}
              className={cn(
                'cursor-pointer transition-all duration-200 ease-in-out hover:shadow-xl hover:border-primary/80',
                selectedStyle === style.id ? 'border-primary ring-2 ring-primary shadow-xl' : 'border-border'
              )}
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && onStyleSelect(style.id)}
              role="button"
              aria-pressed={selectedStyle === style.id}
              aria-label={`Select ${style.name} style`}
            >
              <CardContent className="p-4 flex flex-col items-center justify-center aspect-square">
                <style.icon className={cn(
                  'h-10 w-10 mb-3 transition-colors',
                  selectedStyle === style.id ? 'text-primary' : 'text-muted-foreground group-hover:text-primary/80'
                )} />
                <p className={cn(
                  'font-medium text-center text-sm',
                  selectedStyle === style.id ? 'text-primary' : 'text-foreground'
                )}>
                  {style.name}
                </p>
                <p className="text-xs text-muted-foreground text-center mt-1 hidden sm:block">
                  {style.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
         <p className="text-xs text-muted-foreground text-center mt-4">
            Elige el estilo que mejor se adapte a tu ocasión o preferencia.
          </p>
      </CardContent>
    </Card>
  );
}
