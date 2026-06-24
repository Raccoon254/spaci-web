<script lang="ts">
  import { onMount } from 'svelte';
  import type { Release } from '$lib/releases';

  export let release: Release;

  // Dismissal is remembered per-version, so a strip the user closed stays
  // closed, but the next release brings it back. Server renders it visible;
  // onMount hides it again if this exact version was already dismissed.
  let dismissed = false;
  const key = 'spaci:strip-dismissed';

  onMount(() => {
    try {
      dismissed = localStorage.getItem(key) === release.version;
    } catch {
      dismissed = false;
    }
  });

  function close() {
    dismissed = true;
    try {
      localStorage.setItem(key, release.version);
    } catch {
      /* private mode, ignore */
    }
  }

  $: headline = release.added[0] ?? release.summary;
</script>

{#if !dismissed}
  <div class="strip" role="region" aria-label="New release announcement">
    <a class="strip-inner" href="/changelog">
      <span class="pulse" aria-hidden="true"></span>
      <span class="badge">New</span>
      <span class="ver mono">v{release.version}</span>
      <span class="sep" aria-hidden="true"></span>
      <span class="headline">{headline}</span>
      <span class="cta">Read the changelog<span class="arrow" aria-hidden="true">→</span></span>
    </a>
    <button class="close" on:click={close} aria-label="Dismiss announcement">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round">
        <path d="M6 6l12 12M18 6L6 18" />
      </svg>
    </button>
  </div>
{/if}

<style>
  .strip {
    position: relative;
    z-index: 60;
    display: flex;
    align-items: center;
    background: var(--accent);
    color: var(--on-accent);
    border-bottom: 1px solid rgba(255, 255, 255, 0.14);
  }

  .strip-inner {
    flex: 1;
    min-width: 0;
    max-width: var(--maxw);
    margin: 0 auto;
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 9px 18px 9px 28px;
    font-size: 13.5px;
  }

  .pulse {
    width: 8px;
    height: 8px;
    border-radius: 999px;
    background: #fff;
    flex: none;
    box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.7);
    animation: strip-pulse 2.4s ease-out infinite;
  }
  @keyframes strip-pulse {
    0% {
      box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.55);
    }
    70% {
      box-shadow: 0 0 0 7px rgba(255, 255, 255, 0);
    }
    100% {
      box-shadow: 0 0 0 0 rgba(255, 255, 255, 0);
    }
  }

  .badge {
    flex: none;
    font-size: 10.5px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    background: rgba(255, 255, 255, 0.18);
    padding: 2px 8px;
    border-radius: 999px;
  }

  .ver {
    flex: none;
    font-size: 12.5px;
    font-weight: 500;
    opacity: 0.92;
  }

  .sep {
    width: 1px;
    height: 14px;
    background: rgba(255, 255, 255, 0.28);
    flex: none;
  }

  .headline {
    flex: 1;
    min-width: 0;
    font-weight: 500;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    opacity: 0.96;
  }

  .cta {
    flex: none;
    display: inline-flex;
    align-items: center;
    gap: 7px;
    font-weight: 600;
  }
  .arrow {
    transition: transform 0.16s ease;
  }
  .strip-inner:hover .arrow {
    transform: translateX(3px);
  }

  .close {
    position: absolute;
    right: 12px;
    top: 50%;
    transform: translateY(-50%);
    width: 30px;
    height: 30px;
    display: grid;
    place-items: center;
    border-radius: 8px;
    border: 1px solid rgba(255, 255, 255, 0.35);
    color: rgba(255, 255, 255, 0.85);
    background: transparent;
    transition: background 0.15s ease, color 0.15s ease, border-color 0.15s ease;
  }
  .close:hover {
    background: rgba(255, 255, 255, 0.16);
    border-color: rgba(255, 255, 255, 0.55);
    color: #fff;
  }

  @media (max-width: 720px) {
    /* Reserve room on the right for the absolute close button so the headline
       truncates cleanly instead of running underneath it. The whole strip is a
       link, so the explicit CTA is redundant and hidden here. */
    .strip-inner {
      padding: 8px 46px 8px 16px;
      gap: 8px;
      font-size: 12.5px;
    }
    .ver,
    .sep,
    .cta {
      display: none;
    }
    .close {
      right: 8px;
    }
  }
</style>
