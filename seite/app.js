/* Vertragsspiegel. Lädt daten/index.json (Gliederung, Umfang, Kanten) und den Wortlaut je Werk erst bei Bedarf.
   Ansichten nach Projektbrief Ziffer 5; Neutralitätsregeln nach Ziffer 6. */
(function () {
'use strict';
const $ = s => document.querySelector(s);
const fmt = n => Math.round(n).toLocaleString('de-CH').replace(/[’']/g, ' ');
const pct = (a, b) => (b ? a / b * 100 : 0).toLocaleString('de-CH', {maximumFractionDigits: 1, minimumFractionDigits: 1}) + ' %';
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]));
const gVar = g => `var(--c-${g})`;
const tint = (g, p) => `color-mix(in oklab, ${gVar(g)} ${p}%, var(--karte))`;
const ruhig = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const kuerze = (s, n) => s.length > n ? s.slice(0, Math.max(1, n - 1)) + '…' : s;

/* ---------- Tooltip ---------- */
const tip = $('#tip');
function showTip(ev, html) { tip.innerHTML = html; tip.hidden = false; moveTip(ev); }
function moveTip(ev) {
  const w = tip.offsetWidth, h = tip.offsetHeight;
  let x = ev.clientX + 14, y = ev.clientY + 14;
  if (x + w > innerWidth - 8) x = ev.clientX - w - 14;
  if (y + h > innerHeight - 8) y = ev.clientY - h - 14;
  tip.style.left = x + 'px'; tip.style.top = y + 'px';
}
function hideTip() { tip.hidden = true; }

/* ---------- Impressum und Fehlermeldung (wie im Politspiegel) ---------- */
document.querySelectorAll('.imp-mail').forEach(s => { const a = s.dataset.u + '@' + s.dataset.d; s.innerHTML = `<a href="mailto:${a}">${a}</a>`; });
(function () {
  const d = $('#meldenDialog'), f = $('#meldenForm'); if (!d || !f) return;
  const st = $('#meldenStatus'), los = $('#meldenLos'), schleier = $('#meldenSchleier');
  // Nicht modal: ein modaler Dialog sperrt auch das hCaptcha-Rätsel, das am body hängt.
  function auf() {
    $('#meldenSeite').value = location.href;
    st.textContent = ''; f.reset();
    if (gewaehlt !== null) $('#meldenStelle').value = `${docById.get(Z[gewaehlt].d).kurz}, ${Z[gewaehlt].l}`.slice(0, 200);
    schleier.hidden = false; d.show(); document.body.classList.add('melden-offen'); $('#meldenArt').focus();
  }
  function zu() { d.close(); schleier.hidden = true; document.body.classList.remove('melden-offen'); }
  document.addEventListener('click', ev => { const a = ev.target.closest && ev.target.closest('[data-melden]'); if (!a) return; ev.preventDefault(); auf(); });
  $('#meldenAb').addEventListener('click', zu); schleier.addEventListener('click', zu);
  document.addEventListener('keydown', ev => { if (ev.key === 'Escape' && d.open) zu(); });
  d.addEventListener('cancel', ev => { ev.preventDefault(); zu(); });
  f.addEventListener('submit', ev => {
    ev.preventDefault();
    const art = $('#meldenArt').value, text = $('#meldenText').value.trim();
    if (!art) { st.textContent = 'Bitte die Art des Fehlers wählen.'; return; }
    if (text.length < 10) { st.textContent = 'Bitte den Fehler in einem Satz beschreiben.'; return; }
    const cap = f.querySelector('[name="h-captcha-response"]');
    if (!cap || !cap.value) { st.textContent = 'Bitte zuerst das Captcha lösen.'; return; }
    los.disabled = true; st.textContent = 'Wird gesendet …';
    fetch('https://api.web3forms.com/submit', {method: 'POST', body: new FormData(f), headers: {Accept: 'application/json'}})
      .then(r => r.json())
      .then(j => { if (j && j.success) { st.textContent = 'Danke, die Meldung ist angekommen.'; setTimeout(zu, 1600); }
        else st.textContent = 'Das hat nicht geklappt: ' + ((j && j.message) || 'unbekannter Fehler') + '. Alternativ per Mail an die Adresse im Impressum.'; })
      .catch(() => { st.textContent = 'Keine Verbindung zum Formulardienst. Alternativ per Mail an die Adresse im Impressum.'; })
      .finally(() => { los.disabled = false; if (window.hcaptcha) { try { hcaptcha.reset(); } catch (_e) { /* */ } } });
  });
})();

/* ---------- Daten ---------- */
let D, Z, K, docById, gName, zIndex, aus, ein, docAus, docEin, gewaehlt = null;
let T = [], euNennung;            // Themen mit Muster; EU-Rechtsakt -> Map(Dokument -> erster Zettel, der ihn nennt)
const texte = new Map();          // Textteil -> Promise({id: [text, fussnoten]})

function textteil(id) {           // gleiche Regel wie scripts/bauen.py
  const t = id.split('/');
  if (t[2] !== '615') return t[2];
  const m = /^ziff_(\d+)(?:\.(\d+))?/.exec(t[3] || '');
  if (!m) return '615-rest';
  return m[1] === '2' && m[2] ? `615-2.${m[2]}` : `615-${m[1]}`;
}
function ladeText(id) {
  const t = textteil(id);
  if (!texte.has(t)) texte.set(t, fetch(`daten/text/${t}.json?v=__VERSION__`).then(r => r.json()));
  return texte.get(t).then(x => x[id] || ['', []]);
}
let alleTexte = null;
function ladeAlleTexte() {
  if (!alleTexte) alleTexte = Promise.all([...new Set(Z.map(z => textteil(z.i)))].map(t => {
    if (!texte.has(t)) texte.set(t, fetch(`daten/text/${t}.json?v=__VERSION__`).then(r => r.json()));
    return texte.get(t);
  })).then(teile => { const m = new Map(); teile.forEach(x => Object.entries(x).forEach(([k, v]) => m.set(k, v))); return m; });
  return alleTexte;
}

const ART = {
  verweist_auf: {aus: 'verweist auf', ein: 'wird verwiesen von'},
  nennt: {aus: 'nennt', ein: 'genannt in'},
  erlaeutert: {aus: 'erläutert', ein: 'erläutert durch'},
  genehmigt: {aus: 'genehmigt', ein: 'genehmigt durch'},
  aendert: {aus: 'ändert', ein: 'geändert durch'},
};
const refDoc = r => typeof r === 'number' ? Z[r].d : (/^fga\/2026\/(\d+)$/.exec(r) || [])[1] * 1 || null;
function refName(r, lang) {
  if (typeof r === 'number') { const z = Z[r]; return lang ? `${docById.get(z.d).kurz}, ${z.l}` : z.l; }
  if (r.startsWith('fga/')) { const d = docById.get(refDoc(r)); return d ? d.kurz : r; }
  if (r.startsWith('celex:')) { const c = r.slice(6); return lang && D.eu[c] ? `${c} ${D.eu[c]}` : c; }
  if (r.startsWith('sr:')) return 'SR ' + r.slice(3);
  if (r.startsWith('gesetz:')) { const g = gesetzById.get(r); return g ? (g.kurz || g.titel) : r; }
  return r;
}
let gesetzById;

fetch('daten/index.json?v=__VERSION__').then(r => r.json()).then(start).catch(e => {
  $('#laden').textContent = 'Die Daten konnten nicht geladen werden (' + e.message + '). Bitte die Seite neu laden.';
});

function start(daten) {
  D = daten; Z = D.z;
  docById = new Map(D.docs.map(d => [d.nr, d]));
  gName = Object.fromEntries(D.gruppen.map(g => [g.id, g.name]));
  zIndex = new Map(Z.map((z, i) => [z.i, i]));
  gesetzById = new Map(D.gesetze.map(g => [g.id, g]));
  K = D.k.map(([art, von, nach, stelle, regel], j) => ({j, art, von, nach, stelle, regel}));
  aus = Z.map(() => []); ein = Z.map(() => []); docAus = new Map(); docEin = new Map();
  const push = (m, k, v) => { if (!m.has(k)) m.set(k, []); m.get(k).push(v); };
  K.forEach(k => {
    if (typeof k.von === 'number') aus[k.von].push(k); else push(docAus, refDoc(k.von), k);
    if (typeof k.nach === 'number') ein[k.nach].push(k); else if (refDoc(k.nach)) push(docEin, refDoc(k.nach), k);
  });
  T = (D.themen || []).map(t => ({...t, rx: new RegExp(t.b.map(b => `(?:${b[1]})`).join('|'), 'g'),
    zm: new Map(t.z), n: t.z.reduce((s, x) => s + x[1], 0)}));
  euNennung = new Map();
  K.forEach(k => {
    if (k.art !== 'nennt' || typeof k.von !== 'number' || typeof k.nach !== 'string' || !k.nach.startsWith('celex:')) return;
    const d = Z[k.von].d; if (d === 615) return;
    if (!euNennung.has(k.nach)) euNennung.set(k.nach, new Map());
    const m = euNennung.get(k.nach); if (!m.has(d)) m.set(d, k.von);
  });
  $('#laden').remove();
  kennzahlen(); baum(); legende(); suche(); reiterAufbauen(); graphFilter(); findenAufbauen(); verknAufbauen();
  const h = hashLesen();
  filt.thema = h.thema ? T.find(t => t.id === h.thema) || null : null;
  filt.art = TEXTART[h.art] ? h.art : null;
  findenStand();
  zeigeReiter('umfang');
  const mitFilter = !!(filt.thema || filt.art);
  if (mitFilter) filterAnwenden({still: true});
  if (h.zettel !== null) waehle(h.zettel, true, null, mitFilter);
  else if (mitFilter) zeigeListe();
  else startseite();
  let gespeichert = null; try { gespeichert = localStorage.getItem('vs-reiter'); } catch (e) { /* */ }
  if (gespeichert && REITER.includes(gespeichert) && gespeichert !== 'umfang' && h.zettel === null) zeigeReiter(gespeichert);
  addEventListener('hashchange', () => {
    const n = hashLesen(), t = n.thema ? T.find(x => x.id === n.thema) || null : null, a = TEXTART[n.art] ? n.art : null;
    if (t !== filt.thema || a !== filt.art) { filt.thema = t; filt.art = a; findenStand(); filterAnwenden({liste: n.zettel === null && !!(t || a)}); }
    if (n.zettel !== null && n.zettel !== gewaehlt) waehle(n.zettel, true);
    else if (n.zettel === null && !t && !a && gewaehlt !== null) startseite();
  });
  let rt; addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(neuZeichnen, 150); });
}
// Ohne Anker öffnet die Seite keinen Text: Jede Vorauswahl würde einen Artikel hervorheben (Gestaltungsentscheid 1.7).
function startseite() {
  gewaehlt = null; listeOffen = false; bogenZurueck = null; listeZurueck = false; bzSel = null;
  zEl.innerHTML = `
    <div><div class="ort">Zettel</div><h3>Noch kein Text geöffnet</h3></div>
    <p>Jeder Zettel ist ein Artikel, ein Anhangsteil oder eine Ziffer der Botschaft, mit ungekürztem Wortlaut, Fundstelle im amtlichen PDF und den Verknüpfungen zu anderen Texten.</p>
    <div><h4>So öffnen Sie einen Text</h4><ul class="start-wege">
      <li>Im Umfang ein Feld anklicken, bis ein einzelner Zettel erscheint.</li>
      <li>Oben ein Wort im Wortlaut oder einen Titel suchen.</li>
      <li>Unter «Finden» ein Thema oder eine Textart wählen.</li></ul></div>`;
  if (aktiv === 'umfang') zeichneUmfang(false);
  if (bzSvg) bzFaerben();
  hashSchreiben();
}
// Anker (Projektbrief Ziffer 10.4): #fga-2026-632-art_4, ergänzt um &thema-<id> und &text-<art> (Ziffer 5.4)
function hashLesen() {
  const r = {zettel: null, thema: null, art: null};
  decodeURIComponent(location.hash.slice(1)).split('&').filter(Boolean).forEach(t => {
    if (t.startsWith('thema-')) { r.thema = t.slice(6); return; }
    if (t.startsWith('text-')) { r.art = t.slice(5); return; }
    const m = /^fga-2026-(\d+)-(.+)$/.exec(t);
    const id = m ? `fga/2026/${m[1]}/${m[2].replace(/-/g, '/')}` : t;
    if (zIndex.has(id)) r.zettel = zIndex.get(id);
  });
  return r;
}
function hashSchreiben() {
  const t = [];
  if (gewaehlt !== null && !listeOffen) t.push(anker(Z[gewaehlt].i));
  if (filt.thema) t.push('thema-' + filt.thema.id);
  if (filt.art) t.push('text-' + filt.art);
  const h = t.length ? '#' + t.join('&') : location.pathname + location.search;
  if (location.hash !== (t.length ? h : '')) history.replaceState(null, '', h);
}
const anker = id => id.replace(/\//g, '-');

function kennzahlen() {
  const k = D.kennzahlen;
  const z = [[k.dokumente, 'Dokumente'], [k.seiten, 'Seiten'], [k.woerter, 'Wörter'], [k.zettel, 'Zettel'],
    [K.filter(x => x.art === 'verweist_auf').length, 'Artikelverweise'], [k.eu, 'EU-Rechtsakte'],
    [k.gesetze_neu + k.gesetze_geaendert, 'Bundesgesetze']];
  $('#kennzahlen').innerHTML = z.map(([n, l]) => `<li><b>${fmt(n)}</b><span>${l}</span></li>`).join('');
}

/* ---------- Gliederung als Baum ---------- */
let root, total;
function baum() {
  const daten = {name: 'Paket Schweiz–EU', kind: 'paket', children: []};
  const gruppen = new Map(D.gruppen.map(g => { const n = {name: g.name, kind: 'gruppe', g: g.id, children: []}; daten.children.push(n); return [g.id, n]; }));
  const docs = new Map(D.docs.map(d => { const n = {name: d.kurz, kind: 'doc', doc: d.nr, children: []}; gruppen.get(d.gruppe).children.push(n); return [d.nr, n]; }));
  Z.forEach((z, i) => {
    let knoten = docs.get(z.d);
    z.p.forEach(label => {
      let k = knoten.children.find(c => c.kind === 'teil' && c.name === label);
      if (!k) { k = {name: label, kind: 'teil', doc: z.d, children: []}; knoten.children.push(k); }
      knoten = k;
    });
    knoten.children.push({name: z.l, kind: 'blatt', i, doc: z.d, value: Math.max(z.w, 1)});
  });
  // Ein Zettel, der den Kopf einer Gruppe bildet («Art. 1 Änderungen …» zur Gruppe «Art. 1»), wird ihr erstes Kind
  (function ordne(n) {
    if (!n.children) return;
    const gruppen = n.children.filter(c => c.kind === 'teil');
    n.children = n.children.filter(c => {
      if (c.kind !== 'blatt') return true;
      const g = gruppen.find(t => c.name === t.name || c.name.startsWith(t.name + ' '));
      if (g) { g.children.unshift(c); return false; }
      return true;
    });
    n.children.forEach(ordne);
  })(daten);
  daten.children = daten.children.filter(g => g.children.length);
  root = d3.hierarchy(daten).sum(d => d.value || 0);
  root.each(d => { let a = d; while (a.depth > 1) a = a.parent; d.g = d.depth === 0 ? null : a.data.g; });
  total = root.value;
  blattVon = new Map(root.leaves().map(l => [l.data.i, l]));
}
let blattVon;
function legende() {
  $('#legende').innerHTML = root.children.map(n =>
    `<li><i style="background:${gVar(n.data.g)}"></i>${esc(n.data.name)} <span style="color:var(--text-leise)">${pct(n.value, total)}</span></li>`).join('');
}

/* ---------- Umfang: Icicle und Übersichtsfeld (Ziffer 5.1) ---------- */
const icEl = $('#icicle'), ueEl = $('#uebersicht');
let fokus, treffer = null, H = 620;
const GAP = 2;
function zeichneUmfang(animiert) { if (!fokus) fokus = root; zeichneIcicle(animiert); zeichneUebersicht(); }
function zeichneIcicle(animiert) {
  const W = Math.max(icEl.clientWidth, 260);
  H = innerWidth < 700 ? 520 : 620;
  d3.partition().size([H, 1])(root);
  const p = fokus;
  const schmal = Math.min(150, W * 0.2), breit = (W - schmal) / 3;
  root.each(d => {
    const rel = d.depth - p.depth, y0 = rel <= 0 ? 0 : schmal + (rel - 1) * breit;
    d.t = {x0: (d.x0 - p.x0) / (p.x1 - p.x0) * H, x1: (d.x1 - p.x0) / (p.x1 - p.x0) * H,
      y0: rel < 0 ? -9999 : y0, y1: rel < 0 ? -9999 : (rel === 0 ? schmal : y0 + breit)};
  });
  let svg = d3.select(icEl).select('svg');
  if (svg.empty()) svg = d3.select(icEl).append('svg').attr('role', 'img').attr('aria-label', 'Icicle: Umfang des Pakets nach Gliederung in Wörtern');
  svg.attr('viewBox', `0 0 ${W} ${H}`).attr('width', '100%').attr('height', H);
  const nodes = root.descendants().filter(d => d.t.y0 >= 0 && d.t.y0 < W - 1 && d.t.x1 > 0 && d.t.x0 < H && (d.t.x1 - d.t.x0) > 0.4);
  const schl = d => d.data.i !== undefined ? 'z' + d.data.i : d.ancestors().map(a => a.data.name).join('|');
  const g = svg.selectAll('g.ic').data(nodes, schl);
  g.exit().remove();
  const ge = g.enter().append('g').attr('class', 'ic');
  ge.append('rect').attr('class', 'ic-rect').attr('rx', 3);
  ge.append('text').attr('class', 'ic-label');
  ge.append('text').attr('class', 'ic-sub');
  ge.append('rect').attr('class', 'ic-anteil').attr('rx', 1.5);
  const all = ge.merge(g);
  // Auswahl (Ziffer 5.4): Anteil der markierten Wörter je Feld als Streifen am rechten Rand
  root.each(d => { d.hitW = 0; });
  if (treffer) root.leaves().forEach(l => { if (treffer.has(l.data.i)) { let a = l; while (a) { a.hitW += l.value; a = a.parent; } } });
  const t = animiert && !ruhig() ? svg.transition().duration(450) : null;
  const pos = sel => (t ? sel.transition(t) : sel);
  pos(all).attr('transform', d => `translate(${d.t.y0},${d.t.x0})`);
  const hit = d => !treffer || d.depth === 0 || (d.data.i !== undefined ? treffer.has(d.data.i) : d.leaves().some(l => treffer.has(l.data.i)));
  pos(all.select('rect'))
    .attr('width', d => Math.max(0, d.t.y1 - d.t.y0 - GAP)).attr('height', d => Math.max(0, d.t.x1 - d.t.x0 - GAP))
    .attr('fill', d => d.depth === 0 ? 'var(--flaeche)' : tint(d.g, d.data.i !== undefined ? 34 : (d.depth === 1 ? 72 : 52)))
    .attr('stroke', d => d.data.i !== undefined && d.data.i === gewaehlt ? 'var(--text)' : 'none').attr('stroke-width', 2.5)
    .attr('opacity', d => hit(d) ? 1 : 0.2);
  all.select('rect').attr('tabindex', d => (d.t.x1 - d.t.x0) > 12 ? 0 : null)
    .attr('aria-label', d => `${d.data.name}, ${fmt(d.value)} Wörter`)
    .on('pointerenter pointermove', (ev, d) => {
      const par = d.parent;
      showTip(ev, `<b>${esc(d.data.name)}</b>${fmt(d.value)} Wörter<br><span>${pct(d.value, total)} des Pakets${par && par.depth > 0 ? ', ' + pct(d.value, par.value) + ' von ' + esc(par.data.name) : ''}</span>`);
    })
    .on('pointerleave', hideTip)
    .on('click', (ev, d) => klickIcicle(d))
    .on('keydown', (ev, d) => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); klickIcicle(d); } });
  all.select('.ic-label').attr('x', 7).attr('y', 17)
    .text(d => { const w = d.t.y1 - d.t.y0 - 14, h = d.t.x1 - d.t.x0; if (h < 19 || w < 30) return ''; return kuerze(d.data.name, Math.floor(w / 7.3)); });
  all.select('.ic-sub').attr('x', 7).attr('y', 34)
    .text(d => { const w = d.t.y1 - d.t.y0 - 14, h = d.t.x1 - d.t.x0; if (h < 38 || w < 80) return '';
      return kuerze(fmt(d.value) + ' Wörter' + (treffer && d.hitW ? ` · ${pct(d.hitW, d.value)} markiert` : ''), Math.floor(w / 6.6)); });
  pos(all.select('.ic-anteil')).attr('display', d => treffer && d.hitW && d.depth > 0 ? null : 'none')
    .attr('x', d => Math.max(0, d.t.y1 - d.t.y0 - GAP - 7)).attr('width', 5)
    .attr('y', 1).attr('height', d => Math.max(1.5, (d.t.x1 - d.t.x0 - GAP - 2) * (d.hitW || 0) / Math.max(1, d.value)));
  const pfad = $('#pfad');
  pfad.innerHTML = fokus.ancestors().reverse().map((a, i, arr) => i < arr.length - 1
    ? `<button data-i="${i}">${esc(kuerze(a.data.name, 40))}</button><span aria-hidden="true">›</span>` : `<strong>${esc(a.data.name)}</strong>`).join('');
  pfad.querySelectorAll('button').forEach(b => b.onclick = () => { fokus = fokus.ancestors().reverse()[+b.dataset.i]; zeichneUmfang(true); });
}
function zeichneUebersicht() {
  // Vier feste Spalten: Vorlage, Dokument, erste Gliederungsebene, alle Zettel. Die Partition liegt schon in Pixeln (0..H).
  const OW = Math.max(ueEl.clientWidth, 60), cw = OW / 4;
  const spalteVon = d => d.data.i !== undefined ? 3 : Math.min(d.depth - 1, 3);
  ueEl.innerHTML = '';
  const svg = d3.select(ueEl).append('svg').attr('viewBox', `0 0 ${OW} ${H}`).attr('height', H)
    .attr('role', 'img').attr('aria-label', 'Übersichtsfeld: das ganze Paket, Rahmen zeigt den Ausschnitt der Hauptansicht');
  const knoten = root.descendants().filter(d => d.depth > 0 && (d.depth <= 3 || d.data.i !== undefined) && (d.x1 - d.x0) >= 0.35);
  svg.append('g').selectAll('rect').data(knoten).join('rect')
    .attr('x', d => spalteVon(d) * cw).attr('y', d => d.x0).attr('width', Math.max(1, cw - 1.5)).attr('height', d => Math.max(0.35, d.x1 - d.x0 - (d.x1 - d.x0 > 3 ? 0.8 : 0)))
    .attr('fill', d => tint(d.g, d.data.i !== undefined ? 40 : 75));
  // Suchtreffer und geöffneter Zettel (Ziffer 5.1.4)
  if (treffer) {
    const marken = root.leaves().filter(l => treffer.has(l.data.i));
    svg.append('g').selectAll('rect').data(marken).join('rect').attr('x', 3 * cw).attr('width', cw - 1.5)
      .attr('y', d => d.x0 - 0.5).attr('height', d => Math.max(1.5, d.x1 - d.x0)).attr('fill', 'var(--text)');
  }
  if (gewaehlt !== null && blattVon.has(gewaehlt)) {
    const b = blattVon.get(gewaehlt), y = (b.x0 + b.x1) / 2;
    svg.append('path').attr('d', `M0,${y}H${OW}`).attr('stroke', 'var(--text)').attr('stroke-width', 2);
    svg.append('path').attr('d', `M0,${y - 6}L7,${y}L0,${y + 6}Z`).attr('fill', 'var(--text)');
  }
  // Rahmen um den Ausschnitt der Hauptansicht (Ziffer 5.1.2); bei sehr kleinem Ausschnitt mindestens 8 px hoch
  const f = fokus, fx = f === root ? 0 : spalteVon(f) * cw, fy = (f.x0 + f.x1) / 2, fh = Math.max(8, f.x1 - f.x0);
  svg.append('rect').attr('x', fx + 1).attr('y', Math.max(1, Math.min(H - fh - 1, fy - fh / 2)))
    .attr('width', Math.max(4, OW - fx - 2)).attr('height', fh)
    .attr('fill', 'color-mix(in oklab, var(--text) 10%, transparent)').attr('stroke', 'var(--text)').attr('stroke-width', 2).attr('rx', 2)
    .style('pointer-events', 'none');
  const unter = (x, y) => {
    const spalte = Math.max(0, Math.min(3, Math.floor(x / cw)));
    let n = root;
    while (n.children) {
      const c = n.children.find(c => y >= c.x0 && y < c.x1); if (!c) break; n = c;
      if (spalte < 3 && n.depth >= spalte + 1) break;
    }
    return n;
  };
  svg.on('pointermove', ev => { const [x, y] = d3.pointer(ev); const n = unter(x, y); showTip(ev, `<b>${esc(n.data.name)}</b>${fmt(n.value)} Wörter<br><span>Klick: hierhin springen</span>`); })
    .on('pointerleave', hideTip)
    .on('click', ev => { const [x, y] = d3.pointer(ev); let n = unter(x, y); if (!n.children) n = n.parent; fokus = n; hideTip(); zeichneUmfang(true); });
  $('#uebersicht-kopf').textContent = fokus === root ? 'Ganzes Paket' : 'Ganzes Paket, Rahmen = Ausschnitt';
}
function klickIcicle(d) {
  if (d.data.i !== undefined) { waehle(d.data.i, false); return; }
  fokus = (fokus === d && d.parent) ? d.parent : d;
  zeichneUmfang(true);
}
function fokusAufDoc(nr) {
  const n = root.descendants().find(d => d.data.kind === 'doc' && d.data.doc === nr);
  if (n) { fokus = n; zeigeReiter('umfang'); zeichneUmfang(true); }
}
function fokusAufZettel(i) {          // Ausschnitt so, dass der Zettel in der letzten der vier Spalten steht
  const b = blattVon.get(i); if (!b) return;
  const p = b.ancestors();
  fokus = p[Math.min(3, p.length - 1)];
}

