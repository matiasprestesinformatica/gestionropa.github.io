
'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { TableIcon, LayoutGrid } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ViewMode = 'table' | 'grid';

interface GridCardsToggleProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
}

export function GridCardsToggle({ viewMode, onViewModeChange }: GridCardsToggleProps) {
  return (
    <div className="flex items-center gap-2">
      <Button
        variant={viewMode === 'table' ? 'secondary' : 'ghost'}
        size="icon"
        onClick={() => onViewModeChange('table')}
        aria-pressed={viewMode === 'table'}
        title="Vista de Tabla"
        className={cn(viewMode === 'table' && "bg-accent text-accent-foreground")}
      >
        <TableIcon className="h-5 w-5" />
        <span className="sr-only">Vista de Tabla</span>
      </Button>
      <Button
        variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
        size="icon"
        onClick={() => onViewModeChange('grid')}
        aria-pressed={viewMode === 'grid'}
        title="Vista de Tarjetas"
        className={cn(viewMode === 'grid' && "bg-accent text-accent-foreground")}
      >
        <LayoutGrid className="h-5 w-5" />
        <span className="sr-only">Vista de Tarjetas</span>
      </Button>
    </div>
  );
}
