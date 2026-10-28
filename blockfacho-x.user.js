// ==UserScript==
// @name         Blockfacho auto-block (X)
// @namespace    https://github.com/WeaversEpigone/XAutoBlockFarRight
// @homepageURL  https://github.com/WeaversEpigone/XAutoBlockFarRight
// @version      0.6.1
// @description  Récupère la liste vérifiée de blockfacho (copie GitHub mise à jour toutes les 6 h) et bloque les comptes X un par un, dans ta propre session.
// @match        https://x.com/*
// @grant        GM_xmlhttpRequest
// @grant        GM_getValue
// @grant        GM_setValue
// @connect      blockfacho.readymoss8.chatgpt.site
// @connect      raw.githubusercontent.com
// @run-at       document-idle
// @license      MIT
// ==/UserScript==

(() => {
  'use strict';

  const SITE = 'https://blockfacho.readymoss8.chatgpt.site';
  // copy of the list kept by the repo's GitHub Action (every 6 h); main source, the live site is the backup
  const REPO_LIST = 'https://raw.githubusercontent.com/WeaversEpigone/XAutoBlockFarRight/main';
  const DELAY_MS = [4000, 8000];     // random pause between two profiles; X locks accounts that block too fast
  // X's own test ids; if X renames them the script stops instead of clicking blindly
  const SEL = {
    more: '[data-testid="userActions"]',
    block: '[data-testid="block"]',
    confirm: '[data-testid="confirmationSheetConfirm"]',
    unblock: '[data-testid$="-unblock"]',
    emptyState: '[data-testid="emptyState"]',
  };

  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const get = (k, d) => GM_getValue(k, d);
  const set = (k, v) => GM_setValue(k, v);

  function waitFor(sel, ms = 10000) {
    return new Promise(resolve => {
      const t0 = Date.now();
      (function poll() {
        const el = document.querySelector(sel);
        if (el || Date.now() - t0 > ms) return resolve(el);
        setTimeout(poll, 250);
      })();
    });
  }

  function fetchText(path, base = SITE) {
    return new Promise((resolve, reject) => GM_xmlhttpRequest({
      method: 'GET', url: base + path, headers: { 'Cache-Control': 'no-store' }, timeout: 20000,
      ontimeout: () => reject(new Error(path + ' timeout')),
      onload: r => r.status === 200 ? resolve(r.responseText) : reject(new Error(path + ' ' + r.status)),
      onerror: () => reject(new Error(path + ' unreachable')),
    }));
  }

  const RESERVED = new Set(['i', 'home', 'search', 'explore', 'settings', 'messages', 'notifications', 'intent', 'share', 'hashtag']);
  const handleFromUrl = u => {
    const m = /^https?:\/\/(?:www\.)?(?:x|twitter)\.com\/@?([A-Za-z0-9_]{1,15})(?:[/?#]|$)/.exec(u || '');
    return m && !RESERVED.has(m[1].toLowerCase()) ? m[1] : null;
  };

  // Same merge as the site's swipe.js: static accounts.js + approved entries, minus approved removals.
  async function loadHandles() {
    const js = await fetchText('/accounts.js');
    const accounts = JSON.parse(js.slice(js.indexOf('['), js.lastIndexOf(']') + 1));
    const api = JSON.parse(await fetchText('/api/accounts'));
    if (!Array.isArray(api.entries)) throw new Error('format /api/accounts inattendu');

    const removed = new Set(api.entries.filter(e => e.type === 'removal').map(e => String(e.target_id || '').toLowerCase()));
    const byKey = new Map();
    for (const a of accounts) if (a.handle) byKey.set(a.handle.toLowerCase(), { name: a.name, handle: a.handle });
    for (const e of api.entries) {
      if (e.type === 'removal' || e.platform !== 'x') continue;
      const h = handleFromUrl(e.profile_url);
      if (!h) continue;
      const key = String(e.type === 'new' ? e.id : e.target_id).toLowerCase();
      byKey.set(key, { name: e.name, handle: h });
    }
    const seen = new Set(), out = [];
    for (const [key, a] of byKey) {
      const h = a.handle.toLowerCase();
      if (removed.has(key) || removed.has(h) || seen.has(h)) continue;
      seen.add(h);
      out.push(a);
    }
    return out;
  }

  // The fallback file comes from the network too: keep only well-formed entries.
  function parseFallback(text) {
    const list = JSON.parse(text);
    if (!Array.isArray(list)) throw new Error('copie GitHub illisible');
    const out = list.filter(a => a && typeof a.handle === 'string' && /^[A-Za-z0-9_]{1,15}$/.test(a.handle) && !RESERVED.has(a.handle.toLowerCase()))
      .map(a => ({ name: String(a.name || a.handle).slice(0, 100), handle: a.handle }));
    if (!out.length) throw new Error('copie GitHub vide');
    return out;
  }

  // "Commencer à" accepts a number or an @handle (also a pasted profile link); returns the queue number or null.
  function resolveStart(input, queue) {
    const v = String(input).trim();
    if (/^\d+$/.test(v)) return Math.max(1, parseInt(v, 10));
    const h = (handleFromUrl(v) || v.replace(/^@/, '')).toLowerCase();
    const a = queue.find(x => x.handle.toLowerCase() === h);
    return a ? a.n : null;
  }

  // --- panel ---
  const panel = document.createElement('div');
  panel.style.cssText = 'position:fixed;bottom:16px;right:16px;z-index:99999;width:300px;max-height:60vh;overflow:auto;' +
    'background:#111;color:#eee;font:13px/1.4 system-ui,sans-serif;border:1px solid #444;border-radius:10px;padding:12px';
  panel.innerHTML = `
    <b>Blockfacho auto-block</b>
    <div id="bf-status" style="margin:6px 0">…</div>
    <label><input type="checkbox" id="bf-dry"> Test (ne bloque pas, vérifie juste les boutons)</label><br>
    <label>Commencer à <input type="text" id="bf-from" placeholder="n° ou @compte" style="width:120px"></label>
    <div style="margin:8px 0;display:flex;gap:6px">
      <button id="bf-load">Charger la liste</button>
      <button id="bf-start" disabled>Démarrer</button>
      <button id="bf-stop">Stop</button>
    </div>
    <button id="bf-reset" style="font-size:11px">Remettre à zéro (oublie les comptes faits)</button>
    <details><summary>Voir les comptes</summary><ol id="bf-list" style="padding-left:20px"></ol></details>`;
  document.body.appendChild(panel);
  const $ = id => panel.querySelector('#' + id);
  const status = t => { $('bf-status').textContent = t; };

  const done = () => new Set(get('done', []));
  // Each queue entry keeps its number `n`; done accounts are skipped without visiting them.
  const todo = () => {
    const d = done(), from = get('from', 1);
    return get('queue', []).filter(a => a.n >= from && !d.has(a.handle.toLowerCase()));
  };
  $('bf-dry').checked = get('dry', true);
  $('bf-dry').onchange = e => set('dry', e.target.checked);
  $('bf-from').value = get('from', 1);
  $('bf-from').onchange = e => {
    const n = e.target.value.trim() ? resolveStart(e.target.value, get('queue', [])) : 1;
    if (n === null) return status(`${e.target.value.trim()} n'est pas dans la liste. Charge la liste ou vérifie l'orthographe.`);
    set('from', n);
    e.target.value = n;
    showQueue();
  };

  function showQueue() {
    const q = todo();
    $('bf-list').innerHTML = '';
    for (const a of q) {
      const li = document.createElement('li');
      li.value = a.n;
      li.textContent = `${a.name} (@${a.handle})`;
      $('bf-list').appendChild(li);
    }
    $('bf-start').disabled = !q.length;
    const last = get('last', 0) ? ` Dernier bloqué : n° ${get('last', 0)}.` : '';
    status(get('running', false) ? `En cours… ${q.length} restants.${last}` :
      q.length ? `${q.length} comptes à bloquer (${done().size} déjà faits).${last} Vérifie la liste avant de démarrer.` :
      get('queue', []).length ? `Rien à bloquer à partir du n° ${get('from', 1)} (${done().size} comptes déjà faits) 🎉` : 'Clique « Charger la liste ».');
  }

  // Keep the old order and append new accounts at the end, so numbers stay stable and new ones come last.
  function mergeQueue(fresh) {
    const byHandle = new Map(fresh.map(a => [a.handle.toLowerCase(), a]));
    const kept = get('queue', []).filter(a => byHandle.has(a.handle.toLowerCase()));
    const known = new Set(kept.map(a => a.handle.toLowerCase()));
    let n = kept.reduce((m, a) => Math.max(m, a.n || 0), 0);
    // queues saved by v0.1/v0.2 have no numbers, and todo() would hide them all
    const numbered = kept.map(a => a.n ? a : { ...a, n: ++n });
    return [...numbered, ...fresh.filter(a => !known.has(a.handle.toLowerCase())).map(a => ({ ...a, n: ++n }))];
  }

  $('bf-load').onclick = async () => {
    status('Chargement…');
    try {
      const before = get('queue', []).length;
      let list, note = '';
      try { list = parseFallback(await fetchText('/list/x.json', REPO_LIST)); }
      catch (e) {
        list = await loadHandles();
        note = `Copie GitHub indisponible (${e.message}) : liste lue directement sur le site. `;
      }
      set('queue', mergeQueue(list));
      showQueue();
      const added = get('queue', []).length - before;
      if (before && added > 0) note += `${added} nouveaux comptes ajoutés à la fin. `;
      if (note) status(note + $('bf-status').textContent);
    } catch (e) { status('Erreur : ' + e.message); }
  };
  $('bf-start').onclick = () => { set('running', true); set('runCount', 0); next(); };
  $('bf-stop').onclick = () => { set('running', false); showQueue(); };
  $('bf-reset').onclick = () => {
    if (!confirm('Oublier la liste et les comptes déjà faits, puis repartir du n° 1 ? (Ça ne débloque personne sur X.)')) return;
    set('running', false); set('done', []); set('last', 0); set('from', 1); set('queue', []);
    $('bf-from').value = 1;
    showQueue();
  };

  function stop(msg) { set('running', false); showQueue(); status(msg); }

  const DRY_COUNT = 3;
  // Dry runs mark nothing done, so they walk the queue by index instead.
  const current = () => todo()[get('dry', true) ? get('runCount', 0) : 0];

  function next() {
    const dry = get('dry', true), n = get('runCount', 0);
    if (dry && n >= DRY_COUNT) return stop(`Test OK sur ${n} profils : les boutons sont trouvés. Décoche « Test » puis « Démarrer ».`);
    const target = current();
    if (!target) return stop('Tout est bloqué 🎉');
    location.assign('https://x.com/' + target.handle);
  }

  function markDone(a) { set('done', [...done(), a.handle.toLowerCase()]); set('last', a.n); }

  // Runs on every page load while a run is active.
  async function step() {
    const target = current();
    if (!target) return stop('Tout est bloqué 🎉');
    // Never re-navigate on mismatch: X redirects to login/limit pages and that would loop forever.
    if (location.pathname.split('/')[1].toLowerCase() !== target.handle.toLowerCase())
      return stop(`X a redirigé vers ${location.pathname} au lieu de @${target.handle} (déconnecté ? limite ?). Arrêt.`);
    status(`@${target.handle}…`);

    const first = await waitFor(`${SEL.more}, ${SEL.unblock}, ${SEL.emptyState}`);
    await sleep(500);  // the unblock button can render just after the "more" button
    if (!get('running', false)) return showQueue();
    if (!first) return stop(`Profil @${target.handle} pas chargé (X a changé ? limite atteinte ?). Arrêt.`);

    const gone = document.querySelector(SEL.emptyState) && !document.querySelector(SEL.more);
    if (document.querySelector(SEL.unblock) || gone) {
      if (!get('dry', true)) markDone(target);  // already blocked, or account deleted/suspended
    } else {
      document.querySelector(SEL.more).click();
      const item = await waitFor(SEL.block, 5000);
      if (!item) return stop('Bouton « Bloquer » introuvable dans le menu. Arrêt pour ne rien casser.');
      if (get('dry', true)) {
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      } else {
        item.click();
        const ok = await waitFor(SEL.confirm, 5000);
        if (!ok) return stop('Confirmation introuvable. Arrêt.');
        ok.click();
        if (!await waitFor(SEL.unblock, 8000)) return stop(`X n'a pas confirmé le blocage de @${target.handle} (limite ?). Arrêt.`);
        markDone(target);
      }
    }
    set('runCount', get('runCount', 0) + 1);
    const [lo, hi] = DELAY_MS;
    await sleep(lo + Math.random() * (hi - lo));
    if (get('running', false)) next();
  }

  showQueue();
  if (get('running', false)) step();
})();
