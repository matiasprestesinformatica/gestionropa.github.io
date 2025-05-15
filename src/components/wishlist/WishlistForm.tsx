
// src/components/wishlist/WishlistForm.tsx
'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
  DialogDescription,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { WishlistItem, WishlistFormData } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

const wishlistFormSchema = z.object({
  name: z.string().min(2, { message: 'El nombre debe tener al menos 2 caracteres.' }),
  description: z.string().optional(),
  imageUrl: z.string().url({ message: 'Debe ser una URL válida para la imagen.' }).or(z.literal("")).optional(),
  estimatedPrice: z.coerce.number().positive({ message: 'El precio debe ser un número positivo.' }).optional().nullable(),
  storeUrl: z.string().url({ message: 'Debe ser una URL válida para la tienda.' }).or(z.literal("")).optional(),
});

interface WishlistFormProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSubmit: (data: WishlistFormData, itemId?: string) => Promise<{ error?: string; validationErrors?: z.ZodIssue[] }>;
  initialData?: WishlistItem | null;
}

export function WishlistForm({ isOpen, onOpenChange, onSubmit, initialData }: WishlistFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<WishlistFormData>({
    resolver: zodResolver(wishlistFormSchema),
    defaultValues: {
      name: '',
      description: '',
      imageUrl: '',
      estimatedPrice: undefined,
      storeUrl: '',
    },
  });

  React.useEffect(() => {
    if (isOpen) {
      if (initialData) {
        form.reset({
          name: initialData.name,
          description: initialData.description || '',
          imageUrl: initialData.imageUrl || '',
          estimatedPrice: initialData.estimatedPrice ?? undefined,
          storeUrl: initialData.storeUrl || '',
        });
      } else {
        form.reset({
          name: '', description: '', imageUrl: '', estimatedPrice: undefined, storeUrl: ''
        });
      }
    }
  }, [initialData, form, isOpen]);

  const handleFormSubmit = async (data: WishlistFormData) => {
    setIsSubmitting(true);
    const result = await onSubmit(data, initialData?.id);
    setIsSubmitting(false);

    if (result.error) {
        if (result.validationErrors) {
            result.validationErrors.forEach(err => {
            form.setError(err.path[0] as keyof WishlistFormData, { message: err.message });
            });
            toast({ title: 'Error de validación', description: 'Por favor corrige los errores.', variant: 'destructive' });
        } else {
            toast({ title: 'Error', description: result.error, variant: 'destructive' });
        }
    } else {
      toast({
        title: 'Éxito',
        description: `Elemento ${initialData ? 'actualizado' : 'agregado'} a la lista de deseos.`,
      });
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!isSubmitting) onOpenChange(open); }}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{initialData ? 'Editar Deseo' : 'Agregar Nuevo Deseo'}</DialogTitle>
          <DialogDescription>
            Añade o modifica los detalles del artículo que deseas.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(handleFormSubmit)}>
          <ScrollArea className="h-[60vh] pr-6">
            <div className="grid gap-4 py-4">
              <div>
                <Label htmlFor="name">Nombre del Artículo</Label>
                <Input id="name" {...form.register('name')} />
                {form.formState.errors.name && <p className="text-sm text-destructive mt-1">{form.formState.errors.name.message}</p>}
              </div>
              <div>
                <Label htmlFor="description">Descripción (Opcional)</Label>
                <Textarea id="description" {...form.register('description')} />
              </div>
              <div>
                <Label htmlFor="imageUrl">URL de Imagen (Opcional)</Label>
                <Input id="imageUrl" {...form.register('imageUrl')} placeholder="https://ejemplo.com/imagen.png" />
                 {form.formState.errors.imageUrl && <p className="text-sm text-destructive mt-1">{form.formState.errors.imageUrl.message}</p>}
              </div>
              <div>
                <Label htmlFor="estimatedPrice">Precio Estimado (Opcional)</Label>
                <Input id="estimatedPrice" type="number" step="0.01" {...form.register('estimatedPrice')} placeholder="75.00" />
                {form.formState.errors.estimatedPrice && <p className="text-sm text-destructive mt-1">{form.formState.errors.estimatedPrice.message}</p>}
              </div>
              <div>
                <Label htmlFor="storeUrl">URL de Tienda (Opcional)</Label>
                <Input id="storeUrl" {...form.register('storeUrl')} placeholder="https://tienda.ejemplo.com/articulo" />
                {form.formState.errors.storeUrl && <p className="text-sm text-destructive mt-1">{form.formState.errors.storeUrl.message}</p>}
              </div>
            </div>
          </ScrollArea>
          <DialogFooter className="pt-4">
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={isSubmitting}>Cancelar</Button>
            </DialogClose>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {initialData ? 'Guardar Cambios' : 'Agregar a Lista'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
