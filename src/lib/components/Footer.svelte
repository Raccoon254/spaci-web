<script lang="ts">
  import Mark from '$lib/components/Mark.svelte';
</script>

<footer class="footer">
  <div class="wrap">
    <div class="top">
      <div class="brand-col">
        <a class="brand" href="/" aria-label="Spaci home">
          <span class="brand-mark"><Mark size={26} /></span>
          <span class="wordmark">spaci<span class="dot">.</span></span>
        </a>
        <p class="tagline">Reclaim your disk from build artifacts.</p>
      </div>

      <div class="cols">
        <div class="col">
          <span class="col-title">Product</span>
          <a href="/download">Download</a>
          <a href="/changelog">Changelog</a>
          <a href="/#features">Features</a>
        </div>
        <div class="col">
          <span class="col-title">Company</span>
          <a href="https://kentom.co.ke" target="_blank" rel="noopener noreferrer">kentom.co.ke</a>
          <a href="https://stevetom.vercel.app" target="_blank" rel="noopener noreferrer">stevetom.vercel.app</a>
          <a href="https://github.com/Raccoon254/spaci" target="_blank" rel="noopener noreferrer">GitHub</a>
        </div>
      </div>
    </div>

    <div class="bottom">
      <span>© 2026 Spaci. Built by <a href="https://kentom.co.ke" target="_blank" rel="noopener noreferrer">kentom.co.ke</a>.</span>
      <a href="https://github.com/Raccoon254/spaci" target="_blank" rel="noopener noreferrer">Open source on GitHub</a>
    </div>
  </div>
</footer>

<style>
  .footer {
    border-top: 1px solid var(--line);
    padding: 48px 0;
    margin-top: 24px;
  }

  .top {
    display: flex;
    justify-content: space-between;
    gap: 40px;
    flex-wrap: wrap;
  }

  .brand {
    display: inline-flex;
    align-items: center;
    gap: 9px;
    color: var(--ink);
  }

  .brand-mark {
    display: inline-flex;
    color: var(--accent);
  }

  .wordmark {
    font-weight: 600;
    font-size: 17px;
    letter-spacing: -0.02em;
  }

  .dot {
    color: var(--accent);
  }

  .tagline {
    margin-top: 12px;
    color: var(--muted);
    font-size: 14px;
    max-width: 260px;
  }

  .cols {
    display: flex;
    gap: 64px;
    flex-wrap: wrap;
  }

  .col {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .col-title {
    font-size: 13px;
    font-weight: 600;
    color: var(--ink);
    margin-bottom: 2px;
  }

  .col a {
    color: var(--muted);
    font-size: 14px;
    transition: color 0.15s ease;
  }

  .col a:hover {
    color: var(--ink);
  }

  .bottom {
    margin-top: 40px;
    padding-top: 24px;
    border-top: 1px solid var(--line);
    display: flex;
    justify-content: space-between;
    gap: 16px;
    flex-wrap: wrap;
    font-size: 13px;
    color: var(--muted);
  }

  .bottom a {
    color: var(--muted);
    transition: color 0.15s ease;
  }

  .bottom a:hover {
    color: var(--ink);
  }

  @media (max-width: 600px) {
    .cols {
      gap: 40px;
    }
  }
</style>
