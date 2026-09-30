// Markdown to Block conversion for notices and release notes.
//
// This module is the security boundary for all owner-authored rich text. The
// desktop app never parses Markdown and never uses innerHTML: it builds DOM from
// the Block model below with createElement and textContent. The site renders the
// same blocks with Svelte components (src/lib/components/blocks), never {@html}.
//
// Rules enforced here (see the shared notices contract):
//   - Links survive only with an https: or mailto: href. Anything else
//     (javascript:, data:, file:, http:, relative) becomes plain text.
//   - Images survive only with an https: URL on the allowlist (isAllowedImageUrl).
//     Everything else is dropped.
//   - Raw HTML is dropped, never passed through. Text inside inline <script> and
//     <style> tags is dropped too.
//   - At most MAX_BLOCKS blocks, text runs capped at MAX_TEXT chars, inline
//     nesting depth at most MAX_DEPTH (deeper content is flattened to text).
//   - A Markdown H1 becomes level 2; H4 and below become level 3.
//
// Only marked's LEXER is used (a tokenizer, no HTML output). It lives in
// src/lib (not src/lib/server) so the admin preview converts in the browser with
// exactly the same code that serves users. It is pure: no I/O, no globals.

import { Lexer, type Token, type Tokens } from 'marked';

export type Inline =
  | { t: 'text'; v: string }
  | { t: 'strong' | 'em'; c: Inline[] }
  | { t: 'code'; v: string }
  | { t: 'link'; href: string; c: Inline[] };

export type Block =
  | { t: 'h'; level: 2 | 3; c: Inline[] }
  | { t: 'p'; c: Inline[] }
  | { t: 'ul' | 'ol'; items: Inline[][] }
  | { t: 'quote'; c: Inline[] }
  | { t: 'code'; text: string }
  | { t: 'img'; url: string; alt: string; caption?: string }
  | { t: 'hr' };

export interface Media {
  url: string;
  alt: string;
  caption?: string;
}

export const MAX_BLOCKS = 200;
export const MAX_TEXT = 5000;
export const MAX_DEPTH = 4;
// Input is truncated before lexing so a pathological document cannot make the
// tokenizer do unbounded work.
export const MAX_INPUT = 50_000;
// Each inline run (a paragraph, heading, list item or table cell) is truncated
// to this many characters before inline lexing. Marked's emphasis matching is
// superlinear on pathological input (thousands of unmatched * and _), so this
// bounds the worst case per run to a few hundred milliseconds.
export const MAX_INLINE_SRC = 4_000;
// Extra structural caps, stricter than the contract, to bound output size.
export const MAX_LIST_ITEMS = 100;
export const MAX_INLINES = 500;

// ---------------------------------------------------------------------------
// URL rules

const IMAGE_HOSTS: Record<string, (path: string) => boolean> = {
  'spaci.kentom.co.ke': () => true,
  'raw.githubusercontent.com': (p) => p.startsWith('/Raccoon254/'),
  'github.com': (p) => p.startsWith('/Raccoon254/') || p.startsWith('/user-attachments/')
};

// Control characters and whitespace never belong in a URL we emit.
const BAD_URL_CHARS = /[\u0000- \u007f-\u009f\\]/;

function parseUrl(raw: unknown): URL | null {
  if (typeof raw !== 'string' || raw.length === 0 || raw.length > 2048) return null;
  if (BAD_URL_CHARS.test(raw)) return null;
  try {
    return new URL(raw);
  } catch {
    return null;
  }
}

// Returns the normalized href when it is an allowed link target, else null.
export function safeHref(raw: unknown): string | null {
  const u = parseUrl(raw);
  if (!u) return null;
  if (u.protocol === 'mailto:') {
    // mailto:user@host only, no header injection tricks beyond what a mail
    // client already handles; require an @ in the address part.
    const addr = u.pathname;
    return /^[^@\s]+@[^@\s]+$/.test(decodeURIComponentSafe(addr)) ? u.href : null;
  }
  return isHttpsUrl(u) ? u.href : null;
}

// https with a real host, no credentials.
function isHttpsUrl(u: URL): boolean {
  return u.protocol === 'https:' && !!u.hostname && !u.username && !u.password;
}

