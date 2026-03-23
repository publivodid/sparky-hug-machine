import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  getProfiles, getPosts, upsertPost, deletePost as deletePostApi,
  getReports, upsertReport, deleteReport as deleteReportApi,
  getUpdates, upsertUpdate, deleteUpdate as deleteUpdateApi,
  getTasks, upsertTask, deleteTask as deleteTaskApi,
  getHistory, addHistory, deleteHistory,
  getCompanyInfo, upsertCompanyInfo,
  getCompanyMaterials, addCompanyMaterial, deleteCompanyMaterial
} from "@/lib/data";
import type { Profile, Post, Report, ProfileUpdate, Task, HistoryEntry, CompanyInfo, CompanyMaterial } from "@/lib/data";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Plus, Check, X, Pencil, Trash2, Link, ExternalLink } from "lucide-react";
import { toast } from "sonner";

const ProfileDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [updates, setUpdates] = useState<ProfileUpdate[]>([]);
  const [tasks, setTasksState] = useState<Task[]>([]);
  const [history, setHistoryState] = useState<HistoryEntry[]>([]);
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null);
  const [companyDesc, setCompanyDesc] = useState('');
  const [companyMaterials, setCompanyMaterials] = useState<CompanyMaterial[]>([]);
  const [materialForm, setMaterialForm] = useState({ label: '', url: '' });
  const [loading, setLoading] = useState(true);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const [showPost, setShowPost] = useState(false);
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [postForm, setPostForm] = useState({ image_url: '', text: '' });

  const [showReport, setShowReport] = useState(false);
  const [editingReportId, setEditingReportId] = useState<string | null>(null);
  const [reportForm, setReportForm] = useState({ link: '', comment: '', date: '' });

  const [showUpdate, setShowUpdate] = useState(false);
  const [editingUpdateId, setEditingUpdateId] = useState<string | null>(null);
  const [updateForm, setUpdateForm] = useState({ description: '', responsible: '' });

  const [showTask, setShowTask] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [taskForm, setTaskForm] = useState({ title: '', description: '', responsible: '', date: '', status: 'pending' as string });

  const load = useCallback(async () => {
    if (!id) return;
    const [allProfiles, po, re, up, ta, hi, ci, cm] = await Promise.all([
      getProfiles(), getPosts(id), getReports(id), getUpdates(id), getTasks(id), getHistory(id),
      getCompanyInfo(id), getCompanyMaterials(id)
    ]);
    setProfile(allProfiles.find(p => p.id === id) || null);
    setPosts(po);
    setReports(re);
    setUpdates(up);
    setTasksState(ta);
    setHistoryState(hi);
    setCompanyInfo(ci);
    setCompanyDesc(ci?.description || '');
    setCompanyMaterials(cm);
    setLoading(false);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <div className="p-8 text-center text-muted-foreground">Carregando...</div>;
  if (!profile) return <div className="p-8 text-center text-muted-foreground">Perfil não encontrado</div>;

  const getErrorMessage = (error: unknown) => {
    if (error && typeof error === 'object' && 'message' in error) {
      return String((error as { message?: unknown }).message || 'Erro ao salvar dados.');
    }
    return 'Erro ao salvar dados.';
  };

  // === POSTS ===
  const openEditPost = (p: Post) => { setPostForm({ image_url: p.image_url, text: p.text }); setEditingPostId(p.id); setShowPost(true); };
  const handleSavePost = async () => {
    try {
      if (editingPostId) {
        await upsertPost({ id: editingPostId, profile_id: id!, ...postForm });
        await addHistory(id!, 'Post editado');
        toast.success('Post atualizado!');
      } else {
        await upsertPost({ profile_id: id!, image_url: postForm.image_url, text: postForm.text, status: 'pending' });
        await addHistory(id!, 'Novo post criado para aprovação');
        toast.success('Post criado!');
      }

      setShowPost(false);
      setEditingPostId(null);
      setPostForm({ image_url: '', text: '' });
      await load();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };
  const handleDeletePost = async (postId: string) => {
    try {
      await deletePostApi(postId);
      await addHistory(id!, 'Post excluído');
      toast.success('Post excluído!');
      await load();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };
  const handlePostAction = async (postId: string, action: 'approved' | 'rejected') => {
    try {
      await upsertPost({ id: postId, profile_id: id!, status: action });
      await addHistory(id!, `Post ${action === 'approved' ? 'aprovado' : 'rejeitado'}`);
      toast.success(action === 'approved' ? 'Post aprovado!' : 'Post rejeitado');
      await load();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  // === REPORTS ===
  const openEditReport = (r: Report) => { setReportForm({ link: r.link || '', comment: r.comment, date: r.date }); setEditingReportId(r.id); setShowReport(true); };
  const handleSaveReport = async () => {
    try {
      if (editingReportId) {
        await upsertReport({ id: editingReportId, profile_id: id!, link: reportForm.link || null, comment: reportForm.comment, date: reportForm.date || undefined });
        await addHistory(id!, 'Relatório editado');
        toast.success('Relatório atualizado!');
      } else {
        await upsertReport({ profile_id: id!, link: reportForm.link || null, comment: reportForm.comment, date: reportForm.date || undefined });
        await addHistory(id!, 'Relatório adicionado');
        toast.success('Relatório adicionado!');
      }

      setShowReport(false);
      setEditingReportId(null);
      setReportForm({ link: '', comment: '', date: '' });
      await load();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };
  const handleDeleteReport = async (reportId: string) => {
    try {
      await deleteReportApi(reportId);
      await addHistory(id!, 'Relatório excluído');
      toast.success('Relatório excluído!');
      await load();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  // === UPDATES ===
  const openEditUpdate = (u: ProfileUpdate) => { setUpdateForm({ description: u.description, responsible: u.responsible }); setEditingUpdateId(u.id); setShowUpdate(true); };
  const handleSaveUpdate = async () => {
    try {
      if (editingUpdateId) {
        await upsertUpdate({ id: editingUpdateId, profile_id: id!, ...updateForm });
        await addHistory(id!, 'Atualização editada');
        toast.success('Atualização atualizada!');
      } else {
        await upsertUpdate({ profile_id: id!, description: updateForm.description, date: new Date().toISOString().split('T')[0], responsible: updateForm.responsible });
        await addHistory(id!, `Atualização: ${updateForm.description}`);
        toast.success('Atualização registrada!');
      }

      setShowUpdate(false);
      setEditingUpdateId(null);
      setUpdateForm({ description: '', responsible: '' });
      await load();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };
  const handleDeleteUpdate = async (updateId: string) => {
    try {
      await deleteUpdateApi(updateId);
      await addHistory(id!, 'Atualização excluída');
      toast.success('Atualização excluída!');
      await load();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  // === TASKS ===
  const openEditTask = (t: Task) => { setTaskForm({ title: t.title, description: t.description, responsible: t.responsible, date: t.date, status: t.status }); setEditingTaskId(t.id); setShowTask(true); };
  const handleSaveTask = async () => {
    if (!taskForm.title.trim()) {
      toast.error('Informe o título da tarefa.');
      return;
    }

    try {
      if (editingTaskId) {
        await upsertTask({ id: editingTaskId, profile_id: id!, ...taskForm, date: taskForm.date || undefined });
        await addHistory(id!, `Tarefa editada: ${taskForm.title}`);
        toast.success('Tarefa atualizada!');
      } else {
        await upsertTask({ profile_id: id!, ...taskForm, date: taskForm.date || undefined });
        await addHistory(id!, `Tarefa criada: ${taskForm.title}`);
        toast.success('Tarefa criada!');
      }

      setShowTask(false);
      setEditingTaskId(null);
      setTaskForm({ title: '', description: '', responsible: '', date: '', status: 'pending' });
      await load();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };
  const handleDeleteTask = async (taskId: string) => {
    try {
      await deleteTaskApi(taskId);
      await addHistory(id!, 'Tarefa excluída');
      toast.success('Tarefa excluída!');
      await load();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const handleTaskStatus = async (task: Task, status: string) => {
    try {
      await upsertTask({ id: task.id, profile_id: id!, status });
      await addHistory(id!, `Tarefa "${task.title}" → ${status}`);
      toast.success('Status atualizado!');
      await load();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const ActionButtons = ({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) => (
    <div className="flex gap-1">
      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onEdit}><Pencil className="h-3.5 w-3.5" /></Button>
      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={onDelete}><Trash2 className="h-3.5 w-3.5" /></Button>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/profiles')}><ArrowLeft className="h-4 w-4" /></Button>
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'Space Grotesk' }}>{profile.name}</h1>
          <p className="text-sm text-muted-foreground">{profile.category} • {profile.city} • {profile.responsible}</p>
        </div>
      </div>

      <Tabs defaultValue="company">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="company">Informações da Empresa</TabsTrigger>
          <TabsTrigger value="posts">Postagens</TabsTrigger>
          <TabsTrigger value="approval">Aprovação</TabsTrigger>
          <TabsTrigger value="reports">Relatórios</TabsTrigger>
          <TabsTrigger value="updates">Atualizações</TabsTrigger>
          <TabsTrigger value="tasks">Tarefas</TabsTrigger>
          <TabsTrigger value="history">Histórico</TabsTrigger>
        </TabsList>

        {/* COMPANY INFO */}
        <TabsContent value="company" className="space-y-6">
          <Card>
            <CardContent className="p-6 space-y-4">
              <h3 className="font-semibold text-lg">Sobre a Empresa</h3>
              <Textarea
                placeholder="Descreva informações sobre a empresa, serviços, diferenciais..."
                value={companyDesc}
                onChange={e => setCompanyDesc(e.target.value)}
                className="min-h-[120px]"
              />
              <Button onClick={async () => {
                try {
                  await upsertCompanyInfo({ id: companyInfo?.id, profile_id: id!, description: companyDesc });
                  toast.success('Informações salvas!');
                  await load();
                } catch (error) {
                  toast.error(getErrorMessage(error));
                }
              }}>Salvar Descrição</Button>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 space-y-4">
              <h3 className="font-semibold text-lg">Materiais da Empresa</h3>
              <p className="text-sm text-muted-foreground">Links para logo, artes, exemplos, documentos e outros materiais.</p>
              
              <div className="flex flex-col sm:flex-row gap-2">
                <Input placeholder="Nome (ex: Logo)" value={materialForm.label} onChange={e => setMaterialForm(f => ({ ...f, label: e.target.value }))} className="sm:w-1/3" />
                <Input placeholder="URL do material" value={materialForm.url} onChange={e => setMaterialForm(f => ({ ...f, url: e.target.value }))} className="flex-1" />
                <Button onClick={async () => {
                  if (!materialForm.label.trim() || !materialForm.url.trim()) {
                    toast.error('Preencha o nome e a URL.');
                    return;
                  }
                  try {
                    await addCompanyMaterial({ profile_id: id!, label: materialForm.label, url: materialForm.url });
                    toast.success('Material adicionado!');
                    setMaterialForm({ label: '', url: '' });
                    await load();
                  } catch (error) {
                    toast.error(getErrorMessage(error));
                  }
                }} className="gap-2"><Plus className="h-4 w-4" /> Adicionar</Button>
              </div>

              <div className="space-y-2">
                {companyMaterials.map(m => (
                  <div key={m.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2 min-w-0">
                      <Link className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span className="text-sm font-medium">{m.label}</span>
                      <a href={m.url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary underline truncate flex items-center gap-1">
                        {m.url} <ExternalLink className="h-3 w-3 flex-shrink-0" />
                      </a>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive flex-shrink-0" onClick={async () => {
                      try {
                        await deleteCompanyMaterial(m.id);
                        toast.success('Material removido!');
                        await load();
                      } catch (error) {
                        toast.error('Erro ao remover material.');
                      }
                    }}><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                ))}
                {companyMaterials.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Nenhum material adicionado</p>}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* POSTS */}
        <TabsContent value="posts" className="space-y-4">
          <div className="flex justify-end"><Button onClick={() => { setEditingPostId(null); setPostForm({ image_url: '', text: '' }); setShowPost(true); }} className="gap-2"><Plus className="h-4 w-4" /> Novo Post</Button></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {posts.map(p => (
              <Card key={p.id}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <Badge variant={p.status === 'approved' ? 'default' : p.status === 'rejected' ? 'destructive' : 'secondary'}>
                      {p.status === 'pending' ? 'Pendente' : p.status === 'approved' ? 'Aprovado' : 'Rejeitado'}
                    </Badge>
                    <ActionButtons onEdit={() => openEditPost(p)} onDelete={() => handleDeletePost(p.id)} />
                  </div>
                  {p.image_url && <img src={p.image_url} alt="" className="w-full h-40 object-cover rounded-lg mb-3 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => setPreviewImage(p.image_url)} />}
                  <p className="text-sm">{p.text}</p>
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
                  {p.image_url && <img src={p.image_url} alt="" className="w-full md:w-48 h-32 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity" onClick={() => setPreviewImage(p.image_url)} />}
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
          <div className="flex justify-end"><Button onClick={() => { setEditingReportId(null); setReportForm({ link: '', comment: '', date: '' }); setShowReport(true); }} className="gap-2"><Plus className="h-4 w-4" /> Novo Relatório</Button></div>
          {reports.map(r => (
            <Card key={r.id}>
              <CardContent className="p-4 flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium mb-1">{r.comment}</p>
                  {r.link && <a href={r.link} target="_blank" rel="noopener noreferrer" className="text-sm text-primary underline">Ver relatório</a>}
                  <p className="text-xs text-muted-foreground mt-2">{r.date}</p>
                </div>
                <ActionButtons onEdit={() => openEditReport(r)} onDelete={() => handleDeleteReport(r.id)} />
              </CardContent>
            </Card>
          ))}
          {reports.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">Nenhum relatório</p>}
        </TabsContent>

        {/* UPDATES */}
        <TabsContent value="updates" className="space-y-4">
          <div className="flex justify-end"><Button onClick={() => { setEditingUpdateId(null); setUpdateForm({ description: '', responsible: '' }); setShowUpdate(true); }} className="gap-2"><Plus className="h-4 w-4" /> Nova Atualização</Button></div>
          {updates.map(u => (
            <Card key={u.id}>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{u.description}</p>
                  <p className="text-xs text-muted-foreground">{u.responsible} • {u.date}</p>
                </div>
                <ActionButtons onEdit={() => openEditUpdate(u)} onDelete={() => handleDeleteUpdate(u.id)} />
              </CardContent>
            </Card>
          ))}
          {updates.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">Nenhuma atualização</p>}
        </TabsContent>

        {/* TASKS */}
        <TabsContent value="tasks" className="space-y-4">
          <div className="flex justify-end"><Button onClick={() => { setEditingTaskId(null); setTaskForm({ title: '', description: '', responsible: '', date: '', status: 'pending' }); setShowTask(true); }} className="gap-2"><Plus className="h-4 w-4" /> Nova Tarefa</Button></div>
          {tasks.map(t => (
            <Card key={t.id}>
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex-1">
                    <p className="font-medium text-sm">{t.title}</p>
                    <p className="text-xs text-muted-foreground">{t.description}</p>
                    <p className="text-xs text-muted-foreground mt-1">{t.responsible} • {t.date}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Select value={t.status} onValueChange={(v) => handleTaskStatus(t, v)}>
                      <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pendente</SelectItem>
                        <SelectItem value="in_progress">Em andamento</SelectItem>
                        <SelectItem value="completed">Concluído</SelectItem>
                      </SelectContent>
                    </Select>
                    <ActionButtons onEdit={() => openEditTask(t)} onDelete={() => handleDeleteTask(t.id)} />
                  </div>
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
              <div className="flex-1">
                <p className="text-sm">{h.action}</p>
                <p className="text-xs text-muted-foreground">{new Date(h.date).toLocaleString('pt-BR')} • {h.user}</p>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={async () => {
                try {
                  await deleteHistory(h.id);
                  toast.success('Registro excluído!');
                  await load();
                } catch (error) {
                  toast.error('Erro ao excluir registro.');
                }
              }}><Trash2 className="h-3.5 w-3.5" /></Button>
            </div>
          ))}
          {history.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">Nenhum registro no histórico</p>}
        </TabsContent>
      </Tabs>

      {/* POST DIALOG */}
      <Dialog open={showPost} onOpenChange={setShowPost}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingPostId ? 'Editar Post' : 'Novo Post'}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>URL da imagem</Label><Input value={postForm.image_url} onChange={e => setPostForm(f => ({ ...f, image_url: e.target.value }))} /></div>
            <div><Label>Texto</Label><Textarea value={postForm.text} onChange={e => setPostForm(f => ({ ...f, text: e.target.value }))} /></div>
          </div>
          <DialogFooter><Button onClick={handleSavePost}>{editingPostId ? 'Salvar' : 'Criar'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* REPORT DIALOG */}
      <Dialog open={showReport} onOpenChange={setShowReport}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingReportId ? 'Editar Relatório' : 'Novo Relatório'}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Link do relatório</Label><Input value={reportForm.link} onChange={e => setReportForm(f => ({ ...f, link: e.target.value }))} /></div>
            <div><Label>Comentário</Label><Textarea value={reportForm.comment} onChange={e => setReportForm(f => ({ ...f, comment: e.target.value }))} /></div>
            <div><Label>Data</Label><Input type="date" value={reportForm.date} onChange={e => setReportForm(f => ({ ...f, date: e.target.value }))} /></div>
          </div>
          <DialogFooter><Button onClick={handleSaveReport}>{editingReportId ? 'Salvar' : 'Adicionar'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* UPDATE DIALOG */}
      <Dialog open={showUpdate} onOpenChange={setShowUpdate}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingUpdateId ? 'Editar Atualização' : 'Nova Atualização'}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Descrição</Label><Textarea value={updateForm.description} onChange={e => setUpdateForm(f => ({ ...f, description: e.target.value }))} /></div>
            <div><Label>Responsável</Label><Input value={updateForm.responsible} onChange={e => setUpdateForm(f => ({ ...f, responsible: e.target.value }))} /></div>
          </div>
          <DialogFooter><Button onClick={handleSaveUpdate}>{editingUpdateId ? 'Salvar' : 'Registrar'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* TASK DIALOG */}
      <Dialog open={showTask} onOpenChange={setShowTask}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingTaskId ? 'Editar Tarefa' : 'Nova Tarefa'}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Título</Label><Input value={taskForm.title} onChange={e => setTaskForm(f => ({ ...f, title: e.target.value }))} /></div>
            <div><Label>Descrição</Label><Textarea value={taskForm.description} onChange={e => setTaskForm(f => ({ ...f, description: e.target.value }))} /></div>
            <div><Label>Responsável</Label><Input value={taskForm.responsible} onChange={e => setTaskForm(f => ({ ...f, responsible: e.target.value }))} /></div>
            <div><Label>Data</Label><Input type="date" value={taskForm.date} onChange={e => setTaskForm(f => ({ ...f, date: e.target.value }))} /></div>
          </div>
          <DialogFooter><Button onClick={handleSaveTask}>{editingTaskId ? 'Salvar' : 'Criar'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* IMAGE PREVIEW MODAL */}
      <Dialog open={!!previewImage} onOpenChange={() => setPreviewImage(null)}>
        <DialogContent className="max-w-3xl p-2">
          {previewImage && <img src={previewImage} alt="Preview" className="w-full h-auto rounded-lg" />}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProfileDetail;
