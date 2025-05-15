
// src/components/OutfitExplanation.tsx
'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TextQuote, Copy, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface OutfitExplanationProps {
  explanation: string;
}

export function OutfitExplanation({ explanation }: OutfitExplanationProps) {
  const { toast } = useToast();
  const [copied, setCopied] = React.useState(false);

  const handleCopyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(explanation);
      setCopied(true);
      toast({ title: 'Copiado', description: 'Explicación copiada al portapapeles.' });
      setTimeout(() => setCopied(false), 2000); // Reset icon after 2 seconds
    } catch (err) {
      console.error('Failed to copy text: ', err);
      toast({ title: 'Error', description: 'No se pudo copiar la explicación.', variant: 'destructive' });
    }
  };

  if (!explanation) {
    return null;
  }

  return (
    <Card className="shadow-lg rounded-xl bg-accent/30 border-accent mt-6">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="flex items-center text-lg font-semibold text-accent-foreground">
          <TextQuote className="mr-2 h-5 w-5 text-accent-foreground/80" />
          Análisis de Estilo IA
        </CardTitle>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleCopyToClipboard}
          className="h-8 w-8 text-accent-foreground/70 hover:text-accent-foreground hover:bg-accent/50"
          aria-label="Copiar explicación"
        >
          {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
        </Button>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-accent-foreground/90 leading-relaxed whitespace-pre-wrap">
          {explanation}
        </p>
      </CardContent>
    </Card>
  );
}
