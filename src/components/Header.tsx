import { Logo } from '@/components/icons/Logo';

export function AppHeader() {
  return (
    <header className="py-6 px-4 md:px-8 border-b border-border/50 shadow-sm bg-card">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Logo />
        </div>
        <p className="text-sm text-muted-foreground hidden sm:block">
          Your Personal AI Fashion Advisor
        </p>
      </div>
    </header>
  );
}
