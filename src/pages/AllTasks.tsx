import { useState, useEffect, useCallback, useMemo } from "react";
import { getTasks, upsertTask, deleteTask as deleteTaskApi, getProfiles, addHistory } from "@/lib/data";
import type { Task, Profile } from "@/lib/data";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  Search, Pencil, Trash2, X, CheckCircle2, AlertTriangle, AlertCircle,
  ListTodo, Clock, CheckCircle, Flame
} from "lucide-react";
import { toast } from "sonner";

const PRIORITY_CONFIG = {
  high: {
    label: "Alta",
    icon: AlertTriangle,
    bg: "bg-red-50 dark:bg-red-950/30",
    border: "border-red-200 dark:border-red-900",
    iconColor: "text-red-500",
    badge: "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300",
  },
  medium: {
    label: "Média",
    icon: AlertCircle,
    bg: "bg-amber-50 dark:bg-amber-950/30",
    border: "border-amber-200 dark:border-amber-900",
    iconColor: "text-amber-500",
    badge: "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300",
  },
  low: {
    label: "Baixa",
    icon: CheckCircle2,
    bg: "bg-emerald-50 dark:bg-emerald-950/30",
    border: "border-emerald-200 dark:border-emerald-900",
    iconColor: "text-emerald-500",
    badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300",
  },
} as const;

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  pending: { label: "Pendente", className: "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300" },
  in_progress: { label: "Em andamento", className: "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300" },
  completed: { label: "Concluída", className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300" },
};

type QuickFilter = "all" | "pending" | "in_progress" | "completed" | "high";

