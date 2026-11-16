<script lang="ts">
  import {
    getStats,
    getLikedFacts,
    soundEnabled,
    setSound,
    clearAllData,
    toggleLike,
    type Stats,
    type LikedEntry,
  } from '../lib/storage';
  import { showToast } from '../lib/toast';

  let { onopen }: { onopen: (id: string) => void } = $props();

  let open = $state(false);
  let stats = $state<Stats>(getStats());
  let sound = $state(soundEnabled());
  let liked = $state<LikedEntry[]>([]);

  $effect(() => {
    const id = setInterval(() => {
      stats = getStats();
    }, 15000);
    return () => clearInterval(id);
  });

  function toggle(): void {
    open = !open;
    if (open) {
      stats = getStats();
      liked = getLikedFacts();
    }
  }

  function removeLike(entry: LikedEntry): void {
    toggleLike(entry.fact);
    liked = liked.filter((e) => e.fact.id !== entry.fact.id);
    stats = getStats();
  }

  function openFact(id: string): void {
    open = false;
    onopen(id);
  }

  function toggleSound(): void {
    sound = !sound;
    setSound(sound);
    if (sound) showToast('Sound on');
  }

  function clear(): void {
    clearAllData();
    stats = getStats();
    showToast('Local data cleared');
  }
</script>

