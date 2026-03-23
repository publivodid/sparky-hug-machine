import { useState, useEffect, useCallback } from "react";
import { getTasks, upsertTask, deleteTask as deleteTaskApi, getProfiles, addHistory } from "@/lib/data";
import type { Task, Profile } from "@/lib/data";
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
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEdit, setShowEdit] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [form, setForm] = useState({ title: '', description: '', responsible: '', date: '', status: 'pending' as string });

  const load = useCallback(async () => {
    const [p, t] = await Promise.all([getProfiles(), getTasks()]);
    setProfiles(p);
    const activeIds = new Set(p.filter(pr => pr.status !== 'archived').map(pr => pr.id));
    setTasks(t.filter(tk => activeIds.has(tk.profile_id) && tk.status !== 'completed'));
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const getErrorMessage = (error: unknown) => {
    if (error && typeof error === 'object' && 'message' in error) {
      return String((error as { message?: unknown }).message || 'Erro ao salvar dados.');
    }
    return 'Erro ao salvar dados.';
  };

  const handleStatus = async (task: Task, status: string) => {
    try {
      await upsertTask({ id: task.id, profile_id: task.profile_id, status });
      toast.success('Status atualizado!');
      await load();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const openEdit = (t: Task) => {
    setForm({ title: t.title, description: t.description, responsible: t.responsible, date: t.date, status: t.status });
    setEditingTask(t);
    setShowEdit(true);
  };

  const handleSave = async () => {
    if (!editingTask) return;
    if (!form.title.trim()) {
      toast.error('Informe o título da tarefa.');
      return;
    }

    try {
      await upsertTask({ id: editingTask.id, profile_id: editingTask.profile_id, ...form, date: form.date || undefined });
      await addHistory(editingTask.profile_id, `Tarefa editada: ${form.title}`);
      toast.success('Tarefa atualizada!');
      setShowEdit(false);
      setEditingTask(null);
      await load();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const handleDelete = async (task: Task) => {
    try {
      await addHistory(task.profile_id, 'Tarefa excluída');
      await deleteTaskApi(task.id);
      toast.success('Tarefa excluída!');
      await load();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const profileName = (profileId: string) => profiles.find(p => p.id === profileId)?.name || '—';

  if (loading) return <div className="p-8 text-center text-muted-foreground">Carregando...</div>;

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
                  <Badge variant="outline" className="text-xs">{profileName(t.profile_id)}</Badge>
                  <span className="text-xs text-muted-foreground">{t.responsible} • {t.date}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Select value={t.status} onValueChange={(v) => handleStatus(t, v)}>
                  <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pendente</SelectItem>
                    <SelectItem value="in_progress">Em andamento</SelectItem>
                    <SelectItem value="completed">Concluído</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(t)}><Pencil className="h-3.5 w-3.5" /></Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDelete(t)}><Trash2 className="h-3.5 w-3.5" /></Button>
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
