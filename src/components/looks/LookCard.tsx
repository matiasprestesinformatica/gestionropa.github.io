
// src/components/looks/LookCard.tsx
import * as React from 'react';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Eye, Edit, Trash2 } from 'lucide-react';
import type { Look } from '@/types';

interface LookCardProps {
  look: Look;
  onView?: (lookId: string) => void;
  onEdit?: (lookId: string) => void;
  onDelete?: (lookId: string) => void;
}

export function LookCard({ look, onView, onEdit, onDelete }: LookCardProps) {
  return (
    <Card className="flex flex-col overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-200 rounded-lg">
      <CardHeader className="p-0">
        <div className="aspect-[4/5] relative w-full bg-muted">
          {look.imageUrl ? (
            <Image
              src={look.imageUrl}
              alt={look.name}
              layout="fill"
              objectFit="cover"
              data-ai-hint="outfit fashion"
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <Eye className="w-16 h-16 text-muted-foreground/50" />
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-4 flex-grow">
        <CardTitle className="text-lg font-semibold truncate" title={look.name}>{look.name}</CardTitle>
        {look.description && <CardDescription className="text-xs mt-1 truncate">{look.description}</CardDescription>}
      </CardContent>
      <CardFooter className="p-3 border-t flex gap-2">
        {onView && <Button variant="outline" size="sm" onClick={() => onView(look.id)} className="flex-1"><Eye className="mr-1.5 h-4 w-4" /> Ver</Button>}
        {onEdit && <Button variant="ghost" size="icon" onClick={() => onEdit(look.id)}><Edit className="h-4 w-4" /></Button>}
        {onDelete && <Button variant="ghost" size="icon" onClick={() => onDelete(look.id)} className="text-destructive hover:text-destructive/90"><Trash2 className="h-4 w-4" /></Button>}
      </CardFooter>
    </Card>
  );
}
