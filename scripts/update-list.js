// Fetches the live blockfacho list and writes list/x.json + list/x.txt: node scripts/update-list.js
// Reuses the userscript's own merge code so the published list always matches what the script blocks.
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..');
const src = fs.readFileSync(path.join(root, 'blockfacho-x.user.js'), 'utf8');
const SITE = /const SITE = '([^']+)'/.exec(src)[1];
const code = src.slice(src.indexOf('const RESERVED'), src.indexOf('  // --- panel ---'));

const fetchText = async p => {
  // no custom user-agent: the site answers 503 to unknown ones
  let r;
  try { r = await fetch(SITE + p, { headers: { 'cache-control': 'no-store' }, signal: AbortSignal.timeout(30000) }); }
  catch (e) { throw Object.assign(new Error(`${p} unreachable (${e.message})`), { siteDown: true }); }
  if (!r.ok) throw Object.assign(new Error(`${p} HTTP ${r.status}`), { siteDown: r.status >= 500 || r.status === 429 });
  return r.text();
};
const { loadHandles } = new Function('fetchText', code + '; return { loadHandles };')(fetchText);

(async () => {
  const list = (await loadHandles()).sort((a, b) => a.handle.toLowerCase().localeCompare(b.handle.toLowerCase()));
  const handles = list.map(a => a.handle);
  // refuse to overwrite a good list with a broken fetch (Cloudflare page, empty API, ...)
  if (list.length < 300) throw new Error(`only ${list.length} handles, refusing to write`);
  if (!handles.every(h => /^[A-Za-z0-9_]{1,15}$/.test(h))) throw new Error('invalid handle in list');
  if (new Set(handles.map(h => h.toLowerCase())).size !== handles.length) throw new Error('duplicate handles');

  fs.mkdirSync(path.join(root, 'list'), { recursive: true });
  fs.writeFileSync(path.join(root, 'list', 'x.json'), JSON.stringify(list, null, 2) + '\n');
  fs.writeFileSync(path.join(root, 'list', 'x.txt'), handles.join('\n') + '\n');
  console.log(`wrote ${list.length} handles`);
})().catch(e => {
  // site outage: keep the last good list and leave the run green; anything else is a real failure
  if (e.siteDown) { console.log(`::warning::blockfacho unavailable, list kept as is: ${e.message}`); return; }
  console.error(e.message);
  process.exit(1);
});
