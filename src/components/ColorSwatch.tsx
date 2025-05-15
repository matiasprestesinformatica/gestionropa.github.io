
// src/components/ColorSwatch.tsx
'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface ColorSwatchProps {
  colorName?: string; 
  hexColor?: string; 
  className?: string;
}

// Basic mapping for common color names to Tailwind classes
const commonColorMap: Record<string, string> = {
  rojo: 'bg-red-500',
  azul: 'bg-blue-500',
  verde: 'bg-green-500',
  amarillo: 'bg-yellow-400',
  negro: 'bg-black',
  blanco: 'bg-white border border-slate-300',
  gris: 'bg-gray-400',
  marrón: 'bg-yellow-700', // Using yellow for brown
  naranja: 'bg-orange-500',
  violeta: 'bg-purple-500',
  morado: 'bg-purple-500',
  rosa: 'bg-pink-400',
  celeste: 'bg-sky-400',
  beige: 'bg-yellow-100 border border-yellow-300',
  crema: 'bg-orange-50 border border-orange-200',
  oliva: 'bg-lime-700',
  turquesa: 'bg-cyan-400',
  salmon: 'bg-red-300',
  lavanda: 'bg-purple-300',
  // Add more specific colors as needed
};

export function ColorSwatch({ colorName, hexColor, className }: ColorSwatchProps) {
  const colorClass = colorName ? commonColorMap[colorName.toLowerCase()] || 'bg-gray-200 border border-gray-300' : 'bg-gray-200 border border-gray-300';

  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <div
        className={cn("h-3 w-3 rounded-full shadow-sm", hexColor ? '' : colorClass)}
        style={hexColor ? { backgroundColor: hexColor } : {}}
        title={colorName || 'Color desconocido'}
      />
      {colorName && <span className="text-xs capitalize text-muted-foreground">{colorName}</span>}
    </div>
  );
}
