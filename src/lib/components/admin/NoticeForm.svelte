<script lang="ts">
  // Create and edit form for a notice. The whole notice is posted as one JSON
  // `payload` field and validated on the server by validateNotice, the same
  // validation the admin JSON API uses. The live preview converts the Markdown
  // with the same markdownToBlocks the endpoints use.
  import { markdownToBlocks, sanitizeMedia, isHttps } from '$lib/blocks';
  import NoticePreview from './NoticePreview.svelte';

  export let initial: Record<string, any>;
  export let errors: string[] = [];
  export let submitLabel = 'Save notice';

  const SEVERITIES = ['info', 'update', 'important', 'critical'];
  const PLATFORMS = ['mac', 'windows', 'linux'];

  const pad = (n: number) => String(n).padStart(2, '0');
  // ISO to a datetime-local value in the browser's time zone.
  function toLocal(iso: string | null | undefined): string {
    if (!iso) return '';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }
  function fromLocal(v: string): string | null {
    if (!v) return null;
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? null : d.toISOString();
  }

  let kind: string = initial.kind ?? 'announcement';
  let version: string = initial.version ?? '';
  let severity: string = initial.severity ?? 'info';
  let title: string = initial.title ?? '';
  let summary: string = initial.summary ?? '';
  let body: string = initial.body ?? '';
  let media: { url: string; alt: string; caption: string }[] = (initial.media ?? []).map((m: any) => ({
    url: m.url ?? '',
    alt: m.alt ?? '',
    caption: m.caption ?? ''
  }));
  let ctaLabel: string = initial.cta?.label ?? '';
  let ctaUrl: string = initial.cta?.url ?? '';
  let platforms: string[] = initial.audience?.platforms ?? [];
  let minVersion: string = initial.audience?.minVersion ?? '';
  let maxVersion: string = initial.audience?.maxVersion ?? '';
  let startsLocal = toLocal(initial.startsAt);
  let endsLocal = toLocal(initial.endsAt);
  let dismissible: boolean = initial.dismissible ?? true;
  let dismissTouched = initial.dismissible !== undefined;

  $: if (!dismissTouched) dismissible = severity !== 'critical';

  const zone = (() => {
    const off = -new Date().getTimezoneOffset();
    const s = off >= 0 ? '+' : '-';
    return `UTC${s}${pad(Math.floor(Math.abs(off) / 60))}:${pad(Math.abs(off) % 60)}`;
  })();

  $: hasCta = ctaLabel.trim() !== '' || ctaUrl.trim() !== '';
  $: payload = JSON.stringify({
    kind,
    severity,
    title,
    summary,
    body,
    version: kind === 'release' ? version.trim() || null : null,
    media: media.map((m) => ({ url: m.url.trim(), alt: m.alt, ...(m.caption.trim() ? { caption: m.caption } : {}) })),
    cta: hasCta ? { label: ctaLabel, url: ctaUrl.trim() } : null,
    audience: {
      ...(platforms.length ? { platforms } : {}),
      ...(minVersion.trim() ? { minVersion: minVersion.trim() } : {}),
      ...(maxVersion.trim() ? { maxVersion: maxVersion.trim() } : {})
    },
    startsAt: fromLocal(startsLocal),
    endsAt: fromLocal(endsLocal),
    dismissible
  });

  $: blocks = markdownToBlocks(body);
  $: previewMedia = sanitizeMedia(media.map((m) => ({ ...m, caption: m.caption || undefined })));
  $: droppedMedia = media.filter((m) => m.url.trim()).length - previewMedia.length;
  $: previewCta = hasCta && isHttps(ctaUrl.trim()) ? { label: ctaLabel, url: ctaUrl.trim() } : null;

  function addMedia() {
    media = [...media, { url: '', alt: '', caption: '' }];
  }
  function removeMedia(i: number) {
    media = media.filter((_, j) => j !== i);
  }
</script>

