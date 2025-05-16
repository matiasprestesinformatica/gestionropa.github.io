
// src/components/dashboard/SeleccionarSugerencias.tsx
'use client';

import * as React from 'react';
import type { SuggestedOutfit, OutfitItem, Prenda, TipoPrenda, PrendaColor, LookFormData } from '@/types';
import { getAlternativePrendasAction, addLookAction } from '@/app/actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';
import { ChangePrendaModal } from '@/components/dashboard/ChangePrendaModal';
import { LookForm } from '@/components/looks/LookForm';
import { useToast } from '@/hooks/use-toast';
import { Edit, Sparkles, Save, Loader2 } from 'lucide-react';
import { ColorSwatch } from '@/components/ColorSwatch';
// Removed OutfitSuggestion import as this component will now render the items directly for interactivity

interface SeleccionarSugerenciasProps {
  initialSuggestion: SuggestedOutfit;
  originalTemperature: [number, number];
  originalStyleId: string;
  availablePrendasForLookForm: Prenda[];
}

export function SeleccionarSugerencias({
  initialSuggestion,
  originalTemperature,
  originalStyleId,
  availablePrendasForLookForm,
}: SeleccionarSugerenciasProps) {
  const [currentOutfitItems, setCurrentOutfitItems] = React.useState<OutfitItem[]>(initialSuggestion.items);
  const [isChangeModalOpen, setIsChangeModalOpen] = React.useState(false);
  const [prendaToChange, setPrendaToChange] = React.useState<OutfitItem | null>(null);
  const [prendaToChangeCategory, setPrendaToChangeCategory] = React.useState<TipoPrenda | null>(null);
  const [alternatives, setAlternatives] = React.useState<Prenda[]>([]);
  const [isLoadingAlternatives, setIsLoadingAlternatives] = React.useState(false);
  
  const [isLookFormOpen, setIsLookFormOpen] = React.useState(false);
  const { toast } = useToast();

  React.useEffect(() => {
    setCurrentOutfitItems(initialSuggestion.items);
  }, [initialSuggestion]);

  const handleOpenChangeModal = async (itemToChange: OutfitItem) => {
    setPrendaToChange(itemToChange);
    setPrendaToChangeCategory(itemToChange.category as TipoPrenda);
    setIsLoadingAlternatives(true);
    setIsChangeModalOpen(true);
    
    const result = await getAlternativePrendasAction({
      tipo: itemToChange.category as TipoPrenda,
      temperature: originalTemperature,
      styleId: originalStyleId,
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

    setCurrentOutfitItems(prevItems =>
      prevItems.map(item => (item.id === prendaToChange.id ? newOutfitItem : item))
    );
    setIsChangeModalOpen(false);
    setPrendaToChange(null);
    setPrendaToChangeCategory(null);
    setAlternatives([]);
  };

  const handleOpenLookForm = () => {
    setIsLookFormOpen(true);
  };
  
  const handleLookFormSubmit = async (data: LookFormData, lookId?: number) => {
    const result = await addLookAction(data); 
    if (result.error) {
      toast({ title: 'Error al Guardar Look', description: result.error, variant: 'destructive' });
    } else {
      toast({ title: 'Look Guardado', description: `El look "${result.data?.nombre}" ha sido guardado.` });
      setIsLookFormOpen(false);
    }
    return result;
  };

  if (!currentOutfitItems || currentOutfitItems.length === 0) {
    return (
      <Card className="shadow-lg rounded-xl mt-6">
        <CardHeader>
          <CardTitle>Sugerencia de Atuendo</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center">No hay sugerencia disponible.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg rounded-xl mt-6">
      <CardHeader>
        <CardTitle className="flex items-center text-xl font-semibold">
          <Sparkles className="mr-2 h-6 w-6 text-primary" />
          Tu Atuendo Sugerido
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
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
              <CardFooter className="p-2 sm:p-3 flex flex-col items-start flex-grow">
                <div className="flex-grow w-full">
                  <p className="font-semibold text-xs sm:text-sm text-foreground truncate" title={item.name}>{item.name}</p>
                  <p className="text-xs text-muted-foreground mb-1">{item.category}</p>
                  {item.color && <ColorSwatch colorName={item.color as PrendaColor} className="text-xs" />}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full mt-2 text-xs"
                  onClick={() => handleOpenChangeModal(item)}
                >
                  <Edit className="mr-1.5 h-3 w-3" /> Cambiar
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
        
        <Button
          onClick={handleOpenLookForm}
          className="w-full sm:w-auto"
          size="lg"
          disabled={currentOutfitItems.length === 0}
        >
          <Save className="mr-2 h-5 w-5" /> Guardar como Look
        </Button>
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
        initialData={null} // Always creating a new look from this component
        availablePrendas={availablePrendasForLookForm}
        initialPrendaIds={currentOutfitItems.map(item => parseInt(item.id))}
      />
    </Card>
  );
}
