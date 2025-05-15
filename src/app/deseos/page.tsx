
// src/app/deseos/page.tsx
'use client';

import * as React from 'react';
import { Navbar } from '@/components/ui/Navbar';
import { Footer } from '@/components/ui/Footer';
import { Button } from '@/components/ui/button';
import { WishlistItemCard } from '@/components/wishlist/WishlistItemCard';
import { WishlistForm } from '@/components/wishlist/WishlistForm';
import { PlusCircle, HeartCrack, Loader2 } from 'lucide-react';
import type { WishlistItem, WishlistFormData } from '@/types';
import { useToast } from '@/hooks/use-toast';

// Mock data - replace with actual data fetching
const mockWishlistItems: WishlistItem[] = [
  { 
    id: '1', name: 'Zapatillas Deportivas Blancas', 
    imageUrl: 'https://placehold.co/300x400.png', 
    estimatedPrice: 75, storeUrl: 'https://ejemplo.com/zapatillas',
    status: 'pending', added_at: new Date().toISOString()
  },
  { 
    id: '2', name: 'Bolso de Cuero Negro', 
    imageUrl: 'https://placehold.co/300x400.png', 
    estimatedPrice: 120,
    status: 'pending', added_at: new Date().toISOString()
  },
  { 
    id: '3', name: 'Vestido Floral Verano', 
    imageUrl: 'https://placehold.co/300x400.png', 
    status: 'purchased', added_at: new Date().toISOString()
  },
];

export default function DeseosPage() {
  const [wishlistItems, setWishlistItems] = React.useState<WishlistItem[]>(mockWishlistItems);
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [editingItem, setEditingItem] = React.useState<WishlistItem | null>(null);
  const [isLoading, setIsLoading] = React.useState(false); // For data fetching
  const { toast } = useToast();

  // TODO: Implement data fetching, adding, updating, deleting wishlist items via server actions

  const handleFormSubmit = async (data: WishlistFormData, itemId?: string) => {
    // Simulate API call
    console.log("Submitting wishlist item:", data, "Item ID:", itemId);
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (itemId) { // Editing
      setWishlistItems(prev => prev.map(item => item.id === itemId ? { ...item, ...data, id: itemId, status: item.status, added_at: item.added_at } : item));
      toast({ title: "Éxito", description: "Elemento de la lista de deseos actualizado." });
    } else { // Adding
      const newItem: WishlistItem = { ...data, id: Date.now().toString(), status: 'pending', added_at: new Date().toISOString() };
      setWishlistItems(prev => [newItem, ...prev]);
      toast({ title: "Éxito", description: "Elemento agregado a la lista de deseos." });
    }
    return {}; // Return empty object or actual result
  };

  const handleEditItem = (item: WishlistItem) => {
    setEditingItem(item);
    setIsFormOpen(true);
  };

  const handleDeleteItem = async (itemId: string) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    setWishlistItems(prev => prev.filter(item => item.id !== itemId));
    toast({ title: "Eliminado", description: "Elemento eliminado de la lista de deseos." });
  };

  const handleStatusChange = async (itemId: string, status: WishlistItem['status']) => {
     // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    setWishlistItems(prev => prev.map(item => item.id === itemId ? {...item, status} : item));
    toast({ title: "Actualizado", description: `Estado del elemento cambiado a ${status}.` });
  };

  const openNewForm = () => {
    setEditingItem(null);
    setIsFormOpen(true);
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Navbar />
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-foreground">Lista de Deseos</h1>
          <Button onClick={openNewForm} className="shadow-md">
            <PlusCircle className="mr-2 h-5 w-5" />
            Agregar Deseo
          </Button>
        </div>

        {isLoading && (
            <div className="flex justify-center items-center py-10">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        )}

        {!isLoading && wishlistItems.length === 0 && (
          <div className="text-center py-10 border-2 border-dashed border-border rounded-lg">
            <HeartCrack className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">Tu lista de deseos está vacía</h2>
            <p className="text-muted-foreground mb-4">Añade prendas que te gustaría comprar o tener.</p>
            <Button onClick={openNewForm}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Agregar tu Primer Deseo
            </Button>
          </div>
        )}

        {!isLoading && wishlistItems.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {wishlistItems.map((item) => (
              <WishlistItemCard 
                key={item.id} 
                item={item} 
                onEdit={handleEditItem}
                onDelete={handleDeleteItem}
                onStatusChange={handleStatusChange}
              />
            ))}
          </div>
        )}

        <WishlistForm
          isOpen={isFormOpen}
          onOpenChange={setIsFormOpen}
          onSubmit={handleFormSubmit}
          initialData={editingItem}
        />
      </main>
      <Footer />
    </div>
  );
}
