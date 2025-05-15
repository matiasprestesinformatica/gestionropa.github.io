
'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Logo } from '@/components/icons/Logo';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Menu,
  X,
  Shirt,
  BarChart3,
  Settings,
  Home,
  Sparkles,
  PlusCircle,
  LayoutDashboard,
  CalendarDays,
  Archive,
  ShoppingBag,
  ChevronDown,
  Wand2, // Icon for Sugerencias dropdown
  SlidersHorizontal, // Icon for Más Ajustes dropdown
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavLinkItem {
  href: string;
  label: string;
  icon: React.ElementType;
}

// Navigation structure
const mainDesktopLinks: NavLinkItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/closet', label: 'Armario', icon: Shirt },
  { href: '/calendario', label: 'Calendario', icon: CalendarDays },
  { href: '/statistics', label: 'Estadísticas', icon: BarChart3 },
];

const suggestionsDropdownItems: NavLinkItem[] = [
  { href: '/', label: 'Sugerencias AI', icon: Home },
  { href: '/looks', label: 'Mis Looks', icon: Sparkles },
];

const moreSettingsDropdownItems: NavLinkItem[] = [
  { href: '/configuracion', label: 'Configuración', icon: Settings },
  { href: '/archivo', label: 'Archivo', icon: Archive },
  { href: '/deseos', label: 'Lista Deseos', icon: ShoppingBag },
];

// Flattened list for mobile navigation
const allMobileNavLinks: NavLinkItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/', label: 'Sugerencias AI', icon: Home },
  { href: '/closet', label: 'Armario', icon: Shirt },
  { href: '/looks', label: 'Mis Looks', icon: Sparkles },
  { href: '/calendario', label: 'Calendario', icon: CalendarDays },
  { href: '/statistics', label: 'Estadísticas', icon: BarChart3 },
  { href: '/archivo', label: 'Archivo', icon: Archive },
  { href: '/deseos', label: 'Lista Deseos', icon: ShoppingBag },
  { href: '/configuracion', label: 'Configuración', icon: Settings },
];

export function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const pathname = usePathname();

  const isLinkActive = (href: string) => {
    if (href === '/dashboard' && pathname === '/dashboard') return true;
    if (href === '/' && pathname === '/') return true;
    // For other paths, ensure it's not just a partial match for the root '/'
    return href !== '/' && href !== '/dashboard' && pathname.startsWith(href);
  };

  const isDropdownActive = (itemHrefs: string[]) => {
    return itemHrefs.some(href => isLinkActive(href));
  };

  return (
    <nav className="bg-card border-b border-border/70 shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link href="/dashboard" aria-label="EstilosIA Home" className="flex items-center">
              <Logo className="h-8 w-auto" />
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex md:ml-6 md:space-x-1 lg:space-x-2 items-center">
            {mainDesktopLinks.map((link) => (
              <Button
                key={link.label}
                variant="ghost"
                asChild
                className={cn(
                  "px-3 py-2 rounded-md text-sm font-medium text-foreground hover:bg-accent hover:text-accent-foreground",
                  isLinkActive(link.href) && "bg-accent text-accent-foreground"
                )}
              >
                <Link href={link.href}>
                  <link.icon className="mr-2 h-4 w-4 opacity-80" />
                  {link.label}
                </Link>
              </Button>
            ))}

            {/* Sugerencias Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className={cn(
                    "px-3 py-2 rounded-md text-sm font-medium text-foreground hover:bg-accent hover:text-accent-foreground flex items-center",
                    isDropdownActive(suggestionsDropdownItems.map(item => item.href)) && "bg-accent text-accent-foreground"
                  )}
                >
                  <Wand2 className="mr-2 h-4 w-4 opacity-80" />
                  Sugerencias
                  <ChevronDown className="ml-1 h-4 w-4 opacity-70" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {suggestionsDropdownItems.map((item) => (
                  <DropdownMenuItem key={item.label} asChild>
                    <Link href={item.href} className={cn(isLinkActive(item.href) && "bg-accent/50")}>
                      <item.icon className="mr-2 h-4 w-4 opacity-80" />
                      {item.label}
                    </Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Más Ajustes Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className={cn(
                    "px-3 py-2 rounded-md text-sm font-medium text-foreground hover:bg-accent hover:text-accent-foreground flex items-center",
                     isDropdownActive(moreSettingsDropdownItems.map(item => item.href)) && "bg-accent text-accent-foreground"
                  )}
                >
                  <SlidersHorizontal className="mr-2 h-4 w-4 opacity-80" />
                  Más Ajustes
                  <ChevronDown className="ml-1 h-4 w-4 opacity-70" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {moreSettingsDropdownItems.map((item) => (
                  <DropdownMenuItem key={item.label} asChild>
                    <Link href={item.href} className={cn(isLinkActive(item.href) && "bg-accent/50")}>
                      <item.icon className="mr-2 h-4 w-4 opacity-80" />
                      {item.label}
                    </Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Right side: Add Prenda Button and Mobile Menu Trigger */}
          <div className="flex items-center gap-2">
            <Button asChild className="hidden sm:inline-flex">
              <Link href="/closet?action=add">
                <PlusCircle className="mr-2 h-5 w-5" />
                Agregar Prenda
              </Link>
            </Button>

            {/* Mobile Menu Trigger */}
            <div className="md:hidden">
              <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" aria-label="Abrir menú principal">
                    <Menu className="h-6 w-6" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-72 sm:w-80 bg-card p-0 flex flex-col">
                  <SheetHeader className="p-4 border-b border-border flex-row justify-between items-center">
                     <Link href="/dashboard" onClick={() => setIsMobileMenuOpen(false)}>
                        <Logo className="h-7 w-auto" />
                     </Link>
                    <SheetClose asChild>
                      <Button variant="ghost" size="icon" aria-label="Cerrar menú">
                        <X className="h-6 w-6" />
                      </Button>
                    </SheetClose>
                  </SheetHeader>
                  <div className="flex-grow py-4 px-2 space-y-1 overflow-y-auto">
                    {allMobileNavLinks.map((link) => ( // Use the flattened list for mobile
                      <SheetClose asChild key={link.label}>
                        <Link
                          href={link.href}
                          className={cn(
                            'flex items-center px-3 py-3 rounded-md text-base font-medium text-foreground hover:bg-accent hover:text-accent-foreground transition-colors group',
                            isLinkActive(link.href) && "bg-accent text-accent-foreground"
                          )}
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          <link.icon className={cn("mr-3 h-5 w-5 text-muted-foreground group-hover:text-accent-foreground", isLinkActive(link.href) && "text-accent-foreground")} />
                          {link.label}
                        </Link>
                      </SheetClose>
                    ))}
                  </div>
                   <div className="p-4 border-t border-border mt-auto">
                     <SheetClose asChild>
                      <Button asChild className="w-full">
                        <Link href="/closet?action=add" onClick={() => setIsMobileMenuOpen(false)}>
                           <PlusCircle className="mr-2 h-5 w-5" />
                          Agregar Prenda
                        </Link>
                      </Button>
                     </SheetClose>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
