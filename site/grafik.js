/* Vertragsspiegel: Grafiken für Social Media, Präsentation und Bericht.
   Aufbau wie im Finanzspiegel (politspiegel/finanzspiegel/grafik.js): Knopf unten rechts, Dialog mit Motiv,
   Format, Hintergrund und Titel, Vorschau im Canvas, PNG oder Zwischenablage.
   Formate: Social Media 4:5 (1080 × 1350), Präsentation 16:9 (1920 × 1080), Bericht 3:2 (1800 × 1200).
   Grundsätze (Projektbrief Ziffer 6 und 5.5):
   1. Die Grafik zeigt die gewählte Ansicht samt Auswahl und rechnet nichts Eigenes; Daten und Zählungen
      kommen aus app.js (window.VS).
   2. Farbe nur nach Vorlage, Grösse nur nach Wörtern, Reihenfolge nach Paket.
   3. Ein eigener Titel ist erlaubt; die Zeile «Gezeigt» darunter beschreibt immer, was die Grafik zeigt,
      und lässt sich nicht ändern. Quelle, Stand und «Rohextraktion» stehen in jeder Grafik.
   4. Die Wortlautkarte zeigt nur ganze Absätze oder den ganzen Artikel. Passt der Text nicht, wird er nicht gekürzt. */
(function () {
'use strict';
const V = () => window.VS;
const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]));

const FORMATE = {
  hoch: {w: 1080, h: 1350, t: 'Social Media 4:5', m: '1080 × 1350 Pixel'},
  folie: {w: 1920, h: 1080, t: 'Präsentation 16:9', m: '1920 × 1080 Pixel'},
  bericht: {w: 1800, h: 1200, t: 'Bericht 3:2', m: '1800 × 1200 Pixel'},
};
const MOTIVE = [
  ['zahlen', 'Paket in Zahlen'],
  ['umfang', 'Umfang: Gliederung nach Wörtern'],
  ['umfeld', 'Umfeld des geöffneten Zettels'],
  ['netz', 'Netz: Vorlagen, Dokumente, Artikel oder Zettel'],
  ['matrix', 'Matrix der Verknüpfungen'],
  ['bezuege', 'Bezüge auf einer Linie'],
  ['umsetzung', 'Umsetzung: Abkommen, Bundesbeschlüsse, Gesetze'],
  ['thema', 'Thema in Zahlen'],
  ['wortlaut', 'Wortlaut des geöffneten Zettels'],
];
const NOTIZ = {
  zahlen: 'Umfang und Verweise der 30 Dokumente BBl 2026 615–644 mit dem Anteil jeder Vorlage an den Wörtern.',
  umfang: 'Der Ausschnitt, der unter «Umfang» gewählt ist, mit drei Ebenen darunter. Eine Auswahl unter «Finden» ist markiert.',
  umfeld: 'Bezüge des geöffneten Zettels nach Art, mit Reichweite. Querformat: links eingehend, rechts ausgehend.',
  netz: 'Knoten auf einem Kreis in Paketreihenfolge, Fläche = Wörter, Linienbreite = Anzahl Bezüge. Stufe «Zettel» zeigt das Umfeld als Netz.',
  matrix: 'Dokument × Dokument mit dem gewählten Mass, in festen Klassen wie auf der Seite.',
  bezuege: 'Alle Zettel auf einer Linie, Länge = Wörter, mit den eingeblendeten Bogenarten und dem Ausschnitt der Seite. Im Hochformat senkrecht.',
  umsetzung: 'Abkommen, genehmigende Bundesbeschlüsse und die Bundesgesetze in ihren Anhängen; wahlweise ein Bundesbeschluss.',
  thema: 'Zettel und Fundstellen eines Themas nach Textart und Dokument, in Paketreihenfolge, mit den Begriffen.',
  wortlaut: 'Ganzer Artikel oder ein ganzer Absatz, ohne Kürzung, mit Fundstelle.',
};
const G = {motiv: 'zahlen', format: 'hoch', hg: 'weiss', titel: '', autoTitel: '', stufe: 'dokumente', mass: 'verweise', doc: 616,
  darst: 'gliederung', thema: '', auszug: 'alle', bb: 'alle', opener: null};

const FARBE = {botschaft: '#7d8794', stab: '#eb6834', strom: '#2a78d6', lms: '#eda100', ges: '#e87ba4', weitere: '#b4bcc6', begleit: '#98a2ae', neutral: '#5A626D', gesetz: '#5A626D'};
const TINTE = '#12161C', TINTE2 = '#3F4752', TINTE3 = '#5A626D', LINIE = '#E2E6EB', LINIE2 = '#C9CFD6', FLAECHE = '#F7F8FA';
const SEQ = ['#F1F3F6', '#D6DCE4', '#AEB8C5', '#7F8C9C', '#525E6E', '#2B3440'];
const TF = 'Archivo, "Helvetica Neue", Arial, sans-serif', TT = '"Public Sans", "Helvetica Neue", Arial, sans-serif';
const fmt = n => V().fmt(n);

/* ---------- Hilfen für Text und Formen (wie im Finanzspiegel) ---------- */
function farbe(g) { return FARBE[g] || FARBE.neutral; }
function mischen(hex, p) {            // p % Farbe, Rest Weiss
  const h = hex.replace('#', ''), c = [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16));
  return '#' + c.map(v => Math.round(255 + (v - 255) * p / 100).toString(16).padStart(2, '0')).join('');
}
function schrift(x, gewicht, px, fam) { x.font = `${gewicht} ${Math.round(px * 10) / 10}px ${fam || TT}`; }
function abstand(x, px) { if ('letterSpacing' in x) x.letterSpacing = px + 'px'; }
function kuerzen(x, t, breite) {
  t = String(t);
  if (x.measureText(t).width <= breite) return t;
  let lo = 0, hi = t.length;
  while (lo < hi) { const m = Math.ceil((lo + hi) / 2); if (x.measureText(t.slice(0, m).trimEnd() + '…').width <= breite) lo = m; else hi = m - 1; }
  return t.slice(0, lo).trimEnd() + '…';
}
function umbruch(x, text, breite) {
  const w = String(text).split(/\s+/).filter(Boolean), out = []; let z = '';
  for (const t of w) { const p = z ? z + ' ' + t : t; if (x.measureText(p).width > breite && z) { out.push(z); z = t; } else z = p; }
  if (z) out.push(z); return out;
}
function zeilen(x, text, breite, n) {
  const z = umbruch(x, text, breite);
  if (z.length <= n) return z.map(t => kuerzen(x, t, breite));
  const out = z.slice(0, n - 1).map(t => kuerzen(x, t, breite)); out.push(kuerzen(x, z.slice(n - 1).join(' '), breite)); return out;
}
function text(x, t, px, py, o) {
  o = o || {};
  schrift(x, o.w || 400, o.s || 20, o.f);
  x.fillStyle = o.c || TINTE; x.textAlign = o.a || 'left'; x.textBaseline = o.b || 'alphabetic';
  const txt = o.max ? kuerzen(x, String(t), o.max) : String(t);
  if (txt === '…') { x.textAlign = 'left'; x.textBaseline = 'alphabetic'; return 0; }      // kein Platz: nichts zeichnen
  x.fillText(txt, px, py);
  const breite = x.measureText(txt).width;
  x.textAlign = 'left'; x.textBaseline = 'alphabetic';
  return breite;
}
function rundRechteck(x, rx, ry, w, h, r) {
  r = Math.max(0, Math.min(r, w / 2, h / 2));
  x.beginPath(); x.moveTo(rx + r, ry); x.lineTo(rx + w - r, ry); x.quadraticCurveTo(rx + w, ry, rx + w, ry + r); x.lineTo(rx + w, ry + h - r);
  x.quadraticCurveTo(rx + w, ry + h, rx + w - r, ry + h); x.lineTo(rx + r, ry + h); x.quadraticCurveTo(rx, ry + h, rx, ry + h - r); x.lineTo(rx, ry + r);
  x.quadraticCurveTo(rx, ry, rx + r, ry); x.closePath();
}
function pfeil(x, px, py, winkel, gr, c) {
  x.save(); x.translate(px, py); x.rotate(winkel); x.fillStyle = c;
  x.beginPath(); x.moveTo(0, 0); x.lineTo(-gr, -gr * 0.55); x.lineTo(-gr, gr * 0.55); x.closePath(); x.fill(); x.restore();
}
function form(x, typ, px, py, r, fuell, rand, lw) {      // Kreis Zettel, Quadrat Dokument, Raute EU-Rechtsakt, Dreieck SR-Erlass
  x.beginPath();
  if (typ === 'dok') x.rect(px - r, py - r, 2 * r, 2 * r);
  else if (typ === 'eu') { x.moveTo(px, py - r * 1.15); x.lineTo(px + r * 1.15, py); x.lineTo(px, py + r * 1.15); x.lineTo(px - r * 1.15, py); x.closePath(); }
  else if (typ === 'sr') { x.moveTo(px, py - r * 1.1); x.lineTo(px + r * 1.1, py + r * 0.9); x.lineTo(px - r * 1.1, py + r * 0.9); x.closePath(); }
  else x.arc(px, py, r, 0, 2 * Math.PI);
  if (fuell) { x.fillStyle = fuell; x.fill(); }
  if (rand) { x.strokeStyle = rand; x.lineWidth = lw || 1.5; x.stroke(); }
}
const standText = () => V().D.stand.split('-').reverse().join('.');

/* ---------- Rahmen: Marke, Titel, Zeile «Gezeigt», Auswahl, Legende, Quelle und Stand ----------
   o: titel, ueber, gezeigt, markiert (Auswahl anzeigen), legende ([{f, t, form}]), fuss (rechts unten), roh (Rohextraktion) */
