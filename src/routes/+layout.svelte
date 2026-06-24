<script lang="ts">
  import '../app.css';
  import Nav from '$lib/components/Nav.svelte';
  import Footer from '$lib/components/Footer.svelte';
  import ReleaseStrip from '$lib/components/ReleaseStrip.svelte';
  import type { LayoutData } from './$types';

  export let data: LayoutData;
</script>

{#if data.isNew}
  <ReleaseStrip release={data.latest} />
{/if}
<Nav />
<main><slot /></main>
<Footer />

<style>
  main {
    min-height: calc(100vh - 65px);
  }
</style>
