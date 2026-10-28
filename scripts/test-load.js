// Self-check for the list merge: node scripts/test-load.js <dir with accounts.js and accounts (api json)>
const fs = require('fs'), path = require('path'), assert = require('assert');
const src = fs.readFileSync(path.join(__dirname, '..', 'blockfacho-x.user.js'), 'utf8');
const pick = (start, end) => src.slice(src.indexOf(start), src.indexOf(end));
const code = pick('const RESERVED', '  // --- panel ---');
const dir = process.argv[2];
const files = { '/accounts.js': 'accounts.js', '/api/accounts': 'accounts' };
const fetchText = async p => fs.readFileSync(path.join(dir, files[p]), 'utf8');
const { loadHandles, handleFromUrl } = new Function('fetchText', code + '; return { loadHandles, handleFromUrl };')(fetchText);

(async () => {
  const list = await loadHandles();
  const handles = list.map(a => a.handle.toLowerCase());
  assert(list.length > 300, 'too few handles: ' + list.length);
  assert.strictEqual(new Set(handles).size, handles.length, 'duplicates');
  assert(handles.includes('mlp_officiel'));
  assert(handles.every(h => /^[a-z0-9_]{1,15}$/.test(h)), 'bad handle');
  const api = JSON.parse(fs.readFileSync(path.join(dir, 'accounts'), 'utf8'));
  assert(!handles.includes('i') && !handles.includes('home'), 'reserved path kept');
  assert.strictEqual(handleFromUrl('https://x.com/i/status/1'), null);
  // a removal targets an entry id; resolve it to the handle that entry added
  const removed = api.entries.filter(e => e.type === 'removal').map(r => {
    const src = api.entries.find(e => e.id === r.target_id && e.type !== 'removal');
    return src ? handleFromUrl(src.profile_url) : String(r.target_id);
  }).filter(Boolean);
  for (const h of removed) assert(!handles.includes(h.toLowerCase()), 'removed account kept: ' + h);
  console.log('ok', list.length, 'handles; removed:', removed);

  // mergeQueue: old order kept, removed accounts dropped, new ones appended with fresh numbers
  let queue = [];
  const mergeQueue = new Function('get', pick('function mergeQueue', "  $('bf-load')") + '; return mergeQueue;')(() => queue);
  queue = mergeQueue([{ handle: 'A' }, { handle: 'B' }, { handle: 'C' }]);
  assert.deepStrictEqual(queue.map(a => a.handle + a.n), ['A1', 'B2', 'C3']);
  queue = mergeQueue([{ handle: 'D' }, { handle: 'c' }, { handle: 'A' }]);
  assert.deepStrictEqual(queue.map(a => a.handle + a.n), ['A1', 'C3', 'D4']);
  console.log('ok mergeQueue');
})().catch(e => { console.error(e); process.exit(1); });
