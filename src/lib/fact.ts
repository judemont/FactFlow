import type { Fact, Topic } from './types';
import { hashString } from './utils';
import { guessTopic } from './wiki';

export interface RawArticle {
  id: string;
  title: string;
  extract: string;
  image?: string;
  url: string;
  topic?: Topic;
}

const SUPERLATIVES = [
  'first', 'only', 'last', 'most', 'largest', 'oldest', 'biggest', 'fastest',
  'tallest', 'longest', 'smallest', 'richest', 'deadliest', 'worst', 'greatest',
  'unique', 'never', 'record', 'unprecedented', 'sole',
];

const STRIKING = [
  'killed', 'killing', 'killed', 'died', 'death', 'dead', 'murder', 'executed',
  'blood', 'war', 'battle', 'fire', 'burned', 'burnt', 'exploded', 'explosion',
  'burst', 'sank', 'sunk', 'wreck', 'crash', 'disaster', 'mystery',
  'mysterious', 'curse', 'cursed', 'secret', 'lost', 'vanished',
  'disappeared', 'treasure', 'gold', 'stolen', 'theft', 'haunted', 'ghost',
  'alien', 'monster', 'banned', 'illegal', 'prison', 'jail', 'scandal',
  'fraud', 'bizarre', 'strange', 'weird', 'impossible', 'accidentally',
  'survived', 'survivor', 'millions', 'billions', 'thousands', 'unknown',
  'unsolved', 'unexplained', 'mutiny', 'plague', 'epidemic', 'famine',
  'poison', 'radioactive', 'nuclear', 'extraterrestrial', 'hijack',
  'injured', 'injuring', 'crushed', 'danced', 'dancing', 'avalanche',
];

const CURIOSITY = [
  'why', 'how', 'nobody', 'no one', 'still', 'riddle', 'puzzle', 'unlike',
  'instead', 'despite', 'remains', 'debate', 'controversy', 'legend',
];

const JUNK_LINE =
  /^(Further information|See also|Main articles?|For further details|For more details|Notes|References|Bibliography|External links|Further reading|Sources|Citations|Explanatory notes)\b/i;

const JUNK_SENTENCE =
  /\b(ISBN|doi:|OCLC|PMID|Retrieved|Archived from|Cite error|et al\.|Bibliography)\b/i;

const TECH_SENTENCE = /\b(MHz|kHz|GHz|\bnm\b|\bmm\b|oscillator|printout|specification)\b/i;

const DEFINITION = /\b(is|was|are|were) (a|an|the)\b/;

const YEAR = /\b(1\d{3}|20\d{2})\b/;

const DANGLING = new Set([
  'of', 'in', 'and', 'the', 'with', 'from', 'by', 'at', 'on', 'for', 'that',
  'which', 'who', 'or', 'to', 'a', 'an', 'its', 'their', 'after', 'before',
  'when', 'while', 'but', 'as', 'than', 'then',
]);

const HOOK_CANDIDATES = 6;
const HOOK_MIN = 4.2;

