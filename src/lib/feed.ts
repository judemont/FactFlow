import { get, writable } from 'svelte/store';
import { buildFact, type RawArticle } from './fact';
import * as wiki from './wiki';
import { curatedFacts, fallbackFacts, topicSeeds, TOPICS } from './pool';
import { isSeen, markSeen, recordView, getLikeTopicCounts } from './storage';
import { hashString, shuffle } from './utils';
import { showToast } from './toast';
import type { Fact, Mode, Topic } from './types';

export interface FeedState {
  facts: Fact[];
  loading: boolean;
  mode: Mode;
  topic: Topic | null;
  fallback: boolean;
}

export const feed = writable<FeedState>({
  facts: [],
  loading: true,
  mode: 'foryou',
  topic: null,
  fallback: false,
});

type Supplier = (() => Promise<RawArticle | null>) & { reusable?: boolean; done?: boolean };

let suppliers: Supplier[] = [];
const added = new Set<string>();
let generation = 0;
let pass = 0;
let runPromise: Promise<void> = Promise.resolve();
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

function onThisDaySupplier(): Supplier {
  let pages: wiki.RestPage[] | null = null;
  let idx = 0;
  const sup: Supplier = async () => {
    if (!pages) {
      const now = new Date();
      const mm = String(now.getMonth() + 1).padStart(2, '0');
      const dd = String(now.getDate()).padStart(2, '0');
      const events = await wiki.getOnThisDay(mm, dd);
      const seen = new Set<string>();
      pages = [];
      for (const ev of shuffle(events)) {
        const p = ev.pages.find((x) => x.thumbnail) ?? ev.pages[0];
        if (!p) continue;
        const title = p.titles?.normalized ?? p.title;
        if (!title || seen.has(title)) continue;
        seen.add(title);
        pages.push(p);
      }
    }
    while (idx < pages.length) {
      const p = pages[idx++];
      try {
        const raw = await restSupplier(p, 'history')();
        if (raw) return raw;
      } catch {
        continue;
      }
    }
    sup.done = true;
    return null;
  };
  sup.reusable = true;
  return sup;
}

function randomBatchSupplier(): Supplier {
  let titles: string[] = [];
  let idx = 0;
  let emptyBatches = 0;
  const sup: Supplier = async () => {
    while (idx >= titles.length) {
      if (emptyBatches >= 2) {
        sup.done = true;
        return null;
      }
      const batch = shuffle(await wiki.getRandomTitles(20).catch(() => []));
      if (!batch.length) {
        emptyBatches++;
        continue;
      }
      emptyBatches = 0;
      titles = batch;
      idx = 0;
    }
    while (idx < titles.length) {
      const title = titles[idx++];
      if (!title) continue;
      try {
        const raw = await pageSupplier(title)();
        if (raw) return raw;
      } catch {
        continue;
      }
    }
    sup.done = true;
    return null;
  };
  sup.reusable = true;
  return sup;
}

function replenish(mode: Mode, topic: Topic | null): void {
  pass++;
  if (mode === 'onthisday' || mode === 'nearby') {
    feed.update((f) => ({ ...f, mode: 'foryou', topic: null }));
    showToast('All caught up here — back to For you');
    suppliers.push(...makeSuppliers('foryou', null), randomBatchSupplier());
    return;
  }
  let seeds: { title: string; topic: Topic }[];
  if (mode === 'topics' && topic) {
    seeds = topicSeeds[topic].map((title) => ({ title, topic }));
  } else {
    seeds = TOPICS.flatMap((t) => topicSeeds[t.id].map((title) => ({ title, topic: t.id })));
  }
  suppliers.push(...shuffle(seeds).map(({ title, topic }) => pageSupplier(title, topic)));
  suppliers.push(randomBatchSupplier());
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
      onThisDaySupplier(),
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
  for (const g of f.facts.slice(from + 1, from + 4)) {
    if (g.image) {
      const img = new Image();
      img.src = g.image;
    }
  }
}

