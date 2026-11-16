<script lang="ts">
  import type { Fact } from '../lib/types';
  import { shareFact } from '../lib/share';
  import { showToast } from '../lib/toast';
  import { playPop } from '../lib/sound';

  let {
    fact,
    screenIndex,
  }: {
    fact: Fact;
    screenIndex: number;
  } = $props();

  const isHook = $derived(screenIndex === 0);
  const isPayoff = $derived(screenIndex >= fact.screens.length + 1);
  const story = $derived(fact.screens[screenIndex - 1] ?? '');

  const hookWords = $derived(fact.hook.split(/\s+/).filter(Boolean));
  let hookShown = $state(0);

  $effect(() => {
    if (hookWords.length === 0) {
      hookShown = hookWords.length;
      return;
    }
    const reduced =
      typeof matchMedia === 'function' &&
      matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      hookShown = hookWords.length;
      return;
    }
    hookShown = 0;
    const timers: ReturnType<typeof setTimeout>[] = [];
    for (let i = 0; i < hookWords.length; i++) {
      timers.push(
        setTimeout(
          () => {
            hookShown = i + 1;
          },
          i * 190,
        ),
      );
    }
    return () => {
      for (const t of timers) clearTimeout(t);
    };
  });

  async function share(): Promise<void> {
    playPop();
    const result = await shareFact(fact);
    if (result === 'copied') showToast('Link copied');
    else if (result === 'failed') showToast('Sharing unavailable');
  }
</script>

<article class="card" class:rare={fact.rare} aria-label={fact.title}>
  <div class="bg" class:nograd={!fact.image}>
    {#if fact.image}
      <img src={fact.image} alt="" />
    {/if}
  </div>
  <div class="shade"></div>
  {#if fact.rare}
    <div class="rare-frame"></div>
  {/if}
  <div class="content">
    {#if isHook}
      <div class="hook-block">
        <span class="topic">{fact.title}</span>
        <h1 class="hook" aria-label={fact.hook}>
          {#each hookWords as word, i (i)}
            <span class="hook-word" class:shown={i < hookShown} aria-hidden="true">{word}</span>{' '}
          {/each}
        </h1>
      </div>
      <div class="swipe-hint" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="18 15 12 9 6 15" />
        </svg>
      </div>
    {:else if isPayoff}
      <div class="payoff">
        {#if fact.bonus}
          <div class="bonus">
            <span class="bonus-label">Wait, what?</span>
            <p>{fact.bonus}</p>
          </div>
        {/if}
        <p class="payoff-title">{fact.title}</p>
        <div class="payoff-actions">
          <a class="btn primary" href={fact.articleUrl} target="_blank" rel="noopener noreferrer">
            Read on Wikipedia
          </a>
          <button class="btn ghost" onclick={share}>Share</button>
        </div>
      </div>
    {:else}
      <p class="story">{story}</p>
    {/if}
  </div>
</article>

<style>
  .card {
    position: absolute;
    inset: 0;
    overflow: hidden;
    background: var(--bg);
  }
  .bg {
    position: absolute;
    inset: 0;
  }
  .bg img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    animation: kenburns 26s var(--ease-spring) infinite alternate;
  }
  .bg.nograd {
    background:
      radial-gradient(120% 90% at 20% 10%, #2b2417 0%, transparent 60%),
      radial-gradient(120% 90% at 85% 85%, #1c2230 0%, transparent 55%),
      var(--bg);
  }
  @keyframes kenburns {
    from {
      transform: scale(1) translateY(0);
    }
    to {
      transform: scale(1.12) translateY(-2.5%);
    }
  }
  .shade {
    position: absolute;
    inset: 0;
    background:
      linear-gradient(to bottom, rgba(10, 10, 12, 0.5) 0%, rgba(10, 10, 12, 0) 26%),
      linear-gradient(to top, rgba(10, 10, 12, 0.94) 0%, rgba(10, 10, 12, 0.42) 42%, rgba(10, 10, 12, 0) 68%);
  }
  .rare-frame {
    position: absolute;
    inset: 8px;
    border: 1.5px solid rgba(255, 180, 84, 0.75);
    border-radius: 20px;
    box-shadow:
      inset 0 0 24px rgba(255, 180, 84, 0.18),
      0 0 32px rgba(255, 180, 84, 0.12);
    pointer-events: none;
  }
  .content {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    padding: 24px 84px calc(env(safe-area-inset-bottom, 0px) + 96px) 22px;
  }
  .hook-block {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .topic {
    color: var(--muted);
    font-size: 0.85rem;
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }
  .hook {
    margin: 0;
    font-size: clamp(2.1rem, 9vw, 4rem);
    font-weight: 900;
    line-height: 1.04;
    letter-spacing: -0.025em;
    text-wrap: balance;
    text-shadow: 0 2px 24px rgba(0, 0, 0, 0.6);
  }
  .hook-word {
    display: inline-block;
    opacity: 0;
  }
  .hook-word.shown {
    animation: word-in 0.18s var(--ease-spring) both;
  }
  @keyframes word-in {
    from {
      transform: translateY(0.35em) scale(0.9);
      opacity: 0;
    }
    to {
      transform: none;
      opacity: 1;
    }
  }
  .swipe-hint {
    position: absolute;
    bottom: calc(env(safe-area-inset-bottom, 0px) + 26px);
    left: 50%;
    transform: translateX(-50%);
    color: var(--faint);
    animation: float 1.8s ease-in-out infinite;
  }
  @keyframes float {
    0%, 100% { transform: translate(-50%, 0); opacity: 0.7; }
    50% { transform: translate(-50%, -6px); opacity: 1; }
  }
  .story {
    margin: 0;
    font-size: clamp(1.2rem, 4.6vw, 1.7rem);
    font-weight: 600;
    line-height: 1.35;
    text-wrap: pretty;
    text-shadow: 0 2px 18px rgba(0, 0, 0, 0.65);
  }
  .payoff {
    display: flex;
    flex-direction: column;
    gap: 18px;
  }
  .payoff-title {
    margin: 0;
    font-size: 1.2rem;
    font-weight: 800;
    line-height: 1.2;
    color: var(--muted);
  }
  .bonus {
    border: 1px solid var(--hairline);
    border-radius: 16px;
    padding: 14px 16px;
    background: rgba(255, 255, 255, 0.05);
    backdrop-filter: blur(8px);
  }
  .bonus-label {
    color: var(--accent);
    font-size: 0.78rem;
    font-weight: 800;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }
  .bonus p {
    margin: 6px 0 0;
    font-size: 0.98rem;
    line-height: 1.4;
    color: var(--muted);
  }
  .payoff-actions {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
  }
  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 12px 20px;
    border-radius: 999px;
    font-weight: 700;
    font-size: 0.95rem;
    text-decoration: none;
    transition: transform 0.15s var(--ease-spring);
  }
  .btn:active {
    transform: scale(0.96);
  }
  .btn.primary {
    background: var(--accent);
    color: #1a1206;
  }
  .btn.ghost {
    border: 1px solid var(--hairline);
    background: rgba(255, 255, 255, 0.07);
    color: var(--text);
  }
</style>
