
// src/lib/dataMappers.ts
'use server'; // Can be 'use server' if used in server actions, or remove if only client/shared

import type { Prenda } from '@/types';
import { format, parseISO, isValid } from 'date-fns';

export function mapDbPrendaToClient(dbRecord: any): Prenda {
  let formattedFechacompra = '';
  if (dbRecord.fechacompra) {
    try {
      // Check if it's already a 'YYYY-MM-DD' string or needs parsing from a Date object or full ISO string
      let dateObj: Date;
      if (typeof dbRecord.fechacompra === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dbRecord.fechacompra)) {
        // Already in YYYY-MM-DD format, may need to adjust for timezone if parsing
        dateObj = parseISO(dbRecord.fechacompra + 'T00:00:00'); // Assume UTC if just date
      } else if (typeof dbRecord.fechacompra === 'string') {
        dateObj = parseISO(dbRecord.fechacompra);
      } else if (dbRecord.fechacompra instanceof Date) {
        dateObj = dbRecord.fechacompra;
      } else {
        throw new Error('Invalid date type for fechacompra');
      }
      
      if (isValid(dateObj)) {
        formattedFechacompra = format(dateObj, 'yyyy-MM-dd');
      } else {
        console.warn(`Invalid date for fechacompra (after parsing attempt): ${dbRecord.fechacompra}. Setting to empty string.`);
      }
    } catch (e) {
      console.warn(`Error parsing date for fechacompra: ${dbRecord.fechacompra}`, e);
    }
  }

  return {
    id: Number(dbRecord.id),
    created_at: String(dbRecord.created_at),
    nombre: dbRecord.nombre || '',
    tipo: dbRecord.tipo || '',
    color: dbRecord.color || '',
    modelo: dbRecord.modelo || '', // Was talla
    temporada: dbRecord.temporada || '',
    fechacompra: formattedFechacompra, // Was ocasion, now a DATE type
    imagen_url: dbRecord.imagen_url || '',
    temperatura_min: dbRecord.temperatura_min,
    temperatura_max: dbRecord.temperatura_max,
    estilo: dbRecord.estilo || '',
    is_archived: dbRecord.is_archived || false,
  };
}
