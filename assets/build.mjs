// Builds every SVG in this folder, in a light and a dark variant.
// Usage: cd assets && npm i && node build.mjs
// Text is converted to glyph outlines (each glyph defined once, reused with <use>),
// so the SVGs render identically on GitHub without loading any font.
import { readFileSync, writeFileSync } from 'node:fs';
import opentype from 'opentype.js';

const here = new URL('.', import.meta.url).pathname;
const load = (pkg, file) => {
  const b = readFileSync(`${here}node_modules/@fontsource/${pkg}/files/${file}`);
  return opentype.parse(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength));
};
const FONTS = {
  d8: load('saira-condensed', 'saira-condensed-latin-800-normal.woff'),
  d7: load('saira-condensed', 'saira-condensed-latin-700-normal.woff'),
  d6: load('saira-condensed', 'saira-condensed-latin-600-normal.woff'),
  d4: load('saira-condensed', 'saira-condensed-latin-400-normal.woff'),
  t5: load('saira', 'saira-latin-500-normal.woff'),
  t4: load('saira', 'saira-latin-400-normal.woff'),
};

const THEMES = {
  dark: { bg: '#15171C', line: '#2A2E36', ink: '#F2F3F5', muted: '#8A909C', purple: '#B66DFF', green: '#3DDC84', yellow: '#FFD23F', red: '#FF2D1A', blue: '#3B8BFF', off: '#23262D' },
  light: { bg: '#F3F4F6', line: '#D5D9E0', ink: '#15171C', muted: '#5B6270', purple: '#7A2FE0', green: '#0F8F52', yellow: '#B97F00', red: '#E10600', blue: '#0057D9', off: '#E1E4E9' },
};
const PP = { ink: '#121212', lime: '#c6f432' }; // Pinpoint brand
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const r = (n) => Math.round(n * 100) / 100;

