
import type { LucideIcon } from 'lucide-react';

export const PRENDA_COLORS = [
  'Rojo', 'Azul', 'Verde', 'Amarillo', 'Negro', 'Blanco', 'Gris', 'Marrón', 
  'Naranja', 'Violeta', 'Rosa', 'Beige', 'Celeste', 'Dorado', 'Plateado', 
  'Multicolor', 'Estampado', 'Otro'
] as const;

export type PrendaColor = typeof PRENDA_COLORS[number];


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
  color?: PrendaColor | string; // Can be from the list or a general string if coming from other sources
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
  color: PrendaColor | string; // Use the defined type or allow string for flexibility if needed elsewhere
  modelo: string; 
  temporada: string;
  fechacompra: string; // YYYY-MM-DD format
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
  prenda?: Prenda; 
  look_id?: null;
  look?: null;
}

export interface LookCalendarAssignment extends CalendarAssignmentBase {
  tipo_asignacion: 'look';
  look_id: number;
  look?: Look; 
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

// --- Dashboard & Statistics Types ---
export interface DashboardStats {
  totalPrendas: number;
  totalLooks: number;
  // Potentially more stats can be added here
}

export interface ColorFrequency {
  color: string;
  count: number;
  fill: string; 
}

export interface StyleUsageStat {
  name: string; // Style name
  value: number; // Count of prendas
  fill?: string; // Optional fill color for charts
}

export interface TimeActivityStat {
  date: string; // e.g., "Ene '24", "Semana 1"
  count: number; // e.g., looks used, prendas assigned
  fill?: string;
}

export interface StatisticsSummary extends DashboardStats {
  prendasPorEstiloCount: number;
  looksUsadosEsteMes: number; // Example, can be calculated
}

export interface IntelligentInsightData {
  dominantStyle?: { name: string; percentage: number };
  // Other insights can be added here
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
