
// src/app/configuracion/page.tsx
'use client';

import * as React from 'react';
import { Navbar } from '@/components/ui/Navbar';
import { Footer } from '@/components/ui/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Palette, Shirt, SunMoon, Mail, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { styleOptions } from '@/components/StyleSelection'; // Reusing styleOptions

// This would typically come from user settings in DB
interface UserPreferences {
  favoriteColorPalette: string;
  predominantStyle: string;
  defaultSizes: Record<string, string>; // e.g. { "Camisa": "M", "Pantalón": "32" }
  darkMode: boolean;
  email?: string;
}

const CLOTHING_TYPES_FOR_SIZES = ['Camisa', 'Pantalón', 'Zapatos', 'Chaqueta'] as const;


export default function ConfiguracionPage() {
  const { toast } = useToast();
  const [preferences, setPreferences] = React.useState<UserPreferences>({
    favoriteColorPalette: 'neutros', // example
    predominantStyle: 'casual', // example
    defaultSizes: { "Camisa": "M", "Pantalón": "32" },
    darkMode: false,
    email: '',
  });
  const [isLoading, setIsLoading] = React.useState(false); // For saving state

  // TODO: Implement fetching user preferences from DB
  // React.useEffect(() => {
  //   const fetchPrefs = async () => { /* ... */ };
  //   fetchPrefs();
  // }, []);

  const handleInputChange = (field: keyof UserPreferences, value: any) => {
    setPreferences(prev => ({ ...prev, [field]: value }));
  };

  const handleSizeChange = (type: string, size: string) => {
    setPreferences(prev => ({
      ...prev,
      defaultSizes: { ...prev.defaultSizes, [type]: size },
    }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // TODO: Implement saving preferences to DB via a server action
    // const result = await saveUserPreferencesAction(preferences);
    // if (result.error) {
    //   toast({ title: "Error", description: result.error, variant: "destructive" });
    // } else {
    //   toast({ title: "Éxito", description: "Preferencias guardadas." });
    // }
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
    toast({ title: "Guardado (Simulado)", description: "Tus preferencias han sido guardadas (simulación)." });
    setIsLoading(false);
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Navbar />
      <main className="flex-grow container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-foreground mb-8">Configuración</h1>
        
        <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-8">
          <Card className="shadow-lg rounded-xl">
            <CardHeader>
              <CardTitle className="flex items-center"><Palette className="mr-2 h-5 w-5 text-primary" />Estilo Personal</CardTitle>
              <CardDescription>Define tus preferencias de estilo para mejores sugerencias.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="favoriteColorPalette">Paleta de Colores Favorita</Label>
                <Select 
                  value={preferences.favoriteColorPalette} 
                  onValueChange={(value) => handleInputChange('favoriteColorPalette', value)}
                >
                  <SelectTrigger id="favoriteColorPalette">
                    <SelectValue placeholder="Selecciona tu paleta" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="neutros">Neutros</SelectItem>
                    <SelectItem value="vibrantes">Vibrantes</SelectItem>
                    <SelectItem value="pasteles">Pasteles</SelectItem>
                    <SelectItem value="oscuros">Oscuros</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="predominantStyle">Estilo Predominante</Label>
                 <Select 
                  value={preferences.predominantStyle} 
                  onValueChange={(value) => handleInputChange('predominantStyle', value)}
                >
                  <SelectTrigger id="predominantStyle">
                    <SelectValue placeholder="Selecciona tu estilo principal" />
                  </SelectTrigger>
                  <SelectContent>
                    {styleOptions.map(opt => <SelectItem key={opt.id} value={opt.id}>{opt.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg rounded-xl">
            <CardHeader>
              <CardTitle className="flex items-center"><Shirt className="mr-2 h-5 w-5 text-primary" />Tallas por Defecto</CardTitle>
              <CardDescription>Define tus tallas comunes para agilizar la carga de prendas.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {CLOTHING_TYPES_FOR_SIZES.map(type => (
                <div key={type} className="grid grid-cols-3 gap-4 items-center">
                  <Label htmlFor={`size-${type}`} className="col-span-1">{type}</Label>
                  <Input 
                    id={`size-${type}`} 
                    value={preferences.defaultSizes[type] || ''}
                    onChange={(e) => handleSizeChange(type, e.target.value)}
                    placeholder="Ej: M, 32, 40"
                    className="col-span-2"
                  />
                </div>
              ))}
            </CardContent>
          </Card>
          
          <Card className="shadow-lg rounded-xl">
            <CardHeader>
              <CardTitle className="flex items-center"><SunMoon className="mr-2 h-5 w-5 text-primary" />Apariencia</CardTitle>
            </CardHeader>
            <CardContent>
               <div className="flex items-center justify-between">
                <Label htmlFor="darkMode" className="flex flex-col space-y-1">
                  <span>Modo Oscuro</span>
                  <span className="font-normal leading-snug text-muted-foreground">
                    Activa el tema oscuro para la aplicación.
                  </span>
                </Label>
                <Switch 
                  id="darkMode" 
                  checked={preferences.darkMode}
                  onCheckedChange={(checked) => handleInputChange('darkMode', checked)} 
                />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg rounded-xl">
            <CardHeader>
              <CardTitle className="flex items-center"><Mail className="mr-2 h-5 w-5 text-primary" />Cuenta</CardTitle>
            </CardHeader>
            <CardContent>
              <div>
                <Label htmlFor="email">Correo Electrónico (Opcional)</Label>
                <Input 
                  id="email" 
                  type="email" 
                  value={preferences.email || ''}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="tu@email.com"
                />
                <p className="text-xs text-muted-foreground mt-1">Para notificaciones y recuperación de cuenta.</p>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end pt-4">
            <Button type="submit" className="w-full sm:w-auto" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Save className="mr-2 h-4 w-4" /> Guardar Preferencias
            </Button>
          </div>
        </form>
      </main>
      <Footer />
    </div>
  );
}
