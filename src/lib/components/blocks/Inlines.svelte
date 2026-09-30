<script lang="ts">
  // Renders Inline[] as text and elements. Never {@html}: every string is
  // inserted as a text node by Svelte, and hrefs were already restricted to
  // https: and mailto: by src/lib/blocks.ts.
  import type { Inline } from '$lib/blocks';

  export let nodes: Inline[] = [];
</script>

{#each nodes as n}{#if n.t === 'text'}{n.v}{:else if n.t === 'strong'}<strong><svelte:self nodes={n.c} /></strong>{:else if n.t === 'em'}<em><svelte:self nodes={n.c} /></em>{:else if n.t === 'code'}<code>{n.v}</code>{:else if n.t === 'link'}<a href={n.href} target="_blank" rel="noopener noreferrer nofollow"><svelte:self nodes={n.c} /></a>{/if}{/each}
