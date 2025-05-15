
// src/app/privacy-policy/page.tsx
import { Navbar } from '@/components/ui/Navbar';
import { Footer } from '@/components/ui/Footer';

export default function PrivacyPolicyPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Navbar />
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold text-foreground mb-6">Política de Privacidad</h1>
          <div className="prose prose-sm sm:prose-base lg:prose-lg dark:prose-invert bg-card p-6 rounded-lg shadow">
            <p>
              Bienvenido a EstilosIA. Tu privacidad es importante para nosotros.
            </p>
            <p>
              Esta es una política de privacidad de ejemplo. Deberías reemplazar este contenido
              con tu propia política de privacidad detallada, cubriendo aspectos como:
            </p>
            <ul>
              <li>Qué información recolectamos (datos personales, datos de uso, etc.).</li>
              <li>Cómo usamos la información recolectada.</li>
              <li>Con quién compartimos tu información.</li>
              <li>Cómo protegemos tu información.</li>
              <li>Tus derechos sobre tus datos personales.</li>
              <li>Uso de cookies y tecnologías de seguimiento.</li>
              <li>Enlaces a sitios de terceros.</li>
              <li>Cambios a esta política de privacidad.</li>
              <li>Información de contacto.</li>
            </ul>
            <p>
              [Fecha de última actualización: DD/MM/AAAA]
            </p>
            <p>
              Por favor, consulta a un profesional legal para asegurarte de que tu política de privacidad
              cumple con todas las regulaciones aplicables.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