const AllTasks = () => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEdit, setShowEdit] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [form, setForm] = useState({ title: "", description: "", responsible: "", date: "", status: "pending", priority: "medium" });

  const [search, setSearch] = useState("");
  const [quickFilter, setQuickFilter] = useState<QuickFilter>("all");
  const [filterProfile, setFilterProfile] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");

  const load = useCallback(async () => {
    const [p, t] = await Promise.all([getProfiles(), getTasks()]);
    setProfiles(p);
    const activeIds = new Set(p.filter(pr => pr.status !== "archived").map(pr => pr.id));
    setAllTasks(t.filter(tk => activeIds.has(tk.profile_id)));
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  // Weekly progress
  const weeklyStats = useMemo(() => {
    const now = new Date();
    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekTasks = allTasks.filter(t => new Date(t.date) >= weekAgo);
    const completed = weekTasks.filter(t => t.status === "completed").length;
    const total = weekTasks.length;
    return { completed, total, pct: total > 0 ? Math.round((completed / total) * 100) : 0 };
  }, [allTasks]);

  const filteredTasks = useMemo(() => {
    return allTasks.filter(t => {
      // Quick filter
      if (quickFilter === "pending" && t.status !== "pending") return false;
      if (quickFilter === "in_progress" && t.status !== "in_progress") return false;
      if (quickFilter === "completed" && t.status !== "completed") return false;
      if (quickFilter === "high" && t.priority !== "high") return false;
      // Hide completed by default in "all"
      if (quickFilter === "all" && t.status === "completed") return false;

      // Search
      if (search) {
        const s = search.toLowerCase();
        const name = profiles.find(p => p.id === t.profile_id)?.name || "";
        if (!t.title.toLowerCase().includes(s) && !name.toLowerCase().includes(s) && !t.description.toLowerCase().includes(s)) return false;
      }

      // Advanced filters
      if (filterProfile !== "all" && t.profile_id !== filterProfile) return false;
      if (filterPriority !== "all" && t.priority !== filterPriority) return false;
      if (filterStatus !== "all" && t.status !== filterStatus) return false;
      if (filterDateFrom && t.date < filterDateFrom) return false;
      if (filterDateTo && t.date > filterDateTo) return false;
      return true;
    });
  }, [allTasks, search, quickFilter, filterProfile, filterPriority, filterStatus, filterDateFrom, filterDateTo, profiles]);

  const highTasks = filteredTasks.filter(t => t.priority === "high");
  const mediumTasks = filteredTasks.filter(t => t.priority === "medium");
  const lowTasks = filteredTasks.filter(t => t.priority === "low");

  const hasAdvancedFilters = filterProfile !== "all" || filterPriority !== "all" || filterStatus !== "all" || filterDateFrom || filterDateTo;
  const clearFilters = () => { setFilterProfile("all"); setFilterPriority("all"); setFilterStatus("all"); setFilterDateFrom(""); setFilterDateTo(""); };

  const profileName = (pid: string) => profiles.find(p => p.id === pid)?.name || "—";

  const handleStatus = async (task: Task, status: string) => {
    try { await upsertTask({ id: task.id, profile_id: task.profile_id, status }); toast.success("Status atualizado!"); await load(); } catch (error) { toast.error("Erro ao atualizar."); }
  };

  const openEdit = (t: Task) => {
    setForm({ title: t.title, description: t.description, responsible: t.responsible, date: t.date, status: t.status, priority: t.priority || "medium" });
    setEditingTask(t);
    setShowEdit(true);
  };

  const handleSave = async () => {
    if (!editingTask || !form.title.trim()) { toast.error("Informe o título."); return; }
    try {
      await upsertTask({ id: editingTask.id, profile_id: editingTask.profile_id, ...form, date: form.date || undefined });
      await addHistory(editingTask.profile_id, `Tarefa editada: ${form.title}`);
      toast.success("Tarefa atualizada!"); setShowEdit(false); setEditingTask(null); await load();
    } catch (error) { toast.error("Erro ao salvar."); }
  };

  const handleDelete = async (task: Task) => {
    try { await addHistory(task.profile_id, "Tarefa excluída"); await deleteTaskApi(task.id); toast.success("Tarefa excluída!"); await load(); } catch (error) { toast.error("Erro ao excluir."); }
  };

  const handleComplete = async (task: Task) => {
    try { await upsertTask({ id: task.id, profile_id: task.profile_id, status: "completed" }); await addHistory(task.profile_id, `Tarefa "${task.title}" concluída`); toast.success("Tarefa concluída!"); await load(); } catch { toast.error("Erro."); }
  };

  if (loading) return <div className="p-8 text-center text-muted-foreground">Carregando...</div>;

  const quickButtons: { key: QuickFilter; label: string; icon: typeof ListTodo }[] = [
    { key: "all", label: "Todos", icon: ListTodo },
    { key: "pending", label: "Pendentes", icon: Clock },
    { key: "in_progress", label: "Em andamento", icon: AlertCircle },
    { key: "completed", label: "Concluídas", icon: CheckCircle },
    { key: "high", label: "Alta prioridade", icon: Flame },
  ];

  const TaskCard = ({ task }: { task: Task }) => {
    const pCfg = PRIORITY_CONFIG[task.priority as keyof typeof PRIORITY_CONFIG] || PRIORITY_CONFIG.medium;
    const sCfg = STATUS_CONFIG[task.status] || STATUS_CONFIG.pending;
    return (
      <Card className="rounded-2xl border shadow-sm hover:shadow-lg hover:scale-[1.01] transition-all duration-200 group">
        <CardContent className="p-5">
          <div className="flex items-start justify-between gap-2 mb-3">
            <h3 className="font-semibold text-sm text-foreground leading-snug">{task.title}</h3>
            <Badge className={`${sCfg.className} text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0`}>{sCfg.label}</Badge>
          </div>
          {task.description && <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{task.description}</p>}
          <div className="flex items-center gap-2 flex-wrap mb-3">
            <Badge variant="outline" className="text-[10px] rounded-full">{profileName(task.profile_id)}</Badge>
            <Badge className={`${pCfg.badge} text-[10px] px-2 py-0.5 rounded-full font-medium`}>{pCfg.label}</Badge>
            {task.date && <span className="text-[11px] text-muted-foreground">{task.date}</span>}
            {task.responsible && <span className="text-[11px] text-muted-foreground">• {task.responsible}</span>}
          </div>
          <div className="flex items-center gap-1 pt-2 border-t border-border/50">
            {task.status !== "completed" && (
              <Button size="sm" variant="ghost" className="h-7 text-xs gap-1 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50" onClick={() => handleComplete(task)}>
                <CheckCircle2 className="h-3.5 w-3.5" />Concluir
              </Button>
            )}
            <Button size="sm" variant="ghost" className="h-7 text-xs gap-1 ml-auto" onClick={() => openEdit(task)}>
              <Pencil className="h-3.5 w-3.5" />Editar
            </Button>
            <Button size="sm" variant="ghost" className="h-7 text-xs gap-1 text-destructive hover:text-destructive" onClick={() => handleDelete(task)}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  const PriorityGroup = ({ priorityKey, tasks: groupTasks }: { priorityKey: "high" | "medium" | "low"; tasks: Task[] }) => {
    if (groupTasks.length === 0) return null;
    const cfg = PRIORITY_CONFIG[priorityKey];
    const Icon = cfg.icon;
    return (
      <div className={`rounded-2xl border ${cfg.border} ${cfg.bg} p-5`}>
        <div className="flex items-center gap-2 mb-4">
          <Icon className={`h-5 w-5 ${cfg.iconColor}`} />
          <h2 className="font-semibold text-foreground">{cfg.label} Prioridade</h2>
          <Badge variant="secondary" className="text-xs">{groupTasks.length}</Badge>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {groupTasks.map(t => <TaskCard key={t.id} task={t} />)}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-muted/30 min-h-screen -m-6 p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ fontFamily: "Space Grotesk" }}>Tarefas</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{filteredTasks.length} tarefas encontradas</p>
        </div>
      </div>

      {/* Weekly progress */}
      <Card className="rounded-2xl border shadow-sm">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-foreground">Progresso da Semana</span>
            <span className="text-sm text-muted-foreground">{weeklyStats.completed}/{weeklyStats.total} concluídas</span>
          </div>
          <Progress value={weeklyStats.pct} className="h-2" />
          <p className="text-xs text-muted-foreground mt-1.5">{weeklyStats.pct}% concluídas nos últimos 7 dias</p>
        </CardContent>
      </Card>

      {/* Search + Quick filters */}
      <div className="space-y-3">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar tarefa ou cliente..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 rounded-xl" />
        </div>
        <div className="flex gap-2 flex-wrap">
          {quickButtons.map(b => {
            const Icon = b.icon;
            const active = quickFilter === b.key;
            return (
              <Button
                key={b.key}
                variant={active ? "default" : "outline"}
                size="sm"
                className={`gap-1.5 rounded-xl text-xs ${active ? "" : "hover:bg-muted"}`}
                onClick={() => setQuickFilter(b.key)}
              >
                <Icon className="h-3.5 w-3.5" />{b.label}
              </Button>
            );
          })}
        </div>
      </div>

      {/* Advanced filters */}
      <Card className="rounded-2xl border shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium">Filtros avançados</span>
            {hasAdvancedFilters && (
              <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={clearFilters}><X className="h-3 w-3" />Limpar</Button>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <div>
              <Label className="text-xs text-muted-foreground">Cliente</Label>
              <Select value={filterProfile} onValueChange={setFilterProfile}>
                <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {profiles.filter(p => p.status !== "archived").map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Prioridade</Label>
              <Select value={filterPriority} onValueChange={setFilterPriority}>
                <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="high">Alta</SelectItem>
                  <SelectItem value="medium">Média</SelectItem>
                  <SelectItem value="low">Baixa</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Status</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="in_progress">Em andamento</SelectItem>
                  <SelectItem value="completed">Concluída</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Data inicial</Label>
              <Input type="date" value={filterDateFrom} onChange={e => setFilterDateFrom(e.target.value)} className="rounded-xl" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Data final</Label>
              <Input type="date" value={filterDateTo} onChange={e => setFilterDateTo(e.target.value)} className="rounded-xl" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Task groups */}
      <div className="space-y-5">
        <PriorityGroup priorityKey="high" tasks={highTasks} />
        <PriorityGroup priorityKey="medium" tasks={mediumTasks} />
        <PriorityGroup priorityKey="low" tasks={lowTasks} />
        {filteredTasks.length === 0 && <p className="text-sm text-muted-foreground text-center py-12">Nenhuma tarefa encontrada</p>}
      </div>

      {/* Edit dialog */}
      <Dialog open={showEdit} onOpenChange={setShowEdit}>
        <DialogContent>
          <DialogHeader><DialogTitle>Editar Tarefa</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Título</Label><Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} /></div>
            <div><Label>Descrição</Label><Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></div>
            <div><Label>Responsável</Label><Input value={form.responsible} onChange={e => setForm(f => ({ ...f, responsible: e.target.value }))} /></div>
            <div><Label>Data</Label><Input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} /></div>
            <div>
              <Label>Prioridade</Label>
              <Select value={form.priority} onValueChange={v => setForm(f => ({ ...f, priority: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="low">Baixa</SelectItem><SelectItem value="medium">Média</SelectItem><SelectItem value="high">Alta</SelectItem></SelectContent>
              </Select>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="pending">Pendente</SelectItem><SelectItem value="in_progress">Em andamento</SelectItem><SelectItem value="completed">Concluída</SelectItem></SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter><Button onClick={handleSave}>Salvar</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AllTasks;
