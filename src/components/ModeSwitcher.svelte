<script lang="ts">
  import { feed, setMode } from '../lib/feed';
  import { currentPosition, isNative } from '../lib/native';
  import { TOPICS } from '../lib/pool';
  import { showToast } from '../lib/toast';
  import { playTick } from '../lib/sound';
  import type { Mode, Topic } from '../lib/types';

  let { onchange }: { onchange: () => void } = $props();

  let open = $state(false);

  const MODE_LABELS: Record<Mode, string> = {
    foryou: 'For you',
    onthisday: 'On this day',
    topics: 'Topics',
    nearby: 'Near me',
  };

  const label = $derived.by(() => {
    const f = $feed;
    if (f.mode === 'topics' && f.topic) {
      return TOPICS.find((t) => t.id === f.topic)?.label ?? 'Topics';
    }
    return MODE_LABELS[f.mode];
  });

  function pick(mode: Mode, topic: Topic | null = null): void {
    open = false;
    playTick();
    if (mode === 'nearby') {
      void (async () => {
        if (isNative) {
          const coords = await currentPosition();
          if (!coords) {
            showToast('Location denied — showing today instead');
            void setMode('foryou');
            onchange();
            return;
          }
          void setMode('nearby', null, coords);
          onchange();
          showToast('Facts near you');
          return;
        }
        if (!navigator.geolocation) {
          showToast('Location not available');
          return;
        }
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            void setMode('nearby', null, {
              lat: pos.coords.latitude,
              lon: pos.coords.longitude,
            });
            onchange();
            showToast('Facts near you');
          },
          () => {
            showToast('Location denied — showing today instead');
            void setMode('foryou');
            onchange();
          },
          { timeout: 8000 },
        );
      })();
      return;
    }
    void setMode(mode, topic);
    onchange();
  }
</script>

<div class="wrap">
  <button class="pill" aria-haspopup="dialog" aria-expanded={open} onclick={() => (open = !open)}>
    {label}
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  </button>

  {#if open}
    <button class="scrim" aria-label="Close" onclick={() => (open = false)}></button>
    <div class="sheet" role="dialog" aria-label="Discovery modes">
      <div class="modes">
        {#each Object.entries(MODE_LABELS) as [mode, text] (mode)}
          {#if mode !== 'topics'}
            <button class="row" class:active={$feed.mode === mode} onclick={() => pick(mode as Mode)}>
              <span>{text}</span>
              {#if $feed.mode === mode}<span class="check">✓</span>{/if}
            </button>
          {/if}
        {/each}
      </div>
      <div class="divider"></div>
      <div class="topics-header">Topics</div>
      <div class="topics">
        {#each TOPICS as t (t.id)}
          <button
            class="chip"
            class:active={$feed.topic === t.id && $feed.mode === 'topics'}
            onclick={() => pick('topics', t.id)}
          >
            {t.emoji} {t.label}
          </button>
        {/each}
      </div>
    </div>
  {/if}
</div>

<style>
  .wrap {
    position: relative;
  }
  .pill {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 9px 14px;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.08);
    backdrop-filter: blur(8px);
    border: 1px solid var(--hairline);
    font-size: 0.85rem;
    font-weight: 700;
  }
  .scrim {
    position: fixed;
    inset: 0;
    z-index: 40;
    background: rgba(0, 0, 0, 0.5);
  }
  .sheet {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 41;
    background: var(--panel);
    backdrop-filter: blur(16px);
    border-radius: 24px 24px 0 0;
    padding: 20px 20px calc(env(safe-area-inset-bottom, 0px) + 24px);
    animation: sheet-up 0.28s var(--ease-spring);
  }
  @keyframes sheet-up {
    from { transform: translateY(100%); }
    to { transform: none; }
  }
  .modes {
    display: flex;
    flex-direction: column;
  }
  .row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 14px 8px;
    font-size: 1.05rem;
    font-weight: 600;
    border-radius: 12px;
  }
  .row:active {
    background: rgba(255, 255, 255, 0.06);
  }
  .row.active {
    color: var(--accent);
  }
  .check {
    font-weight: 800;
  }
  .divider {
    height: 1px;
    background: var(--hairline);
    margin: 12px 0;
  }
  .topics-header {
    font-size: 0.75rem;
    font-weight: 800;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: rgba(250, 250, 250, 0.5);
    margin-bottom: 10px;
  }
  .topics {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .chip {
    padding: 9px 14px;
    border-radius: 999px;
    border: 1px solid var(--hairline);
    font-size: 0.88rem;
    font-weight: 600;
    background: rgba(255, 255, 255, 0.04);
  }
  .chip.active {
    border-color: var(--accent);
    color: var(--accent);
    background: var(--accent-dim);
  }
</style>
