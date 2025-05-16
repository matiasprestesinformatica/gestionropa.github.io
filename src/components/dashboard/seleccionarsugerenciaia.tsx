
// src/components/dashboard/seleccionarsugerenciaia.tsx
'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { OutfitSuggestion } from '@/components/OutfitSuggestion';
import { ChangePrendaModal } from './ChangePrendaModal';
import { LookForm } from '@/components/looks/LookForm';
import type { SuggestedOutfit, OutfitItem, Prenda, TipoPrenda, LookFormData, Look } from '@/types';
import { getAlternativePrendasAction, addLookAction } from '@/app/actions'; 
import { useToast } from '@/hooks/use-toast';
import { Edit, Sparkles, Save } from 'lucide-react';


interface SeleccionarSugerenciaIAProps {
  initialSuggestion: SuggestedOutfit;
  originalTemperature: [number, number];
  originalStyleId: string;
  availablePrendas: Prenda[]; 
}

export function SeleccionarSugerenciaIA({
  initialSuggestion,
  originalTemperature,
  originalStyleId,
  availablePrendas,
}: SeleccionarSugerenciaIAProps) {
  const [currentOutfitItems, setCurrentOutfitItems] = React.useState<OutfitItem[]>(initialSuggestion.items);
  const [isChangeModalOpen, setIsChangeModalOpen] = React.useState(false);
  const [prendaToChangeCategory, setPrendaToChangeCategory] = React.useState<TipoPrenda | string | null>(null);
  const [currentPrendaIdToExclude, setCurrentPrendaIdToExclude] = React.useState<number | null>(null);
  const [alternativePrendas, setAlternativePrendas] = React.useState<Prenda[]>([]);
  const [isLoadingAlternatives, setIsLoadingAlternatives] = React.useState(false);
  
  const [isLookFormOpen, setIsLookFormOpen] = React.useState(false);

  const { toast } = useToast();

  React.useEffect(() => {
    setCurrentOutfitItems(initialSuggestion.items);
  }, [initialSuggestion]);

  const handleOpenChangeModal = async (itemToChange: OutfitItem) => {
    if (!itemToChange.category || !itemToChange.id) {
      toast({ title: "Error", description: "No se puede cambiar esta prenda, información incompleta.", variant: "destructive" });
      return;
    }
    setPrendaToChangeCategory(itemToChange.category as TipoPrenda);
    setCurrentPrendaIdToExclude(Number(itemToChange.id));
    setIsLoadingAlternatives(true);
    setIsChangeModalOpen(true);

    const result = await getAlternativePrendasAction({
      tipo: itemToChange.category as TipoPrenda,
      originalTemperature,
      originalStyleId,
      currentPrendaIdToExclude: Number(itemToChange.id),
    });

    if (result.error || !result.data) {
      toast({ title: "Error", description: result.error || "No se pudieron cargar alternativas.", variant: "destructive" });
      setAlternativePrendas([]);
    } else {
      setAlternativePrendas(result.data);
    }
    setIsLoadingAlternatives(false);
  };

  const handleAlternativeSelected = (selectedPrenda: Prenda) => {
    setCurrentOutfitItems((prevItems) =>
      prevItems.map((item) =>
        item.category === prendaToChangeCategory
          ? {
              id: selectedPrenda.id.toString(),
              name: selectedPrenda.nombre,
              imageUrl: selectedPrenda.imagen_url || `https://placehold.co/300x400.png?text=${encodeURIComponent(selectedPrenda.nombre)}`,
              category: selectedPrenda.tipo,
              color: selectedPrenda.color,
              aiHint: `${selectedPrenda.tipo.toLowerCase()} ${selectedPrenda.color.toLowerCase()}`.trim().substring(0,50) || selectedPrenda.nombre.toLowerCase(),
            }
          : item
      )
    );
    setIsChangeModalOpen(false);
  };

  const handleSaveLook = () => {
    setIsLookFormOpen(true);
  };
  
  const handleLookFormSubmit = async (data: LookFormData, lookId?: number): Promise<{ data?: Look; error?: string }> => {
    if (lookId) { 
      toast({ title: "Error", description: "Esta función es para crear nuevos looks, no para actualizar.", variant: "destructive" });
      return { error: "Actualización no permitida desde aquí." };
    }
    const result = await addLookAction(data); 
    return result;
  };

  const currentSuggestionForDisplay: SuggestedOutfit = {
    ...initialSuggestion, 
    items: currentOutfitItems,
  };

  return (
    <div className="mt-6">
      <Card className="shadow-xl rounded-xl border-primary/50">
        <CardHeader>
          <CardTitle className="flex items-center text-lg">
            <Sparkles className="mr-2 h-5 w-5 text-primary" />
            Tu Sugerencia Interactiva
          </CardTitle>
          <CardDescription>
            Puedes modificar las prendas sugeridas o guardar el conjunto como un nuevo Look.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <OutfitSuggestion suggestion={currentSuggestionForDisplay} />
          <div className="mt-6 flex flex-wrap gap-2 items-center justify-center border-t pt-4">
             {currentOutfitItems.map((item, index) => (
                <Button 
                    key={item.id + '-' + index} 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleOpenChangeModal(item)}
                    className="text-xs"
                    title={`Cambiar ${item.name}`}
                >
                    <Edit className="mr-1.5 h-3.5 w-3.5" /> Cambiar {item.category}
                </Button>
             ))}
          </div>
        </CardContent>
        <CardFooter className="border-t pt-4">
          <Button onClick={handleSaveLook} className="w-full" size="lg">
            <Save className="mr-2 h-5 w-5" /> Guardar como Look
          </Button>
        </CardFooter>
      </Card>

      {prendaToChangeCategory && (
        <ChangePrendaModal
          isOpen={isChangeModalOpen}
          onOpenChange={setIsChangeModalOpen}
          alternatives={alternativePrendas}
          isLoadingAlternatives={isLoadingAlternatives}
          onPrendaSelected={handleAlternativeSelected}
          prendaCategory={prendaToChangeCategory}
        />
      )}
      
      <LookForm
        isOpen={isLookFormOpen}
        onOpenChange={setIsLookFormOpen}
        onSubmit={handleLookFormSubmit}
        availablePrendas={availablePrendas}
        initialPrendaIds={currentOutfitItems.map(item => Number(item.id))}
        initialData={null} 
      />
    </div>
  );
}