// True for an https URL (used for CTAs and links in validation).
export function isHttps(raw: unknown): boolean {
  const u = parseUrl(raw);
  return !!u && isHttpsUrl(u);
}

// Returns the normalized image URL when it is https, on the host allowlist and
// under an allowed path, else null. The check runs on the parsed, normalized
// URL, so dot segments (including %2e) cannot escape an allowed path prefix.
export function safeImageUrl(raw: unknown): string | null {
  const u = parseUrl(raw);
  if (!u || !isHttpsUrl(u) || u.port !== '') return null;
  const pathOk = IMAGE_HOSTS[u.hostname];
  if (!pathOk || !pathOk(u.pathname)) return null;
  return u.href;
}

export function isAllowedImageUrl(raw: unknown): boolean {
  return safeImageUrl(raw) !== null;
}

function decodeURIComponentSafe(s: string): string {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
}

// ---------------------------------------------------------------------------
// Text helpers

const NAMED_ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
  hellip: '…',
  copy: '©',
  reg: '®',
  trade: '™',
  middot: '·',
  times: '×',
  rarr: '→',
  larr: '←'
};

// Marked keeps entity references verbatim (its HTML renderer relies on the
// browser to decode them). We emit plain text, so decode them here. The result
// is only ever used as text, so decoding cannot introduce markup.
export function decodeEntities(s: string): string {
  return s.replace(/&(#x[0-9a-f]{1,6}|#[0-9]{1,7}|[a-z]{2,8});/gi, (m, body: string) => {
    if (body[0] === '#') {
      const code = body[1] === 'x' || body[1] === 'X' ? parseInt(body.slice(2), 16) : parseInt(body.slice(1), 10);
      if (!Number.isFinite(code) || code <= 0 || code > 0x10ffff || (code >= 0xd800 && code <= 0xdfff)) {
        return '�';
      }
      return String.fromCodePoint(code);
    }
    return NAMED_ENTITIES[body.toLowerCase()] ?? m;
  });
}

// Strip C0/C1 control characters except tab and newline.
function stripControls(s: string): string {
  return s.replace(/[\u0000-\u0008\u000b-\u001f\u007f-\u009f]/g, '');
}

export function capText(s: string, max = MAX_TEXT): string {
  if (s.length <= max) return s;
  // Do not split a surrogate pair.
  let cut = max;
  const code = s.charCodeAt(cut - 1);
  if (code >= 0xd800 && code <= 0xdbff) cut -= 1;
  return s.slice(0, cut);
}

function cleanText(s: string): string {
  return capText(stripControls(decodeEntities(s)));
}

// Plain text for single-line fields (title, summary, highlight, alt).
export function plainText(s: unknown, max: number): string {
  if (typeof s !== 'string') return '';
  return capText(stripControls(s).replace(/\s+/g, ' ').trim(), max);
}

// ---------------------------------------------------------------------------
// Inline conversion

type AnyToken = Token & { tokens?: Token[]; text?: string; items?: Tokens.ListItem[] };

// Tracks inline <script>/<style> so their contents are dropped, not shown.
interface InlineState {
  skipUntil: string | null;
  count: number;
}

function inlineHtml(tok: AnyToken, st: InlineState): void {
  const raw = String(tok.text ?? '').trim().toLowerCase();
  if (st.skipUntil) {
    if (raw.startsWith(`</${st.skipUntil}`)) st.skipUntil = null;
    return;
  }
  const open = /^<(script|style|textarea|title|iframe|noscript|xmp)\b/.exec(raw);
  if (open && !raw.endsWith('/>')) st.skipUntil = open[1];
}

// Plain text of a token subtree, used when flattening beyond MAX_DEPTH, for
// image alt text, and for rejected links.
function tokensToPlain(tokens: Token[] | undefined, st: InlineState): string {
  let out = '';
  for (const t of (tokens ?? []) as AnyToken[]) {
    if (t.type === 'html') {
      inlineHtml(t, st);
      continue;
    }
    if (st.skipUntil) continue;
    if (t.type === 'br') out += '\n';
    else if (t.type === 'image') out += String(t.text ?? '');
    else if (t.tokens && t.tokens.length) out += tokensToPlain(t.tokens, st);
    else if (t.type === 'text' || t.type === 'escape' || t.type === 'codespan') out += String(t.text ?? '');
  }
  return out;
}

