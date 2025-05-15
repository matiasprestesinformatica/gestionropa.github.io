
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
import type { Prenda } from '@/types';
import { SEASONS, PRENDA_COLORS, TIPO_PRENDA_ENUM_VALUES } from '@/types';
import { styleOptions } from '@/components/StyleSelection';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { parseISO, isValid, format } from 'date-fns';

const prendaFormSchema = z.object({
  nombre: z.string().min(2, { message: 'El nombre debe tener al menos 2 caracteres.' }),
  tipo: z.enum(TIPO_PRENDA_ENUM_VALUES, { required_error: "Por favor selecciona un tipo válido."}),
  color: z.enum(PRENDA_COLORS, { errorMap: () => ({ message: "Por favor selecciona un color válido." }) }),
  modelo: z.string().min(1, { message: 'El modelo es requerido.' }), // Was talla
  temporada: z.string().min(1, { message: 'Por favor selecciona una temporada.' }),
  fechacompra: z.string().refine((val) => { // Was ocasion
    if (val === '' || val === null || val === undefined) return true;
    const parsedDate = parseISO(val);
    return isValid(parsedDate);
  }, {
    message: "La fecha de compra debe ser válida (YYYY-MM-DD) o estar vacía.",
  }).optional().nullable(),
  imagen_url: z.string().url({ message: 'Debe ser una URL válida.' }).or(z.literal("")).optional(),
  temperatura_min: z.coerce.number().optional().nullable(),
  temperatura_max: z.coerce.number().optional().nullable(),
  estilo: z.string().min(1, { message: 'Por favor selecciona un estilo.' }),
  is_archived: z.preprocess(val => val === 'on' || val === 'true' || val === true, z.boolean()).optional().default(false),
});

export type PrendaFormData = z.infer<typeof prendaFormSchema>;

interface ClothingFormProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSubmit: (data: PrendaFormData, itemId?: number) => Promise<{error?: string, validationErrors?: z.ZodIssue[]}>;
  initialData?: Prenda | null;
  itemId?: number | null;
}

export function ClothingForm({ isOpen, onOpenChange, onSubmit, initialData, itemId }: ClothingFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const defaultFormValues: PrendaFormData = {
    nombre: '',
    tipo: TIPO_PRENDA_ENUM_VALUES[0], // Default to the first type
    color: PRENDA_COLORS[0], // Default to the first color
    modelo: '',
    temporada: SEASONS[0], // Default to the first season
    fechacompra: '',
    imagen_url: '',
    temperatura_min: undefined,
    temperatura_max: undefined,
    estilo: styleOptions[0].id, // Default to the first style
    is_archived: false,
  };

  const form = useForm<PrendaFormData>({
    resolver: zodResolver(prendaFormSchema),
    defaultValues: defaultFormValues,
  });

  React.useEffect(() => {
    if (isOpen) {
      if (initialData) {
        const validInitialColor = PRENDA_COLORS.includes(initialData.color as any)
          ? initialData.color as typeof PRENDA_COLORS[number]
          : defaultFormValues.color;
        const validInitialTipo = TIPO_PRENDA_ENUM_VALUES.includes(initialData.tipo as any)
          ? initialData.tipo as typeof TIPO_PRENDA_ENUM_VALUES[number]
          : defaultFormValues.tipo;

        form.reset({
          nombre: initialData.nombre,
          tipo: validInitialTipo,
          color: validInitialColor,
          modelo: initialData.modelo,
          temporada: initialData.temporada,
          fechacompra: initialData.fechacompra ? initialData.fechacompra : '', // Already YYYY-MM-DD from mapper
          imagen_url: initialData.imagen_url,
          temperatura_min: initialData.temperatura_min ?? undefined,
          temperatura_max: initialData.temperatura_max ?? undefined,
          estilo: initialData.estilo,
          is_archived: initialData.is_archived || false,
        });
      } else {
        form.reset(defaultFormValues);
      }
    }
  }, [initialData, form, isOpen, defaultFormValues]);


  const handleFormSubmit = async (data: PrendaFormData) => {
    setIsSubmitting(true);
    const result = await onSubmit(data, itemId !== null && itemId !== undefined ? itemId : undefined);
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
                <Select onValueChange={(value) => form.setValue('tipo', value as typeof TIPO_PRENDA_ENUM_VALUES[number])} defaultValue={form.getValues('tipo')}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Selecciona un tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {TIPO_PRENDA_ENUM_VALUES.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                  </SelectContent>
                </Select>
                {form.formState.errors.tipo && <p className="col-span-4 text-sm text-destructive">{form.formState.errors.tipo.message}</p>}
              </div>

              {/* Color */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="color" className="text-right">Color</Label>
                <Select onValueChange={(value) => form.setValue('color', value as typeof PRENDA_COLORS[number])} defaultValue={form.getValues('color')}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Selecciona un color" />
                  </SelectTrigger>
                  <SelectContent>
                    {PRENDA_COLORS.map(colorName => <SelectItem key={colorName} value={colorName}>{colorName}</SelectItem>)}
                  </SelectContent>
                </Select>
                {form.formState.errors.color && <p className="col-span-4 text-sm text-destructive">{form.formState.errors.color.message}</p>}
              </div>

              {/* Modelo */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="modelo" className="text-right">Modelo</Label>
                <Input id="modelo" {...form.register('modelo')} className="col-span-3" />
                {form.formState.errors.modelo && <p className="col-span-4 text-sm text-destructive">{form.formState.errors.modelo.message}</p>}
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

              {/* Fecha Compra */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="fechacompra" className="text-right">Fecha Compra</Label>
                <Input id="fechacompra" type="date" {...form.register('fechacompra')} className="col-span-3" />
                {form.formState.errors.fechacompra && <p className="col-span-4 text-sm text-destructive">{form.formState.errors.fechacompra.message}</p>}
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