function rahmen(x, W, H, o) {
  const u = Math.min(W, H) / 1080, M = Math.round(64 * u), breit = W - 2 * M;
  x.setTransform(1, 0, 0, 1, 0, 0); x.setLineDash([]); x.globalAlpha = 1; x.globalCompositeOperation = 'source-over'; abstand(x, 0);
  if (G.hg === 'weiss') { x.fillStyle = '#FFFFFF'; x.fillRect(0, 0, W, H); } else x.clearRect(0, 0, W, H);
  abstand(x, 1.2 * u); text(x, 'PAKET SCHWEIZ–EU (BILATERALE III)', M, M + 24 * u, {w: 700, s: 27 * u, f: TF});
  abstand(x, 2 * u); text(x, 'VERTRAGSSPIEGEL', M, M + 54 * u, {w: 600, s: 18 * u, c: TINTE3});
  abstand(x, 0);
  x.fillStyle = TINTE; x.fillRect(M, M + 74 * u, W - 2 * M, Math.max(1, 3 * u));
  // seitlich: im Querformat stehen Titel und Erläuterung links, die Grafik erhält die ganze Höhe
  const seitlich = o.seitlich && W > H, kopfB = seitlich ? (W - 2 * M) * 0.3 : W - 2 * M;
  const breitKopf = kopfB;
  let y = M + 74 * u + 58 * u;
  if (o.ueber) { schrift(x, 400, 20 * u); const uz = zeilen(x, o.ueber, breitKopf, seitlich ? 2 : 1); uz.forEach((z, i) => text(x, z, M, y + i * 27 * u, {s: 20 * u, c: TINTE3, max: breitKopf})); y += 29 * u + uz.length * 27 * u; } else y += 12 * u;
  G.autoTitel = o.titel;
  const titelText = G.titel.trim() || o.titel, tz = seitlich ? 4 : 2;
  let ts = 46 * u;
  for (const g of seitlich ? [42, 36, 32] : [46, 40, 34]) { ts = g * u; schrift(x, 700, ts, TF); if (umbruch(x, titelText, breitKopf).length <= tz) break; }
  zeilen(x, titelText, breitKopf, tz).forEach(z => { text(x, z, M, y, {w: 700, s: ts, f: TF, max: breitKopf}); y += ts * 1.15; });
  y += 44 * u - ts * 1.15;
  let unten = y - 22 * u;
  if (o.gezeigt) {
    schrift(x, 400, 21 * u);
    const gz = zeilen(x, 'Gezeigt: ' + o.gezeigt, breitKopf, seitlich ? 12 : o.gezeigtZeilen || 4);
    gz.forEach((z, i) => text(x, z, M, y + i * 28 * u, {s: 21 * u, c: TINTE2, max: breitKopf}));
    unten = y + (gz.length - 1) * 28 * u; y = unten + 36 * u;
  }
  const aus = o.markiert && V().treffer ? V().auswahlText() : '';
  if (aus) {
    schrift(x, 600, 20 * u);
    const mz = zeilen(x, 'Markiert: ' + aus, breitKopf - 28 * u, seitlich ? 4 : 2);
    x.fillStyle = TINTE; x.fillRect(M, y - 15 * u, 16 * u, 16 * u);
    mz.forEach((z, i) => text(x, z, M + 28 * u, y + i * 27 * u, {w: 600, s: 20 * u, max: breitKopf - 28 * u}));
    unten = y + (mz.length - 1) * 27 * u; y = unten + 36 * u;
  }
  if (o.legende && o.legende.length) {
    let lx = M, ly = y;
    schrift(x, 500, 20 * u);
    o.legende.forEach(e => {
      const tw = Math.min(x.measureText(e.t).width, breitKopf - 30 * u);
      if (lx > M && lx + 30 * u + tw > M + breitKopf) { lx = M; ly += 31 * u; }
      if (e.linie) { x.strokeStyle = e.f; x.lineWidth = 3 * u; x.setLineDash(e.strich ? [8 * u, 6 * u] : []); x.beginPath(); x.moveTo(lx, ly - 7 * u); x.lineTo(lx + 22 * u, ly - 7 * u); x.stroke(); x.setLineDash([]); }
      else if (e.form) form(x, e.form, lx + 10 * u, ly - 7 * u, 8 * u, '#FFFFFF', e.f, 2 * u);
      else { x.fillStyle = e.f; x.fillRect(lx, ly - 17 * u, 20 * u, 20 * u); }
      text(x, e.t, lx + 30 * u, ly, {w: 500, s: 20 * u, max: breitKopf - 30 * u});
      lx += 30 * u + tw + 36 * u;
    });
    unten = ly;
  }
  // Fuss: Marke und Hinweis, darunter Quelle und Stand
  const yf = H - M;
  x.fillStyle = LINIE; x.fillRect(M, yf - 58 * u, breit, Math.max(1, 1.5 * u));
  const rechts = o.fuss || (o.roh ? 'Verweise automatisch erkannt (Rohextraktion)' : '');
  const lb = text(x, 'Politspiegel · Vertragsspiegel', M, yf - 30 * u, {w: 700, s: 18 * u});
  if (rechts) text(x, rechts, W - M, yf - 30 * u, {s: 16 * u, c: TINTE3, a: 'right', max: breit - lb - 30 * u});
  schrift(x, 400, 15 * u);
  const st = ` · Stand ${standText()}`, adr = 'michaeljkahler.github.io/vertragsspiegel';
  const quellen = [`Quelle: Bundesblatt, BBl 2026 615–644, Fassung des Bundesrates vom 13. März 2026, und Pa. Iv. 26.425 · ${adr}${st}`,
    `Quelle: BBl 2026 615–644, Fassung des Bundesrates vom 13. März 2026 · ${adr}${st}`, `Quelle: BBl 2026 615–644 · ${adr}${st}`];
  text(x, quellen.find(t => x.measureText(t).width <= breit) || quellen[2], M, yf - 4 * u, {s: 15 * u, c: TINTE3, max: breit});
  if (seitlich) return {x0: M + kopfB + 56 * u, x1: W - M, y0: M + 74 * u + 40 * u, y1: yf - 84 * u, u, W, H, M, seitlich: true};
  return {x0: M, x1: W - M, y0: unten + 46 * u, y1: yf - 84 * u, u, W, H, M};
}
function legendeGruppen(ids) {
  const v = V();
  return v.D.gruppen.filter(g => !ids || ids.has(g.id)).map(g => ({f: farbe(g.id), t: v.GRUPPE_KURZ[g.id] || g.name}));
}
function hinweis(x, B, t) {
  schrift(x, 400, 24 * B.u);
  zeilen(x, t, B.x1 - B.x0, 4).forEach((z, i) => text(x, z, B.x0, B.y0 + 30 * B.u + i * 34 * B.u, {s: 24 * B.u, c: TINTE3}));
}

/* ---------- 1. Paket in Zahlen ---------- */
function gZahlen(x, W, H) {
  const v = V(), D = v.D, Z = v.Z, K = v.K, paket = D.docs.filter(d => d.nr >= 615 && d.nr <= 644), inP = i => Z[i].d >= 615 && Z[i].d <= 644;
  const verweise = K.filter(k => k.art === 'verweist_auf' && typeof k.von === 'number' && inP(k.von)).length;
  const eu = new Set(K.filter(k => k.art === 'nennt' && typeof k.von === 'number' && inP(k.von) && typeof k.nach === 'string' && k.nach.startsWith('celex:')).map(k => k.nach)).size;
  const neu = D.gesetze.filter(g => g.neu).length, geaendert = D.gesetze.length - neu;
  const B = rahmen(x, W, H, {titel: 'Das Paket Schweiz–EU in Zahlen', ueber: 'Bilaterale III, Botschaft und Vorlagen des Bundesrates',
    gezeigt: 'Umfang der 30 Dokumente BBl 2026 615–644 ohne Begleitgeschäft, gezählt im Wortlaut ohne Kopf- und Fusszeilen. Verweise und Nennungen von EU-Rechtsakten automatisch erkannt.',
    roh: true});
  const u = B.u, quer = W > H;
  const kacheln = [
    [paket.length, 'Dokumente', 'Botschaft, Abkommen, Protokolle, Beschlüsse'],
    [paket.reduce((s, d) => s + d.seiten, 0), 'Seiten', 'im amtlichen PDF'],
    [paket.reduce((s, d) => s + d.woerter, 0), 'Wörter', 'mit Fussnoten'],
    [Z.filter((z, i) => inP(i)).length, 'Zettel', 'Artikel, Ziffern, Rechtsakte in Anhängen'],
    [verweise, 'Artikelverweise', 'im Wortlaut, auch zwischen Dokumenten'],
    [eu, 'EU-Rechtsakte', 'genannt, mit CELEX-Nummer'],
    [neu + geaendert, 'Bundesgesetze', `${neu} neu, ${geaendert} geändert`],
  ];
  const sp = quer ? 4 : 3, zl = Math.ceil(kacheln.length / sp), kw = (B.x1 - B.x0) / sp;
  const kh = quer ? 178 * u : 186 * u;
  kacheln.forEach(([n, t, s], j) => {
    const cx = B.x0 + (j % sp) * kw, cy = B.y0 + Math.floor(j / sp) * kh;
    x.fillStyle = LINIE; x.fillRect(cx, cy, kw - 24 * u, Math.max(1, 2 * u));
    text(x, fmt(n), cx, cy + 66 * u, {w: 700, s: quer ? 60 * u : 52 * u, f: TF, max: kw - 24 * u});
    text(x, t, cx, cy + 102 * u, {w: 600, s: 24 * u, max: kw - 30 * u});
    schrift(x, 400, 17 * u); zeilen(x, s, kw - 34 * u, 2).forEach((z, i) => text(x, z, cx, cy + 130 * u + i * 23 * u, {s: 17 * u, c: TINTE3}));
  });
  // Wörter nach Vorlage
  let y = B.y0 + zl * kh + 40 * u;
  text(x, 'Wörter nach Vorlage', B.x0, y, {w: 600, s: 24 * u}); y += 22 * u;
  const je = D.gruppen.map(g => ({g: g.id, n: v.GRUPPE_KURZ[g.id] || g.name, w: paket.filter(d => d.gruppe === g.id).reduce((s, d) => s + d.woerter, 0)})).filter(e => e.w);
  const tot = je.reduce((s, e) => s + e.w, 0), bw = B.x1 - B.x0;
  let bx = B.x0;
  je.forEach(e => { const w = bw * e.w / tot; x.fillStyle = farbe(e.g); x.fillRect(bx, y, Math.max(1, w - 2 * u), 34 * u); bx += w; });
  y += 34 * u + 40 * u;
  const lsp = quer ? 3 : 2, lw = bw / lsp;
  je.forEach((e, j) => {
    const lx = B.x0 + (j % lsp) * lw, ly = y + Math.floor(j / lsp) * 32 * u;
    x.fillStyle = farbe(e.g); x.fillRect(lx, ly - 17 * u, 18 * u, 18 * u);
    const pctT = (e.w / tot * 100).toLocaleString('de-CH', {maximumFractionDigits: 1, minimumFractionDigits: 1}) + ' %';
    const tw = text(x, e.n, lx + 28 * u, ly, {w: 500, s: 19 * u, max: lw - 130 * u});
    text(x, pctT, lx + 28 * u + tw + 10 * u, ly, {s: 19 * u, c: TINTE3});
  });
}

