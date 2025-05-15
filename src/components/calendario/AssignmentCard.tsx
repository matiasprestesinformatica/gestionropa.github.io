
// src/components/calendario/AssignmentCard.tsx
'use client';

import * as React from 'react';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shirt, Sparkles, Edit, Trash2, CalendarDays } from 'lucide-react';
import type { CalendarAssignment } from '@/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface AssignmentCardProps {
  assignment: CalendarAssignment;
  onEdit: (assignment: CalendarAssignment) => void;
  onDelete: (assignmentId: number) => void;
}

export function AssignmentCard({ assignment, onEdit, onDelete }: AssignmentCardProps) {
  const isPrenda = assignment.tipo_asignacion === 'prenda';
  const item = isPrenda ? assignment.prenda : assignment.look;
  const imageUrl = item?.imagen_url || 
                   (isPrenda 
                     ? `https://placehold.co/200x200.png?text=${encodeURIComponent(item?.nombre?.substring(0,2) || 'P')}` 
                     : `https://placehold.co/200x200.png?text=${encodeURIComponent(item?.nombre?.substring(0,2) || 'L')}`);
  
  if (!item) {
    return (
      <Card className="shadow-md rounded-xl">
        <CardHeader>
          <CardTitle>Asignación no encontrada</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Los detalles de esta asignación no están disponibles.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-md rounded-xl animate-in fade-in-50">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
            <div>
                <CardTitle className="text-lg font-semibold flex items-center">
                {isPrenda ? <Shirt className="mr-2 h-5 w-5 text-primary" /> : <Sparkles className="mr-2 h-5 w-5 text-primary" />}
                {item.nombre}
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                {isPrenda ? 'Prenda asignada' : 'Look asignado'} para el {format(new Date(assignment.fecha + 'T00:00:00'), "PPP", { locale: es })}
                </CardDescription>
            </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="aspect-square relative w-full max-w-xs mx-auto rounded-md overflow-hidden border bg-muted">
          <Image
            src={imageUrl}
            alt={item.nombre}
            fill={true}
            sizes="320px" // max-w-xs is 20rem = 320px
            className="object-cover"
             data-ai-hint={isPrenda ? `${item.tipo} ${item.color}` : item.estilo}
          />
        </div>
        {item.estilo && (
          <p className="text-sm">
            <span className="font-medium text-muted-foreground">Estilo: </span>
            <span className="capitalize">{item.estilo}</span>
          </p>
        )}
        {assignment.nota && (
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">Notas:</p>
            <p className="text-sm p-2 bg-accent/50 rounded-md whitespace-pre-wrap">{assignment.nota}</p>
          </div>
        )}
         {!isPrenda && (assignment.look?.prendas?.length ?? 0) > 0 && (
           <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">Prendas en este look:</p>
             <ul className="list-disc list-inside text-sm pl-2 space-y-0.5">
              {assignment.look!.prendas.slice(0, 3).map(p => <li key={p.id} className="truncate" title={p.nombre}>{p.nombre}</li>)}
              {assignment.look!.prendas.length > 3 && <li>y {assignment.look!.prendas.length - 3} más...</li>}
            </ul>
           </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-end gap-2 pt-4 border-t">
        <Button variant="outline" size="sm" onClick={() => onEdit(assignment)}>
          <Edit className="mr-2 h-4 w-4" /> Editar
        </Button>
        <Button variant="destructive" size="sm" onClick={() => onDelete(assignment.id)}>
          <Trash2 className="mr-2 h-4 w-4" /> Eliminar
        </Button>
      </CardFooter>
    </Card>
  );
}
