import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { getProfiles, getPosts, addHistory } from "@/lib/data";
import type { Profile, Post } from "@/lib/data";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Search, ExternalLink, Send, CheckCircle2, Clock, AlertCircle,
  Image as ImageIcon, CalendarClock, Undo2, Wrench
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

const canUndo = (profile: Profile): boolean => !!profile.last_post_action_at;
const needsFix = (profile: Profile): boolean => !!profile.last_post_date && !profile.previous_post_date && !profile.last_post_action_at;

const STATUS_CONFIG = {
  em_dia: { label: "Em Dia", icon: CheckCircle2, badgeClass: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300", bg: "bg-emerald-50 dark:bg-emerald-950/30", border: "border-emerald-200 dark:border-emerald-900", iconColor: "text-emerald-500" },
  atrasado: { label: "Atrasados", icon: AlertCircle, badgeClass: "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300", bg: "bg-amber-50 dark:bg-amber-950/30", border: "border-amber-200 dark:border-amber-900", iconColor: "text-amber-500" },
  sem_postagem: { label: "Sem Postagem", icon: Clock, badgeClass: "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300", bg: "bg-red-50 dark:bg-red-950/30", border: "border-red-200 dark:border-red-900", iconColor: "text-red-500" },
} as const;

const POST_STATUS_LABELS: Record<string, { label: string; className: string }> = {
  pending: { label: "Pendente", className: "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300" },
  approved: { label: "Aprovado", className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300" },
  rejected: { label: "Rejeitado", className: "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300" },
  published: { label: "Publicado", className: "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300" },
};

const formatDate = (dateStr: string) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
};

const Postagens = () => {
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterPostStatus, setFilterPostStatus] = useState("all");
  const [filterContentStatus, setFilterContentStatus] = useState("all");

  const podePostarHoje = isDiaDePostagem();

  const load = useCallback(async () => {
    const [p, po] = await Promise.all([getProfiles(), getPosts()]);
    setProfiles(p.filter(pr => pr.status !== "archived"));
    setPosts(po);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const profilesWithPosts = useMemo(() => {
    const grouped = new Map<string, Post[]>();
    posts.forEach(post => {
      const existing = grouped.get(post.profile_id) || [];
      existing.push(post);
      grouped.set(post.profile_id, existing);
    });

    return profiles
      .map(profile => ({
        profile,
        posts: grouped.get(profile.id) || [],
        postStatus: getPostStatus(profile),
      }))
      .filter(item => {
        const matchSearch = !search || item.profile.name.toLowerCase().includes(search.toLowerCase());
        const matchPostStatus = filterPostStatus === "all" || item.postStatus === filterPostStatus;
        const matchContentStatus = filterContentStatus === "all" || item.posts.some(p => p.status === filterContentStatus);
        return matchSearch && matchPostStatus && (filterContentStatus === "all" || matchContentStatus);
      })
      .sort((a, b) => {
        const order: Record<PostStatus, number> = { sem_postagem: 0, atrasado: 1, em_dia: 2 };
        return order[a.postStatus] - order[b.postStatus];
      });
  }, [profiles, posts, search, filterPostStatus, filterContentStatus]);

  // Group by post status for sections
  const emDia = profilesWithPosts.filter(i => i.postStatus === "em_dia");
  const atrasados = profilesWithPosts.filter(i => i.postStatus === "atrasado");
  const semPostagem = profilesWithPosts.filter(i => i.postStatus === "sem_postagem");
  const perfisParaPostar = atrasados.length + semPostagem.length;

  const handleMarkPost = async (id: string) => {
    const profile = profiles.find(p => p.id === id);
    const now = new Date().toISOString();
    await (supabase as any).from("profiles").update({
      previous_post_date: profile?.last_post_date || null,
      last_post_date: now,
      last_post_action_at: now,
    }).eq("id", id);
    await addHistory(id, `Postagem marcada para "${profile?.name}"`);
    toast.success("Postagem marcada ✔️ (clique em desfazer se foi engano)");
    load();
  };

  const handleUndoPost = async (id: string) => {
    const profile = profiles.find(p => p.id === id);
    if (!profile || !canUndo(profile)) return;
    await (supabase as any).from("profiles").update({
      last_post_date: profile.previous_post_date || null,
      previous_post_date: null,
      last_post_action_at: null,
    }).eq("id", id);
    await addHistory(id, `Postagem desfeita para "${profile.name}"`);
    toast.success("Postagem desfeita.");
    load();
  };

  const handleFixPost = async (id: string) => {
    const profile = profiles.find(p => p.id === id);
    if (!profile) return;
    await (supabase as any).from("profiles").update({
      last_post_date: null,
      previous_post_date: null,
      last_post_action_at: null,
    }).eq("id", id);
    await addHistory(id, `Postagem corrigida para "${profile.name}"`);
    toast.success("Postagem corrigida. Cliente retornou para 'Sem postagem'.");
    load();
  };

  if (loading) return <div className="p-8 text-center text-muted-foreground">Carregando...</div>;

  const renderProfileCard = (profile: Profile, profilePosts: Post[], postStatus: PostStatus) => {
    const config = STATUS_CONFIG[postStatus];
    const Icon = config.icon;
    const lastPostDate = profile.last_post_date
      ? new Date(profile.last_post_date).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" })
      : "Nunca";

    return (
      <Card key={profile.id} className="rounded-2xl border shadow-sm hover:shadow-md transition-shadow">
        <CardContent className="p-5">
          {/* Profile header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Send className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0">
                <h3 className="font-semibold text-foreground truncate">{profile.name}</h3>
                <p className="text-xs text-muted-foreground">{profile.category} • {profile.city}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Badge className={`${config.badgeClass} text-[11px] px-2.5 py-1 rounded-full`}>
                <Icon className="h-3 w-3 mr-1" />
                {getPostBadgeLabel(profile)}
              </Badge>
              <Button size="sm" variant="outline" className="h-8 text-xs rounded-lg gap-1.5" onClick={() => navigate(`/profile/${profile.id}`)}>
                <ExternalLink className="h-3.5 w-3.5" /> Abrir
              </Button>
            </div>
          </div>

          {/* Post info & actions */}
          <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3 pl-[52px]">
            <span>Última postagem: <strong>{lastPostDate}</strong></span>
            <span>Frequência: <strong>{profile.post_frequency_days} dias</strong></span>
            <span>Postagens: <strong>{profilePosts.length}</strong></span>
          </div>

          {/* Post action buttons */}
          <div className="flex items-center gap-2 pl-[52px] mb-3 flex-wrap">
            {podePostarHoje ? (
              <Button size="sm" variant="outline" className="gap-1.5 h-8 text-xs rounded-lg" onClick={() => handleMarkPost(profile.id)}>
                <Send className="h-3.5 w-3.5" /> Marcar Postagem
              </Button>
            ) : (
              <Button size="sm" variant="outline" className="gap-1.5 h-8 text-xs rounded-lg opacity-50 cursor-not-allowed" disabled title={`Postagens apenas ${DIAS_NOMES}`}>
                <CalendarClock className="h-3.5 w-3.5" /> {DIAS_NOMES}
              </Button>
            )}
            {canUndo(profile) && (
              <Button size="sm" variant="outline" className="gap-1.5 h-8 text-xs rounded-lg border-amber-300 text-amber-700 hover:bg-amber-50 dark:border-amber-700 dark:text-amber-400 dark:hover:bg-amber-950/30" onClick={() => handleUndoPost(profile.id)}>
                <Undo2 className="h-3.5 w-3.5" /> Desfazer
              </Button>
            )}
            {needsFix(profile) && (
              <Button size="sm" variant="outline" className="gap-1.5 h-8 text-xs rounded-lg border-muted-foreground/30 text-muted-foreground hover:bg-muted" onClick={() => handleFixPost(profile.id)} title="Usar apenas se a postagem foi marcada antes da atualização do sistema">
                <Wrench className="h-3.5 w-3.5" /> Corrigir
              </Button>
            )}
          </div>

          {/* Recent posts */}
          {profilePosts.length > 0 ? (
            <div className="pl-[52px] space-y-2">
              {profilePosts.slice(0, 3).map(post => {
                const statusInfo = POST_STATUS_LABELS[post.status] || POST_STATUS_LABELS.pending;
                return (
                  <div key={post.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-muted/50 border border-border/50">
                    {post.image_url ? (
                      <img src={post.image_url} alt="" className="h-10 w-10 rounded-lg object-cover shrink-0" />
                    ) : (
                      <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                        <ImageIcon className="h-4 w-4 text-muted-foreground" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-foreground truncate">{post.text || "Sem texto"}</p>
                      <p className="text-[11px] text-muted-foreground">{formatDate(post.created_at)}</p>
                    </div>
                    <Badge className={`${statusInfo.className} text-[10px] px-2 py-0.5 rounded-full shrink-0`}>
                      {statusInfo.label}
                    </Badge>
                  </div>
                );
              })}
              {profilePosts.length > 3 && (
                <p className="text-[11px] text-muted-foreground pl-2">
                  + {profilePosts.length - 3} mais postagens
                </p>
              )}
            </div>
          ) : (
            <div className="pl-[52px] text-xs text-muted-foreground italic">
              Nenhuma postagem registrada
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  const renderSection = (statusKey: PostStatus, items: typeof profilesWithPosts) => {
    if (items.length === 0) return null;
    const config = STATUS_CONFIG[statusKey];
    const SectionIcon = config.icon;
    return (
      <div className={`rounded-2xl border ${config.border} ${config.bg} p-5`}>
        <div className="flex items-center gap-2 mb-4">
          <SectionIcon className={`h-5 w-5 ${config.iconColor}`} />
          <h2 className="font-semibold text-foreground text-lg">{config.label}</h2>
          <Badge variant="secondary" className="text-xs ml-1">{items.length}</Badge>
        </div>
        <div className="space-y-4">
          {items.map(({ profile, posts: pp, postStatus }) => renderProfileCard(profile, pp, postStatus))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 bg-muted/30 min-h-screen -m-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight" style={{ fontFamily: "Space Grotesk" }}>
          Postagens
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          {profilesWithPosts.length} perfis • {posts.length} postagens total
        </p>
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
          <Input placeholder="Buscar perfil..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 rounded-xl" />
        </div>
        <Select value={filterPostStatus} onValueChange={setFilterPostStatus}>
          <SelectTrigger className="w-[180px] rounded-xl"><SelectValue placeholder="Status postagem" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos status</SelectItem>
            <SelectItem value="em_dia">Em dia</SelectItem>
            <SelectItem value="atrasado">Atrasados</SelectItem>
            <SelectItem value="sem_postagem">Sem postagem</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterContentStatus} onValueChange={setFilterContentStatus}>
          <SelectTrigger className="w-[180px] rounded-xl"><SelectValue placeholder="Status conteúdo" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos conteúdos</SelectItem>
            <SelectItem value="pending">Pendente</SelectItem>
            <SelectItem value="approved">Aprovado</SelectItem>
            <SelectItem value="rejected">Rejeitado</SelectItem>
            <SelectItem value="published">Publicado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Post Status sections */}
      <div className="space-y-5">
        {renderSection("em_dia", emDia)}
        {renderSection("atrasado", atrasados)}
        {renderSection("sem_postagem", semPostagem)}

        {profilesWithPosts.length === 0 && (
          <p className="text-center text-sm text-muted-foreground py-12">Nenhum perfil encontrado</p>
        )}
      </div>
    </div>
  );
};

export default Postagens;
