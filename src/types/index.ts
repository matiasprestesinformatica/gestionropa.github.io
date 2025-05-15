
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
  category: string; 
  aiHint: string; 
  color?: string; // Optional: Add color to outfit items for ColorSwatch
}

export interface SuggestedOutfit {
  items: OutfitItem[];
  explanation: string;
  previewImageUrl?: string; // Optional URL for a main preview image of the outfit
}

// --- Closet Management Types ---
export interface Prenda {
  id: number; 
  created_at: string; 
  nombre: string;
  tipo: string;
  color: string;
  modelo: string; 
  temporada: string;
  fechacompra: string; 
  imagen_url: string;
  temperatura_min?: number | null;
  temperatura_max?: number | null;
  estilo: string;
  is_archived?: boolean; 
}

export const CLOTHING_TYPES = ['Camisa', 'Pantalón', 'Vestido', 'Falda', 'Chaqueta', 'Suéter', 'Zapatos', 'Accesorio', 'Otro'] as const;
export type TipoPrenda = typeof CLOTHING_TYPES[number];

export const SEASONS = ['Verano', 'Invierno', 'Otoño', 'Primavera', 'Todo el Año'] as const;
export type TemporadaPrenda = typeof SEASONS[number];

export type EstiloPrenda = StyleOption['id'];

// --- Looks Page Types ---
export interface Look {
  id: string;
  name: string;
  description?: string;
  items: Prenda[]; 
  imageUrl?: string; 
  created_at: string;
}

// --- Calendar Page Types ---
export interface CalendarEvent {
  id: string;
  date: Date;
  title: string; 
  description?: string;
  prendaIds?: number[]; 
  prendas?: Prenda[]; 
  lookId?: string; 
  look?: Look;
}

// --- Wishlist Page Types ---
export interface WishlistItem {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  estimatedPrice?: number;
  storeUrl?: string;
  status: 'pending' | 'purchased' | 'discarded';
  added_at: string;
}

export type WishlistFormData = Omit<WishlistItem, 'id' | 'status' | 'added_at'>;

// --- Dashboard Types ---
export interface DashboardStats {
  totalPrendas: number;
  totalLooks: number;
}

export interface ColorFrequency {
  color: string;
  count: number;
  fill: string; 
}

// --- HomePage Enhancement Types ---
export interface HistoricalSuggestion {
  id: string; // Unique ID, e.g., timestamp or a generated UUID
  timestamp: number; // For sorting
  temperature: [number, number];
  selectedStyle: string;
  useClosetInfo: boolean;
  suggestion: SuggestedOutfit; // The actual suggestion (items, explanation)
}
