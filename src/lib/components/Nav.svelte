<script lang="ts">
  import Mark from '$lib/components/Mark.svelte';

  // The nav is transparent and borderless at the top of the page, and gains a
  // solid background + hairline border once the user scrolls past the hero edge.
  let y = 0;
  $: scrolled = y > 8;
</script>

<svelte:window bind:scrollY={y} />

<header class="nav" class:scrolled>
  <div class="wrap nav-inner">
    <a class="brand" href="/" aria-label="Spaci home">
      <span class="brand-mark"><Mark size={28} /></span>
      <span class="wordmark">spaci<span class="dot">.</span></span>
    </a>

    <nav class="links" aria-label="Primary">
      <a href="/#features">Features</a>
      <a href="/#storage">Storage</a>
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
    height: 65px;
    background: transparent;
    border-bottom: 1px solid transparent;
    transition:
      background 0.2s ease,
      border-color 0.2s ease;
  }
  .nav.scrolled {
    background: var(--paper);
    border-bottom-color: var(--line);
  }

  .nav-inner {
    height: 65px;
    display: flex;
    align-items: center;
    gap: 28px;
  }

  .brand {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    color: var(--ink);
  }

  /* The mark is the brand accent so it reads as a logo on the dark nav. */
  .brand-mark {
    display: inline-flex;
    color: var(--accent-fg);
  }
  .brand-mark :global(svg) {
    transition: transform 0.5s cubic-bezier(0.2, 0.8, 0.2, 1);
  }
  .brand:hover .brand-mark :global(svg) {
    transform: rotate(60deg);
  }

  .wordmark {
    font-weight: 700;
    font-size: 19px;
    letter-spacing: -0.03em;
  }

  .dot {
    color: var(--accent-fg);
  }

  .links {
    display: flex;
    align-items: center;
    gap: 28px;
    margin-left: auto;
  }

  .links a {
    color: var(--muted);
    font-size: 14.5px;
    font-weight: 500;
    transition: color 0.15s ease;
  }

  .links a:hover {
    color: var(--ink);
  }

  .download {
    height: 40px;
    padding: 0 18px;
    font-size: 14px;
    border-radius: 11px;
  }

  .links + .download {
    margin-left: 0;
  }

  @media (max-width: 760px) {
    .links {
      display: none;
    }
    .download {
      margin-left: auto;
    }
  }
</style>
