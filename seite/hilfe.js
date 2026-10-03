/* Vertragsspiegel: Hilfe für Laien (Projektbrief Ziffer 5.6, Gestaltungsentscheid 4e).
   1. Infoblasen: Knopf «i» rechts oben an jedem Bereich und jeder Ansicht. Öffnet beim Darüberfahren mit der
      Maus, beim Antippen und mit der Tastatur; bleibt offen, solange Maus oder Fokus auf Knopf oder Blase sind,
      schliesst mit Esc, Klick daneben oder «×» (WCAG 2.2, Kriterium 1.4.13).
   2. Rundgang in fünf Schritten: freiwillig, beim ersten Besuch einmal angeboten, jederzeit über den Knopf
      «Rundgang» im Kopf. Kreis um den Bereich, Karte mit Zurück, Weiter und Beenden.
   Der Rundgang hat kurze Texte, die Infoblasen die Einzelheiten. Ohne Bibliothek und ohne Popover-API, damit die Hilfe auch
   auf älteren Geräten funktioniert. */
(function () {
'use strict';
const $ = s => document.querySelector(s);
const ruhig = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const merke = (k, v) => { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { /* */ } return null; };

const HILFE = {
  schritt1: {titel: 'Suchen und auswählen',
    text: '<p>Geben Sie ein Wort ein, zum Beispiel «Lohnschutz» oder «Strom». Die Seite zeigt passende Texte und schlägt ein Thema vor, wenn es eines gibt.</p><p>Mit <b>Thema</b> und <b>Textart</b> grenzen Sie ein. Die passenden Stellen werden in allen Ansichten markiert. <b>Neu beginnen</b> hebt alles wieder auf.</p><p>Lieber Schritt für Schritt? <b>In drei Schritten finden</b> stellt drei Fragen.</p>'},
  schritt2: {titel: 'Ansicht wählen',
    text: '<p>Fünf Ansichten zeigen dasselbe Paket auf verschiedene Arten. Unter jedem Namen steht die Frage, die sie beantwortet.</p><p>Was Sie unter 1 auswählen, bleibt in allen Ansichten markiert. Jede Ansicht lässt sich als Bild speichern.</p>'},
  schritt3: {titel: 'Text lesen',
    text: '<p>Hier erscheint der Text, den Sie öffnen: Wortlaut, Fundstelle im amtlichen PDF und die Verweise zu anderen Texten. Ein einzelner Artikel oder Abschnitt heisst hier «Zettel».</p><p>Französisch oder Italienisch? Oben im Kopf unter <b>Sprache der Texte</b> auf <b>FR</b> oder <b>IT</b> klicken.</p><p>«Rohextraktion» heisst: automatisch erkannt, kann Fehler enthalten. Fehler bitte über «Fehler melden».</p>'},
  umfang: {titel: 'Umfang: so lesen',
    text: '<p>Jedes Feld ist ein Teil des Pakets. Je höher das Feld, desto mehr Wörter.</p><p>Von links nach rechts wird es feiner: Vorlage, Dokument, Kapitel, einzelner Text. Ein Klick auf ein Feld vergrössert es; ein Klick auf ein Feld ganz rechts öffnet den Text.</p><p>Das schmale Feld links zeigt immer das ganze Paket, der Rahmen darin den Ausschnitt.</p>'},
  verkn: {titel: 'Verknüpfungen: so lesen',
    text: '<p><b>Matrix:</b> Jede Zeile ist ein Dokument, das verweist, jede Spalte eines, auf das verwiesen wird. Je dunkler das Feld, desto mehr Verweise.</p><p><b>Netz:</b> Jeder Kreis ist ein Dokument, je grösser, desto mehr Wörter. Je dicker die Linie, desto mehr Verweise.</p><p>Ein Klick auf ein Feld oder eine Linie zeigt die Fundstellen.</p>'},
  bezuege: {titel: 'Bezüge: so lesen',
    text: '<p>Alle Texte liegen nacheinander auf einer Linie, von der Botschaft bis zu den Bundesbeschlüssen. Jeder Bogen verbindet zwei Stellen, von denen die eine auf die andere verweist.</p><p>Mit <b>+</b> und <b>−</b> vergrössern. Ein Klick auf einen Bogen zeigt beide Stellen im Wortlaut.</p>'},
  umsetz: {titel: 'Umsetzung: so lesen',
    text: '<p>Links die Abkommen und Protokolle mit der EU, in der Mitte die Bundesbeschlüsse, die sie genehmigen, rechts die Bundesgesetze, die dafür geändert oder neu geschaffen werden.</p><p>Jede Linie ist eine Zuordnung, die im Text steht.</p>'},
  tabelle: {titel: 'Tabelle: so lesen',
    text: '<p>Alle Dokumente mit Seiten, Wörtern und Anzahl Texte, darunter die Bundesgesetze, die sich ändern.</p><p>Ein Klick auf einen Namen zeigt das Dokument in der Ansicht «Umfang».</p>'},
};
const RUNDGANG = [            // kurz: ein Gedanke je Schritt, Einzelheiten in den Infoblasen
  {sel: '#schritt-1', titel: 'Hier beginnen: suchen und auswählen',
    text: '<p>Geben Sie ein Wort ein, zum Beispiel «Lohnschutz», oder wählen Sie ein Thema. Die passenden Stellen werden in allen Ansichten markiert.</p>'},
  {sel: '#schritt-2', titel: 'Ansicht wählen',
    text: '<p>Fünf Ansichten zeigen dasselbe Paket. Unter jedem Namen steht die Frage, die sie beantwortet.</p>'},
  {sel: '#ansicht', titel: 'In die Ansicht klicken',
    text: '<p>Ein Klick auf ein Feld vergrössert es oder öffnet den Text. Der Knopf <b>i</b> rechts oben erklärt jede Ansicht.</p>'},
  {sel: '#schritt-3', titel: 'Text lesen',
    text: '<p>Hier steht der Wortlaut des geöffneten Texts, mit Fundstelle im amtlichen PDF und den Verweisen zu anderen Texten.</p><p>Französisch oder Italienisch: oben unter <b>Sprache der Texte</b>.</p>'},
  {sel: '#grafikAuf', titel: 'Als Bild speichern',
    text: '<p>Jede Ansicht lässt sich als Bild speichern, für Social Media, Präsentation oder Bericht. Den Rundgang finden Sie wieder oben im Kopf.</p>'},
];

/* ---------- Infoblasen ---------- */
const blase = $('#hilfeblase');
let offenVon = null, perKlick = false, zuZeit = null, aufZeit = null;
function lage(btn) {
  const r = btn.getBoundingClientRect(), w = blase.offsetWidth, h = blase.offsetHeight;
  const left = Math.min(innerWidth - w - 8, Math.max(8, r.right - w));
  let top = r.bottom + 8;
  if (top + h > innerHeight - 8 && r.top - h - 8 > 8) top = r.top - h - 8;
  blase.style.left = left + 'px'; blase.style.top = Math.max(8, top) + 'px';
}
function zeige(btn, klick) {
  const h = HILFE[btn.dataset.hilfe]; if (!h) return;
  clearTimeout(zuZeit);
  if (offenVon && offenVon !== btn) offenVon.setAttribute('aria-expanded', 'false');
  $('#hilfeblase-titel').textContent = h.titel; $('#hilfeblase-text').innerHTML = h.text;
  blase.hidden = false; lage(btn);
  btn.setAttribute('aria-expanded', 'true');
  offenVon = btn; perKlick = klick;
}
function verstecke(fokusZurueck) {
  clearTimeout(zuZeit); clearTimeout(aufZeit);
  if (!offenVon) return;
  blase.hidden = true; offenVon.setAttribute('aria-expanded', 'false');
  if (fokusZurueck) offenVon.focus();
  offenVon = null; perKlick = false;
}
document.addEventListener('click', ev => {
  const b = ev.target.closest('.info[data-hilfe]');
  if (b) {
    ev.preventDefault();
    if (offenVon === b && perKlick) { verstecke(false); return; }
    zeige(b, true);
    if (ev.detail === 0) blase.focus();          // mit der Tastatur geöffnet: Fokus in die Blase, damit Bildschirmleser sie vorlesen
    return;
  }
  if (ev.target.closest('.hb-zu')) { verstecke(true); return; }
  if (offenVon && !ev.target.closest('#hilfeblase')) verstecke(false);
});
document.addEventListener('pointerover', ev => {
  if (ev.pointerType !== 'mouse') return;
  const b = ev.target.closest('.info[data-hilfe]');
  if (b) { clearTimeout(zuZeit); if (offenVon !== b) { clearTimeout(aufZeit); aufZeit = setTimeout(() => zeige(b, false), 220); } return; }
  if (ev.target.closest('#hilfeblase')) clearTimeout(zuZeit);
});
document.addEventListener('pointerout', ev => {
  if (ev.pointerType !== 'mouse' || perKlick) return;
  const von = ev.target.closest('.info[data-hilfe], #hilfeblase'); if (!von) return;
  const nach = ev.relatedTarget && ev.relatedTarget.closest && ev.relatedTarget.closest('.info[data-hilfe], #hilfeblase');
  if (nach === von || (nach && (nach === offenVon || nach.id === 'hilfeblase'))) return;
  clearTimeout(aufZeit); clearTimeout(zuZeit); zuZeit = setTimeout(() => verstecke(false), 350);
});
document.addEventListener('focusin', ev => {
  const b = ev.target.closest && ev.target.closest('.info[data-hilfe]');
  if (b && ev.target.matches(':focus-visible') && offenVon !== b) zeige(b, false);
});
document.addEventListener('keydown', ev => { if (ev.key === 'Escape' && offenVon) { ev.preventDefault(); verstecke(true); } });
addEventListener('resize', () => { if (offenVon) lage(offenVon); });
addEventListener('scroll', () => { if (offenVon) { if (perKlick) lage(offenVon); else verstecke(false); } }, {passive: true, capture: true});

/* ---------- Rundgang ---------- */
const rg = $('#rundgang'), ring = $('#rg-ring'), karte = $('#rg-karte');
let k = 0, aktiv = false, zurueckFokus = null;
function platziere() {
  const el = $(RUNDGANG[k].sel); if (!el) return;
  const r = el.getBoundingClientRect(), pad = 8;
  const x0 = Math.max(4, r.left - pad), y0 = Math.max(4, r.top - pad), x1 = Math.min(innerWidth - 4, r.right + pad), y1 = Math.min(innerHeight - 4, r.bottom + pad);
  Object.assign(ring.style, {left: x0 + 'px', top: y0 + 'px', width: Math.max(0, x1 - x0) + 'px', height: Math.max(0, y1 - y0) + 'px'});
  const w = karte.offsetWidth, h = karte.offsetHeight, schmal = innerWidth < 700;
  let left = Math.min(innerWidth - w - 12, Math.max(12, x0)), top;
  if (innerHeight - y1 > h + 20) top = y1 + 12;                 // unter dem Bereich
  else if (y0 > h + 20) top = y0 - h - 12;                     // darüber
  else if (!schmal && innerWidth - x1 > w + 24) { left = x1 + 12; top = Math.max(12, Math.min(innerHeight - h - 12, y0)); }   // daneben
  else if (!schmal && x0 > w + 24) { left = x0 - w - 12; top = Math.max(12, Math.min(innerHeight - h - 12, y0)); }
  else top = innerHeight - h - 12;                              // unten über dem Bereich
  karte.style.left = left + 'px'; karte.style.top = top + 'px';
}
function zeigeSchritt(n) {
  k = Math.max(0, Math.min(RUNDGANG.length - 1, n));
  const s = RUNDGANG[k], el = $(s.sel);
  $('#rg-stufe').textContent = `Schritt ${k + 1} von ${RUNDGANG.length}`;
  $('#rg-titel').textContent = s.titel; $('#rg-text').innerHTML = s.text;
  $('#rg-zurueck').disabled = k === 0;
  $('#rg-weiter').textContent = k === RUNDGANG.length - 1 ? 'Fertig' : 'Weiter';
  if (el) {
    const r = el.getBoundingClientRect(), gross = r.height > innerHeight * 0.6;
    if (el.id !== 'grafikAuf') el.scrollIntoView({behavior: ruhig() ? 'auto' : 'smooth', block: gross ? 'start' : 'center'});
  }
  platziere();
  setTimeout(platziere, ruhig() ? 0 : 450);
  $('#rg-titel').focus();
}
function starte() {
  verstecke(false);
  zurueckFokus = document.activeElement;
  $('#rundgang-angebot').hidden = true;
  rg.hidden = false; aktiv = true; document.body.classList.add('rundgang-offen');
  zeigeSchritt(0);
}
function beende() {
  rg.hidden = true; aktiv = false; document.body.classList.remove('rundgang-offen');
  merke('vs-rundgang', 'gesehen');
  if (zurueckFokus && zurueckFokus.focus) zurueckFokus.focus();
}
$('#rg-weiter').onclick = () => { if (k === RUNDGANG.length - 1) beende(); else zeigeSchritt(k + 1); };
$('#rg-zurueck').onclick = () => zeigeSchritt(k - 1);
$('#rg-ende').onclick = beende;
document.addEventListener('click', ev => { if (ev.target.closest('#rundgang-auf, [data-rundgang], #rundgang-ja')) starte(); });
$('#rundgang-nein').onclick = () => { $('#rundgang-angebot').hidden = true; merke('vs-rundgang', 'abgelehnt'); };
document.addEventListener('keydown', ev => {
  if (!aktiv) return;
  if (ev.key === 'Escape') { ev.preventDefault(); beende(); return; }
  if (ev.key === 'Tab') {                 // Fokus bleibt in der Karte
    const f = [...karte.querySelectorAll('button:not([disabled])')];
    const i = f.indexOf(document.activeElement);
    if (ev.shiftKey && i <= 0) { ev.preventDefault(); f[f.length - 1].focus(); }
    else if (!ev.shiftKey && i === f.length - 1) { ev.preventDefault(); f[0].focus(); }
  }
});
addEventListener('resize', () => { if (aktiv) platziere(); });
addEventListener('scroll', () => { if (aktiv) platziere(); }, {passive: true});
$('#rg-titel').tabIndex = -1;

// Beim ersten Besuch einmal anbieten, nie aufdrängen
if (!merke('vs-rundgang') && !location.hash) $('#rundgang-angebot').hidden = false;
window.VSHilfe = {starte, beende, zeige: key => { const b = document.querySelector(`.info[data-hilfe="${key}"]`); if (b) zeige(b, true); }};
})();