<div class="wrap">
  <button class="flame" aria-haspopup="dialog" aria-expanded={open} aria-label="Your stats" onclick={toggle}>
    <span class="emoji">🔥</span>
    <span class="count">{stats.streak}</span>
  </button>

  {#if open}
    <button class="scrim" aria-label="Close" onclick={toggle}></button>
    <div class="sheet" role="dialog" aria-label="Your stats">
      <div class="row">
        <div class="stat">
          <span class="value">{stats.streak}</span>
          <span class="label">day streak</span>
        </div>
        <div class="stat">
          <span class="value">{stats.todayCount}</span>
          <span class="label">today</span>
        </div>
        <div class="stat">
          <span class="value">{stats.weekCount}</span>
          <span class="label">this week</span>
        </div>
        <div class="stat">
          <span class="value">{stats.likeCount}</span>
          <span class="label">liked</span>
        </div>
      </div>
      <div class="week" aria-label="Facts learned per day, last 7 days">
        {#each stats.week as d (d.day)}
          <div class="bar-wrap" title={d.day}>
            <div
              class="bar"
              style:height="{Math.min(100, (d.count / Math.max(1, Math.max(...stats.week.map((w) => w.count)))) * 100)}%"
            ></div>
          </div>
        {/each}
      </div>
      <div class="liked" aria-label="Liked facts">
        <span class="section-title">Liked facts</span>
        {#if liked.length}
          <div class="liked-list">
            {#each liked as e (e.fact.id)}
              <div class="liked-row">
                <div class="liked-info">
                  <button class="liked-title" onclick={() => openFact(e.fact.id)}>
                    {e.fact.title}
                  </button>
                  <span class="liked-hook">{e.fact.hook}</span>
                  <button class="unlike" aria-label={`Remove ${e.fact.title} from likes`} onclick={() => removeLike(e)}>
                    ♥ Unlike
                  </button>
                </div>
              </div>
            {/each}
          </div>
        {:else}
          <p class="empty">No likes yet — double-tap a fact you enjoy.</p>
        {/if}
      </div>
      <div class="settings">
        <button class="setting" onclick={toggleSound} aria-pressed={sound}>
          <span>Sound</span>
          <span class="toggle" class:on={sound}><span class="knob"></span></span>
        </button>
        <button class="setting danger" onclick={clear}>
          <span>Clear local data</span>
        </button>
      </div>
      <p class="privacy">Everything stays on this device. No account, no tracking.</p>
      <div class="about">
        <a
          class="repo"
          href="https://github.com/judemont/FactsFlow"
          target="_blank"
          rel="noopener noreferrer"
        >
          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
            <path
              d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.56 0-.27-.01-1.17-.02-2.12-3.2.7-3.88-1.36-3.88-1.36-.52-1.33-1.28-1.68-1.28-1.68-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.03 1.76 2.69 1.25 3.35.96.1-.75.4-1.25.72-1.54-2.55-.29-5.24-1.28-5.24-5.68 0-1.26.45-2.28 1.18-3.09-.12-.29-.51-1.46.11-3.05 0 0 .96-.31 3.15 1.18a10.9 10.9 0 0 1 2.87-.39c.97 0 1.95.13 2.87.39 2.19-1.49 3.15-1.18 3.15-1.18.62 1.59.23 2.76.11 3.05.73.81 1.18 1.83 1.18 3.09 0 4.41-2.69 5.38-5.25 5.67.41.35.77 1.05.77 2.12 0 1.53-.01 2.76-.01 3.14 0 .31.21.67.8.56A10.52 10.52 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5Z"
            />
          </svg>
          <span>FactsFlow on GitHub</span>
        </a>
        <p class="made">
          Made by <a class="jdm" href="https://jdm.coffee" target="_blank" rel="noopener noreferrer">JdM</a>
        </p>
        <p class="copyright">© {new Date().getFullYear()} JdM · Facts from English Wikipedia (CC BY-SA)</p>
      </div>
    </div>
  {/if}
</div>

<style>
  .wrap {
    position: relative;
  }
  .flame {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 8px 12px;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.08);
    backdrop-filter: blur(8px);
    border: 1px solid var(--hairline);
    font-weight: 800;
    font-size: 0.9rem;
  }
  .emoji {
    font-size: 1rem;
  }
  .count {
    color: var(--accent);
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
    padding: 24px 20px calc(env(safe-area-inset-bottom, 0px) + 24px);
    animation: sheet-up 0.28s var(--ease-spring);
    max-height: 82vh;
    overflow-y: auto;
  }
  @keyframes sheet-up {
    from { transform: translateY(100%); }
    to { transform: none; }
  }
  .row {
    display: flex;
    justify-content: space-between;
    gap: 8px;
    margin-bottom: 20px;
  }
  .stat {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    flex: 1;
  }
  .value {
    font-size: 1.5rem;
    font-weight: 900;
  }
  .stat:first-child .value {
    color: var(--accent);
  }
  .label {
    font-size: 0.75rem;
    color: var(--muted);
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }
  .week {
    display: flex;
    align-items: flex-end;
    gap: 8px;
    height: 72px;
    margin-bottom: 20px;
  }
  .bar-wrap {
    flex: 1;
    height: 100%;
    display: flex;
    align-items: flex-end;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 8px;
    overflow: hidden;
  }
  .bar {
    width: 100%;
    background: var(--accent);
    border-radius: 8px 8px 0 0;
    min-height: 3px;
    transition: height 0.4s var(--ease-spring);
  }
  .settings {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .liked {
    margin-bottom: 20px;
  }
  .section-title {
    display: block;
    font-size: 0.75rem;
    font-weight: 800;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--muted);
    margin-bottom: 8px;
  }
  .liked-list {
    max-height: 200px;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .liked-row {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 10px;
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.04);
  }
  .liked-info {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .liked-title {
    font-size: 0.92rem;
    font-weight: 700;
    color: var(--text);
    text-align: left;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 100%;
  }
  .liked-title:hover {
    text-decoration: underline;
  }
  .liked-hook {
    font-size: 0.8rem;
    color: var(--muted);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .unlike {
    align-self: flex-start;
    color: var(--accent);
    font-size: 0.8rem;
    font-weight: 700;
    padding: 2px 8px;
    margin: 2px 0 0 -8px;
    border-radius: 999px;
  }
  .unlike:active {
    transform: scale(0.85);
  }
  .empty {
    margin: 0;
    font-size: 0.85rem;
    color: var(--faint);
  }
  .setting {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 13px 8px;
    font-size: 0.98rem;
    font-weight: 600;
    border-radius: 12px;
  }
  .setting:active {
    background: rgba(255, 255, 255, 0.06);
  }
  .danger {
    color: #ff8c8c;
  }
  .toggle {
    width: 44px;
    height: 26px;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.14);
    position: relative;
    transition: background 0.2s;
  }
  .toggle.on {
    background: var(--accent);
  }
  .knob {
    position: absolute;
    top: 3px;
    left: 3px;
    width: 20px;
    height: 20px;
    border-radius: 999px;
    background: #fff;
    transition: transform 0.2s var(--ease-spring);
  }
  .toggle.on .knob {
    transform: translateX(18px);
  }
  .privacy {
    margin: 16px 0 0;
    font-size: 0.8rem;
    color: var(--faint);
    text-align: center;
  }
  .about {
    margin-top: 18px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
  }
  .repo {
    display: inline-flex;
    align-items: center;
    gap: 9px;
    padding: 11px 20px;
    border-radius: 999px;
    border: 1px solid var(--hairline);
    background: rgba(255, 255, 255, 0.07);
    color: var(--text);
    font-weight: 700;
    font-size: 0.92rem;
    text-decoration: none;
    transition: transform 0.15s var(--ease-spring), border-color 0.15s;
  }
  .repo:hover {
    border-color: var(--accent);
    color: var(--accent);
  }
  .repo:active {
    transform: scale(0.97);
  }
  .made {
    margin: 0;
    font-size: 0.85rem;
    color: var(--muted);
  }
  .jdm {
    color: var(--text);
    font-weight: 800;
    text-decoration: none;
    border-bottom: 1.5px solid var(--accent);
  }
  .copyright {
    margin: 0;
    font-size: 0.72rem;
    color: var(--faint);
    text-align: center;
  }
</style>
