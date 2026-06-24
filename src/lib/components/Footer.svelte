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
        <p class="tagline">Reclaim your disk from build artifacts. Free and open source.</p>
        <a
          class="gh"
          href="https://github.com/Raccoon254/spaci"
          target="_blank"
          rel="noopener noreferrer"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path
              d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"
            />
          </svg>
          Star on GitHub
        </a>
      </div>

      <div class="cols">
        <div class="col">
          <span class="col-title">Product</span>
          <a href="/download">Download</a>
          <a href="/changelog">Changelog</a>
          <a href="/#features">Features</a>
          <a href="/#storage">Storage breakdown</a>
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
      <span class="platforms mono">macOS · Windows · Linux</span>
    </div>
  </div>
</footer>

<style>
  .footer {
    border-top: 1px solid var(--line);
    padding: 60px 0 48px;
    margin-top: 40px;
  }

  .top {
    display: flex;
    justify-content: space-between;
    gap: 48px;
    flex-wrap: wrap;
  }

  .brand {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    color: var(--ink);
  }

  .brand-mark {
    display: inline-flex;
    color: var(--accent-fg);
  }

  .wordmark {
    font-weight: 700;
    font-size: 18px;
    letter-spacing: -0.03em;
  }

  .dot {
    color: var(--accent-fg);
  }

  .tagline {
    margin-top: 14px;
    color: var(--muted);
    font-size: 14px;
    max-width: 280px;
  }

  .gh {
    margin-top: 18px;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    height: 38px;
    padding: 0 15px;
    border-radius: 10px;
    border: 1px solid var(--line-2);
    color: var(--muted);
    font-size: 13.5px;
    font-weight: 500;
    transition: border-color 0.15s ease, color 0.15s ease;
  }
  .gh:hover {
    border-color: var(--muted-2);
    color: var(--ink);
  }

  .cols {
    display: flex;
    gap: 72px;
    flex-wrap: wrap;
  }

  .col {
    display: flex;
    flex-direction: column;
    gap: 11px;
  }

  .col-title {
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--muted-2);
    margin-bottom: 3px;
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
    margin-top: 48px;
    padding-top: 24px;
    border-top: 1px solid var(--line);
    display: flex;
    justify-content: space-between;
    gap: 16px;
    flex-wrap: wrap;
    font-size: 13px;
    color: var(--muted-2);
  }

  .bottom a {
    color: var(--muted);
    transition: color 0.15s ease;
  }
  .bottom a:hover {
    color: var(--ink);
  }
  .platforms {
    letter-spacing: 0.02em;
  }

  @media (max-width: 600px) {
    .cols {
      gap: 48px;
    }
  }
</style>