/* ---------- 2. Umfang (Icicle) ---------- */
function gUmfang(x, W, H) {
  const v = V(), tr = v.treffer;
  // eigene Kopie der Hierarchie, damit die Seite ihre Lage behält
  const kopie = d3.hierarchy(v.root.data).sum(d => d.value || 0);
  kopie.each(d => { let a = d; while (a.depth > 1) a = a.parent; d.g = d.depth === 0 ? null : a.data.g; });
  const f0 = v.fokus, fokus = kopie.descendants().find(d => d.data === f0.data) || kopie;
  const pfad = fokus.ancestors().reverse().map(a => a.data.name);
  const gruppen = new Set(); fokus.each(d => { if (d.g) gruppen.add(d.g); });
  const B = rahmen(x, W, H, {titel: fokus === kopie ? 'Umfang des Pakets nach Gliederung' : `${fokus.data.name}: Umfang nach Gliederung`,
    ueber: pfad.length > 1 ? pfad.slice(0, -1).join(' › ') : 'Paket Schweiz–EU',
    gezeigt: `Höhe eines Felds = Anzahl Wörter (${fmt(fokus.value)} Wörter im Ausschnitt). Spalten von links: ${fokus === kopie ? 'Paket, Vorlage, Dokument, erste Gliederungsebene' : 'Ausschnitt und drei Ebenen darunter'}.`,
    markiert: true, legende: legendeGruppen(gruppen), fuss: tr ? 'Schwarzer Streifen: Anteil markierter Wörter' : 'Fläche = Wörter'});
  const u = B.u, hh = B.y1 - B.y0, bw = B.x1 - B.x0, GAP = 2 * u;
  d3.partition().size([hh, 1])(kopie);
  kopie.each(d => { d.hitW = 0; });
  if (tr) kopie.leaves().forEach(l => { if (tr.has(l.data.i)) { let a = l; while (a) { a.hitW += l.value; a = a.parent; } } });
  const sp0 = bw * 0.16, spw = (bw - sp0) / 3;
  const knoten = fokus.descendants().filter(d => d.depth - fokus.depth <= 3);
  const gew = v.gewaehlt;
  knoten.forEach(d => {
    const rel = d.depth - fokus.depth;
    const y0 = B.y0 + (d.x0 - fokus.x0) / (fokus.x1 - fokus.x0) * hh, y1 = B.y0 + (d.x1 - fokus.x0) / (fokus.x1 - fokus.x0) * hh;
    const x0 = B.x0 + (rel === 0 ? 0 : sp0 + (rel - 1) * spw), w = (rel === 0 ? sp0 : spw) - GAP, h = y1 - y0 - (y1 - y0 > 3 * u ? GAP : 0);
    if (h < 0.3) return;
    const blatt = d.data.i !== undefined;
    x.globalAlpha = !tr || d.depth === 0 || d.hitW ? 1 : 0.22;
    x.fillStyle = d.depth === 0 ? FLAECHE : mischen(farbe(d.g), blatt ? 34 : d.depth === 1 ? 72 : 52);
    if (h > 6 * u) { rundRechteck(x, x0, y0, w, h, 4 * u); x.fill(); } else x.fillRect(x0, y0, w, Math.max(0.6, h));
    x.globalAlpha = 1;
    if (tr && d.hitW && d.depth > 0) { x.fillStyle = TINTE; x.fillRect(x0 + w - 8 * u, y0 + 1, 6 * u, Math.max(1.5 * u, (h - 2) * d.hitW / d.value)); }
    if (blatt && d.data.i === gew) { x.strokeStyle = TINTE; x.lineWidth = 3 * u; x.strokeRect(x0 + 1.5 * u, y0 + 1.5 * u, w - 3 * u, Math.max(2, h - 3 * u)); }
    if (h >= 26 * u && w > 40 * u) {
      text(x, d.data.name, x0 + 10 * u, y0 + 25 * u, {w: d.depth <= 2 ? 600 : 400, s: 19 * u, max: w - 24 * u});
      if (h >= 50 * u && w > 100 * u) text(x, fmt(d.value) + ' Wörter' + (tr && d.hitW ? ` · ${(d.hitW / d.value * 100).toLocaleString('de-CH', {maximumFractionDigits: 1})} % markiert` : ''), x0 + 10 * u, y0 + 48 * u, {s: 16 * u, c: TINTE2, max: w - 24 * u});
    }
  });
}

/* ---------- 3. Umfeld eines Zettels (Gliederung) ---------- */
// Karten fliessen von links nach rechts und brechen um; gibt die Höhe zurück. Was nicht passt, wird als «+ n weitere» gezählt.
function kartenFluss(x, karten, x0, y0, breite, yMax, u0, zeichnen, k0) {
  const u = u0 * (k0 || 1), s = 18 * u, pad = 12 * u, zh = 25 * u, gap = 8 * u;
  let lx = x0, ly = y0, zeileH = 0, n = 0;
  for (let j = 0; j < karten.length; j++) {
    const k = karten[j];
    schrift(x, 400, s);
    const icon = k.form ? 22 * u : 0, nx = k.n > 1 ? 44 * u : 0;
    const tmax = Math.min(breite, 500 * u) - 2 * pad - icon - nx - 6 * u;
    const zl = zeilen(x, k.t, tmax, 2), unter = k.unter ? zeilen(x, k.unter, tmax, 1) : [];
    const tw = Math.max(...zl.map(z => x.measureText(z).width), ...unter.map(z => x.measureText(z).width * 0.85));
    const kw = Math.min(breite, tw + 2 * pad + icon + nx + 6 * u), kh = pad * 1.4 + zl.length * zh + unter.length * 22 * u;
    if (lx > x0 && lx + kw > x0 + breite) { lx = x0; ly += zeileH + gap; zeileH = 0; }
    if (ly + kh > yMax) {
      if (zeichnen) { const rest = karten.length - j; text(x, `+ ${rest} weitere`, lx, ly + 22 * u, {w: 600, s: 17 * u, c: TINTE3}); }
      return {h: ly + 30 * u - y0, n, voll: false};
    }
    if (zeichnen) {
      x.globalAlpha = k.blass ? 0.45 : 1;
      if (k.g) { x.fillStyle = mischen(farbe(k.g), 16); rundRechteck(x, lx, ly, kw, kh, 6 * u); x.fill(); x.strokeStyle = mischen(farbe(k.g), 55); x.lineWidth = 1.5 * u; x.stroke();
        x.fillStyle = farbe(k.g); x.fillRect(lx, ly + 3 * u, 5 * u, kh - 6 * u); }
      else { x.fillStyle = '#FFFFFF'; rundRechteck(x, lx, ly, kw, kh, 6 * u); x.fill(); x.strokeStyle = LINIE2; x.lineWidth = 1.5 * u; x.stroke(); }
      if (k.form) form(x, k.form, lx + pad + 8 * u, ly + pad * 0.7 + zh * 0.55, 7 * u, TINTE3, null);
      zl.forEach((z, i) => text(x, z, lx + pad + icon, ly + pad * 0.7 + (i + 0.78) * zh, {s, w: i === 0 && k.fett ? 600 : 400}));
      unter.forEach((z, i) => text(x, z, lx + pad + icon, ly + pad * 0.7 + zl.length * zh + (i + 0.75) * 22 * u, {s: 15.5 * u, c: TINTE3}));
      if (nx) text(x, '×' + k.n, lx + kw - pad, ly + pad * 0.7 + 0.78 * zh, {w: 600, s: 16 * u, c: TINTE3, a: 'right'});
      x.globalAlpha = 1;
    }
    lx += kw + gap; zeileH = Math.max(zeileH, kh); n++;
  }
  return {h: ly + zeileH - y0, n, voll: true};
}
function ufKarten(gruppe, i) {
  const v = V(), Z = v.Z, z = Z[i], tr = v.treffer;
  return gruppe.items.map(e => {
    const r = e.ref, n = e.kanten.length;
    if (typeof r === 'number') { const d = v.docById.get(Z[r].d), gleich = Z[r].d === z.d;
      return {t: (gleich ? '' : d.kurz + ', ') + Z[r].l, g: d.gruppe, n, blass: tr && !tr.has(r), unter: e.ganz ? `${gruppe.key === 'gen_ein' ? 'genehmigt' : 'erläutert'} das ganze Dokument` : ''}; }
    if (r.startsWith('fga/')) { const d = v.docById.get(v.refDoc(r)); return {t: d.kurz + ', ganzes Dokument', g: d.gruppe, n}; }
    if (r.startsWith('celex:')) { const c = r.slice(6), auch = [...(v.euNennung.get(r) || new Map()).keys()].filter(dn => dn !== z.d).map(dn => v.docById.get(dn).kurz);
      return {t: `${c} ${v.kuerze(v.D.eu[c] || '', 70)}`, form: 'eu', n, unter: auch.length ? 'auch genannt in ' + auch.join(', ') : ''}; }
    const sr = r.slice(3); return {t: `SR ${sr}${v.srName(sr) ? ' ' + v.srName(sr) : ''}`, form: 'sr', n};
  });
}
function gUmfeld(x, W, H) {
  const v = V(), i = v.gewaehlt;
  if (G.darst === 'netz') return gNetzZettel(x, W, H);
  const z = v.Z[i], d = v.docById.get(z.d), gruppen = v.umfeldDaten(i), quer = W > H;
  const farbenIds = new Set([d.gruppe]); gruppen.forEach(g => g.items.forEach(e => { if (typeof e.ref === 'number') farbenIds.add(v.docById.get(v.Z[e.ref].d).gruppe); }));
  const B = rahmen(x, W, H, {titel: `${d.kurz}, ${z.l}`, ueber: `Umfeld eines Zettels · ${v.gName[d.gruppe]} › ${d.kurz}`,
    gezeigt: `Bezüge, die im Wortlaut stehen: ${quer ? 'links' : 'oben'}, was auf diesen Text verweist, ${quer ? 'rechts' : 'unten'}, worauf er verweist. Gleiche Ziele zusammengefasst (×n). Gestrichelt: Erläuterung oder Genehmigung.`,
    markiert: true, legende: legendeGruppen(farbenIds), roh: true});
  const u = B.u, ein = gruppen.filter(g => g.r === 'ein'), aus = gruppen.filter(g => g.r === 'aus');
  const {s1, s2} = v.reichweite(i), docs1 = new Set([...s1].map(j => v.Z[j].d)), docs2 = new Set([...s2].map(j => v.Z[j].d));
  const rwText = s1.size ? `Reichweite: ${fmt(s1.size)} Zettel in ${fmt(docs1.size)} ${docs1.size === 1 ? 'Dokument' : 'Dokumenten'} direkt verknüpft${s2.size > s1.size ? `, ${fmt(s2.size)} Zettel in ${fmt(docs2.size)} ${docs2.size === 1 ? 'Dokument' : 'Dokumenten'} direkt oder über einen Zwischenschritt` : ''}. Gezählt: Artikelverweise und Erläuterungen.` : 'Reichweite: Kein Artikelverweis und keine Erläuterung verbindet diesen Zettel mit einem anderen Zettel.';
  const mitte = (mx0, my0, mw, trocken) => {        // Karte des Texts; gibt die Höhe zurück
    schrift(x, 700, 25 * u, TF); const zl = zeilen(x, z.l, mw - 32 * u, 3), mh = 70 * u + zl.length * 31 * u;
    if (trocken) return mh;
    x.fillStyle = mischen(farbe(d.gruppe), 20); rundRechteck(x, mx0, my0, mw, mh, 10 * u); x.fill();
    x.strokeStyle = farbe(d.gruppe); x.lineWidth = 3 * u; x.stroke();
    text(x, `${v.gName[d.gruppe]} › ${d.kurz}`, mx0 + 16 * u, my0 + 30 * u, {s: 16 * u, c: TINTE2, max: mw - 32 * u});
    zl.forEach((t, j) => text(x, t, mx0 + 16 * u, my0 + 62 * u + j * 31 * u, {w: 700, s: 25 * u, f: TF}));
    abstand(x, 1.5 * u); text(x, 'DIESER TEXT', mx0 + 16 * u, my0 + mh - 14 * u, {w: 600, s: 14 * u, c: TINTE3}); abstand(x, 0);
    return mh;
  };
  const linie = (pfad, strich) => { x.strokeStyle = TINTE3; x.lineWidth = 2.5 * u; x.setLineDash(strich ? [9 * u, 6 * u] : []); x.beginPath(); pfad(); x.stroke(); x.setLineDash([]); };
  let K0 = 1;                                     // Massstab der Karten: so gross, dass alle Karten Platz haben
  const KOPF = 32 * u, NACH = 16 * u;
  const gruppeZeichnen = (g, gx, gy, gw, yMax, trocken) => {
    if (!trocken) {
      text(x, g.titel, gx, gy + 20 * u, {w: 700, s: 21 * u, max: gw});
      const fund = g.items.reduce((s, e) => s + e.kanten.length, 0);
      const hz = `${fmt(g.items.length)}${fund > g.items.length ? ' · ' + fmt(fund) + ' Fundstellen' : ''}`;
      schrift(x, 700, 21 * u); const tw = Math.min(gw, x.measureText(g.titel).width);
      text(x, hz, gx + tw + 12 * u, gy + 20 * u, {s: 18 * u, c: TINTE3});
    }
    const r = kartenFluss(x, ufKarten(g, i), gx, gy + KOPF, gw, trocken ? 1e9 : yMax, u, !trocken, K0);
    return KOPF + r.h + NACH;
  };
  const bedarf = (gs, gw) => gs.length ? gs.reduce((s, g) => s + gruppeZeichnen(g, 0, 0, gw, 0, true), 0) : 44 * u;
  const leerText = r => r === 'ein' ? 'Kein anderer Text verweist auf diesen Zettel.' : 'Der Wortlaut enthält keinen erkannten Verweis.';
  // Gruppen eines Bands untereinander; reicht der Platz nicht, erhält jede Gruppe einen Anteil nach Bedarf
  const band = (gs, gx, y0, gw, yMax, r) => {
    if (!gs.length) { text(x, leerText(r), gx, y0 + 22 * u, {s: 19 * u, c: TINTE3, max: gw}); return {ticks: [], y: y0 + 44 * u}; }
    const je = gs.map(g => gruppeZeichnen(g, 0, 0, gw, 0, true)), faktor = Math.min(1, (yMax - y0) / je.reduce((a, b) => a + b, 0));
    let y = y0; const ticks = [];
    gs.forEach((g, k) => { ticks.push({y: y + 13 * u, strich: g.strich}); y += Math.min(gruppeZeichnen(g, gx, y, gw, Math.min(yMax, y + je[k] * faktor), false), je[k] * faktor + 30 * u); });
    return {ticks, y};
  };
  if (quer) {
    const bw = B.x1 - B.x0, mw = bw * 0.21, sw = (bw - mw) / 2 - 60 * u, lx = B.x0, mx0 = B.x0 + sw + 60 * u, rx = mx0 + mw + 60 * u;
    const yTop = B.y0, yMax = B.y1;
    for (K0 = 1; K0 > 0.7 && Math.max(bedarf(ein, sw), bedarf(aus, sw)) > yMax - yTop - 24 * u; K0 -= 0.04);
    text(x, 'WAS VERWEIST AUF DIESEN TEXT?', lx, yTop + 4 * u, {w: 600, s: 16 * u, c: TINTE3});
    text(x, 'WORAUF VERWEIST DIESER TEXT?', rx, yTop + 4 * u, {w: 600, s: 16 * u, c: TINTE3});
    const mh = mitte(0, 0, mw, true), my0 = yTop + Math.max(30 * u, (yMax - yTop) * 0.42 - mh / 2), my = my0 + mh / 2;
    mitte(mx0, my0, mw);
    schrift(x, 400, 18 * u);           // Reichweite unter der Karte des Texts
    zeilen(x, rwText, mw, 5).forEach((t, j) => text(x, t, mx0, my0 + mh + 40 * u + j * 25 * u, {s: 18 * u, c: TINTE2}));
    const seite = (gs, sx, links) => {
      const {ticks} = band(gs, sx, yTop + 24 * u, sw, yMax, links ? 'ein' : 'aus');
      if (!ticks.length) return;
      const sxs = links ? sx + sw + 30 * u : sx - 30 * u;      // Stamm zwischen Spalte und Mitte
      ticks.forEach(t => linie(() => { if (links) { x.moveTo(sx + sw + 8 * u, t.y); x.lineTo(sxs, t.y); } else { x.moveTo(sxs, t.y); x.lineTo(sx - 12 * u, t.y); } }, t.strich));
      if (!links) ticks.forEach(t => pfeil(x, sx - 8 * u, t.y, 0, 12 * u, TINTE3));
      const ys = [...ticks.map(t => t.y), my];
      linie(() => { x.moveTo(sxs, Math.min(...ys)); x.lineTo(sxs, Math.max(...ys)); });
      linie(() => { if (links) { x.moveTo(sxs, my); x.lineTo(mx0 - 10 * u, my); } else { x.moveTo(mx0 + mw + 4 * u, my); x.lineTo(sxs, my); } });
      if (links) pfeil(x, mx0 - 4 * u, my, 0, 14 * u, TINTE3);
    };
    seite(ein, lx, true); seite(aus, rx, false);
    return;
  }
  // Hochformat: oben eingehend, Mitte der Text, unten ausgehend; Stamm links; Reichweite unten
  schrift(x, 500, 19 * u);
  const rwz = zeilen(x, rwText, B.x1 - B.x0, 2), y1 = B.y1 - rwz.length * 26 * u - 18 * u;
  x.fillStyle = LINIE; x.fillRect(B.x0, y1 + 4 * u, B.x1 - B.x0, Math.max(1, 1.5 * u));
  rwz.forEach((t, j) => text(x, t, B.x0, y1 + 34 * u + j * 26 * u, {w: 500, s: 19 * u, c: TINTE2}));
  const X = B.x0 + 10 * u, gx = B.x0 + 34 * u, gw = B.x1 - gx;
  const mh = mitte(0, 0, B.x1 - B.x0, true), platz = y1 - 10 * u - B.y0 - mh - 2 * 20 * u - 28 * u;
  for (K0 = 1; K0 > 0.76 && bedarf(ein, gw) + bedarf(aus, gw) > platz; K0 -= 0.04);
  const bE = bedarf(ein, gw), bA = bedarf(aus, gw), anteil = Math.min(1, platz / (bE + bA));
  let y = B.y0;
  text(x, 'WAS VERWEIST AUF DIESEN TEXT?', gx, y + 4 * u, {w: 600, s: 16 * u, c: TINTE3}); y += 20 * u;
  const e1 = band(ein, gx, y, gw, y + bE * anteil, 'ein'); y = e1.y + 6 * u;
  const my0 = y; mitte(B.x0, y, B.x1 - B.x0); y += mh + 22 * u;
  if (e1.ticks.length) { linie(() => { x.moveTo(X, e1.ticks[0].y); x.lineTo(X, my0 - 12 * u); }); pfeil(x, X, my0 - 3 * u, Math.PI / 2, 13 * u, TINTE3);
    e1.ticks.forEach(t => linie(() => { x.moveTo(X, t.y); x.lineTo(gx - 10 * u, t.y); }, t.strich)); }
  text(x, 'WORAUF VERWEIST DIESER TEXT?', gx, y + 4 * u, {w: 600, s: 16 * u, c: TINTE3}); y += 20 * u;
  const e2 = band(aus, gx, y, gw, y1 - 10 * u, 'aus');
  if (e2.ticks.length) { linie(() => { x.moveTo(X, my0 + mh); x.lineTo(X, e2.ticks[e2.ticks.length - 1].y); });
    e2.ticks.forEach(t => { linie(() => { x.moveTo(X, t.y); x.lineTo(gx - 12 * u, t.y); }, t.strich); pfeil(x, gx - 6 * u, t.y, 0, 12 * u, TINTE3); }); }
}

