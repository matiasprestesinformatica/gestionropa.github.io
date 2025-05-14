
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
import type { Prenda } from '@/types'; // Updated to Prenda
import { CLOTHING_TYPES, SEASONS, OCCASIONS } from '@/types';
import { styleOptions } from '@/components/StyleSelection';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

// Updated Zod schema to use Spanish field names
const prendaFormSchema = z.object({
  nombre: z.string().min(2, { message: 'El nombre debe tener al menos 2 caracteres.' }),
  tipo: z.string().min(1, { message: 'Por favor selecciona un tipo.' }),
  color: z.string().min(1, { message: 'El color es requerido.' }),
  talla: z.string().min(1, { message: 'La talla es requerida.' }),
  temporada: z.string().min(1, { message: 'Por favor selecciona una temporada.' }),
  ocasion: z.string().min(1, { message: 'Por favor selecciona una ocasión.' }),
  imagen_url: z.string().url({ message: 'Debe ser una URL válida.' }).or(z.literal("")).optional(),
  temperatura_min: z.coerce.number().optional().nullable(),
  temperatura_max: z.coerce.number().optional().nullable(),
  estilo: z.string().min(1, { message: 'Por favor selecciona un estilo.' }),
});

export type PrendaFormData = z.infer<typeof prendaFormSchema>;

interface ClothingFormProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSubmit: (data: PrendaFormData, itemId?: string) => Promise<{error?: string, validationErrors?: z.ZodIssue[]}>;
  initialData?: Prenda | null; // Updated to Prenda
  itemId?: string | null;
}

export function ClothingForm({ isOpen, onOpenChange, onSubmit, initialData, itemId }: ClothingFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<PrendaFormData>({
    resolver: zodResolver(prendaFormSchema),
    defaultValues: { // Updated field names
      nombre: initialData?.nombre || '',
      tipo: initialData?.tipo || '',
      color: initialData?.color || '',
      talla: initialData?.talla || '',
      temporada: initialData?.temporada || '',
      ocasion: initialData?.ocasion || '',
      imagen_url: initialData?.imagen_url || '',
      temperatura_min: initialData?.temperatura_min ?? undefined,
      temperatura_max: initialData?.temperatura_max ?? undefined,
      estilo: initialData?.estilo || '',
    },
  });

  React.useEffect(() => {
    if (isOpen) { // Reset form only when dialog opens
      if (initialData) {
        form.reset({ // Updated field names
          nombre: initialData.nombre,
          tipo: initialData.tipo,
          color: initialData.color,
          talla: initialData.talla,
          temporada: initialData.temporada,
          ocasion: initialData.ocasion,
          imagen_url: initialData.imagen_url,
          temperatura_min: initialData.temperatura_min ?? undefined,
          temperatura_max: initialData.temperatura_max ?? undefined,
          estilo: initialData.estilo,
        });
      } else {
        form.reset({ // Updated field names for new item
          nombre: '', tipo: '', color: '', talla: '', temporada: '', ocasion: '',
          imagen_url: '', temperatura_min: undefined, temperatura_max: undefined, estilo: ''
        });
      }
    }
  }, [initialData, form, isOpen]);


  const handleFormSubmit = async (data: PrendaFormData) => {
    setIsSubmitting(true);
    const result = await onSubmit(data, itemId || undefined);
    setIsSubmitting(false);

    if (result.error) {
      if (result.validationErrors) {
        result.validationErrors.forEach(err => {
          form.setError(err.path[0] as keyof PrendaFormData, { message: err.message });
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
      onOpenChange(false); 
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
              {/* Nombre */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="nombre" className="text-right">Nombre</Label>
                <Input id="nombre" {...form.register('nombre')} className="col-span-3" />
                {form.formState.errors.nombre && <p className="col-span-4 text-sm text-destructive">{form.formState.errors.nombre.message}</p>}
              </div>

              {/* Tipo */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="tipo" className="text-right">Tipo</Label>
                <Select onValueChange={(value) => form.setValue('tipo', value)} defaultValue={form.getValues('tipo')}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Selecciona un tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {CLOTHING_TYPES.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                  </SelectContent>
                </Select>
                {form.formState.errors.tipo && <p className="col-span-4 text-sm text-destructive">{form.formState.errors.tipo.message}</p>}
              </div>
              
              {/* Color */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="color" className="text-right">Color</Label>
                <Input id="color" {...form.register('color')} className="col-span-3" />
                {form.formState.errors.color && <p className="col-span-4 text-sm text-destructive">{form.formState.errors.color.message}</p>}
              </div>

              {/* Talla */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="talla" className="text-right">Talla</Label>
                <Input id="talla" {...form.register('talla')} className="col-span-3" />
                {form.formState.errors.talla && <p className="col-span-4 text-sm text-destructive">{form.formState.errors.talla.message}</p>}
              </div>

              {/* Temporada */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="temporada" className="text-right">Temporada</Label>
                 <Select onValueChange={(value) => form.setValue('temporada', value)} defaultValue={form.getValues('temporada')}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Selecciona una temporada" />
                  </SelectTrigger>
                  <SelectContent>
                    {SEASONS.map(season => <SelectItem key={season} value={season}>{season}</SelectItem>)}
                  </SelectContent>
                </Select>
                {form.formState.errors.temporada && <p className="col-span-4 text-sm text-destructive">{form.formState.errors.temporada.message}</p>}
              </div>

              {/* Ocasion */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="ocasion" className="text-right">Ocasión</Label>
                <Select onValueChange={(value) => form.setValue('ocasion', value)} defaultValue={form.getValues('ocasion')}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Selecciona una ocasión" />
                  </SelectTrigger>
                  <SelectContent>
                    {OCCASIONS.map(occasion => <SelectItem key={occasion} value={occasion}>{occasion}</SelectItem>)}
                  </SelectContent>
                </Select>
                {form.formState.errors.ocasion && <p className="col-span-4 text-sm text-destructive">{form.formState.errors.ocasion.message}</p>}
              </div>

              {/* Estilo */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="estilo" className="text-right">Estilo</Label>
                <Select onValueChange={(value) => form.setValue('estilo', value)} defaultValue={form.getValues('estilo')}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Selecciona un estilo" />
                  </SelectTrigger>
                  <SelectContent>
                    {styleOptions.map(style => <SelectItem key={style.id} value={style.id}>{style.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                {form.formState.errors.estilo && <p className="col-span-4 text-sm text-destructive">{form.formState.errors.estilo.message}</p>}
              </div>
              
              {/* Image URL */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="imagen_url" className="text-right">URL de Imagen</Label>
                <Input id="imagen_url" {...form.register('imagen_url')} className="col-span-3" placeholder="https://ejemplo.com/imagen.png" />
                {form.formState.errors.imagen_url && <p className="col-span-4 text-sm text-destructive">{form.formState.errors.imagen_url.message}</p>}
              </div>

              {/* Min Temp */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="temperatura_min" className="text-right">Temp. Mín (°C)</Label>
                <Input id="temperatura_min" type="number" {...form.register('temperatura_min')} className="col-span-3" />
                 {form.formState.errors.temperatura_min && <p className="col-span-4 text-sm text-destructive">{form.formState.errors.temperatura_min.message}</p>}
              </div>

              {/* Max Temp */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="temperatura_max" className="text-right">Temp. Máx (°C)</Label>
                <Input id="temperatura_max" type="number" {...form.register('temperatura_max')} className="col-span-3" />
                {form.formState.errors.temperatura_max && <p className="col-span-4 text-sm text-destructive">{form.formState.errors.temperatura_max.message}</p>}
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
