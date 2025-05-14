
import type { LucideIcon } from 'lucide-react';

export interface StyleOption {
  id: string;
  name: string;
  icon: LucideIcon;
  description: string;
}

export interface OutfitItem {
  id: string;
  name: string;
  imageUrl: string;
  category: string; // e.g., 'Top', 'Bottom', 'Shoes', 'Accessory'
  aiHint: string; // For placeholder image data-ai-hint
}

export interface SuggestedOutfit {
  items: OutfitItem[];
  explanation: string;
}

// Placeholder outfit items based on style
// In a real app, this could come from a database or a more sophisticated generation logic
export const placeholderOutfits: Record<string, OutfitItem[]> = {
  casual: [
    { id: 'c1', name: 'Comfortable T-Shirt', imageUrl: 'https://placehold.co/300x400.png', category: 'Top', aiHint: 'tshirt casual' },
    { id: 'c2', name: 'Blue Jeans', imageUrl: 'https://placehold.co/300x400.png', category: 'Bottom', aiHint: 'blue jeans' },
    { id: 'c3', name: 'White Sneakers', imageUrl: 'https://placehold.co/300x400.png', category: 'Shoes', aiHint: 'white sneakers' },
  ],
  formal: [
    { id: 'f1', name: 'Crisp Dress Shirt', imageUrl: 'https://placehold.co/300x400.png', category: 'Top', aiHint: 'dress shirt' },
    { id: 'f2', name: 'Tailored Trousers', imageUrl: 'https://placehold.co/300x400.png', category: 'Bottom', aiHint: 'tailored trousers' },
    { id: 'f3', name: 'Leather Oxford Shoes', imageUrl: 'https://placehold.co/300x400.png', category: 'Shoes', aiHint: 'oxford shoes' },
  ],
  sporty: [
    { id: 's1', name: 'Performance T-Shirt', imageUrl: 'https://placehold.co/300x400.png', category: 'Top', aiHint: 'performance shirt' },
    { id: 's2', name: 'Athletic Shorts', imageUrl: 'https://placehold.co/300x400.png', category: 'Bottom', aiHint: 'athletic shorts' },
    { id: 's3', name: 'Running Shoes', imageUrl: 'https://placehold.co/300x400.png', category: 'Shoes', aiHint: 'running shoes' },
  ],
  bohemian: [
    { id: 'b1', name: 'Flowy Tunic Top', imageUrl: 'https://placehold.co/300x400.png', category: 'Top', aiHint: 'flowy tunic' },
    { id: 'b2', name: 'Maxi Skirt', imageUrl: 'https://placehold.co/300x400.png', category: 'Bottom', aiHint: 'maxi skirt' },
    { id: 'b3', name: 'Leather Sandals', imageUrl: 'https://placehold.co/300x400.png', category: 'Shoes', aiHint: 'leather sandals' },
    { id: 'b4', name: 'Statement Necklace', imageUrl: 'https://placehold.co/300x400.png', category: 'Accessory', aiHint: 'statement necklace' },
  ],
};

// --- Closet Management Types ---
// Renamed ClothingItem to Prenda and updated field names to Spanish
export interface Prenda {
  id: string; // UUID from Supabase
  created_at: string; // Timestamp from Supabase
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
  // user_id?: string; // If you add user authentication
}

export const CLOTHING_TYPES = ['Camisa', 'Pantalón', 'Vestido', 'Falda', 'Chaqueta', 'Suéter', 'Zapatos', 'Accesorio', 'Otro'] as const;
export type TipoPrenda = typeof CLOTHING_TYPES[number];

export const SEASONS = ['Verano', 'Invierno', 'Otoño', 'Primavera', 'Todo el Año'] as const;
export type TemporadaPrenda = typeof SEASONS[number];

export const OCCASIONS = ['Casual', 'Formal', 'Deportivo', 'Trabajo', 'Fiesta', 'Vacaciones', 'Otro'] as const;
export type OcasionPrenda = typeof OCCASIONS[number];

// Reusing StyleOption for styles. Ensure style IDs match what's stored.
export type EstiloPrenda = StyleOption['id'];