/* ---------- 4. Netz: Vorlagen, Dokumente, Artikel eines Dokuments; Zettel (radial) ---------- */
function gNetz(x, W, H) {
  if (G.stufe === 'zettel') return gNetzZettel(x, W, H);
  const v = V(), nd = v.netzDaten(G.stufe, G.doc, G.mass), st = G.stufe, wort = st === 'dokument' ? 'Artikelverweise' : v.MASS_NAME[nd.mass];
  const titel = st === 'gruppen' ? `Vorlagen und Botschaft: ${wort}` : st === 'dokumente' ? `Die 33 Dokumente: ${wort}` : `${v.docById.get(G.doc).kurz}: Artikelverweise innerhalb des Dokuments`;
  const gruppen = new Set(nd.knoten.map(k => k.g));
  const B = rahmen(x, W, H, {titel, ueber: 'Netz der Verknüpfungen', seitlich: true,
    gezeigt: `${st === 'dokument' ? 'Artikel, die im Wortlaut aufeinander verweisen' : st === 'gruppen' ? 'Vorlagen, Botschaft und Begleitgeschäft' : '33 Dokumente'} auf einem Kreis in Paketreihenfolge, oben beginnend im Uhrzeigersinn; Kreisfläche = Wörter. Linienbreite = Anzahl ${wort} in beiden Richtungen${st === 'gruppen' && nd.mass !== 'eu' ? '; innerhalb einer Gruppe als «intern»' : ''}. Lage und Abstand tragen keine weitere Bedeutung.`,
    markiert: true, legende: legendeGruppen(gruppen), roh: true});
  const u = B.u, bw = B.x1 - B.x0, bh = B.y1 - B.y0;
  if (!nd.kanten.length) { hinweis(x, B, st === 'dokument' ? 'Keine Artikelverweise innerhalb dieses Dokuments' + (v.treffer ? ' in der Auswahl.' : '.') : 'Keine Bezüge in der Auswahl.'); return; }
  const rand = st === 'dokumente' ? 215 * u : 112 * u, rMax = (st === 'gruppen' ? 62 : st === 'dokumente' ? 30 : 12) * u, labelW = (W > H ? 330 : 230) * u;
  const R = st === 'gruppen' ? Math.max(90 * u, Math.min(bh / 2 - rMax - 60 * u, bw / 2 - rMax - labelW - 14 * u)) : Math.max(80 * u, Math.min(bw, bh) / 2 - rand);
  const cx = B.x0 + bw / 2, cy = B.y0 + bh / 2;
  v.netzLage(nd, cx, cy, R, (st === 'dokument' ? 3.5 : 6) * u, rMax);
  const tr = v.treffer, Z = v.Z;
  const imF = k => !tr || (k.i !== undefined ? tr.has(k.i) : k.doc ? [...tr].some(i => Z[i].d === k.doc) : [...tr].some(i => v.docById.get(Z[i].d).gruppe === k.id));
  x.lineCap = 'round';
  [...nd.kanten].sort((a, b) => a.n - b.n).forEach(e => {
    x.globalAlpha = 0.5; x.strokeStyle = farbe(e.g); x.lineWidth = (1.2 + (st === 'dokument' ? 4 : 14) * e.anteil) * u;
    x.beginPath(); x.moveTo(e.A.x, e.A.y); x.quadraticCurveTo(e.cx, e.cy, e.B.x, e.B.y); x.stroke();
  });
  x.globalAlpha = 1;
  const fs = (st === 'dokument' ? (nd.knoten.length > 90 ? 12 : nd.knoten.length > 50 ? 14 : 16) : st === 'dokumente' ? 17 : 21) * u;
  nd.knoten.forEach(k => {
    x.globalAlpha = imF(k) ? 1 : 0.3;
    form(x, 'zettel', k.x, k.y, k.r, mischen(farbe(k.g), 70), farbe(k.g), 1.8 * u);
    const c = Math.cos(k.winkel), s = Math.sin(k.winkel);
    if (st === 'gruppen') {
      const oben = Math.abs(c) < 0.2, a = oben ? 'center' : c > 0 ? 'left' : 'right';
      const tx = k.x + (oben ? 0 : (c > 0 ? 1 : -1) * (k.r + 12 * u)), ty = k.y + (oben ? (s < 0 ? -k.r - 16 * u : k.r + 30 * u) : 7 * u);
      schrift(x, 600, fs); const zl = zeilen(x, k.name, labelW, 2);
      zl.forEach((t, j) => text(x, t, tx, ty + j * fs * 1.15 - (oben && s < 0 ? (zl.length - 1) * fs * 1.15 : 0), {w: 600, s: fs, a}));
      if (nd.intern.get(k.id)) text(x, `intern ${fmt(nd.intern.get(k.id))}`, tx, ty + zl.length * fs * 1.15 + (oben && s < 0 ? -fs * 2.3 * zl.length : 0), {s: fs * 0.8, c: TINTE3, a});
    } else {
      x.save(); x.translate(k.x, k.y); x.rotate(c < 0 ? k.winkel + Math.PI : k.winkel);
      text(x, k.name, (c < 0 ? -1 : 1) * (k.r + 7 * u), fs * 0.36, {w: st === 'dokumente' ? 500 : 400, s: fs, a: c < 0 ? 'right' : 'left', max: rand - k.r - 14 * u});
      x.restore();
    }
    x.globalAlpha = 1;
  });
}
// Zettel als Netz: feste Sektoren wie auf der Seite (Dokumente oben, gleiches Dokument rechts, EU-Rechtsakte unten, SR-Erlasse links)
function gNetzZettel(x, W, H) {
  const v = V(), i = v.gewaehlt, z = v.Z[i], d = v.docById.get(z.d);
  const {nodes, links, rest} = v.graphDaten(i);
  const gruppen = new Set(nodes.filter(n => n.g).map(n => n.g));
  const leg = [...legendeGruppen(gruppen), {f: TINTE3, t: 'Dokument', form: 'dok'}, {f: TINTE3, t: 'EU-Rechtsakt', form: 'eu'}, {f: TINTE3, t: 'SR-Erlass', form: 'sr'}];
  const B = rahmen(x, W, H, {titel: `${d.kurz}, ${z.l}`, ueber: `Umfeld eines Zettels als Netz · ${v.gName[d.gruppe]} › ${d.kurz}`, seitlich: true,
    gezeigt: 'Feste Bereiche: oben Dokumente und Zettel anderer Dokumente, rechts Zettel im selben Dokument, unten EU-Rechtsakte, links SR-Erlasse. Äusserer Ring: zweiter Schritt. Pfeil vom verweisenden zum verwiesenen Teil.',
    markiert: true, legende: leg, roh: true});
  const u = B.u, bw = B.x1 - B.x0, bh = B.y1 - B.y0, cx = B.x0 + bw / 2, cy = B.y0 + bh / 2;
  const R1 = Math.min(bw, bh) * 0.27, R2 = Math.min(bw, bh) * 0.43, rad = g => g * Math.PI / 180;
  const streck = Math.min(1.5, Math.max(1, bw / bh * 0.8));      // im Querformat waagrecht gestreckt
  Object.entries(v.SEKTOR).forEach(([s, S]) => {
    const r1 = nodes.filter(n => n.ring === 1 && n.sektor === s), querS = s === 'dok' || s === 'eu';
    r1.forEach((n, k) => { n.w = r1.length === 1 ? S.mitte : S.mitte - S.breite / 2 + S.breite * (k + 0.5) / r1.length;
      const r = querS && r1.length > 3 && k % 2 ? R1 * 1.22 : R1; n.x = cx + r * streck * Math.cos(rad(n.w)); n.y = cy + r * Math.sin(rad(n.w)); });
  });
  const c0 = nodes[0]; c0.x = cx; c0.y = cy; c0.w = -90;
  d3.group(nodes.filter(n => n.ring === 2), n => n.eltern).forEach((arr, pid) => { const p = nodes.find(n => n.id === pid);
    arr.forEach((n, k) => { n.w = p.w + (k - (arr.length - 1) / 2) * 12; n.x = cx + R2 * streck * Math.cos(rad(n.w)); n.y = cy + R2 * Math.sin(rad(n.w)); }); });
  const nid = new Map(nodes.map(n => [n.id, n]));
  links.forEach(k => { const a = nid.get(k.s), b = nid.get(k.t), L = Math.hypot(b.x - a.x, b.y - a.y) || 1, ex = b.x - (b.x - a.x) / L * 14 * u, ey = b.y - (b.y - a.y) / L * 14 * u;
    x.strokeStyle = TINTE3; x.lineWidth = 2 * u; x.setLineDash(k.art === 'teil_von' ? [3 * u, 5 * u] : k.art === 'genehmigt' || k.art === 'erlaeutert' ? [9 * u, 6 * u] : []);
    x.beginPath(); x.moveTo(a.x, a.y); x.lineTo(ex, ey); x.stroke(); x.setLineDash([]); pfeil(x, ex + (b.x - a.x) / L * 4 * u, ey + (b.y - a.y) / L * 4 * u, Math.atan2(b.y - a.y, b.x - a.x), 12 * u, TINTE3); });
  const tr = v.treffer, belegt = [];
  nodes.forEach(n => {
    const r = (n.id === 'c' ? 15 : 10) * u;
    x.globalAlpha = tr && n.i !== undefined && n.id !== 'c' && !tr.has(n.i) ? 0.4 : 1;
    form(x, n.typ === 'bot' ? 'zettel' : n.typ, n.x, n.y, r, n.g ? mischen(farbe(n.g), n.id === 'c' ? 100 : 55) : '#FFFFFF', n.g ? farbe(n.g) : TINTE3, 2 * u);
    x.globalAlpha = 1;
  });
  nodes.forEach(n => { const r = (n.id === 'c' ? 15 : 10) * u + 3 * u; belegt.push({x0: n.x - r, x1: n.x + r, y0: n.y - r, y1: n.y + r}); });
  { schrift(x, 700, 21 * u); const zl = zeilen(x, c0.label, R1 * 1.5 * streck, 2);
    zl.forEach((t, j) => { const ty = cy + 44 * u + j * 26 * u; x.save(); x.lineWidth = 5 * u; x.strokeStyle = '#FFFFFF'; x.lineJoin = 'round'; x.textAlign = 'center'; schrift(x, 700, 21 * u); x.strokeText(t, cx, ty); x.restore();
      text(x, t, cx, ty, {w: 700, s: 21 * u, a: 'center'}); const w = x.measureText(t).width; belegt.push({x0: cx - w / 2, x1: cx + w / 2, y0: ty - 21 * u, y1: ty + 4 * u}); }); }
  [...nodes.filter(n => n.ring === 1), ...nodes.filter(n => n.ring === 2)].forEach(n => {
    const c = Math.cos(rad(n.w)), seitlich = n.id !== 'c' && Math.abs(c) > 0.35, a = n.id === 'c' || !seitlich ? 'center' : c > 0 ? 'left' : 'right';
    const fsz = (n.id === 'c' ? 21 : 17) * u, dx = a === 'left' ? 16 * u : a === 'right' ? -16 * u : 0;
    const dy = n.id === 'c' ? -24 * u : seitlich ? 6 * u : (Math.sin(rad(n.w)) < 0 ? -18 * u : 32 * u);
    schrift(x, n.id === 'c' ? 700 : 400, fsz);
    for (const max of n.id === 'c' ? [56, 40, 26] : [34, 24, 14]) {
      const t = v.kuerze(n.label, max), w = x.measureText(t).width + 6 * u;
      const x0 = n.x + dx - (a === 'center' ? w / 2 : a === 'right' ? w : 0), rr = {x0, x1: x0 + w, y0: n.y + dy - fsz, y1: n.y + dy + 4 * u};
      if (rr.x0 >= B.x0 - 30 * u && rr.x1 <= B.x1 + 30 * u && !belegt.some(b => rr.x0 < b.x1 && rr.x1 > b.x0 && rr.y0 < b.y1 && rr.y1 > b.y0)) {
        belegt.push(rr); x.save(); x.lineWidth = 5 * u; x.strokeStyle = '#FFFFFF'; x.lineJoin = 'round'; x.textAlign = a; x.strokeText(t, n.x + dx, n.y + dy); x.restore();
        text(x, t, n.x + dx, n.y + dy, {w: n.id === 'c' ? 700 : 400, s: fsz, a}); break; }
    }
  });
  const weitere = Object.values(rest).reduce((s, n) => s + n, 0);
  if (weitere) text(x, `+ ${weitere} weitere Bezüge, nicht gezeichnet (höchstens ${v.MAX_JE_SEKTOR} je Bereich)`, B.x0, B.y1 + 10 * u, {s: 17 * u, c: TINTE3});
}

