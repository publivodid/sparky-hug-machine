import { supabase } from "@/integrations/supabase/client";

export interface Profile {
  id: string;
  name: string;
  category: string;
  city: string;
  responsible: string;
  created_at: string;
  status: string;
}

export interface MonthlyMetrics {
  id: string;
  profile_id: string;
  month: number;
  year: number;
  average_rating: number;
  total_reviews: number;
  profile_views: number;
  phone_clicks: number;
  website_clicks: number;
  route_requests: number;
}

export interface Review {
  id: string;
  profile_id: string;
  author: string;
  rating: number;
  text: string;
  date: string;
  response?: string | null;
}

export interface Post {
  id: string;
  profile_id: string;
  image_url: string;
  text: string;
  status: string;
  client_comment?: string | null;
  created_at: string;
}

export interface Report {
  id: string;
  profile_id: string;
  pdf_url?: string | null;
  link?: string | null;
  comment: string;
  date: string;
}

export interface ProfileUpdate {
  id: string;
  profile_id: string;
  description: string;
  date: string;
  responsible: string;
}

export interface Task {
  id: string;
  profile_id: string;
  title: string;
  description: string;
  responsible: string;
  date: string;
  status: string;
}

export interface HistoryEntry {
  id: string;
  profile_id: string;
  action: string;
  date: string;
  user: string;
}

// === PROFILES ===
export async function getProfiles(): Promise<Profile[]> {
  const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
  return (data as Profile[]) || [];
}

export async function upsertProfile(profile: Partial<Profile> & { id?: string }): Promise<Profile | null> {
  const { data } = await supabase.from('profiles').upsert(profile as any).select().single();
  return data as Profile | null;
}

export async function deleteProfile(id: string) {
  await supabase.from('profiles').delete().eq('id', id);
}

// === METRICS ===
export async function getMetrics(profileId?: string): Promise<MonthlyMetrics[]> {
  let q = supabase.from('monthly_metrics').select('*').order('year', { ascending: false }).order('month', { ascending: false });
  if (profileId) q = q.eq('profile_id', profileId);
  const { data } = await q;
  return (data as MonthlyMetrics[]) || [];
}

export async function getLatestMetrics(profileId: string): Promise<MonthlyMetrics | undefined> {
  const { data } = await supabase.from('monthly_metrics').select('*')
    .eq('profile_id', profileId).order('year', { ascending: false }).order('month', { ascending: false }).limit(1).maybeSingle();
  return (data as MonthlyMetrics) || undefined;
}

export async function getPreviousMetrics(profileId: string): Promise<MonthlyMetrics | undefined> {
  const { data } = await supabase.from('monthly_metrics').select('*')
    .eq('profile_id', profileId).order('year', { ascending: false }).order('month', { ascending: false }).range(1, 1).maybeSingle();
  return (data as MonthlyMetrics) || undefined;
}

// === REVIEWS ===
export async function getReviews(profileId?: string): Promise<Review[]> {
  let q = supabase.from('reviews').select('*').order('date', { ascending: false });
  if (profileId) q = q.eq('profile_id', profileId);
  const { data } = await q;
  return (data as Review[]) || [];
}

// === POSTS ===
export async function getPosts(profileId?: string): Promise<Post[]> {
  let q = supabase.from('posts').select('*').order('created_at', { ascending: false });
  if (profileId) q = q.eq('profile_id', profileId);
  const { data } = await q;
  return (data as Post[]) || [];
}

export async function upsertPost(post: Partial<Post> & { id?: string }): Promise<Post | null> {
  const { data } = await supabase.from('posts').upsert(post as any).select().single();
  return data as Post | null;
}

export async function deletePost(id: string) {
  await supabase.from('posts').delete().eq('id', id);
}

// === REPORTS ===
export async function getReports(profileId?: string): Promise<Report[]> {
  let q = supabase.from('reports').select('*').order('date', { ascending: false });
  if (profileId) q = q.eq('profile_id', profileId);
  const { data } = await q;
  return (data as Report[]) || [];
}

export async function upsertReport(report: Partial<Report> & { id?: string }): Promise<Report | null> {
  const { data } = await supabase.from('reports').upsert(report as any).select().single();
  return data as Report | null;
}

export async function deleteReport(id: string) {
  await supabase.from('reports').delete().eq('id', id);
}

// === UPDATES ===
export async function getUpdates(profileId?: string): Promise<ProfileUpdate[]> {
  let q = supabase.from('profile_updates').select('*').order('date', { ascending: false });
  if (profileId) q = q.eq('profile_id', profileId);
  const { data } = await q;
  return (data as ProfileUpdate[]) || [];
}

export async function upsertUpdate(update: Partial<ProfileUpdate> & { id?: string }): Promise<ProfileUpdate | null> {
  const { data } = await supabase.from('profile_updates').upsert(update as any).select().single();
  return data as ProfileUpdate | null;
}

export async function deleteUpdate(id: string) {
  await supabase.from('profile_updates').delete().eq('id', id);
}

// === TASKS ===
export async function getTasks(profileId?: string): Promise<Task[]> {
  let q = supabase.from('tasks').select('*').order('date', { ascending: false });
  if (profileId) q = q.eq('profile_id', profileId);
  const { data } = await q;
  return (data as Task[]) || [];
}

export async function upsertTask(task: Partial<Task> & { id?: string }): Promise<Task | null> {
  const { data } = await supabase.from('tasks').upsert(task as any).select().single();
  return data as Task | null;
}

export async function deleteTask(id: string) {
  await supabase.from('tasks').delete().eq('id', id);
}

// === HISTORY ===
export async function getHistory(profileId?: string): Promise<HistoryEntry[]> {
  let q = supabase.from('history').select('*').order('date', { ascending: false });
  if (profileId) q = q.eq('profile_id', profileId);
  const { data } = await q;
  return (data as HistoryEntry[]) || [];
}

export async function addHistory(profileId: string, action: string) {
  await supabase.from('history').insert({ profile_id: profileId, action, user: 'Equipe' });
}
