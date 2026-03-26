import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { getProfiles, getPosts, getTasks, upsertTask, addHistory } from "@/lib/data";
import type { Profile, Post, Task } from "@/lib/data";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  Plus, ListTodo, CheckCircle2, Clock, Image, Users,
  CalendarDays, AlertTriangle, ChevronRight, Sparkles
} from "lucide-react";
import { toast } from "sonner";

const Dashboard = () => {
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTask, setShowTask] = useState(false);
  const [taskForm, setTaskForm] = useState({ title: "", description: "", responsible: "", date: "", status: "pending", priority: "medium", profile_id: "" });

  const load = useCallback(async () => {
    const [p, po, t] = await Promise.all([getProfiles(), getPosts(), getTasks()]);
    setProfiles(p);
    setPosts(po);
    const activeIds = new Set(p.filter(pr => pr.status !== "archived").map(pr => pr.id));
    setTasks(t.filter(tk => activeIds.has(tk.profile_id)));
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const now = new Date();
  const weekStart = useMemo(() => {
    const d = new Date(now);
    d.setDate(d.getDate() - d.getDay() + 1);
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);
  const weekEnd = useMemo(() => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + 6);
    d.setHours(23, 59, 59, 999);
    return d;
  }, [weekStart]);

  const weekLabel = useMemo(() => {
    const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" };
    return `${weekStart.toLocaleDateString("pt-BR", opts)} — ${weekEnd.toLocaleDateString("pt-BR", opts)}`;
  }, [weekStart, weekEnd]);

  const todayStr = now.toISOString().split("T")[0];

  const weekTasks = useMemo(() => tasks.filter(t => {
    const d = new Date(t.date);
    return d >= weekStart && d <= weekEnd;
  }), [tasks, weekStart, weekEnd]);

  const weekPending = weekTasks.filter(t => t.status === "pending").length;
  const weekCompleted = weekTasks.filter(t => t.status === "completed").length;
  const weekPosts = useMemo(() => posts.filter(p => {
    const d = new Date(p.created_at);
    return d >= weekStart && d <= weekEnd;
  }).length, [posts, weekStart, weekEnd]);
  const activeProfiles = profiles.filter(p => p.status !== "archived").length;

  const todayTasks = useMemo(() => tasks.filter(t => t.date === todayStr && t.status !== "completed"), [tasks, todayStr]);
  const upcomingTasks = useMemo(() => tasks.filter(t => t.date > todayStr && t.status !== "completed").sort((a, b) => a.date.localeCompare(b.date)).slice(0, 8), [tasks, todayStr]);

  const checklistTasks = useMemo(() => weekTasks.filter(t => t.status !== "completed" || t.status === "completed").sort((a, b) => {
    if (a.status === "completed" && b.status !== "completed") return 1;
    if (a.status !== "completed" && b.status === "completed") return -1;
    return a.date.localeCompare(b.date);
  }), [weekTasks]);

  // Post progress by client
  const postsByClient = useMemo(() => {
    const activeP = profiles.filter(p => p.status !== "archived");
    return activeP.map(p => {
      const clientPosts = posts.filter(po => po.profile_id === p.id);
      const weekClientPosts = clientPosts.filter(po => {
        const d = new Date(po.created_at);
        return d >= weekStart && d <= weekEnd;
      });
      const approved = weekClientPosts.filter(po => po.status === "approved").length;
      const total = weekClientPosts.length;
      return { name: p.name, id: p.id, approved, total };
    }).filter(c => c.total > 0);
  }, [profiles, posts, weekStart, weekEnd]);

  const recentActivity = useMemo(() => {
    const all = [
      ...tasks.filter(t => t.status === "completed").map(t => ({ text: `Tarefa "${t.title}" concluída`, date: t.date, type: "task" })),
      ...posts.slice(0, 5).map(p => ({ text: `Post ${p.status === "approved" ? "aprovado" : p.status === "rejected" ? "rejeitado" : "criado"}`, date: p.created_at, type: "post" })),
    ];
    return all.sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6);
  }, [tasks, posts]);

  const handleToggleTask = async (task: Task) => {
    const newStatus = task.status === "completed" ? "pending" : "completed";
    try {
      await upsertTask({ id: task.id, profile_id: task.profile_id, status: newStatus });
      await addHistory(task.profile_id, `Tarefa "${task.title}" ${newStatus === "completed" ? "concluída" : "reaberta"}`);
      toast.success(newStatus === "completed" ? "Tarefa concluída!" : "Tarefa reaberta!");
      await load();
    } catch { toast.error("Erro ao atualizar."); }
  };

  const handleCreateTask = async () => {
    if (!taskForm.title.trim() || !taskForm.profile_id) { toast.error("Preencha título e cliente."); return; }
    try {
      await upsertTask({ profile_id: taskForm.profile_id, title: taskForm.title, description: taskForm.description, responsible: taskForm.responsible, date: taskForm.date || todayStr, status: taskForm.status, priority: taskForm.priority });
      await addHistory(taskForm.profile_id, `Tarefa criada: ${taskForm.title}`);
      toast.success("Tarefa criada!");
      setShowTask(false);
      setTaskForm({ title: "", description: "", responsible: "", date: "", status: "pending", priority: "medium", profile_id: "" });
      await load();
    } catch { toast.error("Erro ao criar tarefa."); }
  };

  if (loading) return <div className="p-8 text-center text-muted-foreground">Carregando...</div>;

  const priorityColor = (p: string) => p === "high" ? "text-red-500" : p === "low" ? "text-emerald-500" : "text-amber-500";
  const priorityLabel = (p: string) => p === "high" ? "Alta" : p === "low" ? "Baixa" : "Média";
  const profileName = (pid: string) => profiles.find(p => p.id === pid)?.name || "—";

  const MetricBox = ({ icon: Icon, label, value, color }: { icon: typeof ListTodo; label: string; value: number; color: string }) => (
    <Card className="rounded-2xl border shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-5 flex items-center gap-4">
        <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className="h-6 w-6" />
        </div>
        <div>
          <p className="text-2xl font-bold tracking-tight" style={{ fontFamily: "Space Grotesk" }}>{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="bg-muted/30 min-h-screen -m-6 p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <CalendarDays className="h-4 w-4" />
            <span>Semana: {weekLabel}</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ fontFamily: "Space Grotesk" }}>Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-0.5 flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5" />Foco nas tarefas da semana. Priorize o que importa.
          </p>
        </div>
        <Button className="gap-2 rounded-xl" onClick={() => { setTaskForm({ title: "", description: "", responsible: "", date: todayStr, status: "pending", priority: "medium", profile_id: "" }); setShowTask(true); }}>
          <Plus className="h-4 w-4" />Nova Tarefa
        </Button>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricBox icon={Clock} label="Tarefas pendentes" value={weekPending} color="bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400" />
        <MetricBox icon={CheckCircle2} label="Concluídas na semana" value={weekCompleted} color="bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400" />
        <MetricBox icon={Image} label="Posts da semana" value={weekPosts} color="bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400" />
        <MetricBox icon={Users} label="Clientes ativos" value={activeProfiles} color="bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400" />
      </div>

      {/* Main row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Left: Today + Upcoming */}
        <div className="space-y-5">
          {/* Today */}
          <Card className="rounded-2xl border shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-foreground flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-amber-500" />Tarefas de Hoje</h3>
                <Badge variant="secondary" className="text-xs">{todayTasks.length}</Badge>
              </div>
              {todayTasks.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Nenhuma tarefa para hoje 🎉</p>
              ) : (
                <div className="space-y-2">
                  {todayTasks.map(t => (
                    <div key={t.id} className="flex items-center gap-3 p-3 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 hover:shadow-sm transition-shadow">
                      <span className={`text-xs font-medium ${priorityColor(t.priority)}`}>{priorityLabel(t.priority)}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{t.title}</p>
                        <p className="text-xs text-muted-foreground">{profileName(t.profile_id)}</p>
                      </div>
                      <Button size="sm" variant="ghost" className="h-7 text-xs gap-1 text-emerald-600 hover:text-emerald-700" onClick={() => handleToggleTask(t)}>
                        <CheckCircle2 className="h-3.5 w-3.5" />Concluir
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Upcoming */}
          <Card className="rounded-2xl border shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-foreground flex items-center gap-2"><ListTodo className="h-4 w-4 text-primary" />Próximas Tarefas</h3>
                <Button variant="ghost" size="sm" className="text-xs gap-1" onClick={() => navigate("/tasks")}>Ver todas <ChevronRight className="h-3 w-3" /></Button>
              </div>
              {upcomingTasks.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Nenhuma tarefa futura</p>
              ) : (
                <div className="space-y-2">
                  {upcomingTasks.map(t => (
                    <div key={t.id} className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors">
                      <span className={`text-xs font-medium ${priorityColor(t.priority)}`}>{priorityLabel(t.priority)}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{t.title}</p>
                        <p className="text-xs text-muted-foreground">{profileName(t.profile_id)} • {t.date}</p>
                      </div>
                      <Badge variant="outline" className="text-[10px] rounded-full shrink-0">
                        {t.status === "pending" ? "Pendente" : "Em andamento"}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right: Weekly checklist */}
        <Card className="rounded-2xl border shadow-sm h-fit">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-foreground flex items-center gap-2"><CalendarDays className="h-4 w-4 text-primary" />Checklist da Semana</h3>
              <span className="text-xs text-muted-foreground">{weekCompleted}/{weekTasks.length}</span>
            </div>
            <Progress value={weekTasks.length > 0 ? Math.round((weekCompleted / weekTasks.length) * 100) : 0} className="h-1.5 mb-4" />
            {checklistTasks.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">Nenhuma tarefa na semana</p>
            ) : (
              <div className="space-y-1.5 max-h-[400px] overflow-y-auto pr-1">
                {checklistTasks.map(t => {
                  const done = t.status === "completed";
                  return (
                    <div key={t.id} className={`flex items-center gap-3 p-3 rounded-xl transition-colors cursor-pointer hover:bg-muted/70 ${done ? "bg-emerald-50/50 dark:bg-emerald-950/10" : "bg-muted/30"}`} onClick={() => handleToggleTask(t)}>
                      <Checkbox checked={done} className="shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm ${done ? "line-through text-muted-foreground" : "font-medium"}`}>{t.title}</p>
                        <p className="text-xs text-muted-foreground">{profileName(t.profile_id)} • {t.date}</p>
                      </div>
                      <span className={`text-[10px] font-medium ${priorityColor(t.priority)}`}>{priorityLabel(t.priority)}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Post progress by client */}
        <Card className="rounded-2xl border shadow-sm">
          <CardContent className="p-6">
            <h3 className="font-semibold text-foreground flex items-center gap-2 mb-4"><Image className="h-4 w-4 text-primary" />Postagens por Cliente (Semana)</h3>
            {postsByClient.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Nenhuma postagem na semana</p>
            ) : (
              <div className="space-y-3">
                {postsByClient.map(c => (
                  <div key={c.id}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium truncate">{c.name}</span>
                      <span className="text-xs text-muted-foreground">{c.approved}/{c.total} aprovados</span>
                    </div>
                    <Progress value={c.total > 0 ? Math.round((c.approved / c.total) * 100) : 0} className="h-2" />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent activity */}
        <Card className="rounded-2xl border shadow-sm">
          <CardContent className="p-6">
            <h3 className="font-semibold text-foreground flex items-center gap-2 mb-4"><Clock className="h-4 w-4 text-primary" />Atividade Recente</h3>
            {recentActivity.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Nenhuma atividade recente</p>
            ) : (
              <div className="relative pl-5 border-l-2 border-border space-y-3">
                {recentActivity.map((a, i) => (
                  <div key={i} className="relative">
                    <div className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full bg-primary border-2 border-background" />
                    <p className="text-sm">{a.text}</p>
                    <p className="text-xs text-muted-foreground">{a.date}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* New task dialog */}
      <Dialog open={showTask} onOpenChange={setShowTask}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nova Tarefa</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Cliente</Label>
              <Select value={taskForm.profile_id} onValueChange={v => setTaskForm(f => ({ ...f, profile_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Selecione o cliente" /></SelectTrigger>
                <SelectContent>{profiles.filter(p => p.status !== "archived").map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Título</Label><Input value={taskForm.title} onChange={e => setTaskForm(f => ({ ...f, title: e.target.value }))} /></div>
            <div><Label>Descrição</Label><Textarea value={taskForm.description} onChange={e => setTaskForm(f => ({ ...f, description: e.target.value }))} /></div>
            <div><Label>Responsável</Label><Input value={taskForm.responsible} onChange={e => setTaskForm(f => ({ ...f, responsible: e.target.value }))} /></div>
            <div><Label>Data</Label><Input type="date" value={taskForm.date} onChange={e => setTaskForm(f => ({ ...f, date: e.target.value }))} /></div>
            <div>
              <Label>Prioridade</Label>
              <Select value={taskForm.priority} onValueChange={v => setTaskForm(f => ({ ...f, priority: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="low">Baixa</SelectItem><SelectItem value="medium">Média</SelectItem><SelectItem value="high">Alta</SelectItem></SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter><Button onClick={handleCreateTask}>Criar Tarefa</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Dashboard;
