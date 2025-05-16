
// src/app/page.tsx (New Homepage - now the Dashboard)
'use client';

import * as React from 'react';
import { Navbar } from '@/components/ui/Navbar';
import { Footer } from '@/components/ui/Footer';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { ColorDistributionChart } from '@/components/dashboard/ColorDistributionChart';
import { OutfitSuggestion } from '@/components/OutfitSuggestion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Palette, Shirt, Sparkles, Loader2, AlertTriangle, LayoutGrid, CalendarClock } from 'lucide-react';
import type { SuggestedOutfit, StatisticsSummary, ColorFrequency } from '@/types';
import { getAISuggestionAction, getStatisticsSummaryAction, getColorDistributionStatsAction } from './actions';
import { useToast } from '@/hooks/use-toast';
import { NuevoPrompts } from '@/components/dashboard/nuevoprompts';
import { PromtOptimizado } from '@/components/dashboard/PromtOptimizado';
import { OptimizedOutfitSuggester } from '@/components/dashboard/OptimizedOutfitSuggester'; // Import the new component

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
  const [error, setError] = React.useState<string | null>(null);
  const { toast } = useToast();

  const fetchDashboardData = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const statsResult = await getStatisticsSummaryAction();
      if (statsResult.error || !statsResult.data) {
        console.warn("Error fetching stats summary:", statsResult.error);
        setStats(mockStatsSummary);
      } else {
        setStats(statsResult.data);
      }

      const colorsResult = await getColorDistributionStatsAction();
      if (colorsResult.error || !colorsResult.data) {
         console.warn("Error fetching color distribution:", colorsResult.error);
         setColorFrequency(mockColorFrequency);
      } else {
        setColorFrequency(colorsResult.data.length > 0 ? colorsResult.data : mockColorFrequency);
      }
      
      const totalPrendasForSuggestion = statsResult.data?.totalPrendas ?? 0;

      if (totalPrendasForSuggestion > 0) {
        const styles = ['casual', 'formal', 'sporty', 'bohemian'];
        const randomStyle = styles[Math.floor(Math.random() * styles.length)];
        const randomTempMin = Math.floor(Math.random() * 20) + 5;
        const randomTempMax = randomTempMin + Math.floor(Math.random() * 10) + 5;

        const suggestionResult = await getAISuggestionAction({
          temperature: [randomTempMin, randomTempMax],
          styleId: randomStyle,
          useClosetInfo: true,
        });
        if ('error' in suggestionResult) {
          console.warn("Error fetching random suggestion for dashboard:", suggestionResult.error);
          setRandomSuggestion(null);
        } else {
          setRandomSuggestion(suggestionResult);
        }
      } else {
        setRandomSuggestion(null);
      }

    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Error desconocido al cargar el dashboard.';
      setError(errorMessage);
      toast({ title: 'Error al cargar el dashboard', description: errorMessage, variant: 'destructive' });
    }
    setIsLoading(false);
  }, [toast]);

  React.useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

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

  if (error && !isLoading) {
     return (
      <div className="flex flex-col min-h-screen bg-background">
        <Navbar />
        <main className="flex-grow container mx-auto px-4 py-8">
           <div className="my-6 p-4 bg-destructive/10 border border-destructive/30 text-destructive rounded-lg flex items-center gap-3">
            <AlertTriangle className="h-6 w-6" />
            <div>
              <h3 className="font-semibold">Error al cargar el dashboard</h3>
              <p className="text-sm">{error}</p>
              <Button variant="link" onClick={fetchDashboardData} className="p-0 h-auto text-destructive mt-1">Intentar de nuevo</Button>
            </div>
          </div>
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

          <Card className="shadow-lg rounded-xl">
            <CardHeader>
              <CardTitle>Sugerencia Rápida AI</CardTitle>
              <CardDescription>Un look aleatorio para inspirarte desde tu armario.</CardDescription>
            </CardHeader>
            <CardContent>
              {randomSuggestion ? (
                <OutfitSuggestion suggestion={randomSuggestion} />
              ) : (
                 stats.totalPrendas > 0 ? 
                 <p className="text-muted-foreground text-center py-8">No se pudo generar una sugerencia aleatoria en este momento.</p>
                 : <p className="text-muted-foreground text-center py-8">Agrega prendas a tu armario para recibir sugerencias.</p>
              )}
            </CardContent>
          </Card>
        </div>
        
        <div className="grid grid-cols-1 gap-8">
           <OptimizedOutfitSuggester />
           <PromtOptimizado />
           {/* <NuevoPrompts suggestionForDisplay={randomSuggestion} />  Potentially redundant or can be merged */}
        </div>

      </main>
      <Footer />
    </div>
  );
}
