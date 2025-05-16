
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
import type { Prenda, TipoPrenda, PrendaColor } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, XCircle } from 'lucide-react';
import { ColorSwatch } from '@/components/ColorSwatch';

interface ChangePrendaModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  alternatives: Prenda[];
  onPrendaSelected: (prenda: Prenda) => void;
  category: TipoPrenda | null;
  isLoading: boolean;
}

export function ChangePrendaModal({
  isOpen,
  onOpenChange,
  alternatives,
  onPrendaSelected,
  category,
  isLoading,
}: ChangePrendaModalProps) {
  if (!category) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] md:max-w-[800px] lg:max-w-[900px]">
        <DialogHeader>
          <DialogTitle>Cambiar Prenda - {category}</DialogTitle>
          <DialogDescription>
            Selecciona una prenda alternativa de tu armario para la categoría &quot;{category}&quot;.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] pr-3">
          {isLoading ? (
            <div className="flex justify-center items-center h-40">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="ml-2">Cargando alternativas...</p>
            </div>
          ) : alternatives.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 py-4">
              {alternatives.map((prenda) => (
                <Card
                  key={prenda.id}
                  className="cursor-pointer hover:shadow-lg transition-shadow rounded-lg overflow-hidden group flex flex-col"
                  onClick={() => {
                    onPrendaSelected(prenda);
                    onOpenChange(false);
                  }}
                >
                  <div className="aspect-[3/4] relative w-full bg-muted">
                    <Image
                      src={prenda.imagen_url || `https://placehold.co/200x300.png?text=${encodeURIComponent(prenda.nombre.substring(0,2))}`}
                      alt={prenda.nombre}
                      fill
                      sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                      data-ai-hint={`${prenda.tipo.toLowerCase()} ${prenda.color ? prenda.color.toLowerCase() : ''}`.substring(0,50)}
                    />
                  </div>
                  <CardContent className="p-2 text-center flex-grow flex flex-col justify-between">
                    <div>
                      <p className="text-xs font-semibold truncate" title={prenda.nombre}>{prenda.nombre}</p>
                      <p className="text-xs text-muted-foreground">{prenda.estilo}</p>
                    </div>
                    {prenda.color && <ColorSwatch colorName={prenda.color as PrendaColor} className="mt-1 justify-center" />}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 text-muted-foreground">
              <XCircle className="mx-auto h-12 w-12 mb-3 opacity-50" />
              <p>No se encontraron prendas alternativas para &quot;{category}&quot; con los criterios actuales.</p>
            </div>
          )}
        </ScrollArea>
        <DialogFooter className="mt-4">
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
