
'use client';

import * as React from 'react';
import { Navbar } from '@/components/ui/Navbar';
import { TemperatureControl } from '@/components/TemperatureControl';
import { StyleSelection } from '@/components/StyleSelection';
// OutfitSuggestion is now used within InteractiveOutfitSuggestion
// import { OutfitSuggestion } from '@/components/OutfitSuggestion'; 
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, AlertTriangle, MessageSquareText } from 'lucide-react';
import { getAISuggestionAction, getPrendasAction } from '../actions';
import type { SuggestedOutfit, HistoricalSuggestion, Prenda } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { Footer } from '@/components/ui/Footer';
import { OutfitExplanation } from '@/components/OutfitExplanation';
import { SuggestionHistory } from '@/components/SuggestionHistory';
import { InspirationCard } from '@/components/InspirationCard';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { InteractiveOutfitSuggestion } from '@/components/dashboard/InteractiveOutfitSuggestion';


const LOCAL_STORAGE_HISTORY_KEY = 'estilosia_suggestion_history';
const LOCAL_STORAGE_NOTES_KEY = 'estilosia_user_notes_suggester';

export default function SugerenciaAIPage() {
  const [temperature, setTemperature] = React.useState<[number, number]>([18, 22]);
  const [selectedStyle, setSelectedStyle] = React.useState<string | null>('casual');
  const [useClosetInfo, setUseClosetInfo] = React.useState<boolean>(true);
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [suggestion, setSuggestion] = React.useState<SuggestedOutfit | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  
  const [suggestionHistory, setSuggestionHistory] = React.useState<HistoricalSuggestion[]>([]);
  const [userNotes, setUserNotes] = React.useState<string>('');
  const [availablePrendasForLookForm, setAvailablePrendasForLookForm] = React.useState<Prenda[]>([]);

  const { toast } = useToast();

  React.useEffect(() => {
    const storedHistory = localStorage.getItem(LOCAL_STORAGE_HISTORY_KEY);
    if (storedHistory) {
      try {
        setSuggestionHistory(JSON.parse(storedHistory));
      } catch (e) {
        console.error("Failed to parse suggestion history from localStorage", e);
        localStorage.removeItem(LOCAL_STORAGE_HISTORY_KEY);
      }
    }
    const storedNotes = localStorage.getItem(LOCAL_STORAGE_NOTES_KEY);
    if (storedNotes) {
      setUserNotes(storedNotes);
    }
    
    // Fetch all available prendas once for the LookForm
    const fetchAllPrendas = async () => {
        const prendasResult = await getPrendasAction();
        if (prendasResult.data) {
            setAvailablePrendasForLookForm(prendasResult.data.filter(p => !p.is_archived));
        } else if (prendasResult.error) {
            toast({ title: "Error al cargar prendas", description: "No se pudieron cargar las prendas para crear looks.", variant: "destructive"});
        }
    };
    fetchAllPrendas();

  }, [toast]);

  const saveHistory = (history: HistoricalSuggestion[]) => {
    try {
      localStorage.setItem(LOCAL_STORAGE_HISTORY_KEY, JSON.stringify(history));
    } catch (e) {
      console.error("Failed to save suggestion history to localStorage", e);
      toast({
        title: "Error de almacenamiento",
        description: "No se pudo guardar el historial. Puede que el almacenamiento local esté lleno.",
        variant: "destructive",
      });
    }
  };
  
  const saveNotes = (notes: string) => {
    try {
      localStorage.setItem(LOCAL_STORAGE_NOTES_KEY, notes);
    } catch (e)
    {
      console.error("Failed to save notes to localStorage", e);
    }
  };

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
    setSuggestion(null); // Clear previous suggestion
    
    const result = await getAISuggestionAction({
      temperature,
      styleId: selectedStyle,
      useClosetInfo,
    });

    if ('error' in result) {
      setError(result.error);
      setSuggestion(null);
      toast({
        title: 'Error al generar sugerencia',
        description: result.error,
        variant: 'destructive',
      });
    } else {
      setSuggestion(result);
      const newHistoryItem: HistoricalSuggestion = {
        id: Date.now().toString(),
        timestamp: Date.now(),
        temperature,
        selectedStyle,
        useClosetInfo,
        suggestion: result,
      };
      const updatedHistory = [newHistoryItem, ...suggestionHistory].slice(0, 10);
      setSuggestionHistory(updatedHistory);
      saveHistory(updatedHistory);
    }
    setIsLoading(false);
  };

  const handleApplyHistoryItem = (historicalItem: HistoricalSuggestion) => {
    setTemperature(historicalItem.temperature);
    setSelectedStyle(historicalItem.selectedStyle);
    setUseClosetInfo(historicalItem.useClosetInfo);
    setSuggestion(historicalItem.suggestion);
    setError(null);
    toast({ title: 'Sugerencia Aplicada', description: 'Se cargaron los parámetros y la sugerencia del historial.' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleClearHistory = () => {
    setSuggestionHistory([]);
    localStorage.removeItem(LOCAL_STORAGE_HISTORY_KEY);
    toast({ title: 'Historial Limpiado', description: 'Se han eliminado todas las sugerencias guardadas.' });
  };

  const handleUserNotesChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newNotes = event.target.value;
    setUserNotes(newNotes);
    saveNotes(newNotes);
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Navbar />
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
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

            {suggestion && (
              <InteractiveOutfitSuggestion 
                initialSuggestion={suggestion}
                originalTemperature={temperature}
                originalStyleId={selectedStyle || 'casual'} // Default to 'casual' if somehow null
                availablePrendasForLookForm={availablePrendasForLookForm}
              />
            )}
            
            {suggestion?.explanation && <OutfitExplanation explanation={suggestion.explanation} />}

            {suggestion && (
                <Card className="shadow-lg rounded-xl mt-6">
                    <CardHeader>
                        <CardTitle className="flex items-center text-lg font-semibold">
                            <MessageSquareText className="mr-2 h-5 w-5 text-primary" />
                            Mis Notas sobre este Look
                        </CardTitle>
                        <CardDescription className="text-xs">
                            Añade cualquier apunte o recordatorio sobre esta sugerencia.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Textarea
                            placeholder="Ej: Perfecto para la cena del viernes, probar con otros zapatos..."
                            value={userNotes}
                            onChange={handleUserNotesChange}
                            rows={4}
                            className="resize-none"
                        />
                    </CardContent>
                </Card>
            )}
          </div>

          <div className="lg:col-span-1 space-y-8 lg:pt-0">
            <SuggestionHistory history={suggestionHistory} onApplySuggestion={handleApplyHistoryItem} onClearHistory={handleClearHistory} />
            <InspirationCard />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
