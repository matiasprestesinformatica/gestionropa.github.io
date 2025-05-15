
'use client';

import * as React from 'react';
import { Navbar } from '@/components/ui/Navbar'; // Changed from AppHeader
import { TemperatureControl } from '@/components/TemperatureControl';
import { StyleSelection } from '@/components/StyleSelection';
import { OutfitSuggestion } from '@/components/OutfitSuggestion';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Loader2, AlertTriangle } from 'lucide-react';
import { getAISuggestionAction } from './actions';
import type { SuggestedOutfit } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';

export default function HomePage() {
  const [temperature, setTemperature] = React.useState<[number, number]>([18, 22]);
  const [selectedStyle, setSelectedStyle] = React.useState<string | null>('casual');
  const [useClosetInfo, setUseClosetInfo] = React.useState<boolean>(true); // Default to true as per PRD
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [suggestion, setSuggestion] = React.useState<SuggestedOutfit | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const { toast } = useToast();

  const handleGetSuggestion = async () => {
    if (!selectedStyle) {
      toast({
        title: 'Error de Selección',
        description: 'Por favor, selecciona un estilo antes de continuar.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuggestion(null);

    const result = await getAISuggestionAction({
      temperature,
      styleId: selectedStyle,
      useClosetInfo,
    });

    if ('error' in result) {
      setError(result.error);
      toast({
        title: 'Error al generar sugerencia',
        description: result.error,
        variant: 'destructive',
      });
    } else {
      setSuggestion(result);
    }

    setIsLoading(false);
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Navbar /> {/* Changed from AppHeader */}
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto space-y-8">
          <TemperatureControl value={temperature} onChange={setTemperature} />
          <StyleSelection selectedStyle={selectedStyle} onStyleSelect={setSelectedStyle} />

          <div className="flex items-center space-x-2 p-4 bg-card rounded-xl shadow-lg">
            <Checkbox
              id="useClosetInfo"
              checked={useClosetInfo}
              onCheckedChange={(checked) => setUseClosetInfo(Boolean(checked))}
              aria-label="Usar información del armario"
            />
            <Label htmlFor="useClosetInfo" className="text-sm font-medium text-foreground cursor-pointer">
              Personalizar con información de mi armario
            </Label>
          </div>
          
          <Separator />

          <Button
            onClick={handleGetSuggestion}
            disabled={isLoading || !selectedStyle}
            className="w-full py-3 text-lg font-semibold rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200"
            size="lg"
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              'Obtener Sugerencia de Atuendo'
            )}
          </Button>

          {error && (
            <div className="mt-6 p-4 bg-destructive/10 border border-destructive/30 text-destructive rounded-lg flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}

          {suggestion && <OutfitSuggestion suggestion={suggestion} />}
        </div>
      </main>
      <footer className="py-6 text-center text-sm text-muted-foreground border-t">
        © {new Date().getFullYear()} EstilosIA. Todos los derechos reservados.
      </footer>
    </div>
  );
}
