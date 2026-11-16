<script lang="ts">
  import {
    getStats,
    getLikedGems,
    soundEnabled,
    setSound,
    clearAllData,
    toggleLike,
    type Stats,
    type LikedEntry,
  } from '../lib/storage';
  import { showToast } from '../lib/toast';

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
      liked = getLikedGems();
    }
  }

  function removeLike(entry: LikedEntry): void {
    toggleLike(entry.gem);
    liked = liked.filter((e) => e.gem.id !== entry.gem.id);
    stats = getStats();
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
      <div class="week" aria-label="Gems learned per day, last 7 days">
        {#each stats.week as d (d.day)}
          <div class="bar-wrap" title={d.day}>
            <div
              class="bar"
              style:height="{Math.min(100, (d.count / Math.max(1, Math.max(...stats.week.map((w) => w.count)))) * 100)}%"
            ></div>
          </div>
        {/each}
      </div>
      <div class="liked" aria-label="Liked gems">
        <span class="section-title">Liked gems</span>
        {#if liked.length}
          <div class="liked-list">
            {#each liked as e (e.gem.id)}
              <div class="liked-row">
                <div class="liked-info">
                  <a class="liked-title" href={e.gem.articleUrl} target="_blank" rel="noopener noreferrer">
                    {e.gem.title}
                  </a>
                  <span class="liked-hook">{e.gem.hook}</span>
                </div>
                <button class="unlike" aria-label={`Remove ${e.gem.title} from likes`} onclick={() => removeLike(e)}>
                  ♥
                </button>
              </div>
            {/each}
          </div>
        {:else}
          <p class="empty">No likes yet — double-tap a gem you enjoy.</p>
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
    text-decoration: none;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
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
    color: var(--accent);
    font-size: 1.1rem;
    padding: 6px;
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
</style>
