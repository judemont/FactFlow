import type { Gem } from './types';

const W = 1080;
const H = 1620;

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number,
): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
      if (lines.length >= maxLines) break;
    } else {
      line = test;
    }
  }
  if (lines.length < maxLines && line) lines.push(line);
  if (lines.length >= maxLines && line && lines[lines.length - 1] !== line) {
    lines[lines.length - 1] += '…';
  }
  return lines;
}

export function gemUrl(gem: Gem): string {
  const base = `${window.location.origin}${window.location.pathname}`;
  return `${base}?gem=${encodeURIComponent(gem.id)}`;
}

export async function renderCard(gem: Gem): Promise<Blob | null> {
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const grad = ctx.createLinearGradient(0, 0, W, H);
  grad.addColorStop(0, '#1a1410');
  grad.addColorStop(1, '#0a0a0c');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  if (gem.image) {
    const img = await loadImage(gem.image);
    if (img) {
      const scale = Math.max(W / img.width, H * 0.62 / img.height);
      const w = img.width * scale;
      const h = img.height * scale;
      ctx.drawImage(img, (W - w) / 2, -h * 0.08, w, h);
      const fade = ctx.createLinearGradient(0, H * 0.2, 0, H * 0.66);
      fade.addColorStop(0, 'rgba(10,10,12,0)');
      fade.addColorStop(1, '#0a0a0c');
      ctx.fillStyle = fade;
      ctx.fillRect(0, 0, W, H * 0.66);
    }
  }

  ctx.fillStyle = '#ffb454';
  ctx.font = '700 34px system-ui, sans-serif';
  ctx.fillText('PÉPITE', 72, 96);

  ctx.fillStyle = '#fafafa';
  ctx.font = '800 76px system-ui, sans-serif';
  const titleLines = wrapText(ctx, gem.title, W - 144, 3);
  let y = H * 0.72;
  for (const line of titleLines) {
    ctx.fillText(line, 72, y);
    y += 88;
  }

  ctx.fillStyle = 'rgba(250,250,250,0.78)';
  ctx.font = '400 40px system-ui, sans-serif';
  const hookLines = wrapText(ctx, gem.hook, W - 144, 4);
  y += 24;
  for (const line of hookLines) {
    ctx.fillText(line, 72, y);
    y += 54;
  }

  ctx.fillStyle = 'rgba(250,250,250,0.45)';
  ctx.font = '400 32px system-ui, sans-serif';
  const link = gemUrl(gem);
  ctx.fillText(link.length > 64 ? `${link.slice(0, 61)}…` : link, 72, H - 72);

  return new Promise((resolve) => canvas.toBlob((b) => resolve(b), 'image/png'));
}

export type ShareResult = 'shared' | 'copied' | 'failed';

export async function shareGem(gem: Gem): Promise<ShareResult> {
  const url = gemUrl(gem);
  try {
    const blob = await renderCard(gem);
    if (blob && typeof navigator.canShare === 'function') {
      const file = new File([blob], 'pepite.png', { type: 'image/png' });
      if (navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: gem.title,
          text: gem.hook,
          url,
        });
        return 'shared';
      }
    }
    if (typeof navigator.share === 'function') {
      await navigator.share({ title: gem.title, text: gem.hook, url });
      return 'shared';
    }
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') return 'failed';
  }
  try {
    await navigator.clipboard.writeText(`${gem.hook} — ${url}`);
    return 'copied';
  } catch {
    return 'failed';
  }
}
