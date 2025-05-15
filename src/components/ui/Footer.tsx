
import Link from 'next/link';
import { Separator } from '@/components/ui/separator';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-card border-t border-border/70 mt-auto">
      <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center space-y-4">
          <div className="text-sm text-muted-foreground">
            © {currentYear} EstilosIA. Gestión de Armario.
          </div>
          <Separator className="w-1/2 max-w-xs" />
          <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm">
            <Link href="/privacy-policy" className="text-muted-foreground hover:text-foreground transition-colors">
              Política de Privacidad
            </Link>
            {/* Add more links here if needed, e.g., Terms of Service */}
          </nav>
        </div>
      </div>
    </footer>
  );
}