function pushText(out: Inline[], v: string, st: InlineState): void {
  if (!v) return;
  const last = out[out.length - 1];
  if (last && last.t === 'text') {
    last.v = capText(last.v + v);
    return;
  }
  if (st.count >= MAX_INLINES) return;
  st.count++;
  out.push({ t: 'text', v: capText(v) });
}

function pushNode(out: Inline[], node: Inline, st: InlineState): void {
  if (st.count >= MAX_INLINES) return;
  st.count++;
  out.push(node);
}

// depth is the number of container inlines (strong, em, link) already open.
function convertInline(tokens: Token[] | undefined, depth: number, st: InlineState): Inline[] {
  const out: Inline[] = [];
  for (const t of (tokens ?? []) as AnyToken[]) {
    if (t.type === 'html') {
      inlineHtml(t, st);
      continue;
    }
    if (st.skipUntil) continue;

    switch (t.type) {
      case 'text':
        // List-item text tokens carry inline children; plain text tokens do not.
        if (t.tokens && t.tokens.length) {
          for (const n of convertInline(t.tokens, depth, st)) {
            if (n.t === 'text') pushText(out, n.v, st);
            else pushNode(out, n, st);
          }
        } else {
          pushText(out, cleanText(String(t.text ?? '')), st);
        }
        break;
      case 'escape':
        pushText(out, cleanText(String(t.text ?? '')), st);
        break;
      case 'br':
        pushText(out, '\n', st);
        break;
      case 'codespan':
        pushNode(out, { t: 'code', v: cleanText(String(t.text ?? '')) }, st);
        break;
      case 'strong':
      case 'em':
      case 'del': {
        if (t.type === 'del' || depth >= MAX_DEPTH) {
          // No strikethrough in the model; too-deep nesting is flattened.
          if (t.type === 'del' && depth < MAX_DEPTH) {
            for (const n of convertInline(t.tokens, depth, st)) {
              if (n.t === 'text') pushText(out, n.v, st);
              else pushNode(out, n, st);
            }
          } else {
            pushText(out, cleanText(tokensToPlain(t.tokens, st)), st);
          }
          break;
        }
        const c = convertInline(t.tokens, depth + 1, st);
        if (c.length) pushNode(out, { t: t.type, c }, st);
        break;
      }
      case 'link': {
        const href = safeHref((t as Tokens.Link).href);
        if (!href || depth >= MAX_DEPTH) {
          // Rejected or too deep: keep the visible text, drop the link.
          pushText(out, cleanText(tokensToPlain(t.tokens, st)), st);
          break;
        }
        const c = convertInline(t.tokens, depth + 1, st);
        pushNode(out, { t: 'link', href, c: c.length ? c : [{ t: 'text', v: capText(href) }] }, st);
        break;
      }
      case 'image':
        // Images nested inside inline content (for example inside a link)
        // cannot become blocks; keep their alt text only.
        pushText(out, cleanText(String(t.text ?? '')), st);
        break;
      default:
        // Unknown inline token: keep its plain text, never its raw source.
        if (t.tokens && t.tokens.length) pushText(out, cleanText(tokensToPlain(t.tokens, st)), st);
        break;
    }
  }
  return out;
}

function trimInlines(c: Inline[]): Inline[] {
  // Drop leading/trailing whitespace-only text so splitting around images does
  // not leave empty paragraphs.
  const out = c.slice();
  while (out.length && out[0].t === 'text' && !out[0].v.trim()) out.shift();
  while (out.length && out[out.length - 1].t === 'text' && !(out[out.length - 1] as { v: string }).v.trim()) out.pop();
  const first = out[0];
  if (first && first.t === 'text') out[0] = { t: 'text', v: first.v.trimStart() };
  const last = out[out.length - 1];
  if (last && last.t === 'text') out[out.length - 1] = { t: 'text', v: last.v.trimEnd() };
  return out;
}

// ---------------------------------------------------------------------------
// Block conversion

