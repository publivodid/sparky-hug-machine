import { useState, useEffect, useMemo } from "react";
import { getProfiles, getPosts, getTasks, getReports } from "@/lib/data";
import type { Profile, Post, Task, Report } from "@/lib/data";
import { MetricCard } from "@/components/MetricCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

const Dashboard = () => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [p, po, t, r] = await Promise.all([getProfiles(), getPosts(), getTasks(), getReports()]);
      setProfiles(p);
      setPosts(po);
      const activeIds = new Set(p.filter(pr => pr.status !== 'archived').map(pr => pr.id));
      setTasks(t.filter(tk => activeIds.has(tk.profile_id)));
      setReports(r);
      setLoading(false);
    };
    load();
  }, []);

  const stats = useMemo(() => {
    const completed = tasks.filter(t => t.status === 'completed').length;
    const pending = tasks.filter(t => t.status === 'pending').length;
    const inProgress = tasks.filter(t => t.status === 'in_progress').length;
    const total = tasks.length;
    const progressPct = total > 0 ? Math.round((completed / total) * 100) : 0;

    const highPriority = tasks.filter(t => t.priority === 'high' && t.status !== 'completed').length;

    const now = new Date();
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentActivity = tasks.filter(t => new Date(t.date) >= sevenDaysAgo).length;

    return { completed, pending, inProgress, total, progressPct, highPriority, recentActivity };
  }, [tasks]);

  if (loading) return <div className="p-8 text-center text-muted-foreground">Carregando...</div>;

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const postsThisMonth = posts.filter(p => {
    const d = new Date(p.created_at);
    return d.getMonth() + 1 === currentMonth;
  }).length;

  const pendingTasks = tasks.filter(t => t.status === 'pending').length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ fontFamily: 'Space Grotesk' }}>Dashboard</h1>
        <p className="text-muted-foreground text-sm">Resumo geral da agência</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard icon="📊" label="Perfis cadastrados" value={profiles.length} />
        <MetricCard icon="📝" label="Posts no mês" value={postsThisMonth} />
        <MetricCard icon="📋" label="Tarefas pendentes" value={pendingTasks} />
        <MetricCard icon="📄" label="Relatórios enviados" value={reports.length} />
      </div>

      {/* Overview Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Progress Card */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Progresso Geral</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <p className="text-4xl font-bold text-primary" style={{ fontFamily: 'Space Grotesk' }}>
                {stats.progressPct}%
              </p>
              <p className="text-xs text-muted-foreground mt-1">das tarefas concluídas</p>
            </div>
            <Progress value={stats.progressPct} className="h-2" />
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-lg bg-accent/50 p-2">
                <p className="text-lg font-bold text-accent-foreground">{stats.pending}</p>
                <p className="text-[10px] text-muted-foreground">Pendentes</p>
              </div>
              <div className="rounded-lg bg-primary/10 p-2">
                <p className="text-lg font-bold text-primary">{stats.inProgress}</p>
                <p className="text-[10px] text-muted-foreground">Em andamento</p>
              </div>
              <div className="rounded-lg bg-emerald-500/10 p-2">
                <p className="text-lg font-bold" style={{ color: 'hsl(var(--success))' }}>{stats.completed}</p>
                <p className="text-[10px] text-muted-foreground">Concluídas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Activity & Priority Card */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Indicadores Rápidos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2">
                <span className="text-lg">🔥</span>
                <span className="text-sm">Prioridade alta</span>
              </div>
              <Badge variant={stats.highPriority > 0 ? "destructive" : "default"}>
                {stats.highPriority}
              </Badge>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2">
                <span className="text-lg">⚡</span>
                <span className="text-sm">Atividade (7 dias)</span>
              </div>
              <Badge variant="secondary">{stats.recentActivity}</Badge>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2">
                <span className="text-lg">📦</span>
                <span className="text-sm">Total de tarefas</span>
              </div>
              <Badge variant="outline">{stats.total}</Badge>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2">
                <span className="text-lg">👥</span>
                <span className="text-sm">Perfis ativos</span>
              </div>
              <Badge variant="outline">
                {profiles.filter(p => p.status === 'active').length}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Recent Tasks Card */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Tarefas Recentes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {tasks.slice(0, 5).map(t => (
              <div key={t.id} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/50">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{t.title}</p>
                  <p className="text-xs text-muted-foreground">{t.responsible}</p>
                </div>
                <div className="flex items-center gap-1.5 ml-2 shrink-0">
                  <Badge
                    variant="outline"
                    className={
                      t.priority === 'high' ? 'border-destructive text-destructive' :
                      t.priority === 'low' ? 'border-muted-foreground text-muted-foreground' : ''
                    }
                  >
                    {t.priority === 'high' ? 'Alta' : t.priority === 'low' ? 'Baixa' : 'Média'}
                  </Badge>
                  <Badge variant={t.status === 'completed' ? 'default' : t.status === 'in_progress' ? 'secondary' : 'outline'}>
                    {t.status === 'pending' ? 'Pendente' : t.status === 'in_progress' ? 'Em andamento' : 'Concluído'}
                  </Badge>
                </div>
              </div>
            ))}
            {tasks.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma tarefa</p>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