<div class="layout">
  <form method="POST" action="?/save" class="form">
    <input type="hidden" name="payload" value={payload} />

    {#if errors.length}
      <div class="errors" role="alert">
        <strong>Not saved</strong>
        <ul>{#each errors as e}<li>{e}</li>{/each}</ul>
      </div>
    {/if}

    <div class="row">
      <label>
        <span>Kind</span>
        <select bind:value={kind}>
          <option value="announcement">Announcement</option>
          <option value="release">Release</option>
        </select>
      </label>
      <label>
        <span>Severity</span>
        <select bind:value={severity}>
          {#each SEVERITIES as s}<option value={s}>{s}</option>{/each}
        </select>
      </label>
      {#if kind === 'release'}
        <label>
          <span>Version</span>
          <input class="mono" bind:value={version} placeholder="2.3.0" />
        </label>
      {/if}
    </div>
    {#if severity === 'critical'}
      <p class="hint warn">Critical is for real problems only, for example a release with a bug that needs an update now.</p>
    {/if}

    <label>
      <span>Title <em>{title.length}/80</em></span>
      <input bind:value={title} maxlength="80" required />
    </label>
    <label>
      <span>Summary <em>{summary.length}/200, plain text</em></span>
      <input bind:value={summary} maxlength="200" />
    </label>
    <label>
      <span>Body <em>Markdown; raw HTML is dropped, links must be https or mailto</em></span>
      <textarea class="mono" bind:value={body} rows="12"></textarea>
    </label>

    <fieldset>
      <legend>Media</legend>
      <p class="hint">
        https images on spaci.kentom.co.ke, raw.githubusercontent.com/Raccoon254/ or github.com (Raccoon254 or
        user-attachments). Alt text is required.
      </p>
      {#each media as m, i}
        <div class="media-row">
          <input bind:value={m.url} placeholder="https://..." aria-label="Image URL" />
          <input bind:value={m.alt} placeholder="Alt text" aria-label="Alt text" />
          <input bind:value={m.caption} placeholder="Caption (optional)" aria-label="Caption" />
          <button type="button" class="small" on:click={() => removeMedia(i)}>Remove</button>
        </div>
      {/each}
      <button type="button" class="small" on:click={addMedia}>Add image</button>
    </fieldset>

    <fieldset>
      <legend>Call to action (optional)</legend>
      <div class="row">
        <label><span>Label</span><input bind:value={ctaLabel} maxlength="80" /></label>
        <label class="grow"><span>URL (https)</span><input bind:value={ctaUrl} placeholder="https://..." /></label>
      </div>
    </fieldset>

    <fieldset>
      <legend>Audience</legend>
      <div class="checks">
        {#each PLATFORMS as p}
          <label class="check"><input type="checkbox" bind:group={platforms} value={p} /> {p}</label>
        {/each}
        <span class="hint">None checked means every platform.</span>
      </div>
      <div class="row">
        <label><span>Min version</span><input class="mono" bind:value={minVersion} placeholder="any" /></label>
        <label><span>Max version</span><input class="mono" bind:value={maxVersion} placeholder="any" /></label>
      </div>
      <p class="hint">Inclusive. Prereleases sort before their release (2.3.0-beta.1 is below 2.3.0).</p>
    </fieldset>

    <fieldset>
      <legend>Schedule <em>{zone}</em></legend>
      <div class="row">
        <label><span>Starts</span><input type="datetime-local" bind:value={startsLocal} /></label>
        <label><span>Ends (optional)</span><input type="datetime-local" bind:value={endsLocal} /></label>
      </div>
      <label class="check">
        <input type="checkbox" bind:checked={dismissible} on:change={() => (dismissTouched = true)} />
        Users can dismiss it
      </label>
    </fieldset>

    <div class="actions">
      <button type="submit" class="btn btn-primary">{submitLabel}</button>
      <a class="btn btn-ghost" href="/admin/notices">Cancel</a>
    </div>
  </form>

  <aside class="preview">
    <span class="eyebrow">Preview</span>
    <NoticePreview
      {severity}
      {title}
      {summary}
      {blocks}
      media={previewMedia}
      cta={previewCta}
      {dismissible}
    />
    {#if droppedMedia > 0}
      <p class="hint warn">{droppedMedia} image(s) not on the allowlist will not be shown.</p>
    {/if}
    {#if hasCta && !previewCta}
      <p class="hint warn">The call to action needs an https URL.</p>
    {/if}
  </aside>
</div>

<style>
  .layout {
    display: grid;
    grid-template-columns: minmax(0, 1.1fr) minmax(0, 0.9fr);
    gap: 40px;
    align-items: start;
  }
  @media (max-width: 900px) {
    .layout {
      grid-template-columns: 1fr;
    }
  }
  .form {
    display: flex;
    flex-direction: column;
    gap: 18px;
    min-width: 0;
  }
  .preview {
    position: sticky;
    top: 24px;
    display: flex;
    flex-direction: column;
    gap: 14px;
    min-width: 0;
  }
  label {
    display: flex;
    flex-direction: column;
    gap: 6px;
    min-width: 0;
  }
  label > span,
  legend {
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--muted-2);
  }
  em {
    font-style: normal;
    font-weight: 500;
    letter-spacing: 0;
    text-transform: none;
    color: var(--faint);
    margin-left: 6px;
  }
  input,
  select,
  textarea {
    font: inherit;
    font-size: 15px;
    color: var(--ink);
    background: var(--paper-2);
    border: 1px solid var(--line-2);
    border-radius: 10px;
    padding: 10px 12px;
    min-width: 0;
  }
  input:focus,
  select:focus,
  textarea:focus {
    outline: 2px solid var(--accent-fg);
    outline-offset: 1px;
  }
  textarea {
    resize: vertical;
    line-height: 1.5;
    font-size: 14px;
  }
  .mono {
    font-family: var(--mono);
  }
  fieldset {
    border: 1px solid var(--line);
    border-radius: var(--radius-sm);
    padding: 16px 18px;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 12px;
    min-width: 0;
  }
  .row {
    display: flex;
    flex-wrap: wrap;
    gap: 14px;
  }
  .row > label {
    flex: 1 1 160px;
  }
  .row > .grow {
    flex: 3 1 240px;
  }
  .checks {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 16px;
  }
  .check {
    flex-direction: row;
    align-items: center;
    gap: 8px;
    font-size: 15px;
  }
  .check input {
    width: 16px;
    height: 16px;
    padding: 0;
  }
  .media-row {
    display: grid;
    grid-template-columns: 2fr 1.2fr 1.2fr auto;
    gap: 8px;
  }
  @media (max-width: 600px) {
    .media-row {
      grid-template-columns: 1fr;
    }
  }
  .small {
    align-self: flex-start;
    background: var(--panel-2);
    border: 1px solid var(--line-2);
    border-radius: 9px;
    padding: 7px 12px;
    font-size: 13px;
  }
  .small:hover {
    border-color: var(--muted-2);
  }
  .hint {
    font-size: 13px;
    color: var(--muted-2);
  }
  .warn {
    color: var(--warn);
  }
  .errors {
    background: var(--danger-soft);
    border: 1px solid var(--danger);
    border-radius: var(--radius-sm);
    padding: 12px 16px;
    color: var(--ink);
    font-size: 14px;
  }
  .errors ul {
    margin: 6px 0 0;
    padding-left: 18px;
  }
  .actions {
    display: flex;
    gap: 12px;
  }
</style>
