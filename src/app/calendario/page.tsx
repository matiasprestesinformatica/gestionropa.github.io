
// src/app/calendario/page.tsx
'use client';

import * as React from 'react';
import { Navbar } from '@/components/ui/Navbar';
import { Footer } from '@/components/ui/Footer';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AssignmentModal } from '@/components/calendario/AssignmentModal';
import { AssignmentCard } from '@/components/calendario/AssignmentCard';
import { PlusCircle, Info, CalendarCheck, Loader2, AlertTriangle, RotateCcw, CalendarDays } from 'lucide-react';
import type { CalendarAssignment, Prenda, Look, CalendarAssignmentFormData } from '@/types';
import { getCalendarAssignmentsAction, addCalendarAssignmentAction, updateCalendarAssignmentAction, deleteCalendarAssignmentAction, getPrendasAction, getLooksAction } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { format, startOfMonth, endOfMonth, isSameDay, getMonth, getYear, addMonths, subMonths } from 'date-fns';
import { es } from 'date-fns/locale'; // Changed from require
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';


export default function CalendarioPage() {
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(new Date());
  const [currentMonthView, setCurrentMonthView] = React.useState<Date>(new Date()); // For fetching assignments
  const [assignments, setAssignments] = React.useState<CalendarAssignment[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingAssignment, setEditingAssignment] = React.useState<CalendarAssignment | null>(null);

  const [availablePrendas, setAvailablePrendas] = React.useState<Prenda[]>([]);
  const [availableLooks, setAvailableLooks] = React.useState<Look[]>([]);
  
  const [assignmentToDelete, setAssignmentToDelete] = React.useState<CalendarAssignment | null>(null);


  const { toast } = useToast();

  const fetchAssignments = React.useCallback(async (monthDate: Date) => {
    setIsLoading(true);
    setError(null);
    const result = await getCalendarAssignmentsAction(monthDate);
    if (result.error) {
      setError(result.error);
      toast({ title: "Error", description: result.error, variant: "destructive" });
      setAssignments([]);
    } else {
      setAssignments(result.data || []);
    }
    setIsLoading(false);
  }, [toast]);

  const fetchPrendasAndLooks = React.useCallback(async () => {
    // This only needs to be done once, or if prendas/looks change often
    const [prendasResult, looksResult] = await Promise.all([
      getPrendasAction(),
      getLooksAction(),
    ]);
    if (prendasResult.data) setAvailablePrendas(prendasResult.data.filter(p => !p.is_archived));
    if (looksResult.data) setAvailableLooks(looksResult.data);
  }, []);

  React.useEffect(() => {
    fetchAssignments(currentMonthView);
    fetchPrendasAndLooks();
  }, [fetchAssignments, fetchPrendasAndLooks, currentMonthView]);
  
  const handleMonthChange = (month: Date) => {
    setCurrentMonthView(month);
  };

  const handleAddOrEditAssignment = (date: Date | undefined, assignment?: CalendarAssignment) => {
    if (!date) {
      toast({ title: "Error", description: "Por favor, selecciona una fecha primero.", variant: "destructive" });
      return;
    }
    setSelectedDate(date); // Ensure selectedDate is set for the modal
    setEditingAssignment(assignment || null);
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (data: CalendarAssignmentFormData, assignmentId?: number) => {
    const action = assignmentId
      ? updateCalendarAssignmentAction(assignmentId, data)
      : addCalendarAssignmentAction(data);
    
    const result = await action;
    if (result.error) {
      toast({ title: 'Error', description: result.error, variant: 'destructive' });
    } else {
      toast({ title: 'Éxito', description: `Asignación ${assignmentId ? 'actualizada' : 'creada'}.` });
      fetchAssignments(currentMonthView); // Refresh assignments for the current month
    }
    return result;
  };

  const handleDeleteConfirmation = (assignment: CalendarAssignment) => {
    setAssignmentToDelete(assignment);
  };

  const executeDelete = async () => {
    if (!assignmentToDelete) return;
    const result = await deleteCalendarAssignmentAction(assignmentToDelete.id);
    if (result.error) {
      toast({ title: 'Error', description: result.error, variant: 'destructive' });
    } else {
      toast({ title: 'Éxito', description: 'Asignación eliminada.' });
      fetchAssignments(currentMonthView);
      // If the deleted assignment was for the currently selectedDate, clear it
      if (selectedDate && getAssignmentsForDate(selectedDate).length === 0) {
        // No more assignments for this day after delete
      }
    }
    setAssignmentToDelete(null);
  };

  const getAssignmentsForDate = (date: Date | undefined): CalendarAssignment[] => {
    if (!date) return [];
    return assignments.filter(event => {
        // Ensure event.fecha is a valid date string before parsing
        // Supabase DATE type returns 'YYYY-MM-DD' string
        const eventDate = new Date(event.fecha + 'T00:00:00'); // Add time part to avoid timezone issues with isSameDay
        return isSameDay(eventDate, date);
    });
  };
  
  const selectedDateAssignments = getAssignmentsForDate(selectedDate);

  const eventDays = React.useMemo(() => 
    assignments.map(a => new Date(a.fecha + 'T00:00:00')) // Add time part for consistency
  , [assignments]);

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Navbar />
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Calendario de Atuendos</h1>
            <p className="text-muted-foreground text-sm">Organiza y visualiza tus outfits diarios.</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => { setSelectedDate(new Date()); setCurrentMonthView(new Date()); }} variant="outline" className="shadow">
              <CalendarDays className="mr-2 h-4 w-4"/> Hoy
            </Button>
            <Button onClick={() => handleAddOrEditAssignment(selectedDate || new Date())} className="shadow-md">
             <PlusCircle className="mr-2 h-5 w-5" />
             Asignar a Fecha
           </Button>
          </div>
        </div>

        {error && !isLoading && (
          <div className="my-6 p-4 bg-destructive/10 border border-destructive/30 text-destructive rounded-lg flex items-center gap-3">
            <AlertTriangle className="h-6 w-6" />
            <div>
              <h3 className="font-semibold">Error al cargar asignaciones</h3>
              <p className="text-sm">{error}</p>
              <Button variant="link" onClick={() => fetchAssignments(currentMonthView)} className="p-0 h-auto text-destructive mt-1">
                <RotateCcw className="mr-2 h-4 w-4"/>Intentar de nuevo
              </Button>
            </div>
          </div>
        )}

        <div className="grid md:grid-cols-3 gap-8">
          <Card className="md:col-span-2 shadow-lg rounded-xl">
            <CardContent className="p-1 sm:p-2 flex justify-center">
              {isLoading && !error ? (
                <div className="flex justify-center items-center h-96">
                  <Loader2 className="h-12 w-12 animate-spin text-primary" />
                </div>
              ) : (
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  month={currentMonthView}
                  onMonthChange={handleMonthChange}
                  className="rounded-md w-full"
                  ISOWeek
                  locale={es}
                  modifiers={{ event: eventDays }}
                  modifiersClassNames={{
                    event: 'bg-primary/20 rounded-full text-primary-foreground font-semibold'
                  }}
                />
              )}
            </CardContent>
          </Card>

          <div className="md:col-span-1 space-y-6">
            <Card className="shadow-lg rounded-xl">
              <CardHeader>
                <CardTitle className="text-lg">
                  {selectedDate ? format(selectedDate, "PPP", { locale: es }) : 'Selecciona una fecha'}
                </CardTitle>
                 <CardDescription>Atuendos asignados para este día.</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading && <div className="text-center py-6"><Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground"/></div>}
                {!isLoading && selectedDateAssignments.length > 0 ? (
                  <div className="space-y-4">
                    {selectedDateAssignments.map(event => (
                      <AssignmentCard 
                        key={event.id} 
                        assignment={event}
                        onEdit={() => handleAddOrEditAssignment(selectedDate, event)}
                        onDelete={() => handleDeleteConfirmation(event)}
                      />
                    ))}
                  </div>
                ) : (
                  !isLoading && (
                    <div className="text-center py-6 text-muted-foreground">
                      <CalendarCheck className="mx-auto h-10 w-10 mb-3 opacity-50" />
                      <p>No hay atuendos asignados para esta fecha.</p>
                      <Button variant="link" className="mt-2" onClick={() => handleAddOrEditAssignment(selectedDate || new Date())}>
                        <PlusCircle className="mr-2 h-4 w-4" /> Asignar uno
                      </Button>
                    </div>
                  )
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {selectedDate && (
          <AssignmentModal
            isOpen={isModalOpen}
            onOpenChange={setIsModalOpen}
            onSubmit={handleFormSubmit}
            selectedDate={selectedDate}
            existingAssignment={editingAssignment}
            availablePrendas={availablePrendas}
            availableLooks={availableLooks}
          />
        )}

        {assignmentToDelete && (
          <AlertDialog open={!!assignmentToDelete} onOpenChange={(open) => !open && setAssignmentToDelete(null)}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta acción no se puede deshacer. Esto eliminará la asignación de
                  "{assignmentToDelete.tipo_asignacion === 'prenda' ? assignmentToDelete.prenda?.nombre : assignmentToDelete.look?.nombre}"
                  para el día {assignmentToDelete.fecha ? format(new Date(assignmentToDelete.fecha + 'T00:00:00'), "PPP", { locale: es }) : 'desconocido'}.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setAssignmentToDelete(null)}>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={executeDelete} className="bg-destructive hover:bg-destructive/90">
                  Eliminar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}

      </main>
      <Footer />
    </div>
  );
}

