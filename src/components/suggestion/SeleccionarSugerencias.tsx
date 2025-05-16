
// src/components/suggestion/SeleccionarSugerencias.tsx
'use client';

import * as React from 'react';
import Image from 'next/image';
import type { SuggestedOutfit, OutfitItem, Prenda, TipoPrenda, PrendaColor, LookFormData } from '@/types';
import { getAlternativePrendasAction, addLookAction } from '@/app/actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ChangePrendaModal } from '@/components/dashboard/ChangePrendaModal'; // Assuming this stays in dashboard or is moved
import { LookForm } from '@/components/looks/LookForm';
import { useToast } from '@/hooks/use-toast';
import { Edit, Sparkles, Save, Loader2, RotateCcw } from 'lucide-react';
import { ColorSwatch } from '@/components/ColorSwatch';
import { OutfitExplanation } from '@/components/OutfitExplanation';

interface SeleccionarSugerenciasProps {
  initialSuggestion: SuggestedOutfit;
  originalTemperature: [number, number] | null;
  originalStyleId: string | null;
  availablePrendasForLookForm: Prenda[];
  onSuggestionRefresh?: () => void; // Optional: to re-trigger suggestion fetch
}

export function SeleccionarSugerencias({
  initialSuggestion,
  originalTemperature,
  originalStyleId,
  availablePrendasForLookForm,
  onSuggestionRefresh,
}: SeleccionarSugerenciasProps) {
  const [currentOutfitItems, setCurrentOutfitItems] = React.useState<OutfitItem[]>(initialSuggestion.items);
  const [currentExplanation, setCurrentExplanation] = React.useState<string>(initialSuggestion.explanation);
  
  const [isChangeModalOpen, setIsChangeModalOpen] = React.useState(false);
  const [prendaToChange, setPrendaToChange] = React.useState<OutfitItem | null>(null);
  const [prendaToChangeCategory, setPrendaToChangeCategory] = React.useState<TipoPrenda | null>(null);
  const [alternatives, setAlternatives] = React.useState<Prenda[]>([]);
  const [isLoadingAlternatives, setIsLoadingAlternatives] = React.useState(false);
  
  const [isLookFormOpen, setIsLookFormOpen] = React.useState(false);
  const { toast } = useToast();

  React.useEffect(() => {
    setCurrentOutfitItems(initialSuggestion.items);
    setCurrentExplanation(initialSuggestion.explanation);
  }, [initialSuggestion]);

  const handleOpenChangeModal = async (itemToChange: OutfitItem) => {
    if (!originalTemperature || !originalStyleId) {
        toast({ title: "Error", description: "Falta información original de la sugerencia (temperatura/estilo).", variant: "destructive"});
        return;
    }
    setPrendaToChange(itemToChange);
    setPrendaToChangeCategory(itemToChange.category as TipoPrenda);
    setIsLoadingAlternatives(true);
    setIsChangeModalOpen(true);
    
    const result = await getAlternativePrendasAction({
      tipo: itemToChange.category as TipoPrenda,
      temperature: originalTemperature,
      styleId: originalStyleId,
      currentPrendaId: parseInt(itemToChange.id, 10) // Ensure ID is number
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

    setCurrentOutfitItems(prevItems =>
      prevItems.map(item => (item.id === prendaToChange.id ? newOutfitItem : item))
    );
    // Note: Re-generating explanation after item change could be a future enhancement
    // For now, the original explanation remains.
    setIsChangeModalOpen(false);
    setPrendaToChange(null);
    setPrendaToChangeCategory(null);
    setAlternatives([]);
  };

  const handleOpenLookForm = () => {
    if (currentOutfitItems.length === 0) {
      toast({ title: "Error", description: "No hay prendas en la sugerencia actual para guardar.", variant: "destructive"});
      return;
    }
    setIsLookFormOpen(true);
  };
  
  const handleLookFormSubmit = async (data: LookFormData, lookId?: number) => {
    // This component only handles adding new looks from suggestions
    if (lookId) { 
        toast({title: "Información", description: "La edición de looks se realiza desde la página 'Mis Looks'.", variant: "default"});
        return { error: "Edición no soportada aquí."};
    }
    const result = await addLookAction(data); 
    if (result.error) {
      toast({ title: 'Error al Guardar Look', description: result.error, variant: 'destructive' });
    } else {
      toast({ title: 'Look Guardado', description: `El look "${result.data?.nombre}" ha sido guardado con éxito.` });
      setIsLookFormOpen(false);
    }
    return result;
  };

  const outfitColors = Array.from(new Set(currentOutfitItems.map(item => item.color).filter(Boolean) as PrendaColor[]));

  return (
    <Card className="shadow-lg rounded-xl">
      <CardHeader>
        <div className="flex justify-between items-center">
            <CardTitle className="flex items-center text-xl font-semibold">
                <Sparkles className="mr-2 h-6 w-6 text-primary" />
                Sugerencia de Atuendo Rápida
            </CardTitle>
            {onSuggestionRefresh && (
                <Button variant="outline" size="icon" onClick={onSuggestionRefresh} title="Obtener nueva sugerencia aleatoria">
                    <RotateCcw className="h-4 w-4" />
                </Button>
            )}
        </div>
        <CardDescription>Un look aleatorio de tu armario. Puedes cambiar prendas o guardarlo.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {initialSuggestion.previewImageUrl && (
            <div className="mb-6 aspect-video relative w-full rounded-lg overflow-hidden shadow-md">
              <Image
                src={initialSuggestion.previewImageUrl}
                alt="Vista previa del atuendo generado"
                fill={true}
                sizes="100vw"
                className="object-cover"
                data-ai-hint="fashion outfit preview"
              />
            </div>
        )}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {currentOutfitItems.map((item) => (
            <Card key={item.id} className="overflow-hidden shadow-sm hover:shadow-md transition-shadow rounded-lg flex flex-col group">
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

        {currentExplanation && <OutfitExplanation explanation={currentExplanation} />}
        
      </CardContent>
      <CardFooter>
        <Button
          onClick={handleOpenLookForm}
          className="w-full sm:w-auto"
          size="lg"
          disabled={currentOutfitItems.length === 0}
        >
          <Save className="mr-2 h-5 w-5" /> Guardar como Look
        </Button>
      </CardFooter>

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
        initialData={null} // Always creating a new look from this component
        availablePrendas={availablePrendasForLookForm}
        initialPrendaIds={currentOutfitItems.map(item => parseInt(item.id))}
      />
    </Card>
  );
}

    