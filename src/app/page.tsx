
// src/app/page.tsx (New Homepage - now the Dashboard)
'use client';

import * as React from 'react';
import { Navbar } from '@/components/ui/Navbar';
import { Footer } from '@/components/ui/Footer';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { ColorDistributionChart } from '@/components/dashboard/ColorDistributionChart';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, AlertTriangle, LayoutGrid, CalendarClock, Sparkles, Shirt, RotateCcw } from 'lucide-react';
import type { SuggestedOutfit, StatisticsSummary, ColorFrequency, Prenda } from '@/types';
import { getAISuggestionAction, getStatisticsSummaryAction, getColorDistributionStatsAction, getPrendasAction } from './actions';
import { useToast } from '@/hooks/use-toast';
import { OptimizedOutfitSuggester } from '@/components/dashboard/OptimizedOutfitSuggester';
import { SeleccionarSugerencias } from '@/components/suggestion/SeleccionarSugerencias';


const mockStatsSummary: StatisticsSummary = {
  totalPrendas: 0,
  totalLooks: 0,
  prendasPorEstiloCount: 0,
  looksUsadosEsteMes: 0,
};

const mockColorFrequency: ColorFrequency[] = [
  { color: 'Azul', count: 0, fill: 'hsl(var(--chart-1))' },
  { color: 'Negro', count: 0, fill: 'hsl(var(--chart-2))' },
  { color: 'Blanco', count: 0, fill: 'hsl(var(--chart-3))' },
  { color: 'Gris', count: 0, fill: 'hsl(var(--chart-4))' },
  { color: 'Verde', count: 0, fill: 'hsl(var(--chart-5))' },
];

