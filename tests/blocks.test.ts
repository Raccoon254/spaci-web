import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  markdownToBlocks,
  safeHref,
  safeImageUrl,
  sanitizeMedia,
  MAX_BLOCKS,
  MAX_TEXT,
  MAX_DEPTH,
  type Block,
  type Inline
} from '../src/lib/blocks';

// Every string that can reach a renderer, flattened, for "never contains" checks.
function allStrings(v: unknown, out: string[] = []): string[] {
  if (typeof v === 'string') out.push(v);
  else if (Array.isArray(v)) v.forEach((x) => allStrings(x, out));
  else if (v && typeof v === 'object') Object.values(v).forEach((x) => allStrings(x, out));
  return out;
}
function links(blocks: Block[]): string[] {
  const out: string[] = [];
  const walk = (n: unknown) => {
    if (Array.isArray(n)) return n.forEach(walk);
    if (n && typeof n === 'object') {
      const o = n as Record<string, unknown>;
      if (o.t === 'link') out.push(o.href as string);
      Object.values(o).forEach(walk);
    }
  };
  walk(blocks);
  return out;
}
function depth(nodes: Inline[]): number {
  let d = 0;
  for (const n of nodes) if ('c' in n) d = Math.max(d, 1 + depth(n.c));
  return d;
}
const imgs = (b: Block[]) => b.filter((x) => x.t === 'img');

test('basic structure', () => {
  const b = markdownToBlocks('# Title\n\n## Sub\n\n#### Deep\n\nHello **bold** and *em* and `code`.\n\n- a\n- b\n\n1. one\n\n> quoted\n\n```\nx < y\n```\n\n---');
  assert.deepEqual(b[0], { t: 'h', level: 2, c: [{ t: 'text', v: 'Title' }] });
  assert.deepEqual(b[1], { t: 'h', level: 2, c: [{ t: 'text', v: 'Sub' }] });
  assert.equal((b[2] as { level: number }).level, 3);
  assert.deepEqual(b[3], {
    t: 'p',
    c: [
      { t: 'text', v: 'Hello ' },
      { t: 'strong', c: [{ t: 'text', v: 'bold' }] },
      { t: 'text', v: ' and ' },
      { t: 'em', c: [{ t: 'text', v: 'em' }] },
      { t: 'text', v: ' and ' },
      { t: 'code', v: 'code' },
      { t: 'text', v: '.' }
    ]
  });
  assert.deepEqual(b[4], { t: 'ul', items: [[{ t: 'text', v: 'a' }], [{ t: 'text', v: 'b' }]] });
  assert.equal(b[5].t, 'ol');
  assert.deepEqual(b[6], { t: 'quote', c: [{ t: 'text', v: 'quoted' }] });
  assert.deepEqual(b[7], { t: 'code', text: 'x < y' });
  assert.deepEqual(b[8], { t: 'hr' });
});

test('empty and non-string input', () => {
  assert.deepEqual(markdownToBlocks(''), []);
  assert.deepEqual(markdownToBlocks('   \n  '), []);
  assert.deepEqual(markdownToBlocks(undefined), []);
  assert.deepEqual(markdownToBlocks({ toString: () => '# x' }), []);
});

test('javascript:, data:, vbscript:, file:, http: and relative links become text', () => {
  const md = [
    '[a](javascript:alert(1))',
    '[b](JaVaScRiPt:alert(1))',
    '[c](  javascript:alert(1))',
    '[d](java&#x09;script:alert(1))',
    '[e](data:text/html,<script>alert(1)</script>)',
    '[f](vbscript:msgbox)',
    '[g](file:///etc/passwd)',
    '[h](http://example.com)',
    '[i](/relative)',
    '[j](//evil.com)',
    '<javascript:alert(1)>',
    'www.example.com'
  ].join('\n\n');
  const b = markdownToBlocks(md);
  assert.deepEqual(links(b), []);
  const text = allStrings(b).join(' ');
  for (const label of ['a', 'b', 'c', 'd', 'f', 'g', 'h', 'i', 'j']) assert.ok(text.includes(label));
});

test('https and mailto links survive, normalized', () => {
  const b = markdownToBlocks('[site](https://spaci.kentom.co.ke/changelog) and [mail](mailto:hi@kentom.co.ke) and <https://a.example/x>');
  assert.deepEqual(links(b), ['https://spaci.kentom.co.ke/changelog', 'mailto:hi@kentom.co.ke', 'https://a.example/x']);
});