/* ---------- 5. Matrix ---------- */
function gMatrix(x, W, H) {
  const v = V(), {ids, M} = v.matrixWerte(G.mass), n = ids.length;
  const B = rahmen(x, W, H, {titel: {verweise: 'Artikelverweise zwischen den Dokumenten', eu: 'Gemeinsame EU-Rechtsakte der Dokumente', struktur: 'Genehmigt und erläutert: Bezüge zwischen den Dokumenten'}[G.mass], ueber: 'Matrix, Dokument × Dokument', seitlich: true,
    gezeigt: G.mass === 'eu' ? 'Zelle: Anzahl EU-Rechtsakte, die beide Dokumente nennen; symmetrisch.' : G.mass === 'verweise' ? 'Zeile → Spalte: Anzahl Artikelverweise aus einem Dokument auf Artikel eines anderen Dokuments, auch aus der Botschaft.' : 'Zeile → Spalte: Bundesbeschluss genehmigt (Art. 1), Botschaft erläutert.',
    markiert: true, roh: true, gezeigtZeilen: 2});
  const u = B.u, bw = B.x1 - B.x0, bh = B.y1 - B.y0, quer = W > H;
  const L = 250 * u, T = 175 * u, legW = 0, legH = 56 * u;
  const C = Math.min((bw - L - legW) / n, (bh - T - legH) / n), x0 = B.x0 + L, y0 = B.y0 + T;
  const KL = [1, 2, 5, 15, 50], KN = ['1', '2–4', '5–14', '15–49', '50 und mehr'], fb = w => w === 0 ? SEQ[0] : SEQ[KL.filter(k => w >= k).length];
  const fsz = Math.max(12.5 * u, Math.min(17 * u, C * 0.74));
  ids.forEach((id, a) => {
    const dd = v.docById.get(id);
    text(x, dd.kurz, x0 - 14 * u, y0 + a * C + C * 0.7, {s: fsz, a: 'right', max: L - 24 * u});
    x.fillStyle = farbe(dd.gruppe); x.fillRect(x0 - 9 * u, y0 + a * C + C * 0.2, 5 * u, C * 0.6);
    x.save(); x.translate(x0 + a * C + C * 0.62, y0 - 14 * u); x.rotate(-Math.PI / 3); text(x, dd.kurz, 0, 0, {s: fsz, max: T / 0.87 - 20 * u}); x.restore();
    x.fillStyle = farbe(dd.gruppe); x.fillRect(x0 + a * C + C * 0.2, y0 - 9 * u, C * 0.6, 5 * u);
    for (let b = 0; b < n; b++) { x.fillStyle = a === b ? LINIE : fb(M[a][b].length); rundRechteck(x, x0 + b * C + 1, y0 + a * C + 1, C - 2, C - 2, 2 * u); x.fill(); }
  });
  const lx = B.x0, ly = y0 + n * C + 40 * u;
  text(x, 'Anzahl', lx, ly, {w: 600, s: 18 * u});
  ['0', ...KN].forEach((t, k) => { const ex = lx + 90 * u + k * 125 * u, ey = ly - 17 * u;
    x.fillStyle = k === 0 ? SEQ[0] : SEQ[k]; rundRechteck(x, ex, ey, 22 * u, 22 * u, 3 * u); x.fill(); x.strokeStyle = LINIE2; x.lineWidth = 1; x.stroke();
    text(x, t, ex + 30 * u, ey + 17 * u, {s: 17 * u}); });
}

