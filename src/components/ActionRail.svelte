<script lang="ts">
  import type { Fact } from '../lib/types';
  import { shareFact } from '../lib/share';
  import { showToast } from '../lib/toast';
  import { playPop } from '../lib/sound';

  let {
    fact,
    liked,
    onlike,
  }: {
    fact: Fact;
    liked: boolean;
    onlike: (x?: number, y?: number) => void;
  } = $props();

  async function share(): Promise<void> {
    playPop();
    const result = await shareFact(fact);
    if (result === 'copied') showToast('Link copied');
    else if (result === 'failed') showToast('Sharing unavailable');
  }
</script>

<div class="rail">
  <button class="act" class:liked aria-label={liked ? 'Unlike' : 'Like'} aria-pressed={liked} onclick={() => onlike()}>
    <svg viewBox="0 0 24 24" width="26" height="26" fill={liked ? 'currentColor' : 'none'} stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  </button>
  <button class="act" aria-label="Share" onclick={share}>
    <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
    </svg>
  </button>
  <a class="act" href={fact.articleUrl} target="_blank" rel="noopener noreferrer" aria-label="Read the full article on Wikipedia">
    <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <line x1="7" y1="17" x2="17" y2="7" /><polyline points="7 7 17 7 17 17" />
    </svg>
  </a>
</div>

<style>
  .rail {
    position: absolute;
    right: 10px;
    bottom: 110px;
    display: flex;
    flex-direction: column;
    gap: 18px;
    z-index: 20;
  }
  .act {
    width: 46px;
    height: 46px;
    display: grid;
    place-items: center;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.08);
    backdrop-filter: blur(8px);
    color: var(--text);
    transition: transform 0.15s var(--ease-spring), background 0.15s;
  }
  .act:active {
    transform: scale(0.88);
  }
  .act.liked {
    color: var(--accent);
    background: var(--accent-dim);
  }
  a.act {
    text-decoration: none;
  }
</style>
