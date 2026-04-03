import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  getProfiles, upsertProfile, getPosts, upsertPost, deletePost as deletePostApi,
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
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft, Plus, Check, X, Pencil, Trash2, Link, ExternalLink,
  Building2, MapPin, FileText, Clock, ListTodo, Image, CheckCircle,
  BarChart3, History, FolderOpen, Download, Eye, StickyNote,
  AlertTriangle, AlertCircle, CheckCircle2, ChevronRight
} from "lucide-react";
import { toast } from "sonner";

const PRIORITY_ICON: Record<string, { icon: typeof AlertTriangle; color: string; label: string }> = {
  high: { icon: AlertTriangle, color: "text-red-500", label: "Alta" },
  medium: { icon: AlertCircle, color: "text-amber-500", label: "Média" },
  low: { icon: CheckCircle2, color: "text-emerald-500", label: "Baixa" },
};

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  pending: { label: "A Fazer", className: "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300" },
  in_progress: { label: "Em andamento", className: "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300" },
  completed: { label: "Concluído", className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300" },
};

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
  const [companyDesc, setCompanyDesc] = useState("");
  const [companyMaterials, setCompanyMaterials] = useState<CompanyMaterial[]>([]);
  const [materialForm, setMaterialForm] = useState({ label: "", url: "" });
  const [loading, setLoading] = useState(true);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [quickNote, setQuickNote] = useState("");

  // Edit profile
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({ name: "", category: "", city: "", responsible: "" });

  const [showPost, setShowPost] = useState(false);
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [postForm, setPostForm] = useState({ image_url: "", text: "" });

  const [showReport, setShowReport] = useState(false);
  const [editingReportId, setEditingReportId] = useState<string | null>(null);
  const [reportForm, setReportForm] = useState({ link: "", comment: "", date: "" });

  const [showUpdate, setShowUpdate] = useState(false);
  const [editingUpdateId, setEditingUpdateId] = useState<string | null>(null);
  const [updateForm, setUpdateForm] = useState({ description: "", responsible: "" });

  const [showTask, setShowTask] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [taskForm, setTaskForm] = useState({ title: "", description: "", responsible: "", date: "", status: "pending", priority: "medium" });

  const load = useCallback(async () => {
    if (!id) return;
    const [allProfiles, po, re, up, ta, hi, ci, cm] = await Promise.all([
      getProfiles(), getPosts(id), getReports(id), getUpdates(id), getTasks(id), getHistory(id),
      getCompanyInfo(id), getCompanyMaterials(id),
    ]);
    const found = allProfiles.find(p => p.id === id) || null;
    setProfile(found);
    setPosts(po);
    setReports(re);
    setUpdates(up);
    setTasksState(ta);
    setHistoryState(hi);
    setCompanyInfo(ci);
    setCompanyDesc(ci?.description || "");
    setCompanyMaterials(cm);
    setLoading(false);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const pendingTasks = useMemo(() => tasks.filter(t => t.status !== "completed").slice(0, 5), [tasks]);
  const recentPosts = useMemo(() => posts.slice(0, 3), [posts]);
  const pendingPosts = useMemo(() => posts.filter(p => p.status === "pending"), [posts]);

  const tasksByStatus = useMemo(() => ({
    pending: tasks.filter(t => t.status === "pending"),
    in_progress: tasks.filter(t => t.status === "in_progress"),
    completed: tasks.filter(t => t.status === "completed"),
  }), [tasks]);

  if (loading) return <div className="p-8 text-center text-muted-foreground">Carregando...</div>;
  if (!profile) return <div className="p-8 text-center text-muted-foreground">Perfil não encontrado</div>;

  const err = (error: unknown) => {
    if (error && typeof error === "object" && "message" in error) return String((error as any).message || "Erro ao salvar.");
    return "Erro ao salvar.";
  };

  // === Profile edit ===
  const openProfileEdit = () => {
    setProfileForm({ name: profile.name, category: profile.category, city: profile.city, responsible: profile.responsible });
    setShowEditProfile(true);
  };
  const handleEditProfile = async () => {
    if (!profileForm.name) return;
    await upsertProfile({ id: profile.id, ...profileForm });
    await addHistory(profile.id, "Perfil editado");
    setShowEditProfile(false);
    toast.success("Perfil atualizado!");
    load();
  };

  // === POSTS ===
  const openEditPost = (p: Post) => { setPostForm({ image_url: p.image_url, text: p.text }); setEditingPostId(p.id); setShowPost(true); };
  const handleSavePost = async () => {
    try {
      if (editingPostId) {
        await upsertPost({ id: editingPostId, profile_id: id!, ...postForm });
        await addHistory(id!, "Post editado");
        toast.success("Post atualizado!");
      } else {
        await upsertPost({ profile_id: id!, image_url: postForm.image_url, text: postForm.text, status: "pending" });
        await addHistory(id!, "Novo post criado para aprovação");
        toast.success("Post criado!");
      }
      setShowPost(false); setEditingPostId(null); setPostForm({ image_url: "", text: "" }); await load();
    } catch (error) { toast.error(err(error)); }
  };
  const handleDeletePost = async (postId: string) => {
    try { await deletePostApi(postId); await addHistory(id!, "Post excluído"); toast.success("Post excluído!"); await load(); } catch (error) { toast.error(err(error)); }
  };
  const handlePostAction = async (postId: string, action: "approved" | "rejected") => {
    try {
      await upsertPost({ id: postId, profile_id: id!, status: action });
      await addHistory(id!, `Post ${action === "approved" ? "aprovado" : "rejeitado"}`);
      toast.success(action === "approved" ? "Post aprovado!" : "Post rejeitado");
      await load();
    } catch (error) { toast.error(err(error)); }
  };

  // === REPORTS ===
  const openEditReport = (r: Report) => { setReportForm({ link: r.link || "", comment: r.comment, date: r.date }); setEditingReportId(r.id); setShowReport(true); };
  const handleSaveReport = async () => {
    try {
      if (editingReportId) {
        await upsertReport({ id: editingReportId, profile_id: id!, link: reportForm.link || null, comment: reportForm.comment, date: reportForm.date || undefined });
        await addHistory(id!, "Relatório editado"); toast.success("Relatório atualizado!");
      } else {
        await upsertReport({ profile_id: id!, link: reportForm.link || null, comment: reportForm.comment, date: reportForm.date || undefined });
        await addHistory(id!, "Relatório adicionado"); toast.success("Relatório adicionado!");
      }
      setShowReport(false); setEditingReportId(null); setReportForm({ link: "", comment: "", date: "" }); await load();
    } catch (error) { toast.error(err(error)); }
  };
  const handleDeleteReport = async (reportId: string) => {
    try { await deleteReportApi(reportId); await addHistory(id!, "Relatório excluído"); toast.success("Relatório excluído!"); await load(); } catch (error) { toast.error(err(error)); }
  };

  // === UPDATES ===
  const openEditUpdate = (u: ProfileUpdate) => { setUpdateForm({ description: u.description, responsible: u.responsible }); setEditingUpdateId(u.id); setShowUpdate(true); };
  const handleSaveUpdate = async () => {
    try {
      if (editingUpdateId) {
        await upsertUpdate({ id: editingUpdateId, profile_id: id!, ...updateForm });
        await addHistory(id!, "Atualização editada"); toast.success("Atualização atualizada!");
      } else {
        await upsertUpdate({ profile_id: id!, description: updateForm.description, date: new Date().toISOString().split("T")[0], responsible: updateForm.responsible });
        await addHistory(id!, `Atualização: ${updateForm.description}`); toast.success("Atualização registrada!");
      }
      setShowUpdate(false); setEditingUpdateId(null); setUpdateForm({ description: "", responsible: "" }); await load();
    } catch (error) { toast.error(err(error)); }
  };
  const handleDeleteUpdate = async (updateId: string) => {
    try { await deleteUpdateApi(updateId); await addHistory(id!, "Atualização excluída"); toast.success("Atualização excluída!"); await load(); } catch (error) { toast.error(err(error)); }
  };

  // === TASKS ===
  const openEditTask = (t: Task) => { setTaskForm({ title: t.title, description: t.description, responsible: t.responsible, date: t.date, status: t.status, priority: t.priority || "medium" }); setEditingTaskId(t.id); setShowTask(true); };
  const handleSaveTask = async () => {
    if (!taskForm.title.trim()) { toast.error("Informe o título da tarefa."); return; }
    try {
      if (editingTaskId) {
        await upsertTask({ id: editingTaskId, profile_id: id!, ...taskForm, date: taskForm.date || undefined });
        await addHistory(id!, `Tarefa editada: ${taskForm.title}`); toast.success("Tarefa atualizada!");
      } else {
        await upsertTask({ profile_id: id!, ...taskForm, date: taskForm.date || undefined });
        await addHistory(id!, `Tarefa criada: ${taskForm.title}`); toast.success("Tarefa criada!");
      }
      setShowTask(false); setEditingTaskId(null); setTaskForm({ title: "", description: "", responsible: "", date: "", status: "pending", priority: "medium" }); await load();
    } catch (error) { toast.error(err(error)); }
  };
  const handleDeleteTask = async (taskId: string) => {
    try { await deleteTaskApi(taskId); await addHistory(id!, "Tarefa excluída"); toast.success("Tarefa excluída!"); await load(); } catch (error) { toast.error(err(error)); }
  };
  const handleTaskStatus = async (task: Task, status: string) => {
    try { await upsertTask({ id: task.id, profile_id: id!, status }); await addHistory(id!, `Tarefa "${task.title}" → ${status}`); toast.success("Status atualizado!"); await load(); } catch (error) { toast.error(err(error)); }
  };

  const handleQuickNote = async () => {
    if (!quickNote.trim()) return;
    try {
      await upsertUpdate({ profile_id: id!, description: quickNote, date: new Date().toISOString().split("T")[0], responsible: "Equipe" });
      await addHistory(id!, `Nota rápida: ${quickNote}`);
      setQuickNote("");
      toast.success("Nota salva!");
      await load();
    } catch (error) { toast.error(err(error)); }
  };

  const ActionBtns = ({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) => (
    <div className="flex gap-1">
      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onEdit}><Pencil className="h-3.5 w-3.5" /></Button>
      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={onDelete}><Trash2 className="h-3.5 w-3.5" /></Button>
    </div>
  );

  const PriorityBadge = ({ priority }: { priority: string }) => {
    const cfg = PRIORITY_ICON[priority] || PRIORITY_ICON.medium;
    const Icon = cfg.icon;
    return <span className={`inline-flex items-center gap-1 text-xs font-medium ${cfg.color}`}><Icon className="h-3 w-3" />{cfg.label}</span>;
  };

  const StatusBadge = ({ status }: { status: string }) => {
    const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
    return <Badge className={`${cfg.className} text-[10px] px-2 py-0.5 rounded-full font-medium`}>{cfg.label}</Badge>;
  };

  const TaskCard = ({ task }: { task: Task }) => (
    <Card className="rounded-xl border shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">{task.title}</p>
            {task.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{task.description}</p>}
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              <PriorityBadge priority={task.priority} />
              <span className="text-xs text-muted-foreground">{task.responsible}</span>
              {task.date && <span className="text-xs text-muted-foreground">{task.date}</span>}
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Select value={task.status} onValueChange={v => handleTaskStatus(task, v)}>
              <SelectTrigger className="h-7 text-xs w-32"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">A Fazer</SelectItem>
                <SelectItem value="in_progress">Em andamento</SelectItem>
                <SelectItem value="completed">Concluído</SelectItem>
              </SelectContent>
            </Select>
            <ActionBtns onEdit={() => openEditTask(task)} onDelete={() => handleDeleteTask(task.id)} />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="bg-muted/30 min-h-screen -m-6 p-6 space-y-6">
      {/* HEADER */}
      <div className="bg-card rounded-2xl border shadow-sm p-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <Button variant="ghost" size="icon" className="shrink-0 h-10 w-10 rounded-xl" onClick={() => navigate("/profiles")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Building2 className="h-6 w-6 text-primary" />
              </div>
              <div className="min-w-0">
                <h1 className="text-xl font-bold tracking-tight truncate" style={{ fontFamily: "Space Grotesk" }}>{profile.name}</h1>
                <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
                  <span>{profile.category}</span>
                  <span>•</span>
                  <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{profile.city}</span>
                  <span>•</span>
                  <span>{profile.responsible}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button variant="outline" className="gap-2 rounded-xl" onClick={openProfileEdit}>
              <Pencil className="h-4 w-4" /> Editar
            </Button>
            <Button className="gap-2 rounded-xl" onClick={() => { setEditingTaskId(null); setTaskForm({ title: "", description: "", responsible: "", date: "", status: "pending", priority: "medium" }); setShowTask(true); }}>
              <Plus className="h-4 w-4" /> Nova Tarefa
            </Button>
          </div>
        </div>
      </div>

      {/* TABS */}
      <Tabs defaultValue="overview" className="space-y-4">
        <div className="bg-card rounded-2xl border shadow-sm px-2 py-1.5">
          <TabsList className="bg-transparent h-auto gap-0.5 flex-wrap">
            <TabsTrigger value="overview" className="gap-1.5 rounded-xl data-[state=active]:bg-primary/10 data-[state=active]:text-primary"><Eye className="h-3.5 w-3.5" />Visão Geral</TabsTrigger>
            <TabsTrigger value="info" className="gap-1.5 rounded-xl data-[state=active]:bg-primary/10 data-[state=active]:text-primary"><Building2 className="h-3.5 w-3.5" />Informações</TabsTrigger>
            <TabsTrigger value="materials" className="gap-1.5 rounded-xl data-[state=active]:bg-primary/10 data-[state=active]:text-primary"><FolderOpen className="h-3.5 w-3.5" />Materiais</TabsTrigger>
            <TabsTrigger value="posts" className="gap-1.5 rounded-xl data-[state=active]:bg-primary/10 data-[state=active]:text-primary"><Image className="h-3.5 w-3.5" />Postagens</TabsTrigger>
            <TabsTrigger value="approval" className="gap-1.5 rounded-xl data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
              <CheckCircle className="h-3.5 w-3.5" />Aprovação
              {pendingPosts.length > 0 && <Badge className="bg-amber-500 text-white text-[10px] h-5 min-w-5 px-1.5 rounded-full">{pendingPosts.length}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="tasks" className="gap-1.5 rounded-xl data-[state=active]:bg-primary/10 data-[state=active]:text-primary"><ListTodo className="h-3.5 w-3.5" />Tarefas</TabsTrigger>
            <TabsTrigger value="reports" className="gap-1.5 rounded-xl data-[state=active]:bg-primary/10 data-[state=active]:text-primary"><BarChart3 className="h-3.5 w-3.5" />Relatórios</TabsTrigger>
            <TabsTrigger value="history" className="gap-1.5 rounded-xl data-[state=active]:bg-primary/10 data-[state=active]:text-primary"><History className="h-3.5 w-3.5" />Histórico</TabsTrigger>
          </TabsList>
        </div>

        {/* OVERVIEW */}
        <TabsContent value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Upcoming tasks */}
            <Card className="rounded-2xl border shadow-sm lg:col-span-2">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-foreground flex items-center gap-2"><ListTodo className="h-4 w-4 text-primary" />Próximas Tarefas</h3>
                  <Badge variant="secondary" className="text-xs">{pendingTasks.length}</Badge>
                </div>
                {pendingTasks.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">Nenhuma tarefa pendente</p>
                ) : (
                  <div className="space-y-2">
                    {pendingTasks.map(t => (
                      <div key={t.id} className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors">
                        <PriorityBadge priority={t.priority} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{t.title}</p>
                          <p className="text-xs text-muted-foreground">{t.responsible} • {t.date}</p>
                        </div>
                        <StatusBadge status={t.status} />
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick note */}
            <Card className="rounded-2xl border shadow-sm">
              <CardContent className="p-6">
                <h3 className="font-semibold text-foreground flex items-center gap-2 mb-4"><StickyNote className="h-4 w-4 text-primary" />Anotação Rápida</h3>
                <Textarea placeholder="Escreva uma nota rápida..." value={quickNote} onChange={e => setQuickNote(e.target.value)} className="min-h-[100px] rounded-xl mb-3" />
                <Button className="w-full rounded-xl" onClick={handleQuickNote} disabled={!quickNote.trim()}>Salvar Nota</Button>
              </CardContent>
            </Card>

            {/* Recent posts - last post date */}
            <Card className="rounded-2xl border shadow-sm lg:col-span-3">
              <CardContent className="p-6">
                <h3 className="font-semibold text-foreground flex items-center gap-2 mb-4"><Image className="h-4 w-4 text-primary" />Postagens Recentes</h3>
                <div className="flex items-center gap-3 p-4 rounded-xl bg-muted/50">
                  <Clock className="h-5 w-5 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Última postagem</p>
                    <p className="text-sm font-semibold text-foreground">
                      {profile.last_post_date
                        ? new Date(profile.last_post_date).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })
                        : "Nenhuma postagem registrada"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* INFORMAÇÕES */}
        <TabsContent value="info">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <Card className="rounded-2xl border shadow-sm">
              <CardContent className="p-6 space-y-4">
                <h3 className="font-semibold text-foreground flex items-center gap-2"><Building2 className="h-4 w-4 text-primary" />Dados Principais</h3>
                <Separator />
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><span className="text-muted-foreground block text-xs mb-1">Nome</span><span className="font-medium">{profile.name}</span></div>
                  <div><span className="text-muted-foreground block text-xs mb-1">Categoria</span><span className="font-medium">{profile.category}</span></div>
                  <div><span className="text-muted-foreground block text-xs mb-1">Cidade</span><span className="font-medium">{profile.city}</span></div>
                  <div><span className="text-muted-foreground block text-xs mb-1">Responsável</span><span className="font-medium">{profile.responsible}</span></div>
                </div>
                <Button variant="outline" className="rounded-xl gap-2" onClick={openProfileEdit}><Pencil className="h-4 w-4" />Editar dados</Button>
              </CardContent>
            </Card>
            <Card className="rounded-2xl border shadow-sm">
              <CardContent className="p-6 space-y-4">
                <h3 className="font-semibold text-foreground flex items-center gap-2"><FileText className="h-4 w-4 text-primary" />Descrição</h3>
                <Separator />
                <Textarea placeholder="Descreva informações sobre a empresa..." value={companyDesc} onChange={e => setCompanyDesc(e.target.value)} className="min-h-[140px] rounded-xl" />
                <Button className="rounded-xl" onClick={async () => {
                  try { await upsertCompanyInfo({ id: companyInfo?.id, profile_id: id!, description: companyDesc }); toast.success("Informações salvas!"); await load(); } catch (error) { toast.error(err(error)); }
                }}>Salvar Descrição</Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* MATERIAIS */}
        <TabsContent value="materials">
          <Card className="rounded-2xl border shadow-sm">
            <CardContent className="p-6 space-y-5">
              <h3 className="font-semibold text-foreground flex items-center gap-2"><FolderOpen className="h-4 w-4 text-primary" />Materiais da Empresa</h3>
              <div className="flex flex-col sm:flex-row gap-2">
                <Input placeholder="Nome (ex: Logo)" value={materialForm.label} onChange={e => setMaterialForm(f => ({ ...f, label: e.target.value }))} className="sm:w-1/3 rounded-xl" />
                <Input placeholder="URL do material" value={materialForm.url} onChange={e => setMaterialForm(f => ({ ...f, url: e.target.value }))} className="flex-1 rounded-xl" />
                <Button className="rounded-xl gap-2" onClick={async () => {
                  if (!materialForm.label.trim() || !materialForm.url.trim()) { toast.error("Preencha nome e URL."); return; }
                  try { await addCompanyMaterial({ profile_id: id!, label: materialForm.label, url: materialForm.url }); toast.success("Material adicionado!"); setMaterialForm({ label: "", url: "" }); await load(); } catch (error) { toast.error(err(error)); }
                }}><Plus className="h-4 w-4" />Adicionar</Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {companyMaterials.map(m => (
                  <Card key={m.id} className="rounded-xl border shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-4 flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <Link className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{m.label}</p>
                        <a href={m.url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary truncate flex items-center gap-1 hover:underline">
                          Abrir <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive shrink-0" onClick={async () => {
                        try { await deleteCompanyMaterial(m.id); toast.success("Material removido!"); await load(); } catch { toast.error("Erro ao remover."); }
                      }}><Trash2 className="h-3.5 w-3.5" /></Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
              {companyMaterials.length === 0 && <p className="text-sm text-muted-foreground text-center py-6">Nenhum material adicionado</p>}
            </CardContent>
          </Card>
        </TabsContent>

        {/* POSTAGENS */}
        <TabsContent value="posts" className="space-y-4">
          <div className="flex justify-end">
            <Button className="gap-2 rounded-xl" onClick={() => { setEditingPostId(null); setPostForm({ image_url: "", text: "" }); setShowPost(true); }}><Plus className="h-4 w-4" />Novo Post</Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {posts.map(p => (
              <Card key={p.id} className="rounded-2xl border shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                <CardContent className="p-0">
                  {p.image_url && <img src={p.image_url} alt="" className="w-full h-44 object-cover cursor-pointer hover:opacity-80 transition-opacity" onClick={() => setPreviewImage(p.image_url)} />}
                  <div className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <Badge className={`text-[10px] rounded-full ${p.status === "approved" ? "bg-emerald-100 text-emerald-700" : p.status === "rejected" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>
                        {p.status === "pending" ? "Pendente" : p.status === "approved" ? "Aprovado" : "Rejeitado"}
                      </Badge>
                      <ActionBtns onEdit={() => openEditPost(p)} onDelete={() => handleDeletePost(p.id)} />
                    </div>
                    <p className="text-sm line-clamp-3">{p.text}</p>
                    <p className="text-xs text-muted-foreground mt-2">{p.created_at}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          {posts.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">Nenhum post</p>}
        </TabsContent>

        {/* APROVAÇÃO */}
        <TabsContent value="approval" className="space-y-4">
          {pendingPosts.map(p => (
            <Card key={p.id} className="rounded-2xl border shadow-sm overflow-hidden">
              <CardContent className="p-0">
                <div className="flex flex-col md:flex-row">
                  {p.image_url && <img src={p.image_url} alt="" className="w-full md:w-64 h-48 md:h-auto object-cover cursor-pointer hover:opacity-80 transition-opacity" onClick={() => setPreviewImage(p.image_url)} />}
                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <Badge className="bg-amber-100 text-amber-700 text-[10px] rounded-full mb-3">Pendente</Badge>
                      <p className="text-sm">{p.text}</p>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <Button className="gap-1.5 rounded-xl" onClick={() => handlePostAction(p.id, "approved")}><Check className="h-4 w-4" />Aprovar</Button>
                      <Button variant="destructive" className="gap-1.5 rounded-xl" onClick={() => handlePostAction(p.id, "rejected")}><X className="h-4 w-4" />Rejeitar</Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {pendingPosts.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">Nenhum post pendente</p>}
        </TabsContent>

        {/* TAREFAS - Kanban style */}
        <TabsContent value="tasks" className="space-y-4">
          <div className="flex justify-end">
            <Button className="gap-2 rounded-xl" onClick={() => { setEditingTaskId(null); setTaskForm({ title: "", description: "", responsible: "", date: "", status: "pending", priority: "medium" }); setShowTask(true); }}><Plus className="h-4 w-4" />Nova Tarefa</Button>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {(["pending", "in_progress", "completed"] as const).map(status => {
              const cfg = STATUS_CONFIG[status];
              const items = tasksByStatus[status];
              return (
                <div key={status} className="space-y-3">
                  <div className="flex items-center gap-2 px-1">
                    <div className={`h-2.5 w-2.5 rounded-full ${status === "pending" ? "bg-amber-500" : status === "in_progress" ? "bg-blue-500" : "bg-emerald-500"}`} />
                    <h3 className="font-semibold text-sm text-foreground">{cfg.label}</h3>
                    <Badge variant="secondary" className="text-xs">{items.length}</Badge>
                  </div>
                  <div className="space-y-2 min-h-[100px]">
                    {items.map(t => <TaskCard key={t.id} task={t} />)}
                    {items.length === 0 && <p className="text-xs text-muted-foreground text-center py-6 bg-muted/30 rounded-xl border border-dashed">Nenhuma tarefa</p>}
                  </div>
                </div>
              );
            })}
          </div>
        </TabsContent>

        {/* RELATÓRIOS */}
        <TabsContent value="reports" className="space-y-4">
          <div className="flex justify-end">
            <Button className="gap-2 rounded-xl" onClick={() => { setEditingReportId(null); setReportForm({ link: "", comment: "", date: "" }); setShowReport(true); }}><Plus className="h-4 w-4" />Novo Relatório</Button>
          </div>
          <div className="space-y-3">
            {reports.map(r => (
              <Card key={r.id} className="rounded-2xl border shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-5 flex items-center gap-4">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <BarChart3 className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{r.comment}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{r.date}</p>
                  </div>
                  {r.link && (
                    <a href={r.link} target="_blank" rel="noopener noreferrer">
                      <Button variant="outline" size="sm" className="gap-1.5 rounded-xl"><Download className="h-3.5 w-3.5" />Abrir</Button>
                    </a>
                  )}
                  <ActionBtns onEdit={() => openEditReport(r)} onDelete={() => handleDeleteReport(r.id)} />
                </CardContent>
              </Card>
            ))}
          </div>
          {reports.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">Nenhum relatório</p>}
        </TabsContent>

        {/* HISTÓRICO */}
        <TabsContent value="history">
          <Card className="rounded-2xl border shadow-sm">
            <CardContent className="p-6">
              <h3 className="font-semibold text-foreground flex items-center gap-2 mb-5"><History className="h-4 w-4 text-primary" />Linha do Tempo</h3>
              <div className="relative pl-6 border-l-2 border-border space-y-4">
                {history.map(h => (
                  <div key={h.id} className="relative">
                    <div className="absolute -left-[25px] top-1 h-3 w-3 rounded-full bg-primary border-2 border-background" />
                    <div className="flex items-start justify-between gap-2 bg-muted/50 rounded-xl p-3">
                      <div>
                        <p className="text-sm font-medium">{h.action}</p>
                        <p className="text-xs text-muted-foreground">{new Date(h.date).toLocaleString("pt-BR")} • {h.user}</p>
                      </div>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive shrink-0" onClick={async () => {
                        try { await deleteHistory(h.id); toast.success("Registro excluído!"); await load(); } catch { toast.error("Erro ao excluir."); }
                      }}><Trash2 className="h-3 w-3" /></Button>
                    </div>
                  </div>
                ))}
              </div>
              {history.length === 0 && <p className="text-sm text-muted-foreground text-center py-6">Nenhum registro</p>}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* DIALOGS */}
      <Dialog open={showEditProfile} onOpenChange={setShowEditProfile}>
        <DialogContent><DialogHeader><DialogTitle>Editar Cliente</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Nome</Label><Input value={profileForm.name} onChange={e => setProfileForm(f => ({ ...f, name: e.target.value }))} /></div>
            <div><Label>Categoria</Label><Input value={profileForm.category} onChange={e => setProfileForm(f => ({ ...f, category: e.target.value }))} /></div>
            <div><Label>Cidade</Label><Input value={profileForm.city} onChange={e => setProfileForm(f => ({ ...f, city: e.target.value }))} /></div>
            <div><Label>Responsável</Label><Input value={profileForm.responsible} onChange={e => setProfileForm(f => ({ ...f, responsible: e.target.value }))} /></div>
          </div>
          <DialogFooter><Button onClick={handleEditProfile}>Salvar</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showPost} onOpenChange={setShowPost}>
        <DialogContent><DialogHeader><DialogTitle>{editingPostId ? "Editar Post" : "Novo Post"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>URL da imagem</Label><Input value={postForm.image_url} onChange={e => setPostForm(f => ({ ...f, image_url: e.target.value }))} /></div>
            <div><Label>Texto</Label><Textarea value={postForm.text} onChange={e => setPostForm(f => ({ ...f, text: e.target.value }))} /></div>
          </div>
          <DialogFooter><Button onClick={handleSavePost}>{editingPostId ? "Salvar" : "Criar"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showReport} onOpenChange={setShowReport}>
        <DialogContent><DialogHeader><DialogTitle>{editingReportId ? "Editar Relatório" : "Novo Relatório"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Link</Label><Input value={reportForm.link} onChange={e => setReportForm(f => ({ ...f, link: e.target.value }))} /></div>
            <div><Label>Comentário</Label><Textarea value={reportForm.comment} onChange={e => setReportForm(f => ({ ...f, comment: e.target.value }))} /></div>
            <div><Label>Data</Label><Input type="date" value={reportForm.date} onChange={e => setReportForm(f => ({ ...f, date: e.target.value }))} /></div>
          </div>
          <DialogFooter><Button onClick={handleSaveReport}>{editingReportId ? "Salvar" : "Adicionar"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showUpdate} onOpenChange={setShowUpdate}>
        <DialogContent><DialogHeader><DialogTitle>{editingUpdateId ? "Editar Atualização" : "Nova Atualização"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Descrição</Label><Textarea value={updateForm.description} onChange={e => setUpdateForm(f => ({ ...f, description: e.target.value }))} /></div>
            <div><Label>Responsável</Label><Input value={updateForm.responsible} onChange={e => setUpdateForm(f => ({ ...f, responsible: e.target.value }))} /></div>
          </div>
          <DialogFooter><Button onClick={handleSaveUpdate}>{editingUpdateId ? "Salvar" : "Registrar"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showTask} onOpenChange={setShowTask}>
        <DialogContent><DialogHeader><DialogTitle>{editingTaskId ? "Editar Tarefa" : "Nova Tarefa"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Título</Label><Input value={taskForm.title} onChange={e => setTaskForm(f => ({ ...f, title: e.target.value }))} /></div>
            <div><Label>Descrição</Label><Textarea value={taskForm.description} onChange={e => setTaskForm(f => ({ ...f, description: e.target.value }))} /></div>
            <div><Label>Responsável</Label><Input value={taskForm.responsible} onChange={e => setTaskForm(f => ({ ...f, responsible: e.target.value }))} /></div>
            <div><Label>Data</Label><Input type="date" value={taskForm.date} onChange={e => setTaskForm(f => ({ ...f, date: e.target.value }))} /></div>
            <div><Label>Prioridade</Label>
              <Select value={taskForm.priority} onValueChange={v => setTaskForm(f => ({ ...f, priority: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="low">Baixa</SelectItem><SelectItem value="medium">Média</SelectItem><SelectItem value="high">Alta</SelectItem></SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter><Button onClick={handleSaveTask}>{editingTaskId ? "Salvar" : "Criar"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!previewImage} onOpenChange={() => setPreviewImage(null)}>
        <DialogContent className="max-w-3xl p-2">
          {previewImage && <img src={previewImage} alt="Preview" className="w-full h-auto rounded-lg" />}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProfileDetail;
