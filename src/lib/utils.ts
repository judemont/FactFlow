export function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffle<T>(arr: readonly T[], rnd: () => number = Math.random): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export function dayKey(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function daysSinceEpoch(d: Date = new Date()): number {
  const utc = Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
  return Math.floor(utc / 86400000);
}

export function lastNDays(n: number): string[] {
  const out: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    out.push(dayKey(d));
  }
  return out;
}

interface CacheEntry<T> {
  t: number;
  v: T;
}

const CACHE_PREFIX = 'factsflow:cache:';
const CACHE_MAX_ENTRIES = 80;
const mem = new Map<string, CacheEntry<unknown>>();

function readStored(url: string): CacheEntry<unknown> | null {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + url);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CacheEntry<unknown>;
    if (typeof parsed?.t !== 'number') return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeStored(url: string, entry: CacheEntry<unknown>): void {
  try {
    localStorage.setItem(CACHE_PREFIX + url, JSON.stringify(entry));
    const keys: { key: string; t: number }[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key?.startsWith(CACHE_PREFIX)) continue;
      const e = readStored(key.slice(CACHE_PREFIX.length));
      keys.push({ key, t: e?.t ?? 0 });
    }
    if (keys.length <= CACHE_MAX_ENTRIES) return;
    keys.sort((a, b) => a.t - b.t);
    for (const k of keys.slice(0, keys.length - CACHE_MAX_ENTRIES)) {
      localStorage.removeItem(k.key);
    }
  } catch {
    return;
  }
}

const MIN_REQUEST_GAP = 110;
let lastRequestAt = 0;
let queueTail: Promise<void> = Promise.resolve();
const inflight = new Map<string, Promise<unknown>>();

function scheduleRequest<T>(fn: () => Promise<T>): Promise<T> {
  const run = queueTail.then(async () => {
    const gap = Date.now() - lastRequestAt;
    if (gap < MIN_REQUEST_GAP) {
      await new Promise((r) => setTimeout(r, MIN_REQUEST_GAP - gap));
    }
    lastRequestAt = Date.now();
    return fn();
  });
  queueTail = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

export function fetchJSON<T>(url: string, ttlMs: number): Promise<T | null> {
  const now = Date.now();
  const memHit = mem.get(url);
  if (memHit && now - memHit.t < ttlMs) return Promise.resolve(memHit.v as T);
  const stored = readStored(url);
  if (stored && now - stored.t < ttlMs) {
    mem.set(url, stored);
    return Promise.resolve(stored.v as T);
  }
  const existing = inflight.get(url);
  if (existing) return existing as Promise<T | null>;
  const request = scheduleRequest(async () => {
    try {
      let v: T | null = null;
      let lastError: unknown = null;
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          const res = await fetch(url, { headers: { Accept: 'application/json' } });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          v = (await res.json()) as T;
          break;
        } catch (err) {
          lastError = err;
          if (attempt === 0) {
            const throttled = err instanceof Error && err.message === 'HTTP 429';
            await new Promise((r) => setTimeout(r, throttled ? 1600 : 700));
          }
        }
      }
      if (v !== null) {
        const entry: CacheEntry<T> = { t: Date.now(), v };
        mem.set(url, entry);
        writeStored(url, entry);
        return v;
      }
      throw lastError;
    } catch {
      if (stored) {
        mem.set(url, stored);
        return stored.v as T;
      }
      if (memHit) return memHit.v as T;
      return null;
    } finally {
      inflight.delete(url);
    }
  });
  inflight.set(url, request);
  return request;
}
