<script lang="ts">
  // Renders the Block model (src/lib/blocks.ts) for release notes and notices.
  // Used by the public changelog and by the admin preview, so the preview is
  // exactly what users get. No {@html} anywhere.
  import type { Block } from '$lib/blocks';
  import Inlines from './Inlines.svelte';

  export let blocks: Block[] = [];
</script>

<div class="blocks">
  {#each blocks as b}
    {#if b.t === 'h'}
      {#if b.level === 2}
        <h3 class="h2"><Inlines nodes={b.c} /></h3>
      {:else}
        <h4 class="h3"><Inlines nodes={b.c} /></h4>
      {/if}
    {:else if b.t === 'p'}
      <p><Inlines nodes={b.c} /></p>
    {:else if b.t === 'ul'}
      <ul>
        {#each b.items as item}<li><Inlines nodes={item} /></li>{/each}
      </ul>
    {:else if b.t === 'ol'}
      <ol>
        {#each b.items as item}<li><Inlines nodes={item} /></li>{/each}
      </ol>
    {:else if b.t === 'quote'}
      <blockquote><Inlines nodes={b.c} /></blockquote>
    {:else if b.t === 'code'}
      <pre><code>{b.text}</code></pre>
    {:else if b.t === 'img'}
      <figure>
        <img src={b.url} alt={b.alt} loading="lazy" decoding="async" referrerpolicy="no-referrer" />
        {#if b.caption}<figcaption>{b.caption}</figcaption>{/if}
      </figure>
    {:else if b.t === 'hr'}
      <hr />
    {/if}
  {/each}
</div>

<style>
  .blocks {
    display: flex;
    flex-direction: column;
    gap: 14px;
    color: var(--ink);
    font-size: 15px;
    line-height: 1.6;
    min-width: 0;
  }
  .blocks :global(*) {
    margin: 0;
  }
  .h2 {
    font-size: 19px;
    font-weight: 600;
    margin-top: 8px;
  }
  .h3 {
    font-size: 16px;
    font-weight: 600;
    margin-top: 4px;
  }
  p {
    white-space: pre-line;
    overflow-wrap: anywhere;
  }
  ul,
  ol {
    padding-left: 22px;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  li::marker {
    color: var(--muted-2);
  }
  blockquote {
    border-left: 3px solid var(--line-2);
    padding: 2px 0 2px 14px;
    color: var(--muted);
    white-space: pre-line;
  }
  pre {
    background: var(--desk);
    border: 1px solid var(--line);
    border-radius: 10px;
    padding: 12px 14px;
    overflow-x: auto;
    font-size: 13px;
  }
  /* Inline elements are rendered by Inlines.svelte, so they are styled
     through :global under this component's root. */
  .blocks :global(code) {
    font-family: var(--mono);
    font-size: 0.9em;
  }
  .blocks :global(:not(pre) > code) {
    background: var(--panel-2);
    border-radius: 6px;
    padding: 1px 6px;
  }
  .blocks :global(a) {
    color: var(--accent-fg);
    text-decoration: underline;
    text-underline-offset: 2px;
  }
  figure {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  img {
    display: block;
    max-width: 100%;
    height: auto;
    border-radius: var(--radius-sm);
    border: 1px solid var(--line);
  }
  figcaption {
    font-size: 13px;
    color: var(--muted-2);
  }
  hr {
    border: 0;
    border-top: 1px solid var(--line);
    margin: 6px 0;
  }
</style>
