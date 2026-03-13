import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getProfiles, setProfiles, addHistory, getTasks, setTasks } from "@/lib/data";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Plus, Search, MapPin, User, ExternalLink, MoreVertical, Trash2, Archive, ArchiveRestore } from "lucide-react";
import { toast } from "sonner";

const Profiles = () => {
  const navigate = useNavigate();
  const [profiles, setLocalProfiles] = useState(getProfiles());
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', category: '', city: '', responsible: '' });

  const activeProfiles = profiles.filter(p => p.status !== 'archived');
  const archivedProfiles = profiles.filter(p => p.status === 'archived');

  const displayed = (showArchived ? archivedProfiles : activeProfiles).filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.city.toLowerCase().includes(search.toLowerCase())
  );

  const handleAdd = () => {
    if (!form.name) return;
    const newProfile = { ...form, id: crypto.randomUUID(), createdAt: new Date().toISOString().split('T')[0], status: 'active' as const };
    const updated = [...profiles, newProfile];
    setProfiles(updated);
    setLocalProfiles(updated);
    addHistory(newProfile.id, `Perfil "${form.name}" criado`);
    setForm({ name: '', category: '', city: '', responsible: '' });
    setShowAdd(false);
    toast.success('Perfil criado!');
  };

  const handleArchive = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = profiles.map(p => p.id === id ? { ...p, status: 'archived' as const } : p);
    setProfiles(updated);
    setLocalProfiles(updated);
    addHistory(id, 'Perfil arquivado');
    toast.success('Perfil arquivado!');
  };

  const handleRestore = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = profiles.map(p => p.id === id ? { ...p, status: 'active' as const } : p);
    setProfiles(updated);
    setLocalProfiles(updated);
    addHistory(id, 'Perfil restaurado');
    toast.success('Perfil restaurado!');
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    const name = profiles.find(p => p.id === deleteTarget)?.name;
    const updated = profiles.filter(p => p.id !== deleteTarget);
    setProfiles(updated);
    setLocalProfiles(updated);
    addHistory(deleteTarget, `Perfil "${name}" excluído`);
    setDeleteTarget(null);
    toast.success('Perfil excluído!');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'Space Grotesk' }}>Perfis</h1>
          <p className="text-muted-foreground text-sm">{activeProfiles.length} ativos • {archivedProfiles.length} arquivados</p>
        </div>
        <div className="flex gap-2">
          <Button variant={showArchived ? "secondary" : "outline"} onClick={() => setShowArchived(!showArchived)} className="gap-2">
            <Archive className="h-4 w-4" /> {showArchived ? "Ver ativos" : "Arquivados"}
          </Button>
          <Button onClick={() => setShowAdd(true)} className="gap-2">
            <Plus className="h-4 w-4" /> Novo Perfil
          </Button>
        </div>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Buscar perfil..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {displayed.map(p => {
          const isArchived = p.status === 'archived';
          return (
            <Card key={p.id} className={`hover:shadow-md transition-shadow cursor-pointer group ${isArchived ? 'opacity-70' : ''}`} onClick={() => navigate(`/profile/${p.id}`)}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-foreground">{p.name}</h3>
                      {isArchived && <Badge variant="outline" className="text-xs">Arquivado</Badge>}
                    </div>
                    <Badge variant="secondary" className="mt-1 text-xs">{p.category}</Badge>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {isArchived ? (
                        <DropdownMenuItem onClick={e => handleRestore(p.id, e as unknown as React.MouseEvent)}>
                          <ArchiveRestore className="h-4 w-4 mr-2" /> Restaurar
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem onClick={e => { e.stopPropagation(); handleArchive(p.id, e as unknown as React.MouseEvent); }}>
                          <Archive className="h-4 w-4 mr-2" /> Arquivar
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem className="text-destructive" onClick={e => { e.stopPropagation(); setDeleteTarget(p.id); }}>
                        <Trash2 className="h-4 w-4 mr-2" /> Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5" /> {p.city}</div>
                  <div className="flex items-center gap-2"><User className="h-3.5 w-3.5" /> {p.responsible}</div>
                </div>
              </CardContent>
            </Card>
          );
        })}
        {displayed.length === 0 && (
          <p className="col-span-full text-center text-sm text-muted-foreground py-8">
            {showArchived ? "Nenhum perfil arquivado" : "Nenhum perfil encontrado"}
          </p>
        )}
      </div>

      {/* Add Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader><DialogTitle>Novo Perfil</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Nome da empresa</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
            <div><Label>Categoria</Label><Input value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} /></div>
            <div><Label>Cidade</Label><Input value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} /></div>
            <div><Label>Responsável</Label><Input value={form.responsible} onChange={e => setForm(f => ({ ...f, responsible: e.target.value }))} /></div>
          </div>
          <DialogFooter><Button onClick={handleAdd}>Adicionar</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir perfil</DialogTitle>
            <DialogDescription>Tem certeza que deseja excluir este perfil? Esta ação não pode ser desfeita.</DialogDescription>
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
