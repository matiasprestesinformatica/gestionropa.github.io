
'use client';

import * as React from 'react';
import Image from 'next/image';
import { AppHeader } from '@/components/Header';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger, // Added AlertDialogTrigger here
} from '@/components/ui/alert-dialog';
import { Card, CardContent } from '@/components/ui/card'; // Using ShadCN Card
import { ClothingForm, type PrendaFormData } from '@/components/ClothingForm'; // Updated to PrendaFormData
import { addPrendaAction, getPrendasAction, updatePrendaAction, deletePrendaAction } from '@/app/actions'; // Updated action names
import type { Prenda } from '@/types'; // Updated to Prenda
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, Edit, Trash2, Loader2, AlertTriangle, PackageOpen } from 'lucide-react';

export default function ClosetPage() {
  const [items, setItems] = React.useState<Prenda[]>([]); // Updated to Prenda[]
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [editingItem, setEditingItem] = React.useState<Prenda | null>(null); // Updated to Prenda
  const [itemToDelete, setItemToDelete] = React.useState<Prenda | null>(null); // Updated to Prenda

  const { toast } = useToast();

  const fetchItems = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const result = await getPrendasAction(); // Updated action name
    if (result.error) {
      setError(result.error);
      toast({ title: 'Error', description: result.error, variant: 'destructive' });
    } else {
      setItems(result.data || []);
    }
    setIsLoading(false);
  }, [toast]);

  React.useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleFormSubmit = async (data: PrendaFormData, itemId?: string) => { // Updated to PrendaFormData
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, String(value));
      }
    });
    
    const action = itemId ? updatePrendaAction(itemId, formData) : addPrendaAction(formData); // Updated action names
    const result = await action;

    if (!result.error) {
      fetchItems(); 
    }
    return result; 
  };

  const handleDeleteItem = async () => {
    if (!itemToDelete) return;

    const result = await deletePrendaAction(itemToDelete.id); // Updated action name
    if (result.error) {
      toast({ title: 'Error', description: result.error, variant: 'destructive' });
    } else {
      toast({ title: 'Éxito', description: 'Prenda eliminada correctamente.', variant: 'default' });
      fetchItems(); 
    }
    setItemToDelete(null); 
  };

  const openEditForm = (item: Prenda) => { // Updated to Prenda
    setEditingItem(item);
    setIsFormOpen(true);
  };

  const openNewForm = () => {
    setEditingItem(null);
    setIsFormOpen(true);
  };
  
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <AppHeader />
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-foreground">Mi Armario</h1>
          <Button onClick={openNewForm} className="shadow-md">
            <PlusCircle className="mr-2 h-5 w-5" />
            Agregar Prenda
          </Button>
        </div>

        {isLoading && (
          <div className="flex justify-center items-center py-10">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="ml-4 text-lg text-muted-foreground">Cargando prendas...</p>
          </div>
        )}

        {error && !isLoading && (
          <div className="my-6 p-4 bg-destructive/10 border border-destructive/30 text-destructive rounded-lg flex items-center gap-3">
            <AlertTriangle className="h-6 w-6" />
            <div>
              <h3 className="font-semibold">Error al cargar las prendas</h3>
              <p className="text-sm">{error}</p>
              <Button variant="link" onClick={fetchItems} className="p-0 h-auto text-destructive mt-1">Intentar de nuevo</Button>
            </div>
          </div>
        )}

        {!isLoading && !error && items.length === 0 && (
          <div className="text-center py-10 border-2 border-dashed border-border rounded-lg">
            <PackageOpen className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">Tu armario está vacío</h2>
            <p className="text-muted-foreground mb-4">Empieza agregando algunas prendas para organizar tu estilo.</p>
            <Button onClick={openNewForm}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Agregar tu Primera Prenda
            </Button>
          </div>
        )}

        {!isLoading && !error && items.length > 0 && (
          <Card className="shadow-lg rounded-xl">
            <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">Imagen</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Color</TableHead>
                  <TableHead>Talla</TableHead>
                  <TableHead>Estilo</TableHead>
                  <TableHead className="text-right w-[120px]">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="relative h-16 w-16 rounded-md overflow-hidden border border-border">
                        <Image
                          src={item.imagen_url || `https://placehold.co/64x64.png?text=${encodeURIComponent(item.nombre.substring(0,2))}`}
                          alt={item.nombre}
                          layout="fill"
                          objectFit="cover"
                          data-ai-hint={`${item.tipo.toLowerCase()} ${item.color.toLowerCase()}`.substring(0,50)}
                        />
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{item.nombre}</TableCell>
                    <TableCell>{item.tipo}</TableCell>
                    <TableCell>{item.color}</TableCell>
                    <TableCell>{item.talla}</TableCell>
                    <TableCell>{item.estilo}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => openEditForm(item)} className="mr-2 hover:text-primary">
                        <Edit className="h-4 w-4" />
                        <span className="sr-only">Editar</span>
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" onClick={() => setItemToDelete(item)} className="hover:text-destructive">
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Eliminar</span>
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Esta acción no se puede deshacer. Esto eliminará permanentemente la prenda &quot;{itemToDelete?.nombre}&quot; de tu armario.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel onClick={() => setItemToDelete(null)}>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDeleteItem} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
                              Eliminar
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
           </CardContent>
          </Card>
        )}

        <ClothingForm
          isOpen={isFormOpen}
          onOpenChange={setIsFormOpen}
          onSubmit={handleFormSubmit}
          initialData={editingItem}
          itemId={editingItem?.id}
        />
      </main>
       <footer className="py-6 text-center text-sm text-muted-foreground border-t">
        © {new Date().getFullYear()} EstilosIA. Gestión de Armario.
      </footer>
    </div>
  );
}
