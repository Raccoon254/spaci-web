<script lang="ts">
  import { slide } from 'svelte/transition';
  import Mark from '$lib/components/Mark.svelte';

  // The nav is transparent and borderless at the top of the page, and gains a
  // solid background + hairline border once the user scrolls past the hero edge
  // (or when the mobile menu is open).
  let y = 0;
  let w = 0;
  let open = false;
  $: scrolled = y > 8;
  // Close the mobile menu when the viewport grows back to desktop.
  $: if (w > 760 && open) open = false;

  const close = () => (open = false);
</script>

<svelte:window bind:scrollY={y} bind:innerWidth={w} on:keydown={(e) => e.key === 'Escape' && close()} />

<header class="nav" class:solid={scrolled || open}>
  <div class="wrap nav-inner">
    <a class="brand" href="/" aria-label="Spaci home" on:click={close}>
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

    <button
      class="menu-btn"
      on:click={() => (open = !open)}
      aria-label={open ? 'Close menu' : 'Open menu'}
      aria-expanded={open}
    >
      {#if open}
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
      {:else}
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 7h18M3 12h18M3 17h18" /></svg>
      {/if}
    </button>
  </div>

  {#if open}
    <nav class="mobile-menu" aria-label="Mobile" transition:slide={{ duration: 180 }}>
      <a href="/#features" on:click={close}>Features</a>
      <a href="/#storage" on:click={close}>Storage</a>
      <a href="/changelog" on:click={close}>Changelog</a>
      <a href="https://github.com/Raccoon254/spaci" target="_blank" rel="noopener noreferrer" on:click={close}>GitHub</a>
      <a class="btn btn-primary mm-download" href="/download" on:click={close}>Download Spaci</a>
    </nav>
  {/if}
</header>

<style>
  .nav {
    position: sticky;
    top: 0;
    z-index: 50;
    background: transparent;
    border-bottom: 1px solid transparent;
    transition:
      background 0.2s ease,
      border-color 0.2s ease;
  }
  .nav.solid {
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

  /* Hamburger: hidden on desktop, shown when the links collapse. */
  .menu-btn {
    display: none;
    width: 40px;
    height: 40px;
    place-items: center;
    border-radius: 11px;
    border: none;
    background: transparent;
    color: var(--ink);
    transition: background 0.15s ease;
  }
  .menu-btn:hover {
    background: var(--paper-2);
  }

  .mobile-menu {
    display: none;
    flex-direction: column;
    padding: 8px 0 14px;
    border-bottom: 1px solid var(--line);
    background: var(--paper);
  }
  .mobile-menu a:not(.btn) {
    padding: 13px 28px;
    font-size: 16px;
    font-weight: 500;
    color: var(--muted);
  }
  .mobile-menu a:not(.btn):hover {
    color: var(--ink);
    background: var(--paper-2);
  }
  .mm-download {
    margin: 14px 28px 6px;
    height: 48px;
  }
  @media (max-width: 760px) {
    .links {
      display: none;
    }
    .download {
      display: none;
    }
    .menu-btn {
      display: inline-grid;
      margin-left: auto;
    }
    .mobile-menu {
      display: flex;
    }
  }

  @media (max-width: 600px) {
    .mobile-menu a:not(.btn) {
      padding-left: 20px;
      padding-right: 20px;
    }
    .mm-download {
      margin-left: 20px;
      margin-right: 20px;
    }
  }
</style>
