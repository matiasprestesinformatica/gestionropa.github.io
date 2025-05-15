
// src/components/statistics/IntelligentInsightCard.tsx
'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Lightbulb, Sparkles, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import type { IntelligentInsightData } from '@/types';

interface IntelligentInsightCardProps {
  data?: IntelligentInsightData | null;
  isLoading?: boolean;
  error?: string | null;
}

export function IntelligentInsightCard({ data, isLoading, error }: IntelligentInsightCardProps) {
  if (isLoading) {
    return (
      <Card className="shadow-lg rounded-xl">
        <CardHeader>
          <CardTitle className="flex items-center text-lg">
            <Lightbulb className="mr-2 h-5 w-5 text-primary" />
            Análisis Inteligente
          </CardTitle>
        </CardHeader>
        <CardContent className="h-24 flex items-center justify-center">
          <p className="text-muted-foreground">Analizando tus datos...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="shadow-lg rounded-xl">
        <CardHeader>
          <CardTitle className="flex items-center text-lg">
            <Lightbulb className="mr-2 h-5 w-5 text-primary" />
            Análisis Inteligente
          </CardTitle>
        </CardHeader>
        <CardContent className="h-24 flex items-center justify-center">
          <p className="text-destructive">{error}</p>
        </CardContent>
      </Card>
    );
  }
  
  let insightMessage = "¡Sigue explorando tu estilo y registrando tus outfits!";
  let callToAction: React.ReactNode = null;

  if (data?.dominantStyle) {
    insightMessage = `Notamos que tu estilo predominante es '${data.dominantStyle.name}' (aproximadamente ${data.dominantStyle.percentage}% de tus prendas). ¡Es genial que tengas un estilo definido!`;
    callToAction = (
      <Link href="/sugerenciaia" passHref legacyBehavior>
        <Button variant="link" className="mt-2 p-0 h-auto text-primary">
          ¿Quizás explorar algunas sugerencias de otros estilos? <Sparkles className="ml-1 h-4 w-4" />
        </Button>
      </Link>
    );
  } else if (data && !data.dominantStyle) {
     insightMessage = "¡Tienes un armario muy variado! Tu estilo es diverso y eso te da mucha flexibilidad.";
     callToAction = (
      <Link href="/looks" passHref legacyBehavior>
        <Button variant="link" className="mt-2 p-0 h-auto text-primary">
          Crea nuevos looks para aprovechar tu versatilidad <TrendingUp className="ml-1 h-4 w-4" />
        </Button>
      </Link>
    );
  }


  return (
    <Card className="shadow-lg rounded-xl bg-accent/30 border-accent">
      <CardHeader>
        <CardTitle className="flex items-center text-lg">
          <Lightbulb className="mr-2 h-5 w-5 text-primary" />
          Análisis Inteligente
        </CardTitle>
        <CardDescription>Pequeñas ideas basadas en tu armario.</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-accent-foreground/90">{insightMessage}</p>
        {callToAction}
      </CardContent>
    </Card>
  );
}