/* ---------- 6. Bezüge auf einer Linie (Hochformat senkrecht) ---------- */
function gBezuege(x, W, H) {
  const v = V(), {BZ, docPos, BZ_TOTAL, BZ_TYPEN} = v.bz(), akt = v.bzAktiv, tr = v.treffer;
  const sicht = v.bzSicht() || [0, BZ_TOTAL], s0 = Math.max(0, sicht[0]), s1 = Math.min(BZ_TOTAL, sicht[1]), ganz = s0 <= 1 && s1 >= BZ_TOTAL - 1;
  const typen = Object.keys(BZ_TYPEN).filter(t => akt[t]);
  const boegen = BZ.filter(b => akt[b.t] && b.x1 > s0 && b.x0 < s1);
  const sichtbar = v.D.docs.filter(d => { const [a, w] = docPos.get(d.nr); return a + w > s0 && a < s1; });
  const gruppen = new Set(boegen.map(b => b.g).filter(g => g !== 'neutral'));
  const quer = W > H;
  const B = rahmen(x, W, H, {titel: ganz ? 'Bezüge im ganzen Paket' : `Bezüge: ${sichtbar.map(d => d.kurz).slice(0, 3).join(', ')}${sichtbar.length > 3 ? ' …' : ''}`,
    ueber: 'Alle Zettel auf einer Linie, Länge = Wörter',
    gezeigt: `${fmt(boegen.length)} Bögen: ${typen.map(t => BZ_TYPEN[t].name).join(', ')}. ${quer ? 'Oben' : 'Links'}: Artikelverweise im selben Dokument; ${quer ? 'unten' : 'rechts'}: Bezüge zwischen Dokumenten.${ganz ? '' : ` Ausschnitt: ${fmt(s1 - s0)} von ${fmt(BZ_TOTAL)} Wörtern.`}`,
    markiert: true, legende: [...legendeGruppen(gruppen), {f: FARBE.neutral, t: 'zwischen zwei Vorlagen', linie: true}], roh: true});
  const u = B.u, balk = 34 * u;
  const lang = quer ? B.x1 - B.x0 : B.y1 - B.y0, quer2 = quer ? B.y1 - B.y0 : B.x1 - B.x0;
  const seiteA = (quer2 - balk) * 0.34, seiteB = quer2 - balk - seiteA - 8 * u;
  const p = w => (w - s0) / (s1 - s0) * lang;
  const L0 = quer ? B.x0 : B.y0, achse = (quer ? B.y0 : B.x0) + seiteA;     // Beginn des Balkens quer zur Linie
  x.save(); x.beginPath(); x.rect(B.x0, B.y0 - 4 * u, B.x1 - B.x0, B.y1 - B.y0 + 8 * u); x.clip();
  const sortiert = [...boegen].sort((a, b) => (tr ? (tr.has(a.A.i) || tr.has(a.B.i)) - (tr.has(b.A.i) || tr.has(b.B.i)) : 0) || (b.x1 - b.x0) - (a.x1 - a.x0));
  x.lineCap = 'round';
  sortiert.forEach(b => {
    const a1 = p(b.x0), a2 = p(b.x1), r = (a2 - a1) / 2; if (r < 0.3) return;
    const oben = BZ_TYPEN[b.t].oben, Hs = oben ? seiteA - 6 * u : seiteB, h = Hs * r / (r + Hs);
    const markiert = tr && (tr.has(b.A.i) || tr.has(b.B.i)), stark = b.t === 'genehmigt' || b.t === 'zwischen';
    x.globalAlpha = tr ? (markiert ? 0.6 : 0.035) : stark ? 0.6 : 0.28;
    x.strokeStyle = farbe(b.g); x.lineWidth = (tr ? (markiert ? 1.8 : 1) : stark ? 1.8 : 1.1) * u;
    const m = L0 + a1 + r;
    x.beginPath();
    if (quer) { const yy = oben ? achse - 3 * u : achse + balk + 3 * u; x.ellipse(m, yy, r, h, 0, oben ? Math.PI : 0, oben ? 2 * Math.PI : Math.PI); }
    else { const xx = oben ? achse - 3 * u : achse + balk + 3 * u; x.ellipse(xx, m, h, r, 0, oben ? Math.PI / 2 : -Math.PI / 2, oben ? 1.5 * Math.PI : Math.PI / 2); }
    x.stroke();
  });
  x.globalAlpha = 1;
  // Dokumente als Balken auf der Linie
  sichtbar.forEach(d => {
    const [a, w] = docPos.get(d.nr), q0 = Math.max(0, p(a)), q1 = Math.min(lang, p(a + w));
    const hatT = !tr || [...tr].some(i => v.Z[i].d === d.nr);
    x.globalAlpha = hatT ? 1 : 0.35; x.fillStyle = mischen(farbe(d.gruppe), 72);
    if (quer) x.fillRect(L0 + q0, achse, Math.max(0.8, q1 - q0 - 1.5 * u), balk); else x.fillRect(achse, L0 + q0, balk, Math.max(0.8, q1 - q0 - 1.5 * u));
    x.globalAlpha = 1;
    const platz = q1 - q0;
    if (quer && platz > 70 * u) text(x, d.kurz, L0 + q0 + 8 * u, achse + balk / 2 + 6 * u, {w: 600, s: 16 * u, max: platz - 16 * u});
    if (!quer && platz > 24 * u) { x.save(); x.translate(achse + balk / 2 + 6 * u, L0 + q0 + 8 * u); x.rotate(Math.PI / 2); text(x, d.kurz, 0, 0, {w: 600, s: 16 * u, max: platz - 16 * u}); x.restore(); }
  });
  x.restore();
}

/* ---------- 7. Umsetzung (Sankey) ---------- */
function gUmsetzung(x, W, H) {
  const v = V(), K = v.K, tr = v.treffer;
  const nodes = [], links = [], idx = new Map();
  const node = (key, name, g, typ, extra) => { if (!idx.has(key)) { idx.set(key, nodes.length); nodes.push({key, name, g, typ, ...extra}); } return idx.get(key); };
  const bbOk = nr => G.bb === 'alle' || +G.bb === nr;
  K.filter(k => k.art === 'genehmigt').forEach(k => { const bb = v.docById.get(v.refDoc(k.von)), d = v.docById.get(v.refDoc(k.nach)); if (!bbOk(bb.nr)) return;
    links.push({source: node('d' + d.nr, d.kurz, d.gruppe, 'dok', {doc: d.nr}), target: node('b' + bb.nr, bb.kurz, bb.gruppe, 'bb', {doc: bb.nr}), value: 1}); });
  K.filter(k => k.art === 'aendert').forEach(k => { const bb = v.docById.get(v.refDoc(k.von)), g = v.D.gesetze.find(x2 => x2.id === k.nach); if (!g || !bbOk(bb.nr)) return;
    links.push({source: node('b' + bb.nr, bb.kurz, bb.gruppe, 'bb', {doc: bb.nr}), target: node(g.id, v.gesetzName(g) + (g.neu ? ' (neu)' : g.totalrevision ? ' (Totalrevision)' : ''), null, 'gesetz', {gesetz: g}), value: 1}); });
  const nG = nodes.filter(n => n.typ === 'gesetz').length, bbName = G.bb === 'alle' ? '' : v.docById.get(+G.bb).kurz;
  const B = rahmen(x, W, H, {titel: G.bb === 'alle' ? 'Von den Abkommen zu den Bundesgesetzen' : `${bbName}: Abkommen und Bundesgesetze`, ueber: 'Umsetzung',
    gezeigt: `Links Abkommen und Protokolle, Mitte ${G.bb === 'alle' ? 'die Bundesbeschlüsse, die sie genehmigen' : 'der Bundesbeschluss, der sie genehmigt'} (Art. 1), rechts ${fmt(nG)} Bundesgesetze, die ${G.bb === 'alle' ? 'die Bundesbeschlüsse' : 'er'} in den Anhängen neu schaffen oder ändern. Jede Linie ist eine Zuordnung aus dem Text.`,
    markiert: true, legende: legendeGruppen(new Set(nodes.filter(n => n.g).map(n => n.g))), roh: true});
  const u = B.u, quer = W > H;
  if (!links.length) { hinweis(x, B, 'Keine Zuordnung für diese Auswahl.'); return; }
  const fs = Math.max(13 * u, Math.min(19 * u, (B.y1 - B.y0) / Math.max(1, nG) * 0.72));
  schrift(x, 400, fs);
  const lw = Math.min(quer ? 300 * u : 200 * u, Math.max(...nodes.filter(n => n.typ === 'dok').map(n => x.measureText(n.name).width)) + 14 * u);
  const rw = Math.min(quer ? 560 * u : 380 * u, Math.max(...nodes.filter(n => n.typ !== 'dok').map(n => x.measureText(n.name).width)) + 14 * u);
  const sk = d3.sankey().nodeId(d => d.index).nodeWidth(14 * u).nodePadding(Math.max(2 * u, Math.min(10 * u, fs * 0.35))).nodeAlign(d3.sankeyLeft).nodeSort(null).linkSort(null)
    .extent([[B.x0 + lw, B.y0], [B.x1 - rw, B.y1]]);
  const g = sk({nodes: nodes.map(d => ({...d})), links: links.map(d => ({...d}))});
  const mitT = new Set(tr ? [...tr].map(i => v.Z[i].d) : []);
  const kraeftig = d => !tr || (d.doc ? mitT.has(d.doc) : d.targetLinks.some(l => mitT.has(l.source.doc)));
  const pfad = d3.sankeyLinkHorizontal();
  g.links.forEach(l => { x.globalAlpha = kraeftig(l.source) && kraeftig(l.target) ? 0.35 : 0.07; x.strokeStyle = farbe(l.source.g || 'neutral'); x.lineWidth = Math.max(1.5 * u, l.width); x.stroke(new Path2D(pfad(l))); });
  g.nodes.forEach(n => {
    x.globalAlpha = kraeftig(n) ? 1 : 0.3; x.fillStyle = n.g ? farbe(n.g) : FARBE.gesetz; x.fillRect(n.x0, n.y0, n.x1 - n.x0, Math.max(2 * u, n.y1 - n.y0));
    const ym = (n.y0 + n.y1) / 2 + fs * 0.35;
    if (n.typ === 'dok') text(x, n.name, n.x0 - 8 * u, ym, {s: fs, a: 'right', max: lw - 12 * u});
    else { x.save(); x.lineWidth = 4 * u; x.strokeStyle = '#FFFFFF'; x.lineJoin = 'round'; schrift(x, n.typ === 'bb' ? 600 : 400, fs); x.strokeText(kuerzen(x, n.name, rw - 12 * u), n.x1 + 8 * u, ym); x.restore();
      text(x, n.name, n.x1 + 8 * u, ym, {s: fs, w: n.typ === 'bb' ? 600 : 400, max: rw - 12 * u}); }
    x.globalAlpha = 1;
  });
}