class Builder {
  blocks: Block[] = [];
  get full(): boolean {
    return this.blocks.length >= MAX_BLOCKS;
  }
  push(b: Block): void {
    if (!this.full) this.blocks.push(b);
  }
}

function freshState(): InlineState {
  return { skipUntil: null, count: 0 };
}

// A paragraph may contain images. Images become their own img blocks and the
// text around them becomes paragraphs, in order.
function paragraph(tokens: Token[] | undefined, b: Builder): void {
  const st = freshState();
  let run: Token[] = [];
  const flush = () => {
    const c = trimInlines(convertInline(run, 0, st));
    if (c.length) b.push({ t: 'p', c });
    run = [];
  };
  for (const t of (tokens ?? []) as AnyToken[]) {
    if (t.type === 'image' && !st.skipUntil) {
      flush();
      const url = safeImageUrl((t as Tokens.Image).href);
      if (url) {
        const img: Block = { t: 'img', url, alt: plainText(decodeEntities(String(t.text ?? '')), 300) };
        const caption = plainText(decodeEntities(String((t as Tokens.Image).title ?? '')), 300);
        if (caption) img.caption = caption;
        b.push(img);
      }
      continue;
    }
    run.push(t);
  }
  flush();
}

function listItems(tok: Tokens.List, items: Inline[][], depth: number): void {
  for (const item of tok.items) {
    if (items.length >= MAX_LIST_ITEMS) return;
    const st = freshState();
    const line: Inline[] = [];
    const nested: Tokens.List[] = [];
    for (const child of item.tokens as AnyToken[]) {
      if (child.type === 'list') {
        nested.push(child as Tokens.List);
      } else if (child.type === 'text' || child.type === 'paragraph' || child.type === 'heading') {
        if (line.length) line.push({ t: 'text', v: ' ' });
        line.push(...convertInline(child.tokens, 0, st));
      } else if (child.type === 'code') {
        if (line.length) line.push({ t: 'text', v: ' ' });
        line.push({ t: 'code', v: cleanText(String(child.text ?? '')) });
      }
      // html, space, blockquote etc. inside list items are dropped.
    }
    const c = trimInlines(mergeText(line));
    if (c.length) items.push(c);
    // The model has no nested lists: nested items follow as sibling items.
    if (depth < 8) for (const n of nested) listItems(n, items, depth + 1);
  }
}

function mergeText(c: Inline[]): Inline[] {
  const out: Inline[] = [];
  for (const n of c) {
    const last = out[out.length - 1];
    if (n.t === 'text' && last && last.t === 'text') last.v = capText(last.v + n.v);
    else out.push(n);
  }
  return out;
}

// Blockquotes carry inline content only; nested block content is flattened.
function quoteInlines(tokens: Token[] | undefined, st: InlineState, out: Inline[], depth: number): void {
  for (const t of (tokens ?? []) as AnyToken[]) {
    if (t.type === 'paragraph' || t.type === 'heading' || t.type === 'text') {
      if (out.length) out.push({ t: 'text', v: '\n' });
      out.push(...convertInline(t.tokens ?? [{ type: 'text', raw: t.text ?? '', text: t.text ?? '' } as Token], 0, st));
    } else if (t.type === 'blockquote' && depth < 8) {
      quoteInlines(t.tokens, st, out, depth + 1);
    } else if (t.type === 'list') {
      const items: Inline[][] = [];
      listItems(t as Tokens.List, items, 0);
      for (const it of items) {
        if (out.length) out.push({ t: 'text', v: '\n' });
        out.push(...it);
      }
    } else if (t.type === 'code') {
      if (out.length) out.push({ t: 'text', v: '\n' });
      out.push({ t: 'code', v: cleanText(String(t.text ?? '')) });
    }
  }
}

