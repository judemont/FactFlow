<div class="skeleton" aria-hidden="true">
  <div class="shimmer line title"></div>
  <div class="shimmer line"></div>
  <div class="shimmer line short"></div>
  <div class="shimmer pill"></div>
</div>

<style>
  .skeleton {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    gap: 16px;
    padding: 32px 24px 96px;
  }
  .shimmer {
    background: linear-gradient(100deg, rgba(255,255,255,0.06) 40%, rgba(255,255,255,0.14) 50%, rgba(255,255,255,0.06) 60%);
    background-size: 200% 100%;
    animation: shimmer 1.4s infinite linear;
    border-radius: 12px;
  }
  .line {
    height: 28px;
    width: 78%;
  }
  .line.title {
    height: 52px;
    width: 92%;
  }
  .line.short {
    width: 56%;
  }
  .pill {
    height: 40px;
    width: 40px;
    border-radius: 999px;
    align-self: flex-end;
    margin-top: -120px;
  }
  @keyframes shimmer {
    from { background-position: 200% 0; }
    to { background-position: -200% 0; }
  }
</style>