/* ---------- 8. Thema in Zahlen ---------- */
function gThema(x, W, H) {
  const v = V(), t = v.T.find(e => e.id === G.thema) || v.T[0], Z = v.Z;
  const art = v.filt.thema === t && v.filt.art ? v.filt.art : null;
  let menge = [...t.zm.keys()]; if (art) menge = menge.filter(i => v.artVon(Z[i].d) === art);
  const fund = menge.reduce((s, i) => s + t.zm.get(i), 0), woerter = menge.reduce((s, i) => s + Z[i].w, 0);
  const total = v.root.value;
  const B = rahmen(x, W, H, {titel: `Thema «${t.name}»`, ueber: 'Wo das Thema im Wortlaut vorkommt',
    gezeigt: `Zettel, in deren Wortlaut oder Fussnoten mindestens ein Begriff des Themas steht${art ? `; nur ${v.TEXTART[art].name}` : ''}. Fundstellen = jede Nennung. Die Zahlen sagen nichts über Bedeutung oder Gewicht.`,
    legende: legendeGruppen(new Set(menge.map(i => v.docById.get(Z[i].d).gruppe)))});
  const u = B.u, bw = B.x1 - B.x0, quer = W > H;
  // Kennzahlen
  const kz = [[menge.length, 'Zettel'], [fund, 'Fundstellen'], [(woerter / total * 100).toLocaleString('de-CH', {maximumFractionDigits: 1, minimumFractionDigits: 1}) + ' %', 'des Pakets nach Wörtern']];
  kz.forEach(([n, l], j) => { const kx = B.x0 + j * bw / 3; text(x, typeof n === 'number' ? fmt(n) : n, kx, B.y0 + 56 * u, {w: 700, s: 56 * u, f: TF}); text(x, l, kx, B.y0 + 90 * u, {s: 20 * u, c: TINTE2}); });
  let y = B.y0 + 140 * u;
  const spalte = quer ? (bw - 60 * u) / 2 : bw, xs2 = quer ? B.x0 + spalte + 60 * u : B.x0;
  // Nach Textart
  text(x, 'Nach Textart', B.x0, y, {w: 600, s: 22 * u}); y += 16 * u;
  const arten = Object.entries(v.TEXTART).filter(([k]) => !art || k === art).map(([k, a]) => ({n: a.name, z: menge.filter(i => v.artVon(Z[i].d) === k).length}));
  const zmax = Math.max(1, ...arten.map(a => a.z)), labW = 250 * u;
  arten.forEach(a => { y += 38 * u; text(x, a.n, B.x0, y, {s: 19 * u, max: labW - 10 * u}); const w = (spalte - labW - 110 * u) * a.z / zmax;
    x.fillStyle = TINTE3; rundRechteck(x, B.x0 + labW, y - 18 * u, Math.max(2, w), 22 * u, 3 * u); x.fill(); text(x, `${fmt(a.z)} Zettel`, B.x0 + labW + w + 10 * u, y, {s: 18 * u, c: TINTE2}); });
  y += 50 * u;
  // Begriffe
  const yB = quer ? B.y0 + 140 * u : y;
  let yy = quer ? yB : y;
  const bx0 = quer ? xs2 : B.x0, bspalte = quer ? spalte : bw;
  if (!quer) { text(x, 'Begriffe im Wortlaut, mit Anzahl Fundstellen im Paket', bx0, yy, {w: 600, s: 22 * u}); yy += 12 * u; }
  // Nach Dokument (Paketreihenfolge)
  const jeDoc = new Map(); menge.forEach(i => { const dn = Z[i].d; const e = jeDoc.get(dn) || {z: 0, f: 0}; e.z++; e.f += t.zm.get(i); jeDoc.set(dn, e); });
  const docs = v.D.docs.filter(d => jeDoc.has(d.nr));
  const yD0 = quer ? yB : null;
  const zeichneDocs = (dx0, dy0, dw, dyMax) => {
    text(x, 'Nach Dokument, in Paketreihenfolge', dx0, dy0, {w: 600, s: 22 * u});
    let rows = docs.map(d => ({n: d.kurz, g: d.gruppe, ...jeDoc.get(d.nr)}));
    const zh = 31 * u, platz = Math.floor((dyMax - dy0 - 20 * u) / zh);
    if (rows.length > platz) {          // zu viele Dokumente: nach Vorlage zusammengefasst
      const jeG = new Map(); docs.forEach(d => { const e = jeG.get(d.gruppe) || {z: 0, f: 0}; e.z += jeDoc.get(d.nr).z; e.f += jeDoc.get(d.nr).f; jeG.set(d.gruppe, e); });
      rows = v.D.gruppen.filter(g => jeG.has(g.id)).map(g => ({n: v.GRUPPE_KURZ[g.id] || g.name, g: g.id, ...jeG.get(g.id)}));
      text(x, '(nach Vorlage zusammengefasst)', dx0, dy0 + 24 * u, {s: 16 * u, c: TINTE3}); dy0 += 20 * u;
    }
    const mx = Math.max(1, ...rows.map(r => r.z)), lw = Math.min(260 * u, dw * 0.38);
    rows.slice(0, Math.max(1, platz)).forEach((r, j) => { const ry = dy0 + 26 * u + (j + 1) * zh - 8 * u;
      text(x, r.n, dx0, ry, {s: 17 * u, max: lw - 10 * u}); const w = (dw - lw - 200 * u) * r.z / mx;
      x.fillStyle = farbe(r.g); rundRechteck(x, dx0 + lw, ry - 16 * u, Math.max(2, w), 19 * u, 3 * u); x.fill();
      text(x, `${fmt(r.z)} Zettel · ${fmt(r.f)} Fundst.`, dx0 + lw + w + 10 * u, ry, {s: 16 * u, c: TINTE2}); });
  };
  if (quer) {
    // rechts: Begriffe oben, darunter Dokumente
    text(x, 'Begriffe im Wortlaut, mit Anzahl Fundstellen im Paket', xs2, yD0, {w: 600, s: 22 * u});
    let lx = xs2, ly = yD0 + 40 * u; schrift(x, 500, 18 * u);
    t.b.forEach(([a, , n]) => { const s = `${a} ${fmt(n)}`, w = x.measureText(s).width + 24 * u; if (lx + w > B.x1) { lx = xs2; ly += 34 * u; }
      x.fillStyle = FLAECHE; rundRechteck(x, lx, ly - 22 * u, w, 30 * u, 6 * u); x.fill(); x.strokeStyle = LINIE; x.lineWidth = 1.2 * u; x.stroke(); text(x, s, lx + 12 * u, ly, {w: 500, s: 18 * u}); lx += w + 8 * u; });
    zeichneDocs(B.x0, y, spalte, B.y1);
  } else {
    let lx = bx0, ly = yy + 30 * u; schrift(x, 500, 18 * u);
    t.b.forEach(([a, , n]) => { const s = `${a} ${fmt(n)}`, w = Math.min(bw, x.measureText(s).width + 24 * u); if (lx + w > B.x1) { lx = bx0; ly += 34 * u; }
      x.fillStyle = FLAECHE; rundRechteck(x, lx, ly - 22 * u, w, 30 * u, 6 * u); x.fill(); x.strokeStyle = LINIE; x.lineWidth = 1.2 * u; x.stroke(); text(x, s, lx + 12 * u, ly, {w: 500, s: 18 * u, max: w - 20 * u}); lx += w + 8 * u; });
    zeichneDocs(B.x0, ly + 50 * u, bw, B.y1);
  }
}

/* ---------- 9. Wortlautkarte: ganzer Artikel oder ein ganzer Absatz, nie gekürzt ---------- */
const textCache = new Map();
function absaetze(i) {
  const v = V(), id = v.Z[i].i;
  if (!textCache.has(id)) { textCache.set(id, null); v.ladeText(id).then(t => { textCache.set(id, t); if ($('#grafikLage').classList.contains('offen')) { auszugFuellen(); zeichnen(); } }); }
  const t = textCache.get(id); if (!t) return null;
  const ps = t[0].split('\n').map(s => s.trim()).filter(Boolean);
  const z = v.Z[i];
  if (ps.length && ps[0].replace(/\s+/g, ' ').startsWith(z.l.slice(0, 20))) ps.shift();      // erste Zeile = Überschrift
  return {ps, fn: t[1]};
}
function gWortlaut(x, W, H) {
  const v = V(), i = v.gewaehlt, z = v.Z[i], d = v.docById.get(z.d), a = absaetze(i);
  const seiten = z.s && z.s.length ? (z.s[0] === z.s[1] ? `S. ${z.s[0]}` : `S. ${z.s[0]}–${z.s[1]}`) : '';
  const teil = a && G.auszug !== 'alle' ? `Absatz ${+G.auszug + 1} von ${a.ps.length}` : 'ganzer Text';
  const B = rahmen(x, W, H, {titel: z.l, ueber: `${v.gName[d.gruppe]} › ${d.kurz}${z.p.length ? ' › ' + z.p.join(' › ') : ''}`,
    gezeigt: `Wortlaut, ${teil}, ohne Kürzung. Massgebend ist die Veröffentlichung im Bundesblatt.`,
    fuss: `Fundstelle: BBl 2026 ${d.nr}${seiten ? ', PDF ' + seiten : ''}`, gezeigtZeilen: 2});
  const u = B.u;
  if (!a) { hinweis(x, B, 'Wortlaut wird geladen …'); return; }
  const ps = G.auszug === 'alle' ? a.ps : [a.ps[+G.auszug]].filter(Boolean);
  if (!ps.length) { hinweis(x, B, 'Kein Wortlaut.'); return; }
  const bw = B.x1 - B.x0 - 30 * u, bh = B.y1 - B.y0 - 30 * u;
  let gr = null, gesetzt = null;
  for (let s = 34; s >= 15; s -= 1) {             // grösste Schrift, bei der alles passt
    const px = s * u; schrift(x, 400, px);
    const zl = ps.map(p => umbruch(x, p, bw)), h = zl.reduce((sum, l) => sum + l.length * px * 1.42 + px * 0.6, 0);
    if (h <= bh) { gr = px; gesetzt = zl; break; }
  }
  if (!gr) { x.fillStyle = farbe(d.gruppe); x.fillRect(B.x0, B.y0, 6 * u, 110 * u); text(x, 'Der Wortlaut passt in diesem Format nicht ganz in die Grafik.', B.x0 + 30 * u, B.y0 + 40 * u, {w: 600, s: 24 * u, max: bw});
    text(x, 'Bitte einen einzelnen Absatz wählen oder das Format «Bericht» verwenden. Gekürzt wird nicht.', B.x0 + 30 * u, B.y0 + 76 * u, {s: 22 * u, c: TINTE3, max: bw}); return; }
  let y = B.y0 + gr;
  gesetzt.forEach(zl => { zl.forEach(t => { text(x, t, B.x0 + 30 * u, y, {s: gr}); y += gr * 1.42; }); y += gr * 0.6; });
  x.fillStyle = farbe(d.gruppe); x.fillRect(B.x0, B.y0, 6 * u, y - B.y0 - gr * 0.9);
  if (/[⁰¹²³⁴⁵⁶⁷⁸⁹]/.test(ps.join(' ')) && a.fn.length) text(x, 'Hochgestellte Zahlen: Fussnoten im Original.', B.x0 + 30 * u, Math.min(B.y1, y + 6 * u), {s: 16 * u, c: TINTE3});
}

