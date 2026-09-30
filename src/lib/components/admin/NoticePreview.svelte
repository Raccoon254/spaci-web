<script lang="ts">
  // Preview of a notice as the app shows it, built from the same Block model
  // and the same Blocks component the site uses. No {@html}.
  import Blocks from '$lib/components/blocks/Blocks.svelte';
  import type { Block, Media } from '$lib/blocks';

  export let severity: string;
  export let title: string;
  export let summary: string;
  export let blocks: Block[];
  export let media: Media[];
  export let cta: { label: string; url: string } | null;
  export let dismissible: boolean;
</script>

<article class="card sev-{severity}">
  <header>
    <span class="sev">{severity}</span>
    {#if dismissible}<span class="x" aria-hidden="true">Dismiss</span>{:else}<span class="pinned">Not dismissible</span>{/if}
  </header>
  <h3>{title || 'Untitled notice'}</h3>
  {#if summary}<p class="summary">{summary}</p>{/if}
  {#each media as m}
    <figure>
      <img src={m.url} alt={m.alt} loading="lazy" referrerpolicy="no-referrer" />
      {#if m.caption}<figcaption>{m.caption}</figcaption>{/if}
    </figure>
  {/each}
  {#if blocks.length}<Blocks {blocks} />{/if}
  {#if cta}<span class="cta">{cta.label}</span>{/if}
</article>

<style>
  .card {
    background: var(--paper-2);
    border: 1px solid var(--line);
    border-left: 3px solid var(--accent);
    border-radius: var(--radius-sm);
    padding: 18px 20px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    min-width: 0;
  }
  .sev-info {
    border-left-color: var(--muted-2);
  }
  .sev-important {
    border-left-color: var(--warn);
  }
  .sev-critical {
    border-left-color: var(--danger);
  }
  header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .sev {
    font-family: var(--mono);
    font-size: 11.5px;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--accent-fg);
  }
  .sev-important .sev {
    color: var(--warn);
  }
  .sev-critical .sev {
    color: var(--danger);
  }
  .x,
  .pinned {
    font-size: 12px;
    color: var(--muted-2);
  }
  h3 {
    font-size: 19px;
    letter-spacing: -0.02em;
    line-height: 1.25;
  }
  .summary {
    color: var(--muted);
  }
  figure {
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  img {
    max-width: 100%;
    height: auto;
    border-radius: 10px;
    border: 1px solid var(--line);
  }
  figcaption {
    font-size: 13px;
    color: var(--muted-2);
  }
  .cta {
    align-self: flex-start;
    background: var(--accent);
    color: var(--on-accent);
    font-weight: 600;
    font-size: 14px;
    padding: 8px 16px;
    border-radius: 10px;
  }
</style>
