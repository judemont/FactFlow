import { get, writable } from 'svelte/store';
import { buildGem, type RawArticle } from './gem';
import * as wiki from './wiki';
import { curatedGems, fallbackGems, topicSeeds, TOPICS } from './pool';
import { isSeen, markSeen, recordView, getLikeTopicCounts } from './storage';
import { hashString, shuffle } from './utils';
import type { Gem, Mode, Topic } from './types';

export interface FeedState {
  gems: Gem[];
  loading: boolean;
  mode: Mode;
  topic: Topic | null;
  fallback: boolean;
}

export const feed = writable<FeedState>({
  gems: [],
  loading: true,
  mode: 'foryou',
  topic: null,
  fallback: false,
});

type Supplier = () => Promise<RawArticle | null>;

let suppliers: Supplier[] = [];
let loadingMore = false;
let coords: { lat: number; lon: number } | null = null;

function weightedSeeds(): { title: string; topic: Topic }[] {
  const counts = getLikeTopicCounts();
  return TOPICS.flatMap((t) => {
    const weight = 2 + Math.min(4, counts[t.id] ?? 0);
    return shuffle(topicSeeds[t.id])
      .slice(0, weight)
      .map((title) => ({ title, topic: t.id }));
  });
}

function pageSupplier(title: string, topic?: Topic): Supplier {
  return async () => {
    const page = await wiki.getArticle(title);
    if (!page) return null;
    return { ...page, topic };
  };
}

function restSupplier(p: wiki.RestPage, fallbackTopic?: Topic): Supplier {
  return async () => {
    const title = p.titles?.normalized ?? p.title;
    if (!title) return null;
    if (p.extract && p.extract.length > 400) {
      const page = wiki.restToPage(p);
      if (page) return { ...page, topic: fallbackTopic };
    }
    return pageSupplier(title, fallbackTopic)();
  };
}

function makeSuppliers(mode: Mode, topic: Topic | null): Supplier[] {
  if (mode === 'foryou') {
    return [
      async () => {
        const now = new Date();
        const yyyy = String(now.getFullYear());
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const dd = String(now.getDate()).padStart(2, '0');
        const f = await wiki.getFeaturedFeed(yyyy, mm, dd);
        if (!f) return null;
        return f.tfa ? restSupplier(f.tfa)() : null;
      },
      async () => {
        const now = new Date();
        const yyyy = String(now.getFullYear());
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const dd = String(now.getDate()).padStart(2, '0');
        const f = await wiki.getFeaturedFeed(yyyy, mm, dd);
        const articles = (f?.mostread?.articles ?? [])
          .filter((a) => {
            const t = a.titles?.normalized ?? a.title ?? '';
            return !/^(Main Page|Special:|Wikipedia:|Portal:)/i.test(t);
          })
          .slice(0, 8);
        for (const a of shuffle(articles)) {
          const raw = await restSupplier(a)();
          if (raw) return raw;
        }
        return null;
      },
      ...shuffle(weightedSeeds()).map(({ title, topic }) => pageSupplier(title, topic)),
    ];
  }

  if (mode === 'onthisday') {
    return [
      async () => {
        const now = new Date();
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const dd = String(now.getDate()).padStart(2, '0');
        const events = await wiki.getOnThisDay(mm, dd);
        for (const ev of shuffle(events)) {
          const withThumb = ev.pages.find((p) => p.thumbnail) ?? ev.pages[0];
          if (!withThumb) continue;
          const raw = await restSupplier(withThumb, 'history')();
          if (raw) return raw;
        }
        return null;
      },
      ...shuffle(topicSeeds.history).map((title) => pageSupplier(title, 'history')),
    ];
  }

  if (mode === 'topics' && topic) {
    return shuffle(topicSeeds[topic]).map((title) => pageSupplier(title, topic));
  }

  if (mode === 'nearby' && coords) {
    const c = coords;
    return [
      async () => {
        const results = await wiki.getNearby(c.lat, c.lon);
        const titles = shuffle(results.map((r) => r.title));
        for (const title of titles) {
          const raw = await pageSupplier(title)();
          if (raw) return raw;
        }
        return null;
      },
      ...shuffle(TOPICS.flatMap((t) => topicSeeds[t.id])).map((title) => pageSupplier(title)),
    ];
  }

  return shuffle(weightedSeeds()).map(({ title, topic }) => pageSupplier(title, topic));
}

function preloadImages(f: FeedState, from: number): void {
  if (typeof Image === 'undefined') return;
  for (const g of f.gems.slice(from + 1, from + 4)) {
    if (g.image) {
      const img = new Image();
      img.src = g.image;
    }
  }
}

export async function ensureAhead(currentIndex = 0): Promise<void> {
  if (loadingMore) return;
  const need = Math.max(4, currentIndex + 4);
  const before = get(feed);
  if (before.gems.length >= need) {
    preloadImages(before, currentIndex);
    return;
  }
  loadingMore = true;
  try {
    let attempts = 0;
    while (get(feed).gems.length < need && attempts < 24) {
      attempts++;
      const sup = suppliers.shift();
      if (!sup) break;
      let raw: RawArticle | null = null;
      try {
        raw = await sup();
      } catch {
        raw = null;
      }
      if (!raw) continue;
      const gem = buildGem(raw);
      if (!gem) continue;
      if (!gem.rare && hashString(gem.id) % 9 === 0) gem.rare = true;
      if (!gem.image) {
        gem.image = (await wiki.findArticleImage(raw.title).catch(() => null)) ?? undefined;
      }
      if (!gem.image) continue;
      if (isSeen(gem.id)) continue;
      markSeen(gem.id);
      feed.update((f) => ({ ...f, gems: [...f.gems, gem] }));
    }
    const after = get(feed);
    if (after.gems.length < need) {
      const missing = need - after.gems.length;
      const extra = fallbackGems()
        .filter((g) => !after.gems.some((x) => x.id === g.id))
        .slice(0, missing);
      for (const g of extra) {
        if (!g.image) {
          g.image = (await wiki.findArticleImage(g.title).catch(() => null)) ?? undefined;
        }
      }
      if (extra.length) {
        feed.update((f) => ({ ...f, gems: [...f.gems, ...extra], fallback: true }));
      }
    }
  } finally {
    loadingMore = false;
    feed.update((f) => ({ ...f, loading: false }));
    const f = get(feed);
    preloadImages(f, Math.max(0, f.gems.length - 4));
  }
}

export async function setMode(
  mode: Mode,
  topic: Topic | null = null,
  location?: { lat: number; lon: number },
): Promise<void> {
  if (location) coords = location;
  suppliers = makeSuppliers(mode, topic);
  feed.set({ gems: [], loading: true, mode, topic, fallback: false });
  await ensureAhead();
}

export function onGemShown(gem: Gem): string[] {
  markSeen(gem.id);
  return recordView(gem.id);
}

export async function gemFromId(id: string): Promise<Gem | null> {
  if (id.startsWith('curated-')) {
    return curatedGems.find((g) => g.id === id) ?? null;
  }
  if (/^\d+$/.test(id)) {
    const page = await wiki.getPageById(id);
    return page ? buildGem({ ...page }) : null;
  }
  const page = await wiki.getArticle(id);
  return page ? buildGem({ ...page }) : null;
}

export async function openShared(id: string): Promise<boolean> {
  const gem = await gemFromId(id);
  if (!gem) return false;
  suppliers = makeSuppliers('foryou', null);
  feed.set({ gems: [gem], loading: true, mode: 'foryou', topic: null, fallback: false });
  await ensureAhead();
  return true;
}
