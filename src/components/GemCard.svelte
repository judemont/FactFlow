<script lang="ts">
  import type { Gem } from '../lib/types';
  import { shareGem } from '../lib/share';
  import { showToast } from '../lib/toast';
  import { playPop } from '../lib/sound';

  let {
    gem,
    screenIndex,
    preview = false,
  }: {
    gem: Gem;
    screenIndex: number;
    preview?: boolean;
  } = $props();

  const isHook = $derived(screenIndex === 0);
  const isPayoff = $derived(screenIndex >= gem.screens.length + 1);
  const story = $derived(gem.screens[screenIndex - 1] ?? '');

  async function share(): Promise<void> {
    playPop();
    const result = await shareGem(gem);
    if (result === 'copied') showToast('Link copied');
    else if (result === 'failed') showToast('Sharing unavailable');
  }
</script>

<article class="card" class:preview class:rare={gem.rare} aria-label={gem.title}>
  <div class="bg" class:nograd={!gem.image}>
    {#if gem.image}
      <img src={gem.image} alt="" />
    {/if}
  </div>
  <div class="shade"></div>
  {#if gem.rare}
    <div class="rare-frame"></div>
  {/if}
  <div class="content">
    {#if isHook}
      <div class="hook-block">
        <span class="topic">{gem.title}</span>
        <h1 class="hook">{gem.hook}</h1>
      </div>
      <div class="swipe-hint" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="18 15 12 9 6 15" />
        </svg>
      </div>
    {:else if isPayoff}
      <div class="payoff">
        <p class="payoff-line">You now know something 99% of people don't.</p>
        {#if gem.bonus}
          <div class="bonus">
            <span class="bonus-label">Wait, what?</span>
            <p>{gem.bonus}</p>
          </div>
        {/if}
        <div class="payoff-actions">
          <button class="btn primary" onclick={share}>Share the card</button>
          <a class="btn ghost" href={gem.articleUrl} target="_blank" rel="noopener noreferrer">
            Read on Wikipedia
          </a>
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
  .card.preview {
    transform: scale(0.94) translateY(20px);
    opacity: 0.55;
    border-radius: 24px;
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
    padding: 24px 22px calc(env(safe-area-inset-bottom, 0px) + 96px);
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
  .payoff-line {
    margin: 0;
    font-size: clamp(1.5rem, 6vw, 2.3rem);
    font-weight: 900;
    line-height: 1.12;
    letter-spacing: -0.02em;
    text-shadow: 0 2px 20px rgba(0, 0, 0, 0.6);
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