/* ---------- Auswahl und Zettel (Ziffer 5, Ansicht 4) ---------- */
const zEl = $('#zettel');
let bogenZurueck = null, listeZurueck = false, listeOffen = false;
function waehle(i, zoom, vonBogen, vonListe) {
  gewaehlt = i; listeOffen = false;
  bogenZurueck = vonBogen || null;
  listeZurueck = !!vonListe;
  if (!vonBogen) bzSel = null;
  if (zoom) { fokusAufZettel(i); if (aktiv !== 'umfang') zeigeReiter('umfang'); }
  if (aktiv === 'umfang') zeichneUmfang(!!zoom);
  zeichneZettel(i);
  if (bzSvg) bzFaerben();
  hashSchreiben();
}
function ortVon(z) {
  const d = docById.get(z.d);
  return `${d.gruppe === 'botschaft' ? '' : esc(gName[d.gruppe]) + ' › '}${esc(d.kurz)}${z.p.length ? ' › ' + z.p.map(esc).join(' › ') : ''}`;
}
function pdfLink(d, seite) { return d.pdf ? `${d.pdf}#page=${seite}` : d.eli; }
// Markierung im Wortlaut: Begriffe des gewählten Themas (Klasse th) und das Suchwort (Klasse q).
// Fundstellen werden am Rohtext bestimmt und erst danach maskiert, damit keine Markierung in ein Tag gerät.
const regexText = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
function hervorheben(t, q) {
  const r = [];
  if (filt.thema) for (const m of t.matchAll(filt.thema.rx)) if (m[0]) r.push([m.index, m.index + m[0].length, 'th']);
  if (q && q.length >= 2) for (const m of t.matchAll(new RegExp(regexText(q), 'gi'))) r.push([m.index, m.index + m[0].length, 'q']);
  if (!r.length) return esc(t);
  r.sort((a, b) => a[0] - b[0] || b[1] - a[1]);
  let out = '', pos = 0;
  for (const [a, b, k] of r) { if (a < pos) continue; out += esc(t.slice(pos, a)) + `<mark class="${k}">${esc(t.slice(a, b))}</mark>`; pos = b; }
  return out + esc(t.slice(pos));
}
function markiere(html, q) {          // nur für kurze Ausschnitte in der Trefferliste der Suche
  if (!q || q.length < 2) return html;
  return html.replace(new RegExp(regexText(esc(q)), 'gi'), m => `<mark class="q">${m}</mark>`);
}
function zeichneZettel(i) {
  const z = Z[i], d = docById.get(z.d);
  const seiten = z.s && z.s.length ? (z.s[0] === z.s[1] ? `S. ${z.s[0]}` : `S. ${z.s[0]}–${z.s[1]}`) : '';
  const zurueck = bogenZurueck ? '← Zurück zum Bogen' : listeZurueck && treffer ? `← Zurück zur Liste (${fmt(treffer.size)} Zettel)` : '';
  zEl.innerHTML = `
    ${zurueck ? `<button class="knopf" id="zurueck" style="justify-self:start">${esc(zurueck)}</button>` : ''}
    <div>
      <div class="ort"><span class="punkt" style="background:${gVar(d.gruppe)}"></span>${ortVon(z)}</div>
      <h3>${esc(z.l)}</h3>
    </div>
    <div class="meta"><span>BBl 2026 ${d.nr}</span><span>${fmt(z.w)} Wörter</span>
      ${seiten ? `<a href="${esc(pdfLink(d, z.s[0]))}" target="_blank" rel="noopener">PDF, ${seiten}</a>` : ''}
      <a href="${esc(d.eli)}" target="_blank" rel="noopener">Fedlex</a>
      <a href="#${esc(anker(z.i))}" title="Direkter Link auf diesen Zettel">Link</a>
      <button type="button" class="knopf klein" data-grafik="wortlaut" style="margin-left:0">Wortlaut als Grafik</button></div>
    <div class="fund" id="fund" hidden></div>
    <div class="wortlaut" id="wortlaut" tabindex="0" aria-label="Wortlaut"><span class="leer">Wortlaut wird geladen …</span></div>
    <section class="uf-teil" aria-labelledby="uf-titel">
      <div class="uf-kopfzeile"><h4 id="uf-titel">Umfeld: womit dieser Text verknüpft ist <span class="marke">Rohextraktion</span></h4>
        <button type="button" class="knopf klein" data-grafik="umfeld" style="margin-left:0">Als Grafik</button>
        <div class="schalter klein" id="uf-art" role="group" aria-label="Darstellung des Umfelds">
          <button data-uf="gliederung" aria-pressed="${ufArt === 'gliederung'}">Gliederung</button><button data-uf="netz" aria-pressed="${ufArt === 'netz'}">Netz</button></div></div>
      <div id="uf-host"></div>
    </section>
    <section><h4>Wie weit reicht die Verknüpfung?</h4><div id="reichweite"></div></section>
    <details class="uf-alle" id="uf-alle"><summary>Alle Verknüpfungen mit Fundstelle</summary><div id="gr-liste"></div></details>
    <div><h4>Dokument</h4><div class="chips" id="z-dok"></div></div>`;
  const zb = zEl.querySelector('#zurueck');
  if (zb && bogenZurueck) { const b = bogenZurueck; zb.onclick = () => { bzSel = b; zeigeBogen(b); bzFaerben(); }; }
  else if (zb) zb.onclick = () => zeigeListe();
  $('#uf-art').onclick = ev => { const b = ev.target.closest('[data-uf]'); if (!b || b.dataset.uf === ufArt) return; ufArt = b.dataset.uf;
    try { localStorage.setItem('vs-umfeld', ufArt); } catch (e) { /* */ }
    $('#uf-art').querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', x === b)); zeichneUmfeld(i); };
  zeichneUmfeld(i);
  zeichneReichweite(i);
  graphListe(i);
  dokumentChips(z.d);
  const q = suchwort();
  ladeText(z.i).then(([t, fn]) => {
    if (gewaehlt !== i || listeOffen) return;
    const el = $('#wortlaut'); if (!el) return;
    el.innerHTML = (t ? t.split('\n').map(p => `<p>${hervorheben(p, q)}</p>`).join('') : '<span class="leer">Kein Wortlaut.</span>') +
      (fn.length ? `<div class="fussnoten">${fn.map(([n, f]) => `<p><sup>${esc(n)}</sup> ${hervorheben(f, q)}</p>`).join('')}</div>` : '');
    fundstellen(el);
  });
}
function fundstellen(el) {            // «3 Stellen markiert ‹ ›»: springt im Wortlaut von Markierung zu Markierung
  const marken = [...el.querySelectorAll('mark')], box = $('#fund');
  if (!box) return;
  if (!marken.length) { box.hidden = true; return; }
  let k = 0;
  const zeige = () => { marken.forEach((m, j) => m.classList.toggle('aktuell', j === k)); el.scrollTop = Math.max(0, marken[k].offsetTop - el.clientHeight / 3);
    box.querySelector('span').textContent = `Stelle ${k + 1} von ${marken.length}`; };
  const was = [filt.thema ? `Begriffe des Themas «${filt.thema.name}»` : '', suchText.length >= 2 ? `Suchwort «${suchText}»` : ''].filter(Boolean).join(' und ');
  box.innerHTML = `<span></span><button class="knopf" data-schritt="-1" aria-label="Vorherige Stelle">‹</button><button class="knopf" data-schritt="1" aria-label="Nächste Stelle">›</button><small>${esc(was)} markiert</small>`;
  box.hidden = false;
  box.onclick = ev => { const b = ev.target.closest('[data-schritt]'); if (!b) return; k = (k + +b.dataset.schritt + marken.length) % marken.length; zeige(); };
  zeige();
}
function dokumentChips(nr) {
  const d = docById.get(nr);
  const teile = [`<button data-doc="${nr}">${esc(d.kurz)} im Umfang zeigen</button>`];
  (docEin.get(nr) || []).forEach(k => {
    if (k.art === 'genehmigt' && typeof k.von === 'number') teile.push(`<button data-z="${k.von}">Genehmigt durch ${esc(docById.get(Z[k.von].d).kurz)}, ${esc(Z[k.von].l)}</button>`);
    if (k.art === 'erlaeutert' && typeof k.von === 'number') teile.push(`<button data-z="${k.von}">Erläutert in Botschaft ${esc(kuerze(Z[k.von].l, 60))}</button>`);
  });
  (docAus.get(nr) || []).filter(k => k.art === 'aendert').forEach(k => {
    const g = gesetzById.get(k.nach);
    teile.push(`<span class="chips"><a href="${g && g.sr ? 'https://www.fedlex.admin.ch/eli/cc/' : '#'}" data-gesetz="${esc(k.nach)}">${g && g.neu ? 'Schafft' : 'Ändert'} ${esc(g ? (g.kurz || g.titel) : k.nach)}</a></span>`);
  });
  const el = $('#z-dok');
  el.innerHTML = teile.join('');
  el.querySelectorAll('[data-doc]').forEach(b => b.onclick = () => fokusAufDoc(+b.dataset.doc));
  el.querySelectorAll('[data-z]').forEach(b => b.onclick = () => waehle(+b.dataset.z, true));
  el.querySelectorAll('[data-gesetz]').forEach(a => a.onclick = ev => { ev.preventDefault(); zeigeReiter('tabelle'); $('#gesetze').scrollIntoView({block: 'start'}); });
}

/* ---------- Umfeld eines Zettels (Ziffer 5.2) ----------
   Darstellung «Gliederung»: oben, was auf den Text verweist; in der Mitte der Text; unten, worauf er verweist.
   Gruppen nach Bezugsart, Karten in der Farbe der Vorlage, gleiche Ziele zusammengefasst (×n).
   Darstellung «Netz»: der radiale Graph mit festen Sektoren. */
let ufArt = (() => { try { return localStorage.getItem('vs-umfeld') === 'netz' ? 'netz' : 'gliederung'; } catch (e) { return 'gliederung'; } })();
const UF_GRUPPEN = [
  {r: 'ein', key: 'erl_ein', titel: 'Erläutert in der Botschaft', strich: true,
    hilfe: 'Abschnitte der Botschaft, die diesen Artikel oder das ganze Dokument erläutern.'},
  {r: 'ein', key: 'gen_ein', titel: 'Genehmigt durch', strich: true,
    hilfe: 'Der Bundesbeschluss, der das ganze Dokument genehmigt (jeweils Art. 1).'},
  {r: 'ein', key: 'vw_ein', titel: 'Andere Artikel verweisen hierher', strich: false,
    hilfe: 'Artikel, deren Wortlaut auf diesen Artikel verweist.'},
  {r: 'aus', key: 'vw_aus', titel: 'Verweist auf diese Artikel', strich: false,
    hilfe: 'Artikel, auf die der Wortlaut dieses Texts verweist.'},
  {r: 'aus', key: 'erl_aus', titel: 'Erläutert', strich: true, hilfe: 'Artikel und Dokumente, die dieser Abschnitt der Botschaft erläutert.'},
  {r: 'aus', key: 'gen_aus', titel: 'Genehmigt', strich: true, hilfe: 'Abkommen und Protokolle, die dieser Artikel genehmigt.'},
  {r: 'aus', key: 'eu', titel: 'Nennt EU-Rechtsakte', strich: false,
    hilfe: 'Verordnungen, Richtlinien und Beschlüsse der EU, die im Wortlaut genannt sind, mit den anderen Dokumenten, die sie ebenfalls nennen.'},
  {r: 'aus', key: 'sr', titel: 'Nennt Schweizer Erlasse (SR)', strich: false, hilfe: 'Erlasse der Systematischen Rechtssammlung, die im Wortlaut genannt sind.'},
];
const UF_MAX = 8;
let ufOffen = new Set(), ufBeob = null;
function umfeldDaten(i) {
  const z = Z[i], m = Object.fromEntries(UF_GRUPPEN.map(g => [g.key, new Map()]));
  const add = (key, ref, k, ganz) => { const s = String(ref); if (!m[key].has(s)) m[key].set(s, {ref, kanten: [], ganz: !!ganz}); m[key].get(s).kanten.push(k); };
  ein[i].forEach(k => { if (k.art === 'erlaeutert') add('erl_ein', k.von, k); else if (k.art === 'verweist_auf') add('vw_ein', k.von, k); });
  (docEin.get(z.d) || []).forEach(k => {
    if (typeof k.von !== 'number') return;
    if (k.art === 'erlaeutert') add('erl_ein', k.von, k, true);
    else if (k.art === 'genehmigt') add('gen_ein', k.von, k, true);
  });
  aus[i].forEach(k => {
    const r = k.nach;
    if (k.art === 'verweist_auf') add('vw_aus', r, k);
    else if (k.art === 'erlaeutert') add('erl_aus', r, k);
    else if (k.art === 'genehmigt') add('gen_aus', r, k);
    else if (k.art === 'nennt' && typeof r === 'string' && r.startsWith('celex:')) add('eu', r, k);
    else if (k.art === 'nennt' && typeof r === 'string' && r.startsWith('sr:')) add('sr', r, k);
  });
  const ord = e => typeof e.ref === 'number' ? e.ref : e.ref.startsWith('fga/') ? 1e6 + refDoc(e.ref) : 2e6;
  return UF_GRUPPEN.map(g => ({...g, items: [...m[g.key].values()].sort((a, b) => ord(a) - ord(b) || String(a.ref).localeCompare(String(b.ref), 'de'))}))
    .filter(g => g.items.length);
}
const srName = sr => { const g = D.gesetze.find(x => x.sr === sr); return g ? gesetzName(g) : ''; };
function ufKarte(e, g, i) {
  const z = Z[i], n = e.kanten.length, r = e.ref;
  const nx = n > 1 ? `<span class="uf-n" title="${n} Fundstellen">×${n}</span>` : '';
  if (typeof r === 'number') {
    const x = Z[r], d = docById.get(x.d), gleich = x.d === z.d;
    const aus_ = treffer && !treffer.has(r) ? ' aus-filter' : '';
    return `<button class="uf-k${aus_}" data-z="${r}" data-e="${esc(g.key + '|' + r)}" style="--g:${gVar(d.gruppe)}">
      <span class="uf-t">${gleich ? '' : `<span class="uf-dok">${esc(d.kurz)}</span>`}${esc(x.l)}</span>${nx}
      ${e.ganz ? `<small>${g.key === 'gen_ein' ? 'genehmigt' : 'erläutert'} das ganze Dokument ${esc(docById.get(z.d).kurz)}</small>` : ''}</button>`;
  }
  if (r.startsWith('fga/')) {
    const d = docById.get(refDoc(r));
    return `<button class="uf-k" data-doc="${d.nr}" data-e="${esc(g.key + '|' + r)}" style="--g:${gVar(d.gruppe)}"><span class="uf-t"><span class="uf-dok">${esc(d.kurz)}</span>ganzes Dokument</span>${nx}</button>`;
  }
  if (r.startsWith('celex:')) {
    const c = r.slice(6), auch = [...(euNennung.get(r) || new Map())].filter(([dn]) => dn !== z.d);
    return `<div class="uf-eu"><a class="uf-k neutral" href="https://eur-lex.europa.eu/legal-content/DE/TXT/?uri=CELEX:${encodeURIComponent(c)}" target="_blank" rel="noopener" data-e="${esc(g.key + '|' + r)}">
      <span class="uf-form eu" aria-hidden="true"></span><span class="uf-t"><b>${esc(c)}</b> ${esc(kuerze(D.eu[c] || '', 90))}</span>${nx}</a>
      ${auch.length ? `<div class="uf-auch"><span>auch genannt in</span>${auch.slice(0, 6).map(([dn, zi]) => `<button data-z="${zi}" style="--g:${gVar(docById.get(dn).gruppe)}">${esc(docById.get(dn).kurz)}</button>`).join('')}${auch.length > 6 ? `<span>+${auch.length - 6}</span>` : ''}</div>` : ''}</div>`;
  }
  const sr = r.slice(3), name = srName(sr);
  return `<a class="uf-k neutral" href="https://www.fedlex.admin.ch/de/search?text=${encodeURIComponent('SR ' + sr)}" target="_blank" rel="noopener" data-e="${esc(g.key + '|' + r)}">
    <span class="uf-form erlass" aria-hidden="true"></span><span class="uf-t"><b>SR ${esc(sr)}</b>${name ? ' ' + esc(name) : ''}</span>${nx}</a>`;
}
function zeichneUmfeld(i) {
  const host = $('#uf-host'); if (!host) return;
  if (ufBeob) { ufBeob.disconnect(); ufBeob = null; }
  if (ufArt === 'netz') {
    host.innerHTML = `<div class="gr-filter" id="gr-filter" role="group" aria-label="Kantenarten im Graph"></div>
      <div id="graph"></div><ul class="legende" id="gr-legende"></ul><div class="gr-erkl" id="gr-erkl"></div>`;
    graphFilterKnoepfe(); zeichneGraph(i); return;
  }
  if (ufOffen.zettel !== i) { ufOffen = new Set(); ufOffen.zettel = i; }
  const z = Z[i], d = docById.get(z.d), gruppen = umfeldDaten(i);
  const band = r => {
    const gs = gruppen.filter(g => g.r === r);
    const frage = r === 'ein' ? 'Was verweist auf diesen Text?' : 'Worauf verweist dieser Text?';
    if (!gs.length) return `<div class="uf-band uf-${r} leerband"><p class="uf-frage">${frage}</p><p class="leer">${r === 'ein' ? 'Kein anderer Text verweist auf diesen Zettel.' : 'Der Wortlaut enthält keinen erkannten Verweis.'}</p></div>`;
    return `<div class="uf-band uf-${r}"><p class="uf-frage">${frage}</p>${gs.map(g => {
      const offen = ufOffen.has(g.key), zeigen = offen ? g.items : g.items.slice(0, UF_MAX);
      const fund = g.items.reduce((s, e) => s + e.kanten.length, 0);
      return `<div class="uf-gruppe${g.strich ? ' gestrichelt' : ''}" data-g="${g.key}">
        <p class="uf-gtitel" title="${esc(g.hilfe)}">${esc(g.titel)} <span>${fmt(g.items.length)}${fund > g.items.length ? ` · ${fmt(fund)} Fundstellen` : ''}</span></p>
        <div class="uf-karten">${zeigen.map(e => ufKarte(e, g, i)).join('')}
        ${g.items.length > UF_MAX ? `<button class="uf-mehr" data-mehr="${g.key}">${offen ? 'weniger zeigen' : `+ ${fmt(g.items.length - UF_MAX)} weitere`}</button>` : ''}</div></div>`;
    }).join('')}</div>`;
  };
  host.innerHTML = `<div class="uf" id="umfeld"><svg class="uf-linien" aria-hidden="true"></svg>
    ${band('ein')}
    <div class="uf-mitte" style="--g:${gVar(d.gruppe)}"><span class="uf-ort">${esc(gName[d.gruppe])} › ${esc(d.kurz)}</span><b>${esc(z.l)}</b><small>dieser Text</small></div>
    ${band('aus')}</div>
    <details class="uf-lesen"><summary>So lesen</summary>
      <p>Oben steht, was auf diesen Text verweist, unten, worauf er selbst verweist. Die Linien führen jeweils in Pfeilrichtung: vom verweisenden zum verwiesenen Text.</p>
      <p>Jede Karte ist ein Bezug, der im Wortlaut steht; ähnliche Inhalte ohne Verweis sind nicht verbunden. Durchgezogene Linie: Verweis oder Nennung im Text. Gestrichelte Linie: Erläuterung in der Botschaft oder Genehmigung durch einen Bundesbeschluss.</p>
      <p>Die Farbe einer Karte zeigt die Vorlage, zu der der Text gehört; sie bewertet nichts. ${D.gruppen.map(g => `<span class="uf-farbe" style="--g:${gVar(g.id)}">${esc(g.name)}</span>`).join(' ')} Grau umrandet: EU-Rechtsakte (Raute) und Schweizer Erlasse (Dreieck), sie gehören keiner Vorlage an.</p>
      <p>«×3» heisst: derselbe Bezug steht dreimal im Text. Überfahren zeigt die Fundstelle, Klick öffnet den Text. Ist oben ein Thema oder eine Textart gewählt, sind Karten ausserhalb dieser Auswahl blasser.</p>
    </details>`;
  const box = $('#umfeld'), alle = new Map();
  gruppen.forEach(g => g.items.forEach(e => alle.set(g.key + '|' + e.ref, {e, g})));
  box.onclick = ev => {
    const m = ev.target.closest('[data-mehr]'); if (m) { const k = m.dataset.mehr; ufOffen.has(k) ? ufOffen.delete(k) : ufOffen.add(k); zeichneUmfeld(i); return; }
    const b = ev.target.closest('button[data-z]'); if (b) { hideTip(); waehle(+b.dataset.z, aktiv === 'umfang'); return; }
    const dd = ev.target.closest('button[data-doc]'); if (dd) { hideTip(); fokusAufDoc(+dd.dataset.doc); }
  };
  box.addEventListener('pointerover', ev => {
    const k = ev.target.closest('[data-e]'); if (!k) return;
    const {e, g} = alle.get(k.dataset.e) || {}; if (!e) return;
    ufLinien(k.closest('.uf-gruppe'));
    const stellen = [...new Set(e.kanten.map(x => (x.stelle || '').replace(/\s+/g, ' ').trim()).filter(Boolean))];
    const wo = g.r === 'ein' ? `Fundstelle in ${esc(refName(e.ref, true))}` : 'Fundstelle in diesem Text';
    showTip(ev, `<b>${esc(g.titel)}</b>${stellen.length ? `<span>${wo}:</span><br>${stellen.slice(0, 3).map(s => `«${esc(kuerze(s, 150))}»`).join('<br>')}${stellen.length > 3 ? `<br><span>und ${stellen.length - 3} weitere</span>` : ''}` : `<span>${esc(g.hilfe)}</span>`}`);
  });
  box.addEventListener('pointermove', ev => { if (ev.target.closest('[data-e]')) moveTip(ev); });
  box.addEventListener('pointerout', ev => { const k = ev.target.closest('[data-e]'); if (k && !k.contains(ev.relatedTarget)) { hideTip(); ufLinien(); } });
  ufLinien();
  if (window.ResizeObserver) { ufBeob = new ResizeObserver(() => ufLinien()); ufBeob.observe(box); }
}
// Linien: ein Stamm links, von dem jede Gruppe abzweigt; oben laufen die Linien in den Text hinein, unten aus ihm heraus
function ufLinien(hell) {
  const box = $('#umfeld'); if (!box) return;
  const svg = box.querySelector('.uf-linien'), B = box.getBoundingClientRect();
  if (!B.width) return;
  const rel = el => { const r = el.getBoundingClientRect(); return {x: r.left - B.left, y: r.top - B.top, w: r.width, h: r.height}; };
  const X = 10, mitte = rel(box.querySelector('.uf-mitte'));
  const ty = g => { const t = rel(g.querySelector('.uf-gtitel')); return t.y + Math.min(t.h, 24) / 2; };
  const pfeil = (x, y, rtg) => rtg === 'unten' ? `M${x - 5},${y - 8}L${x},${y}L${x + 5},${y - 8}Z` : `M${x - 8},${y - 5}L${x},${y}L${x - 8},${y + 5}Z`;
  const linien = [], pfeile = [];
  const ein = [...box.querySelectorAll('.uf-ein .uf-gruppe')], aus_ = [...box.querySelectorAll('.uf-aus .uf-gruppe')];
  if (ein.length) {
    const y0 = ty(ein[0]);
    linien.push({d: `M${X},${y0}V${mitte.y - 1}`, an: ein});
    pfeile.push({d: pfeil(X, mitte.y, 'unten'), an: ein});
    ein.forEach(g => { const y = ty(g), gx = rel(g).x; linien.push({d: `M${gx - 4},${y}H${X}`, strich: g.classList.contains('gestrichelt'), an: [g]}); });
  }
  if (aus_.length) {
    const yN = ty(aus_[aus_.length - 1]);
    linien.push({d: `M${X},${mitte.y + mitte.h}V${yN}`, an: aus_});
    aus_.forEach(g => { const y = ty(g), gx = rel(g).x; linien.push({d: `M${X},${y}H${gx - 3}`, strich: g.classList.contains('gestrichelt'), an: [g]});
      pfeile.push({d: pfeil(gx - 3, y, 'rechts'), an: [g]}); });
  }
  const an = o => hell && o.an.includes(hell);
  svg.setAttribute('viewBox', `0 0 ${B.width} ${B.height}`);
  svg.setAttribute('width', B.width); svg.setAttribute('height', B.height);
  svg.innerHTML = linien.map(o => `<path d="${o.d}" fill="none" class="${an(o) ? 'hell' : ''}" stroke-width="${an(o) ? 2.6 : 2}"${o.strich ? ' stroke-dasharray="6 4"' : ''}/>`).join('') +
    pfeile.map(o => `<path d="${o.d}" class="spitze${an(o) ? ' hell' : ''}"/>`).join('');
}

/* ---------- Reichweite: wie weit die Verknüpfung über Artikelverweise und Erläuterungen reicht (Ziffer 5.2.6) ---------- */
function nachbarn(j) {
  const s = new Set();
  aus[j].forEach(k => { if (typeof k.nach === 'number' && (k.art === 'verweist_auf' || k.art === 'erlaeutert')) s.add(k.nach); });
  ein[j].forEach(k => { if (typeof k.von === 'number' && (k.art === 'verweist_auf' || k.art === 'erlaeutert')) s.add(k.von); });
  s.delete(j); return s;
}
function reichweite(i) {
  const s1 = nachbarn(i), s2 = new Set(s1);
  s1.forEach(j => nachbarn(j).forEach(x => { if (x !== i) s2.add(x); }));
  return {s1, s2};
}
function zeichneReichweite(i) {
  const el = $('#reichweite'); if (!el) return;
  const {s1, s2} = reichweite(i);
  if (!s1.size) { el.innerHTML = '<p class="leer">Kein Artikelverweis und keine Erläuterung verbindet diesen Zettel mit einem anderen Zettel. EU-Rechtsakte und SR-Erlasse zählen hier nicht.</p>'; return; }
  const zeile = (s, titel, schritte) => {
    const je = d3.rollup([...s], v => v.length, j => docById.get(Z[j].d).gruppe), docs = new Set([...s].map(j => Z[j].d));
    const imF = treffer ? [...s].filter(j => treffer.has(j)).length : null;
    const balken = D.gruppen.filter(g => je.get(g.id)).map(g => `<i style="flex:${je.get(g.id)};background:${gVar(g.id)}" title="${esc(g.name)}: ${fmt(je.get(g.id))} Zettel"></i>`).join('');
    return `<div class="rw-zeile"><div class="rw-text"><b>${fmt(s.size)} Zettel</b> in ${fmt(docs.size)} ${docs.size === 1 ? 'Dokument' : 'Dokumenten'} <span>${titel}</span>${imF !== null ? `<span>, davon ${fmt(imF)} in der Auswahl</span>` : ''}</div>
      <div class="rw-balken" aria-hidden="true">${balken}</div>
      <button class="knopf" data-reich="${schritte}">Im Umfang markieren</button></div>`;
  };
  el.innerHTML = zeile(s1, 'direkt verknüpft', 1) + (s2.size > s1.size ? zeile(s2, 'direkt oder über einen Zwischenschritt', 2) : '') +
    `<div class="rw-fuss"><button class="knopf" id="rw-bezuege">Im Bezugsdiagramm zeigen</button>
     <span class="leer">Gezählt werden Artikelverweise und Erläuterungen der Botschaft zwischen Zetteln, in beide Richtungen. Balken: Anteil je Vorlage.</span></div>`;
  el.querySelectorAll('[data-reich]').forEach(b => b.onclick = () => {
    const n = +b.dataset.reich, menge = new Set(n === 1 ? s1 : s2); menge.add(i);
    filt.reich = {i, schritte: n, menge};
    filterAnwenden({ohneZettel: true});
    zeigeReiter('umfang'); fokus = root; zeichneUmfang(true);
    $('#ansicht').scrollIntoView({behavior: ruhig() ? 'auto' : 'smooth', block: 'start'});
  });
  $('#rw-bezuege').onclick = () => { zeigeReiter('bezuege'); $('#ansicht').scrollIntoView({behavior: ruhig() ? 'auto' : 'smooth', block: 'start'}); };
}

/* ---------- Netz: radialer Graph (frühere Darstellung, Ziffer 5.2) ---------- */
const GR_ARTEN = [['verweist_auf', 'verweist auf'], ['nennt', 'nennt'], ['genehmigt', 'genehmigt'], ['erlaeutert', 'erläutert'], ['teil_von', 'Teil von']];
const grAktiv = Object.fromEntries(GR_ARTEN.map(([k]) => [k, true]));
function graphFilter() { try { const s = JSON.parse(localStorage.getItem('vs-graph') || '{}'); Object.assign(grAktiv, s); } catch (e) { /* */ } }
function graphFilterKnoepfe() {
  const el = $('#gr-filter');
  el.innerHTML = GR_ARTEN.map(([k, n]) => `<button data-art="${k}" aria-pressed="${grAktiv[k]}">${n}</button>`).join('');
  el.onclick = ev => { const b = ev.target.closest('button'); if (!b) return; const k = b.dataset.art; grAktiv[k] = !grAktiv[k];
    b.setAttribute('aria-pressed', grAktiv[k]); try { localStorage.setItem('vs-graph', JSON.stringify(grAktiv)); } catch (e) { /* */ } zeichneGraph(gewaehlt); };
}
const SEKTOR = {               // feste Lage je Knotenart (Ziffer 5.2.1), Winkel in Grad, 0 = rechts, 90 = unten
  dok: {mitte: -90, breite: 70, name: 'Dokumente'},
  zettel: {mitte: 0, breite: 110, name: 'Zettel im Dokument'},
  eu: {mitte: 90, breite: 70, name: 'EU-Rechtsakte'},
  sr: {mitte: 180, breite: 110, name: 'SR-Erlasse'},
};
const MAX_JE_SEKTOR = 9;
function graphDaten(i) {
  const z = Z[i], nodes = [], links = [], rest = {dok: 0, zettel: 0, eu: 0, sr: 0};
  const node = (id, n) => { let x = nodes.find(k => k.id === id); if (!x) { x = {id, ...n}; nodes.push(x); } return x; };
  node('c', {typ: 'zettel', label: z.l, ring: 0, g: docById.get(z.d).gruppe, i});
  const imSektor = s => nodes.filter(n => n.ring === 1 && n.sektor === s).length;
  const ring1 = (id, sektor, n) => {
    if (nodes.find(k => k.id === id)) return nodes.find(k => k.id === id);
    if (imSektor(sektor) >= MAX_JE_SEKTOR) { rest[sektor]++; return null; }
    return node(id, {...n, ring: 1, sektor, eltern: 'c'});
  };
  // Teil von: Dokument
  if (grAktiv.teil_von) {
    const d = docById.get(z.d);
    ring1('d' + d.nr, 'dok', {typ: 'dok', label: d.kurz, g: d.gruppe, doc: d.nr, info: z.p.join(' › ')});
    links.push({s: 'c', t: 'd' + d.nr, art: 'teil_von'});
  }
  const kanten = [...aus[i].map(k => ({k, richtung: 'aus', ref: k.nach})), ...ein[i].map(k => ({k, richtung: 'ein', ref: k.von}))];
  kanten.forEach(({k, richtung, ref}) => {
    if (!grAktiv[k.art]) return;
    let n;
    if (typeof ref === 'number') {
      const x = Z[ref], gleich = x.d === z.d;
      n = ring1('z' + ref, gleich ? 'zettel' : 'dok', {typ: 'zettel', label: gleich ? x.l : `${docById.get(x.d).kurz}, ${x.l}`, g: docById.get(x.d).gruppe, i: ref});
    } else if (ref.startsWith('celex:')) n = ring1(ref, 'eu', {typ: 'eu', label: ref.slice(6), info: D.eu[ref.slice(6)] || ''});
    else if (ref.startsWith('sr:')) n = ring1(ref, 'sr', {typ: 'sr', label: 'SR ' + ref.slice(3)});
    else if (ref.startsWith('fga/')) { const d = docById.get(refDoc(ref)); n = ring1('d' + d.nr, 'dok', {typ: 'dok', label: d.kurz, g: d.gruppe, doc: d.nr}); }
    if (n) links.push({s: richtung === 'aus' ? 'c' : n.id, t: richtung === 'aus' ? n.id : 'c', art: k.art, k});
  });
  // Zweiter Schritt (Ziffer 5.2.5.3): andere Zettel mit demselben EU-Rechtsakt; Bundesbeschluss und Botschaft zum Dokument
  nodes.filter(n => n.typ === 'eu').forEach(e => {
    if (!grAktiv.nennt) return;
    const andere = K.filter(k => k.art === 'nennt' && k.nach === e.id && typeof k.von === 'number' && Z[k.von].d !== z.d && Z[k.von].d !== 615);
    [...new Map(andere.map(k => [Z[k.von].d, k])).values()].slice(0, 2).forEach(k => {
      const x = Z[k.von];
      const n = node('z' + k.von, {typ: 'zettel', label: `${docById.get(x.d).kurz}, ${x.l}`, g: docById.get(x.d).gruppe, i: k.von, ring: 2, eltern: e.id, sektor: 'eu'});
      links.push({s: n.id, t: e.id, art: 'nennt', k});
    });
  });
  const dnode = nodes.find(n => n.id === 'd' + z.d);
  if (dnode) (docEin.get(z.d) || []).forEach(k => {
    if (!grAktiv[k.art] || typeof k.von !== 'number') return;
    if (k.art === 'genehmigt' || (k.art === 'erlaeutert' && Z[k.von].p.length <= 1)) {
      const x = Z[k.von];
      if (nodes.filter(n => n.eltern === dnode.id).length >= 3) return;
      const n = node('z' + k.von, {typ: x.d === 615 ? 'bot' : 'zettel', label: `${docById.get(x.d).kurz}, ${x.l}`, g: docById.get(x.d).gruppe, i: k.von, ring: 2, eltern: dnode.id, sektor: 'dok'});
      links.push({s: n.id, t: dnode.id, art: k.art, k});
    }
  });
  return {nodes, links, rest};
}
function zeichneGraph(i) {
  const host = $('#graph'); if (!host) return;
  host.innerHTML = '';
  const {nodes, links, rest} = graphDaten(i);
  const W = 480, Hh = 520, cx = W / 2, cy = Hh / 2, R1 = 132, R2 = 212;
  const rad = g => g * Math.PI / 180;
  Object.entries(SEKTOR).forEach(([s, S]) => {
    const r1 = nodes.filter(n => n.ring === 1 && n.sektor === s), quer = s === 'dok' || s === 'eu';
    r1.forEach((n, k) => {
      n.w = r1.length === 1 ? S.mitte : S.mitte - S.breite / 2 + S.breite * (k + 0.5) / r1.length;
      const r = quer && r1.length > 3 && k % 2 ? R1 + 34 : R1;          // oben und unten abwechselnd zwei Radien
      n.x = cx + r * Math.cos(rad(n.w)); n.y = cy + r * Math.sin(rad(n.w));
    });
  });
  const c = nodes[0]; c.x = cx; c.y = cy; c.w = -90;
  d3.group(nodes.filter(n => n.ring === 2), n => n.eltern).forEach((arr, pid) => {
    const p = nodes.find(n => n.id === pid);
    arr.forEach((n, k) => { n.w = p.w + (k - (arr.length - 1) / 2) * 13; n.x = cx + R2 * Math.cos(rad(n.w)); n.y = cy + R2 * Math.sin(rad(n.w)); });
  });
  const svg = d3.select(host).append('svg').attr('viewBox', `0 0 ${W} ${Hh}`).attr('role', 'img')
    .attr('aria-label', `Lokaler Graph: ${nodes.length - 1} verknüpfte Knoten. Die gleichen Verknüpfungen stehen als Liste darunter.`);
  // Sektorbeschriftung
  Object.entries(SEKTOR).forEach(([s, S]) => {
    if (!nodes.some(n => n.sektor === s)) return;
    const x = cx + (s === 'zettel' ? R2 + 26 : s === 'sr' ? -R2 - 26 : 0), y = cy + (s === 'dok' ? -Hh / 2 + 14 : s === 'eu' ? Hh / 2 - 6 : -R1 - 34);
    svg.append('text').attr('class', 'gr-sektor').attr('x', Math.max(4, Math.min(W - 4, x))).attr('y', y)
      .attr('text-anchor', s === 'zettel' ? 'end' : s === 'sr' ? 'start' : 'middle').text(S.name + (rest[s] ? ` · +${rest[s]}` : ''));
  });
  const nid = new Map(nodes.map(n => [n.id, n]));
  const strich = {teil_von: '2 3', verweist_auf: null, nennt: null, genehmigt: '6 4', erlaeutert: '6 4'};
  svg.append('defs').append('marker').attr('id', 'gr-pfeil').attr('viewBox', '0 0 8 8').attr('refX', 7).attr('refY', 4)
    .attr('markerWidth', 6).attr('markerHeight', 6).attr('orient', 'auto').append('path').attr('d', 'M0,0L8,4L0,8z').attr('fill', 'var(--text-leise)');
  const gL = svg.append('g').selectAll('line').data(links).join('line')
    .attr('x1', k => nid.get(k.s).x).attr('y1', k => nid.get(k.s).y)
    .attr('x2', k => { const a = nid.get(k.s), b = nid.get(k.t), L = Math.hypot(b.x - a.x, b.y - a.y) || 1; return b.x - (b.x - a.x) / L * 10; })
    .attr('y2', k => { const a = nid.get(k.s), b = nid.get(k.t), L = Math.hypot(b.x - a.x, b.y - a.y) || 1; return b.y - (b.y - a.y) / L * 10; })
    .attr('stroke', 'var(--text-leise)').attr('stroke-width', 1.4).attr('stroke-dasharray', k => strich[k.art]).attr('marker-end', 'url(#gr-pfeil)');
  const gN = svg.append('g').selectAll('g').data(nodes).join('g').attr('class', 'gr-node').attr('transform', n => `translate(${n.x},${n.y})`)
    .attr('tabindex', n => n.id !== 'c' && (n.i !== undefined || n.doc) ? 0 : null);
  const fuell = n => n.g ? tint(n.g, n.id === 'c' ? 100 : 55) : 'var(--karte)';
  gN.each(function (n) {
    const s = d3.select(this), r = n.id === 'c' ? 10 : 7;
    let f;
    if (n.typ === 'dok') f = s.append('rect').attr('x', -r).attr('y', -r).attr('width', 2 * r).attr('height', 2 * r).attr('rx', 2);
    else if (n.typ === 'eu') f = s.append('path').attr('d', `M0,${-r - 1}L${r + 1},0L0,${r + 1}L${-r - 1},0Z`);
    else if (n.typ === 'sr') f = s.append('path').attr('d', `M0,${-r - 1}L${r + 1},${r}L${-r - 1},${r}Z`);
    else f = s.append('circle').attr('r', r);
    f.attr('fill', fuell(n)).attr('stroke', n.g ? gVar(n.g) : 'var(--text-leise)').attr('stroke-width', 1.6);
  });
  // Beschriftungen ohne Überlappung (Ziffer 5.2.2): was nicht passt, erscheint beim Überfahren
  const belegt = [], PX = 6.9;
  const frei = r => r.x0 >= 0 && r.x1 <= W && r.y0 >= 0 && r.y1 <= Hh && !belegt.some(b => r.x0 < b.x1 && r.x1 > b.x0 && r.y0 < b.y1 && r.y1 > b.y0);
  const reihenfolge = [nodes[0], ...nodes.filter(n => n.ring === 1), ...nodes.filter(n => n.ring === 2)];
  reihenfolge.forEach(n => {
    const cos = Math.cos(rad(n.w)), seitlich = n.id !== 'c' && Math.abs(cos) > 0.35;
    const anker = n.id === 'c' || !seitlich ? 'middle' : (cos > 0 ? 'start' : 'end');
    const dx = anker === 'start' ? 11 : anker === 'end' ? -11 : 0;
    const dy = n.id === 'c' ? -17 : seitlich ? 4.5 : (Math.sin(rad(n.w)) < 0 ? -12 : 21);
    for (const max of n.id === 'c' ? [40, 28, 18] : [26, 18, 12]) {
      const text = kuerze(n.label, max), w = text.length * PX + 4;
      const x0 = n.x + dx - (anker === 'middle' ? w / 2 : anker === 'end' ? w : 0);
      const r = {x0, x1: x0 + w, y0: n.y + dy - 12, y1: n.y + dy + 4};
      if (frei(r)) { belegt.push(r); n.text = text; n.anker = anker; n.dx = dx; n.dy = dy; break; }
    }
  });
  gN.filter(n => n.text).append('text').attr('class', 'gr-label').attr('x', n => n.dx).attr('y', n => n.dy)
    .attr('text-anchor', n => n.anker).style('font-weight', n => n.id === 'c' ? 600 : 400).text(n => n.text);
  // Überfahren hebt den Weg zum Mittelpunkt hervor (Ziffer 5.2.4)
  const weg = n => { const ids = new Set([n.id]); let x = n; while (x && x.eltern) { ids.add(x.eltern); x = nid.get(x.eltern); } return ids; };
  const typName = {zettel: 'Zettel', dok: 'Dokument', eu: 'EU-Rechtsakt', sr: 'SR-Erlass', bot: 'Botschaft'};
  gN.on('pointerenter pointermove', (ev, n) => {
    if (n.id !== 'c') { const w = weg(n); gL.attr('stroke-opacity', k => w.has(k.s) && w.has(k.t) ? 1 : 0.12).attr('stroke', k => w.has(k.s) && w.has(k.t) ? 'var(--text)' : 'var(--text-leise)');
      gN.attr('opacity', x => w.has(x.id) ? 1 : 0.3); }
    showTip(ev, `<b>${esc(n.label)}</b><span>${typName[n.typ]}${n.info ? ' · ' + esc(kuerze(n.info, 120)) : ''}</span>${n.id !== 'c' && (n.i !== undefined || n.doc) ? '<br><span>Klick: öffnen</span>' : ''}`);
  }).on('pointerleave', () => { gL.attr('stroke-opacity', 1).attr('stroke', 'var(--text-leise)'); gN.attr('opacity', 1); hideTip(); })
    .on('click', (ev, n) => { hideTip(); if (n.id === 'c') return; if (n.i !== undefined) waehle(n.i, true); else if (n.doc) fokusAufDoc(n.doc); })
    .on('keydown', (ev, n) => { if (ev.key === 'Enter') { if (n.i !== undefined && n.id !== 'c') waehle(n.i, true); else if (n.doc) fokusAufDoc(n.doc); } });
  $('#gr-legende').innerHTML = [
    ['<svg width="14" height="14"><circle cx="7" cy="7" r="5.5" fill="var(--karte)" stroke="var(--text-leise)" stroke-width="1.5"/></svg>', 'Zettel'],
    ['<svg width="14" height="14"><rect x="1.5" y="1.5" width="11" height="11" rx="2" fill="var(--karte)" stroke="var(--text-leise)" stroke-width="1.5"/></svg>', 'Dokument'],
    ['<svg width="14" height="14"><path d="M7,1L13,7L7,13L1,7Z" fill="var(--karte)" stroke="var(--text-leise)" stroke-width="1.5"/></svg>', 'EU-Rechtsakt'],
    ['<svg width="14" height="14"><path d="M7,1.5L13,12.5L1,12.5Z" fill="var(--karte)" stroke="var(--text-leise)" stroke-width="1.5"/></svg>', 'SR-Erlass'],
    ['<svg width="26" height="8"><line x1="0" y1="4" x2="26" y2="4" stroke="var(--text-leise)" stroke-width="1.5"/></svg>', 'verweist auf, nennt'],
    ['<svg width="26" height="8"><line x1="0" y1="4" x2="26" y2="4" stroke="var(--text-leise)" stroke-width="1.5" stroke-dasharray="6 4"/></svg>', 'genehmigt, erläutert'],
    ['<svg width="26" height="8"><line x1="0" y1="4" x2="26" y2="4" stroke="var(--text-leise)" stroke-width="1.5" stroke-dasharray="2 3"/></svg>', 'Teil von'],
  ].map(([s, t]) => `<li>${s}${t}</li>`).join('');
  const n1 = nodes.filter(n => n.ring === 1).length, n2 = nodes.filter(n => n.ring === 2).length;
  $('#gr-erkl').innerHTML = `
    <p>Knoten sind Zettel (ein Artikel oder Abschnitt), Dokumente, EU-Rechtsakte und SR-Erlasse. In der Mitte steht der geöffnete Zettel. Oben liegen Dokumente und Zettel anderer Dokumente, rechts Zettel im selben Dokument, unten EU-Rechtsakte, links SR-Erlasse; diese Lage ist bei jedem Zettel gleich.</p>
    <p>Eine Kante steht nur, wo der Wortlaut einen Bezug enthält: «verweist auf» ist ein Artikelverweis im Text, «nennt» eine Rechtsakt- oder SR-Nummer, «genehmigt» stammt aus Art. 1 eines Bundesbeschlusses, «erläutert» aus einem Kapitel der Botschaft. Der Pfeil zeigt vom verweisenden zum verwiesenen Teil.</p>
    <p>Der äussere Ring ist der zweite Schritt: andere Dokumente, die denselben EU-Rechtsakt nennen, und der Bundesbeschluss und das Botschaftskapitel zum Dokument.${n2 ? '' : ' Für diesen Zettel gibt es keinen.'}</p>
    <p>Lage und Abstand tragen keine Bedeutung. Höchstens ${MAX_JE_SEKTOR} Knoten je Bereich; alle Verknüpfungen stehen in der Liste darunter. Hier: ${fmt(n1)} Knoten im inneren, ${fmt(n2)} im äusseren Ring.</p>`;
}
// Liste aller Verknüpfungen: gleiche Art, Richtung und gleiches Ziel in einer Zeile, mit allen Fundstellen
function graphListe(i) {
  const el = $('#gr-liste'); if (!el) return;
  const m = new Map();
  [...aus[i].map(k => [k, 'aus', k.nach]), ...ein[i].map(k => [k, 'ein', k.von])].forEach(([k, r, ref]) => {
    const s = `${k.art}|${r}|${ref}`; if (!m.has(s)) m.set(s, {art: k.art, r, ref, kanten: []}); m.get(s).kanten.push(k);
  });
  const zeilen = [...m.values()];
  const sum = $('#uf-alle summary'); if (sum) sum.textContent = `Alle Verknüpfungen mit Fundstelle (${fmt(zeilen.length)})`;
  if (!zeilen.length) { el.innerHTML = '<p class="leer">Für diesen Zettel ist keine Verknüpfung erkannt.</p>'; return; }
  const ordnung = {verweist_auf: 0, erlaeutert: 1, genehmigt: 2, aendert: 3, nennt: 4};
  const pos = e => typeof e.ref === 'number' ? e.ref : 1e6;
  zeilen.sort((a, b) => (ordnung[a.art] - ordnung[b.art]) || (a.r < b.r ? -1 : a.r > b.r ? 1 : 0) || pos(a) - pos(b) || String(a.ref).localeCompare(String(b.ref)));
  el.innerHTML = `<ul class="liste">${zeilen.map(({art, r, ref, kanten}) => {
    const name = refName(ref, true);
    const ziel = typeof ref === 'number' ? `<button class="ziel" data-z="${ref}">${esc(name)}</button>`
      : ref.startsWith('celex:') ? `<a href="https://eur-lex.europa.eu/legal-content/DE/TXT/?uri=CELEX:${encodeURIComponent(ref.slice(6))}" target="_blank" rel="noopener">${esc(kuerze(name, 160))}</a>`
      : ref.startsWith('fga/') ? `<button class="ziel" data-doc="${refDoc(ref)}">${esc(name)}</button>` : esc(name);
    const stellen = [...new Set(kanten.map(k => (k.stelle || '').replace(/\s+/g, ' ').trim()).filter(Boolean))];
    const zeigStelle = typeof ref === 'number' || art !== 'nennt';
    return `<li style="border-left-color:${typeof ref === 'number' ? gVar(docById.get(Z[ref].d).gruppe) : 'var(--linie)'}"><span class="art" title="${esc(kanten[0].regel)}">${ART[art] ? ART[art][r] : art}</span>${kanten.length > 1 ? ` <span class="art">×${kanten.length}</span>` : ''}<br>${ziel}${zeigStelle ? stellen.slice(0, 4).map(s => `<span class="stelle">«${esc(kuerze(s, 140))}»</span>`).join('') : ''}</li>`;
  }).join('')}</ul>`;
  el.querySelectorAll('[data-z]').forEach(b => b.onclick = () => waehle(+b.dataset.z, true));
  el.querySelectorAll('[data-doc]').forEach(b => b.onclick = () => fokusAufDoc(+b.dataset.doc));
}

/* ---------- Suche (Ziffer 5, Ansicht 7; Themenvorschlag Ziffer 5.4) ---------- */
let suchText = '', sucheLeeren = () => {};
const suchwort = () => suchText;
function themenFuer(q) {             // Stichwort -> Themen: Name, Begriffe und Suchbegriffe aus der Debatte
  const ql = q.toLowerCase().trim(); if (ql.length < 3) return [];
  const passt = s => { const sl = s.toLowerCase(); return sl.includes(ql) || (sl.length >= 4 && ql.includes(sl)); };
  return T.filter(t => passt(t.name) || t.b.some(b => passt(b[0])) || t.s.some(s => passt(s[0])));
}
function suche() {
  const feld = $('#suchfeld'), box = $('#treffer');
  let lauf = 0;
  sucheLeeren = () => { feld.value = ''; suchText = ''; filt.such = null; box.hidden = true; lauf++; };
  async function suchen() {
    const q = feld.value.trim(), ql = q.toLowerCase(), meiner = ++lauf;
    suchText = q;
    if (q.length < 2) { filt.such = null; box.hidden = true; filterAnwenden({ohneZettel: true}); return; }
    const titel = new Set(); Z.forEach((z, i) => { if (z.l.toLowerCase().includes(ql)) titel.add(i); });
    zeige(titel, null, q.length >= 3 && !alleGeladen);
    if (q.length >= 3) {
      const m = await ladeAlleTexte(); alleGeladen = true;
      if (meiner !== lauf) return;
      const wortlaut = new Map();
      Z.forEach((z, i) => { if (titel.has(i)) return; const t = m.get(z.i); if (!t) return;
        const ganz = t[0] + ' ' + t[1].map(f => f[1]).join(' '); const p = ganz.toLowerCase().indexOf(ql); if (p >= 0) wortlaut.set(i, ganz.slice(Math.max(0, p - 50), p + q.length + 70)); });
      zeige(titel, wortlaut, false);
    }
  }
  function zeige(titel, wortlaut, laedt) {
    const alle = [...titel, ...(wortlaut ? wortlaut.keys() : [])];
    filt.such = new Set(alle);
    filterAnwenden({ohneZettel: true});
    const q = suchText, th = themenFuer(q).slice(0, 3);
    const keiner = !laedt && wortlaut && !alle.length;
    const andere = filt.thema || filt.art || filt.reich;
    box.innerHTML = th.map(t => `<button class="th-vorschlag" data-thema="${t.id}"><span class="marke">Thema</span> ${esc(t.name)}<small>${fmt(t.zm.size)} Zettel · Begriffe im Wortlaut: ${esc(t.b.slice(0, 4).map(b => b[0]).join(', '))}${t.b.length > 4 ? ' …' : ''}</small></button>`).join('') +
      (keiner ? `<div class="kopfzeile">«${esc(q)}» steht nicht im Wortlaut.${th.length ? ' Das Thema oben fasst die Begriffe zusammen, die im Text dafür stehen.' : ''}</div>` : '') +
      (alle.length || laedt ? `<div class="kopfzeile">${fmt(alle.length)} Zettel${laedt ? ' in Titeln; Wortlaut wird geladen …' : wortlaut ? ` (${fmt(titel.size)} im Titel, ${fmt(wortlaut.size)} im Wortlaut)${andere && treffer ? `, davon ${fmt(treffer.size)} in der übrigen Auswahl` : ''}. In allen Ansichten markiert.` : ''}</div>` : '') +
      alle.slice(0, 40).map(i => { const z = Z[i], d = docById.get(z.d);
        const aus = wortlaut && wortlaut.has(i) ? `<small>… ${markiere(esc(wortlaut.get(i)), q)} …</small>` : '';
        return `<button data-z="${i}">${markiere(esc(z.l), q)}<small>${esc(d.kurz)}${z.p.length ? ' › ' + esc(kuerze(z.p.join(' › '), 70)) : ''}</small>${aus}</button>`; }).join('') +
      (alle.length > 40 ? `<div class="kopfzeile">… und ${fmt(alle.length - 40)} weitere; alle in der Liste und in den Ansichten markiert.</div>` : '');
    box.hidden = !box.innerHTML;
  }
  let alleGeladen = false, zeit;
  feld.addEventListener('input', () => { clearTimeout(zeit); zeit = setTimeout(suchen, 180); });
  box.addEventListener('click', ev => {
    const t = ev.target.closest('button[data-thema]');
    if (t) { const q = feld.value.trim(); const imText = filt.such ? filt.such.size : 0; sucheLeeren(); setzeThema(t.dataset.thema, {herkunft: {q, imText}}); return; }
    const b = ev.target.closest('button[data-z]'); if (!b) return; box.hidden = true; waehle(+b.dataset.z, aktiv === 'umfang');
  });
  document.addEventListener('click', ev => { if (!ev.target.closest('.suche')) box.hidden = true; });
  feld.addEventListener('focus', () => { if (box.innerHTML && feld.value.trim().length >= 2) box.hidden = false; });
  feld.addEventListener('keydown', ev => { if (ev.key === 'Escape') { box.hidden = true; } });
}

/* ---------- Finden: Thema, Textart, geführte Auswahl, Ergebnisliste (Ziffer 5.4) ---------- */
const TEXTART = {
  vertrag: {name: 'Vertragstexte', frage: 'Was mit der EU vereinbart ist', typen: ['Abkommen', 'Protokoll', 'Erklärung'],
    erkl: 'Abkommen, Protokolle und gemeinsame Erklärungen'},
  umsetzung: {name: 'Umsetzung', frage: 'Was die Schweiz dafür ändert', typen: ['Bundesbeschluss'],
    erkl: 'Bundesbeschlüsse mit den neuen und geänderten Bundesgesetzen'},
  erklaerung: {name: 'Botschaft und Berichte', frage: 'Wie es erläutert wird', typen: ['Botschaft', 'Bericht', 'Stellungnahme'],
    erkl: 'Botschaft des Bundesrates, Bericht der Staatspolitischen Kommission des Ständerates, Stellungnahme des Bundesrates'},
};
const artVon = nr => { const t = docById.get(nr).typ; return Object.keys(TEXTART).find(k => TEXTART[k].typen.includes(t)) || 'erklaerung'; };
const artCache = {};
const artMenge = a => artCache[a] || (artCache[a] = new Set(Z.map((z, i) => i).filter(i => artVon(Z[i].d) === a)));
const filt = {thema: null, art: null, reich: null, such: null};
let listeHerkunft = null, listeSort = 'paket', listeAlle = new Set();   // Voreinstellung Paketreihenfolge (Ziffer 6.3)

function filterAnwenden(opt = {}) {
  const mengen = [];
  if (filt.thema) mengen.push(filt.thema.zm);
  if (filt.art) mengen.push(artMenge(filt.art));
  if (filt.reich) mengen.push(filt.reich.menge);
  if (filt.such) mengen.push(filt.such);
  if (!mengen.length) treffer = null;
  else {
    mengen.sort((a, b) => a.size - b.size);
    treffer = new Set();
    for (const i of mengen[0].keys()) if (mengen.every(m => m.has(i))) treffer.add(i);
  }
  fStand();
  if (aktiv === 'umfang') zeichneUmfang(false);
  ['verkn', 'umsetz', 'tabelle'].forEach(k => { if (gezeichnet[k]) { if (aktiv === k) zeichneAnsicht(k); else gezeichnet[k] = false; } });
  if (bzSvg) bzFaerben();
  if (opt.still) return;
  if (opt.liste || listeOffen) zeigeListe();
  else if (gewaehlt !== null && opt.ohneZettel) { zeichneUmfeld(gewaehlt); zeichneReichweite(gewaehlt); }
  else if (gewaehlt !== null) zeichneZettel(gewaehlt);
  hashSchreiben();
}
function setzeThema(id, opt = {}) {
  filt.thema = id ? T.find(t => t.id === id) || null : null;
  listeHerkunft = opt.herkunft || null; listeAlle = new Set();
  findenStand();
  filterAnwenden({liste: !!filt.thema || !!opt.liste});
  if (filt.thema && innerWidth < 1280 && !opt.ohneSprung) zEl.scrollIntoView({behavior: ruhig() ? 'auto' : 'smooth', block: 'start'});
}
function setzeArt(a) {
  filt.art = TEXTART[a] ? a : null; listeAlle = new Set();
  findenStand();
  filterAnwenden({liste: listeOffen});
}
function findenStand() {             // Bedienelemente auf den Filterzustand setzen
  const s = $('#f-thema'); if (s) s.value = filt.thema ? filt.thema.id : '';
  document.querySelectorAll('#f-art [data-art]').forEach(b => b.setAttribute('aria-pressed', (b.dataset.art || null) === (filt.art || null) || (!filt.art && b.dataset.art === '')));
}
function fStand() {
  const el = $('#f-stand'); if (!el) return;
  const chips = [];
  if (filt.thema) chips.push(['thema', `Thema: ${filt.thema.name}`]);
  if (filt.art) chips.push(['art', TEXTART[filt.art].name]);
  if (filt.reich) chips.push(['reich', `Verknüpft mit ${docById.get(Z[filt.reich.i].d).kurz}, ${Z[filt.reich.i].l} (${filt.reich.schritte === 1 ? 'direkt' : 'zwei Schritte'})`]);
  if (filt.such) chips.push(['such', `Suche «${suchText}»`]);
  if (!chips.length) { el.innerHTML = '<span class="leer">Ohne Auswahl ist nichts markiert. Gewählte Stellen erscheinen in allen Ansichten hervorgehoben.</span>'; return; }
  el.innerHTML = `<span class="f-zahl"><b>${fmt(treffer.size)}</b> Zettel markiert</span>${chips.map(([k, t]) => `<button class="f-chip" data-weg="${k}" title="Diese Auswahl aufheben">${esc(kuerze(t, 64))}<span aria-hidden="true">×</span><span class="sr">aufheben</span></button>`).join('')}<button class="knopf" id="f-liste">Liste zeigen</button>`;
}
function findenAufbauen() {
  const s = $('#f-thema');
  s.innerHTML = '<option value="">Alle Themen</option>' + T.map(t => `<option value="${t.id}">${esc(t.name)} (${fmt(t.zm.size)})</option>`).join('');
  s.onchange = () => setzeThema(s.value);
  $('#f-art').innerHTML = `<button data-art="" aria-pressed="true">Alle Texte</button>` +
    Object.entries(TEXTART).map(([k, a]) => `<button data-art="${k}" aria-pressed="false" title="${esc(a.erkl)}">${esc(a.name)}</button>`).join('');
  $('#f-art').onclick = ev => { const b = ev.target.closest('[data-art]'); if (b) setzeArt(b.dataset.art); };
  $('#f-stand').onclick = ev => {
    if (ev.target.closest('#f-liste')) { zeigeListe(); if (innerWidth < 1280) zEl.scrollIntoView({behavior: ruhig() ? 'auto' : 'smooth', block: 'start'}); return; }
    const b = ev.target.closest('[data-weg]'); if (!b) return;
    const k = b.dataset.weg;
    if (k === 'such') sucheLeeren(); else filt[k] = null;
    if (k === 'thema') listeHerkunft = null;
    findenStand();
    filterAnwenden({liste: listeOffen && !!(filt.thema || filt.art || filt.reich || filt.such)});
    if (listeOffen && !treffer) gewaehlt !== null ? waehle(gewaehlt, false) : startseite();
  };
  $('#f-gefuehrt').onclick = gefuehrt;
  fStand();
}

// Ergebnisliste im Zettelbereich: nach Textart gruppiert, sortiert nach Fundstellen oder nach Reihenfolge im Paket
function zeigeListe() {
  if (!treffer) { if (listeOffen) gewaehlt !== null ? waehle(gewaehlt, false) : startseite(); return; }
  listeOffen = true; bogenZurueck = null;
  const t = filt.thema, menge = [...treffer], n = i => t ? (t.zm.get(i) || 0) : 0;
  const woerter = menge.reduce((s, i) => s + Z[i].w, 0), fund = menge.reduce((s, i) => s + n(i), 0);
  const sort = t ? listeSort : 'paket';
  const max = Math.max(1, ...menge.map(n));
  const beschreibung = [filt.art ? TEXTART[filt.art].name : '', filt.reich ? `verknüpft mit ${Z[filt.reich.i].l}` : '', filt.such ? `Suche «${suchText}»` : ''].filter(Boolean).join(' · ');
  const her = listeHerkunft && listeHerkunft.q ? `<p class="hinweis-klein">Gesucht: «${esc(listeHerkunft.q)}». ${listeHerkunft.imText ? `Das Wort steht in ${fmt(listeHerkunft.imText)} Zetteln; das Thema umfasst zusätzlich die Begriffe unten.` : 'Das Wort steht so nicht im Wortlaut. Das Thema fasst die Begriffe zusammen, die der Text dafür verwendet.'}</p>` : '';
  const gruppen = Object.entries(TEXTART).map(([k, a]) => {
    let li = menge.filter(i => artVon(Z[i].d) === k);
    if (!li.length) return '';
    li.sort(sort === 'treffer' ? (x, y) => n(y) - n(x) || x - y : (x, y) => x - y);
    const alle = listeAlle.has(k), zeig = alle ? li : li.slice(0, 15);
    return `<div class="li-gruppe"><h4>${esc(a.name)} <span>${esc(a.frage)} · ${fmt(li.length)} Zettel</span></h4>
      ${zeig.map(i => { const z = Z[i], d = docById.get(z.d);
        return `<button class="li-z" data-z="${i}" style="--g:${gVar(d.gruppe)}"><span class="li-ort">${esc(d.kurz)}${z.p.length ? ' › ' + esc(kuerze(z.p.join(' › '), 60)) : ''}</span>
          <span class="li-titel">${esc(z.l)}</span>${t ? `<span class="li-n"><i style="width:${(n(i) / max * 100).toFixed(1)}%"></i><span>${fmt(n(i))} ${n(i) === 1 ? 'Fundstelle' : 'Fundstellen'}</span></span>` : ''}</button>`; }).join('')}
      ${li.length > 15 ? `<button class="uf-mehr" data-alle="${k}">${alle ? 'weniger zeigen' : `alle ${fmt(li.length)} zeigen`}</button>` : ''}</div>`;
  }).join('');
  zEl.innerHTML = `
    <div><div class="ort">${t ? 'Thema' : 'Auswahl'}${beschreibung ? ' · ' + esc(beschreibung) : ''}</div><h3>${t ? esc(t.name) : 'Markierte Zettel'}</h3></div>
    <div class="meta"><span>${fmt(menge.length)} Zettel</span>${t ? `<span>${fmt(fund)} Fundstellen</span>` : ''}<span>${pct(woerter, total)} des Pakets nach Wörtern</span>
      ${t ? '<button type="button" class="knopf klein" data-grafik="thema" style="margin-left:0">Als Grafik</button>' : ''}</div>
    ${her}
    ${t ? `<div><h4>Begriffe im Wortlaut</h4><div class="chips begriffe">${t.b.map(([a, , k]) => `<span>${esc(a)} <b>${fmt(k)}</b></span>`).join('')}</div>
      ${t.s.length ? `<p class="leer" style="margin:6px 0 0">Führen in der Suche ebenfalls hierher: ${esc(t.s.map(x => x[0]).join(', '))}.</p>` : ''}</div>` : ''}
    ${t ? `<div class="schalter klein" id="li-sort" role="group" aria-label="Reihenfolge"><button data-sort="paket" aria-pressed="${sort === 'paket'}">Reihenfolge im Paket</button><button data-sort="treffer" aria-pressed="${sort === 'treffer'}">Meiste Fundstellen zuerst</button></div>` : ''}
    ${gruppen || '<p class="leer">Keine Zettel in dieser Auswahl.</p>'}
    <p class="leer">${t ? 'Ein Zettel gehört zum Thema, wenn mindestens ein Begriff in Wortlaut oder Fussnoten steht. Gezählt wird jede Nennung; die Zahl sagt nichts über Bedeutung oder Gewicht.' : 'Reihenfolge nach BBl-Nummer und Gliederung.'} Die Auswahl ist auch in Umfang, Verknüpfungen, Bezügen, Umsetzung und Tabelle markiert.</p>`;
  zEl.onclick = ev => {
    if (!listeOffen) return;
    const s = ev.target.closest('[data-sort]'); if (s) { listeSort = s.dataset.sort; zeigeListe(); return; }
    const a = ev.target.closest('[data-alle]'); if (a) { const k = a.dataset.alle; listeAlle.has(k) ? listeAlle.delete(k) : listeAlle.add(k); zeigeListe(); return; }
    const b = ev.target.closest('.li-z'); if (b) { const i = +b.dataset.z; if (aktiv === 'umfang') fokusAufZettel(i); waehle(i, false, null, true); if (aktiv === 'umfang') zeichneUmfang(true); zEl.scrollTop = 0; }
  };
  hashSchreiben();
}

// Geführte Auswahl in drei Schritten: Thema, Textart, Ansicht. Reihenfolge der Themen alphabetisch, kein Einstieg nach Partei oder Haltung.
function gefuehrt() {
  const dlg = $('#schritte'), wahl = {thema: filt.thema ? filt.thema.id : null, art: filt.art};
  let stufe = 1;
  const anzahl = (th, a) => { const t = th ? T.find(x => x.id === th) : null; let m = t ? [...t.zm.keys()] : Z.map((z, i) => i); if (a) m = m.filter(i => artVon(Z[i].d) === a); return m.length; };
  const ANSICHT = [
    ['liste', 'Als Liste der Stellen', 'In der Reihenfolge des Pakets, wahlweise nach Anzahl Fundstellen; ein Klick öffnet den Wortlaut mit markierten Begriffen.'],
    ['umfang', 'Im ganzen Paket verortet', 'Wo die Stellen liegen und wie viel Text sie umfassen (Ansicht Umfang).'],
    ['bezuege', 'Mit ihren Verweisen', 'Welche Bögen von diesen Stellen ausgehen oder auf sie zeigen (Ansicht Bezüge).'],
    ['verkn', 'Zwischen den Dokumenten', 'Welche Dokumente über diese Stellen aufeinander verweisen (Ansicht Verknüpfungen).'],
  ];
  function zeichne() {
    $('#sch-stufe').textContent = `Schritt ${stufe} von 3`;
    $('#sch-zurueck').hidden = stufe === 1;
    const w = $('#sch-wahl'), titel = $('#schritte-titel'), erkl = $('#sch-erkl');
    if (stufe === 1) {
      titel.textContent = 'Worum geht es Ihnen?';
      erkl.textContent = 'Themen in alphabetischer Reihenfolge. Ein Thema fasst Begriffe zusammen, die im Wortlaut stehen. Ein Stichwort aus der öffentlichen Debatte führt zum passenden Thema.';
      w.innerHTML = `<label class="sr" for="sch-such">Stichwort</label><input type="search" id="sch-such" placeholder="Stichwort eingeben, z. B. Strom, Löhne, Gericht" autocomplete="off"><div class="sch-optionen" id="sch-opt"></div>`;
      const opt = () => {
        const q = $('#sch-such').value.trim(), liste = q.length >= 3 ? themenFuer(q) : T;
        const nichtImText = q.length >= 3 && T.some(t => t.s.some(([w, n]) => n === 0 && w.toLowerCase() === q.toLowerCase()));
        $('#sch-opt').innerHTML = (nichtImText ? `<p class="leer sch-hinweis">«${esc(q)}» steht so nicht im Wortlaut. Das Thema fasst die Begriffe zusammen, die der Text dafür verwendet.</p>` : '') + liste.map(t => `<button type="button" data-th="${t.id}" aria-pressed="${wahl.thema === t.id}"><b>${esc(t.name)}</b><small>${fmt(t.zm.size)} Zettel · ${esc(t.b.slice(0, 3).map(b => b[0]).join(', '))}${t.b.length > 3 ? ' …' : ''}</small></button>`).join('') +
          (q.length >= 3 && !liste.length ? `<p class="leer">Kein Thema zu «${esc(q)}». Die Suche oben auf der Seite durchsucht den ganzen Wortlaut.</p>` : '') +
          `<button type="button" data-th="" aria-pressed="${wahl.thema === null}"><b>Kein bestimmtes Thema</b><small>Alle ${fmt(Z.length)} Zettel</small></button>`;
      };
      opt(); $('#sch-such').oninput = opt;
      w.onclick = ev => { const b = ev.target.closest('[data-th]'); if (!b) return; wahl.thema = b.dataset.th || null; stufe = 2; zeichne(); };
    } else if (stufe === 2) {
      const t = wahl.thema ? T.find(x => x.id === wahl.thema) : null;
      titel.textContent = 'Welche Texte wollen Sie sehen?';
      erkl.textContent = t ? `Thema «${t.name}». Zahl = Zettel mit mindestens einem Begriff des Themas.` : 'Zahl = Zettel dieser Textart.';
      w.innerHTML = `<div class="sch-optionen">${Object.entries(TEXTART).map(([k, a]) => `<button type="button" data-art="${k}" aria-pressed="${wahl.art === k}"><b>${esc(a.frage)}</b><small>${esc(a.name)}: ${esc(a.erkl)} · ${fmt(anzahl(wahl.thema, k))} Zettel</small></button>`).join('')}
        <button type="button" data-art="" aria-pressed="${!wahl.art}"><b>Alle Texte</b><small>${fmt(anzahl(wahl.thema, null))} Zettel</small></button></div>`;
      w.onclick = ev => { const b = ev.target.closest('[data-art]'); if (!b) return; wahl.art = b.dataset.art || null; stufe = 3; zeichne(); };
    } else {
      titel.textContent = 'Wie wollen Sie die Stellen sehen?';
      const n = anzahl(wahl.thema, wahl.art);
      erkl.textContent = `${fmt(n)} Zettel. Die Auswahl bleibt in allen Ansichten markiert und lässt sich oben jederzeit ändern.`;
      w.innerHTML = `<div class="sch-optionen">${ANSICHT.filter(([k]) => k !== 'liste' || wahl.thema || wahl.art).map(([k, a, e]) => `<button type="button" data-ans="${k}"><b>${esc(a)}</b><small>${esc(e)}</small></button>`).join('')}</div>`;
      w.onclick = ev => { const b = ev.target.closest('[data-ans]'); if (!b) return; anwenden(b.dataset.ans); };
    }
    const f = w.querySelector('input, button'); if (f) f.focus();
  }
  function anwenden(ans) {
    dlg.close();
    filt.thema = wahl.thema ? T.find(x => x.id === wahl.thema) : null; filt.art = wahl.art;
    listeHerkunft = null; listeAlle = new Set();
    findenStand();
    const mitAuswahl = !!(filt.thema || filt.art);
    filterAnwenden({liste: mitAuswahl});
    if (!mitAuswahl && listeOffen) gewaehlt !== null ? waehle(gewaehlt, false) : startseite();
    if (ans !== 'liste') { zeigeReiter(ans); if (ans === 'umfang') { fokus = root; zeichneUmfang(true); } }
    (ans === 'liste' && innerWidth < 1280 ? zEl : $('#ansicht')).scrollIntoView({behavior: ruhig() ? 'auto' : 'smooth', block: 'start'});
  }
  $('#sch-zurueck').onclick = () => { stufe = Math.max(1, stufe - 1); zeichne(); };
  $('#sch-zu').onclick = () => dlg.close();
  stufe = 1; zeichne(); dlg.showModal();
}

/* ---------- Verknüpfungen: Matrix (Ziffer 5, Ansicht 2) ---------- */
let mxModus = 'verweise';
function matrixWerte(modus = mxModus) {
  const ids = D.docs.map(d => d.nr), pos = new Map(ids.map((d, k) => [d, k])), n = ids.length;
  const M = ids.map(() => ids.map(() => [])), symm = modus === 'eu';
  // Mit Auswahl (Ziffer 5.4) zählen nur Bezüge, deren verweisender Zettel markiert ist
  const inF = k => !treffer || (typeof k.von === 'number' && treffer.has(k.von));
  if (modus === 'verweise' || modus === 'struktur') {
    const arten = modus === 'verweise' ? ['verweist_auf'] : ['genehmigt', 'erlaeutert'];
    K.forEach(k => { if (!arten.includes(k.art) || !inF(k)) return; const a = refDoc(k.von), b = refDoc(k.nach); if (!a || !b || a === b) return; M[pos.get(a)][pos.get(b)].push(k); });
  } else {
    const je = new Map(); K.forEach(k => { if (k.art === 'nennt' && inF(k) && typeof k.nach === 'string' && k.nach.startsWith('celex:')) { const d = refDoc(k.von); if (!je.has(d)) je.set(d, new Set()); je.get(d).add(k.nach.slice(6)); } });
    for (let a = 0; a < n; a++) for (let b = 0; b < n; b++) if (a !== b) { const A = je.get(ids[a]), B = je.get(ids[b]); if (A && B) M[a][b] = [...A].filter(x => B.has(x)); }
  }
  return {ids, M, symm};
}
function zeichneMatrix() {
  const {ids, M} = matrixWerte(), n = ids.length;
  const C = 19, L = 240, T = 210;
  const W = L + n * C + 10, Hm = T + n * C + 10;
  const host = d3.select('#matrix'); host.selectAll('*').remove();
  const svg = host.append('svg').attr('viewBox', `0 0 ${W} ${Hm}`).attr('width', W).attr('height', Hm).attr('role', 'img').attr('aria-label', 'Matrix der Verknüpfungen zwischen Dokumenten');
  const erkl = {
    verweise: 'Zeile → Spalte: Anzahl Artikelverweise aus einem Dokument auf Artikel eines anderen Dokuments, auch aus der Botschaft («Art. 5 E-BHÜG»). Klick auf eine Zelle listet die Verweise mit Fundstelle.',
    eu: 'Zelle: Anzahl EU-Rechtsakte, die beide Dokumente nennen. Symmetrisch. Klick auf eine Zelle listet die Rechtsakte.',
    struktur: 'Zeile → Spalte: Bundesbeschluss genehmigt Abkommen oder Protokoll (Art. 1); Botschaft erläutert ein Dokument (Kapitel 2.x und Erläuterungen zu einzelnen Artikeln). Zahl = Anzahl Bezüge.',
  }[mxModus];
  $('#mx-erkl').textContent = erkl + (treffer ? ` Auswahl aktiv: gezählt werden nur Bezüge aus den ${fmt(treffer.size)} markierten Zetteln.` : '');
  // Feste, logarithmisch gestufte Klassen: wenige grosse Werte (Botschaft) sollen die kleinen nicht verdecken
  const stufen = ['var(--seq-1)', 'var(--seq-2)', 'var(--seq-3)', 'var(--seq-4)', 'var(--seq-5)'];
  const KLASSEN = [1, 2, 5, 15, 50], KNAMEN = ['1', '2–4', '5–14', '15–49', '50 und mehr'];
  const farbe = v => v === 0 ? 'var(--flaeche)' : stufen[KLASSEN.filter(k => v >= k).length - 1];
  const kurz = id => docById.get(id).kurz;
  svg.append('g').selectAll('text').data(ids).join('text').attr('class', 'mx-label').attr('x', L - 10).attr('y', (d, i) => T + i * C + C * 0.72).attr('text-anchor', 'end').text(d => kuerze(kurz(d), 30));
  svg.append('g').selectAll('rect').data(ids).join('rect').attr('x', L - 7).attr('y', (d, i) => T + i * C + 4).attr('width', 4).attr('height', C - 8).attr('fill', d => gVar(docById.get(d).gruppe));
  svg.append('g').selectAll('text').data(ids).join('text').attr('class', 'mx-label').attr('transform', (d, i) => `translate(${L + i * C + C * 0.72},${T - 10}) rotate(-60)`).text(d => kuerze(kurz(d), 26));
  svg.append('g').selectAll('rect').data(ids).join('rect').attr('x', (d, i) => L + i * C + 4).attr('y', T - 7).attr('width', C - 8).attr('height', 4).attr('fill', d => gVar(docById.get(d).gruppe));
  const cells = []; for (let a = 0; a < n; a++) for (let b = 0; b < n; b++) cells.push({a, b, v: M[a][b].length});
  svg.append('g').selectAll('rect').data(cells).join('rect').attr('class', 'mx-cell')
    .attr('x', c => L + c.b * C + 1).attr('y', c => T + c.a * C + 1).attr('width', C - 2).attr('height', C - 2).attr('rx', 2)
    .attr('fill', c => c.a === c.b ? 'var(--linie)' : farbe(c.v))
    .on('pointerenter pointermove', (ev, c) => { const A = kurz(ids[c.a]), B = kurz(ids[c.b]);
      showTip(ev, c.a === c.b ? `<b>${esc(A)}</b>` : `<b>${esc(A)} ${mxModus === 'eu' ? '×' : '→'} ${esc(B)}</b>${fmt(c.v)} ${mxModus === 'eu' ? 'gemeinsame EU-Rechtsakte' : mxModus === 'verweise' ? 'Artikelverweise' : 'Bezüge'}`); })
    .on('pointerleave', hideTip)
    .on('click', (ev, c) => { if (c.a === c.b) return; matrixDetail(ids[c.a], ids[c.b], M[c.a][c.b]); });
  const lg = svg.append('g').attr('transform', `translate(10,${T - 150})`);
  lg.append('text').attr('class', 'mx-label').attr('y', 0).text('Anzahl');
  ['var(--flaeche)', ...stufen].forEach((f, k) => {
    lg.append('rect').attr('x', 0).attr('y', 8 + k * 18).attr('width', 13).attr('height', 13).attr('rx', 2).attr('fill', f).attr('stroke', 'var(--linie)');
    lg.append('text').attr('class', 'mx-label').attr('x', 20).attr('y', 19 + k * 18).text(k === 0 ? '0' : KNAMEN[k - 1]);
  });
}
function matrixDetail(a, b, liste) {
  const el = $('#mx-detail'), A = docById.get(a).kurz, B = docById.get(b).kurz;
  if (mxModus === 'eu') {
    el.innerHTML = `<strong>${esc(A)} × ${esc(B)}:</strong> ${fmt(liste.length)} gemeinsame EU-Rechtsakte<ol>${liste.map(c => `<li><a href="https://eur-lex.europa.eu/legal-content/DE/TXT/?uri=CELEX:${encodeURIComponent(c)}" target="_blank" rel="noopener">${esc(c)}</a> ${esc(kuerze(D.eu[c] || '', 140))}</li>`).join('')}</ol>`;
    return;
  }
  el.innerHTML = `<strong>${esc(A)} → ${esc(B)}:</strong> ${fmt(liste.length)} ${mxModus === 'verweise' ? 'Artikelverweise' : 'Bezüge'}<ol>${liste.slice(0, 200).map(k =>
    `<li><button class="knopf" data-z="${typeof k.von === 'number' ? k.von : ''}">${esc(refName(k.von))}</button> → ${typeof k.nach === 'number' ? `<button class="knopf" data-z="${k.nach}">${esc(refName(k.nach))}</button>` : esc(refName(k.nach))}
     ${k.stelle ? `<div class="stelle">«${esc(kuerze(k.stelle.replace(/\s+/g, ' '), 160))}»</div>` : ''}</li>`).join('')}</ol>`;
  el.querySelectorAll('button[data-z]').forEach(x => { if (x.dataset.z !== '') x.onclick = () => waehle(+x.dataset.z, false); });
}

/* ---------- Verknüpfungen: Netz auf drei Stufen (Ziffer 5, Ansicht 2b) ----------
   Knoten auf einem Kreis in Paketreihenfolge, Fläche = Wörter; Linienbreite = Anzahl Bezüge beider Richtungen.
   Kein Kräftemodell: Nähe trüge sonst Bedeutung (Ziffer 6.3). Gleiche Zählung wie die Matrix. */
let mxDarst = 'matrix', nzStufe = 'dokumente', nzDoc = 616;
const GRUPPE_KURZ = {weitere: 'Weitere Beschlüsse und Erklärungen', begleit: 'Begleitgeschäft Pa. Iv. 26.425'};
const MASS_NAME = {verweise: 'Artikelverweise', eu: 'gemeinsame EU-Rechtsakte', struktur: 'Genehmigungen und Erläuterungen'};
function kurzLabel(z) {
  const m = /^(Art\.\s*(?:[IVX]+\.)?\d+[a-z]*(?:\s*(?:bis|ter|quater))?|Ziff\.\s*[\dIVX.]+|Anhang\s+[IVX\d]+[a-z]?|Abschnitt\s+[\dIVX]+|Kapitel\s+[\dIVX]+|\d+(?:\.\d+)*)/.exec(z.l);
  return m ? m[1] : kuerze(z.l, 16);
}
function netzDaten(stufe, doc, mass = mxModus) {
  const docs = D.docs.map(d => d.nr);
  if (stufe === 'dokument') {
    const kanten = new Map(), knoten = new Set();
    K.forEach(k => {
      if (k.art !== 'verweist_auf' || typeof k.von !== 'number' || typeof k.nach !== 'number' || k.von === k.nach) return;
      if (Z[k.von].d !== doc || Z[k.nach].d !== doc) return;
      if (treffer && !treffer.has(k.von)) return;
      const a = Math.min(k.von, k.nach), b = Math.max(k.von, k.nach), s = a + '|' + b;
      if (!kanten.has(s)) kanten.set(s, {a, b, ab: [], ba: []});
      kanten.get(s)[k.von === a ? 'ab' : 'ba'].push(k); knoten.add(a); knoten.add(b);
    });
    return {stufe, doc, mass: 'verweise',
      knoten: [...knoten].sort((x, y) => x - y).map(i => ({id: i, i, name: kurzLabel(Z[i]), lang: Z[i].l, g: docById.get(doc).gruppe, w: Z[i].w})),
      kanten: [...kanten.values()].map(e => ({...e, n: e.ab.length + e.ba.length})), intern: new Map()};
  }
  const {ids, M, symm} = matrixWerte(mass);
  const paar = new Map();
  for (let x = 0; x < ids.length; x++) for (let y = 0; y < ids.length; y++) {
    if (x === y || !M[x][y].length || (symm && x > y)) continue;
    const a = ids[Math.min(x, y)], b = ids[Math.max(x, y)], s = a + '|' + b;
    if (!paar.has(s)) paar.set(s, {a, b, ab: [], ba: []});
    paar.get(s)[x < y ? 'ab' : 'ba'].push(...M[x][y]);
  }
  if (stufe === 'dokumente') return {stufe, mass, intern: new Map(),
    knoten: D.docs.map(d => ({id: d.nr, doc: d.nr, name: d.kurz, lang: d.titel, g: d.gruppe, w: d.woerter})),
    kanten: [...paar.values()].map(e => ({...e, n: symm ? e.ab.length : e.ab.length + e.ba.length}))};
  // Vorlagen (Gruppen): Paare zwischen Dokumenten verschiedener Gruppen zusammengefasst; innerhalb einer Gruppe als «intern»
  const gVon = nr => docById.get(nr).gruppe, intern = new Map(), gp = new Map();
  const knoten = D.gruppen.map(g => ({id: g.id, name: GRUPPE_KURZ[g.id] || g.name, lang: g.name, g: g.id, w: D.docs.filter(d => d.gruppe === g.id).reduce((s, d) => s + d.woerter, 0)})).filter(k => k.w);
  if (mass === 'eu') {        // verschiedene EU-Rechtsakte je Gruppe, nicht die Summe der Dokumentpaare
    const je = new Map();
    K.forEach(k => { if (k.art === 'nennt' && typeof k.von === 'number' && (!treffer || treffer.has(k.von)) && typeof k.nach === 'string' && k.nach.startsWith('celex:')) {
      const g = gVon(Z[k.von].d); if (!je.has(g)) je.set(g, new Set()); je.get(g).add(k.nach.slice(6)); } });
    const gs = knoten.map(k => k.id);
    gs.forEach((a, x) => gs.slice(x + 1).forEach(b => { const A = je.get(a), B = je.get(b); if (!A || !B) return;
      const l = [...A].filter(c => B.has(c)); if (l.length) gp.set(a + '|' + b, {a, b, ab: l, ba: [], n: l.length}); }));
    return {stufe, mass, knoten, kanten: [...gp.values()], intern};
  }
  paar.forEach(e => {
    const ga = gVon(e.a), gb = gVon(e.b), n = e.ab.length + e.ba.length;
    if (ga === gb) { intern.set(ga, (intern.get(ga) || 0) + n); return; }
    const ia = knoten.findIndex(k => k.id === ga), ib = knoten.findIndex(k => k.id === gb);
    const [a, b, vor] = ia < ib ? [ga, gb, true] : [gb, ga, false], s = a + '|' + b;
    if (!gp.has(s)) gp.set(s, {a, b, ab: [], ba: [], paare: []});
    const z = gp.get(s); z.ab.push(...(vor ? e.ab : e.ba)); z.ba.push(...(vor ? e.ba : e.ab)); z.paare.push(e);
  });
  return {stufe, mass, knoten, kanten: [...gp.values()].map(e => ({...e, n: e.ab.length + e.ba.length})), intern};
}
// Lage auf dem Kreis; gleiche Rechnung für die Seite (SVG) und die Grafik (Canvas)
function netzLage(nd, cx, cy, R, rMin, rMax) {
  const n = nd.knoten.length, wMax = Math.max(1, ...nd.knoten.map(k => k.w));
  nd.knoten.forEach((k, j) => {
    k.winkel = -Math.PI / 2 + 2 * Math.PI * j / Math.max(1, n);
    k.x = cx + R * Math.cos(k.winkel); k.y = cy + R * Math.sin(k.winkel);
    k.r = rMin + (rMax - rMin) * Math.sqrt(k.w / wMax);
  });
  const nach = new Map(nd.knoten.map(k => [k.id, k])), nMax = Math.max(1, ...nd.kanten.map(e => e.n));
  nd.kanten.forEach(e => {
    const A = nach.get(e.a), B = nach.get(e.b); e.A = A; e.B = B;
    const mx = (A.x + B.x) / 2, my = (A.y + B.y) / 2;
    e.cx = cx + (mx - cx) * 0.3; e.cy = cy + (my - cy) * 0.3;
    e.anteil = Math.sqrt(e.n / nMax);
    e.g = A.g === B.g ? A.g : (A.g === 'botschaft' || A.g === 'begleit') ? B.g : (B.g === 'botschaft' || B.g === 'begleit') ? A.g : 'neutral';
  });
  return nd;
}
function netzErkl(nd) {
  const was = nd.stufe === 'dokument' ? `Artikel von ${docById.get(nd.doc).kurz}, die im Wortlaut aufeinander verweisen` : nd.stufe === 'gruppen' ? 'Vorlagen, Botschaft und Begleitgeschäft' : 'die 33 Dokumente';
  return `Knoten: ${was}, auf dem Kreis in der Reihenfolge des Pakets (oben beginnend, im Uhrzeigersinn); Kreisfläche = Wörter. Linie: ${nd.stufe === 'dokument' ? 'Artikelverweise innerhalb des Dokuments' : MASS_NAME[nd.mass]}, Breite = Anzahl in beiden Richtungen. Lage und Abstand tragen keine weitere Bedeutung.` +
    (nd.stufe === 'gruppen' && nd.mass !== 'eu' ? ' Bezüge innerhalb einer Gruppe stehen als «intern» beim Knoten.' : '') + (nd.stufe === 'dokumente' ? ' Klick auf ein Dokument zeigt seine Artikel.' : nd.stufe === 'dokument' ? ' Klick auf einen Artikel öffnet den Zettel.' : '') +
    (treffer ? ` Auswahl aktiv: gezählt werden nur Bezüge aus den ${fmt(treffer.size)} markierten Zetteln.` : '');
}
function zeichneNetz() {
  const host = d3.select('#netz'); host.selectAll('*').remove();
  const nd = netzDaten(nzStufe, nzDoc);
  $('#mx-erkl').textContent = netzErkl(nd);
  if (!nd.knoten.length || !nd.kanten.length) { host.append('p').attr('class', 'leer').text(nzStufe === 'dokument' ? 'Keine Artikelverweise innerhalb dieses Dokuments' + (treffer ? ' in der Auswahl.' : '.') : 'Keine Bezüge in der Auswahl.'); if (!nd.kanten.length && nzStufe !== 'dokument') return; if (!nd.knoten.length) return; }
  const W = Math.max(320, $('#netz').clientWidth), Hh = Math.min(Math.max(420, W), 900), rand = nzStufe === 'gruppen' ? (W < 640 ? 120 : 190) : nzStufe === 'dokumente' ? (W < 640 ? 120 : 180) : 64;
  const R = Math.min(W, Hh) / 2 - rand;
  netzLage(nd, W / 2, Hh / 2, R, nzStufe === 'dokument' ? 3 : 5, nzStufe === 'gruppen' ? 40 : nzStufe === 'dokumente' ? 22 : 9);
  const svg = host.append('svg').attr('viewBox', `0 0 ${W} ${Hh}`).attr('height', Hh).attr('role', 'img')
    .attr('aria-label', `Netz: ${nd.knoten.length} Knoten, ${nd.kanten.length} Verbindungen`);
  const strich = e => 1 + (nzStufe === 'dokument' ? 4 : 11) * e.anteil;
  const imF = k => !treffer || (k.i !== undefined ? treffer.has(k.i) : k.doc ? [...treffer].some(i => Z[i].d === k.doc) : [...treffer].some(i => docById.get(Z[i].d).gruppe === k.id));
  const gK = svg.append('g').attr('fill', 'none').selectAll('path').data(nd.kanten).join('path')
    .attr('d', e => `M${e.A.x},${e.A.y}Q${e.cx},${e.cy} ${e.B.x},${e.B.y}`).attr('stroke', e => gVar(e.g)).attr('stroke-opacity', .45)
    .attr('stroke-width', strich).attr('stroke-linecap', 'round').style('cursor', 'pointer');
  const wort = nd.stufe === 'dokument' ? 'Artikelverweise' : MASS_NAME[nd.mass];
  const nm = k => nd.stufe === 'dokument' ? Z[k.i].l : k.name;
  gK.on('pointerenter pointermove', (ev, e) => { gK.attr('stroke-opacity', x => x === e ? .95 : .12);
      showTip(ev, `<b>${esc(nm(e.A))} ↔ ${esc(nm(e.B))}</b>${fmt(e.n)} ${wort}${nd.mass !== 'eu' ? `<br><span>${esc(e.A.name)} → ${esc(e.B.name)}: ${fmt(e.ab.length)} · ${esc(e.B.name)} → ${esc(e.A.name)}: ${fmt(e.ba.length)}</span>` : ''}<br><span>Klick: Liste mit Fundstellen</span>`); })
    .on('pointerleave', () => { gK.attr('stroke-opacity', .45); hideTip(); })
    .on('click', (ev, e) => netzDetail(nd, e));
  const gN = svg.append('g').selectAll('g').data(nd.knoten).join('g').attr('transform', k => `translate(${k.x},${k.y})`)
    .style('cursor', nd.stufe === 'gruppen' ? 'default' : 'pointer').attr('opacity', k => imF(k) ? 1 : .3).attr('tabindex', nd.stufe === 'gruppen' ? null : 0);
  gN.append('circle').attr('r', k => k.r).attr('fill', k => tint(k.g, 70)).attr('stroke', k => gVar(k.g)).attr('stroke-width', 1.5);
  const quer = nd.stufe === 'gruppen';
  gN.append('text').attr('class', nd.stufe === 'dokument' ? 'nz-label klein' : 'nz-label')
    .attr('transform', k => { if (quer) return null; const g = k.winkel * 180 / Math.PI, links = Math.cos(k.winkel) < 0; return `rotate(${links ? g + 180 : g})`; })
    .attr('x', k => quer ? (Math.cos(k.winkel) >= -0.01 ? 1 : -1) * (Math.abs(Math.cos(k.winkel)) < 0.2 ? 0 : k.r + 8) : (Math.cos(k.winkel) < 0 ? -1 : 1) * (k.r + 6))
    .attr('y', k => quer ? (Math.abs(Math.cos(k.winkel)) < 0.2 ? (Math.sin(k.winkel) < 0 ? -k.r - 10 : k.r + 20) : 5) : 4)
    .attr('text-anchor', k => quer ? (Math.abs(Math.cos(k.winkel)) < 0.2 ? 'middle' : Math.cos(k.winkel) > 0 ? 'start' : 'end') : Math.cos(k.winkel) < 0 ? 'end' : 'start')
    .text(k => quer ? k.name : kuerze(k.name, nd.stufe === 'dokument' ? 14 : 24));
  if (quer) gN.filter(k => nd.intern.get(k.id)).append('text').attr('class', 'nz-intern')
    .attr('x', k => Math.abs(Math.cos(k.winkel)) < 0.2 ? 0 : (Math.cos(k.winkel) > 0 ? 1 : -1) * (k.r + 8))
    .attr('y', k => Math.abs(Math.cos(k.winkel)) < 0.2 ? (Math.sin(k.winkel) < 0 ? -k.r - 28 : k.r + 38) : 23)
    .attr('text-anchor', k => Math.abs(Math.cos(k.winkel)) < 0.2 ? 'middle' : Math.cos(k.winkel) > 0 ? 'start' : 'end').text(k => `intern ${fmt(nd.intern.get(k.id))}`);
  const summe = id => nd.kanten.filter(e => e.a === id || e.b === id).reduce((s, e) => s + e.n, 0);
  gN.on('pointerenter pointermove', (ev, k) => { gK.attr('stroke-opacity', e => e.a === k.id || e.b === k.id ? .9 : .07);
      showTip(ev, `<b>${esc(nd.stufe === 'dokument' ? Z[k.i].l : k.lang || k.name)}</b>${fmt(k.w)} Wörter<br><span>${fmt(summe(k.id))} ${wort} mit anderen Knoten</span>${nd.stufe === 'dokumente' ? '<br><span>Klick: Artikel dieses Dokuments</span>' : nd.stufe === 'dokument' ? '<br><span>Klick: Zettel öffnen</span>' : ''}`); })
    .on('pointerleave', () => { gK.attr('stroke-opacity', .45); hideTip(); })
    .on('click keydown', (ev, k) => { if (ev.type === 'keydown' && ev.key !== 'Enter') return; hideTip();
      if (nd.stufe === 'dokumente') { nzDoc = k.doc; setzeNetzStufe('dokument'); } else if (nd.stufe === 'dokument') waehle(k.i, false); });
}
function netzDetail(nd, e) {
  const el = $('#mx-detail'), name = id => nd.stufe === 'gruppen' ? gName[id] : nd.stufe === 'dokumente' ? docById.get(id).kurz : Z[id].l;
  const kopf = `<strong>${esc(name(e.a))} ↔ ${esc(name(e.b))}:</strong> ${fmt(e.n)} ${nd.stufe === 'dokument' ? 'Artikelverweise' : MASS_NAME[nd.mass]}`;
  if (nd.mass === 'eu' && nd.stufe !== 'dokument') {
    el.innerHTML = `${kopf}<ol>${e.ab.map(c => `<li><a href="https://eur-lex.europa.eu/legal-content/DE/TXT/?uri=CELEX:${encodeURIComponent(c)}" target="_blank" rel="noopener">${esc(c)}</a> ${esc(kuerze(D.eu[c] || '', 140))}</li>`).join('')}</ol>`;
    return;
  }
  if (nd.stufe === 'gruppen') {
    el.innerHTML = `${kopf}, nach Dokumentpaar<ol>${e.paare.map(p => `<li>${esc(docById.get(p.a).kurz)} ↔ ${esc(docById.get(p.b).kurz)}: ${fmt(p.ab.length + p.ba.length)}</li>`).join('')}</ol>`;
    return;
  }
  const zeile = k => `<li>${typeof k.von === 'number' ? `<button class="knopf" data-z="${k.von}">${esc(refName(k.von, true))}</button>` : esc(refName(k.von, true))} → ${typeof k.nach === 'number' ? `<button class="knopf" data-z="${k.nach}">${esc(refName(k.nach, true))}</button>` : esc(refName(k.nach, true))}${k.stelle ? `<div class="stelle">«${esc(kuerze(k.stelle.replace(/\s+/g, ' '), 160))}»</div>` : ''}</li>`;
  el.innerHTML = `${kopf}<ol>${[...e.ab, ...e.ba].slice(0, 300).map(zeile).join('')}</ol>`;
  el.querySelectorAll('button[data-z]').forEach(x => x.onclick = () => waehle(+x.dataset.z, false));
}
function setzeNetzStufe(st) {
  nzStufe = st;
  document.querySelectorAll('[data-stufe]').forEach(x => x.setAttribute('aria-pressed', x.dataset.stufe === st));
  $('#nz-doc-feld').hidden = mxDarst !== 'netz' || st !== 'dokument';
  $('#nz-doc').value = String(nzDoc);
  $('#vk-mass').hidden = mxDarst === 'netz' && st === 'dokument';
  $('#mx-detail').innerHTML = ''; zeichneVerkn();
}
function zeichneVerkn() {
  $('#matrix-box').hidden = mxDarst !== 'matrix'; $('#netz').hidden = mxDarst !== 'netz';
  if (mxDarst === 'matrix') zeichneMatrix(); else zeichneNetz();
}
function verknAufbauen() {
  $('#nz-doc').innerHTML = D.docs.map(d => `<option value="${d.nr}">${esc(d.kurz)}</option>`).join('');
  $('#nz-doc').value = String(nzDoc);
  $('#nz-doc').onchange = ev => { nzDoc = +ev.target.value; $('#mx-detail').innerHTML = ''; zeichneVerkn(); };
  document.querySelectorAll('[data-mass]').forEach(b => b.onclick = () => {
    mxModus = b.dataset.mass;
    document.querySelectorAll('[data-mass]').forEach(x => x.setAttribute('aria-pressed', x === b));
    $('#mx-detail').innerHTML = ''; zeichneVerkn();
  });
  document.querySelectorAll('[data-darst]').forEach(b => b.onclick = () => {
    mxDarst = b.dataset.darst;
    document.querySelectorAll('[data-darst]').forEach(x => x.setAttribute('aria-pressed', x === b));
    $('#nz-stufe').hidden = mxDarst !== 'netz';
    setzeNetzStufe(nzStufe);
  });
  document.querySelectorAll('[data-stufe]').forEach(b => b.onclick = () => setzeNetzStufe(b.dataset.stufe));
}

/* ---------- Umsetzung: Sankey (Ziffer 5, Ansicht 3) ---------- */
// «Bundesgesetz vom 14. Dezember 2012 über die Meldepflicht …» → «Bundesgesetz über die Meldepflicht …»; nur das Datum fällt weg
const gesetzName = g => g.kurz || g.titel.replace(/\s+vom\s+\d{1,2}\.\s*\S+\s+\d{4}/, '').replace(/^Bundesgesetz über (die |das |den )?/, 'BG über ');
function zeichneSankey() {
  const host = d3.select('#sankey'); host.selectAll('*').remove();
  const W = Math.max($('#v-umsetz').clientWidth - 4, 760), Hs = 900;
  const nodes = [], links = [], idx = new Map();
  const node = (key, name, g, typ, extra) => { if (!idx.has(key)) { idx.set(key, nodes.length); nodes.push({key, name, g, typ, ...extra}); } return idx.get(key); };
  K.filter(k => k.art === 'genehmigt').forEach(k => {
    const bb = docById.get(refDoc(k.von)), d = docById.get(refDoc(k.nach));
    links.push({source: node('d' + d.nr, d.kurz, d.gruppe, 'dok', {doc: d.nr}), target: node('b' + bb.nr, bb.kurz, bb.gruppe, 'bb', {doc: bb.nr}), value: 1});
  });
  K.filter(k => k.art === 'aendert').forEach(k => {
    const bb = docById.get(refDoc(k.von)), g = gesetzById.get(k.nach);
    const name = gesetzName(g) + (g.neu ? ' (neu)' : g.totalrevision ? ' (Totalrevision)' : '');
    links.push({source: node('b' + bb.nr, bb.kurz, bb.gruppe, 'bb', {doc: bb.nr}), target: node(g.id, name, null, 'gesetz', {gesetz: g}), value: 1});
  });
  const sk = d3.sankey().nodeId(d => d.index).nodeWidth(12).nodePadding(6).nodeAlign(d3.sankeyLeft).nodeSort(null).linkSort(null).extent([[230, 8], [W - 330, Hs - 8]]);
  const g = sk({nodes: nodes.map(d => ({...d})), links: links.map(d => ({...d}))});
  const svg = host.append('svg').attr('viewBox', `0 0 ${W} ${Hs}`).attr('width', W).attr('height', Hs).attr('role', 'img').attr('aria-label', 'Sankey: Abkommen, genehmigende Bundesbeschlüsse und die von ihnen geschaffenen oder geänderten Bundesgesetze');
  // Auswahl (Ziffer 5.4): Knoten ohne markierten Zettel blasser; ein Gesetz bleibt kräftig, wenn ein kräftiger Bundesbeschluss es ändert
  const mitT = new Set(treffer ? [...treffer].map(i => Z[i].d) : []);
  const kraeftig = d => !treffer || (d.doc ? mitT.has(d.doc) : d.targetLinks.some(l => mitT.has(l.source.doc)));
  svg.append('g').attr('fill', 'none').selectAll('path').data(g.links).join('path')
    .attr('d', d3.sankeyLinkHorizontal()).attr('stroke', d => gVar(d.source.g || 'neutral')).attr('stroke-opacity', d => kraeftig(d.source) && kraeftig(d.target) ? 0.35 : 0.06).attr('stroke-width', d => Math.max(1.5, d.width))
    .on('pointerenter pointermove', (ev, d) => showTip(ev, `<b>${esc(d.source.name)} → ${esc(d.target.name)}</b><span>${d.target.typ === 'bb' ? 'genehmigt durch' : 'geschaffen oder geändert durch'}</span>`)).on('pointerleave', hideTip);
  const n = svg.append('g').selectAll('g').data(g.nodes).join('g').style('cursor', d => d.doc ? 'pointer' : 'default').attr('opacity', d => kraeftig(d) ? 1 : 0.3);
  n.append('rect').attr('x', d => d.x0).attr('y', d => d.y0).attr('width', d => d.x1 - d.x0).attr('height', d => Math.max(2, d.y1 - d.y0)).attr('rx', 2)
    .attr('fill', d => d.g ? gVar(d.g) : 'var(--c-gesetz)');
  n.append('text').attr('class', 'sk-label').attr('x', d => d.typ === 'dok' ? d.x0 - 6 : d.x1 + 6).attr('y', d => (d.y0 + d.y1) / 2 + 4.5)
    .attr('text-anchor', d => d.typ === 'dok' ? 'end' : 'start').text(d => kuerze(d.name, d.typ === 'gesetz' ? 46 : 32));
  n.on('pointerenter pointermove', (ev, d) => showTip(ev, `<b>${esc(d.typ === 'gesetz' ? d.gesetz.titel : d.name)}</b><span>${d.typ === 'gesetz'
    ? (d.gesetz.sr ? 'SR ' + esc(d.gesetz.sr) + ' · ' : '') + (d.gesetz.neu ? 'neues Gesetz' : d.gesetz.totalrevision ? 'Totalrevision' : 'Änderung') + ' durch ' + d.targetLinks.map(l => esc(l.source.name)).join(', ')
    : d.typ === 'bb' ? d.targetLinks.length + ' genehmigte Dokumente, ' + d.sourceLinks.length + ' Bundesgesetze' : 'genehmigt durch ' + esc(d.sourceLinks[0]?.target.name || '')}</span>`))
    .on('pointerleave', hideTip).on('click', (ev, d) => { if (d.doc) fokusAufDoc(d.doc); });
  const k = D.kennzahlen;
  $('#sk-legende').innerHTML = `<li>${fmt(k.gesetze_neu)} neue und ${fmt(k.gesetze_geaendert)} geänderte Bundesgesetze in ${fmt(K.filter(x => x.art === 'aendert').length)} Zuordnungen; ein Gesetz, das mehrere Bundesbeschlüsse ändern, hat mehrere Linien.</li>` +
    (treffer ? `<li>Auswahl aktiv: kräftig sind Dokumente und Bundesbeschlüsse mit mindestens einem der ${fmt(treffer.size)} markierten Zettel.</li>` : '');
}

/* ---------- Tabelle (Ziffer 5, Ansicht 6) ---------- */
function zeichneTabelle() {
  const anz = d3.rollup(Z, v => v.length, z => z.d);
  const kan = d3.rollup(K.filter(k => typeof k.von === 'number'), v => v.length, k => Z[k.von].d);
  const summe = (f, docs) => docs.reduce((s, d) => s + f(d), 0);
  const mk = treffer ? d3.rollup([...treffer], v => v.length, i => Z[i].d) : null;
  const mkZelle = (d, fett) => mk ? `<td class="zahl">${fett ? '<strong>' : ''}${fmt(typeof d === 'number' ? d : mk.get(d.nr) || 0)}${fett ? '</strong>' : ''}</td>` : '';
  const zeile = d => `<tr><td>${d.nr}</td><td><span class="punkt" style="background:${gVar(d.gruppe)}"></span><button class="ziel knopf" data-doc="${d.nr}" title="${esc(d.titel)}" style="border:0;background:none;padding:0;min-height:0;text-decoration:underline">${esc(d.kurz)}</button></td><td>${esc(d.typ)}</td><td>${esc(gName[d.gruppe])}</td><td class="zahl">${fmt(d.seiten)}</td><td class="zahl">${fmt(d.woerter)}</td><td class="zahl">${fmt(anz.get(d.nr) || 0)}</td><td class="zahl">${fmt(kan.get(d.nr) || 0)}</td>${mkZelle(d)}<td><a href="${esc(d.pdf || d.eli)}" target="_blank" rel="noopener">PDF</a> · <a href="${esc(d.eli)}" target="_blank" rel="noopener">Fedlex</a></td></tr>`;
  const paket = D.docs.filter(d => d.nr <= 644), begleit = D.docs.filter(d => d.nr > 644);
  const total = (docs, name) => `<tr><td></td><td><strong>${name}</strong></td><td></td><td></td><td class="zahl"><strong>${fmt(summe(d => d.seiten, docs))}</strong></td><td class="zahl"><strong>${fmt(summe(d => d.woerter, docs))}</strong></td><td class="zahl"><strong>${fmt(summe(d => anz.get(d.nr) || 0, docs))}</strong></td><td class="zahl"><strong>${fmt(summe(d => kan.get(d.nr) || 0, docs))}</strong></td>${mkZelle(summe(d => mk ? mk.get(d.nr) || 0 : 0, docs), true)}<td></td></tr>`;
  $('#tabelle').innerHTML = `<thead><tr><th>BBl 2026</th><th>Dokument</th><th>Typ</th><th>Vorlage</th><th class="zahl">Seiten</th><th class="zahl">Wörter</th><th class="zahl">Zettel</th><th class="zahl">Kanten</th>${mk ? '<th class="zahl" title="Zettel in der Auswahl">Markiert</th>' : ''}<th>Quelle</th></tr></thead>
    <tbody>${paket.map(zeile).join('')}${total(paket, 'Paket, BBl 2026 615–644')}${begleit.map(zeile).join('')}</tbody>`;
  $('#tabelle').querySelectorAll('[data-doc]').forEach(b => b.onclick = () => fokusAufDoc(+b.dataset.doc));
  const gs = [...D.gesetze].sort((a, b) => (b.neu - a.neu) || (b.totalrevision - a.totalrevision) || a.titel.localeCompare(b.titel, 'de'));
  $('#gesetze').innerHTML = `<thead><tr><th>Bundesgesetz</th><th>SR</th><th>Art</th><th>Bundesbeschluss</th></tr></thead><tbody>${gs.map(g =>
    `<tr><td>${esc(g.titel)}${g.abk ? ' (' + esc(g.abk) + ')' : ''}</td><td>${g.sr ? `<a href="https://www.fedlex.admin.ch/de/search?text=${encodeURIComponent('SR ' + g.sr)}" target="_blank" rel="noopener">${esc(g.sr)}</a>` : '–'}</td><td>${g.neu ? 'neu' : g.totalrevision ? 'Totalrevision' : 'Änderung'}</td><td>${g.bbs.map(b => esc(docById.get(b).kurz)).join(', ')}</td></tr>`).join('')}</tbody>`;
}

/* ---------- Bezüge: Bogendiagramm ---------- */
const BZ_TYPEN = {
  intern: {name: 'Artikelverweis im selben Dokument', von: 'Verweis in', nach: 'Verwiesener Artikel', oben: true,
    regel: 'Ein Artikel nennt einen anderen Artikel desselben Dokuments («Artikel 5», «Artikel 5 dieses Abkommens»).'},
  zwischen: {name: 'Artikelverweis zwischen Dokumenten', von: 'Verweis in', nach: 'Verwiesener Artikel',
    regel: 'Ein Artikel oder ein Abschnitt der Botschaft nennt einen Artikel eines anderen Dokuments mit Bezugswerk («Artikel 14a FZA», «Art. 5 E-BHÜG», «des Abkommens»).'},
  erlaeutert: {name: 'Botschaft erläutert', von: 'Botschaft', nach: 'Erläutert',
    regel: 'Ein Kapitel 2.x der Botschaft behandelt das Dokument, oder ein Abschnitt der Botschaft erläutert einen einzelnen Artikel.'},
  genehmigt: {name: 'Bundesbeschluss genehmigt', von: 'Genehmigung', nach: 'Genehmigtes Dokument',
    regel: 'Art. 1 eines Bundesbeschlusses genehmigt ein Abkommen oder Protokoll.'},
  eu: {name: 'Gleicher EU-Rechtsakt', von: 'Dokument 1', nach: 'Dokument 2',
    regel: 'Zwei Dokumente nennen denselben EU-Rechtsakt; der Bogen verbindet die erste Nennung in jedem Dokument (ohne Botschaft).'},
};
const bzAktiv = Object.fromEntries(Object.keys(BZ_TYPEN).map(k => [k, true]));
let BZ, POS, docPos, BZ_TOTAL, bzJeDoc, bzSel = null, bzHover = null, bzHoverDoc = null;
let bzW, bzH, bzHo, bzHu, bzY, bzX, bzXZ, bzZoom, bzSvg, bzGDocs, bzGTrenn, bzGLab, bzGB, bzGHit, bzOSvg, bzBrush;
const BZ_ML = 4, BZ_MR = 4, BZ_BALKEN = 26;
function bzDaten() {
  POS = new Map(); docPos = new Map(); BZ_TOTAL = 0;
  const jeDoc = d3.group(Z.map((z, i) => i), i => Z[i].d);
  D.docs.forEach(d => { const a = BZ_TOTAL; (jeDoc.get(d.nr) || []).forEach(i => { const w = Math.max(Z[i].w, 1); POS.set(i, [BZ_TOTAL, w]); BZ_TOTAL += w; }); docPos.set(d.nr, [a, BZ_TOTAL - a]); });
  const ende = r => { if (typeof r === 'number') { const p = POS.get(r); return {art: 'zettel', doc: Z[r].d, i: r, pos: p[0] + p[1] / 2}; }
    const nr = refDoc(r), p = docPos.get(nr); return {art: 'dok', doc: nr, pos: p[0] + p[1] / 2}; };
  const farbe = (t, A, B) => { const ga = docById.get(A.doc).gruppe, gb = docById.get(B.doc).gruppe; if (t === 'intern') return ga;
    const g = [ga, gb].filter(x => !['botschaft', 'begleit'].includes(x)); if (!g.length) return 'botschaft'; return g.every(x => x === g[0]) ? g[0] : 'neutral'; };
  BZ = [];
  K.forEach(k => {
    let t;
    if (k.art === 'verweist_auf') t = refDoc(k.von) === refDoc(k.nach) ? 'intern' : 'zwischen';
    else if (k.art === 'erlaeutert' || k.art === 'genehmigt') t = k.art;
    else return;
    const A = ende(k.von), B = ende(k.nach);
    BZ.push({t, k, A, B});
  });
  D.eu_paare.forEach(([c, a, b]) => BZ.push({t: 'eu', k: {stelle: c, celex: c}, A: ende(a), B: ende(b)}));
  BZ = BZ.map((b, i) => ({...b, i, x0: Math.min(b.A.pos, b.B.pos), x1: Math.max(b.A.pos, b.B.pos), oben: BZ_TYPEN[b.t].oben, g: farbe(b.t, b.A, b.B)})).filter(b => b.x1 - b.x0 > 0.5);
  bzJeDoc = new Map(); BZ.forEach(b => { bzJeDoc.set(b.A.doc, (bzJeDoc.get(b.A.doc) || 0) + 1); if (b.B.doc !== b.A.doc) bzJeDoc.set(b.B.doc, (bzJeDoc.get(b.B.doc) || 0) + 1); });
  const zahl = d3.rollup(BZ, v => v.length, b => b.t);
  $('#bz-chips').innerHTML = Object.entries(BZ_TYPEN).map(([k, t]) => `<button data-typ="${k}" aria-pressed="${bzAktiv[k]}">${esc(t.name)} <b>${fmt(zahl.get(k) || 0)}</b></button>`).join('');
  $('#bz-chips').onclick = ev => { const b = ev.target.closest('button'); if (!b) return; const k = b.dataset.typ; bzAktiv[k] = !bzAktiv[k]; b.setAttribute('aria-pressed', bzAktiv[k]); bzBoegen(); };
  $('#bz-legende').innerHTML = D.gruppen.map(g => `<li><i style="background:${gVar(g.id)}"></i>${esc(g.name)}</li>`).join('') +
    `<li><svg width="26" height="12" viewBox="0 0 26 12" aria-hidden="true"><path d="M2,11 A11,9 0 0 1 24,11" fill="none" stroke="var(--c-neutral)" stroke-width="1.6"/></svg>Bogen zwischen zwei Vorlagen</li>`;
}
function bzAufbauen() {
  if (!BZ) bzDaten();
  const host = d3.select('#bz-diagramm'), oHost = d3.select('#bz-uebersicht');
  bzW = Math.max(host.node().clientWidth, 320);
  const schmal = bzW < 640;
  bzHo = schmal ? 100 : 150; bzHu = schmal ? 220 : 330;
  bzY = bzHo + 26; bzH = bzY + BZ_BALKEN + bzHu + 24;
  bzX = d3.scaleLinear([0, BZ_TOTAL], [BZ_ML, bzW - BZ_MR]); bzXZ = bzX;
  host.selectAll('*').remove(); oHost.selectAll('*').remove();
  bzSvg = host.append('svg').attr('viewBox', `0 0 ${bzW} ${bzH}`).attr('height', bzH).attr('role', 'img')
    .attr('aria-label', `Bogendiagramm: ${D.docs.length} Dokumente auf einer Linie, ${BZ.length} Bögen`);
  bzSvg.append('defs').append('clipPath').attr('id', 'bz-clip').append('rect').attr('x', BZ_ML).attr('y', 0).attr('width', bzW - BZ_ML - BZ_MR).attr('height', bzH);
  const g = bzSvg.append('g').attr('clip-path', 'url(#bz-clip)');
  g.append('rect').attr('width', bzW).attr('height', bzH).attr('fill', 'transparent');
  bzGB = g.append('g').attr('fill', 'none'); bzGHit = g.append('g').attr('fill', 'none');
  bzGDocs = g.append('g'); bzGTrenn = g.append('path').attr('stroke', 'var(--grund)').attr('stroke-width', 1); bzGLab = g.append('g');
  bzSvg.append('text').attr('class', 'bz-seit').attr('x', BZ_ML + 4).attr('y', 15).text('oben: Artikelverweise im selben Dokument');
  bzSvg.append('text').attr('class', 'bz-seit').attr('x', BZ_ML + 4).attr('y', bzH - 6).text('unten: Bezüge zwischen Dokumenten');
  bzGB.selectAll('path').data(BZ, b => b.i).join('path').attr('stroke', b => gVar(b.g)).attr('stroke-linecap', 'round');
  bzGHit.selectAll('path').data(BZ, b => b.i).join('path').attr('stroke', 'transparent').attr('stroke-width', 10).style('pointer-events', 'stroke').style('cursor', 'pointer')
    .on('pointerenter pointermove', (ev, b) => { bzHover = b; bzFaerben(); showTip(ev, bzTipp(b)); })
    .on('pointerleave', () => { bzHover = null; bzFaerben(); hideTip(); })
    .on('click', (ev, b) => { hideTip(); bzSel = b; bzFaerben(); zeigeBogen(b); });
  bzGDocs.selectAll('rect').data(D.docs, d => d.nr).join('rect').attr('y', bzY).attr('height', BZ_BALKEN).attr('rx', 3).style('cursor', 'pointer')
    .attr('fill', d => tint(d.gruppe, 72))
    .on('pointerenter pointermove', (ev, d) => { bzHoverDoc = d.nr; bzFaerben(); showTip(ev, `<b>${esc(d.kurz)}</b><span>BBl 2026 ${d.nr} · ${esc(gName[d.gruppe])}</span><br>${fmt(docPos.get(d.nr)[1])} Wörter · ${fmt(bzJeDoc.get(d.nr) || 0)} Bögen<br><span>Klick: Dokument vergrössern</span>`); })
    .on('pointerleave', () => { bzHoverDoc = null; bzFaerben(); hideTip(); })
    .on('click', (ev, d) => bzZoomDoc(d.nr));
  bzZoom = d3.zoom().scaleExtent([1, 1500]).extent([[BZ_ML, 0], [bzW - BZ_MR, bzH]]).translateExtent([[BZ_ML, 0], [bzW - BZ_MR, bzH]])
    .on('zoom', ev => { bzXZ = ev.transform.rescaleX(bzX); bzZeichne(); if (ev.sourceEvent) bzRahmen(); });
  bzSvg.call(bzZoom).on('dblclick.zoom', null);
  const OH = 38;
  bzOSvg = oHost.append('svg').attr('viewBox', `0 0 ${bzW} ${OH}`).attr('height', OH).attr('aria-label', 'Übersicht mit Ausschnittsrahmen');
  bzOSvg.append('g').selectAll('rect').data(D.docs).join('rect').attr('x', d => bzX(docPos.get(d.nr)[0]))
    .attr('width', d => Math.max(0.6, bzX(docPos.get(d.nr)[0] + docPos.get(d.nr)[1]) - bzX(docPos.get(d.nr)[0]) - 0.6)).attr('y', 8).attr('height', 22).attr('fill', d => tint(d.gruppe, 72));
  bzBrush = d3.brushX().extent([[BZ_ML, 2], [bzW - BZ_MR, OH - 2]]).on('brush end', ev => {
    if (!ev.sourceEvent) return;
    const s = ev.selection || [BZ_ML, bzW - BZ_MR], k = (bzW - BZ_MR - BZ_ML) / Math.max(1, s[1] - s[0]);
    bzSvg.call(bzZoom.transform, d3.zoomIdentity.translate(BZ_ML - k * s[0], 0).scale(k));
  });
  bzOSvg.append('g').attr('class', 'bz-rahmen').call(bzBrush).call(bzBrush.move, [BZ_ML, bzW - BZ_MR]);
  bzOSvg.select('.bz-rahmen .selection').attr('fill', 'var(--text)').attr('fill-opacity', .08).attr('stroke', 'var(--text)').attr('stroke-width', 1.5);
  bzZeichne();
}
function bzRahmen() { const t = d3.zoomTransform(bzSvg.node()); bzOSvg.select('.bz-rahmen').call(bzBrush.move, [(BZ_ML - t.x) / t.k, (bzW - BZ_MR - t.x) / t.k]); }
function bzZeichne() {
  bzGDocs.selectAll('rect').attr('x', d => bzXZ(docPos.get(d.nr)[0])).attr('width', d => { const p = docPos.get(d.nr); return Math.max(0.5, bzXZ(p[0] + p[1]) - bzXZ(p[0]) - 1); });
  let p = '';
  for (const [, [s, w]] of POS) { if (s === 0) continue; const a = bzXZ(s); if (a < BZ_ML || a > bzW - BZ_MR) continue; if (bzXZ(s + w) - a >= 4) p += `M${a.toFixed(1)},${bzY + 3}V${bzY + BZ_BALKEN - 3}`; }
  bzGTrenn.attr('d', p);
  const lab = D.docs.map(d => { const [s, w] = docPos.get(d.nr), a = Math.max(bzXZ(s), BZ_ML), b = Math.min(bzXZ(s + w), bzW - BZ_MR); return {d, a, w: b - a}; }).filter(o => o.w > 0);
  bzGLab.selectAll('text').data(lab, o => o.d.nr).join('text').attr('class', 'bz-doclabel').attr('y', bzY + BZ_BALKEN / 2 + 4.5).attr('x', o => o.a + 6)
    .text(o => { const max = Math.floor((o.w - 12) / 7.6); return max < 3 ? '' : kuerze(o.d.kurz, max); });
  bzBoegen();
  const t = d3.zoomTransform(bzSvg.node());
  $('#bz-stand').textContent = t.k > 1.01 ? `${fmt(bzXZ.invert(bzW - BZ_MR) - bzXZ.invert(BZ_ML))} von ${fmt(BZ_TOTAL)} Wörtern sichtbar` : '';
}
function bzPfad(b) {
  const x1 = bzXZ(b.x0), x2 = bzXZ(b.x1);
  if (x2 < BZ_ML - 2 || x1 > bzW - BZ_MR + 2) return null;
  const rx = (x2 - x1) / 2; if (rx < 0.4) return null;
  const Hs = b.oben ? bzHo : bzHu, ry = Hs * rx / (rx + Hs);
  const y = b.oben ? bzY - 2 : bzY + BZ_BALKEN + 2;
  return `M${x1.toFixed(1)},${y}A${rx.toFixed(1)},${ry.toFixed(1)} 0 0 ${b.oben ? 1 : 0} ${x2.toFixed(1)},${y}`;
}
function bzBoegen() {
  if (!bzSvg) return;
  const ds = new Map(BZ.map(b => [b.i, bzAktiv[b.t] ? bzPfad(b) : null]));
  [bzGB, bzGHit].forEach(g => g.selectAll('path').attr('d', b => ds.get(b.i)).attr('display', b => ds.get(b.i) ? null : 'none'));
  bzFaerben();
}
function bzFaerben() {
  if (!bzSvg) return;
  let f = null;
  if (bzHoverDoc !== null) f = b => b.A.doc === bzHoverDoc || b.B.doc === bzHoverDoc;
  else if (bzHover) f = b => b.i === bzHover.i || (bzSel && b.i === bzSel.i);
  else if (bzSel) f = b => b.i === bzSel.i;
  else if (gewaehlt !== null && !listeOffen && BZ.some(b => b.A.i === gewaehlt || b.B.i === gewaehlt)) f = b => b.A.i === gewaehlt || b.B.i === gewaehlt;
  const stark = b => b.t === 'genehmigt' || b.t === 'zwischen';
  // Auswahl (Ziffer 5.4): Bögen mit einem markierten Ende mittelkräftig, die übrigen fast ausgeblendet
  const mittel = treffer ? b => treffer.has(b.A.i) || treffer.has(b.B.i) : null;
  bzGB.selectAll('path').attr('stroke-opacity', b => f && f(b) ? .95 : mittel ? (mittel(b) ? .55 : .03) : f ? .05 : (stark(b) ? .7 : .3))
    .attr('stroke-width', b => f && f(b) ? 2.2 : mittel && mittel(b) ? 1.4 : (stark(b) && !f && !mittel ? 1.5 : 1));
  if (mittel) bzGB.selectAll('path').filter(mittel).raise();
  if (f) bzGB.selectAll('path').filter(f).raise();
  const tDocs = treffer ? new Set([...treffer].map(i => Z[i].d)) : null;
  bzGDocs.selectAll('rect').attr('opacity', d => !tDocs || tDocs.has(d.nr) ? 1 : 0.35);
}
function bzEndeName(e) { return e.art === 'dok' ? docById.get(e.doc).kurz + ' (ganzes Dokument)' : docById.get(e.doc).kurz + ', ' + Z[e.i].l; }
function bzTipp(b) {
  const eu = b.t === 'eu' ? `<br><span>${esc(b.k.celex)} ${esc(kuerze(D.eu[b.k.celex] || '', 90))}</span>` : '';
  return `<b>${esc(BZ_TYPEN[b.t].name)}</b>${esc(bzEndeName(b.A))}<br>${b.t === 'eu' ? '↔' : '→'} ${esc(bzEndeName(b.B))}${eu}<br><span>Klick: beide Enden mit Fundstelle anzeigen</span>`;
}
function bzZoomDoc(nr) {
  if (!bzSvg) return;
  const [s, w] = docPos.get(nr), pad = w * 0.04, s0 = bzX(Math.max(0, s - pad)), s1 = bzX(Math.min(BZ_TOTAL, s + w + pad));
  const k = Math.min(1500, (bzW - BZ_MR - BZ_ML) / Math.max(1, s1 - s0));
  bzSvg.transition().duration(ruhig() ? 0 : 600).call(bzZoom.transform, d3.zoomIdentity.translate(BZ_ML - k * s0, 0).scale(k)).on('end', bzRahmen);
}
$('#bz-plus').onclick = () => bzSvg && bzSvg.transition().duration(250).call(bzZoom.scaleBy, 2).on('end', bzRahmen);
$('#bz-minus').onclick = () => bzSvg && bzSvg.transition().duration(250).call(bzZoom.scaleBy, .5).on('end', bzRahmen);
$('#bz-alles').onclick = () => bzSvg && bzSvg.transition().duration(400).call(bzZoom.transform, d3.zoomIdentity).on('end', bzRahmen);
function endeHtml(e, rolle, stelle) {
  const d = docById.get(e.doc);
  let titel, ort, knoepfe;
  if (e.art === 'zettel') {
    const z = Z[e.i]; titel = z.l; ort = ortVon(z);
    knoepfe = `<button class="knopf" data-oeffne="${e.i}">Zettel öffnen</button><button class="knopf" data-umfang="${e.i}">Im Umfang zeigen</button>`;
  } else { titel = d.kurz; ort = `${esc(gName[d.gruppe])} › ganzes Dokument`; knoepfe = `<button class="knopf" data-doc="${d.nr}">Dokument im Umfang zeigen</button>`; }
  const st = stelle ? `<div class="stelle">«${esc(kuerze(stelle.replace(/\s+/g, ' '), 300))}»</div>` : (e.art === 'dok' ? `<div class="stelle">${esc(d.titel)}</div>` : '');
  return `<div class="ende"><div class="rolle">${esc(rolle)}</div><div class="ort"><span class="punkt" style="background:${gVar(d.gruppe)}"></span>${ort} · BBl 2026 ${d.nr}</div>
    <div class="titel">${esc(titel)}</div>${st}<div class="knoepfe">${knoepfe}<a href="${esc(e.art === 'zettel' && Z[e.i].s.length ? pdfLink(d, Z[e.i].s[0]) : d.eli)}" target="_blank" rel="noopener">PDF</a></div></div>`;
}
function zeigeBogen(b) {
  const T = BZ_TYPEN[b.t];
  const eu = b.t === 'eu' ? `<div class="meta">EU-Rechtsakt: <a href="https://eur-lex.europa.eu/legal-content/DE/TXT/?uri=CELEX:${encodeURIComponent(b.k.celex)}" target="_blank" rel="noopener">${esc(b.k.celex)}</a> ${esc(kuerze(D.eu[b.k.celex] || '', 160))}</div>` : '';
  zEl.innerHTML = `<div class="bogenkarte">
    <div><div class="ort">Bogen <span class="marke">Rohextraktion</span></div><h3>${esc(T.name)}</h3><p class="regel">${esc(T.regel)}${b.k.regel ? ' Regel: ' + esc(b.k.regel) + '.' : ''}</p></div>
    ${eu}
    ${endeHtml(b.A, T.von, b.t === 'eu' ? '' : b.k.stelle)}
    <div class="pfeil" aria-hidden="true">${b.t === 'eu' ? '↕' : '↓'}</div>
    ${endeHtml(b.B, T.nach, '')}
  </div>`;
  zEl.querySelectorAll('button[data-oeffne]').forEach(x => x.onclick = () => waehle(+x.dataset.oeffne, false, b));
  zEl.querySelectorAll('button[data-umfang]').forEach(x => x.onclick = () => waehle(+x.dataset.umfang, true));
  zEl.querySelectorAll('button[data-doc]').forEach(x => x.onclick = () => fokusAufDoc(+x.dataset.doc));
  if (innerWidth < 1280) zEl.scrollIntoView({behavior: ruhig() ? 'auto' : 'smooth', block: 'start'});
}

/* ---------- Schnittstelle für die Grafiken (seite/grafik.js) ---------- */
function auswahlText() {             // Beschreibung der Auswahl für die Zeile «Markiert» in der Grafik
  if (!treffer) return '';
  const t = [];
  if (filt.thema) t.push(`Thema «${filt.thema.name}» (Begriffe im Wortlaut)`);
  if (filt.art) t.push(`Textart ${TEXTART[filt.art].name}`);
  if (filt.reich) t.push(`verknüpft mit ${docById.get(Z[filt.reich.i].d).kurz}, ${Z[filt.reich.i].l} (${filt.reich.schritte === 1 ? 'direkt' : 'bis zwei Schritte'})`);
  if (filt.such) t.push(`Suchwort «${suchText}»`);
  return `${t.join(', ')}: ${fmt(treffer.size)} Zettel`;
}
window.VS = {
  get D() { return D; }, get Z() { return Z; }, get K() { return K; }, get aus() { return aus; }, get ein() { return ein; },
  get docById() { return docById; }, get gName() { return gName; }, get T() { return T; }, get euNennung() { return euNennung; },
  get gewaehlt() { return gewaehlt; }, get treffer() { return treffer; }, get filt() { return filt; }, get suchText() { return suchText; },
  get root() { return root; }, get fokus() { return fokus || root; }, get aktiv() { return aktiv; }, get listeOffen() { return listeOffen; },
  get mxModus() { return mxModus; }, get mxDarst() { return mxDarst; }, get nzStufe() { return nzStufe; }, get nzDoc() { return nzDoc; },
  get ufArt() { return ufArt; }, get bzAktiv() { return bzAktiv; },
  bzSicht: () => (bzSvg && bzXZ ? [bzXZ.invert(BZ_ML), bzXZ.invert(bzW - BZ_MR)] : null),
  bz: () => { if (!BZ) bzDaten(); return {BZ, POS, docPos, BZ_TOTAL, BZ_TYPEN}; },
  matrixWerte, netzDaten, netzLage, umfeldDaten, UF_GRUPPEN, reichweite, graphDaten, SEKTOR, MAX_JE_SEKTOR,
  refDoc, refName, gesetzName, kurzLabel, artVon, TEXTART, MASS_NAME, GRUPPE_KURZ, ladeText, srName, auswahlText,
  fmt, pct, kuerze, hideTip,
};

/* ---------- Reiter ---------- */
const REITER = ['umfang', 'verkn', 'bezuege', 'umsetz', 'tabelle'];
const gezeichnet = {};
let aktiv = null;
function reiterAufbauen() {
  REITER.forEach(r => $('#tab-' + r).onclick = () => zeigeReiter(r));
  $('[role=tablist]').addEventListener('keydown', ev => {
    if (!['ArrowRight', 'ArrowLeft'].includes(ev.key)) return;
    const i = REITER.indexOf(aktiv), k = REITER[(i + (ev.key === 'ArrowRight' ? 1 : REITER.length - 1)) % REITER.length];
    zeigeReiter(k); $('#tab-' + k).focus();
  });
}
function zeichneAnsicht(k) {
  if (k === 'verkn') { $('#mx-detail').innerHTML = ''; zeichneVerkn(); }
  if (k === 'umsetz') zeichneSankey();
  if (k === 'tabelle') zeichneTabelle();
  gezeichnet[k] = true;
}
function zeigeReiter(k) {
  aktiv = k;
  REITER.forEach(r => { $('#tab-' + r).setAttribute('aria-selected', r === k); $('#v-' + r).hidden = r !== k; });
  if (['verkn', 'umsetz', 'tabelle'].includes(k) && !gezeichnet[k]) zeichneAnsicht(k);
  if (k === 'bezuege' && !gezeichnet.bezuege) { bzAufbauen(); gezeichnet.bezuege = true; }
  if (k === 'umfang') zeichneUmfang(false);
  try { localStorage.setItem('vs-reiter', k); } catch (e) { /* */ }
}
function neuZeichnen() {
  if (aktiv === 'umfang') zeichneUmfang(false);
  if (gezeichnet.umsetz) zeichneSankey();
  if (gezeichnet.verkn && mxDarst === 'netz') { if (aktiv === 'verkn') zeichneNetz(); else gezeichnet.verkn = false; }
  if (gezeichnet.bezuege) { if (aktiv === 'bezuege') bzAufbauen(); else { gezeichnet.bezuege = false; bzSvg = null; } }
}
})();
