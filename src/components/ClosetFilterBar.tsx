
'use client';

import * as React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, X } from 'lucide-react';
import { TIPO_PRENDA_ENUM_VALUES, SEASONS } from '@/types'; // Updated import
import { styleOptions } from '@/components/StyleSelection';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';

export interface ClosetFilters {
  searchTerm: string;
  tipo: string;
  estilo: string;
  temporada: string;
}

interface ClosetFilterBarProps {
  filters: ClosetFilters;
  onFilterChange: (newFilters: ClosetFilters) => void;
  onResetFilters: () => void;
}

const ALL_ITEMS_PLACEHOLDER_VALUE = "--all--";

export function ClosetFilterBar({ filters, onFilterChange, onResetFilters }: ClosetFilterBarProps) {
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange({ ...filters, searchTerm: e.target.value });
  };

  const handleSelectChange = (name: keyof Omit<ClosetFilters, 'searchTerm'>, value: string) => {
    const actualValue = value === ALL_ITEMS_PLACEHOLDER_VALUE ? '' : value;
    onFilterChange({ ...filters, [name]: actualValue });
  };

  return (
    <Card className="mb-6 p-4 shadow-md rounded-xl">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 items-end">
        <div className="lg:col-span-2">
          <Label htmlFor="search-prenda" className="text-sm font-medium text-muted-foreground">Buscar por nombre</Label>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="search-prenda"
              type="text"
              placeholder="Ej: Camisa Azul, Jean Negro..."
              value={filters.searchTerm}
              onChange={handleInputChange}
              className="pl-9"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="filter-tipo" className="text-sm font-medium text-muted-foreground">Tipo</Label>
          <Select value={filters.tipo || ALL_ITEMS_PLACEHOLDER_VALUE} onValueChange={(value) => handleSelectChange('tipo', value)}>
            <SelectTrigger id="filter-tipo">
              <SelectValue placeholder="Todos los tipos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_ITEMS_PLACEHOLDER_VALUE}>Todos los tipos</SelectItem>
              {TIPO_PRENDA_ENUM_VALUES.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="filter-estilo" className="text-sm font-medium text-muted-foreground">Estilo</Label>
          <Select value={filters.estilo || ALL_ITEMS_PLACEHOLDER_VALUE} onValueChange={(value) => handleSelectChange('estilo', value)}>
            <SelectTrigger id="filter-estilo">
              <SelectValue placeholder="Todos los estilos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_ITEMS_PLACEHOLDER_VALUE}>Todos los estilos</SelectItem>
              {styleOptions.map((style) => (
                <SelectItem key={style.id} value={style.id}>
                  {style.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="filter-temporada" className="text-sm font-medium text-muted-foreground">Temporada</Label>
          <Select value={filters.temporada || ALL_ITEMS_PLACEHOLDER_VALUE} onValueChange={(value) => handleSelectChange('temporada', value)}>
            <SelectTrigger id="filter-temporada">
              <SelectValue placeholder="Todas las temporadas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_ITEMS_PLACEHOLDER_VALUE}>Todas las temporadas</SelectItem>
              {SEASONS.map((season) => (
                <SelectItem key={season} value={season}>
                  {season}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="mt-4 flex justify-end">
        <Button variant="ghost" onClick={onResetFilters} className="text-sm">
          <X className="mr-2 h-4 w-4" />
          Limpiar Filtros
        </Button>
      </div>
    </Card>
  );
}
