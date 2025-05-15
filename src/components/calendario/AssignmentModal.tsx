
// src/components/calendario/AssignmentModal.tsx
'use client';

import * as React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Check, ChevronsUpDown, Loader2, Tag, Sparkles } from 'lucide-react';
import type { CalendarAssignmentFormData, Prenda, Look, CalendarAssignment } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const assignmentFormSchema = z.object({
  fecha: z.string(), // Already in YYYY-MM-DD
  tipo_asignacion: z.enum(['prenda', 'look'], { required_error: "Debes seleccionar un tipo de asignación." }),
  referencia_id: z.coerce.number({ invalid_type_error: "Debes seleccionar una prenda o look."}).min(1, "Debes seleccionar una prenda o look."),
  nota: z.string().optional(),
});

interface AssignmentModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSubmit: (data: CalendarAssignmentFormData, assignmentId?: number) => Promise<{ data?: CalendarAssignment; error?: string }>;
  selectedDate: Date | null; // Can be null initially
  existingAssignment?: CalendarAssignment | null;
  availablePrendas: Prenda[];
  availableLooks: Look[];
}

export function AssignmentModal({
  isOpen,
  onOpenChange,
  onSubmit,
  selectedDate,
  existingAssignment,
  availablePrendas,
  availableLooks,
}: AssignmentModalProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [selectedType, setSelectedType] = React.useState<'prenda' | 'look' | ''>(existingAssignment?.tipo_asignacion || '');
  
  const [prendaPopoverOpen, setPrendaPopoverOpen] = React.useState(false);
  const [lookPopoverOpen, setLookPopoverOpen] = React.useState(false);

  const form = useForm<CalendarAssignmentFormData>({
    resolver: zodResolver(assignmentFormSchema),
    defaultValues: {
      fecha: selectedDate ? format(selectedDate, 'yyyy-MM-dd') : '',
      tipo_asignacion: 'prenda', 
      referencia_id: 0, 
      nota: '',
    },
  });
  
  const { register, handleSubmit, control, watch, setValue, reset, formState: { errors } } = form;
  const currentTipoAsignacion = watch('tipo_asignacion');

  React.useEffect(() => {
    if (isOpen) {
      const defaultValues: CalendarAssignmentFormData = {
        fecha: selectedDate ? format(selectedDate, 'yyyy-MM-dd') : '',
        tipo_asignacion: existingAssignment?.tipo_asignacion || 'prenda',
        referencia_id: existingAssignment && existingAssignment.tipo_asignacion && (existingAssignment.tipo_asignacion === 'prenda' ? existingAssignment.prenda_id : existingAssignment.look_id)
          ? (existingAssignment.tipo_asignacion === 'prenda' ? existingAssignment.prenda_id! : existingAssignment.look_id!)
          : 0,
        nota: existingAssignment?.nota || '',
      };
      reset(defaultValues);
      setSelectedType(existingAssignment?.tipo_asignacion || 'prenda');
    }
  }, [isOpen, selectedDate, existingAssignment, reset]);

  const handleFormSubmit = async (data: CalendarAssignmentFormData) => {
    setIsSubmitting(true);
    const result = await onSubmit(data, existingAssignment?.id);
    setIsSubmitting(false);

    if (result.error) {
      toast({ title: 'Error', description: result.error, variant: 'destructive' });
    } else {
      toast({ title: 'Éxito', description: `Asignación ${existingAssignment ? 'actualizada' : 'creada'}.` });
      onOpenChange(false);
    }
  };
  
  const itemsForSelection = React.useMemo(() => {
    return currentTipoAsignacion === 'prenda' ? availablePrendas : availableLooks;
  }, [currentTipoAsignacion, availablePrendas, availableLooks]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!isSubmitting) onOpenChange(open); }}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>{existingAssignment ? 'Editar Asignación' : 'Asignar a Calendario'}</DialogTitle>
          {selectedDate && <DialogDescription>Asignando para el {format(selectedDate, "PPP", { locale: es })}.</DialogDescription>}
        </DialogHeader>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <input type="hidden" {...register('fecha')} />
          
          <div>
            <Label htmlFor="tipo_asignacion">Tipo de Asignación</Label>
            <Controller
              name="tipo_asignacion"
              control={control}
              render={({ field }) => (
                <Select 
                  onValueChange={(value) => {
                    field.onChange(value);
                    setSelectedType(value as 'prenda' | 'look');
                    setValue('referencia_id', 0); // Reset reference when type changes
                  }} 
                  value={field.value}
                >
                  <SelectTrigger id="tipo_asignacion">
                    <SelectValue placeholder="Selecciona un tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="prenda">Prenda</SelectItem>
                    <SelectItem value="look">Look</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            {errors.tipo_asignacion && <p className="text-sm text-destructive mt-1">{errors.tipo_asignacion.message}</p>}
          </div>

          {currentTipoAsignacion && (
            <div>
              <Label htmlFor="referencia_id">{currentTipoAsignacion === 'prenda' ? 'Prenda' : 'Look'}</Label>
              <Controller
                name="referencia_id"
                control={control}
                render={({ field }) => (
                  <Popover open={currentTipoAsignacion === 'prenda' ? prendaPopoverOpen : lookPopoverOpen} onOpenChange={currentTipoAsignacion === 'prenda' ? setPrendaPopoverOpen : setLookPopoverOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={currentTipoAsignacion === 'prenda' ? prendaPopoverOpen : lookPopoverOpen}
                        className="w-full justify-between"
                      >
                        {field.value && itemsForSelection.find(item => item.id === field.value)?.nombre
                          ? itemsForSelection.find(item => item.id === field.value)?.nombre
                          : `Selecciona un${currentTipoAsignacion === 'prenda' ? 'a prenda' : ' look'}`}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                      <Command>
                        <CommandInput placeholder={`Buscar ${currentTipoAsignacion === 'prenda' ? 'prenda' : 'look'}...`} />
                        <CommandEmpty>No se encontró.</CommandEmpty>
                        <CommandList>
                          <CommandGroup>
                            {itemsForSelection.map((item) => (
                              <CommandItem
                                key={item.id}
                                value={item.nombre}
                                onSelect={() => {
                                  setValue('referencia_id', item.id, { shouldValidate: true });
                                  if (currentTipoAsignacion === 'prenda') setPrendaPopoverOpen(false);
                                  else setLookPopoverOpen(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    field.value === item.id ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                <div className="flex items-center">
                                {currentTipoAsignacion === 'prenda' ? <Tag className="mr-2 h-4 w-4 text-muted-foreground" /> : <Sparkles className="mr-2 h-4 w-4 text-muted-foreground" />}
                                {item.nombre}
                                </div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                )}
              />
              {errors.referencia_id && <p className="text-sm text-destructive mt-1">{errors.referencia_id.message}</p>}
            </div>
          )}

          <div>
            <Label htmlFor="nota">Nota (Opcional)</Label>
            <Textarea id="nota" {...register('nota')} />
          </div>

          <DialogFooter className="pt-4">
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={isSubmitting}>Cancelar</Button>
            </DialogClose>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {existingAssignment ? 'Actualizar' : 'Guardar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

