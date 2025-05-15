
// src/app/calendario/page.tsx
'use client';

import * as React from 'react';
import { Navbar } from '@/components/ui/Navbar';
import { Footer } from '@/components/ui/Footer';
import { Calendar } from '@/components/ui/calendar'; // ShadCN Calendar
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, Info } from 'lucide-react';
import type { CalendarEvent } from '@/types';

// Mock data for events - replace with actual data fetching
const mockEvents: CalendarEvent[] = [
  { id: '1', date: new Date(2024, 6, 20), title: 'Look Casual', description: 'Camiseta y Jeans' },
  { id: '2', date: new Date(2024, 6, 22), title: 'Trabajo', description: 'Traje formal' },
];


export default function CalendarioPage() {
  const [date, setDate] = React.useState<Date | undefined>(new Date());
  const [events, setEvents] = React.useState<CalendarEvent[]>(mockEvents); // Store your events

  const handleAddEvent = (selectedDate: Date | undefined) => {
    if (!selectedDate) {
      alert("Por favor, selecciona una fecha.");
      return;
    }
    // TODO: Implement logic to add an event (e.g., open a dialog to select prenda/look)
    alert(`Funcionalidad "Agregar evento" para ${selectedDate.toLocaleDateString()} pendiente.`);
  };
  
  const selectedDateEvents = events.filter(event => 
    date && event.date.toDateString() === date.toDateString()
  );

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Navbar />
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-foreground">Calendario de Atuendos</h1>
           <Button onClick={() => handleAddEvent(date)} className="shadow-md">
             <PlusCircle className="mr-2 h-5 w-5" />
             Asignar Atuendo a Fecha
           </Button>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <Card className="md:col-span-2 shadow-lg rounded-xl">
            <CardContent className="p-2 sm:p-4 flex justify-center">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                className="rounded-md"
                ISOWeek
                locale={{
                  localize: {
                    month: n => ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'][n],
                    day: n => ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'][n],
                    ordinalNumber: n => `${n}º`,
                    era: G => (G === 1 ? 'DC' : 'AC'),
                    quarter: Q => `T${Q}`,
                    week: W => `S${W}`,
                    dayPeriod: (wd: number) => (wd < 12 ? 'AM' : 'PM'),
                  },
                  formatLong: {
                    date: () => 'dd/mm/yyyy',
                    time: () => 'hh:mm',
                    dateTime: () => 'dd/mm/yyyy hh:mm',
                  },
                }}
                modifiers={{
                  event: events.map(event => event.date)
                }}
                modifiersClassNames={{
                  event: 'bg-primary/20 rounded-full text-primary-foreground'
                }}
              />
            </CardContent>
          </Card>

          <Card className="md:col-span-1 shadow-lg rounded-xl">
            <CardHeader>
              <CardTitle>Eventos para {date ? date.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'Hoy'}</CardTitle>
              <CardDescription>Atuendos y prendas asignadas.</CardDescription>
            </CardHeader>
            <CardContent>
              {selectedDateEvents.length > 0 ? (
                <ul className="space-y-3">
                  {selectedDateEvents.map(event => (
                    <li key={event.id} className="p-3 bg-accent/50 rounded-md text-sm">
                      <p className="font-semibold text-accent-foreground">{event.title}</p>
                      {event.description && <p className="text-muted-foreground text-xs">{event.description}</p>}
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-center py-6">
                  <Info className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">No hay atuendos asignados para esta fecha.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}
