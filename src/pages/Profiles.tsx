import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getProfiles, setProfiles, getLatestMetrics, addHistory } from "@/lib/data";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, Search, MapPin, Star, User, ExternalLink } from "lucide-react";

const Profiles = () => {
  const navigate = useNavigate();
  const [profiles, setLocalProfiles] = useState(getProfiles());
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: '', category: '', city: '', responsible: '' });

  const filtered = profiles.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.city.toLowerCase().includes(search.toLowerCase())
  );

  const handleAdd = () => {
    if (!form.name) return;
    const newProfile = { ...form, id: crypto.randomUUID(), createdAt: new Date().toISOString().split('T')[0] };
    const updated = [...profiles, newProfile];
    setProfiles(updated);
    setLocalProfiles(updated);
    addHistory(newProfile.id, `Perfil "${form.name}" criado`);
    setForm({ name: '', category: '', city: '', responsible: '' });
    setShowAdd(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'Space Grotesk' }}>Perfis</h1>
          <p className="text-muted-foreground text-sm">{profiles.length} perfis cadastrados</p>
        </div>
        <Button onClick={() => setShowAdd(true)} className="gap-2">
          <Plus className="h-4 w-4" /> Novo Perfil
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Buscar perfil..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map(p => {
          const m = getLatestMetrics(p.id);
          return (
            <Card key={p.id} className="hover:shadow-md transition-shadow cursor-pointer group" onClick={() => navigate(`/profile/${p.id}`)}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-foreground">{p.name}</h3>
                    <Badge variant="secondary" className="mt-1 text-xs">{p.category}</Badge>
                  </div>
                  <ExternalLink className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5" /> {p.city}</div>
                  <div className="flex items-center gap-2"><Star className="h-3.5 w-3.5" /> {m?.averageRating?.toFixed(1) || '—'} ({m?.totalReviews || 0} avaliações)</div>
                  <div className="flex items-center gap-2"><User className="h-3.5 w-3.5" /> {p.responsible}</div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

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
    </div>
  );
};

export default Profiles;
