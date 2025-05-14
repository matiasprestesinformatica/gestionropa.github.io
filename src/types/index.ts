
import type { LucideIcon } from 'lucide-react';

export interface StyleOption {
  id: string;
  name: string;
  icon: LucideIcon;
  description: string;
}

export interface OutfitItem {
  id: string; // Was prenda.id (number), converted to string
  name: string;
  imageUrl: string;
  category: string; // e.g., 'Top', 'Bottom', 'Shoes', 'Accessory' from prenda.tipo
  aiHint: string; // For placeholder image data-ai-hint
}

export interface SuggestedOutfit {
  items: OutfitItem[];
  explanation: string;
}

// Removed placeholderOutfits as suggestions now come from the database.

// --- Closet Management Types ---
// Prenda interface remains the same
export interface Prenda {
  id: number; 
  created_at: string; 
  nombre: string;
  tipo: string;
  color: string;
  talla: string;
  temporada: string;
  ocasion: string;
  imagen_url: string;
  temperatura_min?: number | null;
  temperatura_max?: number | null;
  estilo: string;
}

export const CLOTHING_TYPES = ['Camisa', 'Pantalón', 'Vestido', 'Falda', 'Chaqueta', 'Suéter', 'Zapatos', 'Accesorio', 'Otro'] as const;
export type TipoPrenda = typeof CLOTHING_TYPES[number];

export const SEASONS = ['Verano', 'Invierno', 'Otoño', 'Primavera', 'Todo el Año'] as const;
export type TemporadaPrenda = typeof SEASONS[number];

export const OCCASIONS = ['Casual', 'Formal', 'Deportivo', 'Trabajo', 'Fiesta', 'Vacaciones', 'Otro'] as const;
export type OcasionPrenda = typeof OCCASIONS[number];

export type EstiloPrenda = StyleOption['id'];
