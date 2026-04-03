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
  Archive, ExternalLink, Pencil, Trash2, ArchiveRestore
} from "lucide-react";
import { toast } from "sonner";

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
}

const ClientCard = ({ profile, onOpen, onEdit, onArchive, onRestore, onDelete }: ClientCardProps) => {
  const isArchived = profile.status === "archived";
  const badge = getStatusBadge(profile.status);
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

        <div className="flex items-center gap-2 flex-wrap">
          <Badge className={`${profile.automation_active ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300" : "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300"} text-[11px] font-medium px-2.5 py-1 rounded-full w-fit`}>
            Automação: {profile.automation_active ? "Sim" : "Não"}
          </Badge>
        </div>

        <div className="flex items-center gap-2 pt-1 border-t border-border/50 flex-wrap">
          <Button size="sm" className="flex-1 gap-1.5 h-8 text-xs rounded-lg" onClick={onOpen}>
            <ExternalLink className="h-3.5 w-3.5" /> Abrir
          </Button>
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

const Profiles = () => {
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterCity, setFilterCity] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");
  const [filterUpdated, setFilterUpdated] = useState("all");
  const [showAdd, setShowAdd] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [editTarget, setEditTarget] = useState<string | null>(null);
  const [archivedOpen, setArchivedOpen] = useState(false);
  const [form, setForm] = useState({ name: "", category: "", city: "", responsible: "", priority: "medium", status: "active", automation_active: "no" });

  const load = useCallback(async () => {
    const p = await getProfiles();
    setProfiles(p);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const cities = useMemo(() => [...new Set(profiles.map(p => p.city).filter(Boolean))].sort(), [profiles]);

  const filtered = useMemo(() => {
    const now = Date.now();
    return profiles.filter(p => {
      const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.city.toLowerCase().includes(search.toLowerCase());
      const matchCity = filterCity === "all" || p.city === filterCity;
      const matchStatus = filterStatus === "all" || p.status === filterStatus;
      const matchPriority = filterPriority === "all" || p.priority === filterPriority;
      let matchUpdated = true;
      if (filterUpdated !== "all") {
        const lastDate = p.last_post_action_at || p.last_post_date || p.created_at;
        const diff = now - new Date(lastDate).getTime();
        const oneDay = 1000 * 60 * 60 * 24;
        if (filterUpdated === "recent") matchUpdated = diff <= 3 * oneDay;
        else if (filterUpdated === "week") matchUpdated = diff <= 7 * oneDay;
        else if (filterUpdated === "month") matchUpdated = diff <= 30 * oneDay;
      }
      return matchSearch && matchCity && matchStatus && matchPriority && matchUpdated;
    });
  }, [profiles, search, filterCity, filterStatus, filterPriority, filterUpdated]);

  const activeFiltered = filtered.filter(p => p.status !== "archived");
  const archivedFiltered = filtered.filter(p => p.status === "archived");

  const resetForm = () => setForm({ name: "", category: "", city: "", responsible: "", priority: "medium", status: "active", automation_active: "no" });

  const handleAdd = async () => {
    if (!form.name) return;
    const result = await upsertProfile({
      name: form.name, category: form.category, city: form.city, responsible: form.responsible,
      priority: form.priority, status: form.status,
    });
    if (result) {
      await (supabase as any).from("profiles").update({ automation_active: form.automation_active === "yes" }).eq("id", result.id);
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
      automation_active: p.automation_active ? "yes" : "no",
    });
    setEditTarget(p.id);
  };

  const handleEdit = async () => {
    if (!editTarget || !form.name) return;
    await upsertProfile({
      id: editTarget, name: form.name, category: form.category, city: form.city,
      responsible: form.responsible, priority: form.priority, status: form.status,
    });
    await (supabase as any).from("profiles").update({ automation_active: form.automation_active === "yes" }).eq("id", editTarget);
    await addHistory(editTarget, "Perfil editado");
    setEditTarget(null);
    resetForm();
    toast.success("Perfil atualizado!");
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
        <Label>Automação Ativa</Label>
        <Select value={form.automation_active} onValueChange={v => setForm(f => ({ ...f, automation_active: v }))}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="yes">Sim</SelectItem>
            <SelectItem value="no">Não</SelectItem>
          </SelectContent>
        </Select>
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
        <Select value={filterPriority} onValueChange={setFilterPriority}>
          <SelectTrigger className="w-[140px] rounded-xl"><SelectValue placeholder="Prioridade" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="high">Alta</SelectItem>
            <SelectItem value="medium">Média</SelectItem>
            <SelectItem value="low">Baixa</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterUpdated} onValueChange={setFilterUpdated}>
          <SelectTrigger className="w-[160px] rounded-xl"><SelectValue placeholder="Atualizado" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="recent">Recentemente</SelectItem>
            <SelectItem value="week">Esta semana</SelectItem>
            <SelectItem value="month">Este mês</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Client cards */}
      <div className="space-y-5">
        {activeFiltered.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {activeFiltered.map(p => (
              <ClientCard
                key={p.id}
                profile={p}
                onOpen={() => navigate(`/profile/${p.id}`)}
                onEdit={() => openEdit(p)}
                onArchive={() => handleArchive(p.id)}
                onRestore={() => handleRestore(p.id)}
                onDelete={() => setDeleteTarget(p.id)}
              />
            ))}
          </div>
        )}

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
