
// src/components/SuggestionHistory.tsx
'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { History, RotateCcw, ShoppingBag } from 'lucide-react';
import type { HistoricalSuggestion } from '@/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface SuggestionHistoryProps {
  history: HistoricalSuggestion[];
  onApplySuggestion: (suggestion: HistoricalSuggestion) => void;
  onClearHistory: () => void;
}

export function SuggestionHistory({ history, onApplySuggestion, onClearHistory }: SuggestionHistoryProps) {
  if (!history || history.length === 0) {
    return (
      <Card className="mt-8 shadow-lg rounded-xl">
        <CardHeader>
          <CardTitle className="flex items-center text-lg font-semibold">
            <History className="mr-2 h-5 w-5 text-primary" />
            Historial de Sugerencias
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 text-muted-foreground">
            <ShoppingBag className="mx-auto h-12 w-12 mb-3 opacity-50" />
            <p>Aún no has generado ninguna sugerencia.</p>
            <p className="text-xs mt-1">¡Prueba a crear tu primer look!</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Sort history by timestamp, newest first, and take last 5
  const sortedHistory = [...history]
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 5);

  return (
    <Card className="mt-8 shadow-lg rounded-xl">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div>
          <CardTitle className="flex items-center text-lg font-semibold">
            <History className="mr-2 h-5 w-5 text-primary" />
            Historial Reciente
          </CardTitle>
          <CardDescription className="text-xs">Últimas 5 sugerencias generadas.</CardDescription>
        </div>
        {history.length > 0 && (
            <Button variant="ghost" size="sm" onClick={onClearHistory} className="text-xs text-muted-foreground hover:text-destructive">
                Limpiar Historial
            </Button>
        )}
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[250px] pr-3">
          <div className="space-y-3">
            {sortedHistory.map((item) => (
              <div key={item.id} className="p-3 border rounded-lg bg-background hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {item.selectedStyle.charAt(0).toUpperCase() + item.selectedStyle.slice(1)} ({item.temperature[0]}°C - {item.temperature[1]}°C)
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(item.timestamp), "dd MMM yyyy, HH:mm", { locale: es })}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1 truncate">
                      Prendas: {item.suggestion.items.map(p => p.name).join(', ')}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onApplySuggestion(item)}
                    className="ml-2 text-xs shrink-0"
                    title="Volver a aplicar esta sugerencia"
                  >
                    <RotateCcw className="mr-1.5 h-3 w-3" /> Aplicar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
