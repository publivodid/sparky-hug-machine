import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { getProfiles, upsertProfile, deleteProfile as deleteProfileApi, addHistory } from "@/lib/data";
import type { Profile } from "@/lib/data";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Plus, Search, MapPin, ChevronDown, ChevronRight,
  AlertTriangle, AlertCircle, CheckCircle2, Archive,
  ExternalLink, Pencil, Trash2, ArchiveRestore, Send, CalendarClock, Undo2
} from "lucide-react";
import { toast } from "sonner";

type PostStatus = "sem_postagem" | "atrasado" | "em_dia";

const DIAS_PERMITIDOS = [1, 3, 5]; // seg, qua, sex
const DIAS_NOMES = "seg, qua e sex";

const isDiaDePostagem = () => DIAS_PERMITIDOS.includes(new Date().getDay());

const getPostStatus = (profile: Profile): PostStatus => {
  if (!profile.last_post_date) return "sem_postagem";
  const dias = Math.floor((Date.now() - new Date(profile.last_post_date).getTime()) / (1000 * 60 * 60 * 24));
  return dias > (profile.post_frequency_days || 7) ? "atrasado" : "em_dia";
};

const getPostBadgeLabel = (profile: Profile): string => {
  const status = getPostStatus(profile);
  if (status === "sem_postagem") return "Sem postagem";
  if (status === "em_dia") {
    const dias = Math.floor((Date.now() - new Date(profile.last_post_date!).getTime()) / (1000 * 60 * 60 * 24));
    return dias === 0 ? "Postado hoje" : "Em dia";
  }
  const dias = Math.floor((Date.now() - new Date(profile.last_post_date!).getTime()) / (1000 * 60 * 60 * 24));
  return `Atrasado há ${dias} dias`;
};

const podePostarHoje = isDiaDePostagem();

const POST_STATUS_CONFIG_BASE = {
  em_dia: {
    label: "Em Dia",
    icon: CheckCircle2,
    bg: "bg-emerald-50 dark:bg-emerald-950/30",
    border: "border-emerald-200 dark:border-emerald-900",
    iconColor: "text-emerald-500",
    badgeClass: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300",
  },
  atrasado: {
    label: "Atrasados",
    icon: AlertCircle,
    bg: podePostarHoje ? "bg-orange-50 dark:bg-orange-950/40" : "bg-amber-50 dark:bg-amber-950/30",
    border: podePostarHoje ? "border-orange-300 dark:border-orange-800" : "border-amber-200 dark:border-amber-900",
    iconColor: podePostarHoje ? "text-orange-600" : "text-amber-500",
    badgeClass: podePostarHoje
      ? "bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300"
      : "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300",
  },
  sem_postagem: {
    label: "Sem Postagem",
    icon: AlertTriangle,
    bg: "bg-red-50 dark:bg-red-950/30",
    border: "border-red-200 dark:border-red-900",
    iconColor: "text-red-500",
    badgeClass: "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300",
  },
} as const;

