import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getProfiles, getPosts, setPosts, getReports, setReports, getUpdates, setUpdates, getTasks, setTasks, getHistory, addHistory } from "@/lib/data";
import type { Post, Report, ProfileUpdate, Task } from "@/lib/data";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Plus, Check, X } from "lucide-react";
import { toast } from "sonner";

const ProfileDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const profile = getProfiles().find(p => p.id === id);
  const [, setRefresh] = useState(0);
  const refresh = () => setRefresh(n => n + 1);




  const [showPost, setShowPost] = useState(false);
  const [postForm, setPostForm] = useState({ imageUrl: '', text: '' });
  const [showReport, setShowReport] = useState(false);
  const [reportForm, setReportForm] = useState({ link: '', comment: '', date: '' });
  const [showUpdate, setShowUpdate] = useState(false);
  const [updateForm, setUpdateForm] = useState({ description: '', responsible: '' });
  const [showTask, setShowTask] = useState(false);
  const [taskForm, setTaskForm] = useState({ title: '', description: '', responsible: '', date: '', status: 'pending' as Task['status'] });

  if (!profile) return <div className="p-8 text-center text-muted-foreground">Perfil não encontrado</div>;



  const posts = getPosts().filter(p => p.profileId === id);
  const reports = getReports().filter(r => r.profileId === id);
  const updates = getUpdates().filter(u => u.profileId === id);
  const tasks = getTasks().filter(t => t.profileId === id);
  const history = getHistory().filter(h => h.profileId === id);




  const handleAddPost = () => {
    const all = getPosts();
    all.unshift({ id: crypto.randomUUID(), profileId: id!, imageUrl: postForm.imageUrl, text: postForm.text, status: 'pending', createdAt: new Date().toISOString().split('T')[0] });
    setPosts(all);
    addHistory(id!, 'Novo post criado para aprovação');
    setShowPost(false);
    setPostForm({ imageUrl: '', text: '' });
    toast.success('Post criado!');
    refresh();
  };

  const handlePostAction = (postId: string, action: 'approved' | 'rejected') => {
    const all = getPosts();
    const idx = all.findIndex(p => p.id === postId);
    if (idx !== -1) { all[idx].status = action; setPosts(all); addHistory(id!, `Post ${action === 'approved' ? 'aprovado' : 'rejeitado'}`); toast.success(action === 'approved' ? 'Post aprovado!' : 'Post rejeitado'); refresh(); }
  };

  const handleAddReport = () => {
    const all = getReports();
    all.unshift({ id: crypto.randomUUID(), profileId: id!, link: reportForm.link, comment: reportForm.comment, date: reportForm.date || new Date().toISOString().split('T')[0] });
    setReports(all);
    addHistory(id!, 'Relatório adicionado');
    setShowReport(false);
    setReportForm({ link: '', comment: '', date: '' });
    toast.success('Relatório adicionado!');
    refresh();
  };

  const handleAddUpdate = () => {
    const all = getUpdates();
    all.unshift({ id: crypto.randomUUID(), profileId: id!, description: updateForm.description, date: new Date().toISOString().split('T')[0], responsible: updateForm.responsible });
    setUpdates(all);
    addHistory(id!, `Atualização: ${updateForm.description}`);
    setShowUpdate(false);
    setUpdateForm({ description: '', responsible: '' });
    toast.success('Atualização registrada!');
    refresh();
  };

  const handleAddTask = () => {
    const all = getTasks();
    all.unshift({ id: crypto.randomUUID(), profileId: id!, ...taskForm });
    setTasks(all);
    addHistory(id!, `Tarefa criada: ${taskForm.title}`);
    setShowTask(false);
    setTaskForm({ title: '', description: '', responsible: '', date: '', status: 'pending' });
    toast.success('Tarefa criada!');
    refresh();
  };

  const handleTaskStatus = (taskId: string, status: Task['status']) => {
    const all = getTasks();
    const idx = all.findIndex(t => t.id === taskId);
    if (idx !== -1) { all[idx].status = status; setTasks(all); addHistory(id!, `Tarefa "${all[idx].title}" → ${status}`); toast.success('Status atualizado!'); refresh(); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/profiles')}><ArrowLeft className="h-4 w-4" /></Button>
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'Space Grotesk' }}>{profile.name}</h1>
          <p className="text-sm text-muted-foreground">{profile.category} • {profile.city} • {profile.responsible}</p>
        </div>
      </div>

      <Tabs defaultValue="posts">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="posts">Postagens</TabsTrigger>
          <TabsTrigger value="approval">Aprovação</TabsTrigger>
          <TabsTrigger value="reports">Relatórios</TabsTrigger>
          <TabsTrigger value="updates">Atualizações</TabsTrigger>
          <TabsTrigger value="tasks">Tarefas</TabsTrigger>
          <TabsTrigger value="history">Histórico</TabsTrigger>
        </TabsList>

        {/* POSTS */}
        <TabsContent value="posts" className="space-y-4">
          <div className="flex justify-end"><Button onClick={() => setShowPost(true)} className="gap-2"><Plus className="h-4 w-4" /> Novo Post</Button></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {posts.map(p => (
              <Card key={p.id}>
                <CardContent className="p-4">
                  {p.imageUrl && <img src={p.imageUrl} alt="" className="w-full h-40 object-cover rounded-lg mb-3" />}
                  <p className="text-sm mb-2">{p.text}</p>
                  <Badge variant={p.status === 'approved' ? 'default' : p.status === 'rejected' ? 'destructive' : 'secondary'}>
                    {p.status === 'pending' ? 'Pendente' : p.status === 'approved' ? 'Aprovado' : 'Rejeitado'}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* APPROVAL */}
        <TabsContent value="approval" className="space-y-4">
          {posts.filter(p => p.status === 'pending').map(p => (
            <Card key={p.id}>
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row gap-4">
                  {p.imageUrl && <img src={p.imageUrl} alt="" className="w-full md:w-48 h-32 object-cover rounded-lg" />}
                  <div className="flex-1">
                    <p className="text-sm mb-3">{p.text}</p>
                    <Badge variant="secondary" className="mb-3">Pendente</Badge>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handlePostAction(p.id, 'approved')} className="gap-1"><Check className="h-3 w-3" /> Aprovar</Button>
                      <Button size="sm" variant="destructive" onClick={() => handlePostAction(p.id, 'rejected')} className="gap-1"><X className="h-3 w-3" /> Rejeitar</Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {posts.filter(p => p.status === 'pending').length === 0 && <p className="text-sm text-muted-foreground text-center py-8">Nenhum post pendente</p>}
        </TabsContent>

        {/* REPORTS */}
        <TabsContent value="reports" className="space-y-4">
          <div className="flex justify-end"><Button onClick={() => setShowReport(true)} className="gap-2"><Plus className="h-4 w-4" /> Novo Relatório</Button></div>
          {reports.map(r => (
            <Card key={r.id}>
              <CardContent className="p-4">
                <p className="text-sm font-medium mb-1">{r.comment}</p>
                {r.link && <a href={r.link} target="_blank" rel="noopener noreferrer" className="text-sm text-primary underline">Ver relatório</a>}
                <p className="text-xs text-muted-foreground mt-2">{r.date}</p>
              </CardContent>
            </Card>
          ))}
          {reports.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">Nenhum relatório</p>}
        </TabsContent>

        {/* UPDATES */}
        <TabsContent value="updates" className="space-y-4">
          <div className="flex justify-end"><Button onClick={() => setShowUpdate(true)} className="gap-2"><Plus className="h-4 w-4" /> Nova Atualização</Button></div>
          {updates.map(u => (
            <Card key={u.id}>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{u.description}</p>
                  <p className="text-xs text-muted-foreground">{u.responsible} • {u.date}</p>
                </div>
              </CardContent>
            </Card>
          ))}
          {updates.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">Nenhuma atualização</p>}
        </TabsContent>

        {/* TASKS */}
        <TabsContent value="tasks" className="space-y-4">
          <div className="flex justify-end"><Button onClick={() => setShowTask(true)} className="gap-2"><Plus className="h-4 w-4" /> Nova Tarefa</Button></div>
          {tasks.map(t => (
            <Card key={t.id}>
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <p className="font-medium text-sm">{t.title}</p>
                    <p className="text-xs text-muted-foreground">{t.description}</p>
                    <p className="text-xs text-muted-foreground mt-1">{t.responsible} • {t.date}</p>
                  </div>
                  <Select value={t.status} onValueChange={(v) => handleTaskStatus(t.id, v as Task['status'])}>
                    <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pendente</SelectItem>
                      <SelectItem value="in_progress">Em andamento</SelectItem>
                      <SelectItem value="completed">Concluído</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          ))}
          {tasks.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">Nenhuma tarefa</p>}
        </TabsContent>

        {/* HISTORY */}
        <TabsContent value="history" className="space-y-2">
          {history.map(h => (
            <div key={h.id} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0" />
              <div>
                <p className="text-sm">{h.action}</p>
                <p className="text-xs text-muted-foreground">{new Date(h.date).toLocaleString('pt-BR')} • {h.user}</p>
              </div>
            </div>
          ))}
          {history.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">Nenhum registro no histórico</p>}
        </TabsContent>
      </Tabs>

      {/* METRICS DIALOG */}
      <Dialog open={showMetrics} onOpenChange={setShowMetrics}>
        <DialogContent>
          <DialogHeader><DialogTitle>Atualizar Métricas do Mês</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Mês</Label><Input type="number" min={1} max={12} value={metricsForm.month} onChange={e => setMetricsForm(f => ({ ...f, month: e.target.value }))} /></div>
            <div><Label>Ano</Label><Input type="number" value={metricsForm.year} onChange={e => setMetricsForm(f => ({ ...f, year: e.target.value }))} /></div>
            <div><Label>Nota média</Label><Input type="number" step="0.1" value={metricsForm.averageRating} onChange={e => setMetricsForm(f => ({ ...f, averageRating: e.target.value }))} /></div>
            <div><Label>Total avaliações</Label><Input type="number" value={metricsForm.totalReviews} onChange={e => setMetricsForm(f => ({ ...f, totalReviews: e.target.value }))} /></div>
            <div><Label>Visualizações</Label><Input type="number" value={metricsForm.profileViews} onChange={e => setMetricsForm(f => ({ ...f, profileViews: e.target.value }))} /></div>
            <div><Label>Cliques telefone</Label><Input type="number" value={metricsForm.phoneClicks} onChange={e => setMetricsForm(f => ({ ...f, phoneClicks: e.target.value }))} /></div>
            <div><Label>Cliques site</Label><Input type="number" value={metricsForm.websiteClicks} onChange={e => setMetricsForm(f => ({ ...f, websiteClicks: e.target.value }))} /></div>
            <div><Label>Rotas solicitadas</Label><Input type="number" value={metricsForm.routeRequests} onChange={e => setMetricsForm(f => ({ ...f, routeRequests: e.target.value }))} /></div>
          </div>
          <DialogFooter><Button onClick={handleAddMetrics}>Salvar</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* POST DIALOG */}
      <Dialog open={showPost} onOpenChange={setShowPost}>
        <DialogContent>
          <DialogHeader><DialogTitle>Novo Post</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>URL da imagem</Label><Input value={postForm.imageUrl} onChange={e => setPostForm(f => ({ ...f, imageUrl: e.target.value }))} /></div>
            <div><Label>Texto</Label><Textarea value={postForm.text} onChange={e => setPostForm(f => ({ ...f, text: e.target.value }))} /></div>
          </div>
          <DialogFooter><Button onClick={handleAddPost}>Criar</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* REPORT DIALOG */}
      <Dialog open={showReport} onOpenChange={setShowReport}>
        <DialogContent>
          <DialogHeader><DialogTitle>Novo Relatório</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Link do relatório</Label><Input value={reportForm.link} onChange={e => setReportForm(f => ({ ...f, link: e.target.value }))} /></div>
            <div><Label>Comentário</Label><Textarea value={reportForm.comment} onChange={e => setReportForm(f => ({ ...f, comment: e.target.value }))} /></div>
            <div><Label>Data</Label><Input type="date" value={reportForm.date} onChange={e => setReportForm(f => ({ ...f, date: e.target.value }))} /></div>
          </div>
          <DialogFooter><Button onClick={handleAddReport}>Adicionar</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* UPDATE DIALOG */}
      <Dialog open={showUpdate} onOpenChange={setShowUpdate}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nova Atualização</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Descrição</Label><Textarea value={updateForm.description} onChange={e => setUpdateForm(f => ({ ...f, description: e.target.value }))} /></div>
            <div><Label>Responsável</Label><Input value={updateForm.responsible} onChange={e => setUpdateForm(f => ({ ...f, responsible: e.target.value }))} /></div>
          </div>
          <DialogFooter><Button onClick={handleAddUpdate}>Registrar</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* TASK DIALOG */}
      <Dialog open={showTask} onOpenChange={setShowTask}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nova Tarefa</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Título</Label><Input value={taskForm.title} onChange={e => setTaskForm(f => ({ ...f, title: e.target.value }))} /></div>
            <div><Label>Descrição</Label><Textarea value={taskForm.description} onChange={e => setTaskForm(f => ({ ...f, description: e.target.value }))} /></div>
            <div><Label>Responsável</Label><Input value={taskForm.responsible} onChange={e => setTaskForm(f => ({ ...f, responsible: e.target.value }))} /></div>
            <div><Label>Data</Label><Input type="date" value={taskForm.date} onChange={e => setTaskForm(f => ({ ...f, date: e.target.value }))} /></div>
          </div>
          <DialogFooter><Button onClick={handleAddTask}>Criar</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProfileDetail;