async function fill(need: number, gen: number): Promise<void> {
  try {
    let attempts = 0;
    while (get(feed).facts.length < need && attempts < 24) {
      if (gen !== generation) return;
      attempts++;
      const sup = suppliers.shift();
      if (!sup) {
        replenish(get(feed).mode, get(feed).topic);
        if (!suppliers.length) break;
        continue;
      }
      let raw: RawArticle | null = null;
      try {
        raw = await sup();
      } catch {
        raw = null;
      }
      if (gen !== generation) return;
      if (sup.reusable && !sup.done) suppliers.unshift(sup);
      if (!raw) continue;
      const fact = buildFact(raw);
      if (!fact) continue;
      if (!fact.rare && hashString(fact.id) % 9 === 0) fact.rare = true;
      if (!fact.image) {
        fact.image = (await wiki.findArticleImage(raw.title).catch(() => null)) ?? undefined;
      }
      if (gen !== generation) return;
      if (!fact.image) continue;
      if (pass < 2 && isSeen(fact.id)) continue;
      if (added.has(fact.id)) continue;
      added.add(fact.id);
      feed.update((f) => ({ ...f, facts: [...f.facts, fact] }));
    }
    if (gen !== generation) return;
    const after = get(feed);
    if (after.facts.length < need) {
      const missing = need - after.facts.length;
      const extra = fallbackFacts()
        .filter((g) => !after.facts.some((x) => x.id === g.id))
        .slice(0, missing);
      for (const g of extra) {
        if (!g.image) {
          g.image = (await wiki.findArticleImage(g.title).catch(() => null)) ?? undefined;
        }
      }
      if (extra.length) {
        feed.update((f) => ({ ...f, facts: [...f.facts, ...extra], fallback: true }));
      }
    }
  } finally {
    if (gen === generation) {
      feed.update((f) => ({ ...f, loading: false }));
      const f = get(feed);
      preloadImages(f, Math.max(0, f.facts.length - 4));
    }
  }
}

export async function ensureAhead(currentIndex = 0): Promise<void> {
  const gen = generation;
  const need = Math.max(4, currentIndex + 4);
  const before = get(feed);
  if (before.facts.length >= need) {
    preloadImages(before, currentIndex);
    return;
  }
  await runPromise.catch(() => {});
  if (gen !== generation) return;
  if (get(feed).facts.length >= need) {
    preloadImages(get(feed), currentIndex);
    return;
  }
  runPromise = fill(need, gen);
  await runPromise.catch(() => {});
}

export async function setMode(
  mode: Mode,
  topic: Topic | null = null,
  location?: { lat: number; lon: number },
): Promise<void> {
  if (location) coords = location;
  generation++;
  pass = 0;
  added.clear();
  suppliers = makeSuppliers(mode, topic);
  feed.set({ facts: [], loading: true, mode, topic, fallback: false });
  await ensureAhead();
}

export function onFactShown(fact: Fact): string[] {
  markSeen(fact.id);
  return recordView(fact.id);
}

export async function factFromId(id: string): Promise<Fact | null> {
  if (id.startsWith('curated-')) {
    return curatedFacts.find((g) => g.id === id) ?? null;
  }
  if (/^\d+$/.test(id)) {
    const page = await wiki.getPageById(id);
    return page ? buildFact({ ...page }) : null;
  }
  const page = await wiki.getArticle(id);
  return page ? buildFact({ ...page }) : null;
}

export async function openShared(id: string): Promise<boolean> {
  const fact = await factFromId(id);
  if (!fact) return false;
  generation++;
  pass = 0;
  added.clear();
  suppliers = makeSuppliers('foryou', null);
  feed.set({ facts: [fact], loading: true, mode: 'foryou', topic: null, fallback: false });
  await ensureAhead();
  return true;
}
