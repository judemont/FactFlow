<script lang="ts">
  import { toasts } from '../lib/toast';
</script>

{#if $toasts.length}
  <div class="toasts" role="status" aria-live="polite">
    {#each $toasts as t (t.id)}
      <div class="toast">{t.text}</div>
    {/each}
  </div>
{/if}

<style>
  .toasts {
    position: fixed;
    top: calc(env(safe-area-inset-top, 0px) + 64px);
    left: 0;
    right: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    z-index: 60;
    pointer-events: none;
  }
  .toast {
    background: var(--panel);
    border: 1px solid var(--hairline);
    color: var(--text);
    font-size: 0.9rem;
    font-weight: 600;
    padding: 10px 18px;
    border-radius: 999px;
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.5);
    animation: toast-in 0.25s var(--ease-spring);
  }
  @keyframes toast-in {
    from {
      opacity: 0;
      transform: translateY(-8px) scale(0.96);
    }
    to {
      opacity: 1;
      transform: none;
    }
  }
</style>
