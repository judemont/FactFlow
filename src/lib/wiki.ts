import { fetchJSON } from './utils';
import type { Topic } from './types';

const API = 'https://en.wikipedia.org/w/api.php';
const REST = 'https://en.wikipedia.org/api/rest_v1';

export interface WikiPage {
  id: string;
  title: string;
  extract: string;
  image?: string;
  url: string;
}

interface ApiPage {
  pageid: number;
  title: string;
  missing?: boolean;
  extract?: string;
  fullurl?: string;
  thumbnail?: { source: string };
}

async function query(params: Record<string, string>, ttlMs: number): Promise<ApiPage[]> {
  const search = new URLSearchParams({
    ...params,
    format: 'json',
    formatversion: '2',
    origin: '*',
  });
  const data = await fetchJSON<{ query?: { pages?: ApiPage[] } }>(`${API}?${search}`, ttlMs);
  return data?.query?.pages ?? [];
}

export async function getArticle(title: string, ttlMs = 86400000): Promise<WikiPage | null> {
  const pages = await query(
    {
      action: 'query',
      titles: title,
      prop: 'extracts|pageimages|info',
      explaintext: '1',
      exsectionformat: 'plain',
      redirects: '1',
      inprop: 'url',
      pithumbsize: '1000',
    },
    ttlMs,
  );
  const page = pages[0];
  if (!page || page.missing || !page.extract) return null;
  return toPage(page);
}

function toPage(page: ApiPage): WikiPage {
  return {
    id: String(page.pageid),
    title: page.title,
    extract: page.extract ?? '',
    image: page.thumbnail?.source,
    url:
      page.fullurl ??
      `https://en.wikipedia.org/wiki/${encodeURIComponent(page.title.replace(/ /g, '_'))}`,
  };
}

export interface RestPage {
  titles?: { normalized?: string; canonical?: string };
  title?: string;
  extract?: string;
  thumbnail?: { source: string };
  content_urls?: { desktop?: { page?: string } };
  pageid?: number;
}

export function restToPage(p: RestPage): WikiPage | null {
  const title = p.titles?.normalized ?? p.title;
  if (!title) return null;
  return {
    id: String(p.pageid ?? title),
    title,
    extract: p.extract ?? '',
    image: p.thumbnail?.source,
    url:
      p.content_urls?.desktop?.page ??
      `https://en.wikipedia.org/wiki/${encodeURIComponent(title.replace(/ /g, '_'))}`,
  };
}

export interface OnThisDayEvent {
  text: string;
  year: number;
  pages: RestPage[];
}

export async function getOnThisDay(
  mm: string,
  dd: string,
  ttlMs = 21600000,
): Promise<OnThisDayEvent[]> {
  const data = await fetchJSON<{ selected?: OnThisDayEvent[] }>(
    `${REST}/feed/onthisday/selected/${mm}/${dd}`,
    ttlMs,
  );
  return data?.selected ?? [];
}

export interface FeaturedFeed {
  tfa?: RestPage;
  mostread?: { articles?: RestPage[] };
}

export async function getFeaturedFeed(
  yyyy: string,
  mm: string,
  dd: string,
  ttlMs = 21600000,
): Promise<FeaturedFeed | null> {
  return fetchJSON<FeaturedFeed>(`${REST}/feed/featured/${yyyy}/${mm}/${dd}`, ttlMs);
}

export async function getCategoryMembers(
  category: string,
  letter: string,
  limit = 40,
  ttlMs = 86400000,
): Promise<string[]> {
  const data = await fetchJSON<{
    query?: { categorymembers?: { title: string }[] };
  }>(
    `${API}?${new URLSearchParams({
      action: 'query',
      format: 'json',
      formatversion: '2',
      origin: '*',
      list: 'categorymembers',
      cmtitle: `Category:${category}`,
      cmtype: 'page',
      cmlimit: String(limit),
      cmstartsortkey: letter,
    })}`,
    ttlMs,
  );
  return (data?.query?.categorymembers ?? [])
    .map((m) => m.title)
    .filter((t) => !/^(List of|Index of|Outline of|Category:)/i.test(t));
}

export interface GeoResult {
  title: string;
}

export async function getNearby(
  lat: number,
  lon: number,
  radius = 10000,
  ttlMs = 3600000,
): Promise<GeoResult[]> {
  const data = await fetchJSON<{
    query?: { geosearch?: { title: string }[] };
  }>(
    `${API}?${new URLSearchParams({
      action: 'query',
      format: 'json',
      formatversion: '2',
      origin: '*',
      list: 'geosearch',
      gscoord: `${lat}|${lon}`,
      gsradius: String(radius),
      gslimit: '40',
    })}`,
    ttlMs,
  );
  return (data?.query?.geosearch ?? []).map((g) => ({ title: g.title }));
}

export function guessTopic(title: string, extract: string): Topic {
  const t = `${title} ${extract.slice(0, 600)}`.toLowerCase();
  const has = (words: string[]) => words.some((w) => t.includes(w));
  if (has(['star', 'planet', 'orbit', 'lunar', 'solar', 'comet', 'asteroid', 'galaxy', 'spacecraft', 'rocket', 'meteor'])) return 'space';
  if (has(['murder', 'killer', 'disappearance', 'unsolved', 'homicide', 'theft', 'piracy', 'mutiny', 'heist'])) return 'crime';
  if (has(['painting', 'artist', 'museum', 'sculptor', 'novel', 'composer', 'symphony', 'album', 'architect', 'theatre', 'opera'])) return 'arts';
  if (has(['computer', 'software', 'engineer', 'machine', 'internet', 'programming', 'robot', 'algorithm', 'invention', 'patent'])) return 'tech';
  if (has(['species', 'bird', 'fish', 'forest', 'mountain', 'river', 'lake', 'island', 'plant', 'animal', 'reef', 'volcano', 'glacier'])) return 'nature';
  if (has(['war', 'battle', 'empire', 'king', 'century', 'dynasty', 'republic', 'revolution', 'ancient', 'medieval'])) return 'history';
  return 'science';
}
