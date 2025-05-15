
'use client';

import * as React from 'react';
import Image from 'next/image';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, CalendarDays, ThermometerSnowflake, ThermometerSun } from 'lucide-react';
import type { Prenda } from '@/types';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface ClothingCardProps {
  item: Prenda;
  onEdit: (item: Prenda) => void;
  onDelete: (item: Prenda) => void;
}

export function ClothingCard({ item, onEdit, onDelete }: ClothingCardProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);

  const handleDeleteConfirm = () => {
    onDelete(item);
    setIsDeleteDialogOpen(false);
  };

  return (
    <Card className="flex flex-col overflow-hidden shadow-lg rounded-xl hover:shadow-2xl transition-shadow duration-300 h-full">
      <CardHeader className="p-0">
        <div className="aspect-[3/4] relative w-full bg-muted">
          <Image
            src={item.imagen_url || `https://placehold.co/300x400.png?text=${encodeURIComponent(item.nombre.substring(0,2))}`}
            alt={item.nombre}
            fill={true}
            sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 20vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            data-ai-hint={`${item.tipo.toLowerCase()} ${item.color.toLowerCase()}`.substring(0,50)}
          />
        </div>
      </CardHeader>
      <CardContent className="p-4 flex-grow flex flex-col">
        <CardTitle className="text-lg font-semibold truncate mb-1" title={item.nombre}>{item.nombre}</CardTitle>
        <CardDescription className="text-sm text-muted-foreground mb-2">
          {item.tipo} - {item.color} - {item.modelo}
        </CardDescription>
        <div className="space-y-1 text-xs text-muted-foreground mb-3">
          <div className="flex items-center gap-1.5">
            <Badge variant="outline" className="capitalize">{item.estilo}</Badge>
            <Badge variant="outline">{item.temporada}</Badge>
          </div>
          {item.fechacompra && (
            <div className="flex items-center gap-1.5">
              <CalendarDays className="h-3.5 w-3.5" />
              <span>Compra: {new Date(item.fechacompra + 'T00:00:00').toLocaleDateString()}</span>
            </div>
          )}
          {(item.temperatura_min !== null && item.temperatura_min !== undefined) || (item.temperatura_max !== null && item.temperatura_max !== undefined) ? (
            <div className="flex items-center gap-1.5">
              {item.temperatura_min !== null && item.temperatura_min !== undefined && item.temperatura_max !== null && item.temperatura_max !== undefined ? (
                <>
                  <ThermometerSun className="h-3.5 w-3.5" />
                  <span>{item.temperatura_min}°C - {item.temperatura_max}°C</span>
                </>
              ): item.temperatura_min !== null && item.temperatura_min !== undefined ? (
                <> <ThermometerSnowflake className="h-3.5 w-3.5" /> Min: {item.temperatura_min}°C </>
              ) : (
                <> <ThermometerSun className="h-3.5 w-3.5" /> Max: {item.temperatura_max}°C </>
              )
              }
            </div>
          ) : null}
        </div>
      </CardContent>
      <CardFooter className="p-3 border-t mt-auto">
        <div className="flex w-full justify-end gap-2">
          <Button variant="outline" size="sm" onClick={() => onEdit(item)} className="flex-1">
            <Edit className="mr-1.5 h-4 w-4" /> Editar
          </Button>
          <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm" onClick={() => setIsDeleteDialogOpen(true)} className="flex-1">
                <Trash2 className="mr-1.5 h-4 w-4" /> Eliminar
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta acción no se puede deshacer. Esto eliminará permanentemente la prenda &quot;{item.nombre}&quot;.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive hover:bg-destructive/90">
                  Eliminar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardFooter>
    </Card>
  );
}
