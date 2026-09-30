<script lang="ts">
  import type { PageData } from './$types';

  export let data: PageData;

  const fmt = new Intl.DateTimeFormat('en-GB', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'UTC'
  });
  const when = (iso: string | null) => (iso ? fmt.format(new Date(iso)) : 'open');

  function audience(n: PageData['notices'][number]): string {
    const parts: string[] = [];
    parts.push(n.platforms.length ? n.platforms.join(', ') : 'all platforms');
    if (n.minVersion && n.maxVersion) parts.push(`${n.minVersion} to ${n.maxVersion}`);
    else if (n.minVersion) parts.push(`${n.minVersion} and up`);
    else if (n.maxVersion) parts.push(`up to ${n.maxVersion}`);
    return parts.join(' · ');
  }

  function confirmDelete(e: SubmitEvent) {
    if (!confirm('Delete this notice for good? Users who already dismissed it are unaffected.')) e.preventDefault();
  }
</script>

<svelte:head>
  <title>Notices · Spaci</title>
  <meta name="robots" content="noindex, nofollow" />
</svelte:head>

<section class="page wrap">
  <header class="head">
    <span class="eyebrow">Admin</span>
    <h1>Notices</h1>
    <p class="intro">
      Shown in the desktop app. Times are UTC. <a href="/admin/stats">Stats</a>
    </p>
    <a class="btn btn-primary new" href="/admin/notices/new">New notice</a>
  </header>

  {#if data.error}
    <p class="note">Notices are unavailable right now (database unreachable).</p>
  {:else if !data.notices.length}
    <p class="note">No notices yet.</p>
  {:else}
    <div class="scroll">
      <table>
        <thead>
          <tr>
            <th>Status</th>
            <th>Title</th>
            <th>Severity</th>
            <th>Audience</th>
            <th>Starts</th>
            <th>Ends</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {#each data.notices as n (n.id)}
            <tr>
              <td><span class="status {n.status}">{n.status}</span></td>
              <td class="title">
                <a href="/admin/notices/{n.id}">{n.title}</a>
                {#if n.kind === 'release'}<span class="kind mono">release {n.version}</span>{/if}
              </td>
              <td><span class="sev {n.severity}">{n.severity}</span></td>
              <td class="muted">{audience(n)}</td>
              <td class="mono">{when(n.startsAt)}</td>
              <td class="mono">{when(n.endsAt)}</td>
              <td class="acts">
                <a href="/admin/notices/{n.id}">Edit</a>
                {#if n.status !== 'expired'}
                  <form method="POST" action="/admin/notices/{n.id}?/expire">
                    <button type="submit">Expire</button>
                  </form>
                {/if}
                <form method="POST" action="/admin/notices/{n.id}?/delete" on:submit={confirmDelete}>
                  <button type="submit" class="danger">Delete</button>
                </form>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}
</section>

<style>
  .page {
    padding-top: 72px;
    padding-bottom: 48px;
  }
  .head {
    margin-bottom: 40px;
  }
  .head h1 {
    margin-top: 16px;
    font-size: clamp(34px, 5vw, 48px);
  }
  .intro {
    margin-top: 14px;
    color: var(--muted);
  }
  .intro a {
    color: var(--accent-fg);
  }
  .new {
    margin-top: 22px;
    height: 42px;
    padding: 0 18px;
  }
  .scroll {
    overflow-x: auto;
    border: 1px solid var(--line);
    border-radius: var(--radius-sm);
  }
  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 14px;
  }
  th,
  td {
    padding: 10px 14px;
    text-align: left;
    border-bottom: 1px solid var(--line);
    white-space: nowrap;
  }
  tbody tr:last-child td {
    border-bottom: 0;
  }
  th {
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--muted-2);
    background: var(--paper-2);
  }
  tbody tr:hover {
    background: var(--paper-2);
  }
  .title {
    white-space: normal;
    min-width: 220px;
  }
  .title a:hover {
    color: var(--accent-fg);
  }
  .kind {
    display: block;
    font-size: 12px;
    color: var(--muted-2);
  }
  .muted {
    color: var(--muted);
  }
  .status,
  .sev {
    display: inline-flex;
    height: 22px;
    align-items: center;
    padding: 0 9px;
    border-radius: 999px;
    font-size: 12px;
    font-weight: 600;
    background: var(--panel-2);
    color: var(--muted);
  }
  .status.live {
    background: var(--success-soft);
    color: var(--green);
  }
  .status.scheduled {
    background: var(--chip);
    color: var(--accent-fg);
  }
  .sev.important {
    background: var(--warn-soft);
    color: var(--warn);
  }
  .sev.critical {
    background: var(--danger-soft);
    color: var(--danger);
  }
  .sev.update {
    background: var(--chip);
    color: var(--accent-fg);
  }
  .acts {
    display: flex;
    gap: 12px;
    align-items: center;
  }
  .acts form {
    margin: 0;
  }
  .acts a,
  .acts button {
    font-size: 13px;
    color: var(--accent-fg);
    background: none;
    border: 0;
    padding: 0;
  }
  .acts button.danger {
    color: var(--danger);
  }
  .note {
    color: var(--muted);
    font-size: 14px;
  }
</style>
