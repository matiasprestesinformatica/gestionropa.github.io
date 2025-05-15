
// src/app/settings/page.tsx
import { Navbar } from '@/components/ui/Navbar';
import { Footer } from '@/components/ui/Footer'; // Import Footer

export default function SettingsPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Navbar />
      <main className="flex-grow container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-foreground mb-6">Configuración</h1>
        <div className="bg-card p-6 rounded-lg shadow">
          <p className="text-muted-foreground">
            Esta sección está en construcción. ¡Aquí podrás configurar tus preferencias de la aplicación!
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
