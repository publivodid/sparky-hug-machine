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

type TableName =
  | "profiles"
  | "monthly_metrics"
  | "reviews"
  | "posts"
  | "reports"
  | "profile_updates"
  | "tasks"
  | "history";

const toError = (error: unknown) => {
  if (error && typeof error === "object" && "message" in error) {
    return new Error(String((error as { message?: unknown }).message ?? "Erro no backend"));
  }

  return new Error("Erro no backend");
};

const runQuery = async <T>(query: PromiseLike<{ data: T; error: unknown }>): Promise<T> => {
  const { data, error } = (await query) as { data: T; error: unknown };

  if (error) {
    throw toError(error);
  }

  return data;
};

const normalizeDateFields = <T extends Record<string, unknown>>(payload: T, dateKeys: string[] = ["date", "created_at"]): T => {
  const normalized = { ...payload };

  for (const key of dateKeys) {
    if (typeof normalized[key] === "string" && (normalized[key] as string).trim() === "") {
      delete normalized[key];
    }
  }

  return normalized;
};

const saveById = async <T>(
  table: TableName,
  payload: { id?: string } & Record<string, unknown>,
): Promise<T | null> => {
  const normalized = normalizeDateFields(payload);
  const { id, ...rest } = normalized;

  if (id) {
    return runQuery<T | null>(
      (supabase as any)
        .from(table)
        .update(rest)
        .eq("id", id)
        .select()
        .single() as PromiseLike<{ data: T | null; error: unknown }>,
    );
  }

  return runQuery<T | null>(
    (supabase as any)
      .from(table)
      .insert(rest)
      .select()
      .single() as PromiseLike<{ data: T | null; error: unknown }>,
  );
};

const removeById = async (table: TableName, id: string) => {
  await runQuery<unknown>(
    (supabase as any)
      .from(table)
      .delete()
      .eq("id", id) as PromiseLike<{ data: unknown; error: unknown }>,
  );
};

// === PROFILES ===
export async function getProfiles(): Promise<Profile[]> {
  const data = await runQuery<Profile[]>(
    supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false }) as PromiseLike<{ data: Profile[]; error: unknown }>,
  );

  return data || [];
}

export async function upsertProfile(profile: Partial<Profile> & { id?: string }): Promise<Profile | null> {
  return saveById<Profile>("profiles", profile as Profile);
}

export async function deleteProfile(id: string) {
  await removeById("profiles", id);
}

// === METRICS ===
export async function getMetrics(profileId?: string): Promise<MonthlyMetrics[]> {
  let q = supabase
    .from("monthly_metrics")
    .select("*")
    .order("year", { ascending: false })
    .order("month", { ascending: false });

  if (profileId) q = q.eq("profile_id", profileId);
  const data = await runQuery<MonthlyMetrics[]>(q as PromiseLike<{ data: MonthlyMetrics[]; error: unknown }>);

  return data || [];
}

export async function getLatestMetrics(profileId: string): Promise<MonthlyMetrics | undefined> {
  const data = await runQuery<MonthlyMetrics | null>(
    supabase
      .from("monthly_metrics")
      .select("*")
      .eq("profile_id", profileId)
      .order("year", { ascending: false })
      .order("month", { ascending: false })
      .limit(1)
      .maybeSingle() as PromiseLike<{ data: MonthlyMetrics | null; error: unknown }>,
  );

  return data || undefined;
}

export async function getPreviousMetrics(profileId: string): Promise<MonthlyMetrics | undefined> {
  const data = await runQuery<MonthlyMetrics | null>(
    supabase
      .from("monthly_metrics")
      .select("*")
      .eq("profile_id", profileId)
      .order("year", { ascending: false })
      .order("month", { ascending: false })
      .range(1, 1)
      .maybeSingle() as PromiseLike<{ data: MonthlyMetrics | null; error: unknown }>,
  );

  return data || undefined;
}

// === REVIEWS ===
export async function getReviews(profileId?: string): Promise<Review[]> {
  let q = supabase.from("reviews").select("*").order("date", { ascending: false });
  if (profileId) q = q.eq("profile_id", profileId);

  const data = await runQuery<Review[]>(q as PromiseLike<{ data: Review[]; error: unknown }>);
  return data || [];
}

// === POSTS ===
export async function getPosts(profileId?: string): Promise<Post[]> {
  let q = supabase.from("posts").select("*").order("created_at", { ascending: false });
  if (profileId) q = q.eq("profile_id", profileId);

  const data = await runQuery<Post[]>(q as PromiseLike<{ data: Post[]; error: unknown }>);
  return data || [];
}

export async function upsertPost(post: Partial<Post> & { id?: string }): Promise<Post | null> {
  return saveById<Post>("posts", post as Post);
}

export async function deletePost(id: string) {
  await removeById("posts", id);
}

// === REPORTS ===
export async function getReports(profileId?: string): Promise<Report[]> {
  let q = supabase.from("reports").select("*").order("date", { ascending: false });
  if (profileId) q = q.eq("profile_id", profileId);

  const data = await runQuery<Report[]>(q as PromiseLike<{ data: Report[]; error: unknown }>);
  return data || [];
}

export async function upsertReport(report: Partial<Report> & { id?: string }): Promise<Report | null> {
  const normalized = normalizeDateFields(report as Record<string, unknown>, ["date"]);
  return saveById<Report>("reports", normalized as Report);
}

export async function deleteReport(id: string) {
  await removeById("reports", id);
}

// === UPDATES ===
export async function getUpdates(profileId?: string): Promise<ProfileUpdate[]> {
  let q = supabase.from("profile_updates").select("*").order("date", { ascending: false });
  if (profileId) q = q.eq("profile_id", profileId);

  const data = await runQuery<ProfileUpdate[]>(q as PromiseLike<{ data: ProfileUpdate[]; error: unknown }>);
  return data || [];
}

export async function upsertUpdate(update: Partial<ProfileUpdate> & { id?: string }): Promise<ProfileUpdate | null> {
  return saveById<ProfileUpdate>("profile_updates", update as ProfileUpdate);
}

export async function deleteUpdate(id: string) {
  await removeById("profile_updates", id);
}

// === TASKS ===
export async function getTasks(profileId?: string): Promise<Task[]> {
  let q = supabase.from("tasks").select("*").order("date", { ascending: false });
  if (profileId) q = q.eq("profile_id", profileId);

  const data = await runQuery<Task[]>(q as PromiseLike<{ data: Task[]; error: unknown }>);
  return data || [];
}

export async function upsertTask(task: Partial<Task> & { id?: string }): Promise<Task | null> {
  const normalized = normalizeDateFields(task as Record<string, unknown>, ["date"]);
  return saveById<Task>("tasks", normalized as Task);
}

export async function deleteTask(id: string) {
  await removeById("tasks", id);
}

// === HISTORY ===
export async function getHistory(profileId?: string): Promise<HistoryEntry[]> {
  let q = supabase.from("history").select("*").order("date", { ascending: false });
  if (profileId) q = q.eq("profile_id", profileId);

  const data = await runQuery<HistoryEntry[]>(q as PromiseLike<{ data: HistoryEntry[]; error: unknown }>);
  return data || [];
}

export async function addHistory(profileId: string, action: string) {
  await runQuery<unknown>(
    supabase
      .from("history")
      .insert({ profile_id: profileId, action, user: "Equipe" }) as PromiseLike<{ data: unknown; error: unknown }>,
  );
}
