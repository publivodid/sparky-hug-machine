import { getProfiles, getMetrics, getPosts, getTasks, getReports } from "@/lib/data";
import { MetricCard } from "@/components/MetricCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const Dashboard = () => {
  const profiles = getProfiles();
  const metrics = getMetrics();
  const posts = getPosts();
  const tasks = getTasks();
  const reports = getReports();

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const postsThisMonth = posts.filter(p => {
    const d = new Date(p.createdAt);
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

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tarefas Recentes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {tasks.slice(0, 5).map(t => (
            <div key={t.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div>
                <p className="text-sm font-medium">{t.title}</p>
                <p className="text-xs text-muted-foreground">{t.responsible}</p>
              </div>
              <Badge variant={t.status === 'completed' ? 'default' : t.status === 'in_progress' ? 'secondary' : 'outline'}>
                {t.status === 'pending' ? 'Pendente' : t.status === 'in_progress' ? 'Em andamento' : 'Concluído'}
              </Badge>
            </div>
          ))}
          {tasks.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma tarefa</p>}
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