test('safeHref edge cases', () => {
  assert.equal(safeHref('https://user:pw@example.com/'), null);
  assert.equal(safeHref('https://exa mple.com'), null);
  assert.equal(safeHref('https://example.com/\u0000'), null);
  assert.equal(safeHref('mailto:'), null);
  assert.equal(safeHref('mailto:javascript:alert(1)'), null);
  assert.equal(safeHref('https:example.com'), 'https://example.com/');
  assert.equal(safeHref(42), null);
});

test('reference-style links follow the same rules', () => {
  const b = markdownToBlocks('[ok][1] and [bad][2] and [also bad]\n\n[1]: https://example.com/a\n[2]: javascript:alert(1)\n[also bad]: data:text/html;base64,PHNjcmlwdD4=');
  assert.deepEqual(links(b), ['https://example.com/a']);
  assert.ok(!allStrings(b).some((s) => /javascript|data:/i.test(s)));
});

test('images: only allowlisted https hosts and paths survive', () => {
  const ok = [
    'https://spaci.kentom.co.ke/og.png',
    'https://raw.githubusercontent.com/Raccoon254/spaci/v2.3.0/changelog/media/a.png',
    'https://github.com/Raccoon254/spaci/assets/1/a.png',
    'https://github.com/user-attachments/assets/abc'
  ];
  const bad = [
    'data:image/png;base64,iVBORw0KGgo=',
    'data:image/svg+xml,<svg onload=alert(1)>',
    'http://spaci.kentom.co.ke/a.png',
    'https://evil.com/a.png',
    'https://spaci.kentom.co.ke.evil.com/a.png',
    'https://evil.com@spaci.kentom.co.ke/a.png',
    'https://raw.githubusercontent.com/someone/else/a.png',
    'https://raw.githubusercontent.com/Raccoon254/../evil/a.png',
    'https://raw.githubusercontent.com/Raccoon254/%2e%2e/evil/a.png',
    'https://github.com/evil/a.png',
    'https://github.com:8443/Raccoon254/a.png',
    'javascript:alert(1)',
    '/relative.png',
    'file:///etc/passwd'
  ];
  for (const u of ok) assert.ok(safeImageUrl(u), u);
  for (const u of bad) assert.equal(safeImageUrl(u), null, u);

  const md = [...ok, ...bad].map((u, i) => `![alt${i}](${u})`).join('\n\n');
  const b = markdownToBlocks(md);
  assert.deepEqual(
    imgs(b).map((x) => (x as { url: string }).url),
    ok.map((u) => new URL(u).href)
  );
});

test('image caption from title, alt kept, text around images split into paragraphs', () => {
  const b = markdownToBlocks('Before ![Shot](https://spaci.kentom.co.ke/a.png "The new view") after');
  assert.deepEqual(b, [
    { t: 'p', c: [{ t: 'text', v: 'Before' }] },
    { t: 'img', url: 'https://spaci.kentom.co.ke/a.png', alt: 'Shot', caption: 'The new view' },
    { t: 'p', c: [{ t: 'text', v: 'after' }] }
  ]);
});

test('raw HTML is dropped: <script>, <img onerror>, <iframe>, inline tags', () => {
  const md = [
    '<script>alert(1)</script>',
    '<img src=x onerror=alert(1)>',
    '<iframe src="https://evil.com"></iframe>',
    'Inline <script>alert(2)</script> text and <img src=x onerror=alert(3)> more <b>bold</b>',
    '<div onclick="alert(4)">block</div>',
    '<!-- comment -->',
    '<style>body{display:none}</style>'
  ].join('\n\n');
  const b = markdownToBlocks(md);
  const s = allStrings(b).join('\n');
  assert.ok(!/</.test(s), s);
  assert.ok(!/alert|onerror|onclick|display:none/.test(s), s);
  assert.ok(s.includes('Inline'));
  assert.ok(s.includes('bold'));
  assert.equal(imgs(b).length, 0);
});

test('HTML inside code is kept as literal text, never markup', () => {
  const b = markdownToBlocks('`<script>x</script>`\n\n```\n<img onerror=1>\n```');
  assert.deepEqual(b[0], { t: 'p', c: [{ t: 'code', v: '<script>x</script>' }] });
  assert.deepEqual(b[1], { t: 'code', text: '<img onerror=1>' });
});