export default function HomePage() {
  const [stats, setStats] = React.useState<StatisticsSummary>(mockStatsSummary);
  const [colorFrequency, setColorFrequency] = React.useState<ColorFrequency[]>(mockColorFrequency);
  const [randomSuggestion, setRandomSuggestion] = React.useState<SuggestedOutfit | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSuggestionLoading, setIsSuggestionLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const { toast } = useToast();

  const [originalRandomTemp, setOriginalRandomTemp] = React.useState<[number, number] | null>(null);
  const [originalRandomStyle, setOriginalRandomStyle] = React.useState<string | null>(null);
  const [availablePrendas, setAvailablePrendas] = React.useState<Prenda[]>([]);


  const fetchRandomSuggestion = React.useCallback(async ( prendasForSuggestion: Prenda[]) => {
    setIsSuggestionLoading(true);
    setRandomSuggestion(null); // Clear previous suggestion
    try {
      if (prendasForSuggestion.length > 0) {
        const styles = ['casual', 'formal', 'sporty', 'bohemian']; // Could be dynamic later
        const randomStyle = styles[Math.floor(Math.random() * styles.length)];
        const randomTempMin = Math.floor(Math.random() * 20) + 5; // e.g., 5-24
        const randomTempMax = randomTempMin + Math.floor(Math.random() * 10) + 5; // e.g., min+5 to min+14
        const tempRange: [number, number] = [randomTempMin, randomTempMax];

        setOriginalRandomTemp(tempRange);
        setOriginalRandomStyle(randomStyle);

        const suggestionResult = await getAISuggestionAction({
          temperature: tempRange,
          styleId: randomStyle,
          useClosetInfo: true,
        });

        if ('error' in suggestionResult) {
          console.warn("Error fetching random suggestion for dashboard:", suggestionResult.error);
          toast({ title: 'Error Sugerencia', description: suggestionResult.error, variant: 'destructive'});
          setRandomSuggestion(null);
        } else {
          setRandomSuggestion(suggestionResult);
        }
      } else {
        setRandomSuggestion(null);
      }
    } catch (e) {
        const errorMessage = e instanceof Error ? e.message : 'Error al generar sugerencia aleatoria.';
        toast({ title: 'Error Sugerencia', description: errorMessage, variant: 'destructive' });
        setRandomSuggestion(null);
    }
    setIsSuggestionLoading(false);
  }, [toast]);
  
  const fetchDashboardData = React.useCallback(async () => {
    setIsLoading(true); // For overall dashboard data
    setError(null);
    try {
      const [statsResult, colorsResult, prendasResult] = await Promise.allSettled([
        getStatisticsSummaryAction(),
        getColorDistributionStatsAction(),
        getPrendasAction(), // Fetch all prendas for the suggestion component
      ]);

      if (statsResult.status === 'fulfilled' && !statsResult.value.error && statsResult.value.data) {
        setStats(statsResult.value.data);
      } else {
        console.warn("Error fetching stats summary:", statsResult.status === 'fulfilled' ? statsResult.value.error : statsResult.reason);
        setStats(mockStatsSummary);
        if(statsResult.status === 'fulfilled' && statsResult.value.error) setError(prev => prev ? `${prev}, ${statsResult.value.error}` : statsResult.value.error!);
      }

      if (colorsResult.status === 'fulfilled' && !colorsResult.value.error && colorsResult.value.data) {
         setColorFrequency(colorsResult.value.data.length > 0 ? colorsResult.value.data : mockColorFrequency);
      } else {
         console.warn("Error fetching color distribution:", colorsResult.status === 'fulfilled' ? colorsResult.value.error : colorsResult.reason);
         setColorFrequency(mockColorFrequency);
         if(colorsResult.status === 'fulfilled' && colorsResult.value.error) setError(prev => prev ? `${prev}, ${colorsResult.value.error}` : colorsResult.value.error!);
      }

      let activePrendas: Prenda[] = [];
      if (prendasResult.status === 'fulfilled' && !prendasResult.value.error && prendasResult.value.data) {
        activePrendas = prendasResult.value.data.filter(p => !p.is_archived);
        setAvailablePrendas(activePrendas);
      } else {
        console.warn("Error fetching available prendas:", prendasResult.status === 'fulfilled' ? prendasResult.value.error : prendasResult.reason);
        setAvailablePrendas([]);
         if(prendasResult.status === 'fulfilled' && prendasResult.value.error) setError(prev => prev ? `${prev}, ${prendasResult.value.error}` : prendasResult.value.error!);
      }
      
      await fetchRandomSuggestion(activePrendas);

    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Error desconocido al cargar el dashboard.';
      setError(errorMessage);
      toast({ title: 'Error al cargar el dashboard', description: errorMessage, variant: 'destructive' });
    }
    setIsLoading(false);
  }, [toast, fetchRandomSuggestion]);

  React.useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleRefreshSuggestion = () => {
    fetchRandomSuggestion(availablePrendas);
  }

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <Navbar />
        <main className="flex-grow container mx-auto px-4 py-8 flex justify-center items-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Navbar />
      <main className="flex-grow container mx-auto px-4 py-8 space-y-8">
        <h1 className="text-3xl font-bold text-foreground">Dashboard de EstilosIA</h1>
        
        {error && !isLoading && (
           <div className="my-6 p-4 bg-destructive/10 border border-destructive/30 text-destructive rounded-lg flex items-center gap-3">
            <AlertTriangle className="h-6 w-6" />
            <div>
              <h3 className="font-semibold">Error al cargar datos del dashboard</h3>
              <p className="text-sm">{error}</p>
              <Button variant="link" onClick={fetchDashboardData} className="p-0 h-auto text-destructive mt-1">Intentar de nuevo</Button>
            </div>
          </div>
        )}
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatsCard title="Total de Prendas" value={stats.totalPrendas.toString()} icon={Shirt} description="Prendas activas en tu armario" />
          <StatsCard title="Looks Guardados" value={stats.totalLooks.toString()} icon={Sparkles} description="Combinaciones creadas" />
          <StatsCard title="Estilos Diferentes" value={stats.prendasPorEstiloCount.toString()} icon={LayoutGrid} description="En tus prendas activas" />
          <StatsCard title="Looks Usados (Mes)" value={stats.looksUsadosEsteMes.toString()} icon={CalendarClock} description="Asignaciones en calendario" />
        </div>
        
        <div className="grid gap-8 md:grid-cols-1 lg:grid-cols-2"> 
          <Card className="shadow-lg rounded-xl">
            <CardHeader>
              <CardTitle>Distribución de Colores</CardTitle>
              <CardDescription>Colores más frecuentes en tu armario.</CardDescription>
            </CardHeader>
            <CardContent>
              {colorFrequency.length > 0 && colorFrequency.some(c => c.count > 0) ? (
                <ColorDistributionChart data={colorFrequency} />
              ) : (
                <p className="text-muted-foreground text-center py-8">No hay suficientes datos de colores para mostrar el gráfico.</p>
              )}
            </CardContent>
          </Card>

          {isSuggestionLoading ? (
             <Card className="shadow-lg rounded-xl flex flex-col items-center justify-center min-h-[300px]">
                <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
                <p className="text-muted-foreground">Generando sugerencia aleatoria...</p>
            </Card>
          ) : randomSuggestion && originalRandomTemp && originalRandomStyle && availablePrendas.length > 0 ? (
             <SeleccionarSugerencias
                initialSuggestion={randomSuggestion}
                originalTemperature={originalRandomTemp}
                originalStyleId={originalRandomStyle}
                availablePrendasForLookForm={availablePrendas}
                onSuggestionRefresh={handleRefreshSuggestion}
              />
          ) : (
            <Card className="shadow-lg rounded-xl">
              <CardHeader>
                <CardTitle className="flex items-center">
                    <Sparkles className="mr-2 h-5 w-5 text-primary" />
                    Sugerencia Rápida AI
                </CardTitle>
                <CardDescription>Un look aleatorio para inspirarte desde tu armario.</CardDescription>
              </CardHeader>
              <CardContent className="min-h-[200px] flex flex-col items-center justify-center">
                {stats.totalPrendas > 0 ? (
                  <>
                    <p className="text-muted-foreground text-center mb-4">No se pudo generar una sugerencia aleatoria en este momento.</p>
                    <Button onClick={handleRefreshSuggestion} variant="outline">
                        <RotateCcw className="mr-2 h-4 w-4" /> Intentar de nuevo
                    </Button>
                  </>
                 
                ) : (
                  <p className="text-muted-foreground text-center py-8">Agrega prendas a tu armario para recibir sugerencias.</p>
                )}
              </CardContent>
            </Card>
          )}
        </div>
        
        <div className="grid grid-cols-1 gap-8">
           <OptimizedOutfitSuggester availablePrendasForLookForm={availablePrendas} />
        </div>

      </main>
      <Footer />
    </div>
  );
}

    