const PRIORITY_BADGES: Record<string, { label: string; className: string }> = {
  high: { label: "Alta", className: "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300" },
  medium: { label: "Média", className: "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300" },
  low: { label: "Baixa", className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300" },
};

const STATUS_BADGES: Record<string, { label: string; className: string }> = {
  active: { label: "Ativo", className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300" },
  attention: { label: "Atenção", className: "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300" },
  problem: { label: "Problema", className: "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300" },
  archived: { label: "Arquivado", className: "bg-muted text-muted-foreground" },
};

const getStatusBadge = (status: string) => STATUS_BADGES[status] || STATUS_BADGES.active;

interface ClientCardProps {
  profile: Profile;
  onOpen: () => void;
  onEdit: () => void;
  onArchive: () => void;
  onRestore: () => void;
  onDelete: () => void;
  onMarkPost: () => void;
  onUndoPost: () => void;
}

const canUndo = (profile: Profile): boolean => {
  if (!profile.previous_post_date) return false;
  if (!profile.last_post_action_at) return false;
  const diff = (Date.now() - new Date(profile.last_post_action_at).getTime()) / 60000;
  return diff < 5;
};

const ClientCard = ({ profile, onOpen, onEdit, onArchive, onRestore, onDelete, onMarkPost, onUndoPost }: ClientCardProps) => {
  const isArchived = profile.status === "archived";
  const badge = getStatusBadge(profile.status);
  const postLabel = getPostBadgeLabel(profile);
  const postStatus = getPostStatus(profile);
  const postConfig = POST_STATUS_CONFIG_BASE[postStatus];
  const priorityBadge = PRIORITY_BADGES[profile.priority] || PRIORITY_BADGES.medium;

  return (
    <Card className="bg-card border rounded-2xl shadow-sm hover:shadow-lg hover:scale-[1.02] transition-all duration-200 group">
      <CardContent className="p-5 flex flex-col gap-3">
        <div className="flex items-start justify-between">
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-foreground text-base truncate">{profile.name}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">{profile.category}</p>
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0 ml-2">
            <Badge className={`${badge.className} text-[10px] font-medium px-2 py-0.5 rounded-full`}>
              {badge.label}
            </Badge>
            <Badge className={`${priorityBadge.className} text-[10px] font-medium px-2 py-0.5 rounded-full`}>
              {priorityBadge.label}
            </Badge>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <MapPin className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{profile.city || "—"}</span>
        </div>

        {/* Post status badge */}
        <Badge className={`${postConfig.badgeClass} text-[11px] font-medium px-2.5 py-1 rounded-full w-fit`}>
          {postLabel}
        </Badge>

        <div className="flex items-center gap-2 pt-1 border-t border-border/50 flex-wrap">
          <Button size="sm" className="flex-1 gap-1.5 h-8 text-xs rounded-lg" onClick={onOpen}>
            <ExternalLink className="h-3.5 w-3.5" /> Abrir
          </Button>
          {podePostarHoje ? (
            <Button size="sm" variant="outline" className="flex-1 gap-1.5 h-8 text-xs rounded-lg" onClick={onMarkPost} title="Marcar Postagem">
              <Send className="h-3.5 w-3.5" /> Postagem
            </Button>
          ) : (
            <Button size="sm" variant="outline" className="flex-1 gap-1.5 h-8 text-xs rounded-lg opacity-50 cursor-not-allowed" disabled title={`Postagens apenas ${DIAS_NOMES}`}>
              <CalendarClock className="h-3.5 w-3.5" /> {DIAS_NOMES}
            </Button>
          )}
          {canUndo(profile) && (
            <Button size="sm" variant="outline" className="gap-1.5 h-8 text-xs rounded-lg border-amber-300 text-amber-700 hover:bg-amber-50 dark:border-amber-700 dark:text-amber-400 dark:hover:bg-amber-950/30" onClick={onUndoPost} title="Desfazer postagem">
              <Undo2 className="h-3.5 w-3.5" /> Desfazer
            </Button>
          )}
          <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={onEdit} title="Editar">
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          {isArchived ? (
            <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={onRestore} title="Restaurar">
              <ArchiveRestore className="h-3.5 w-3.5" />
            </Button>
          ) : (
            <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={onArchive} title="Arquivar">
              <Archive className="h-3.5 w-3.5" />
            </Button>
          )}
          <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-destructive hover:text-destructive" onClick={onDelete} title="Excluir">
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

interface PostStatusSectionProps {
  statusKey: PostStatus;
  profiles: Profile[];
  onOpen: (id: string) => void;
  onEdit: (p: Profile) => void;
  onArchive: (id: string) => void;
  onRestore: (id: string) => void;
  onDelete: (id: string) => void;
  onMarkPost: (id: string) => void;
  onUndoPost: (id: string) => void;
}

const PostStatusSection = ({ statusKey, profiles, onOpen, onEdit, onArchive, onRestore, onDelete, onMarkPost, onUndoPost }: PostStatusSectionProps) => {
  const config = POST_STATUS_CONFIG_BASE[statusKey];
  const Icon = config.icon;

  if (profiles.length === 0) return null;

  return (
    <div className={`rounded-2xl border ${config.border} ${config.bg} p-5`}>
      <div className="flex items-center gap-2 mb-4">
        <Icon className={`h-5 w-5 ${config.iconColor}`} />
        <h2 className="font-semibold text-foreground text-lg">{config.label}</h2>
        <Badge variant="secondary" className="text-xs ml-1">{profiles.length}</Badge>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {profiles.map(p => (
          <ClientCard
            key={p.id}
            profile={p}
            onOpen={() => onOpen(p.id)}
            onEdit={() => onEdit(p)}
            onArchive={() => onArchive(p.id)}
            onRestore={() => onRestore(p.id)}
            onDelete={() => onDelete(p.id)}
            onMarkPost={() => onMarkPost(p.id)}
            onUndoPost={() => onUndoPost(p.id)}
          />
        ))}
      </div>
    </div>
  );
};

const Profiles = () => {
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterCity, setFilterCity] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPostStatus, setFilterPostStatus] = useState("all");
  const [showAdd, setShowAdd] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [editTarget, setEditTarget] = useState<string | null>(null);
  const [archivedOpen, setArchivedOpen] = useState(false);
  const [form, setForm] = useState({ name: "", category: "", city: "", responsible: "", priority: "medium", status: "active", post_frequency_days: "7" });

  const load = useCallback(async () => {
    const p = await getProfiles();
    setProfiles(p);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const cities = useMemo(() => [...new Set(profiles.map(p => p.city).filter(Boolean))].sort(), [profiles]);

  const filtered = useMemo(() => {
    return profiles.filter(p => {
      const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.city.toLowerCase().includes(search.toLowerCase());
      const matchCity = filterCity === "all" || p.city === filterCity;
      const matchStatus = filterStatus === "all" || p.status === filterStatus;
      const matchPostStatus = filterPostStatus === "all" || getPostStatus(p) === filterPostStatus;
      return matchSearch && matchCity && matchStatus && matchPostStatus;
    });
  }, [profiles, search, filterCity, filterStatus, filterPostStatus]);

  const activeFiltered = filtered.filter(p => p.status !== "archived");
  const archivedFiltered = filtered.filter(p => p.status === "archived");

  // Nova ordem: Em dia → Atrasados → Sem postagem
  const emDia = activeFiltered.filter(p => getPostStatus(p) === "em_dia");
  const atrasados = activeFiltered.filter(p => getPostStatus(p) === "atrasado");
  const semPostagem = activeFiltered.filter(p => getPostStatus(p) === "sem_postagem");

  // Contador de perfis para postar hoje (atrasados + sem postagem)
  const perfisParaPostar = atrasados.length + semPostagem.length;

  const resetForm = () => setForm({ name: "", category: "", city: "", responsible: "", priority: "medium", status: "active", post_frequency_days: "7" });

  const handleAdd = async () => {
    if (!form.name) return;
    const result = await upsertProfile({
      name: form.name, category: form.category, city: form.city, responsible: form.responsible,
      priority: form.priority, status: form.status,
    });
    if (result) {
      await (supabase as any).from("profiles").update({ post_frequency_days: parseInt(form.post_frequency_days) || 7 }).eq("id", result.id);
      await addHistory(result.id, `Perfil "${form.name}" criado`);
    }
    resetForm();
    setShowAdd(false);
    toast.success("Perfil criado!");
    load();
  };

  const openEdit = (p: Profile) => {
    setForm({
      name: p.name, category: p.category, city: p.city, responsible: p.responsible,
      priority: p.priority || "medium", status: p.status,
      post_frequency_days: String(p.post_frequency_days || 7),
    });
    setEditTarget(p.id);
  };

  const handleEdit = async () => {
    if (!editTarget || !form.name) return;
    await upsertProfile({
      id: editTarget, name: form.name, category: form.category, city: form.city,
      responsible: form.responsible, priority: form.priority, status: form.status,
    });
    await (supabase as any).from("profiles").update({ post_frequency_days: parseInt(form.post_frequency_days) || 7 }).eq("id", editTarget);
    await addHistory(editTarget, "Perfil editado");
    setEditTarget(null);
    resetForm();
    toast.success("Perfil atualizado!");
    load();
  };

  const handleMarkPost = async (id: string) => {
    const profile = profiles.find(p => p.id === id);
    const now = new Date().toISOString();
    await (supabase as any).from("profiles").update({
      previous_post_date: profile?.last_post_date || null,
      last_post_date: now,
      last_post_action_at: now,
    }).eq("id", id);
    const name = profile?.name;
    await addHistory(id, `Postagem marcada para "${name}"`);
    toast.success("Postagem marcada ✔️ (clique em desfazer se foi engano)");
    load();
  };

  const handleUndoPost = async (id: string) => {
    const profile = profiles.find(p => p.id === id);
    if (!profile?.previous_post_date) return;
    if (!canUndo(profile)) {
      toast.error("O tempo para desfazer expirou (5 min).");
      return;
    }
    await (supabase as any).from("profiles").update({
      last_post_date: profile.previous_post_date,
      previous_post_date: null,
      last_post_action_at: null,
    }).eq("id", id);
    await addHistory(id, `Postagem desfeita para "${profile.name}"`);
    toast.success("Postagem desfeita.");
    load();
  };

  const handleArchive = async (id: string) => {
    await upsertProfile({ id, status: "archived" });
    await addHistory(id, "Perfil arquivado");
    toast.success("Perfil arquivado!");
    load();
  };

  const handleRestore = async (id: string) => {
    await upsertProfile({ id, status: "active" });
    await addHistory(id, "Perfil restaurado");
    toast.success("Perfil restaurado!");
    load();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const name = profiles.find(p => p.id === deleteTarget)?.name;
    await addHistory(deleteTarget, `Perfil "${name}" excluído`);
    await deleteProfileApi(deleteTarget);
    setDeleteTarget(null);
    toast.success("Perfil excluído!");
    load();
  };

  if (loading) return <div className="p-8 text-center text-muted-foreground">Carregando...</div>;

  const formFields = (
    <div className="space-y-4">
      <div><Label>Nome da empresa</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
      <div><Label>Categoria</Label><Input value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} /></div>
      <div><Label>Cidade</Label><Input value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} /></div>
      <div><Label>Responsável</Label><Input value={form.responsible} onChange={e => setForm(f => ({ ...f, responsible: e.target.value }))} /></div>
      <div>
        <Label>Prioridade</Label>
        <Select value={form.priority} onValueChange={v => setForm(f => ({ ...f, priority: v }))}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="high">Alta</SelectItem>
            <SelectItem value="medium">Média</SelectItem>
            <SelectItem value="low">Baixa</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Frequência de postagem (dias)</Label>
        <Input type="number" min="1" value={form.post_frequency_days} onChange={e => setForm(f => ({ ...f, post_frequency_days: e.target.value }))} />
      </div>
      <div>
        <Label>Status</Label>
        <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Ativo</SelectItem>
            <SelectItem value="attention">Atenção</SelectItem>
            <SelectItem value="problem">Problema</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 bg-muted/30 min-h-screen -m-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ fontFamily: "Space Grotesk" }}>
            Gestão de Clientes
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {activeFiltered.length} ativos • {archivedFiltered.length} arquivados
          </p>
        </div>
        <Button onClick={() => { resetForm(); setShowAdd(true); }} className="gap-2 rounded-xl">
          <Plus className="h-4 w-4" /> Novo Cliente
        </Button>
      </div>

      {/* Posting day banner */}
      {podePostarHoje && perfisParaPostar > 0 && (
        <div className="rounded-xl border border-orange-300 bg-orange-50 dark:bg-orange-950/30 dark:border-orange-800 p-4 flex items-center gap-3">
          <Send className="h-5 w-5 text-orange-600 shrink-0" />
          <p className="text-sm font-medium text-orange-800 dark:text-orange-300">
            Você tem <strong>{perfisParaPostar} {perfisParaPostar === 1 ? "perfil" : "perfis"}</strong> para postar hoje
          </p>
        </div>
      )}

      {!podePostarHoje && (
        <div className="rounded-xl border border-border bg-muted/50 p-3 flex items-center gap-3">
          <CalendarClock className="h-4 w-4 text-muted-foreground shrink-0" />
          <p className="text-xs text-muted-foreground">
            Hoje não é dia de postagem. Postagens acontecem às <strong>{DIAS_NOMES}</strong>.
          </p>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar cliente..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 rounded-xl" />
        </div>
        <Select value={filterCity} onValueChange={setFilterCity}>
          <SelectTrigger className="w-[160px] rounded-xl"><SelectValue placeholder="Cidade" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas cidades</SelectItem>
            {cities.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[140px] rounded-xl"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos status</SelectItem>
            <SelectItem value="active">Ativo</SelectItem>
            <SelectItem value="attention">Atenção</SelectItem>
            <SelectItem value="problem">Problema</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterPostStatus} onValueChange={setFilterPostStatus}>
          <SelectTrigger className="w-[160px] rounded-xl"><SelectValue placeholder="Postagem" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="em_dia">Em dia</SelectItem>
            <SelectItem value="atrasado">Atrasados</SelectItem>
            <SelectItem value="sem_postagem">Sem postagem</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Post Status sections — order: Em dia → Atrasados → Sem postagem */}
      <div className="space-y-5">
        <PostStatusSection statusKey="em_dia" profiles={emDia} onOpen={id => navigate(`/profile/${id}`)} onEdit={openEdit} onArchive={handleArchive} onRestore={handleRestore} onDelete={setDeleteTarget} onMarkPost={handleMarkPost} onUndoPost={handleUndoPost} />
        <PostStatusSection statusKey="atrasado" profiles={atrasados} onOpen={id => navigate(`/profile/${id}`)} onEdit={openEdit} onArchive={handleArchive} onRestore={handleRestore} onDelete={setDeleteTarget} onMarkPost={handleMarkPost} onUndoPost={handleUndoPost} />
        <PostStatusSection statusKey="sem_postagem" profiles={semPostagem} onOpen={id => navigate(`/profile/${id}`)} onEdit={openEdit} onArchive={handleArchive} onRestore={handleRestore} onDelete={setDeleteTarget} onMarkPost={handleMarkPost} onUndoPost={handleUndoPost} />

        {/* Archived */}
        {archivedFiltered.length > 0 && (
          <Collapsible open={archivedOpen} onOpenChange={setArchivedOpen}>
            <CollapsibleTrigger className="flex items-center gap-2 w-full text-left rounded-xl border border-border bg-muted/50 p-4 hover:bg-muted transition-colors">
              {archivedOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              <Archive className="h-5 w-5 text-muted-foreground" />
              <span className="font-semibold text-foreground">Arquivados</span>
              <Badge variant="secondary" className="text-xs ml-1">{archivedFiltered.length}</Badge>
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {archivedFiltered.map(p => (
                  <ClientCard
                    key={p.id}
                    profile={p}
                    onOpen={() => navigate(`/profile/${p.id}`)}
                    onEdit={() => openEdit(p)}
                    onArchive={() => handleArchive(p.id)}
                    onRestore={() => handleRestore(p.id)}
                    onDelete={() => setDeleteTarget(p.id)}
                    onMarkPost={() => handleMarkPost(p.id)}
                    onUndoPost={() => handleUndoPost(p.id)}
                  />
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}

        {activeFiltered.length === 0 && archivedFiltered.length === 0 && (
          <p className="text-center text-sm text-muted-foreground py-12">Nenhum cliente encontrado</p>
        )}
      </div>

      {/* Add Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader><DialogTitle>Novo Cliente</DialogTitle></DialogHeader>
          {formFields}
          <DialogFooter><Button onClick={handleAdd}>Adicionar</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editTarget} onOpenChange={() => setEditTarget(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Editar Cliente</DialogTitle></DialogHeader>
          {formFields}
          <DialogFooter><Button onClick={handleEdit}>Salvar</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir cliente</DialogTitle>
            <DialogDescription>Tem certeza que deseja excluir este cliente? Esta ação não pode ser desfeita.</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDelete}>Excluir</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Profiles;