test('entities are decoded to plain text', () => {
  const b = markdownToBlocks('Fish &amp; chips &lt;b&gt; &#65; &#x42; &bogus; &#0;');
  assert.deepEqual(b[0], { t: 'p', c: [{ t: 'text', v: 'Fish & chips <b> A B &bogus; �' }] });
});

test('nested emphasis converts, and nesting beyond MAX_DEPTH is flattened', () => {
  const b = markdownToBlocks('***bold italic*** and **a *b [c **d *e*** ](https://x.example)* f**');
  const p = b[0] as { t: 'p'; c: Inline[] };
  assert.equal(p.t, 'p');
  assert.ok(depth(p.c) <= MAX_DEPTH);
  const deep = markdownToBlocks('*a **b *c **d *e **f** e* d** c* b** a*');
  assert.ok(depth((deep[0] as { c: Inline[] }).c) <= MAX_DEPTH);
  assert.ok(allStrings(deep).join('').includes('f'));
});

test('deeply nested blockquotes and lists do not crash and stay flat', () => {
  const quotes = markdownToBlocks('>'.repeat(5000) + ' deep');
  assert.ok(quotes.length <= 1);
  let list = '';
  for (let i = 0; i < 200; i++) list += '  '.repeat(i) + '- item' + i + '\n';
  const l = markdownToBlocks(list);
  for (const blk of l) if (blk.t === 'ul' || blk.t === 'ol') for (const it of blk.items) assert.ok(depth(it) <= MAX_DEPTH);
});

test('limits: blocks, text runs, input size', () => {
  const many = Array.from({ length: 1000 }, (_, i) => `para ${i}`).join('\n\n');
  assert.equal(markdownToBlocks(many).length, MAX_BLOCKS);

  const long = markdownToBlocks('x'.repeat(50_000));
  for (const s of allStrings(long)) assert.ok(s.length <= MAX_TEXT);

  const code = markdownToBlocks('```\n' + 'y'.repeat(50_000) + '\n```');
  assert.equal((code[0] as { text: string }).text.length, MAX_TEXT);

  // Pathological inputs (marked's emphasis matching is superlinear) stay
  // bounded thanks to MAX_INPUT and MAX_INLINE_SRC.
  const hostile = [
    '*a _b '.repeat(200_000),
    ('*a _b '.repeat(600) + '\n\n').repeat(100),
    '![a]('.repeat(20_000),
    '['.repeat(100_000),
    '>'.repeat(100_000),
    '[x](' + '('.repeat(100_000)
  ];
  for (const h of hostile) {
    const t0 = Date.now();
    const out = markdownToBlocks(h);
    assert.ok(Date.now() - t0 < 5_000, `bounded time for ${h.slice(0, 12)}`);
    assert.ok(out.length <= MAX_BLOCKS);
  }
});

test('nested lists flatten into sibling items', () => {
  const b = markdownToBlocks('- a\n  - b\n    - c\n- d');
  assert.deepEqual(b, [{ t: 'ul', items: [[{ t: 'text', v: 'a' }], [{ t: 'text', v: 'b' }], [{ t: 'text', v: 'c' }], [{ t: 'text', v: 'd' }]] }]);
});

test('output only uses the contract block and inline types', () => {
  const md = '# h\n\n|a|b|\n|-|-|\n|1|2|\n\n~~del~~ text\n\n- [ ] task\n\nline one  \nline two';
  const allowedB = new Set(['h', 'p', 'ul', 'ol', 'quote', 'code', 'img', 'hr']);
  const allowedI = new Set(['text', 'strong', 'em', 'code', 'link']);
  const b = markdownToBlocks(md);
  const walkI = (n: Inline[]) => n.forEach((x) => (assert.ok(allowedI.has(x.t), x.t), 'c' in x && walkI(x.c)));
  for (const blk of b) {
    assert.ok(allowedB.has(blk.t), blk.t);
    if ('c' in blk) walkI(blk.c);
    if ('items' in blk) blk.items.forEach(walkI);
  }
});

test('sanitizeMedia keeps allowlisted images, accepts src or url', () => {
  const m = sanitizeMedia([
    { src: 'https://spaci.kentom.co.ke/a.png', alt: 'A', caption: 'cap' },
    { url: 'https://evil.com/a.png', alt: 'B' },
    { url: 'data:image/png;base64,AA', alt: 'C' },
    'nope',
    null
  ]);
  assert.deepEqual(m, [{ url: 'https://spaci.kentom.co.ke/a.png', alt: 'A', caption: 'cap' }]);
});
