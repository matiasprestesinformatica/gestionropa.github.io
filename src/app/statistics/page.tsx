
// src/app/statistics/page.tsx
import { Navbar } from '@/components/ui/Navbar';
import { Footer } from '@/components/ui/Footer'; // Import Footer

export default function StatisticsPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Navbar />
      <main className="flex-grow container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-foreground mb-6">Estadísticas</h1>
        <div className="bg-card p-6 rounded-lg shadow">
          <p className="text-muted-foreground">
            Esta sección está en construcción. ¡Pronto podrás ver estadísticas interesantes sobre tu armario y uso de prendas!
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
