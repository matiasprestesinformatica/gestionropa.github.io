
'use client';

import * as React from 'react';
import Image from 'next/image';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Edit, Trash2 } from 'lucide-react';
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

interface ClothingTableProps {
  items: Prenda[];
  onEditItem: (item: Prenda) => void;
  onDeleteItem: (item: Prenda) => void;
}

export function ClothingTable({ items, onEditItem, onDeleteItem }: ClothingTableProps) {
  const [itemToConfirmDelete, setItemToConfirmDelete] = React.useState<Prenda | null>(null);

  const handleDeleteConfirmation = (item: Prenda) => {
    setItemToConfirmDelete(item);
  };

  const executeDelete = () => {
    if (itemToConfirmDelete) {
      onDeleteItem(itemToConfirmDelete);
      setItemToConfirmDelete(null);
    }
  };

  return (
    <>
      <div className="rounded-xl border overflow-hidden shadow-md bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[70px] sm:w-[80px] px-2 sm:px-4">Imagen</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead className="hidden md:table-cell">Tipo</TableHead>
              <TableHead className="hidden md:table-cell">Color</TableHead>
              <TableHead className="hidden lg:table-cell">Modelo</TableHead>
              <TableHead className="hidden lg:table-cell">Estilo</TableHead>
              <TableHead className="hidden sm:table-cell">Fecha Compra</TableHead>
              <TableHead className="text-right w-[100px] sm:w-[120px] px-2 sm:px-4">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="px-2 sm:px-4">
                  <div className="relative h-12 w-12 sm:h-16 sm:w-16 rounded-md overflow-hidden border border-border">
                    <Image
                      src={item.imagen_url || `https://placehold.co/64x64.png?text=${encodeURIComponent(item.nombre.substring(0,2))}`}
                      alt={item.nombre}
                      fill={true}
                      sizes="64px"
                      className="object-cover"
                      data-ai-hint={`${item.tipo.toLowerCase()} ${item.color.toLowerCase()}`.substring(0,50)}
                    />
                  </div>
                </TableCell>
                <TableCell className="font-medium py-2 sm:py-4">{item.nombre}</TableCell>
                <TableCell className="hidden md:table-cell py-2 sm:py-4">{item.tipo}</TableCell>
                <TableCell className="hidden md:table-cell py-2 sm:py-4">{item.color}</TableCell>
                <TableCell className="hidden lg:table-cell py-2 sm:py-4">{item.modelo}</TableCell>
                <TableCell className="hidden lg:table-cell py-2 sm:py-4 capitalize">{item.estilo}</TableCell>
                <TableCell className="hidden sm:table-cell py-2 sm:py-4">
                  {item.fechacompra ? new Date(item.fechacompra + 'T00:00:00').toLocaleDateString() : '-'}
                </TableCell>
                <TableCell className="text-right px-2 sm:px-4 py-2 sm:py-4">
                  <Button variant="ghost" size="icon" onClick={() => onEditItem(item)} className="mr-1 sm:mr-2 hover:text-primary h-8 w-8 sm:h-auto sm:w-auto">
                    <Edit className="h-4 w-4" />
                    <span className="sr-only">Editar</span>
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDeleteConfirmation(item)} className="hover:text-destructive h-8 w-8 sm:h-auto sm:w-auto">
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Eliminar</span>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {itemToConfirmDelete && (
        <AlertDialog open={!!itemToConfirmDelete} onOpenChange={(open) => !open && setItemToConfirmDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción no se puede deshacer. Esto eliminará permanentemente la prenda &quot;{itemToConfirmDelete.nombre}&quot;.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setItemToConfirmDelete(null)}>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={executeDelete} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
                Eliminar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  );
}
