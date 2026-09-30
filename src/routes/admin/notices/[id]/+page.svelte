<script lang="ts">
  import NoticeForm from '$lib/components/admin/NoticeForm.svelte';
  import type { ActionData, PageData } from './$types';

  export let data: PageData;
  export let form: ActionData;

  $: initial = form?.payload ? safeParse(form.payload) ?? data.initial : data.initial;
  function safeParse(s: string) {
    try {
      return JSON.parse(s);
    } catch {
      return null;
    }
  }
</script>

<svelte:head>
  <title>Edit notice · Spaci</title>
  <meta name="robots" content="noindex, nofollow" />
</svelte:head>

<section class="page wrap">
  <header class="head">
    <a class="eyebrow" href="/admin/notices">Admin / Notices</a>
    <h1>Edit notice</h1>
    <p class="id mono">{data.id}</p>
  </header>
  {#key initial}
    <NoticeForm {initial} errors={form?.errors ?? []} submitLabel="Save changes" />
  {/key}
</section>

<style>
  .page {
    padding-top: 72px;
    padding-bottom: 64px;
  }
  .head {
    margin-bottom: 36px;
  }
  .head h1 {
    margin-top: 16px;
    font-size: clamp(30px, 4.5vw, 44px);
  }
  .id {
    margin-top: 10px;
    font-size: 13px;
    color: var(--muted-2);
  }
</style>