// One document = one SVG; collects the glyphs its text uses.
function doc() {
  const glyphs = new Map();
  const measure = (str, f, size, track = 0) => {
    const font = FONTS[f];
    let w = 0, prev = null;
    for (const g of font.stringToGlyphs(str)) {
      if (prev) w += font.getKerningValue(prev, g);
      w += g.advanceWidth + track * font.unitsPerEm;
      prev = g;
    }
    return (w - track * font.unitsPerEm) * size / font.unitsPerEm;
  };
  const text = (str, f, size, x, y, fill, { anchor = 'start', track = 0, cls = '' } = {}) => {
    const font = FONTS[f];
    const w = measure(str, f, size, track);
    const x0 = anchor === 'end' ? x - w : anchor === 'middle' ? x - w / 2 : x;
    let adv = 0, prev = null, uses = '';
    for (const g of font.stringToGlyphs(str)) {
      if (prev) adv += font.getKerningValue(prev, g);
      const id = `${f}-${g.index}`;
      if (g.path.commands.length) {
        if (!glyphs.has(id)) glyphs.set(id, g.getPath(0, 0, font.unitsPerEm).toPathData(0));
        uses += `<use href="#${id}" x="${Math.round(adv)}"/>`;
      }
      adv += g.advanceWidth + track * font.unitsPerEm;
      prev = g;
    }
    return `<g${cls ? ` class="${cls}"` : ''} fill="${fill}" transform="translate(${r(x0)} ${r(y)}) scale(${r(size / font.unitsPerEm * 1000) / 1000})">${uses}</g>`;
  };
  const wrap = (str, f, size, max) => {
    const lines = [];
    let cur = '';
    for (const word of str.split(' ')) {
      const next = cur ? `${cur} ${word}` : word;
      if (measure(next, f, size) > max && cur) { lines.push(cur); cur = word; } else cur = next;
    }
    return [...lines, cur];
  };
  const svg = (w, h, title, desc, body, style = '') =>
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-labelledby="t d">` +
    `<title id="t">${esc(title)}</title><desc id="d">${esc(desc)}</desc>` +
    (style ? `<style>${style}</style>` : '') +
    `<defs>${[...glyphs].map(([id, d]) => `<path id="${id}" d="${d}"/>`).join('')}</defs>${body}</svg>\n`;
  return { text, measure, wrap, svg };
}

const out = (name, theme, s) => writeFileSync(`${here}${name}-${theme}.svg`, s);

// ---------------------------------------------------------------- hero
function hero(t) {
  const W = 1200, H = 420, D = doc();
  let b = `<rect x="1" y="1" width="${W - 2}" height="${H - 2}" rx="18" fill="${t.bg}" stroke="${t.line}" stroke-width="2"/>`;

  // Start lights: five pods light one by one, then all go out (lights out = 3.9 s).
  const LIGHTS = 4.4, OUT = 3.9;
  let css = '';
  for (let i = 0; i < 5; i++) {
    const on = (0.5 + i * 0.6) / LIGHTS * 100, off = OUT / LIGHTS * 100;
    css += `@keyframes L${i}{0%,${r(on - 0.1)}%{fill:${t.off}}${r(on)}%,${r(off - 0.1)}%{fill:${t.red}}${r(off)}%,100%{fill:${t.off}}}.l${i}{animation:L${i} ${LIGHTS}s linear both}`;
    const x = 72 + i * 40;
    b += `<rect x="${x - 16}" y="44" width="32" height="32" rx="9" fill="none" stroke="${t.line}" stroke-width="2"/><circle class="l${i}" cx="${x}" cy="60" r="10" fill="${t.off}"/>`;
  }
  b += D.text('github.com/gowtham012', 't4', 20, W - 60, 67, t.muted, { anchor: 'end' });

  // Name, F1 convention: given names regular, SURNAME heavy caps.
  b += D.text('Gowtham Kumar', 'd4', 62, 56, 178, t.ink);
  b += D.text('SOLLETI', 'd8', 150, 50, 310, t.ink, { track: 0.01 });
  b += D.text('Founding Software Engineer', 't5', 28, 58, 362, t.ink);
  b += D.text('Backend, cloud and AI agents', 't4', 28, 58 + D.measure('Founding Software Engineer', 't5', 28) + 22, 362, t.muted);

  // Lap clock panel: counts 00.00 to 09.84 after lights out, the "faster than a pit stop" deploy.
  const PX = 744, PY = 112, PW = 400, PH = 216;
  b += `<rect x="${PX}" y="${PY}" width="${PW}" height="${PH}" rx="12" fill="none" stroke="${t.line}" stroke-width="2"/>`;
  b += D.text('Side-project deploy, lights out to live', 't4', 20, PX + 24, PY + 40, t.muted);

  const S = 104, cell = Math.max(...'0123456789'.split('').map((c) => D.measure(c, 'd7', S))) + 2;
  const base = PY + 142, x0 = PX + 22;
  const clipTop = base - S * 0.78, clipH = S * 0.86;
  b += `<clipPath id="clk"><rect x="${x0}" y="${clipTop}" width="${PW - 44}" height="${clipH}"/></clipPath><g clip-path="url(#clk)">`;
  const strip = (x, digits) => digits.map((c, k) => D.text(c, 'd7', S, x + (cell - D.measure(c, 'd7', S)) / 2, base + k * S, t.ink)).join('');
  const all = '01234567890'.split('');
  const T0 = OUT; // clock starts at lights out
  const Y = (n) => `translateY(${-n * S}px)`;
  // digit cells: 0 9 . 8 4
  let cx = x0;
  b += `<g>${strip(cx, ['0'])}</g>`; cx += cell;
  b += `<g class="u" style="transform:${Y(9)}">${strip(cx, all)}</g>`; cx += cell;
  b += D.text('.', 'd7', S, cx, base, t.ink); cx += D.measure('.', 'd7', S) + 4;
  b += `<g class="te" style="transform:${Y(8)}">${strip(cx, all)}</g>`; cx += cell;
  b += `<g class="hu" style="transform:${Y(4)}">${strip(cx, all)}</g>`; cx += cell;
  b += `</g>`;
  b += D.text('s', 'd6', 40, cx + 6, base, t.muted);
  css += `@keyframes U{from{transform:${Y(0)}}to{transform:${Y(9)}}}` +
    `@keyframes C{from{transform:${Y(0)}}to{transform:${Y(10)}}}` +
    `@keyframes E8{from{transform:${Y(0)}}to{transform:${Y(8)}}}` +
    `@keyframes E4{from,to{transform:${Y(4)}}}` +
    `.u{animation:U 9s steps(9,end) ${T0}s both}` +
    `.te{animation:C 1s steps(10,end) ${T0}s 9 backwards,E8 .8s steps(8,end) ${T0 + 9}s forwards}` +
    `.hu{animation:C .1s steps(10,end) ${T0}s 98 backwards,E4 .04s steps(4,end) ${T0 + 9.8}s forwards}`;

  // Sectors: purple, green, purple (purple = fastest overall).
  const secs = [[t.purple, 0, 3.1], [t.green, 3.1, 6.5], [t.purple, 6.5, 9.84]];
  const bw = (PW - 48 - 16) / 3;
  secs.forEach(([c, s0, s1], i) => {
    const x = PX + 24 + i * (bw + 8), y = PY + 170;
    b += `<rect x="${x}" y="${y}" width="${r(bw)}" height="10" rx="2" fill="${t.off}"/>`;
    b += `<rect class="s${i}" x="${x}" y="${y}" width="${r(bw)}" height="10" rx="2" fill="${c}"/>`;
    b += D.text(`S${i + 1}`, 't5', 16, x, y + 32, t.muted);
    css += `.s${i}{transform-box:fill-box;transform-origin:left center;animation:G ${r(s1 - s0)}s linear ${r(T0 + s0)}s both}`;
  });
  css += `@keyframes G{from{transform:scaleX(0)}to{transform:scaleX(1)}}`;
  css += `@media (prefers-reduced-motion:reduce){*{animation:none!important}}`;

  out('hero', t.name, D.svg(W, H, 'Gowtham Kumar Solleti, Founding Software Engineer',
    'Timing-screen banner. Five start lights go out, then a lap clock counts to 09.84 seconds: a side-project deploy, lights out to live. Backend, cloud and AI agents.', b, css));
}

// ---------------------------------------------------------------- section heading
function heading(t, slug, title, note, chip) {
  const W = 1200, H = 72, D = doc();
  let b = `<rect x="0" y="22" width="8" height="34" rx="2" fill="${t[chip]}"/>`;
  b += D.text(title, 'd7', 44, 26, 54, t.ink);
  const tw = 26 + D.measure(title, 'd7', 44) + 24;
  let end = W;
  if (note) { b += D.text(note, 't4', 20, W, 50, t.muted, { anchor: 'end' }); end = W - D.measure(note, 't4', 20) - 24; }
  b += `<rect x="${r(tw)}" y="42" width="${r(end - tw)}" height="2" fill="${t.line}"/>`;
  out(`h-${slug}`, t.name, D.svg(W, H, title, note || title, b));
}

// ---------------------------------------------------------------- contact buttons
const TYRES = { soft: 'red', medium: 'yellow', hard: 'ink', inter: 'green', wet: 'blue' };
function button(t, slug, label, tyre) {
  const D = doc(), H = 48;
  const w = Math.ceil(56 + D.measure(label, 't5', 19) + 20);
  let b = `<rect x="1" y="1" width="${w - 2}" height="${H - 2}" rx="10" fill="${t.bg}" stroke="${t.line}" stroke-width="2"/>`;
  b += `<circle cx="28" cy="24" r="9" fill="none" stroke="${t[TYRES[tyre]]}" stroke-width="5"/>`;
  b += D.text(label, 't5', 19, 48, 31, t.ink);
  out(`btn-${slug}`, t.name, D.svg(w, H, label, `${label} (${tyre} tyre)`, b));
  return w;
}

// ---------------------------------------------------------------- about: setup sheet
function about(t) {
  const W = 1200, D = doc();
  const rows = [
    ['Role', ['Founding Software Engineer']],
    ['Speciality', ['Terraform-driven cloud infra, Gen AI agents, DevOps automation']],
    ['Values', ['Build fast. Break less. Learn always.']],
    ['Fun fact', ['My side projects deploy faster than an F1 pit stop: under 10 s.']],
  ];
  let y = 8, b = '';
  for (const [k, [v]] of rows) {
    b += D.text(k, 't4', 24, 0, y + 50, t.muted);
    b += D.text(v, 't5', 31, 200, y + 50, t.ink);
    y += 80;
    b += `<rect x="0" y="${y}" width="${W}" height="1.5" fill="${t.line}"/>`;
  }
  const H = y + 2;
  out('about', t.name, D.svg(W, H, 'About', rows.map(([k, [v]]) => `${k}: ${v}`).join(' '), b));
}

// ---------------------------------------------------------------- Pinpoint flagship card
function pinpoint(t) {
  const W = 1200, H = 380, D = doc();
  const dark = t.name === 'dark';
  const bg = dark ? PP.ink : PP.lime, fg = dark ? '#F4F4F0' : PP.ink, sub = dark ? '#A3A39A' : '#3A4410', acc = dark ? PP.lime : PP.ink;
  let b = `<rect x="1" y="1" width="${W - 2}" height="${H - 2}" rx="18" fill="${bg}" stroke="${dark ? '#2C2C2C' : PP.ink}" stroke-width="2"/>`;
  // logo, viewBox -3 -1 30 30 scaled 7.4x
  b += `<g transform="translate(70 70) scale(7.4) translate(3 1)"><path d="M12 27.56 L4.22 19.78 A11 11 0 1 1 19.78 19.78 Z" fill="${PP.lime}" stroke="${dark ? PP.lime : PP.ink}" stroke-width="1.5" stroke-linejoin="round"/><circle cx="12" cy="12" r="3.6" fill="${PP.ink}"/></g>`;
  if (!dark) b = b.replace(`fill="${PP.lime}" stroke="${PP.ink}" stroke-width="1.5"`, `fill="${PP.ink}" stroke="${PP.ink}" stroke-width="1.5"`).replace(`r="3.6" fill="${PP.ink}"`, `r="3.6" fill="${PP.lime}"`);
  const X = 360;
  b += D.text('Pinpoint', 'd8', 96, X - 4, 132, fg);
  D.wrap('Point at your running app. Say what should change. Your coding agent gets it.', 't5', 30, W - X - 60)
    .forEach((l, i) => { b += D.text(l, 't5', 30, X, 186 + i * 42, fg); });
  b += D.text('Browser extension and local MCP server for Claude Code, Cursor and Codex.', 't4', 21, X, 284, sub);
  b += D.text('Live on', 't4', 20, X, 335, sub);
  let cx = X + D.measure('Live on', 't4', 20) + 14;
  for (const s of ['npm', 'MCP Registry', 'Firefox Add-ons', 'Product Hunt']) {
    const w = D.measure(s, 't5', 18) + 32;
    b += `<rect x="${r(cx)}" y="${310}" width="${r(w)}" height="36" rx="18" fill="none" stroke="${acc}" stroke-width="2"/>`;
    b += D.text(s, 't5', 18, cx + 16, 334, fg);
    cx += w + 10;
  }
  out('pinpoint', t.name, D.svg(W, H, 'Pinpoint',
    'Point at your running app. Say what should change. Your coding agent gets it. Browser extension and local MCP server, live on npm, the MCP Registry, Firefox Add-ons and Product Hunt.', b));
}

// ---------------------------------------------------------------- project cards
const PROJECTS = [
  { slug: 'pinpoint', name: 'Pinpoint', status: 'Open source', sector: 'purple',
    stack: 'Browser extension (Chrome, Firefox, Safari), Node MCP server, source maps, iOS/Android pickers',
    text: 'Live on npm, the MCP Registry, Firefox Add-ons and Product Hunt' },
  { slug: 'pitlane', name: 'PitLane Labs', status: 'Open source', sector: 'green',
    stack: 'Python, FastAPI, LangChain, FAISS, Pinecone',
    reads: [['<1 s', 'RAG answers'], ['3K', 'F1 engineering docs']] },
  { slug: 'mealmatch', name: 'MealMatch AI', status: 'Private', sector: 'yellow',
    stack: '15 micro-services, Go/Python, GKE, Pub/Sub, Stripe',
    reads: [['500K', 'MAU'], ['3K', 'RPS'], ['99.9%', 'uptime']] },
  { slug: 'lecheroo', name: 'Lecheroo', status: 'Stealth', sector: null,
    stack: 'FastAPI, AWS EKS, IoT ingestion',
    text: 'Real-time pricing and traceable nutrition labels' },
];
function card(t, p) {
  const W = 600, H = 330, D = doc();
  let b = `<rect x="1" y="1" width="${W - 2}" height="${H - 2}" rx="14" fill="${t.bg}" stroke="${t.line}" stroke-width="2"/>`;
  b += `<clipPath id="top"><rect x="0" y="0" width="${W}" height="${H}" rx="14"/></clipPath>`;
  if (p.sector) b += `<rect x="0" y="0" width="${W}" height="8" fill="${t[p.sector]}" clip-path="url(#top)"/>`;
  else { // stealth: hatched bar
    b += `<pattern id="h" width="12" height="8" patternUnits="userSpaceOnUse"><rect width="12" height="8" fill="${t.off}"/><path d="M0 8 L8 0 M6 8 L14 0" stroke="${t.muted}" stroke-width="2"/></pattern><rect x="0" y="0" width="${W}" height="8" fill="url(#h)" clip-path="url(#top)"/>`;
  }
  b += D.text(p.name, 'd7', 50, 30, 78, t.ink);
  b += D.text(p.status, 't4', 21, W - 30, 72, t.muted, { anchor: 'end' });
  D.wrap(p.stack, 't4', 22, W - 60).forEach((l, i) => { b += D.text(l, 't4', 22, 30, 120 + i * 31, t.muted); });
  const by = 200;
  b += `<rect x="30" y="${by}" width="${W - 60}" height="1.5" fill="${t.line}"/>`;
  if (p.reads) {
    const colW = (W - 60) / p.reads.length;
    p.reads.forEach(([v, l], i) => {
      b += D.text(v, 'd7', 60, 30 + i * colW, by + 76, p.sector ? t[p.sector] : t.ink);
      b += D.text(l, 't4', 21, 30 + i * colW, by + 108, t.muted);
    });
  } else {
    D.wrap(p.text, 't5', 27, W - 60).forEach((l, i) => { b += D.text(l, 't5', 27, 30, by + 54 + i * 38, t.ink); });
  }
  const desc = `${p.name} (${p.status}). ${p.stack}. ${p.reads ? p.reads.map((x) => x.join(' ')).join(', ') : p.text}.`;
  out(`card-${p.slug}`, t.name, D.svg(W, H, p.name, desc, b));
}

// ---------------------------------------------------------------- garage (stack)
function garage(t) {
  const W = 1200, D = doc();
  const cols = [
    ['Languages', ['Python', 'Go', 'Java', 'TypeScript']],
    ['Frameworks and runtimes', ['FastAPI', 'Spring', 'React', 'Next.js', 'Node.js']],
    ['Cloud and DevOps', ['AWS', 'GCP', 'Kubernetes', 'Docker', 'Terraform']],
    ['AI', ['LangChain', 'MCP', 'Pinecone', 'FAISS']],
  ];
  const cw = W / 4;
  let b = '';
  cols.forEach(([h, items], i) => {
    const x = i * cw + (i ? 24 : 0);
    if (i) b += `<rect x="${i * cw}" y="10" width="1.5" height="270" fill="${t.line}"/>`;
    b += D.text(h, 't4', 22, x, 32, t.muted);
    items.forEach((s, k) => { b += D.text(s, 'd6', 34, x, 86 + k * 46, t.ink); });
  });
  out('garage', t.name, D.svg(W, 290, 'Tech stack', cols.map(([h, i]) => `${h}: ${i.join(', ')}`).join('. '), b));
}

// ---------------------------------------------------------------- footer
function footer(t) {
  const W = 1200, H = 210, D = doc();
  let b = '';
  const q = 14;
  for (let x = 0; x * q < W; x++) for (let y = 0; y < 2; y++) if ((x + y) % 2 === 0) b += `<rect x="${x * q}" y="${y * q}" width="${q}" height="${q}" fill="${t.ink}"/>`;
  b += `<rect x="0" y="0" width="${W}" height="${2 * q}" fill="none" stroke="${t.ink}" stroke-width="1"/>`;
  b += D.text('Build fast, break less, learn always.', 'd6', 50, 0, 108, t.ink);
  b += D.text('Off track: Formula 1, weekend cooking, indie games, road cycling, design docs and the CLI.', 't4', 25, 0, 158, t.muted);
  out('footer', t.name, D.svg(W, H, 'Build fast, break less, learn always.',
    'Off track: Formula 1, weekend cooking, indie games, road cycling, design docs and the CLI.', b));
}

const widths = {};
for (const [name, t0] of Object.entries(THEMES)) {
  const t = { ...t0, name };
  hero(t);
  heading(t, 'about', 'About', '', 'ink');
  heading(t, 'flagship', 'Building now', '', 'purple');
  heading(t, 'projects', 'Projects', '', 'ink');
  heading(t, 'garage', 'Stack', '', 'ink');
  heading(t, 'telemetry', 'GitHub telemetry', 'updated daily', 'ink');
  for (const [slug, label, tyre] of [['linkedin', 'LinkedIn', 'soft'], ['portfolio', 'Portfolio', 'medium'], ['x', 'X', 'hard'], ['email', 'Email', 'inter'], ['resume', 'Resume (PDF)', 'wet']])
    widths[slug] = button(t, slug, label, tyre);
  about(t);
  pinpoint(t);
  PROJECTS.forEach((p) => card(t, p));
  garage(t);
  footer(t);
}
console.log('built; button widths', widths);
