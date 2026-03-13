export interface Profile {
  id: string;
  name: string;
  category: string;
  city: string;
  responsible: string;
  createdAt: string;
}

export interface MonthlyMetrics {
  id: string;
  profileId: string;
  month: number;
  year: number;
  averageRating: number;
  totalReviews: number;
  profileViews: number;
  phoneClicks: number;
  websiteClicks: number;
  routeRequests: number;
}

export interface Review {
  id: string;
  profileId: string;
  author: string;
  rating: number;
  text: string;
  date: string;
  response?: string;
}

export interface Post {
  id: string;
  profileId: string;
  imageUrl: string;
  text: string;
  status: 'pending' | 'approved' | 'rejected';
  clientComment?: string;
  createdAt: string;
}

export interface Report {
  id: string;
  profileId: string;
  pdfUrl?: string;
  link?: string;
  comment: string;
  date: string;
}

export interface ProfileUpdate {
  id: string;
  profileId: string;
  description: string;
  date: string;
  responsible: string;
}

export interface Task {
  id: string;
  profileId: string;
  title: string;
  description: string;
  responsible: string;
  date: string;
  status: 'pending' | 'in_progress' | 'completed';
}

export interface HistoryEntry {
  id: string;
  profileId: string;
  action: string;
  date: string;
  user: string;
}

const genId = () => crypto.randomUUID();

function getStore<T>(key: string, fallback: T[]): T[] {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch { return fallback; }
}

function setStore<T>(key: string, data: T[]) {
  localStorage.setItem(key, JSON.stringify(data));
}

// Seed data
const seedProfiles: Profile[] = [
  { id: '1', name: 'Clínica Saúde Viva', category: 'Saúde', city: 'São Paulo', responsible: 'Ana Silva', createdAt: '2024-01-15' },
  { id: '2', name: 'Restaurante Sabor & Arte', category: 'Alimentação', city: 'Rio de Janeiro', responsible: 'Carlos Lima', createdAt: '2024-02-10' },
  { id: '3', name: 'Auto Center Premium', category: 'Automotivo', city: 'Belo Horizonte', responsible: 'Maria Santos', createdAt: '2024-03-05' },
  { id: '4', name: 'Pet Shop Amigo Fiel', category: 'Pet', city: 'Curitiba', responsible: 'João Costa', createdAt: '2024-04-20' },
  { id: '5', name: 'Academia Flex Fitness', category: 'Esportes', city: 'Brasília', responsible: 'Ana Silva', createdAt: '2024-05-01' },
];

const seedMetrics: MonthlyMetrics[] = [
  { id: '1', profileId: '1', month: 2, year: 2026, averageRating: 4.8, totalReviews: 142, profileViews: 3200, phoneClicks: 85, websiteClicks: 210, routeRequests: 95 },
  { id: '2', profileId: '1', month: 1, year: 2026, averageRating: 4.7, totalReviews: 130, profileViews: 2800, phoneClicks: 72, websiteClicks: 180, routeRequests: 80 },
  { id: '3', profileId: '2', month: 2, year: 2026, averageRating: 4.5, totalReviews: 230, profileViews: 5100, phoneClicks: 150, websiteClicks: 320, routeRequests: 200 },
  { id: '4', profileId: '2', month: 1, year: 2026, averageRating: 4.4, totalReviews: 210, profileViews: 4600, phoneClicks: 130, websiteClicks: 280, routeRequests: 170 },
  { id: '5', profileId: '3', month: 2, year: 2026, averageRating: 4.2, totalReviews: 89, profileViews: 1800, phoneClicks: 45, websiteClicks: 95, routeRequests: 120 },
  { id: '6', profileId: '3', month: 1, year: 2026, averageRating: 4.1, totalReviews: 80, profileViews: 1500, phoneClicks: 38, websiteClicks: 80, routeRequests: 100 },
  { id: '7', profileId: '4', month: 2, year: 2026, averageRating: 4.9, totalReviews: 310, profileViews: 4200, phoneClicks: 110, websiteClicks: 280, routeRequests: 150 },
  { id: '8', profileId: '4', month: 1, year: 2026, averageRating: 4.8, totalReviews: 290, profileViews: 3800, phoneClicks: 95, websiteClicks: 250, routeRequests: 130 },
  { id: '9', profileId: '5', month: 2, year: 2026, averageRating: 4.6, totalReviews: 175, profileViews: 2900, phoneClicks: 65, websiteClicks: 190, routeRequests: 85 },
  { id: '10', profileId: '5', month: 1, year: 2026, averageRating: 4.5, totalReviews: 160, profileViews: 2500, phoneClicks: 55, websiteClicks: 160, routeRequests: 70 },
];

