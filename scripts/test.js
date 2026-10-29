// Self-check for the list file and the panel logic: node scripts/test.js
const fs = require('fs'), path = require('path'), assert = require('assert');
const src = fs.readFileSync(path.join(__dirname, '..', 'blockfacho-x.user.js'), 'utf8');
const pick = (start, end) => src.slice(src.indexOf(start), src.indexOf(end));
const code = pick('const RESERVED', '  // --- panel ---');
const { handleFromUrl, parseList, resolveStart } = new Function(code + '; return { handleFromUrl, parseList, resolveStart };')();

// list/x.json: every entry valid, no duplicates, nothing dropped by parseList
const raw = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'list', 'x.json'), 'utf8'));
const list = parseList(JSON.stringify(raw));
const handles = list.map(a => a.handle.toLowerCase());
assert(list.length > 300, 'list too small: ' + list.length);
assert.strictEqual(list.length, raw.length, 'invalid entries in list/x.json');
assert.strictEqual(new Set(handles).size, handles.length, 'duplicates in list/x.json');
const txt = fs.readFileSync(path.join(__dirname, '..', 'list', 'x.txt'), 'utf8').trim().split('\n');
assert.deepStrictEqual(txt.map(h => h.toLowerCase()).sort(), [...handles].sort(), 'list/x.txt and list/x.json differ');
console.log('ok list', list.length);

// parseList: junk entries are dropped, wrong shapes rejected
assert.deepStrictEqual(parseList('[{"handle":"ok_1"},{"handle":"i"},{"handle":"a b"},null,{"name":"x"}]'), [{ name: 'ok_1', handle: 'ok_1' }]);
assert.throws(() => parseList('{"handle":"x"}'));
assert.throws(() => parseList('[]'));
assert.strictEqual(handleFromUrl('https://x.com/i/status/1'), null);
console.log('ok parseList');

// mergeQueue: old order kept, removed accounts dropped, new ones appended with fresh numbers
let queue = [];
const mergeQueue = new Function('get', pick('function mergeQueue', "  $('bf-load')") + '; return mergeQueue;')(() => queue);
queue = mergeQueue([{ handle: 'A' }, { handle: 'B' }, { handle: 'C' }]);
assert.deepStrictEqual(queue.map(a => a.handle + a.n), ['A1', 'B2', 'C3']);
queue = mergeQueue([{ handle: 'D' }, { handle: 'c' }, { handle: 'A' }]);
assert.deepStrictEqual(queue.map(a => a.handle + a.n), ['A1', 'C3', 'D4']);
queue = [{ handle: 'A' }, { handle: 'B', n: 5 }];  // v0.1/v0.2 saved queues have no numbers
queue = mergeQueue([{ handle: 'A' }, { handle: 'B' }, { handle: 'C' }]);
assert.deepStrictEqual(queue.map(a => a.handle + a.n), ['A6', 'B5', 'C7']);
console.log('ok mergeQueue');

// resolveStart: number, @handle, bare handle, profile link; unknown handle -> null
const q = [{ handle: 'MLP_officiel', n: 1 }, { handle: 'J_Bardella', n: 7 }];
assert.strictEqual(resolveStart('42', q), 42);
assert.strictEqual(resolveStart('0', q), 1);
assert.strictEqual(resolveStart('@j_bardella', q), 7);
assert.strictEqual(resolveStart(' J_Bardella ', q), 7);
assert.strictEqual(resolveStart('https://x.com/J_Bardella/with_replies', q), 7);
assert.strictEqual(resolveStart('@nobody', q), null);
console.log('ok resolveStart');
