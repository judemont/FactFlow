<script lang="ts">
  import { onMount } from 'svelte';
  import { feed, setMode, ensureAhead, onGemShown } from '../lib/feed';
  import { toggleLike, isLiked } from '../lib/storage';
  import { playTick, playPop, haptic } from '../lib/sound';
  import { showToast } from '../lib/toast';
  import GemCard from './GemCard.svelte';
  import ProgressBar from './ProgressBar.svelte';
  import ActionRail from './ActionRail.svelte';
  import ModeSwitcher from './ModeSwitcher.svelte';
  import StatsSheet from './StatsSheet.svelte';
  import Skeleton from './Skeleton.svelte';
  import Toasts from './Toasts.svelte';

  let index = $state(0);
  let screenIndex = $state(0);
  let dy = $state(0);
  let dragging = $state(false);
  let bursts = $state<{ id: number; x: number; y: number }[]>([]);

  const gems = $derived($feed.gems);
  const current = $derived(gems[index] ?? null);
  const nextGem = $derived(gems[index + 1] ?? null);
  const total = $derived(current ? current.screens.length + 2 : 1);
  const atEnd = $derived(
    current ? screenIndex >= total - 1 && index >= gems.length - 1 : true,
  );
  const atStart = $derived(screenIndex === 0 && index === 0);

  const cardTransform = $derived.by(() => {
    if (!dragging) return 'translateY(0)';
    const capped = (atEnd && dy < 0) || (atStart && dy > 0) ? dy * 0.25 : dy;
    const scale = 1 - Math.min(Math.abs(capped) / 4500, 0.04);
    return `translateY(${capped}px) scale(${scale})`;
  });

  const counted = new Set<string>();
  $effect(() => {
    const g = current;
    if (g && !counted.has(g.id)) {
      counted.add(g.id);
      for (const m of onGemShown(g)) showToast(m);
    }
  });

  $effect(() => {
    for (const g of gems.slice(index + 1, index + 4)) {
      if (g.image) {
        const img = new Image();
        img.src = g.image;
      }
    }
  });

  onMount(() => {
    void setMode('daily');
  });

  function advance(): void {
    if (!current) return;
    if (screenIndex < total - 1) {
      screenIndex++;
      playTick();
    } else if (index < gems.length - 1) {
      index++;
      screenIndex = 0;
      playTick();
      void ensureAhead(index);
    }
  }

  function back(): void {
    if (screenIndex > 0) {
      screenIndex--;
      playTick();
    } else if (index > 0) {
      index--;
      screenIndex = 0;
      playTick();
    }
  }

  function resetPosition(): void {
    index = 0;
    screenIndex = 0;
    dy = 0;
  }

  function likeCurrent(x?: number, y?: number): void {
    const g = current;
    if (!g) return;
    const liked = toggleLike(g.id);
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
  let lastY = 0;
  let lastT = 0;
  let velocity = 0;
  let startT = 0;
  let curX = 0;
  let curY = 0;
  let prevTapT = 0;
  let prevTapX = 0;
  let wheelLock = 0;

  function onTouchStart(e: TouchEvent): void {
    const t = e.touches[0];
    dragging = true;
    startY = lastY = t.clientY;
    curX = t.clientX;
    curY = t.clientY;
    startT = lastT = performance.now();
    velocity = 0;
  }

  function onTouchMove(e: TouchEvent): void {
    if (!dragging) return;
    const t = e.touches[0];
    dy = t.clientY - startY;
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
    dy = 0;
    const now = performance.now();
    if (Math.abs(d) < 10 && now - startT < 260) {
      if (now - prevTapT < 340 && Math.abs(curX - prevTapX) < 70) {
        likeCurrent(curX, curY);
        prevTapT = 0;
      } else {
        prevTapT = now;
        prevTapX = curX;
      }
      return;
    }
    if (!atEnd && (d < -70 || velocity < -0.6)) advance();
    else if (!atStart && (d > 70 || velocity > 0.6)) back();
  }

  $effect(() => {
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const now = performance.now();
      if (now < wheelLock) return;
      if (Math.abs(e.deltaY) < 12) return;
      wheelLock = now + 450;
      if (e.deltaY > 0) advance();
      else back();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown' || e.key === ' ' || e.key === 'PageDown' || e.key === 'j') {
        e.preventDefault();
        advance();
      } else if (e.key === 'ArrowUp' || e.key === 'PageUp' || e.key === 'k') {
        e.preventDefault();
        back();
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

<div class="feed" role="region" aria-label="Gem feed" ontouchstart={onTouchStart} ontouchmove={onTouchMove} ontouchend={onTouchEnd}>
  {#if $feed.loading && !current}
    <Skeleton />
  {:else if current}
    <div class="under" aria-hidden="true">
      {#if nextGem}
        <GemCard gem={nextGem} screenIndex={0} preview />
      {/if}
    </div>
    <div class="front" class:dragging style:transform={cardTransform}>
      <GemCard gem={current} {screenIndex} />
    </div>
    <ProgressBar segments={total} active={screenIndex} />
    <header class="top">
      <StatsSheet />
      <ModeSwitcher onchange={resetPosition} />
    </header>
    <ActionRail
      gem={current}
      liked={isLiked(current.id)}
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
  }
  .under,
  .front {
    position: absolute;
    inset: 0;
  }
  .front {
    will-change: transform;
    transition: transform 0.32s var(--ease-spring);
  }
  .front.dragging {
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
