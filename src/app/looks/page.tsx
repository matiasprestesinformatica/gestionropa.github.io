
// src/app/looks/page.tsx
'use client';

import * as React from 'react';
import { Navbar } from '@/components/ui/Navbar';
import { Footer } from '@/components/ui/Footer';
import { Button } from '@/components/ui/button';
import { LookCard } from '@/components/looks/LookCard';
import { PlusCircle, Brush } from 'lucide-react';
import type { Look } from '@/types';

// Mock data - replace with actual data fetching from Supabase
const mockLooks: Look[] = [
  { 
    id: '1', 
    name: 'Look Casual de Verano', 
    items: [], // Populate with actual Prenda items or OutfitItems
    imageUrl: 'https://placehold.co/400x500.png',
    description: 'Perfecto para un día soleado y relajado.',
    created_at: new Date().toISOString(),
  },
  { 
    id: '2', 
    name: 'Atuendo Formal de Oficina', 
    items: [],
    imageUrl: 'https://placehold.co/400x500.png',
    description: 'Elegante y profesional para el trabajo.',
    created_at: new Date().toISOString(),
  },
];

export default function LooksPage() {
  const [looks, setLooks] = React.useState<Look[]>(mockLooks);
  const [isLoading, setIsLoading] = React.useState(false); // Set to true when fetching data

  // TODO: Implement data fetching for looks
  // React.useEffect(() => {
  //   const fetchLooks = async () => {
  //     setIsLoading(true);
  //     // const fetchedLooks = await getLooksAction(); // Create this action
  //     // setLooks(fetchedLooks);
  //     setIsLoading(false);
  //   };
  //   fetchLooks();
  // }, []);

  const handleCreateNewLook = () => {
    // TODO: Implement navigation or modal opening for look creation
    alert('Funcionalidad "Crear Nuevo Look" pendiente de implementación.');
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Navbar />
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-foreground">Mis Looks</h1>
          <Button onClick={handleCreateNewLook} className="shadow-md">
            <PlusCircle className="mr-2 h-5 w-5" />
            Crear Nuevo Look
          </Button>
        </div>

        {isLoading && <p className="text-muted-foreground">Cargando looks...</p>}
        
        {!isLoading && looks.length === 0 && (
          <div className="text-center py-10 border-2 border-dashed border-border rounded-lg">
            <Brush className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">Aún no has guardado ningún look</h2>
            <p className="text-muted-foreground mb-4">Empieza a crear combinaciones y guárdalas aquí.</p>
            <Button onClick={handleCreateNewLook}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Crear tu Primer Look
            </Button>
          </div>
        )}

        {!isLoading && looks.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {looks.map((look) => (
              <LookCard key={look.id} look={look} />
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
