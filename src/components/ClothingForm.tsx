
'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { ClothingItem } from '@/types';
import { CLOTHING_TYPES, SEASONS, OCCASIONS } from '@/types';
import { styleOptions } from '@/components/StyleSelection'; // Reusing existing style options
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

const clothingItemFormSchema = z.object({
  name: z.string().min(2, { message: 'El nombre debe tener al menos 2 caracteres.' }),
  type: z.string().min(1, { message: 'Por favor selecciona un tipo.' }),
  color: z.string().min(1, { message: 'El color es requerido.' }),
  size: z.string().min(1, { message: 'La talla es requerida.' }),
  season: z.string().min(1, { message: 'Por favor selecciona una temporada.' }),
  occasion: z.string().min(1, { message: 'Por favor selecciona una ocasión.' }),
  image_url: z.string().url({ message: 'Debe ser una URL válida.' }).or(z.literal("")).optional(),
  min_temp: z.coerce.number().optional().nullable(),
  max_temp: z.coerce.number().optional().nullable(),
  style: z.string().min(1, { message: 'Por favor selecciona un estilo.' }),
});

export type ClothingItemFormData = z.infer<typeof clothingItemFormSchema>;

interface ClothingFormProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSubmit: (data: ClothingItemFormData, itemId?: string) => Promise<{error?: string, validationErrors?: z.ZodIssue[]}>;
  initialData?: ClothingItem | null;
  itemId?: string | null;
}

