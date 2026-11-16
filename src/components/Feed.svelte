<script lang="ts">
  import { onMount } from 'svelte';
  import { feed, setMode, ensureAhead, onFactShown, openShared } from '../lib/feed';
  import { toggleLike, isLiked } from '../lib/storage';
  import { playTick, playPop, haptic } from '../lib/sound';
  import { showToast } from '../lib/toast';
  import FactCard from './FactCard.svelte';
  import ProgressBar from './ProgressBar.svelte';
  import ActionRail from './ActionRail.svelte';
  import ModeSwitcher from './ModeSwitcher.svelte';
  import StatsSheet from './StatsSheet.svelte';
  import Skeleton from './Skeleton.svelte';
  import Toasts from './Toasts.svelte';

  let index = $state(0);
  let screenIndex = $state(0);
  let dy = $state(0);
  let dx = $state(0);
  let dragging = $state(false);
  let notrans = $state(false);
  let commit = $state<{ dir: 1 | -1 } | null>(null);
  let bursts = $state<{ id: number; x: number; y: number }[]>([]);
  let likedMap = $state<Record<string, boolean>>({});

  const facts = $derived($feed.facts);
  const current = $derived(facts[index] ?? null);
  const prevFact = $derived(facts[index - 1] ?? null);
  const nextFact = $derived(facts[index + 1] ?? null);
  const total = $derived(current ? current.screens.length + 2 : 1);

  const canSkipForward = $derived(index < facts.length - 1);
  const canSkipBack = $derived(index > 0);

  function slideTransform(pos: 'current' | 'next' | 'prev'): string {
    if (commit) {
      if (pos === 'current') return `translateY(${commit.dir < 0 ? '-100%' : '100%'})`;
      const incoming = commit.dir < 0 ? 'next' : 'prev';
      if (pos === incoming) return 'translate(0)';
      return pos === 'next' ? 'translateY(100%)' : 'translateY(-100%)';
    }
    if (!dragging) {
      if (pos === 'current') return 'translate(0)';
      return pos === 'next' ? 'translateY(100%)' : 'translateY(-100%)';
    }
    const capped =
      (dy < 0 && !canSkipForward) || (dy > 0 && !canSkipBack) ? dy * 0.25 : dy;
    if (pos === 'current') return `translateY(${capped}px)`;
    if (pos === 'next') return `translateY(calc(100% + ${capped}px))`;
    return `translateY(calc(-100% + ${capped}px))`;
  }

  function commitSlide(dir: 1 | -1): void {
    if (commit) return;
    commit = { dir };
    setTimeout(() => {
      notrans = true;
      if (dir < 0) {
        index++;
        void ensureAhead(index);
      } else {
        index--;
      }
      screenIndex = 0;
      commit = null;
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          notrans = false;
        });
      });
    }, 360);
  }

  const counted = new Set<string>();
  $effect(() => {
    const g = current;
    if (g && !counted.has(g.id)) {
      counted.add(g.id);
      for (const m of onFactShown(g)) showToast(m);
    }
  });

  $effect(() => {
    for (const g of facts.slice(index + 1, index + 4)) {
      if (g.image) {
        const img = new Image();
        img.src = g.image;
      }
    }
  });

  onMount(() => {
    const params = new URLSearchParams(window.location.search);
    const shared = params.get('fact') ?? params.get('gem');
    if (shared) {
      void openShared(shared).then((ok) => {
        if (!ok) void setMode('foryou');
      });
    } else {
      void setMode('foryou');
    }
  });

  function advance(): void {
    if (!current || commit) return;
    if (screenIndex < total - 1) {
      screenIndex++;
      playTick();
    } else if (!skipForward()) {
      void ensureAhead(index);
    }
  }

  function skipForward(): boolean {
    if (!current || !canSkipForward || commit) return false;
    playTick();
    commitSlide(-1);
    return true;
  }

  function skipBack(): boolean {
    if (!canSkipBack || commit) return false;
    playTick();
    commitSlide(1);
    return true;
  }

  function resetPosition(): void {
    index = 0;
    screenIndex = 0;
    dy = 0;
  }

  async function openLiked(id: string): Promise<void> {
    const i = facts.findIndex((f) => f.id === id);
    if (i >= 0) {
      index = i;
      screenIndex = 0;
      return;
    }
    const ok = await openShared(id);
    if (ok) {
      index = 0;
      screenIndex = 0;
    }
  }

  function likeCurrent(x?: number, y?: number): void {
    const g = current;
    if (!g) return;
    const liked = toggleLike(g);
    likedMap[g.id] = liked;
    if (liked) {
      haptic(12);
      playPop();
      if (x !== undefined && y !== undefined) {
        const id = Date.now();
        bursts = [...bursts, { id, x, y }];
        setTimeout(() => {
          bursts = bursts.filter((b) => b.id !== id);
        }, 700);
      }
    }
  }

  let startY = 0;
  let startX = 0;
  let lastY = 0;
  let lastT = 0;
  let velocity = 0;
  let startT = 0;
  let curX = 0;
  let curY = 0;
  let prevTapT = 0;
  let prevTapX = 0;
  let wheelLock = 0;
  let tapTimer: ReturnType<typeof setTimeout> | null = null;
  let tapScheduledScreen = 0;
  let lastTouchEnd = 0;

  function scheduleTap(): void {
    if (tapTimer) clearTimeout(tapTimer);
    tapScheduledScreen = screenIndex;
    tapTimer = setTimeout(() => {
      tapTimer = null;
      if (screenIndex === tapScheduledScreen) advance();
    }, 320);
  }

  function onClick(e: MouseEvent): void {
    if (performance.now() - lastTouchEnd < 500) return;
    if ((e.target as HTMLElement).closest('button, a, input, label')) return;
    scheduleTap();
  }

  function onTouchStart(e: TouchEvent): void {
    if (commit) return;
    const t = e.touches[0];
    dragging = true;
    startY = lastY = t.clientY;
    startX = t.clientX;
    dx = 0;
    dy = 0;
    curX = t.clientX;
    curY = t.clientY;
    startT = lastT = performance.now();
    velocity = 0;
  }

  function onTouchMove(e: TouchEvent): void {
    if (!dragging) return;
    const t = e.touches[0];
    dx = t.clientX - startX;
    const raw = t.clientY - startY;
    dy = Math.abs(raw) <= 8 ? 0 : raw > 0 ? raw - 8 : raw + 8;
    const now = performance.now();
    const dt = Math.max(1, now - lastT);
    velocity = (t.clientY - lastY) / dt;
    lastY = t.clientY;
    lastT = now;
  }

  function onTouchEnd(): void {
    if (!dragging) return;
    dragging = false;
    const d = dy;
    const dxEnd = dx;
    dy = 0;
    dx = 0;
    const now = performance.now();
    lastTouchEnd = now;
    if (Math.abs(d) < 10 && Math.abs(dxEnd) < 10 && now - startT < 260) {
      if (now - prevTapT < 340 && Math.abs(curX - prevTapX) < 70) {
        likeCurrent(curX, curY);
        prevTapT = 0;
        if (tapTimer) {
          clearTimeout(tapTimer);
          tapTimer = null;
        }
      } else {
        prevTapT = now;
        prevTapX = curX;
        scheduleTap();
      }
      return;
    }
    if (d < -70 || (velocity < -0.6 && d < -20)) skipForward();
    else if (d > 70 || (velocity > 0.6 && d > 20)) skipBack();
  }

  $effect(() => {
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const now = performance.now();
      if (now < wheelLock) return;
      if (Math.abs(e.deltaY) < 12) return;
      wheelLock = now + 450;
      if (e.deltaY > 0) skipForward();
      else skipBack();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === ' ') {
        e.preventDefault();
        advance();
      } else if (e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === 'j') {
        e.preventDefault();
        skipForward();
      } else if (e.key === 'ArrowUp' || e.key === 'PageUp' || e.key === 'k') {
        e.preventDefault();
        skipBack();
      }
    };
    window.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('keydown', onKey);
    };
  });
