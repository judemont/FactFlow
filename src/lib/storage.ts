import { dayKey, lastNDays } from './utils';

const KEYS = {
  likes: 'pepite.likes',
  history: 'pepite.history',
  streak: 'pepite.streak',
  weekly: 'pepite.weekly',
  settings: 'pepite.settings',
  seen: 'pepite.seen',
} as const;

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    return;
  }
}

export interface Stats {
  streak: number;
  todayCount: number;
  weekCount: number;
  likeCount: number;
  week: { day: string; count: number }[];
}

function yesterday(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return dayKey(d);
}

export function getStats(): Stats {
  const weekly = read<Record<string, number>>(KEYS.weekly, {});
  const likes = read<string[]>(KEYS.likes, []);
  const streak = read<{ count: number; lastDay: string }>(KEYS.streak, {
    count: 0,
    lastDay: '',
  });
  const today = dayKey();
  const week = lastNDays(7).map((day) => ({ day, count: weekly[day] ?? 0 }));
  return {
    streak: streak.lastDay === today || streak.lastDay === yesterday() ? streak.count : 0,
    todayCount: weekly[today] ?? 0,
    weekCount: week.reduce((sum, d) => sum + d.count, 0),
    likeCount: likes.length,
    week,
  };
}

export function isLiked(id: string): boolean {
  return read<string[]>(KEYS.likes, []).includes(id);
}

export function toggleLike(id: string): boolean {
  const likes = read<string[]>(KEYS.likes, []);
  const idx = likes.indexOf(id);
  if (idx >= 0) likes.splice(idx, 1);
  else likes.push(id);
  write(KEYS.likes, likes);
  return idx < 0;
}

export function isSeen(id: string): boolean {
  return read<string[]>(KEYS.seen, []).includes(id);
}

export function markSeen(id: string): void {
  const seen = read<string[]>(KEYS.seen, []);
  if (seen.includes(id)) return;
  seen.push(id);
  write(KEYS.seen, seen.slice(-300));
}

export function recordView(id: string): string[] {
  const today = dayKey();
  const weekly = read<Record<string, number>>(KEYS.weekly, {});
  weekly[today] = (weekly[today] ?? 0) + 1;
  const keep = new Set(lastNDays(14));
  for (const day of Object.keys(weekly)) {
    if (!keep.has(day)) delete weekly[day];
  }
  write(KEYS.weekly, weekly);

  const streak = read<{ count: number; lastDay: string }>(KEYS.streak, {
    count: 0,
    lastDay: '',
  });
  if (streak.lastDay !== today) {
    streak.count = streak.lastDay === yesterday() ? streak.count + 1 : 1;
    streak.lastDay = today;
    write(KEYS.streak, streak);
  }

  const history = read<{ id: string; day: string }[]>(KEYS.history, []);
  history.push({ id, day: today });
  write(KEYS.history, history.slice(-500));

  markSeen(id);

  const milestones: string[] = [];
  const todayCount = weekly[today] ?? 0;
  if (todayCount === 10) milestones.push('10 gems learned today 🔥');
  if (streak.count === 7) milestones.push('7-day streak 🔥');
  if (streak.count === 30) milestones.push('30-day streak. Unstoppable 🏆');
  return milestones;
}

export function soundEnabled(): boolean {
  return read<{ sound: boolean }>(KEYS.settings, { sound: false }).sound;
}

export function setSound(on: boolean): void {
  write(KEYS.settings, { sound: on });
}

export function clearAllData(): void {
  try {
    for (const key of Object.values(KEYS)) {
      localStorage.removeItem(key);
    }
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key?.startsWith('pepite:cache:')) localStorage.removeItem(key);
    }
  } catch {
    return;
  }
}
