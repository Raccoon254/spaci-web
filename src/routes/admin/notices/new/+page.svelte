<script lang="ts">
  import NoticeForm from '$lib/components/admin/NoticeForm.svelte';
  import type { ActionData, PageData } from './$types';

  export let data: PageData;
  export let form: ActionData;

  // After a failed save, re-open the form with what was submitted.
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
  <title>New notice · Spaci</title>
  <meta name="robots" content="noindex, nofollow" />
</svelte:head>

<section class="page wrap">
  <header class="head">
    <a class="eyebrow" href="/admin/notices">Admin / Notices</a>
    <h1>New notice</h1>
  </header>
  {#key initial}
    <NoticeForm {initial} errors={form?.errors ?? []} submitLabel="Create notice" />
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
</style>
