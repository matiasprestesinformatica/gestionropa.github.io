
// src/components/wishlist/WishlistItemCard.tsx
import * as React from 'react';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Edit, Trash2, CheckCircle, Circle, Archive, MoreVertical, ExternalLink, Shirt } from 'lucide-react';
import type { WishlistItem } from '@/types';

interface WishlistItemCardProps {
  item: WishlistItem;
  onEdit: (item: WishlistItem) => void;
  onDelete: (itemId: string) => void;
  onStatusChange: (itemId: string, status: WishlistItem['status']) => void;
}

export function WishlistItemCard({ item, onEdit, onDelete, onStatusChange }: WishlistItemCardProps) {
  const statusBadgeVariant = {
    pending: 'secondary',
    purchased: 'default',
    discarded: 'outline',
  } as const;
  
  const statusText = {
    pending: 'Pendiente',
    purchased: 'Comprado',
    discarded: 'Descartado',
  };


  return (
    <Card className="flex flex-col overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-200 rounded-lg">
      <CardHeader className="p-0">
        <div className="aspect-square relative w-full bg-muted">
          {item.imageUrl ? (
            <Image
              src={item.imageUrl}
              alt={item.name}
              fill={true}
              sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 20vw"
              className="object-cover"
              data-ai-hint="fashion clothing wishlist"
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <Shirt className="w-16 h-16 text-muted-foreground/50" />
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-4 flex-grow">
        <div className="flex justify-between items-start mb-1">
            <CardTitle className="text-md font-semibold leading-tight" title={item.name}>{item.name}</CardTitle>
            <Badge variant={statusBadgeVariant[item.status]} className="text-xs ml-2 shrink-0">{statusText[item.status]}</Badge>
        </div>
        {item.description && <CardDescription className="text-xs mt-1 truncate" title={item.description}>{item.description}</CardDescription>}
        {item.estimatedPrice && <p className="text-sm font-medium text-primary mt-1.5">${item.estimatedPrice.toFixed(2)}</p>}
      </CardContent>
      <CardFooter className="p-3 border-t flex items-center justify-between">
        {item.storeUrl && (
          <Button variant="outline" size="sm" asChild>
            <a href={item.storeUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="mr-1.5 h-3 w-3" /> Tienda
            </a>
          </Button>
        )}
        <div className="flex-grow"></div> {/* Spacer */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreVertical className="h-4 w-4" />
              <span className="sr-only">Más opciones</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(item)}>
              <Edit className="mr-2 h-4 w-4" /> Editar
            </DropdownMenuItem>
            {item.status !== 'purchased' && (
              <DropdownMenuItem onClick={() => onStatusChange(item.id, 'purchased')}>
                <CheckCircle className="mr-2 h-4 w-4" /> Marcar como Comprado
              </DropdownMenuItem>
            )}
            {item.status !== 'pending' && (
                <DropdownMenuItem onClick={() => onStatusChange(item.id, 'pending')}>
                    <Circle className="mr-2 h-4 w-4" /> Marcar como Pendiente
                </DropdownMenuItem>
            )}
            {item.status !== 'discarded' && (
              <DropdownMenuItem onClick={() => onStatusChange(item.id, 'discarded')}>
                <Archive className="mr-2 h-4 w-4" /> Marcar como Descartado
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={() => onDelete(item.id)} className="text-destructive focus:text-destructive focus:bg-destructive/10">
              <Trash2 className="mr-2 h-4 w-4" /> Eliminar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardFooter>
    </Card>
  );
}
