
// src/components/dashboard/OptimizedOutfitSuggester.tsx
'use client';

import * as React from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, AlertTriangle, Sparkles, Edit, Save } from 'lucide-react';
import type { SuggestedOutfit, OptimizedOutfitParams, OutfitItem, Prenda, TipoPrenda, PrendaColor, LookFormData } from '@/types';
import { styleOptions } from '@/components/StyleSelection';
import { generateOptimizedOutfitSuggestionAction, getAlternativePrendasAction, addLookAction } from '@/app/actions';
import { OutfitExplanation } from '@/components/OutfitExplanation';
import { ChangePrendaModal } from '@/components/dashboard/ChangePrendaModal';
import { LookForm } from '@/components/looks/LookForm';
import { ColorSwatch } from '@/components/ColorSwatch';
import { useToast } from '@/hooks/use-toast';

interface OptimizedOutfitSuggesterProps {
  availablePrendasForLookForm: Prenda[];
}

export function OptimizedOutfitSuggester({ availablePrendasForLookForm }: OptimizedOutfitSuggesterProps) {
  const [temperature, setTemperature] = React.useState<number | undefined>(20);
  const [ocasion, setOcasion] = React.useState<string>(styleOptions[0].id);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  
  const [suggestedOutfit, setSuggestedOutfit] = React.useState<SuggestedOutfit | null>(null);
  const [currentInteractiveOutfitItems, setCurrentInteractiveOutfitItems] = React.useState<OutfitItem[]>([]);

  const [isChangeModalOpen, setIsChangeModalOpen] = React.useState(false);
  const [prendaToChange, setPrendaToChange] = React.useState<OutfitItem | null>(null);
  const [prendaToChangeCategory, setPrendaToChangeCategory] = React.useState<TipoPrenda | null>(null);
  const [alternatives, setAlternatives] = React.useState<Prenda[]>([]);
  const [isLoadingAlternatives, setIsLoadingAlternatives] = React.useState(false);
  
  const [isLookFormOpen, setIsLookFormOpen] = React.useState(false);
  const { toast } = useToast();

  const handleGetSuggestion = async () => {
    if (temperature === undefined) {
      toast({ title: "Error de Validación", description: "Por favor, ingresa una temperatura.", variant: "destructive" });
      return;
    }
    if (!ocasion) {
      toast({ title: "Error de Validación", description: "Por favor, selecciona una ocasión.", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuggestedOutfit(null);
    setCurrentInteractiveOutfitItems([]);

    const params: OptimizedOutfitParams = { temperature, ocasion };
    const result = await generateOptimizedOutfitSuggestionAction(params);

    if (result.error) {
      setError(result.error);
      toast({ title: "Error al Generar Sugerencia", description: result.error, variant: "destructive" });
    } else {
      setSuggestedOutfit(result);
      setCurrentInteractiveOutfitItems(result.items || []);
    }
    setIsLoading(false);
  };

  const handleOpenChangeModal = async (itemToChange: OutfitItem) => {
    if (temperature === undefined) {
        toast({ title: "Error", description: "Se necesita la temperatura original para buscar alternativas.", variant: "destructive"});
        return;
    }
    setPrendaToChange(itemToChange);
    setPrendaToChangeCategory(itemToChange.category as TipoPrenda);
    setIsLoadingAlternatives(true);
    setIsChangeModalOpen(true);
    
    const result = await getAlternativePrendasAction({
      tipo: itemToChange.category as TipoPrenda,
      temperature: [temperature - 5, temperature + 5], // Using a range around the specified temp
      styleId: ocasion, // Using 'ocasion' as styleId for alternatives
      currentPrendaId: parseInt(itemToChange.id, 10)
    });
    
    if (result.error || !result.data) {
      toast({ title: "Error", description: result.error || "No se pudieron cargar prendas alternativas.", variant: "destructive" });
      setAlternatives([]);
    } else {
      setAlternatives(result.data);
    }
    setIsLoadingAlternatives(false);
  };

  const handleAlternativeSelected = (selectedPrenda: Prenda) => {
    if (!prendaToChange) return;

    const newOutfitItem: OutfitItem = {
      id: selectedPrenda.id.toString(),
      name: selectedPrenda.nombre,
      imageUrl: selectedPrenda.imagen_url || `https://placehold.co/300x400.png?text=${encodeURIComponent(selectedPrenda.nombre)}`,
      category: selectedPrenda.tipo,
      color: selectedPrenda.color,
      aiHint: `${selectedPrenda.tipo.toLowerCase()} ${selectedPrenda.color ? selectedPrenda.color.toLowerCase() : ''}`.trim().substring(0,50) || selectedPrenda.nombre.toLowerCase(),
    };

    setCurrentInteractiveOutfitItems(prevItems =>
      prevItems.map(item => (item.id === prendaToChange.id ? newOutfitItem : item))
    );
    setIsChangeModalOpen(false);
    setPrendaToChange(null);
    setPrendaToChangeCategory(null);
    setAlternatives([]);
  };

  const handleOpenLookForm = () => {
    if (currentInteractiveOutfitItems.length === 0) {
      toast({ title: "Error", description: "No hay prendas en la sugerencia actual para guardar.", variant: "destructive"});
      return;
    }
    setIsLookFormOpen(true);
  };
  
  const handleLookFormSubmit = async (data: LookFormData, lookId?: number) => {
    const result = await addLookAction(data); 
    if (result.error) {
      toast({ title: 'Error al Guardar Look', description: result.error, variant: 'destructive' });
    } else {
      toast({ title: 'Look Guardado', description: `El look "${result.data?.nombre}" ha sido guardado con éxito.` });
      setIsLookFormOpen(false);
    }
    return result;
  };

  const outfitColors = Array.from(new Set(currentInteractiveOutfitItems.map(item => item.color).filter(Boolean) as PrendaColor[]));

  return (
    <Card className="shadow-lg rounded-xl">
      <CardHeader>
        <CardTitle className="flex items-center text-xl font-semibold">
          <Sparkles className="mr-3 h-6 w-6 text-primary" />
          Sugerencia de Atuendo Optimizado
        </CardTitle>
        <CardDescription>
          Genera un conjunto completo de tu armario basado en la temperatura y ocasión, con armonía de colores.
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
            <Label htmlFor="opt-ocasion">Ocasión</Label>
            <Select value={ocasion} onValueChange={(value) => setOcasion(value)}>
              <SelectTrigger id="opt-ocasion">
                <SelectValue placeholder="Selecciona una ocasión" />
              </SelectTrigger>
              <SelectContent>
                {styleOptions.map(opt => (
                  <SelectItem key={opt.id} value={opt.id}>{opt.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button
          onClick={handleGetSuggestion}
          disabled={isLoading || temperature === undefined || !ocasion}
          className="w-full py-3 text-lg font-semibold"
          size="lg"
        >
          {isLoading ? (
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          ) : (
            'Obtener Sugerencia Optimizada'
          )}
        </Button>

        {error && !isLoading && (
          <div className="mt-4 p-3 bg-destructive/10 border border-destructive/30 text-destructive rounded-md flex items-center gap-2 text-sm">
            <AlertTriangle className="h-5 w-5" />
            <p>{error}</p>
          </div>
        )}

        {currentInteractiveOutfitItems.length > 0 && (
          <div className="mt-6 space-y-4">
            <h3 className="text-lg font-semibold mb-2 text-center text-foreground">Tu Atuendo Sugerido:</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {currentInteractiveOutfitItems.map((item) => (
                <Card key={`${item.id}-interactive`} className="overflow-hidden shadow-sm hover:shadow-md transition-shadow rounded-lg flex flex-col group">
                  <div className="aspect-[3/4] relative w-full bg-muted">
                    <Image
                      src={item.imageUrl}
                      alt={item.name}
                      fill={true}
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                      data-ai-hint={item.aiHint}
                    />
                  </div>
                  <CardContent className="p-2 text-center flex-grow flex flex-col justify-between">
                    <div>
                      <p className="text-xs sm:text-sm font-semibold truncate" title={item.name}>{item.name}</p>
                      <p className="text-xs text-muted-foreground mb-1">{item.category}</p>
                      {item.color && <ColorSwatch colorName={item.color as PrendaColor} className="mt-1 justify-center text-xs" />}
                    </div>
                  </CardContent>
                  <CardFooter className="p-2 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full text-xs"
                      onClick={() => handleOpenChangeModal(item)}
                    >
                      <Edit className="mr-1.5 h-3 w-3" /> Cambiar
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
            {outfitColors.length > 0 && (
                <div className="mt-4 pt-4 border-t">
                  <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center">
                    Paleta de Colores:
                  </h4>
                  <div className="flex flex-wrap gap-x-3 gap-y-1">
                    {outfitColors.map(color => <ColorSwatch key={color} colorName={color} />)}
                  </div>
                </div>
            )}
            {suggestedOutfit?.explanation && (
              <OutfitExplanation explanation={suggestedOutfit.explanation} />
            )}
            <Button
              onClick={handleOpenLookForm}
              className="w-full mt-4"
              size="lg"
              disabled={currentInteractiveOutfitItems.length === 0}
            >
              <Save className="mr-2 h-5 w-5" /> Guardar como Look
            </Button>
          </div>
        )}
      </CardContent>
      {prendaToChangeCategory && (
        <ChangePrendaModal
          isOpen={isChangeModalOpen}
          onOpenChange={setIsChangeModalOpen}
          alternatives={alternatives}
          onPrendaSelected={handleAlternativeSelected}
          category={prendaToChangeCategory}
          isLoading={isLoadingAlternatives}
        />
      )}
      
      <LookForm
        isOpen={isLookFormOpen}
        onOpenChange={setIsLookFormOpen}
        onSubmit={handleLookFormSubmit}
        initialData={null} 
        availablePrendas={availablePrendasForLookForm}
        initialPrendaIds={currentInteractiveOutfitItems.map(item => parseInt(item.id))}
      />
    </Card>
  );
}
