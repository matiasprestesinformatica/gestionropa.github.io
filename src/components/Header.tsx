
import Link from 'next/link';
import { Logo } from '@/components/icons/Logo';
import { Button } from '@/components/ui/button'; // Added for navigation
import { Shirt } from 'lucide-react'; // Added for closet icon

export function AppHeader() {
  return (
    <header className="py-6 px-4 md:px-8 border-b border-border/50 shadow-sm bg-card">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" aria-label="Go to homepage">
            <Logo />
          </Link>
        </div>
        <div className="flex items-center gap-4">
          <p className="text-sm text-muted-foreground hidden sm:block">
            Combinacion con IA Express
          </p>
          <Link href="/closet" passHref legacyBehavior>
            <Button variant="outline" size="sm" asChild>
              <a>
                <Shirt className="mr-2 h-4 w-4" />
                Mi Armario
              </a>
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
