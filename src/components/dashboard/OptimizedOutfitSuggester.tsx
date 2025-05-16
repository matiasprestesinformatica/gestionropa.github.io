
// src/components/dashboard/OptimizedOutfitSuggester.tsx
'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, AlertTriangle, Sparkles } from 'lucide-react';
import type { SuggestedOutfit, OptimizedOutfitParams, TemporadaPrenda } from '@/types';
import { SEASONS } from '@/types';
import { generateOptimizedOutfitSuggestionAction } from '@/app/actions';
import { OutfitSuggestion } from '@/components/OutfitSuggestion';
import { useToast } from '@/hooks/use-toast';

export function OptimizedOutfitSuggester() {
  const [temperature, setTemperature] = React.useState<number | undefined>(20);
  const [season, setSeason] = React.useState<TemporadaPrenda>(SEASONS[0]); // Default to 'Verano'
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [suggestedOutfit, setSuggestedOutfit] = React.useState<SuggestedOutfit | null>(null);
  const { toast } = useToast();

  const handleGetSuggestion = async () => {
    if (temperature === undefined) {
      toast({ title: "Error de Validación", description: "Por favor, ingresa una temperatura.", variant: "destructive" });
      return;
    }
    if (!season) {
      toast({ title: "Error de Validación", description: "Por favor, selecciona una estación.", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuggestedOutfit(null);

    const params: OptimizedOutfitParams = { temperature, season };
    const result = await generateOptimizedOutfitSuggestionAction(params);

    if (result.error) {
      setError(result.error);
      toast({ title: "Error al Generar Sugerencia", description: result.error, variant: "destructive" });
    } else {
      setSuggestedOutfit(result);
    }
    setIsLoading(false);
  };

  return (
    <Card className="shadow-lg rounded-xl">
      <CardHeader>
        <CardTitle className="flex items-center text-xl font-semibold">
          <Sparkles className="mr-3 h-6 w-6 text-primary" />
          Sugerencia de Atuendo Optimizado
        </CardTitle>
        <CardDescription>
          Genera un conjunto completo de tu armario basado en la temperatura y estación, con armonía de colores.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="opt-temperature">Temperatura Actual (°C)</Label>
            <Input
              id="opt-temperature"
              type="number"
              value={temperature === undefined ? '' : temperature}
              onChange={(e) => setTemperature(e.target.value === '' ? undefined : parseInt(e.target.value, 10))}
              placeholder="Ej: 20"
            />
          </div>
          <div>
            <Label htmlFor="opt-season">Estación del Año</Label>
            <Select value={season} onValueChange={(value) => setSeason(value as TemporadaPrenda)}>
              <SelectTrigger id="opt-season">
                <SelectValue placeholder="Selecciona una estación" />
              </SelectTrigger>
              <SelectContent>
                {SEASONS.map(s => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button
          onClick={handleGetSuggestion}
          disabled={isLoading || temperature === undefined}
          className="w-full py-3 text-lg font-semibold"
          size="lg"
        >
          {isLoading ? (
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          ) : (
            'Obtener Sugerencia Optimizada'
          )}
        </Button>

        {error && (
          <div className="mt-4 p-3 bg-destructive/10 border border-destructive/30 text-destructive rounded-md flex items-center gap-2 text-sm">
            <AlertTriangle className="h-5 w-5" />
            <p>{error}</p>
          </div>
        )}

        {suggestedOutfit && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-4 text-center">Atuendo Sugerido:</h3>
            <OutfitSuggestion suggestion={suggestedOutfit} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
