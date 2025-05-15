
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
  color?: string;
}

export interface SuggestedOutfit {
  items: OutfitItem[];
  explanation: string;
  previewImageUrl?: string;
}

// --- Closet Management Types ---
export interface Prenda {
  id: number; 
  created_at: string; 
  nombre: string;
  tipo: string;
  color: string;
  modelo: string; // Formerly talla in DB, now modelo in app & DB
  temporada: string;
  fechacompra: string; // Formerly ocasion in DB, now fechacompra (DATE type) in app & DB
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
  id: number;
  created_at: string;
  nombre: string;
  descripcion?: string | null;
  estilo: string;
  imagen_url?: string | null;
  prendas: Prenda[]; 
}

export interface LookFormData {
  nombre: string;
  descripcion?: string;
  estilo: string;
  imagen_url?: string;
  prenda_ids: number[]; 
}

// --- Calendar Page Types ---
export interface CalendarAssignmentBase {
  id: number;
  fecha: string; // Date in YYYY-MM-DD format
  tipo_asignacion: 'prenda' | 'look';
  nota?: string | null;
  created_at: string;
}

export interface PrendaCalendarAssignment extends CalendarAssignmentBase {
  tipo_asignacion: 'prenda';
  prenda_id: number;
  prenda?: Prenda; // Populated after fetching
  look_id?: null;
  look?: null;
}

export interface LookCalendarAssignment extends CalendarAssignmentBase {
  tipo_asignacion: 'look';
  look_id: number;
  look?: Look; // Populated after fetching
  prenda_id?: null;
  prenda?: null;
}

export type CalendarAssignment = PrendaCalendarAssignment | LookCalendarAssignment;

export interface CalendarAssignmentFormData {
  fecha: string; // YYYY-MM-DD
  tipo_asignacion: 'prenda' | 'look';
  referencia_id: number; // prenda_id or look_id
  nota?: string;
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
  id: string; 
  timestamp: number; 
  temperature: [number, number];
  selectedStyle: string;
  useClosetInfo: boolean;
  suggestion: SuggestedOutfit; 
}