export function ClothingForm({ isOpen, onOpenChange, onSubmit, initialData, itemId }: ClothingFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<ClothingItemFormData>({
    resolver: zodResolver(clothingItemFormSchema),
    defaultValues: {
      name: initialData?.name || '',
      type: initialData?.type || '',
      color: initialData?.color || '',
      size: initialData?.size || '',
      season: initialData?.season || '',
      occasion: initialData?.occasion || '',
      image_url: initialData?.image_url || '',
      min_temp: initialData?.min_temp ?? undefined, // Handle null by converting to undefined for RHF
      max_temp: initialData?.max_temp ?? undefined, // Handle null by converting to undefined for RHF
      style: initialData?.style || '',
    },
  });

  React.useEffect(() => {
    if (initialData) {
      form.reset({
        name: initialData.name,
        type: initialData.type,
        color: initialData.color,
        size: initialData.size,
        season: initialData.season,
        occasion: initialData.occasion,
        image_url: initialData.image_url,
        min_temp: initialData.min_temp ?? undefined,
        max_temp: initialData.max_temp ?? undefined,
        style: initialData.style,
      });
    } else {
      form.reset({ // Default empty values for new item
        name: '', type: '', color: '', size: '', season: '', occasion: '',
        image_url: '', min_temp: undefined, max_temp: undefined, style: ''
      });
    }
  }, [initialData, form, isOpen]);


  const handleFormSubmit = async (data: ClothingItemFormData) => {
    setIsSubmitting(true);
    const result = await onSubmit(data, itemId || undefined);
    setIsSubmitting(false);

    if (result.error) {
      if (result.validationErrors) {
        result.validationErrors.forEach(err => {
          form.setError(err.path[0] as keyof ClothingItemFormData, { message: err.message });
        });
        toast({
          title: 'Error de validación',
          description: 'Por favor corrige los errores en el formulario.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Error',
          description: result.error,
          variant: 'destructive',
        });
      }
    } else {
      toast({
        title: 'Éxito',
        description: `Prenda ${initialData ? 'actualizada' : 'agregada'} correctamente.`,
        variant: 'default',
      });
      onOpenChange(false); // Close dialog on success
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!isSubmitting) onOpenChange(open); }}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{initialData ? 'Editar Prenda' : 'Agregar Nueva Prenda'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(handleFormSubmit)}>
          <ScrollArea className="h-[60vh] pr-6">
            <div className="grid gap-4 py-4">
              {/* Name */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">Nombre</Label>
                <Input id="name" {...form.register('name')} className="col-span-3" />
                {form.formState.errors.name && <p className="col-span-4 text-sm text-destructive">{form.formState.errors.name.message}</p>}
              </div>

              {/* Type */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="type" className="text-right">Tipo</Label>
                <Select onValueChange={(value) => form.setValue('type', value)} defaultValue={form.getValues('type')}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Selecciona un tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {CLOTHING_TYPES.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                  </SelectContent>
                </Select>
                {form.formState.errors.type && <p className="col-span-4 text-sm text-destructive">{form.formState.errors.type.message}</p>}
              </div>
              
              {/* Color */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="color" className="text-right">Color</Label>
                <Input id="color" {...form.register('color')} className="col-span-3" />
                {form.formState.errors.color && <p className="col-span-4 text-sm text-destructive">{form.formState.errors.color.message}</p>}
              </div>

              {/* Size */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="size" className="text-right">Talla</Label>
                <Input id="size" {...form.register('size')} className="col-span-3" />
                {form.formState.errors.size && <p className="col-span-4 text-sm text-destructive">{form.formState.errors.size.message}</p>}
              </div>

              {/* Season */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="season" className="text-right">Temporada</Label>
                 <Select onValueChange={(value) => form.setValue('season', value)} defaultValue={form.getValues('season')}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Selecciona una temporada" />
                  </SelectTrigger>
                  <SelectContent>
                    {SEASONS.map(season => <SelectItem key={season} value={season}>{season}</SelectItem>)}
                  </SelectContent>
                </Select>
                {form.formState.errors.season && <p className="col-span-4 text-sm text-destructive">{form.formState.errors.season.message}</p>}
              </div>

              {/* Occasion */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="occasion" className="text-right">Ocasión</Label>
                <Select onValueChange={(value) => form.setValue('occasion', value)} defaultValue={form.getValues('occasion')}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Selecciona una ocasión" />
                  </SelectTrigger>
                  <SelectContent>
                    {OCCASIONS.map(occasion => <SelectItem key={occasion} value={occasion}>{occasion}</SelectItem>)}
                  </SelectContent>
                </Select>
                {form.formState.errors.occasion && <p className="col-span-4 text-sm text-destructive">{form.formState.errors.occasion.message}</p>}
              </div>

              {/* Style */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="style" className="text-right">Estilo</Label>
                <Select onValueChange={(value) => form.setValue('style', value)} defaultValue={form.getValues('style')}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Selecciona un estilo" />
                  </SelectTrigger>
                  <SelectContent>
                    {styleOptions.map(style => <SelectItem key={style.id} value={style.id}>{style.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                {form.formState.errors.style && <p className="col-span-4 text-sm text-destructive">{form.formState.errors.style.message}</p>}
              </div>
              
              {/* Image URL */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="image_url" className="text-right">URL de Imagen</Label>
                <Input id="image_url" {...form.register('image_url')} className="col-span-3" placeholder="https://ejemplo.com/imagen.png" />
                {form.formState.errors.image_url && <p className="col-span-4 text-sm text-destructive">{form.formState.errors.image_url.message}</p>}
              </div>

              {/* Min Temp */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="min_temp" className="text-right">Temp. Mín (°C)</Label>
                <Input id="min_temp" type="number" {...form.register('min_temp')} className="col-span-3" />
                 {form.formState.errors.min_temp && <p className="col-span-4 text-sm text-destructive">{form.formState.errors.min_temp.message}</p>}
              </div>

              {/* Max Temp */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="max_temp" className="text-right">Temp. Máx (°C)</Label>
                <Input id="max_temp" type="number" {...form.register('max_temp')} className="col-span-3" />
                {form.formState.errors.max_temp && <p className="col-span-4 text-sm text-destructive">{form.formState.errors.max_temp.message}</p>}
              </div>
            </div>
          </ScrollArea>
          <DialogFooter className="pt-4">
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={isSubmitting}>Cancelar</Button>
            </DialogClose>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {initialData ? 'Guardar Cambios' : 'Agregar Prenda'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
