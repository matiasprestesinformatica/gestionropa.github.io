
import type { LucideIcon } from 'lucide-react';

export const PRENDA_COLORS = [
  'Rojo', 'Azul', 'Verde', 'Amarillo', 'Negro', 'Blanco', 'Gris', 'Marrón',
  'Naranja', 'Violeta', 'Rosa', 'Beige', 'Celeste', 'Dorado', 'Plateado',
  'Multicolor', 'Estampado', 'Otro', 'Cian', 'Magenta', 'Lima', 'Oliva',
  'Turquesa', 'Índigo', 'Salmón', 'Coral', 'Lavanda', 'Menta', 'Caqui',
  'Borgoña', 'Fucsia', 'Cuadrille'
] as const;

export type PrendaColor = typeof PRENDA_COLORS[number];


export interface StyleOption {
  id: string;
  name: string;
  icon: LucideIcon;
  description: string;
}

export interface OutfitItem {
  id: string; // Can be Prenda ID
  name: string;
  imageUrl: string;
  category: TipoPrenda | string; // Use TipoPrenda for consistency
  aiHint: string;
  color?: PrendaColor | string;
}

export interface SuggestedOutfit {
  items: OutfitItem[];
  explanation: string;
  previewImageUrl?: string;
}

// --- Closet Management Types ---
export const TIPO_PRENDA_ENUM_VALUES = ['Cuerpo', 'Piernas', 'Zapatos', 'Abrigos', 'Accesorios'] as const;
export type TipoPrenda = typeof TIPO_PRENDA_ENUM_VALUES[number];

export interface Prenda {
  id: number;
  created_at: string;
  nombre: string;
  tipo: TipoPrenda;
  color: PrendaColor;
  modelo: string; // Was talla
  temporada: TemporadaPrenda;
  fechacompra: string; // Was ocasion, YYYY-MM-DD, or null
  imagen_url: string;
  temperatura_min?: number | null;
  temperatura_max?: number | null;
  estilo: string;
  is_archived: boolean;
}

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
export interface StatisticsSummary {
  totalPrendas: number;
  totalLooks: number;
  prendasPorEstiloCount: number;
  looksUsadosEsteMes: number;
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

export interface IntelligentInsightData {
  dominantStyle?: { name: string; percentage: number };
}

// --- SugerenciaIA Page (formerly HomePage) Types ---
export interface HistoricalSuggestion {
  id: string;
  timestamp: number;
  temperature: [number, number];
  selectedStyle: string;
  useClosetInfo: boolean;
  suggestion: SuggestedOutfit;
}

// --- Optimized Outfit Suggester Types ---
export interface OptimizedOutfitParams {
  temperature: number;
  ocasion: string; 
}

export const NEUTRAL_COLORS: PrendaColor[] = ['Negro', 'Blanco', 'Gris', 'Beige'];
export const DIFFICULT_COLOR_PAIRS: [PrendaColor, PrendaColor][] = [
  ['Marrón', 'Negro'],
  ['Rojo', 'Rosa'],
];

// --- Interactive Outfit Suggestion Types ---
export interface GetAlternativePrendasParams {
  tipo: TipoPrenda;
  originalTemperature: [number, number];
  originalStyleId: string;
  currentPrendaIdToExclude: number; // ID of the prenda currently in the slot, to exclude it
}
