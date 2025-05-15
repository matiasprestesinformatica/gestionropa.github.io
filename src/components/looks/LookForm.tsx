
'use client';

import * as React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  DialogDescription,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { Look, LookFormData, Prenda } from '@/types';
import { styleOptions } from '@/components/StyleSelection';
import { MultiSelectCommand, type MultiSelectItem } from '@/components/ui/MultiSelectCommand';
import { getPrendasAction } from '@/app/actions';
import { Loader2, Image as ImageIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const lookFormSchema = z.object({
  nombre: z.string().min(2, { message: 'El nombre debe tener al menos 2 caracteres.' }),
  descripcion: z.string().optional(),
  estilo: z.string().min(1, { message: 'Por favor selecciona un estilo.' }),
  imagen_url: z.string().url({ message: 'Debe ser una URL válida.' }).or(z.literal("")).optional(),
  prenda_ids: z.array(z.number().int().positive()).min(1, { message: 'Debes seleccionar al menos una prenda.' }),
});

interface LookFormProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSubmit: (data: LookFormData, lookId?: number) => Promise<{ data?: Look; error?: string; validationErrors?: z.ZodIssue[] }>;
  initialData?: Look | null;
  availablePrendas: Prenda[];
}

export function LookForm({ isOpen, onOpenChange, onSubmit, initialData, availablePrendas }: LookFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  
  const prendaOptions: MultiSelectItem[] = React.useMemo(() => 
    availablePrendas.map(p => ({ value: p.id.toString(), label: p.nombre }))
  , [availablePrendas]);

  const form = useForm<LookFormData>({
    resolver: zodResolver(lookFormSchema),
    defaultValues: {
      nombre: '',
      descripcion: '',
      estilo: '',
      imagen_url: '',
      prenda_ids: [],
    },
  });

  React.useEffect(() => {
    if (initialData) {
      form.reset({
        nombre: initialData.nombre,
        descripcion: initialData.descripcion || '',
        estilo: initialData.estilo,
        imagen_url: initialData.imagen_url || '',
        prenda_ids: initialData.prendas.map(p => p.id),
      });
    } else {
      form.reset({ // Reset to default empty values for new form
        nombre: '',
        descripcion: '',
        estilo: '',
        imagen_url: '',
        prenda_ids: [],
      });
    }
  }, [initialData, form, isOpen]); // isOpen ensures reset when dialog opens

  const handleFormSubmit = async (data: LookFormData) => {
    setIsSubmitting(true);
    const result = await onSubmit(data, initialData?.id);
    setIsSubmitting(false);

    if (result.error) {
      if (result.validationErrors) {
        result.validationErrors.forEach(err => {
          // @ts-ignore
          form.setError(err.path[0] as keyof LookFormData, { message: err.message });
        });
      }
      toast({
        title: 'Error',
        description: result.error || 'Por favor corrige los errores en el formulario.',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Éxito',
        description: `Look ${initialData ? 'actualizado' : 'creado'} correctamente.`,
      });
      onOpenChange(false); // Close dialog on success
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!isSubmitting) onOpenChange(open); }}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{initialData ? 'Editar Look' : 'Crear Nuevo Look'}</DialogTitle>
          <DialogDescription>
            {initialData ? 'Modifica los detalles de tu look.' : 'Combina tus prendas para crear un nuevo look.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(handleFormSubmit)}>
          <ScrollArea className="max-h-[70vh] p-1 pr-3"> {/* Added padding for scrollbar */}
            <div className="grid gap-5 py-4">
              <div>
                <Label htmlFor="nombre" className="font-medium">Nombre del Look</Label>
                <Input id="nombre" {...form.register('nombre')} className="mt-1" placeholder="Ej: Casual de Fin de Semana"/>
                {form.formState.errors.nombre && <p className="text-sm text-destructive mt-1">{form.formState.errors.nombre.message}</p>}
              </div>

              <div>
                <Label htmlFor="descripcion" className="font-medium">Descripción (Opcional)</Label>
                <Textarea id="descripcion" {...form.register('descripcion')} className="mt-1" placeholder="Perfecto para..."/>
                {form.formState.errors.descripcion && <p className="text-sm text-destructive mt-1">{form.formState.errors.descripcion.message}</p>}
              </div>

              <div>
                <Label htmlFor="estilo" className="font-medium">Estilo</Label>
                <Controller
                  name="estilo"
                  control={form.control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                      <SelectTrigger id="estilo" className="mt-1">
                        <SelectValue placeholder="Selecciona un estilo" />
                      </SelectTrigger>
                      <SelectContent>
                        {styleOptions.map(option => (
                          <SelectItem key={option.id} value={option.id}>{option.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {form.formState.errors.estilo && <p className="text-sm text-destructive mt-1">{form.formState.errors.estilo.message}</p>}
              </div>
              
              <div>
                <Label htmlFor="prendas" className="font-medium">Prendas Incluidas</Label>
                 <Controller
                  name="prenda_ids"
                  control={form.control}
                  render={({ field }) => (
                    <MultiSelectCommand
                      options={prendaOptions}
                      selectedValues={field.value.map(String)} // MultiSelectCommand expects string values
                      onSelectedValuesChange={(newValues) => field.onChange(newValues.map(Number))} // Convert back to numbers
                      placeholder="Selecciona prendas..."
                      searchPlaceholder="Buscar prendas..."
                      emptyResultText="No se encontraron prendas."
                      className="mt-1"
                    />
                  )}
                />
                {form.formState.errors.prenda_ids && <p className="text-sm text-destructive mt-1">{form.formState.errors.prenda_ids.message}</p>}
              </div>

              <div>
                <Label htmlFor="imagen_url" className="font-medium">URL de Imagen (Opcional)</Label>
                 <div className="flex items-center gap-2 mt-1">
                    <ImageIcon className="h-5 w-5 text-muted-foreground" />
                    <Input id="imagen_url" {...form.register('imagen_url')} placeholder="https://ejemplo.com/imagen.png"/>
                 </div>
                {form.formState.errors.imagen_url && <p className="text-sm text-destructive mt-1">{form.formState.errors.imagen_url.message}</p>}
              </div>
            </div>
          </ScrollArea>
          <DialogFooter className="pt-6">
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={isSubmitting}>Cancelar</Button>
            </DialogClose>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {initialData ? 'Guardar Cambios' : 'Crear Look'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
