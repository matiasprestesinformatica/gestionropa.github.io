'use client';
import * as React from 'react';
import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Navbar } from '@/components/ui/Navbar';
import { Footer } from '@/components/ui/Footer';
import { Button } from '@/components/ui/button';
import { ClothingForm, type PrendaFormData } from '@/components/ClothingForm';
import { addPrendaAction, getPrendasAction, updatePrendaAction, deletePrendaAction } from '@/app/actions';
import type { Prenda } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, Loader2, AlertTriangle, PackageOpen, Search, X } from 'lucide-react';
import { ClosetFilterBar, type ClosetFilters } from '@/components/ClosetFilterBar';
import { GridCardsToggle, type ViewMode } from '@/components/GridCardsToggle';
import { ClothingTable } from '@/components/ClothingTable';
import { ClothingCard } from '@/components/ClothingCard';
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


// This component contains the actual content and client-side logic for the closet page.
// It's a client component because it uses useSearchParams and various useState/useEffect hooks.
function ClosetPageContent() {
  'use client';

  const [allItems, setAllItems] = React.useState<Prenda[]>([]);
  const [filteredItems, setFilteredItems] = React.useState<Prenda[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [editingItem, setEditingItem] = React.useState<Prenda | null>(null);
  
  const [filters, setFilters] = React.useState<ClosetFilters>({
    searchTerm: '',
    tipo: '',
    estilo: '',
    temporada: '',
  });
  const [viewMode, setViewMode] = React.useState<ViewMode>('grid');
  const [itemToDelete, setItemToDelete] = React.useState<Prenda | null>(null);


  const { toast } = useToast();
  const searchParams = useSearchParams();

  React.useEffect(() => {
    if (searchParams.get('action') === 'add') {
      setIsFormOpen(true);
      setEditingItem(null);
    }
  }, [searchParams]);

  const fetchItems = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const result = await getPrendasAction();
    if (result.error) {
      setError(result.error);
      toast({ title: 'Error', description: result.error, variant: 'destructive' });
      setAllItems([]);
      setFilteredItems([]);
    } else {
      setAllItems(result.data || []);
      setFilteredItems(result.data || []); 
    }
    setIsLoading(false);
  }, [toast]);

  React.useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  React.useEffect(() => {
    let tempItems = [...allItems];
    if (filters.searchTerm) {
      tempItems = tempItems.filter(item =>
        item.nombre.toLowerCase().includes(filters.searchTerm.toLowerCase())
      );
    }
    if (filters.tipo) {
      tempItems = tempItems.filter(item => item.tipo === filters.tipo);
    }
    if (filters.estilo) {
      tempItems = tempItems.filter(item => item.estilo === filters.estilo);
    }
    if (filters.temporada) {
      tempItems = tempItems.filter(item => item.temporada === filters.temporada);
    }
    setFilteredItems(tempItems);
  }, [filters, allItems]);

  const handleFilterChange = (newFilters: ClosetFilters) => {
    setFilters(newFilters);
  };

  const handleResetFilters = () => {
    setFilters({ searchTerm: '', tipo: '', estilo: '', temporada: '' });
  };

  const handleFormSubmit = async (data: PrendaFormData, itemId?: number) => {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (value instanceof Date) {
          formData.append(key, value.toISOString().split('T')[0]);
        } else if (typeof value === 'number') {
           formData.append(key, value.toString());
        } else {
          formData.append(key, String(value));
        }
      }
    });

    const action = itemId !== undefined ? updatePrendaAction(itemId, formData) : addPrendaAction(formData);
    const result = await action;

    if (!result.error) {
      toast({
        title: 'Éxito',
        description: `Prenda ${itemId ? 'actualizada' : 'agregada'} correctamente.`,
      });
      fetchItems(); // Refresh the list
      setIsFormOpen(false); // Close form on success
      setEditingItem(null);
    } else {
       toast({
        title: 'Error',
        description: result.validationErrors ? result.validationErrors.map(e => e.message).join(', ') : result.error,
        variant: 'destructive',
      });
    }
    return result;
  };

  const handleDeleteConfirmation = (item: Prenda) => {
    setItemToDelete(item);
  };

  const executeDelete = async () => {
    if (!itemToDelete) return;
    const result = await deletePrendaAction(itemToDelete.id);
    if (result.error) {
      toast({ title: 'Error', description: result.error, variant: 'destructive' });
    } else {
      toast({ title: 'Éxito', description: 'Prenda eliminada correctamente.' });
      fetchItems(); // Refresh the list
    }
    setItemToDelete(null);
  };

  const openEditForm = (item: Prenda) => {
    setEditingItem(item);
    setIsFormOpen(true);
  };

  const openNewForm = () => {
    setEditingItem(null);
    setIsFormOpen(true);
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Navbar />
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Mi Armario</h1>
            <p className="text-muted-foreground text-sm sm:text-base">Gestiona todas tus prendas en un solo lugar.</p>
          </div>
          <div className="flex items-center gap-4 w-full sm:w-auto">
            <GridCardsToggle viewMode={viewMode} onViewModeChange={setViewMode} />
            <Button onClick={openNewForm} className="shadow-md flex-grow sm:flex-grow-0">
              <PlusCircle className="mr-2 h-5 w-5" />
              Agregar Prenda
            </Button>
          </div>
        </div>

        <ClosetFilterBar filters={filters} onFilterChange={handleFilterChange} onResetFilters={handleResetFilters} />

        {isLoading && (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="ml-4 text-lg text-muted-foreground">Cargando prendas...</p>
          </div>
        )}

        {error && !isLoading && (
          <div className="my-10 p-6 bg-destructive/10 border border-destructive/30 text-destructive rounded-lg flex flex-col items-center text-center gap-3">
            <AlertTriangle className="h-10 w-10" />
            <h3 className="font-semibold text-xl">Error al cargar las prendas</h3>
            <p className="text-sm">{error}</p>
            <Button variant="link" onClick={fetchItems} className="p-0 h-auto text-destructive mt-2">
              Intentar de nuevo
            </Button>
          </div>
        )}

        {!isLoading && !error && allItems.length === 0 && (
          <div className="text-center py-20 border-2 border-dashed border-border rounded-lg">
            <PackageOpen className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">Tu armario está vacío</h2>
            <p className="text-muted-foreground mb-4">Empieza agregando algunas prendas para organizar tu estilo.</p>
            <Button onClick={openNewForm} size="lg">
              <PlusCircle className="mr-2 h-5 w-5" />
              Agregar tu Primera Prenda
            </Button>
          </div>
        )}

        {!isLoading && !error && allItems.length > 0 && filteredItems.length === 0 && (
          <div className="text-center py-20 border-2 border-dashed border-border rounded-lg">
            <Search className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">No se encontraron prendas</h2>
            <p className="text-muted-foreground mb-4">Prueba ajustando los filtros o agregando nuevas prendas.</p>
            <Button onClick={handleResetFilters} variant="outline">
                <X className="mr-2 h-4 w-4" /> Limpiar Filtros
            </Button>
          </div>
        )}
        
        {!isLoading && !error && filteredItems.length > 0 && (
          viewMode === 'table' ? (
            <ClothingTable items={filteredItems} onEditItem={openEditForm} onDeleteItem={handleDeleteConfirmation} />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {filteredItems.map(item => (
                <ClothingCard key={item.id} item={item} onEdit={openEditForm} onDelete={handleDeleteConfirmation} />
              ))}
            </div>
          )
        )}

        <ClothingForm
          isOpen={isFormOpen}
          onOpenChange={setIsFormOpen}
          onSubmit={handleFormSubmit}
          initialData={editingItem}
          itemId={editingItem?.id}
        />

        {itemToDelete && (
          <AlertDialog open={!!itemToDelete} onOpenChange={(open) => !open && setItemToDelete(null)}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta acción no se puede deshacer. Esto eliminará permanentemente la prenda &quot;{itemToDelete.nombre}&quot;.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setItemToDelete(null)}>Cancelar</AlertDialogCancel>
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

// Loading fallback for the Suspense boundary
function ClosetPageLoading() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Navbar />
      <main className="flex-grow container mx-auto px-4 py-8 flex justify-center items-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg text-muted-foreground">Cargando armario...</p>
      </main>
      <Footer />
    </div>
  );
}

// The default export for the page, which sets up the Suspense boundary
export default function ClosetPage() {
  return (
    <Suspense fallback={<ClosetPageLoading />}>
      <ClosetPageContent />
    </Suspense>
  );
}
