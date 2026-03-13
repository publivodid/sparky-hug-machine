import { useState } from "react";
import { getTasks, setTasks, getProfiles, addHistory } from "@/lib/data";
import type { Task } from "@/lib/data";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

const AllTasks = () => {
  const [, setRefresh] = useState(0);
  const refresh = () => setRefresh(n => n + 1);
  const profiles = getProfiles();
  const activeIds = new Set(profiles.filter(p => p.status !== 'archived').map(p => p.id));
  const tasks = getTasks().filter(t => activeIds.has(t.profileId));

  const [showEdit, setShowEdit] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ title: '', description: '', responsible: '', date: '', status: 'pending' as Task['status'] });

  const handleStatus = (taskId: string, status: Task['status']) => {
    const all = getTasks();
    const idx = all.findIndex(t => t.id === taskId);
    if (idx !== -1) { all[idx].status = status; setTasks(all); toast.success('Status atualizado!'); refresh(); }
  };

  const openEdit = (t: Task) => {
    setForm({ title: t.title, description: t.description, responsible: t.responsible, date: t.date, status: t.status });
    setEditingId(t.id);
    setShowEdit(true);
  };

  const handleSave = () => {
    const all = getTasks();
    const idx = all.findIndex(t => t.id === editingId);
    if (idx !== -1) {
      all[idx] = { ...all[idx], ...form };
      setTasks(all);
      addHistory(all[idx].profileId, `Tarefa editada: ${form.title}`);
      toast.success('Tarefa atualizada!');
    }
    setShowEdit(false);
    setEditingId(null);
    refresh();
  };

  const handleDelete = (taskId: string) => {
    const all = getTasks();
    const task = all.find(t => t.id === taskId);
    if (task) addHistory(task.profileId, 'Tarefa excluída');
    setTasks(all.filter(t => t.id !== taskId));
    toast.success('Tarefa excluída!');
    refresh();
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
              <div className="flex-1">
                <p className="font-medium text-sm">{t.title}</p>
                <p className="text-xs text-muted-foreground">{t.description}</p>
                <div className="flex gap-2 mt-1">
                  <Badge variant="outline" className="text-xs">{profileName(t.profileId)}</Badge>
                  <span className="text-xs text-muted-foreground">{t.responsible} • {t.date}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Select value={t.status} onValueChange={(v) => handleStatus(t.id, v as Task['status'])}>
                  <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pendente</SelectItem>
                    <SelectItem value="in_progress">Em andamento</SelectItem>
                    <SelectItem value="completed">Concluído</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(t)}><Pencil className="h-3.5 w-3.5" /></Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDelete(t.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {tasks.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">Nenhuma tarefa registrada</p>}
      </div>

      <Dialog open={showEdit} onOpenChange={setShowEdit}>
        <DialogContent>
          <DialogHeader><DialogTitle>Editar Tarefa</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Título</Label><Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} /></div>
            <div><Label>Descrição</Label><Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></div>
            <div><Label>Responsável</Label><Input value={form.responsible} onChange={e => setForm(f => ({ ...f, responsible: e.target.value }))} /></div>
            <div><Label>Data</Label><Input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} /></div>
          </div>
          <DialogFooter><Button onClick={handleSave}>Salvar</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AllTasks;