const seedTasks: Task[] = [
  { id: '1', profileId: '1', title: 'Atualizar fotos do perfil', description: 'Trocar fotos antigas por novas do consultório', responsible: 'Ana Silva', date: '2026-03-15', status: 'pending' },
  { id: '2', profileId: '2', title: 'Responder avaliações pendentes', description: 'Responder últimas 5 avaliações negativas', responsible: 'Carlos Lima', date: '2026-03-10', status: 'in_progress' },
  { id: '3', profileId: '3', title: 'Criar post mensal', description: 'Post promocional de março', responsible: 'Maria Santos', date: '2026-03-20', status: 'pending' },
];

const seedPosts: Post[] = [
  { id: '1', profileId: '1', imageUrl: 'https://images.unsplash.com/photo-1551076805-e1869033e561?w=400', text: 'Agende sua consulta hoje! Cuidamos da sua saúde com carinho e profissionalismo. 🏥', status: 'pending', createdAt: '2026-03-01' },
  { id: '2', profileId: '2', imageUrl: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400', text: 'Novo menu degustação disponível! Venha experimentar nossos pratos exclusivos. 🍽️', status: 'approved', createdAt: '2026-02-28' },
];

const seedReviews: Review[] = [
  { id: '1', profileId: '1', author: 'Pedro M.', rating: 5, text: 'Excelente atendimento, equipe muito profissional!', date: '2026-03-01' },
  { id: '2', profileId: '1', author: 'Lucia R.', rating: 4, text: 'Bom serviço, mas o tempo de espera poderia melhorar.', date: '2026-02-28', response: 'Obrigado pelo feedback, estamos melhorando!' },
  { id: '3', profileId: '2', author: 'Fernando S.', rating: 5, text: 'Melhor restaurante da região! Comida incrível.', date: '2026-03-02' },
];

export function getProfiles(): Profile[] { return getStore('profiles', seedProfiles); }
export function setProfiles(d: Profile[]) { setStore('profiles', d); }
export function getMetrics(): MonthlyMetrics[] { return getStore('metrics', seedMetrics); }
export function setMetrics(d: MonthlyMetrics[]) { setStore('metrics', d); }
export function getReviews(): Review[] { return getStore('reviews', seedReviews); }
export function setReviews(d: Review[]) { setStore('reviews', d); }
export function getPosts(): Post[] { return getStore('posts', seedPosts); }
export function setPosts(d: Post[]) { setStore('posts', d); }
export function getReports(): Report[] { return getStore('reports', []); }
export function setReports(d: Report[]) { setStore('reports', d); }
export function getUpdates(): ProfileUpdate[] { return getStore('updates', []); }
export function setUpdates(d: ProfileUpdate[]) { setStore('updates', d); }
export function getTasks(): Task[] { return getStore('tasks', seedTasks); }
export function setTasks(d: Task[]) { setStore('tasks', d); }
export function getHistory(): HistoryEntry[] { return getStore('history', []); }
export function setHistory(d: HistoryEntry[]) { setStore('history', d); }

export function addHistory(profileId: string, action: string) {
  const entries = getHistory();
  entries.unshift({ id: genId(), profileId, action, date: new Date().toISOString(), user: 'Equipe' });
  setHistory(entries);
}

export function getLatestMetrics(profileId: string): MonthlyMetrics | undefined {
  const all = getMetrics().filter(m => m.profileId === profileId);
  return all.sort((a, b) => (b.year * 100 + b.month) - (a.year * 100 + a.month))[0];
}

export function getPreviousMetrics(profileId: string): MonthlyMetrics | undefined {
  const all = getMetrics().filter(m => m.profileId === profileId);
  const sorted = all.sort((a, b) => (b.year * 100 + b.month) - (a.year * 100 + a.month));
  return sorted[1];
}
