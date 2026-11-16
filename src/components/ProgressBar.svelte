<script lang="ts">
  let { segments, active }: { segments: number; active: number } = $props();
</script>

<div class="progress" aria-hidden="true">
  {#each Array(segments) as _, i (i)}
    <div class="seg" class:on={i <= active} class:current={i === active}></div>
  {/each}
</div>

<style>
  .progress {
    position: absolute;
    top: calc(env(safe-area-inset-top, 0px) + 10px);
    left: 14px;
    right: 14px;
    display: flex;
    gap: 4px;
    z-index: 20;
  }
  .seg {
    flex: 1;
    height: 3px;
    border-radius: 2px;
    background: rgba(255, 255, 255, 0.24);
    overflow: hidden;
  }
  .seg.on {
    background: rgba(255, 255, 255, 0.92);
  }
  .seg.current {
    animation: pulse 1.6s ease-in-out infinite;
  }
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.65; }
  }
</style>
