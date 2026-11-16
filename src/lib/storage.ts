import { writable } from 'svelte/store';
import { dayKey, lastNDays } from './utils';
import type { Fact } from './types';

const KEYS = {
  likes: 'factsflow.likes',
  history: 'factsflow.history',
  streak: 'factsflow.streak',
  weekly: 'factsflow.weekly',
  settings: 'factsflow.settings',
  seen: 'factsflow.seen',
  likeTopics: 'factsflow.likeTopics',
  likedFacts: 'factsflow.likedFacts',
} as const;

const LEGACY_KEYS: [oldKey: string, newKey: string][] = [
  ['pepite.likes', KEYS.likes],
  ['pepite.history', KEYS.history],
  ['pepite.streak', KEYS.streak],
  ['pepite.weekly', KEYS.weekly],
  ['pepite.settings', KEYS.settings],
  ['pepite.seen', KEYS.seen],
  ['pepite.likeTopics', KEYS.likeTopics],
  ['pepite.likedGems', KEYS.likedFacts],
  ['factflow.likes', KEYS.likes],
  ['factflow.history', KEYS.history],
  ['factflow.streak', KEYS.streak],
  ['factflow.weekly', KEYS.weekly],
  ['factflow.settings', KEYS.settings],
  ['factflow.seen', KEYS.seen],
  ['factflow.likeTopics', KEYS.likeTopics],
  ['factflow.likedFacts', KEYS.likedFacts],
];

function migrateLegacy(): void {
  try {
    for (const [oldKey, newKey] of LEGACY_KEYS) {
      const legacy = localStorage.getItem(oldKey);
      if (legacy === null) continue;
      if (localStorage.getItem(newKey) === null) {
        if (newKey === KEYS.likedFacts) {
          const entries = JSON.parse(legacy) as { fact?: unknown; day: string }[];
          const converted = entries.map((e) => ({
            fact: (e as { fact?: unknown; gem?: unknown }).fact ?? (e as { gem?: unknown }).gem,
            day: e.day,
          }));
          localStorage.setItem(newKey, JSON.stringify(converted));
        } else {
          localStorage.setItem(newKey, legacy);
        }
      }
      localStorage.removeItem(oldKey);
    }
  } catch {
    return;
  }
}

migrateLegacy();

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

export interface LikedEntry {
  fact: Fact;
  day: string;
}

export function toggleLike(fact: Fact): boolean {
  const likes = read<string[]>(KEYS.likes, []);
  const idx = likes.indexOf(fact.id);
  if (idx >= 0) likes.splice(idx, 1);
  else likes.push(fact.id);
  write(KEYS.likes, likes);

  const counts = read<Record<string, number>>(KEYS.likeTopics, {});
  counts[fact.topic] = Math.max(0, (counts[fact.topic] ?? 0) + (idx < 0 ? 1 : -1));
  write(KEYS.likeTopics, counts);

  const saved = read<LikedEntry[]>(KEYS.likedFacts, []);
  if (idx < 0) {
    saved.unshift({ fact, day: dayKey() });
  } else {
    const keep = saved.filter((e) => e.fact.id !== fact.id);
    saved.length = 0;
    saved.push(...keep);
  }
  write(KEYS.likedFacts, saved.slice(0, 200));

  return idx < 0;
}

export function getLikedFacts(): LikedEntry[] {
  return read<LikedEntry[]>(KEYS.likedFacts, []);
}

export function getLikeTopicCounts(): Record<string, number> {
  return read<Record<string, number>>(KEYS.likeTopics, {});
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
  if (todayCount === 10) milestones.push('10 facts learned today 🔥');
  if (streak.count === 7) milestones.push('7-day streak 🔥');
  if (streak.count === 30) milestones.push('30-day streak. Unstoppable 🏆');
  return milestones;
}

export interface Settings {
  sound: boolean;
  autoplay: boolean;
  wpm: number;
}

const DEFAULT_SETTINGS: Settings = { sound: false, autoplay: true, wpm: 220 };

export function getSettings(): Settings {
  return { ...DEFAULT_SETTINGS, ...read<Partial<Settings>>(KEYS.settings, {}) };
}

export const settings = writable<Settings>(getSettings());

export function updateSettings(patch: Partial<Settings>): void {
  const next = { ...getSettings(), ...patch };
  write(KEYS.settings, next);
  settings.set(next);
}

export function soundEnabled(): boolean {
  return getSettings().sound;
}

export function setSound(on: boolean): void {
  updateSettings({ sound: on });
}

export function clearAllData(): void {
  try {
    for (const key of Object.values(KEYS)) {
      localStorage.removeItem(key);
    }
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (
        key &&
        (key.startsWith('factsflow:cache:') ||
          key.startsWith('factflow') ||
          key.startsWith('pepite'))
      )
        localStorage.removeItem(key);
    }
  } catch {
    return;
  }
}
