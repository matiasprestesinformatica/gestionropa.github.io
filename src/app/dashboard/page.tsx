
// src/app/dashboard/page.tsx
'use client';

import * as React from 'react';
import { Navbar } from '@/components/ui/Navbar';
import { Footer } from '@/components/ui/Footer';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { ColorDistributionChart } from '@/components/dashboard/ColorDistributionChart';
import { OutfitSuggestion } from '@/components/OutfitSuggestion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Palette, Shirt, Sparkles, Loader2, AlertTriangle } from 'lucide-react';
import type { SuggestedOutfit, DashboardStats, ColorFrequency } from '@/types';
import { getAISuggestionAction, getPrendasAction } from '../actions'; // Adjusted import path
import { useToast } from '@/hooks/use-toast';

const mockDashboardStats: DashboardStats = {
  totalPrendas: 0,
  totalLooks: 0,
};

const mockColorFrequency: ColorFrequency[] = [
  { color: 'Azul', count: 0, fill: 'hsl(var(--chart-1))' },
  { color: 'Negro', count: 0, fill: 'hsl(var(--chart-2))' },
  { color: 'Blanco', count: 0, fill: 'hsl(var(--chart-3))' },
  { color: 'Gris', count: 0, fill: 'hsl(var(--chart-4))' },
  { color: 'Verde', count: 0, fill: 'hsl(var(--chart-5))' },
];

// This component now represents the content for the /dashboard route.
// The actual homepage (/) will have the same content.
export default function DashboardPage() { 
  const [stats, setStats] = React.useState<DashboardStats>(mockDashboardStats);
  const [colorFrequency, setColorFrequency] = React.useState<ColorFrequency[]>(mockColorFrequency);
  const [randomSuggestion, setRandomSuggestion] = React.useState<SuggestedOutfit | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const { toast } = useToast();

  const fetchDashboardData = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const prendasResult = await getPrendasAction();
      if (prendasResult.error || !prendasResult.data) {
        throw new Error(prendasResult.error || 'No se pudieron cargar las prendas.');
      }
      const prendas = prendasResult.data;

      const totalPrendas = prendas.length;
      setStats({ totalPrendas, totalLooks: 0 });

      const colorCounts: Record<string, number> = {};
      prendas.forEach(p => {
        if (p.color) {
          colorCounts[p.color] = (colorCounts[p.color] || 0) + 1;
        }
      });
      
      const chartColors = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];
      const sortedColors = Object.entries(colorCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([color, count], index) => ({ color, count, fill: chartColors[index % chartColors.length] }));
      setColorFrequency(sortedColors.length > 0 ? sortedColors : mockColorFrequency);

      if (prendas.length > 0) {
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
      const errorMessage = e instanceof Error ? e.message : 'Error desconocido';
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
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatsCard title="Total de Prendas" value={stats.totalPrendas.toString()} icon={Shirt} description="Prendas en tu armario" />
          <StatsCard title="Looks Guardados" value={stats.totalLooks.toString()} icon={Sparkles} description="Combinaciones creadas" />
          <StatsCard title="Tipos de Prenda" value="N/A" icon={FileText} description="Categorías distintas" />
          <StatsCard title="Colores Predominantes" value="N/A" icon={Palette} description="Diversidad de colores" />
        </div>
        
        <div className="grid gap-8 md:grid-cols-2">
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
              <CardTitle>Sugerencia Rápida</CardTitle>
              <CardDescription>Un look aleatorio para inspirarte.</CardDescription>
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
      </main>
      <Footer />
    </div>
  );
}
