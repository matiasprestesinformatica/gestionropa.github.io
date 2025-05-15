
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
}

export interface SuggestedOutfit {
  items: OutfitItem[];
  explanation: string;
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
  fechacompra: string; // Represents purchase date as string, from DATE type in DB
  imagen_url: string;
  temperatura_min?: number | null;
  temperatura_max?: number | null;
  estilo: string;
  is_archived?: boolean; // For archived items
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
  items: Prenda[]; // or OutfitItem[] if you prefer
  imageUrl?: string; // A representative image for the look
  created_at: string;
}

// --- Calendar Page Types ---
export interface CalendarEvent {
  id: string;
  date: Date;
  title: string; // e.g., "Outfit del día"
  description?: string;
  prendaIds?: number[]; // IDs of prendas used
  prendas?: Prenda[]; // Full prenda objects
  lookId?: string; // ID of a saved look used
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
  // Add more stats as needed
}

export interface ColorFrequency {
  color: string;
  count: number;
  fill: string; // For chart
}
