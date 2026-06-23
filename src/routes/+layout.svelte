<script lang="ts">
  import '../app.css';
  import Nav from '$lib/components/Nav.svelte';
  import Footer from '$lib/components/Footer.svelte';
</script>

<Nav />
<main><slot /></main>
<Footer />

<style>
  main {
    min-height: calc(100vh - 64px);
  }
</style>