export function cleanExtract(raw: string): string {
  const lines = raw
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .filter((line) => !JUNK_LINE.test(line))
    .filter((line) => /[.!?…”"]$/.test(line) || line.length > 90);
  let t = lines.join(' ');
  let prev = '';
  while (t !== prev) {
    prev = t;
    t = t.replace(/\s*\([^()]*\)/g, '');
  }
  t = t.replace(/\[[^\]]*\]/g, '');
  t = t.replace(/\s+([,.;:!?])/g, '$1');
  t = t.replace(/\s{2,}/g, ' ');
  return t.trim();
}

function splitSentences(text: string): string[] {
  const guarded = text.replace(/\b(\d+)\.(\d+)\b/g, '$1\u00a7$2\u00a7');
  const rough = guarded.split(/(?<=[.!?])["']?\s+(?=["'(]?[A-Z0-9])/);
  const out: string[] = [];
  for (const piece of rough) {
    const s = piece.replace(/\u00a7/g, '.').trim();
    if (!s) continue;
    const last = out[out.length - 1];
    if (last && (ABBREVS.test(last) || last.split(' ').length < 3)) {
      out[out.length - 1] = `${last} ${s}`;
    } else {
      out.push(s);
    }
  }
  return out;
}

const ABBREVS =
  /(?:Mr|Mrs|Ms|Dr|Prof|Sr|Jr|St|Mt|vs|etc|approx|Vol|Ed|Capt|Sgt|Col|Gen|Rev|Hon|No)\.$/;

function isQuality(s: string): boolean {
  if (s.length < 24 || s.length > 320) return false;
  const words = s.split(/\s+/).length;
  if (words < 3 || words > 48) return false;
  if (/[|={}]/.test(s)) return false;
  if (!/[.!?…”"]$/.test(s)) return false;
  if (JUNK_SENTENCE.test(s)) return false;
  return true;
}

function scoreSentence(s: string, pos: number): number {
  const lower = s.toLowerCase();
  const words = s.split(/\s+/).length;
  let score = 0;

  if (YEAR.test(s)) score += 3;
  if (/\b\d[\d,.]*\b/.test(s)) score += 1;
  if (/\d+%|\bpercent\b/.test(lower)) score += 0.8;

  const numTokens = s.match(/\b\d[\d,.]*\b/g)?.length ?? 0;
  if (numTokens > 2) score -= 1.5;
  if (/\d\.\d{3,}/.test(s)) score -= 2;
  if (TECH_SENTENCE.test(s)) score -= 2;

  let superlatives = 0;
  for (const w of SUPERLATIVES) {
    if (lower.includes(w)) superlatives++;
  }
  score += Math.min(superlatives * 1.8, 4.5);

  let striking = 0;
  for (const w of STRIKING) {
    if (lower.includes(w)) striking++;
  }
  score += Math.min(striking * 1.1, 4);

  for (const w of CURIOSITY) {
    if (lower.includes(w)) score += 0.7;
  }

  if (s.endsWith('?')) score += 1.2;
  if (DEFINITION.test(lower) || lower.startsWith('refers to')) score -= 3.5;
  if (words < 5) score -= 2.5;
  else if (words > 34) score -= 2.5;
  else if (words > 28) score -= 1;

  score += Math.max(0, 2.2 - pos * 0.18);
  return score;
}

function truncateForGap(s: string): { hook: string; reveal: string } | null {
  const commas = [...s.matchAll(/,/g)].map((m) => m.index ?? -1).filter((i) => i > 0);
  for (let k = commas.length - 1; k >= 0; k--) {
    const idx = commas[k];
    const left = s.slice(0, idx).trim();
    const right = s.slice(idx + 1).trim();
    const leftWords = left.split(/\s+/).length;
    const rightWords = right.split(/\s+/).length;
    if (leftWords < 6 || rightWords < 4 || right.length > 160) continue;
    if (left.length < 30) continue;
    const lastWord = left.split(/\s+/).pop() ?? '';
    if (DANGLING.has(lastWord.toLowerCase())) continue;
    const lowerLeft = left.toLowerCase();
    const interesting =
      YEAR.test(left) ||
      SUPERLATIVES.some((w) => lowerLeft.includes(w)) ||
      STRIKING.some((w) => lowerLeft.includes(w));
    if (!interesting) continue;
    let reveal = right.replace(/[,;:]$/, '');
    if (!/[.!?]$/.test(reveal)) reveal += '.';
    reveal = reveal.replace(/^(where|when|while|and|but|which|who|although|though|after|before|as|so)\b\s*/i, '');
    reveal = reveal.charAt(0).toUpperCase() + reveal.slice(1);
    return { hook: `${left.replace(/[,;:]$/, '')}\u2026`, reveal };
  }
  return null;
}

function chunkIntoScreens(sentences: string[], maxScreens: number): string[] {
  const screens: string[] = [];
  let i = 0;
  while (i < sentences.length && screens.length < maxScreens) {
    const first = sentences[i];
    const second = sentences[i + 1];
    const combined = second ? `${first} ${second}` : first;
    if (second && combined.split(/\s+/).length <= 42) {
      screens.push(combined);
      i += 2;
    } else {
      screens.push(first);
      i += 1;
    }
  }
  return screens;
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function buildFact(a: RawArticle): Fact | null {
  const text = cleanExtract(a.extract);
  if (text.length < 220) return null;

  const all = splitSentences(text).filter(isQuality);
  if (all.length < 5) return null;

  const scored = all.map((s, i) => ({ s, i, score: scoreSentence(s, i) }));
  const candidates = scored.slice(0, HOOK_CANDIDATES);
  const best =
    [...candidates].sort(
      (x, y) =>
        Number(DEFINITION.test(x.s.toLowerCase())) -
          Number(DEFINITION.test(y.s.toLowerCase())) ||
        y.score - x.score ||
        x.i - y.i,
    )[0] ?? scored[0];

  if (best.score < HOOK_MIN) {
    console.info(`[factsflow] weak hook for "${a.title}" (score ${best.score.toFixed(1)})`);
  }

  const h = hashString(`${a.id}:${a.title}`);
  let hook = best.s;
  let reveal = '';

  if (h % 100 < 65) {
    const cut = truncateForGap(best.s);
    if (cut) {
      hook = cut.hook;
      reveal = cut.reveal;
    }
  }
  if (hook.length > 150) {
    let trimmed = hook.slice(0, 177).replace(/\s+\S*$/, '');
    const words = trimmed.split(' ');
    while (words.length > 4 && DANGLING.has((words[words.length - 1] ?? '').toLowerCase())) {
      words.pop();
    }
    trimmed = words.join(' ');
    hook = `${trimmed}\u2026`;
  }

  const hookSource = best.s;
  const used = new Set<string>([hookSource]);
  const story: string[] = [];

  if (reveal) story.push(reveal);

  const context = all[0] !== hookSource ? all[0] : all[1];
  if (context && !used.has(context)) {
    story.push(capitalize(context));
    used.add(context);
  }

  for (const s of all) {
    if (story.length >= 9) break;
    if (used.has(s)) continue;
    const words = s.split(/\s+/).length;
    if (words < 5 || words > 34) continue;
    story.push(s);
    used.add(s);
  }

  const twist = [...scored]
    .filter((x) => !used.has(x.s) && x.score >= Math.max(4, best.score * 0.7))
    .sort((x, y) => y.score - x.score)[0];
  if (twist) {
    story.push(twist.s);
    used.add(twist.s);
  }

  if (story.length < 2) return null;

  const screens = chunkIntoScreens(story, 6);
  if (screens.length < 2) return null;

  let bonus: string | undefined;
  if (h % 100 < 45) {
    bonus = [...scored]
      .filter((x) => !used.has(x.s) && x.i > 6 && x.score >= 5)
      .sort((x, y) => y.score - x.score)[0]?.s;
  }

  return {
    id: a.id,
    title: a.title,
    hook,
    screens,
    bonus,
    image: a.image,
    articleUrl: a.url,
    topic: a.topic ?? guessTopic(a.title, a.extract),
  };
}
