<script lang="ts">
  // Per-page SEO + social cards. Pass a title, description and the page path.
  export let title = 'Spaci, reclaim your disk from build artifacts';
  export let description =
    'Spaci finds the build artifacts, dependency caches and dead projects quietly eating your SSD, then clears them in one click. Free and open source for macOS, Windows and Linux.';
  export let path = '/';

  const SITE = 'https://spaci.kentom.co.ke';
  const ogImage = `${SITE}/og.png`;
  $: canonical = `${SITE}${path}`;
</script>

<svelte:head>
  <title>{title}</title>
  <meta name="description" content={description} />
  <link rel="canonical" href={canonical} />

  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="Spaci" />
  <meta property="og:title" content={title} />
  <meta property="og:description" content={description} />
  <meta property="og:url" content={canonical} />
  <meta property="og:image" content={ogImage} />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:image:alt" content="Spaci, the developer and Mac disk cleaner" />

  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content={title} />
  <meta name="twitter:description" content={description} />
  <meta name="twitter:image" content={ogImage} />
</svelte:head>