/* ---------- Dialog ---------- */
const ZEICHNER = {zahlen: gZahlen, umfang: gUmfang, umfeld: gUmfeld, netz: gNetz, matrix: gMatrix, bezuege: gBezuege, umsetzung: gUmsetzung, thema: gThema, wortlaut: gWortlaut};
function auszugFuellen() {
  const s = $('#grafikAuszug'), v = V(), a = v.gewaehlt !== null ? absaetze(v.gewaehlt) : null;
  s.innerHTML = `<option value="alle">Ganzer Text${a ? ` (${a.ps.length} ${a.ps.length === 1 ? 'Absatz' : 'Absätze'})` : ''}</option>` +
    (a ? a.ps.map((p, j) => `<option value="${j}">Absatz ${j + 1}: ${esc(v.kuerze(p, 60))}</option>`).join('') : '');
  if (a && G.auszug !== 'alle' && +G.auszug >= a.ps.length) G.auszug = 'alle';
  s.value = G.auszug;
}
function felderZeigen() {
  const m = G.motiv, v = V();
  $('#grafikStufeZeile').hidden = m !== 'netz';
  $('#grafikMassZeile').hidden = !(m === 'matrix' || (m === 'netz' && (G.stufe === 'gruppen' || G.stufe === 'dokumente')));
  $('#grafikDocZeile').hidden = !(m === 'netz' && G.stufe === 'dokument');
  $('#grafikDarstZeile').hidden = m !== 'umfeld';
  $('#grafikThemaZeile').hidden = m !== 'thema';
  $('#grafikAuszugZeile').hidden = m !== 'wortlaut';
  $('#grafikBbZeile').hidden = m !== 'umsetzung';
  const ohneZettel = ['umfeld', 'wortlaut'].includes(m) || (m === 'netz' && G.stufe === 'zettel');
  $('#grafikHinweis').hidden = !(ohneZettel && v.gewaehlt === null);
  if (m === 'wortlaut') auszugFuellen();
}
function zeichnen() {
  const f = FORMATE[G.format], c = $('#grafikCanvas');
  if (c.width !== f.w) c.width = f.w;
  if (c.height !== f.h) c.height = f.h;
  const x = c.getContext('2d');
  x.setTransform(1, 0, 0, 1, 0, 0);
  felderZeigen();
  const brauchtZettel = ['umfeld', 'wortlaut'].includes(G.motiv) || (G.motiv === 'netz' && G.stufe === 'zettel');
  try {
    if (brauchtZettel && V().gewaehlt === null) {      // Start ohne geöffneten Text (Gestaltungsentscheid 1.7)
      const B = rahmen(x, f.w, f.h, {titel: 'Kein Text geöffnet', gezeigt: 'Dieses Motiv zeigt einen einzelnen Zettel.'});
      hinweis(x, B, 'Bitte zuerst auf der Seite einen Zettel öffnen: im Umfang ein Feld anklicken, oben suchen oder unter «Finden» ein Thema wählen.');
    } else ZEICHNER[G.motiv](x, f.w, f.h);
  } catch (e) { console.error(e); x.setTransform(1, 0, 0, 1, 0, 0); x.fillStyle = '#fff'; x.fillRect(0, 0, f.w, f.h); text(x, 'Diese Grafik konnte nicht gezeichnet werden: ' + e.message, 60, 120, {s: 28}); }
  $('#grafikNote').textContent = NOTIZ[G.motiv];
  $('#grafikTitel').placeholder = G.autoTitel;
  $('#grafikMass').textContent = `${f.m}, PNG. Quelle, Stand und die Zeile «Gezeigt» stehen in der Grafik.`;
  $('#grafikVorschau').classList.toggle('transparent', G.hg !== 'weiss');
  c.setAttribute('aria-label', `Vorschau: ${G.titel.trim() || G.autoTitel}`);
}
function dateiname() {
  const v = V(), Z = v.Z, z = v.gewaehlt !== null ? Z[v.gewaehlt] : null, sauber = s => String(s).replace(/[^\w.]+/g, '-').replace(/^-|-$/g, '').toLowerCase();
  const teil = {
    umfang: () => sauber(v.fokus.data.name).slice(0, 40), umfeld: () => z ? sauber(z.i.split('/').slice(2).join('-')) : '',
    netz: () => G.stufe + (G.stufe === 'dokument' ? '-' + G.doc : G.stufe === 'zettel' && z ? '-' + sauber(z.i.split('/').slice(2).join('-')) : '-' + G.mass),
    matrix: () => G.mass, bezuege: () => '', umsetzung: () => G.bb, thema: () => G.thema, wortlaut: () => (z ? sauber(z.i.split('/').slice(2).join('-')) : '') + (G.auszug === 'alle' ? '' : '-absatz' + (+G.auszug + 1)), zahlen: () => '',
  }[G.motiv]();
  return `vertragsspiegel-${G.motiv}${teil ? '-' + teil : ''}${v.treffer && !['zahlen', 'thema', 'wortlaut'].includes(G.motiv) ? '-auswahl' : ''}-${G.format}.png`;
}
function meldung(t) { const m = $('#grafikMeldung'); m.textContent = t; clearTimeout(m._t); m._t = setTimeout(() => { m.textContent = ''; }, 6000); }
function vorgabe(motiv) {           // Motiv und Einstellungen aus der Ansicht, die auf der Seite gewählt ist
  const v = V();
  if (!motiv) motiv = v.listeOffen && v.filt.thema ? 'thema' : {umfang: 'umfang', verkn: v.mxDarst === 'netz' ? 'netz' : 'matrix', bezuege: 'bezuege', umsetz: 'umsetzung', tabelle: 'zahlen'}[v.aktiv] || 'zahlen';
  if (motiv === 'verkn') motiv = v.mxDarst === 'netz' ? 'netz' : 'matrix';
  G.motiv = motiv; G.mass = v.mxModus; G.stufe = v.nzStufe; G.doc = v.nzDoc; G.darst = v.ufArt;
  if (v.filt.thema) G.thema = v.filt.thema.id; else if (!G.thema) G.thema = v.T[0] ? v.T[0].id : '';
  G.auszug = 'alle';
}
function oeffne(motiv, opener) {
  vorgabe(motiv);
  G.opener = opener || document.activeElement; G.titel = '';
  $('#grafikMotiv').value = G.motiv; $('#grafikFormat').value = G.format; $('#grafikTitel').value = ''; $('#grafikMeldung').textContent = '';
  $('#grafikStufe').value = G.stufe; $('#grafikMassW').value = G.mass; $('#grafikDoc').value = String(G.doc); $('#grafikDarst').value = G.darst;
  $('#grafikThema').value = G.thema; $('#grafikBb').value = G.bb;
  document.querySelectorAll('input[name="grafikHg"]').forEach(r => { r.checked = r.value === G.hg; });
  $('#grafikLage').classList.add('offen'); document.body.classList.add('grafik-offen'); document.body.style.overflow = 'hidden';
  V().hideTip();
  zeichnen();
  if (document.fonts && document.fonts.load) Promise.all([`700 48px ${TF}`, `600 20px ${TF}`, `400 20px ${TT}`, `500 20px ${TT}`, `600 20px ${TT}`, `700 20px ${TT}`].map(f => document.fonts.load(f)))
    .then(() => { if ($('#grafikLage').classList.contains('offen')) zeichnen(); }).catch(() => {});
  setTimeout(() => $('#grafikMotiv').focus(), 30);
}
function schliesse() {
  $('#grafikLage').classList.remove('offen'); document.body.classList.remove('grafik-offen'); document.body.style.overflow = '';
  if (G.opener && G.opener.focus) G.opener.focus();
}
function init() {
  const v = V(); if (!v || !v.D) { setTimeout(init, 200); return; }
  const mot = $('#grafikMotiv'), fmtS = $('#grafikFormat'), lage = $('#grafikLage');
  mot.innerHTML = MOTIVE.map(([k, t]) => `<option value="${k}">${esc(t)}</option>`).join('');
  fmtS.innerHTML = Object.entries(FORMATE).map(([k, f]) => `<option value="${k}">${esc(f.t)} (${esc(f.m.replace(' Pixel', ''))})</option>`).join('');
  $('#grafikDoc').innerHTML = v.D.docs.map(d => `<option value="${d.nr}">${esc(d.kurz)}</option>`).join('');
  $('#grafikThema').innerHTML = v.T.map(t => `<option value="${t.id}">${esc(t.name)}</option>`).join('');
  $('#grafikBb').innerHTML = '<option value="alle">Alle Bundesbeschlüsse</option>' + v.D.docs.filter(d => v.K.some(k => (k.art === 'genehmigt' || k.art === 'aendert') && v.refDoc(k.von) === d.nr)).map(d => `<option value="${d.nr}">${esc(d.kurz)}</option>`).join('');
  $('#grafikAuf').addEventListener('click', ev => oeffne(null, ev.currentTarget));
  document.addEventListener('click', ev => { const b = ev.target.closest && ev.target.closest('[data-grafik]'); if (!b) return; ev.preventDefault(); oeffne(b.dataset.grafik, b); });
  $('#grafikZu').addEventListener('click', schliesse);
  lage.addEventListener('click', ev => { if (ev.target === lage) schliesse(); });
  document.addEventListener('keydown', ev => { if (ev.key === 'Escape' && lage.classList.contains('offen')) { ev.preventDefault(); schliesse(); } });
  lage.addEventListener('keydown', ev => {
    if (ev.key !== 'Tab') return;
    const f = [...lage.querySelectorAll('button, select, input')].filter(e => !e.disabled && e.offsetParent !== null && !(e.type === 'radio' && !e.checked));
    if (!f.length) return;
    const i = f.indexOf(document.activeElement);
    if (ev.shiftKey && i <= 0) { ev.preventDefault(); f[f.length - 1].focus(); } else if (!ev.shiftKey && i === f.length - 1) { ev.preventDefault(); f[0].focus(); }
  });
  const an = (sel, feld, zahl) => $(sel).addEventListener('change', ev => { G[feld] = zahl ? +ev.target.value : ev.target.value; zeichnen(); });
  an('#grafikMotiv', 'motiv'); an('#grafikFormat', 'format'); an('#grafikStufe', 'stufe'); an('#grafikMassW', 'mass'); an('#grafikDoc', 'doc', true);
  an('#grafikDarst', 'darst'); an('#grafikThema', 'thema'); an('#grafikAuszug', 'auszug'); an('#grafikBb', 'bb');
  document.querySelectorAll('input[name="grafikHg"]').forEach(r => r.addEventListener('change', () => { if (r.checked) { G.hg = r.value; zeichnen(); } }));
  let tt; $('#grafikTitel').addEventListener('input', ev => { G.titel = ev.target.value; clearTimeout(tt); tt = setTimeout(zeichnen, 150); });
  $('#grafikLaden').addEventListener('click', () => {
    zeichnen();
    const a = document.createElement('a'); a.download = dateiname(); a.href = $('#grafikCanvas').toDataURL('image/png');
    document.body.append(a); a.click(); a.remove(); meldung('Heruntergeladen: ' + a.download);
  });
  $('#grafikKopie').addEventListener('click', async () => {
    zeichnen();
    const c = $('#grafikCanvas'), bild = new Promise((ok, fehler) => c.toBlob(b => b ? ok(b) : fehler(new Error('leer')), 'image/png'));
    try {
      if (!navigator.clipboard || !navigator.clipboard.write || typeof ClipboardItem === 'undefined') throw new Error('keine Zwischenablage');
      try { await navigator.clipboard.write([new ClipboardItem({'image/png': bild})]); } catch (e) { await navigator.clipboard.write([new ClipboardItem({'image/png': await bild})]); }
      meldung('Grafik in der Zwischenablage. In Word oder PowerPoint mit Einfügen übernehmen.');
    } catch (e) { meldung('Kopieren ist in diesem Browser nicht möglich. Bitte als PNG herunterladen.'); }
  });
  window.VSGrafik = {oeffne, zeichnen, G, FORMATE, MOTIVE};      // für die Prüfung der Formate
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
