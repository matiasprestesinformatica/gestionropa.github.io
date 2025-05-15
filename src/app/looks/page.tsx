
'use client';

import * as React from 'react';
import { Navbar } from '@/components/ui/Navbar';
import { Footer } from '@/components/ui/Footer';
import { Button } from '@/components/ui/button';
import { LookCard } from '@/components/looks/LookCard';
import { LookForm } from '@/components/looks/LookForm';
import { PlusCircle, Brush, Loader2, AlertTriangle } from 'lucide-react';
import type { Look, LookFormData, Prenda } from '@/types';
import { getLooksAction, addLookAction, updateLookAction, deleteLookAction, getPrendasAction } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function LooksPage() {
  const [looks, setLooks] = React.useState<Look[]>([]);
  const [availablePrendas, setAvailablePrendas] = React.useState<Prenda[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [editingLook, setEditingLook] = React.useState<Look | null>(null);
  const [lookToDelete, setLookToDelete] = React.useState<Look | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const { toast } = useToast();

  const fetchLooksAndPrendas = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [looksResult, prendasResult] = await Promise.all([
        getLooksAction(),
        getPrendasAction(),
      ]);

      if (looksResult.error) throw new Error(looksResult.error);
      setLooks(looksResult.data || []);

      if (prendasResult.error) throw new Error(prendasResult.error);
      setAvailablePrendas(prendasResult.data?.filter(p => !p.is_archived) || []);

    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : "Error desconocido al cargar datos.";
      setError(errorMessage);
      toast({ title: 'Error', description: errorMessage, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  React.useEffect(() => {
    fetchLooksAndPrendas();
  }, [fetchLooksAndPrendas]);

  const handleOpenForm = (look?: Look) => {
    setEditingLook(look || null);
    setIsFormOpen(true);
  };

  const handleFormSubmit = async (data: LookFormData, lookId?: number) => {
    const action = lookId ? updateLookAction(lookId, data) : addLookAction(data);
    const result = await action;

    if (result.error) {
      toast({ title: 'Error', description: result.error, variant: 'destructive' });
    } else {
      toast({ title: 'Éxito', description: `Look ${lookId ? 'actualizado' : 'creado'} correctamente.` });
      fetchLooksAndPrendas(); // Refresh the list
      setIsFormOpen(false);
    }
    return result;
  };

  const handleDeleteConfirmation = (look: Look) => {
    setLookToDelete(look);
  };

  const executeDelete = async () => {
    if (!lookToDelete) return;
    const result = await deleteLookAction(lookToDelete.id);
    if (result.error) {
      toast({ title: 'Error', description: result.error, variant: 'destructive' });
    } else {
      toast({ title: 'Éxito', description: 'Look eliminado correctamente.' });
      fetchLooksAndPrendas(); // Refresh
    }
    setLookToDelete(null);
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Navbar />
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Mis Looks</h1>
            <p className="text-muted-foreground text-sm sm:text-base">Tus combinaciones de prendas guardadas.</p>
          </div>
          <Button onClick={() => handleOpenForm()} className="shadow-md w-full sm:w-auto">
            <PlusCircle className="mr-2 h-5 w-5" />
            Crear Nuevo Look
          </Button>
        </div>

        {isLoading && (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="ml-4 text-lg text-muted-foreground">Cargando looks...</p>
          </div>
        )}

        {error && !isLoading && (
          <div className="my-10 p-6 bg-destructive/10 border border-destructive/30 text-destructive rounded-lg flex flex-col items-center text-center gap-3">
            <AlertTriangle className="h-10 w-10" />
            <h3 className="font-semibold text-xl">Error al cargar los looks</h3>
            <p className="text-sm">{error}</p>
            <Button variant="link" onClick={fetchLooksAndPrendas} className="p-0 h-auto text-destructive mt-2">
              Intentar de nuevo
            </Button>
          </div>
        )}

        {!isLoading && !error && looks.length === 0 && (
          <div className="text-center py-20 border-2 border-dashed border-border rounded-lg">
            <Brush className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">Aún no has guardado ningún look</h2>
            <p className="text-muted-foreground mb-4">Empieza a crear combinaciones y guárdalas aquí.</p>
            <Button onClick={() => handleOpenForm()} size="lg">
              <PlusCircle className="mr-2 h-5 w-5" />
              Crear tu Primer Look
            </Button>
          </div>
        )}

        {!isLoading && !error && looks.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {looks.map((look) => (
              <LookCard 
                key={look.id} 
                look={look} 
                onEdit={() => handleOpenForm(look)}
                onDelete={() => handleDeleteConfirmation(look)}
              />
            ))}
          </div>
        )}

        <LookForm
          isOpen={isFormOpen}
          onOpenChange={setIsFormOpen}
          onSubmit={handleFormSubmit}
          initialData={editingLook}
          availablePrendas={availablePrendas}
        />

        {lookToDelete && (
          <AlertDialog open={!!lookToDelete} onOpenChange={(open) => !open && setLookToDelete(null)}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta acción no se puede deshacer. Esto eliminará permanentemente el look &quot;{lookToDelete.nombre}&quot;.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setLookToDelete(null)}>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={executeDelete} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
                  Eliminar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </main>
      <Footer />
    </div>
  );
}
