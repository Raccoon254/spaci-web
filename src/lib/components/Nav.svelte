<script lang="ts">
  import Mark from '$lib/components/Mark.svelte';
</script>

<header class="nav">
  <div class="wrap nav-inner">
    <a class="brand" href="/" aria-label="Spaci home">
      <Mark size={26} />
      <span class="wordmark">spaci<span class="dot">.</span></span>
    </a>

    <nav class="links" aria-label="Primary">
      <a href="/#features">Features</a>
      <a href="/changelog">Changelog</a>
      <a href="https://github.com/Raccoon254/spaci" target="_blank" rel="noopener noreferrer">GitHub</a>
    </nav>

    <a class="btn btn-primary download" href="/download">Download</a>
  </div>
</header>

<style>
  .nav {
    position: sticky;
    top: 0;
    z-index: 50;
    height: 64px;
    background: rgba(248, 243, 240, 0.8);
    backdrop-filter: saturate(1.4) blur(12px);
    -webkit-backdrop-filter: saturate(1.4) blur(12px);
    border-bottom: 1px solid var(--line);
  }

  .nav-inner {
    height: 64px;
    display: flex;
    align-items: center;
    gap: 28px;
  }

  .brand {
    display: inline-flex;
    align-items: center;
    gap: 9px;
    color: var(--ink);
  }

  .wordmark {
    font-weight: 600;
    font-size: 19px;
    letter-spacing: -0.02em;
  }

  .dot {
    color: var(--accent);
  }

  .links {
    display: flex;
    align-items: center;
    gap: 26px;
    margin-left: auto;
  }

  .links a {
    color: var(--muted);
    font-size: 15px;
    transition: color 0.15s ease;
  }

  .links a:hover {
    color: var(--ink);
  }

  .download {
    height: 40px;
    padding: 0 18px;
    font-size: 14px;
  }

  .links + .download {
    margin-left: 0;
  }

  @media (max-width: 720px) {
    .links {
      display: none;
    }
    .download {
      margin-left: auto;
    }
  }
</style>
