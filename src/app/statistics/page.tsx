
// src/app/statistics/page.tsx
'use client';

import * as React from 'react';
import { Navbar } from '@/components/ui/Navbar';
import { Footer } from '@/components/ui/Footer';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { ColorDistributionChart } from '@/components/dashboard/ColorDistributionChart';
import { StyleUsageChart } from '@/components/statistics/StyleUsageChart';
import { TimeActivityChart } from '@/components/statistics/TimeActivityChart';
import { IntelligentInsightCard } from '@/components/statistics/IntelligentInsightCard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, TrendingUp, Palette, BarChart3, Users, CalendarClock, AlertTriangle, Shirt, Sparkles, LayoutGrid } from 'lucide-react';
import type { StatisticsSummary, ColorFrequency, StyleUsageStat, TimeActivityStat, IntelligentInsightData } from '@/types';
import { 
  getStatisticsSummaryAction, 
  getColorDistributionStatsAction, 
  getStyleUsageStatsAction, 
  getTimeActivityStatsAction,
  getIntelligentInsightDataAction
} from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';

export default function StatisticsPage() {
  const [summary, setSummary] = React.useState<StatisticsSummary | null>(null);
  const [colorData, setColorData] = React.useState<ColorFrequency[]>([]);
  const [styleData, setStyleData] = React.useState<StyleUsageStat[]>([]);
  const [activityData, setActivityData] = React.useState<TimeActivityStat[]>([]);
  const [insightData, setInsightData] = React.useState<IntelligentInsightData | null>(null);
  
  const [isLoadingSummary, setIsLoadingSummary] = React.useState(true);
  const [isLoadingColors, setIsLoadingColors] = React.useState(true);
  const [isLoadingStyles, setIsLoadingStyles] = React.useState(true);
  const [isLoadingActivity, setIsLoadingActivity] = React.useState(true);
  const [isLoadingInsight, setIsLoadingInsight] = React.useState(true);

  const [error, setError] = React.useState<string | null>(null);
  const { toast } = useToast();

  const fetchData = React.useCallback(async () => {
    setIsLoadingSummary(true);
    setIsLoadingColors(true);
    setIsLoadingStyles(true);
    setIsLoadingActivity(true);
    setIsLoadingInsight(true);
    setError(null);

    try {
      const [summaryRes, colorsRes, stylesRes, activityRes, insightRes] = await Promise.all([
        getStatisticsSummaryAction(),
        getColorDistributionStatsAction(),
        getStyleUsageStatsAction(),
        getTimeActivityStatsAction(),
        getIntelligentInsightDataAction()
      ]);

      if (summaryRes.error) throw new Error(`Resumen: ${summaryRes.error}`);
      setSummary(summaryRes.data || null);
      setIsLoadingSummary(false);

      if (colorsRes.error) throw new Error(`Colores: ${colorsRes.error}`);
      setColorData(colorsRes.data || []);
      setIsLoadingColors(false);
      
      if (stylesRes.error) throw new Error(`Estilos: ${stylesRes.error}`);
      setStyleData(stylesRes.data || []);
      setIsLoadingStyles(false);

      if (activityRes.error) throw new Error(`Actividad: ${activityRes.error}`);
      setActivityData(activityRes.data || []);
      setIsLoadingActivity(false);

      if (insightRes.error) throw new Error(`Insight: ${insightRes.error}`);
      setInsightData(insightRes.data || null);
      setIsLoadingInsight(false);

    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : "Error desconocido al cargar estadísticas.";
      setError(errorMessage);
      toast({ title: 'Error al Cargar Estadísticas', description: errorMessage, variant: 'destructive' });
      setIsLoadingSummary(false);
      setIsLoadingColors(false);
      setIsLoadingStyles(false);
      setIsLoadingActivity(false);
      setIsLoadingInsight(false);
    }
  }, [toast]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  const renderLoadingError = (sectionError: string | null) => (
    <div className="my-6 p-4 bg-destructive/10 border border-destructive/30 text-destructive rounded-lg flex items-center gap-3">
      <AlertTriangle className="h-6 w-6" />
      <div>
        <h3 className="font-semibold">Error al cargar esta sección</h3>
        <p className="text-sm">{sectionError || "Ocurrió un error."}</p>
      </div>
    </div>
  );
  
  if (isLoadingSummary && isLoadingColors && isLoadingStyles && isLoadingActivity && isLoadingInsight && !error) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <Navbar />
        <main className="flex-grow container mx-auto px-4 py-8 flex justify-center items-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="ml-4 text-lg text-muted-foreground">Cargando estadísticas...</p>
        </main>
        <Footer />
      </div>
    );
  }
  
  if (error && !summary && !colorData.length && !styleData.length && !activityData.length) {
     return (
      <div className="flex flex-col min-h-screen bg-background">
        <Navbar />
        <main className="flex-grow container mx-auto px-4 py-8">
           {renderLoadingError(error)}
           <div className="text-center mt-4">
                <Button onClick={fetchData} variant="outline">
                    <TrendingUp className="mr-2 h-4 w-4"/>Intentar de Nuevo
                </Button>
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
        <div className="flex flex-col sm:flex-row justify-between items-center mb-2 gap-4">
            <div>
                <h1 className="text-3xl font-bold text-foreground">Estadísticas de tu Armario</h1>
                <p className="text-muted-foreground">Conocé tu estilo y uso de ropa.</p>
            </div>
            {/* <Button variant="outline" disabled> <Download className="mr-2 h-4 w-4"/> Exportar (Próximamente)</Button> */}
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatsCard title="Total de Prendas" value={summary?.totalPrendas?.toString() ?? '0'} icon={Shirt} description="Prendas activas" isLoading={isLoadingSummary} />
          <StatsCard title="Looks Guardados" value={summary?.totalLooks?.toString() ?? '0'} icon={Sparkles} description="Combinaciones creadas" isLoading={isLoadingSummary}/>
          <StatsCard title="Estilos Diferentes" value={summary?.prendasPorEstiloCount?.toString() ?? '0'} icon={LayoutGrid} description="En tus prendas activas" isLoading={isLoadingSummary}/>
          <StatsCard title="Looks Usados (Mes)" value={summary?.looksUsadosEsteMes?.toString() ?? '0'} icon={CalendarClock} description="Asignaciones en calendario" isLoading={isLoadingSummary}/>
        </div>
        
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {/* Color Distribution */}
          <Card className="shadow-lg rounded-xl lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Palette className="mr-2 h-5 w-5 text-primary" />
                Distribución de Colores
              </CardTitle>
              <CardDescription>Colores más frecuentes en tus prendas.</CardDescription>
            </CardHeader>
            <CardContent>
              <ColorDistributionChart data={colorData} isLoading={isLoadingColors} error={isLoadingColors && error ? error : undefined} />
            </CardContent>
          </Card>

          {/* Style Usage */}
          <Card className="shadow-lg rounded-xl lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="mr-2 h-5 w-5 text-primary" />
                Uso de Estilos
              </CardTitle>
              <CardDescription>Cantidad de prendas por cada estilo.</CardDescription>
            </CardHeader>
            <CardContent>
              <StyleUsageChart data={styleData} isLoading={isLoadingStyles} error={isLoadingStyles && error ? error : undefined} />
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-8 md:grid-cols-1">
            {/* Time Activity */}
            <Card className="shadow-lg rounded-xl">
                <CardHeader>
                <CardTitle className="flex items-center">
                    <TrendingUp className="mr-2 h-5 w-5 text-primary" />
                    Actividad en el Tiempo
                </CardTitle>
                <CardDescription>Prendas o looks asignados en los últimos meses.</CardDescription>
                </CardHeader>
                <CardContent>
                <TimeActivityChart data={activityData} isLoading={isLoadingActivity} error={isLoadingActivity && error ? error : undefined}/>
                </CardContent>
            </Card>
        </div>
        
        <IntelligentInsightCard data={insightData} isLoading={isLoadingInsight} error={isLoadingInsight && error ? error : undefined} />

      </main>
      <Footer />
    </div>
  );
}
