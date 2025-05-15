
// src/app/archivo/page.tsx
'use client';

import * as React from 'react';
import Image from 'next/image';
import { Navbar } from '@/components/ui/Navbar';
import { Footer } from '@/components/ui/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { ArchiveRestore, ArchiveX, Loader2 } from 'lucide-react';
import type { Prenda } from '@/types';
import { getPrendasAction, updatePrendaAction } from '@/app/actions'; // Assuming actions can handle archive flag
import { useToast } from '@/hooks/use-toast';

export default function ArchivoPage() {
  const [archivedItems, setArchivedItems] = React.useState<Prenda[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const { toast } = useToast();

  const fetchArchivedItems = React.useCallback(async () => {
    setIsLoading(true);
    const result = await getPrendasAction(); // This action needs to be able to filter by an 'is_archived' flag
    if (result.error || !result.data) {
      toast({ title: "Error", description: result.error || "No se pudieron cargar las prendas archivadas.", variant: "destructive" });
      setArchivedItems([]);
    } else {
      setArchivedItems(result.data.filter(item => item.is_archived));
    }
    setIsLoading(false);
  }, [toast]);

  React.useEffect(() => {
    fetchArchivedItems();
  }, [fetchArchivedItems]);

  const handleUnarchiveItem = async (item: Prenda) => {
    // This assumes your updatePrendaAction can handle setting is_archived to false
    // and that PrendaFormData can accept an is_archived field.
    // For simplicity, creating a FormData-like object here.
    const formData = new FormData();
    Object.entries(item).forEach(([key, value]) => {
      if (key === 'is_archived') {
        formData.append(key, 'false');
      } else if (value !== undefined && value !== null) {
         if (value instanceof Date) {
          formData.append(key, value.toISOString().split('T')[0]);
        } else if (typeof value === 'number') {
           formData.append(key, value.toString());
        } else {
          formData.append(key, String(value));
        }
      }
    });
    
    const result = await updatePrendaAction(item.id, formData);
    if (result.error) {
      toast({ title: "Error", description: `No se pudo restaurar "${item.nombre}". ${result.error}`, variant: "destructive" });
    } else {
      toast({ title: "Éxito", description: `"${item.nombre}" restaurada al armario principal.` });
      fetchArchivedItems(); // Refresh the list
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Navbar />
      <main className="flex-grow container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-foreground mb-8">Prendas Archivadas</h1>

        {isLoading && (
          <div className="flex justify-center items-center py-10">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="ml-4 text-lg text-muted-foreground">Cargando prendas archivadas...</p>
          </div>
        )}

        {!isLoading && archivedItems.length === 0 && (
          <div className="text-center py-10 border-2 border-dashed border-border rounded-lg">
            <ArchiveX className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">No tienes prendas archivadas</h2>
            <p className="text-muted-foreground">Aquí aparecerán las prendas que marques como fuera de temporada o que no uses frecuentemente.</p>
          </div>
        )}

        {!isLoading && archivedItems.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {archivedItems.map((item) => (
              <Card key={item.id} className="flex flex-col shadow-md rounded-lg overflow-hidden">
                <CardHeader className="p-0">
                  <div className="aspect-[3/4] relative w-full">
                    <Image
                      src={item.imagen_url || `https://placehold.co/300x400.png?text=${encodeURIComponent(item.nombre)}`}
                      alt={item.nombre}
                      layout="fill"
                      objectFit="cover"
                       data-ai-hint={`${item.tipo.toLowerCase()} ${item.color.toLowerCase()}`.substring(0,50)}
                    />
                  </div>
                </CardHeader>
                <CardContent className="p-4 flex-grow">
                  <h3 className="font-semibold text-lg truncate" title={item.nombre}>{item.nombre}</h3>
                  <p className="text-sm text-muted-foreground">{item.tipo} - {item.color}</p>
                </CardContent>
                <CardFooter className="p-4 border-t">
                  <Button onClick={() => handleUnarchiveItem(item)} className="w-full" variant="outline">
                    <ArchiveRestore className="mr-2 h-4 w-4" />
                    Restaurar al Armario
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
