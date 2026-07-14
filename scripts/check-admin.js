#!/usr/bin/env node
/**
 * Pre-deploy safety net for admin/index.html (the Decap CMS panel).
 *
 * Runs entirely locally — it is NOT copied into the deployed site (the fdzeng.com
 * build only copies content/ and admin/), so it never affects the live website.
 * Its whole job is to catch the classes of bug that have bitten this file before:
 *   1. Broken JS syntax in an inline <script> block.
 *   2. Clobbering a library global — Leaflet's `L`, Decap's `CMS`, or `h`.
 *      (The coordinate map broke when window.L overwrote Leaflet.)
 *   3. The BM/EN helper not being global — previews live in a SEPARATE window-load
 *      handler, so the helper must be window.fdzL or they crash ("L is not a fn").
 *   4. FDZ_I18N dictionary drifting out of sync with config.yml labels/options.
 *
 * Usage:  node scripts/check-admin.js       (exit 1 on any hard failure)
 */

const fs = require('fs');
const path = require('path');

const ADMIN = path.join(__dirname, '..', 'admin', 'index.html');
const CONFIG = path.join(__dirname, '..', 'admin', 'config.yml');

const errors = [];
const warns = [];
function err(m) { errors.push(m); }
function warn(m) { warns.push(m); }

const html = fs.readFileSync(ADMIN, 'utf8');

// ── 1. Syntax check every inline <script> block ──────────────────────────────
const scriptRe = /<script>([\s\S]*?)<\/script>/g;
let m, blocks = 0;
while ((m = scriptRe.exec(html))) {
  const code = m[1];
  if (!code.trim()) continue;
  blocks++;
  try { new Function(code); }
  catch (e) { err(`Inline <script> block #${blocks} has a syntax error: ${e.message}`); }
}

// ── 2. Protected library globals must not be reassigned ──────────────────────
// Leaflet = L, Decap = CMS, createElement = h. Reassigning any breaks the CMS.
// `var CMS = window.CMS` / `var h = window.h` (reading into a local) is fine.
const globalTraps = [
  { re: /\bwindow\.L\s*=/,            msg: 'window.L is reassigned — this clobbers Leaflet (coordinate map breaks). Use window.fdzL.' },
  { re: /\bwindow\.CMS\s*=/,          msg: 'window.CMS is reassigned — clobbers Decap.' },
  { re: /\bwindow\.h\s*=/,            msg: 'window.h is reassigned — clobbers Decap createElement.' },
  { re: /\b(?:var|let|const)\s+L\b/,  msg: 'A local `L` is declared — it shadows Leaflet within its scope. Rename it.' },
  { re: /(^|[^.\w])L\s*=(?!=)/m,      msg: 'A bare `L = ...` assignment exists — likely clobbers Leaflet. Rename to fdzL.' }
];
for (const t of globalTraps) {
  if (t.re.test(html)) err(t.msg);
}

// ── 3. The BM/EN helper must be a global (previews are in another load handler) ─
if (!/\bwindow\.fdzL\s*=/.test(html)) {
  err('window.fdzL is not defined — the preview panes (in the first window-load handler) call fdzL() and will crash without it.');
}
if (/[^a-zA-Z.]L\(/.test(html)) {
  warn('Found a bare `L(` call — the language helper is fdzL(); a stray L( may be an un-renamed call or (harmlessly) Leaflet.');
}
const handlers = (html.match(/window\.addEventListener\('load'/g) || []).length;
if (handlers !== 2) {
  warn(`Expected 2 window-load handlers (previews + enhancers); found ${handlers}. If the split changed, re-check cross-handler globals.`);
}

// ── 4. FDZ_I18N dictionary ↔ config.yml labels/hints/options ────────────────
// Anything in config.yml with no dictionary entry renders in English while the
// rest of the panel is Malay. Hints were missing from this check for a long
// time, which is exactly how 26 of them drifted untranslated — so check both.
try {
  const start = html.indexOf('var FDZ_I18N = {');
  const end = html.indexOf('};', start);
  const keys = new Set();
  if (start !== -1 && end !== -1) {
    const block = html.slice(start, end);
    let k; const kre = /"((?:[^"\\]|\\.)*)"\s*:/g;
    while ((k = kre.exec(block))) keys.add(k[1].replace(/\\"/g, '"'));
  }
  const cfg = fs.readFileSync(CONFIG, 'utf8');
  const grab = (key) => {
    const out = [];
    let m;
    const quoted = new RegExp('^[ \\t]*' + key + ':[ \\t]*"((?:[^"\\\\]|\\\\.)*)"[ \\t]*$', 'gm');
    while ((m = quoted.exec(cfg))) out.push(m[1]);
    return out;
  };
  for (const [kind, strings] of [['label', grab('label')], ['hint', grab('hint')]]) {
    const uniq = [...new Set(strings)];
    const missing = uniq.filter(l => !keys.has(l));
    if (missing.length) {
      warn(`${missing.length} config ${kind} string(s) not in FDZ_I18N (will stay English in BM mode): ` +
        missing.slice(0, 5).map(s => JSON.stringify(s.slice(0, 60))).join(', ') + (missing.length > 5 ? ' …' : ''));
    }
  }
} catch (e) { warn('Could not run dictionary↔config check: ' + e.message); }

// ── 5. Every config widget must exist ────────────────────────────────────────
// config.yml leans on custom widgets registered in index.html (coordinate-map,
// currency-myr, date-conditional …). If a widget name is typo'd, or a custom one
// is renamed/removed, Decap silently renders a broken field — no console error.
// A YAML parser would be nicer but this repo has no node_modules, so: regex.
try {
  const cfg = fs.readFileSync(CONFIG, 'utf8');

  if (/^\t| \t/m.test(cfg)) {
    err('config.yml contains a TAB character — YAML forbids tabs and Decap will fail to load.');
  }

  const BUILTIN = new Set([
    'string', 'text', 'number', 'boolean', 'select', 'list', 'object', 'image',
    'file', 'datetime', 'date', 'markdown', 'relation', 'hidden', 'code',
    'color', 'map', 'uuid',
  ]);
  const custom = new Set(
    [...html.matchAll(/CMS\.registerWidget\(\s*['"]([^'"]+)['"]/g)].map(m => m[1])
  );
  const used = new Set(
    [...cfg.matchAll(/\bwidget:\s*["']?([A-Za-z0-9_-]+)["']?/g)].map(m => m[1])
  );
  const unknown = [...used].filter(w => !BUILTIN.has(w) && !custom.has(w));
  if (unknown.length) {
    err(`config.yml uses widget(s) that are neither Decap built-ins nor registered in admin/index.html: ` +
      unknown.map(w => JSON.stringify(w)).join(', ') +
      ` (registered custom widgets: ${[...custom].join(', ') || 'none'})`);
  }
} catch (e) { warn('Could not run widget check: ' + e.message); }

// ── Report ───────────────────────────────────────────────────────────────────
console.log(`[check-admin] scanned ${blocks} inline script block(s), ${handlers} load handler(s).`);
warns.forEach(w => console.log('  ⚠ ' + w));
if (errors.length) {
  console.error('\n[check-admin] FAILED:');
  errors.forEach(e => console.error('  ✗ ' + e));
  process.exit(1);
}
console.log('[check-admin] OK — no blocking issues.');
