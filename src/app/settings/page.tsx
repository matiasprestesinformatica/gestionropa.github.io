
// src/app/settings/page.tsx
import { Navbar } from '@/components/ui/Navbar';

export default function SettingsPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-foreground mb-6">Configuración</h1>
        <div className="bg-card p-6 rounded-lg shadow">
          <p className="text-muted-foreground">
            Esta sección está en construcción. ¡Aquí podrás configurar tus preferencias de la aplicación!
          </p>
        </div>
      </main>
      <footer className="py-6 text-center text-sm text-muted-foreground border-t">
        © {new Date().getFullYear()} EstilosIA. Todos los derechos reservados.
      </footer>
    </div>
  );
}