function convertBlocks(tokens: Token[], b: Builder): void {
  for (const t of tokens as AnyToken[]) {
    if (b.full) return;
    switch (t.type) {
      case 'heading': {
        const c = trimInlines(convertInline(t.tokens, 0, freshState()));
        if (c.length) b.push({ t: 'h', level: (t as Tokens.Heading).depth <= 2 ? 2 : 3, c });
        break;
      }
      case 'paragraph':
        paragraph(t.tokens, b);
        break;
      case 'text':
        // Top-level text tokens (rare) behave like paragraphs.
        paragraph(t.tokens ?? [{ type: 'text', raw: t.text ?? '', text: t.text ?? '' } as Token], b);
        break;
      case 'list': {
        const items: Inline[][] = [];
        listItems(t as Tokens.List, items, 0);
        if (items.length) b.push({ t: (t as Tokens.List).ordered ? 'ol' : 'ul', items });
        break;
      }
      case 'blockquote': {
        const c: Inline[] = [];
        quoteInlines(t.tokens, freshState(), c, 0);
        const merged = trimInlines(mergeText(c));
        if (merged.length) b.push({ t: 'quote', c: merged });
        break;
      }
      case 'code':
        b.push({ t: 'code', text: cleanText(String(t.text ?? '')) });
        break;
      case 'hr':
        b.push({ t: 'hr' });
        break;
      case 'table': {
        // No table block in the model: each row becomes a paragraph of cells.
        const tbl = t as Tokens.Table;
        const rows = [tbl.header, ...tbl.rows];
        for (const row of rows) {
          const st = freshState();
          const c: Inline[] = [];
          row.forEach((cell, i) => {
            if (i > 0) c.push({ t: 'text', v: ' | ' });
            c.push(...convertInline(cell.tokens, 0, st));
          });
          const merged = trimInlines(mergeText(c));
          if (merged.length) b.push({ t: 'p', c: merged });
        }
        break;
      }
      // html (raw HTML blocks), space and def (reference definitions, already
      // resolved into links by the lexer) are dropped.
      default:
        break;
    }
  }
}

// Fallback when the lexer throws: plain paragraphs split on blank lines.
function plainParagraphs(md: string): Block[] {
  return md
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)
    .slice(0, MAX_BLOCKS)
    .map((p) => ({ t: 'p', c: [{ t: 'text', v: capText(stripControls(p)) }] }) as Block);
}

// Same as Lexer.lex (block pass, then the queued inline passes) except that
// each inline source is capped at MAX_INLINE_SRC characters first.
function lex(md: string): Token[] {
  const lexer = new Lexer({ gfm: true, breaks: false });
  const tokens = lexer.blockTokens(md.replace(/\r\n?/g, '\n'), lexer.tokens);
  for (const next of lexer.inlineQueue) {
    lexer.inlineTokens(next.src.length > MAX_INLINE_SRC ? next.src.slice(0, MAX_INLINE_SRC) : next.src, next.tokens);
  }
  lexer.inlineQueue = [];
  return tokens;
}

export function markdownToBlocks(input: unknown): Block[] {
  if (typeof input !== 'string' || !input.trim()) return [];
  const md = input.length > MAX_INPUT ? input.slice(0, MAX_INPUT) : input;
  let tokens: Token[];
  try {
    tokens = lex(md);
  } catch {
    return plainParagraphs(md);
  }
  const b = new Builder();
  try {
    convertBlocks(tokens, b);
  } catch {
    return plainParagraphs(md);
  }
  return b.blocks;
}

// Validates and normalizes a media list: https allowlisted images with alt text.
export function sanitizeMedia(input: unknown, max = 12): Media[] {
  if (!Array.isArray(input)) return [];
  const out: Media[] = [];
  for (const m of input) {
    if (out.length >= max) break;
    if (!m || typeof m !== 'object') continue;
    const r = m as Record<string, unknown>;
    const url = safeImageUrl(r.url ?? r.src);
    const alt = plainText(r.alt, 300);
    if (!url) continue;
    const item: Media = { url, alt };
    const caption = plainText(r.caption, 300);
    if (caption) item.caption = caption;
    out.push(item);
  }
  return out;
}

// Memoized conversion for read paths that convert the same stored Markdown on
// every request (GET /api/notices, release notes). Bounded, oldest evicted.
const memo = new Map<string, Block[]>();
const MEMO_MAX = 64;

export function markdownToBlocksCached(input: string | null | undefined): Block[] {
  if (!input) return [];
  const hit = memo.get(input);
  if (hit) return hit;
  const blocks = markdownToBlocks(input);
  if (memo.size >= MEMO_MAX) memo.delete(memo.keys().next().value as string);
  memo.set(input, blocks);
  return blocks;
}
