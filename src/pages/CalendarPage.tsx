import { useState, useEffect, useCallback, useMemo } from "react";
import { getTasks, getProfiles } from "@/lib/data";
import type { Task, Profile } from "@/lib/data";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

const CalendarPage = () => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const load = useCallback(async () => {
    const [p, t] = await Promise.all([getProfiles(), getTasks()]);
    setProfiles(p);
    const activeIds = new Set(p.filter(pr => pr.status !== 'archived').map(pr => pr.id));
    setTasks(t.filter(tk => activeIds.has(tk.profile_id) && tk.status !== 'completed'));
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const profileName = (profileId: string) => profiles.find(p => p.id === profileId)?.name || '—';

  // Group tasks by date string (YYYY-MM-DD)
  const tasksByDate = useMemo(() => {
    const map = new Map<string, Task[]>();
    for (const t of tasks) {
      if (!t.date) continue;
      const key = t.date;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(t);
    }
    return map;
  }, [tasks]);

  // Dates that have tasks (for highlighting)
  const datesWithTasks = useMemo(() => {
    return Array.from(tasksByDate.keys()).map(d => new Date(d + 'T12:00:00'));
  }, [tasksByDate]);

  // Tasks for the selected date
  const selectedDateStr = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : '';
  const tasksForDate = selectedDateStr ? (tasksByDate.get(selectedDateStr) || []) : [];

  const statusLabel = (s: string) =>
    s === 'pending' ? 'Pendente' : s === 'in_progress' ? 'Em andamento' : 'Concluído';

  const statusVariant = (s: string): "default" | "secondary" | "outline" =>
    s === 'completed' ? 'default' : s === 'in_progress' ? 'secondary' : 'outline';

  const priorityLabel = (p: string) => p === 'high' ? 'Alta' : p === 'low' ? 'Baixa' : 'Média';
  const priorityColor = (p: string) => p === 'high' ? 'text-destructive font-medium' : p === 'low' ? 'text-muted-foreground' : 'text-primary font-medium';

  if (loading) return <div className="p-8 text-center text-muted-foreground">Carregando...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ fontFamily: 'Space Grotesk' }}>Calendário</h1>
        <p className="text-muted-foreground text-sm">Visualize tarefas pendentes por data</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[auto_1fr] gap-6">
        <Card>
          <CardContent className="p-4">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              locale={ptBR}
              className={cn("p-3 pointer-events-auto")}
              modifiers={{ hasTasks: datesWithTasks }}
              modifiersClassNames={{ hasTasks: "bg-primary/20 font-bold text-primary" }}
            />
          </CardContent>
        </Card>

        <div className="space-y-3">
          <h2 className="text-lg font-semibold">
            {selectedDate
              ? format(selectedDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
              : 'Selecione uma data'}
          </h2>

          {selectedDate && tasksForDate.length === 0 && (
            <p className="text-sm text-muted-foreground py-4">Nenhuma tarefa pendente nesta data</p>
          )}

          {tasksForDate.map(t => (
            <Card
              key={t.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setSelectedTask(t)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{t.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{t.description}</p>
                    <div className="flex gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">{profileName(t.profile_id)}</Badge>
                      <span className="text-xs text-muted-foreground">{t.responsible}</span>
                    </div>
                  </div>
                  <Badge variant={statusVariant(t.status)}>{statusLabel(t.status)}</Badge>
                </div>
              </CardContent>
            </Card>
          ))}

          {!selectedDate && (
            <p className="text-sm text-muted-foreground py-4">Clique em uma data no calendário para ver as tarefas</p>
          )}
        </div>
      </div>

      {/* TASK DETAIL MODAL */}
      <Dialog open={!!selectedTask} onOpenChange={() => setSelectedTask(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedTask?.title}</DialogTitle>
          </DialogHeader>
          {selectedTask && (
            <div className="space-y-4">
              <div>
                <p className="text-xs text-muted-foreground font-medium mb-1">Descrição</p>
                <p className="text-sm">{selectedTask.description || '—'}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground font-medium mb-1">Cliente</p>
                  <p className="text-sm">{profileName(selectedTask.profile_id)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium mb-1">Responsável</p>
                  <p className="text-sm">{selectedTask.responsible || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium mb-1">Data</p>
                  <p className="text-sm">{selectedTask.date}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium mb-1">Status</p>
                  <Badge variant={statusVariant(selectedTask.status)}>
                    {statusLabel(selectedTask.status)}
                  </Badge>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CalendarPage;
