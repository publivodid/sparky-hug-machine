import { useState } from "react";
import { getTasks, setTasks, getProfiles } from "@/lib/data";
import type { Task } from "@/lib/data";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

const statusLabels: Record<Task['status'], string> = {
  pending: 'Pendente',
  in_progress: 'Em andamento',
  completed: 'Concluído',
};

const AllTasks = () => {
  const [, setRefresh] = useState(0);
  const profiles = getProfiles();
  const activeIds = new Set(profiles.filter(p => p.status !== 'archived').map(p => p.id));
  const tasks = getTasks().filter(t => activeIds.has(t.profileId));

  const handleStatus = (taskId: string, status: Task['status']) => {
    const all = getTasks();
    const idx = all.findIndex(t => t.id === taskId);
    if (idx !== -1) { all[idx].status = status; setTasks(all); toast.success('Status atualizado!'); setRefresh(n => n + 1); }
  };

  const profileName = (profileId: string) => profiles.find(p => p.id === profileId)?.name || '—';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ fontFamily: 'Space Grotesk' }}>Todas as Tarefas</h1>
        <p className="text-muted-foreground text-sm">{tasks.length} tarefas registradas</p>
      </div>

      <div className="space-y-3">
        {tasks.map(t => (
          <Card key={t.id}>
            <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="font-medium text-sm">{t.title}</p>
                <p className="text-xs text-muted-foreground">{t.description}</p>
                <div className="flex gap-2 mt-1">
                  <Badge variant="outline" className="text-xs">{profileName(t.profileId)}</Badge>
                  <span className="text-xs text-muted-foreground">{t.responsible} • {t.date}</span>
                </div>
              </div>
              <Select value={t.status} onValueChange={(v) => handleStatus(t.id, v as Task['status'])}>
                <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="in_progress">Em andamento</SelectItem>
                  <SelectItem value="completed">Concluído</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        ))}
        {tasks.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">Nenhuma tarefa registrada</p>}
      </div>
    </div>
  );
};

export default AllTasks;
