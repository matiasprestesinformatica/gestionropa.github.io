
'use client';

import * as React from 'react';
import Image from 'next/image';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, Shirt, CalendarDays } from 'lucide-react';
import type { Look } from '@/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface LookCardProps {
  look: Look;
  onEdit: (look: Look) => void;
  onDelete: (lookId: number) => void;
}

export function LookCard({ look, onEdit, onDelete }: LookCardProps) {
  return (
    <Card className="flex flex-col overflow-hidden shadow-lg rounded-xl hover:shadow-2xl transition-shadow duration-300 h-full bg-card">
      <CardHeader className="p-0 relative">
        <div className="aspect-[4/3] w-full bg-muted overflow-hidden relative">
          <Image
            src={look.imagen_url || `https://placehold.co/400x300.png?text=${encodeURIComponent(look.nombre.substring(0,3))}`}
            alt={look.nombre}
            fill={true}
            sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            data-ai-hint={`look ${look.estilo || ''}`.trim()}
          />
        </div>
         {look.estilo && <Badge variant="secondary" className="absolute top-3 right-3 capitalize">{look.estilo}</Badge>}
      </CardHeader>
      <CardContent className="p-4 flex-grow">
        <CardTitle className="text-lg font-semibold truncate mb-1" title={look.nombre}>
          {look.nombre}
        </CardTitle>
        {look.descripcion && (
          <CardDescription className="text-xs text-muted-foreground mb-2 line-clamp-2">
            {look.descripcion}
          </CardDescription>
        )}
        <div className="space-y-1.5 text-xs text-muted-foreground mt-2">
          {look.prendas && look.prendas.length > 0 && (
            <div className="flex items-center gap-1.5">
              <Shirt className="h-3.5 w-3.5" />
              <span>
                {look.prendas.slice(0, 3).map(p => p.nombre).join(', ')}
                {look.prendas.length > 3 ? ` y ${look.prendas.length - 3} más...` : ''}
              </span>
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <CalendarDays className="h-3.5 w-3.5" />
            <span>Creado: {format(new Date(look.created_at), "dd MMM yyyy", { locale: es })}</span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="p-3 border-t mt-auto">
        <div className="flex w-full justify-end gap-2">
          <Button variant="outline" size="sm" onClick={() => onEdit(look)} className="flex-1">
            <Edit className="mr-1.5 h-4 w-4" /> Editar
          </Button>
          <Button variant="destructive" size="sm" onClick={() => onDelete(look.id)} className="flex-1">
            <Trash2 className="mr-1.5 h-4 w-4" /> Eliminar
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