</script>

<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_noninteractive_element_interactions -->
<!-- Keyboard advance is handled by the window-level keydown listener below. -->
<div
  class="feed"
  role="region"
  aria-label="Fact feed"
  onclick={onClick}
  ontouchstart={onTouchStart}
  ontouchmove={onTouchMove}
  ontouchend={onTouchEnd}
>
  {#if $feed.loading && !current}
    <Skeleton />
  {:else if current}
    <div class="stage" class:dragging class:notrans>
      {#if prevFact}
        <div class="slide" style:transform={slideTransform('prev')} aria-hidden="true">
          <FactCard fact={prevFact} screenIndex={0} />
        </div>
      {/if}
      <div class="slide" style:transform={slideTransform('current')}>
        <FactCard fact={current} {screenIndex} />
      </div>
      {#if nextFact}
        <div class="slide" style:transform={slideTransform('next')} aria-hidden="true">
          <FactCard fact={nextFact} screenIndex={0} />
        </div>
      {/if}
    </div>
    <ProgressBar segments={total} active={screenIndex} />
    <header class="top">
      <StatsSheet onopen={(id) => void openLiked(id)} />
      <ModeSwitcher onchange={resetPosition} />
    </header>
    <ActionRail
      fact={current}
      liked={likedMap[current.id] ?? isLiked(current.id)}
      onlike={(x, y) => likeCurrent(x, y)}
    />
    {#each bursts as b (b.id)}
      <div class="burst" style:left="{b.x}px" style:top="{b.y}px" aria-hidden="true">❤️</div>
    {/each}
  {/if}
  <Toasts />
</div>

<style>
  .feed {
    position: fixed;
    inset: 0;
    overflow: hidden;
    background: var(--bg);
    touch-action: none;
    user-select: none;
    -webkit-user-select: none;
    -webkit-touch-callout: none;
  }
  .stage {
    position: absolute;
    inset: 0;
  }
  .slide {
    position: absolute;
    inset: 0;
    will-change: transform;
    transition: transform 0.36s var(--ease-spring);
  }
  .stage.dragging .slide,
  .stage.notrans .slide {
    transition: none;
  }
  .top {
    position: absolute;
    top: calc(env(safe-area-inset-top, 0px) + 22px);
    left: 14px;
    right: 14px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    z-index: 20;
  }
  .burst {
    position: absolute;
    z-index: 30;
    font-size: 4rem;
    pointer-events: none;
    transform: translate(-50%, -50%);
    animation: burst 0.7s var(--ease-spring) forwards;
  }
  @keyframes burst {
    0% {
      opacity: 0;
      transform: translate(-50%, -50%) scale(0.4);
    }
    30% {
      opacity: 1;
      transform: translate(-50%, -50%) scale(1.15);
    }
    100% {
      opacity: 0;
      transform: translate(-50%, -160%) scale(0.9);
    }
  }
</style>
