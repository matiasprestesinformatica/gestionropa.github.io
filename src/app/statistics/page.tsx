
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
  const [summaryError, setSummaryError] = React.useState<string | null>(null);
  
  const [isLoadingColors, setIsLoadingColors] = React.useState(true);
  const [colorsError, setColorsError] = React.useState<string | null>(null);
  
  const [isLoadingStyles, setIsLoadingStyles] = React.useState(true);
  const [stylesError, setStylesError] = React.useState<string | null>(null);
  
  const [isLoadingActivity, setIsLoadingActivity] = React.useState(true);
  const [activityError, setActivityError] = React.useState<string | null>(null);
  
  const [isLoadingInsight, setIsLoadingInsight] = React.useState(true);
  const [insightError, setInsightError] = React.useState<string | null>(null);

  const [isInitialLoading, setIsInitialLoading] = React.useState(true);
  const [initialError, setInitialError] = React.useState<string | null>(null);

  const { toast } = useToast();

  const fetchData = React.useCallback(async () => {
    setIsLoadingSummary(true);
    setSummaryError(null);
    setIsLoadingColors(true);
    setColorsError(null);
    setIsLoadingStyles(true);
    setStylesError(null);
    setIsLoadingActivity(true);
    setActivityError(null);
    setIsLoadingInsight(true);
    setInsightError(null);
    setInitialError(null);
    setIsInitialLoading(true);

    try {
      const results = await Promise.allSettled([
        getStatisticsSummaryAction(),
        getColorDistributionStatsAction(),
        getStyleUsageStatsAction(),
        getTimeActivityStatsAction(),
        getIntelligentInsightDataAction()
      ]);

      const [summaryRes, colorsRes, stylesRes, activityRes, insightRes] = results;

      if (summaryRes.status === 'fulfilled') {
        if (summaryRes.value.error) {
          setSummaryError(summaryRes.value.error);
          toast({ title: 'Error Resumen', description: summaryRes.value.error, variant: 'destructive' });
        } else {
          setSummary(summaryRes.value.data || null);
        }
      } else {
        setSummaryError(summaryRes.reason?.message || "Error desconocido al cargar resumen.");
        toast({ title: 'Error Resumen', description: summaryRes.reason?.message || "Error desconocido", variant: 'destructive' });
      }
      setIsLoadingSummary(false);

      if (colorsRes.status === 'fulfilled') {
        if (colorsRes.value.error) {
          setColorsError(colorsRes.value.error);
          toast({ title: 'Error Colores', description: colorsRes.value.error, variant: 'destructive' });
        } else {
          setColorData(colorsRes.value.data || []);
        }
      } else {
        setColorsError(colorsRes.reason?.message || "Error desconocido al cargar colores.");
        toast({ title: 'Error Colores', description: colorsRes.reason?.message || "Error desconocido", variant: 'destructive' });
      }
      setIsLoadingColors(false);
      
      if (stylesRes.status === 'fulfilled') {
        if (stylesRes.value.error) {
          setStylesError(stylesRes.value.error);
          toast({ title: 'Error Estilos', description: stylesRes.value.error, variant: 'destructive' });
        } else {
          setStyleData(stylesRes.value.data || []);
        }
      } else {
        setStylesError(stylesRes.reason?.message || "Error desconocido al cargar estilos.");
        toast({ title: 'Error Estilos', description: stylesRes.reason?.message || "Error desconocido", variant: 'destructive' });
      }
      setIsLoadingStyles(false);

      if (activityRes.status === 'fulfilled') {
        if (activityRes.value.error) {
          setActivityError(activityRes.value.error);
           toast({ title: 'Error Actividad', description: activityRes.value.error, variant: 'destructive' });
        } else {
          setActivityData(activityRes.value.data || []);
        }
      } else {
        setActivityError(activityRes.reason?.message || "Error desconocido al cargar actividad.");
        toast({ title: 'Error Actividad', description: activityRes.reason?.message || "Error desconocido", variant: 'destructive' });
      }
      setIsLoadingActivity(false);

      if (insightRes.status === 'fulfilled') {
        if (insightRes.value.error) {
          setInsightError(insightRes.value.error);
          toast({ title: 'Error Insights', description: insightRes.value.error, variant: 'destructive' });
        } else {
          setInsightData(insightRes.value.data || null);
        }
      } else {
        setInsightError(insightRes.reason?.message || "Error desconocido al cargar insights.");
         toast({ title: 'Error Insights', description: insightRes.reason?.message || "Error desconocido", variant: 'destructive' });
      }
      setIsLoadingInsight(false);

      // Check if all initial fetches failed
      const allFailed = results.every(r => r.status === 'rejected' || (r.status === 'fulfilled' && r.value.error));
      if (allFailed) {
        setInitialError("No se pudieron cargar los datos de estadísticas. Inténtalo de nuevo.");
      }

    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : "Error general al cargar estadísticas.";
      setInitialError(errorMessage);
      toast({ title: 'Error General', description: errorMessage, variant: 'destructive' });
    } finally {
        setIsInitialLoading(false);
    }
  }, [toast]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  const renderLoadingError = (sectionError: string | null, sectionName: string) => (
    <div className="my-6 p-4 bg-destructive/10 border border-destructive/30 text-destructive rounded-lg flex items-center gap-3">
      <AlertTriangle className="h-6 w-6" />
      <div>
        <h3 className="font-semibold">Error al cargar {sectionName}</h3>
        <p className="text-sm">{sectionError || "Ocurrió un error."}</p>
      </div>
    </div>
  );
  
  if (isInitialLoading && !initialError) {
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
  
  if (initialError) {
     return (
      <div className="flex flex-col min-h-screen bg-background">
        <Navbar />
        <main className="flex-grow container mx-auto px-4 py-8">
           {renderLoadingError(initialError, "las estadísticas")}
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
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatsCard title="Total de Prendas" value={summary?.totalPrendas?.toString() ?? '0'} icon={Shirt} description="Prendas activas" isLoading={isLoadingSummary} />
          <StatsCard title="Looks Guardados" value={summary?.totalLooks?.toString() ?? '0'} icon={Sparkles} description="Combinaciones creadas" isLoading={isLoadingSummary}/>
          <StatsCard title="Estilos Diferentes" value={summary?.prendasPorEstiloCount?.toString() ?? '0'} icon={LayoutGrid} description="En tus prendas activas" isLoading={isLoadingSummary}/>
          <StatsCard title="Looks Usados (Mes)" value={summary?.looksUsadosEsteMes?.toString() ?? '0'} icon={CalendarClock} description="Asignaciones en calendario" isLoading={isLoadingSummary}/>
        </div>
        {summaryError && renderLoadingError(summaryError, "el resumen")}
        
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
              <ColorDistributionChart data={colorData} />
               {isLoadingColors && !colorsError && <div className="flex justify-center items-center h-40"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}
               {colorsError && renderLoadingError(colorsError, "la distribución de colores")}
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
              <StyleUsageChart data={styleData} />
              {isLoadingStyles && !stylesError && <div className="flex justify-center items-center h-40"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}
              {stylesError && renderLoadingError(stylesError, "el uso de estilos")}
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
                <TimeActivityChart data={activityData} />
                {isLoadingActivity && !activityError && <div className="flex justify-center items-center h-40"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}
                {activityError && renderLoadingError(activityError, "la actividad en el tiempo")}
                </CardContent>
            </Card>
        </div>
        
        <IntelligentInsightCard data={insightData} isLoading={isLoadingInsight} error={insightError} />

      </main>
      <Footer />
    </div>
  );
}
