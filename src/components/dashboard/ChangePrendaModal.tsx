
// src/components/dashboard/ChangePrendaModal.tsx
'use client';

import * as React from 'react';
import Image from 'next/image';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Loader2, XCircle } from 'lucide-react';
import type { Prenda, TipoPrenda } from '@/types';

interface ChangePrendaModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  alternatives: Prenda[];
  isLoadingAlternatives: boolean;
  onPrendaSelected: (prenda: Prenda) => void;
  prendaCategory: TipoPrenda | string;
}

export function ChangePrendaModal({
  isOpen,
  onOpenChange,
  alternatives,
  isLoadingAlternatives,
  onPrendaSelected,
  prendaCategory,
}: ChangePrendaModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] md:max-w-[700px] lg:max-w-[800px]">
        <DialogHeader>
          <DialogTitle>Cambiar Prenda: {prendaCategory}</DialogTitle>
          <DialogDescription>
            Selecciona una prenda alternativa de tu armario para la categoría &quot;{prendaCategory}&quot;.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          {isLoadingAlternatives ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="ml-3 text-muted-foreground">Buscando alternativas...</p>
            </div>
          ) : !alternatives || alternatives.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <XCircle className="mx-auto h-12 w-12 mb-3 opacity-50" />
              <p>No se encontraron prendas alternativas adecuadas en tu armario para esta categoría y criterios.</p>
            </div>
          ) : (
            <ScrollArea className="h-[60vh] pr-3">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {alternatives.map((prenda) => (
                  <Card
                    key={prenda.id}
                    onClick={() => {
                      onPrendaSelected(prenda);
                      onOpenChange(false); // Close modal on selection
                    }}
                    className="cursor-pointer hover:shadow-lg transition-shadow rounded-lg overflow-hidden group"
                  >
                    <CardContent className="p-0">
                      <div className="aspect-[3/4] relative w-full bg-muted">
                        <Image
                          src={prenda.imagen_url || `https://placehold.co/200x300.png?text=${encodeURIComponent(prenda.nombre.substring(0,2))}`}
                          alt={prenda.nombre}
                          fill
                          sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
                          className="object-cover transition-transform duration-200 group-hover:scale-105"
                          data-ai-hint={`${prenda.tipo.toLowerCase()} ${prenda.color.toLowerCase()}`.substring(0,50)}
                        />
                      </div>
                    </CardContent>
                    <CardFooter className="p-2 text-center block">
                      <p className="text-xs font-medium truncate" title={prenda.nombre}>
                        {prenda.nombre}
                      </p>
                      <p className="text-xs text-muted-foreground">{prenda.color}</p>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Cancelar
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
