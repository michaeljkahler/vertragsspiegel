"""Teilt die Texte des Pakets in Zettel: ein Zettel je Artikel, Anhangsteil oder Abschnitt der Botschaft.

Alle Werke:                   python3 scripts/gliedern.py
Gliederung eines Werks:       python3 scripts/gliedern.py --zeigen 632
Andere Sprache:               python3 scripts/gliedern.py --sprache fr

Liest daten/text/<sprache>/<nr>.txt (von laden.py), schreibt daten/zettel.json.

Ablauf je Werk:
  1. Seiten zerlegen: Kopfzeilen, Fusszeilen und Fussnoten vom Rumpf trennen. Fussnoten sind im
     ganzen Werk fortlaufend nummeriert; ein Fussnotenblock am Seitenende wird nur anerkannt, wenn
     seine Nummern lückenlos an die letzte Fussnote anschliessen. Die Fussnotenzeichen im Text
     werden gesucht und als hochgestellte Ziffern gesetzt; die Fussnote kommt zum Zettel mit dem Zeichen.
  2. Gliedern:
     a. Botschaft: jede Ziffer des Inhaltsverzeichnisses wird im Text gesucht und ist ein Zettel,
        dazu Vorspann, Übersicht, Inhaltsverzeichnis, Abkürzungsverzeichnis und Anhänge.
     b. Übrige Werke: Teile (Anhang, Anlage, Beilage, Protokoll, Erklärung) und darin Artikel.
        Artikel in Teilen werden dem Teil zugeordnet, nicht dem Hauptteil (Fehlerbild 1).
        In Änderungsartikeln («Änderungen des Abkommens») und Änderungslisten der Bundesbeschlüsse
        bilden die nummerierten Ziffern eigene Zettel, die zitierten Artikel darin Unterzettel.
  3. Wörter: Zettel zählen Wortlaut und Fussnoten. Pro Werk wird dieselbe Zählung unabhängig über
     den ganzen Rumpf gemacht; pruefen.py vergleicht beide (Projektbrief Ziffer 9.1).
"""
import collections
import json
import re
import sys
from datetime import date

from paket import (DATEN, DOKUMENTE, GRUPPEN, fliesstext, hoch, quellen, text_pfad,
                   utf8_ausgabe, woerter)

# ------------------------------------------------------------------ Seiten zerlegen

KOPF_MARKE = re.compile(r'«%ASFF_YYYY_ID»|\bAS 202\d\s*$|\bBBl(?: 202\d)?(?: \d+)?\s*$')
FUSS = re.compile(r'^\s*(?:\d+\s*/\s*\d+|20\d\d-[\d.…]+(?:\s+(?:«%ASFF_YYYY_ID»|AS 20\d\d|BBl 20\d\d(?: \d+)?))?'
                  r'|SR\s*[.…]+|AS 202\d|«%ASFF_YYYY_ID»)\s*$')
FN_START = re.compile(r'^ ?(\d{1,4})(\s+)(\S.*)$')
VOR_MARKE = r'(?:(?<=[A-Za-zÄÖÜäöüß\)\]»«.,;:…’\'])|(?<=(?<!\d)(?:1[89]|20)\d\d))'


def norm(s):
    return ' '.join(s.split())


def kopf_block(zeilen):
    """Indizes der laufenden Kopfzeile oben auf einer Seite: die Zeile mit der Druckmarke
    («%ASFF_YYYY_ID», «AS 2026», «BBl 2026 …») und die direkt folgenden Zeilen bis zur ersten Leerzeile."""
    nicht_leer = [i for i, z in enumerate(zeilen) if z.strip()][:3]
    marke = next((i for i in nicht_leer if KOPF_MARKE.search(zeilen[i]) and len(norm(zeilen[i])) < 100), None)
    if marke is None:
        return None, []
    folge, j = [], marke + 1
    while j < len(zeilen) and zeilen[j].strip() and len(folge) < 3:
        folge.append(j)
        j += 1
    return marke, folge


def kopf_menge(seiten):
    """Zeilen unter der Druckmarke, die auf mindestens zwei Seiten wiederkehren (laufende Kopfzeile).
    Bei Werken mit zwei Seiten gilt die einzige Folgeseite."""
    zaehl, oben = collections.Counter(), collections.Counter()
    for s in seiten[1:]:
        zeilen = s.split('\n')
        _, folge = kopf_block(zeilen)
        zaehl.update({norm(zeilen[j]) for j in folge})
        oben.update({norm(z) for z in [z for z in zeilen if z.strip()][:2]})
    grenze = 1 if len(seiten) <= 2 else 2
    folge = {z for z, c in zaehl.items() if c >= grenze}
    # Kopfzeile ohne Druckmarke (643, 644): die obersten Zeilen auf mindestens der Hälfte der Folgeseiten
    ohne = {z for z, c in oben.items() if c >= 2 and c >= 0.5 * (len(seiten) - 1)}
    return folge, ohne


class Zeile:
    __slots__ = ('seite', 'text', 'fn', 'anfang')

    def __init__(self, seite, text):
        self.seite, self.text, self.fn, self.anfang = seite, text, [], False


# Zeichen mit Leerschlag davor («Gesundheit2030 41 so-»): nur nach einem Wort, das keine Zahl einleitet
KEIN_ZEICHEN_DAVOR = re.compile(
    r'^(?:Art|Abs|Nr|Nrn|Ziff|S|Bst|Rz|Rn|N|Kap|Fn|Anm|Bd|Jg|Ziffer|Ziffern|Artikel|Artikeln|Absatz|Absätze|'
    r'Nummer|Randziffer|Seite|Seiten|vom|bis|und|oder|von|zu|ABl|L|C|SR|AS|BBl|BGE|E|Anhang|Anhänge|Tabelle|'
    r'Abbildung|Grafik|Kapitel|Teil|Protokoll|Fr|Mio|Mrd|CHF|EUR|USD|Prozent|rund|etwa|ca|über|unter|mindestens|'
    r'höchstens|Jahr|Jahre|Jahren|im|am|in|auf|mit|für|ab|Stufe|Phase|Version|Gruppe|Klasse|Kategorie|Punkt|'
    r'Paragraf|Rubrik|Position|Code|Nummern|Buchstabe|Satz|Unterabsatz|Sätze)\W*$', re.I)


def marke_suchen(zeilen, k, ab):
    """Fussnotenzeichen k in den Rumpfzeilen einer Seite suchen, ab Position ab=(zeile, spalte).
    Erst angehängt an Wort, Satzzeichen oder Jahreszahl («BV)1», «20263»), sonst mit Leerschlag davor."""
    kz = str(k)
    angehaengt = re.compile(r'(?<!\d)(\d*)' + re.escape(kz) + r'(?!\d)')
    lose = re.compile(r'(\S+) (' + re.escape(kz) + r')(?=[\s,;.:)»]|$)')
    zi, sp = ab
    for i in range(zi, len(zeilen)):
        t = zeilen[i].text
        if len(t) - len(t.lstrip()) >= 4:
            toks = t.split()
            if toks and all(x.isdigit() for x in toks) and kz in toks:      # Zeichen allein auf der Zeile
                m = re.compile(r'(?<!\d)' + kz + r'(?!\d)').search(t, sp if i == zi else 0)
                if m:
                    return i, m.start(), m.end()
            m = re.match(r'^\s{8,}(' + kz + r')\s{2,}\S', t)              # Zeichen in einer Tabellenspalte
            if m:
                return i, m.start(1), m.end(1)
        for m in angehaengt.finditer(t, sp if i == zi else 0):
            a = m.start() + len(m.group(1))
            vor = t[m.start() - 1] if m.start() > 0 else ' '
            ziffern = m.group(1)
            if not ziffern:
                ok = bool(re.match(r"[A-Za-zÄÖÜäöüß)\]»«.,;:…’'€%]", vor))        # «BV)1», «FZA98», «Mrd. €541»
                if vor in '.,' and m.start() > 1 and t[m.start() - 2].isdigit():
                    ok = False                                                  # «1.2», «4,5»
            else:
                ok = (re.fullmatch(r'(1[89]|20)\d\d', ziffern) is not None and not vor.isdigit()) \
                    or (vor == '/' and len(ziffern) <= 4)                       # «20263», «2024/782317»
            if ok:
                return i, a, m.end()
    for i in range(zi, len(zeilen)):
        for m in lose.finditer(zeilen[i].text, sp if i == zi else 0):
            davor = m.group(1)
            wort = re.search(r'[A-Za-zÄÖÜäöüß).,;:»]$', davor) or (re.search(r'[A-Za-zÄÖÜäöüß]', davor) and davor[-1].isdigit())
            zahl = re.fullmatch(r'(1[89]|20)\d\d[,.;:)]?|\d{2,4}/\d{1,4}[,.;:)]?', davor)   # «von 1994 110», «2018/958 271.»
            if (wort or zahl) and not KEIN_ZEICHEN_DAVOR.match(davor):
                return i, m.start(2), m.end(2)
    return None


def zerlegen(roh, nr):
    """Rumpfzeilen (mit Seitenzahl), Fussnoten {laufend: (seite, nummer, text)}, entfernte Kopf-/Fusszeilen."""
    seiten = roh.split('\f')
    if seiten and not seiten[-1].strip():
        seiten = seiten[:-1]
    kopf, kopf_ohne = kopf_menge(seiten)
    rumpf, fussnoten, entfernt = [], {}, []
    naechste = 1
    ohne_marke, auffaellig = [], []
    for si, s in enumerate(seiten, 1):
        zeilen = s.split('\n')
        # Kopf: Druckmarke und die wiederkehrenden Zeilen darunter
        if si > 1:
            marke, folge = kopf_block(zeilen)
            if marke is not None:
                weg = [marke] + [j for j in folge if norm(zeilen[j]) in kopf]
                weg = [j for j in weg if j <= marke + len(weg) - 1]          # nur zusammenhängend ab der Marke
            else:
                weg = []
                for j in [j for j, z in enumerate(zeilen) if z.strip()][:3]:
                    if norm(zeilen[j]) not in kopf_ohne:
                        break
                    weg.append(j)
            entfernt.extend(zeilen[j] for j in weg)
            zeilen = [z for j, z in enumerate(zeilen) if j not in weg]
        # Fuss: Seitenzahl, Druckvermerk, Platzhalter
        while zeilen and (not zeilen[-1].strip() or FUSS.match(zeilen[-1])):
            if zeilen[-1].strip():
                entfernt.append(zeilen[-1])
            zeilen.pop()
        rest = []
        for z in zeilen:
            if re.match(r'^\s*SR\s*[.…]+\s*$', z):        # SR-Platzhalter auf der ersten Seite
                entfernt.append(z)
            else:
                rest.append(z)
        zeilen = rest
        # Fussnotenblock am Seitenende: erst streng fortlaufend, sonst mit kleinen Sprüngen (Fehler der Vorlage)
        kand = [(i, int(m.group(1))) for i, z in enumerate(zeilen) if (m := FN_START.match(z))]
        start, streng = None, True
        for streng in (True, False):
            for j, (i, k) in enumerate(kand):
                folge = [kk for _, kk in kand[j:]]
                if streng:
                    if k != naechste or folge != list(range(naechste, naechste + len(folge))):
                        continue
                else:
                    if not naechste <= k <= naechste + 3 or any(not 0 <= b - a <= 3 for a, b in zip(folge, folge[1:])):
                        continue
                # Im Block ist jede Zeile eine Fussnote oder eingerückt (Folgezeile einer Fussnote)
                if any(x.strip() and not FN_START.match(x) and not x.startswith('  ') for x in zeilen[i:]):
                    continue
                # Das erste Zeichen steht im Text darüber, oder der Block ist kurz und folgt auf eine Leerzeile
                davor = [Zeile(si, x) for x in zeilen[:i]]
                voll = [x for x in zeilen if x.strip()]
                kurz = len([x for x in zeilen[i:] if x.strip()]) <= 0.5 * len(voll)
                marke = marke_suchen(davor, k, (0, 0))
                if marke or (streng and kurz and (i == 0 or not zeilen[i - 1].strip())):
                    start = i
                    break
            if start is not None:
                break
        # Wiederholte Nummer direkt vor dem Block (Vorlage: «37», «37», «38») gehört dazu
        while start is not None and not streng is False:
            j = start - 1
            while j >= 0 and not zeilen[j].strip():
                j -= 1
            m = FN_START.match(zeilen[j]) if j >= 0 else None
            if m and int(m.group(1)) == naechste - 1:
                start, streng = j, False
            else:
                break
        block = zeilen[start:] if start is not None else []
        zeilen = zeilen[:start] if start is not None else zeilen
        seiten_rumpf = [Zeile(si, z) for z in zeilen]
        erste = next((z for z in seiten_rumpf if z.text.strip()), None)
        if erste:
            erste.anfang = True
        # Fussnoten der Seite einlesen; Schlüssel ist eine laufende Nummer, die Nummer im Werk bleibt Bezeichnung
        neue, cur = [], None
        for z in block:
            m = FN_START.match(z)
            k = int(m.group(1)) if m else None
            if m and (k == naechste or (not streng and naechste - 1 <= k <= naechste + 3 and (cur is None or k >= cur[1]))):
                if k != naechste:
                    auffaellig.append(f'S. {si}: Fussnote {k} nach {naechste - 1}')
                laufend = len(fussnoten) + len(neue) + 1
                cur = [laufend, k, [m.group(3)]]
                neue.append(cur)
                naechste = k + 1
            elif cur and z.strip():
                cur[2].append(z)
        # Zeichen im Rumpf suchen und hochstellen
        pos = (0, 0)
        treffer = []
        for laufend, k, zl in neue:
            fussnoten[laufend] = (si, k, fliesstext(zl))
            t = marke_suchen(seiten_rumpf, k, pos)
            if t is None:
                ohne_marke.append(k)
                ziel = next((z for z in reversed(seiten_rumpf) if z.text.strip()), None)
                if ziel:
                    ziel.fn.append(laufend)
                continue
            zi, a, b = t
            treffer.append((zi, a, b, k))
            seiten_rumpf[zi].fn.append(laufend)
            pos = (zi, b)
        for zi, a, b, k in sorted(treffer, key=lambda x: (x[0], -x[1])):
            z = seiten_rumpf[zi]
            z.text = z.text[:a] + hoch(k) + z.text[b:]
        rumpf.extend(seiten_rumpf)
    return dict(rumpf=rumpf, fussnoten=fussnoten, kopf_fuss=entfernt, seiten=len(seiten),
                ohne_marke=ohne_marke, auffaellig=auffaellig)


# ------------------------------------------------------------------ Zettel

class Bau:
    """Sammelt Zettel eines Werks."""

    def __init__(self, nr):
        self.nr = nr
        self.zettel = []
        self.cur = None
        self.slugs = set()

    def oeffnen(self, art, slug, label, titel='', nummer=None, pfad=(), zitiert=False, kopf=None):
        vorher = self.cur
        self.schliessen()
        z = dict(art=art, slug=slug, label=label, titel=titel, nummer=nummer, pfad=list(pfad),
                 zitiert=zitiert, zeilen=[])
        # Ein Zettel, der nur aus einer Überschrift besteht, geht im folgenden auf
        if vorher is not None and vorher['art'] in ('gliederung', 'teil') and art not in ('teil',) \
                and woerter(fliesstext(z_.text for z_ in vorher['zeilen'])) <= 15 and self.zettel \
                and self.zettel[-1] is vorher:
            self.zettel.pop()
            z['zeilen'] = vorher['zeilen']
        self.cur = z
        return z

    def schliessen(self):
        if self.cur is not None and any(z.text.strip() for z in self.cur['zeilen']):
            self.zettel.append(self.cur)
        self.cur = None

    def zeile(self, z):
        if self.cur is None:
            self.oeffnen('ingress', 'ingress', 'Titel und Ingress')
        self.cur['zeilen'].append(z)


def eindeutig(bau, slug):
    s, i = slug, 2
    while s in bau.slugs:
        s = f'{slug}_{i}'
        i += 1
    bau.slugs.add(s)
    return s


def slugify(s):
    return re.sub(r'[^0-9a-zäöü]+', '_', s.lower()).strip('_')


ROEMISCH = r'[IVXLC]+'
TEIL_RECHTS = re.compile(r'^(Anhang|ANHANG|Anlage|ANLAGE|Beilage)\b\s*([^\s.;,]{0,12})?(.{0,60})$')
SEITENKOPF = re.compile(r'^(Gemeinsame Erklärung|Einseitige Erklärung|Erklärung|Protokoll)\b(.*)$')
GLIED = re.compile(
    r'^(?:(Teil|Titel|Kapitel|Abschnitt|Unterabschnitt)\s+(' + ROEMISCH + r'|\d+[a-z]?|[A-Z])\b(?:\s*[:.–-]\s*|\s{2,}|\s*$)(.*)'
    r'|(\d+[a-z]?)\.\s+(Teil|Titel|Kapitel|Abschnitt|Unterabschnitt)\b\s*[:.]?\s*(.*))$')
STUFE = {'Teil': 0, 'Titel': 1, 'Kapitel': 2, 'Abschnitt': 3, 'Unterabschnitt': 4, 'roemisch': 5}
ZUSATZ = r'(?:Abs\.|Bst\.|Ziff\.|Sachüberschrift|Einleitungssatz|Gliederungstitel|Fussnote|Randtitel|Satz|Aufgehoben|und\b|erster|zweiter|dritter|Titel|Schlussbemerkung|Anmerkung)'
ARTIKEL = re.compile(
    r'^(\s*)(«?)Art\.\s+((?:' + ROEMISCH + r'\.\s?)?\d+[a-z]*(?:bis|ter|quater|quinquies|sexies|septies|octies|novies|decies)?)'
    r'(?:(\s{2,})(\S.*?)|\s+(' + ZUSATZ + r'.*?)|\s*)$')
ZIFFER = re.compile(r'^(\d{1,2})\.\s+(\S.*)$')
GESETZARTIG = re.compile(r'gesetz|Gesetz|gesetzbuch|buch\b|recht\b|Bundesbeschluss|ordnung|Verordnung')
ROEM_ALLEIN = re.compile(r'^\s*(I|II|III|IV|V|VI|VII|VIII|IX|X)\s*$')
CELEX_EINTRAG = re.compile(r'^(?:(\d{1,3}[a-z]?)\.|\((\d{1,3}[a-z]?)\))\s+(3\d{4}\s?[A-Z]\s?\d{4}\S*?|3\d{4}[A-Z]\d{4,5}\S*?)\s*:?\s+')


def absatz(zeilen, i, n):
    """Zeile i und die direkt folgenden nicht leeren Zeilen (höchstens n) als ein Satz ohne Trennstriche."""
    teile = [zeilen[i].text]
    for j in range(i + 1, min(i + n, len(zeilen))):
        if not zeilen[j].text.strip():
            break
        teile.append(zeilen[j].text)
    return ohne_hoch(fliesstext(teile).replace('\n', ' '))


def titel_fortsetzung(zeilen, i, spalte):
    """Folgezeilen einer Artikelüberschrift: gleich weit eingerückt wie der Titel."""
    teile, j = [], i + 1
    while j < len(zeilen) and spalte > 4:
        t = zeilen[j].text
        if not t.strip():
            break
        einzug = len(t) - len(t.lstrip())
        if abs(einzug - spalte) <= 1 and not re.match(r'^\s*(\d+|[a-z]{1,4}\.)\s', t):
            teile.append(t.strip())
            j += 1
        else:
            break
    return teile


def ohne_hoch(s):
    return re.sub(r'[⁰¹²³⁴⁵⁶⁷⁸⁹]+', '', s)


def gliedern_werk(nr, typ, z):
    """Gliederung für Abkommen, Protokolle, Bundesbeschlüsse und Erklärungen."""
    zeilen = z['rumpf']
    bau = Bau(nr)
    teile = []             # [(art, label, slug)]
    glied = {}             # Stufe -> label
    zaehler = collections.Counter()
    tiefe = 0              # Zitatebene «…»
    aend = None            # {'art': 'protokoll'|'erlasse', 'erwartet': k, 'ziffer': slug, 'label': ...}
    teil_aenderung = False
    artikel_slug, artikel_label = None, None
    beilage_seit = -99
    bb = typ == 'Bundesbeschluss'

    def pfad():
        p = [t[1] for t in teile] + [glied[k] for k in sorted(glied)]
        return p

    def teil_slug():
        return '/'.join(t[2] for t in teile)

    def basis(*rest):
        return '/'.join(x for x in [teil_slug(), *rest] if x)

    for i, zl in enumerate(zeilen):
        t = zl.text
        s = t.strip()
        if not s:
            bau.zeile(zl)
            continue
        einzug = len(t) - len(t.lstrip())
        sauber = ohne_hoch(s)

        # --- Teile: rechtsbündige Überschriften
        m = TEIL_RECHTS.match(sauber)
        if einzug >= 20 and m and not s.startswith('«'):
            wort, nummer = m.group(1).capitalize(), (m.group(2) or '').strip()
            if wort == 'Anhang' and not nummer and i - beilage_seit <= 6:
                bau.zeile(zl)                           # «Anhang» unter «Beilage zum …»
                continue
            label = f'{wort} {nummer}'.strip() if wort != 'Beilage' else sauber
            if wort == 'Anhang':
                teile = []
            elif wort == 'Anlage':
                teile = [x for x in teile if x[0] == 'Anhang'][:1]
            else:
                teile = [x for x in teile if x[0] == 'Anhang'][:1]
                beilage_seit = i
            kurz = {'Anhang': 'anh', 'Anlage': 'anl', 'Beilage': 'beil'}[wort]
            slug = eindeutig(bau, '/'.join([teil_slug(), kurz + ('_' + slugify(nummer) if nummer and wort != 'Beilage' else '')]).strip('/'))
            teile.append((wort, label, slug.rsplit('/', 1)[-1]))
            glied, tiefe, aend, teil_aenderung, artikel_slug = {}, 0, None, False, None
            bau.oeffnen('teil', slug, label, pfad=pfad()[:-1])
            bau.zeile(zl)
            continue

        # --- Teile: Protokoll oder Erklärung oben auf einer Seite
        m = SEITENKOPF.match(sauber)
        if zl.anfang and zl.seite > 1 and einzug <= 3 and m:
            kopfzeilen = [sauber]
            for j in range(i + 1, min(i + 4, len(zeilen))):
                if not zeilen[j].text.strip():
                    break
                kopfzeilen.append(ohne_hoch(zeilen[j].text.strip()))
            titel = norm(' '.join(kopfzeilen))
            if m.group(1) == 'Protokoll':
                if len(kopfzeilen) > 1 and kopfzeilen[0] == 'Protokoll' and kopfzeilen[1].startswith('Protokoll'):
                    titel = norm(' '.join(kopfzeilen[1:]))
                verschachtelt = 'zu Anhang' in titel
                mn = re.match(r'^Protokoll\s+(' + ROEMISCH + r'|\d+)\b', sauber)
                zaehler['prot'] += 1
                kurz = 'prot_' + (slugify(mn.group(1)) if mn else str(zaehler['prot']))
                teile = ([x for x in teile if x[0] == 'Anhang'][:1] if verschachtelt else [])
                wort = 'Protokoll'
            else:
                zaehler['erkl'] += 1
                kurz, teile, wort = f"erkl_{zaehler['erkl']}", [], 'Erklärung'
            slug = eindeutig(bau, '/'.join(x for x in [teil_slug(), kurz] if x))
            label = titel if len(titel) <= 140 else titel[:137] + '…'
            teile.append((wort, label, slug.rsplit('/', 1)[-1]))
            glied, tiefe, aend, teil_aenderung, artikel_slug = {}, 0, None, False, None
            bau.oeffnen('teil', slug, label, titel=titel, pfad=pfad()[:-1])
            bau.zeile(zl)
            continue

        # --- Schlussformel
        if einzug <= 3 and s.startswith('Geschehen zu'):
            slug = eindeutig(bau, basis('schluss'))
            aend, artikel_slug = None, None
            bau.oeffnen('schluss', slug, 'Schlussformel', pfad=pfad())
            bau.zeile(zl)
            continue

        # --- Gliederungstitel (Teil I, 1. Kapitel, Abschnitt A …)
        m = GLIED.match(sauber)
        in_aenderung = teil_aenderung or bool(aend and aend['art'] == 'erlasse')
        if einzug <= 3 and m and len(sauber) <= 110 and not in_aenderung:   # in Änderungen: Titel des geänderten Erlasses
            if m.group(1):
                stufe, nummer, rest = m.group(1), m.group(2), m.group(3)
            else:
                stufe, nummer, rest = m.group(5), m.group(4), m.group(6)
            label = norm(f'{stufe} {nummer}' + (f': {rest}' if rest else '')) if m.group(1) else norm(sauber)
            st = STUFE[stufe]
            glied = {k: v for k, v in glied.items() if k < st}
            glied[st] = label
            slug = eindeutig(bau, basis(slugify(f'{stufe}_{nummer}')))
            artikel_slug = None
            if aend and aend['art'] == 'protokoll':
                aend = None
            bau.oeffnen('gliederung', slug, label, pfad=pfad()[:-1])
            bau.zeile(zl)
            continue

        # --- Römische Gliederung in Änderungserlassen (I, II, III)
        if bb and teile and ROEM_ALLEIN.match(s):
            st = STUFE['roemisch']
            glied = {k: v for k, v in glied.items() if k < st}
            glied[st] = f'Ziff. {s}'
            slug = eindeutig(bau, basis('ziff_' + slugify(s)))
            aend, artikel_slug = None, None
            bau.oeffnen('gliederung', slug, f'Ziff. {s}', pfad=pfad()[:-1])
            bau.zeile(zl)
            continue

        # --- Ziffern in Änderungsartikeln und Änderungslisten
        m = ZIFFER.match(sauber)
        if einzug <= 2 and m:
            k = int(m.group(1))
            folge = absatz(zeilen, i, 3)
            ist_ziffer = False
            if aend and aend['art'] == 'protokoll' and k == aend['erwartet']:
                ist_ziffer = True
            elif bb and teile and k == (aend['erwartet'] if aend and aend['art'] == 'erlasse' else 1) \
                    and GESETZARTIG.search(folge[:120]) and not re.match(r'^\d+\.\s+(Kapitel|Abschnitt)', folge):
                if not aend:
                    aend = dict(art='erlasse', erwartet=1)
                ist_ziffer = True
            if ist_ziffer:
                tiefe = 0
                eltern = artikel_slug if aend['art'] == 'protokoll' else basis()
                slug = eindeutig(bau, '/'.join(x for x in [eltern, f'ziff_{k}'] if x))
                titel = folge[len(m.group(1)) + 1:].strip()
                titel = re.split(r'(?<=[a-zäöü\)])[:;]\s|\s(?=Art\.\s)', titel)[0][:160]
                p = pfad() + ([artikel_label] if aend['art'] == 'protokoll' and artikel_label else [])
                aend['erwartet'] = k + 1
                aend['ziffer'], aend['label'] = slug, f'Ziff. {k}'
                bau.oeffnen('ziffer', slug, f'Ziff. {k} {titel}'.strip(), titel=titel, nummer=str(k), pfad=p)
                bau.zeile(zl)
                continue

        # --- Rechtsakt der Union in einer Liste (617, 634: «1. 31977 L 0486: Richtlinie …»)
        m = CELEX_EINTRAG.match(sauber)
        if not bb and teile and einzug <= 6 and m:
            celex = re.sub(r'\s+', '', m.group(3))
            titel = CELEX_EINTRAG.sub('', absatz(zeilen, i, 3).strip(), count=1)
            titel = re.split(r'\s\(ABl\.|,\s(?:zuletzt|geändert|berichtigt)', titel)[0][:200]
            slug = eindeutig(bau, basis('ra_' + slugify(celex)))
            bau.oeffnen('rechtsakt', slug, f'Nr. {m.group(1) or m.group(2)} {titel}'.strip(), titel=titel, nummer=celex, pfad=pfad())
            bau.zeile(zl)
            continue

        # --- Artikel
        if einzug <= 3 and re.match(r'^\d\.\s+Art\.\s', sauber):
            sauber = re.sub(r'^\d\.\s+', '', sauber)                       # Vorlage 638: «1. Art. 1»
        m = ARTIKEL.match(sauber if einzug <= 3 else s)
        if m is None and 3 < einzug <= 30:
            m2 = ARTIKEL.match(s)
            if m2 and not m2.group(5):                   # eingerückt nur «Art. 335l» oder «Art. 2 Ziff. 3»
                m = m2
        if m and (einzug <= 3 or not m.group(5)):
            zit = bool(m.group(2)) or tiefe > 0
            nummer = re.sub(r'\s+', '', m.group(3))
            zusatz = norm(m.group(6) or '')
            titel = ohne_hoch(norm(m.group(5) or ''))
            if titel:
                spalte = len(t) - len(t.lstrip()) + t.lstrip().find(m.group(5)) if m.group(5) in t else 0
                titel = norm(' '.join([titel] + [ohne_hoch(x) for x in titel_fortsetzung(zeilen, i, spalte)]))
            aenderung = bool(aend and aend['art'] == 'erlasse') or teil_aenderung
            if zit and aend and aend['art'] == 'protokoll':
                eltern, p = aend['ziffer'], pfad() + [artikel_label, aend['label']]
            elif zit and artikel_slug:
                eltern, p = artikel_slug, pfad() + [artikel_label]
            elif aenderung and aend and aend.get('ziffer'):
                eltern, p = aend['ziffer'], pfad() + [aend['label']]
            else:
                eltern, p = basis(), pfad()
                aend = None if (aend and aend['art'] == 'protokoll') else aend
            slug = eindeutig(bau, '/'.join(x for x in [eltern, 'art_' + slugify(nummer + (' ' + zusatz if zusatz else ''))] if x))
            label = f'Art. {nummer}' + (f' {zusatz}' if zusatz else '') + (f' {titel}' if titel else '')
            art = 'artikel_zitiert' if zit else ('artikel_aenderung' if aenderung else 'artikel')
            bau.oeffnen(art, slug, label, titel=titel, nummer=nummer, pfad=p, zitiert=zit)
            if not zit and not aenderung:
                artikel_slug, artikel_label = slug, f'Art. {nummer}'
                if typ != 'Bundesbeschluss' and re.match(r'^Änderung', titel):
                    aend = dict(art='protokoll', erwartet=1, ziffer=slug, label='')
            bau.zeile(zl)
            tiefe = max(0, tiefe + s.count('«') - s.count('»'))
            continue

        davor = ' '.join(ohne_hoch(zeilen[j].text.strip()) for j in range(max(0, i - 3), i))
        if bb and (re.search(r'(wird|werden) wie folgt ge(ändert|-$)', s)            # auch über einen Zeilenumbruch
                   or (re.search(r'wie folgt:$', s) and re.search(r'\b(lauten|lautet)\b', davor + ' ' + s))):
            teil_aenderung = True
        tiefe = max(0, tiefe + s.count('«') - s.count('»'))
        bau.zeile(zl)
    bau.schliessen()
    return bau.zettel


# ------------------------------------------------------------------ Botschaft

TOC_EINTRAG = re.compile(r'^\s*(\d+(?:\.\d+)*)\s+(\S.*?)$')
TOC_SEITE = re.compile(r'^(.*?)\s{2,}(\d{1,4})\s*$|^\s*(\d{1,4})\s*$')


def inhaltsverzeichnis(zeilen):
    """Einträge (nr, titel, seite) aus dem Inhaltsverzeichnis der Botschaft."""
    start = next(i for i, z in enumerate(zeilen) if z.text.strip() == 'Inhaltsverzeichnis')
    eintraege, cur, letzte = [], None, 1

    def seite_am_ende(s):
        """Titel und Seitenzahl, wenn die Zeile mit einer plausiblen Seitenzahl endet."""
        m = re.match(r'^(.*?)\s+(\d{1,4})\s*$', s)
        if m and letzte <= int(m.group(2)) <= letzte + 80 and not re.search(r'[–/-]$', m.group(1)):
            return m.group(1).strip(), int(m.group(2))
        return s.strip(), None

    for z in zeilen[start + 1:]:
        s = z.text.rstrip()
        if not s.strip():
            continue
        if re.match(r'^Bundesbeschluss\b', s):           # Liste der Entwürfe am Ende
            break
        u = re.match(r'^\s*(Übersicht|Abkürzungsverzeichnis|Anhänge)\s{2,}(\d+)\s*$', s)
        if u:
            eintraege.append(dict(nr=u.group(1), titel=u.group(1), seite=int(u.group(2))))
            letzte, cur = max(letzte, int(u.group(2))), None
            continue
        m = TOC_EINTRAG.match(s)
        if re.match(r'^\s*\d{1,4}\s*$', s):              # Seitenzahl allein auf der Zeile
            if cur is not None and cur['seite'] is None:
                cur['seite'] = int(s)
                letzte = max(letzte, cur['seite'])
            continue
        if m and ('.' in m.group(1) or int(m.group(1)) <= 9):
            titel, seite = seite_am_ende(m.group(2))
            cur = dict(nr=m.group(1), titel=titel, seite=seite)
            eintraege.append(cur)
            if seite:
                letzte = seite
        elif cur is not None and cur['seite'] is None:
            titel, seite = seite_am_ende(s)
            cur['titel'] = (cur['titel'] + ' ' + titel).strip()
            if seite:
                cur['seite'] = letzte = seite
    for i, e in enumerate(eintraege):                    # fehlende Seite: die des nächsten Eintrags
        if e['seite'] is None:
            e['seite'] = next((x['seite'] for x in eintraege[i + 1:] if x['seite']), letzte)
    for e in eintraege:
        e['titel'] = re.sub(r'(?<=[a-zäöü])- (?=[a-zäöü])', '', norm(e['titel']))
    return eintraege


def vergleichbar(s):
    return re.sub(r'[^0-9a-zäöüß]+', '', ohne_hoch(s).lower().replace('-', ''))


def gliedern_botschaft(nr, z):
    zeilen = z['rumpf']
    eintraege = inhaltsverzeichnis(zeilen)
    grenzen = []          # (zeilenindex, eintrag)
    fehlt = []
    pos = 0
    toc_start = next(i for i, x in enumerate(zeilen) if x.text.strip() == 'Inhaltsverzeichnis')
    ueb = next(i for i, x in enumerate(zeilen) if x.text.strip() == 'Übersicht' and x.seite <= 6)
    grenzen.append((0, dict(nr='vorspann', titel='Titel, Antrag und Vorstösse', seite=1)))
    grenzen.append((ueb, dict(nr='Übersicht', titel='Übersicht', seite=zeilen[ueb].seite)))
    grenzen.append((toc_start, dict(nr='inhalt', titel='Inhaltsverzeichnis', seite=zeilen[toc_start].seite)))
    pos = toc_start + 1
    numeriert = [e for e in eintraege if e['nr'][0].isdigit()]
    erste_seite = numeriert[0]['seite']
    while zeilen[pos].seite < erste_seite:
        pos += 1
    for e in numeriert:
        ziel = vergleichbar(e['titel'])[:18]
        gefunden = None
        for i in range(pos, len(zeilen)):
            x = zeilen[i]
            if x.seite > (e['seite'] or 0) + 3:
                break
            m = re.match(r'^\s*' + re.escape(e['nr']) + r'\s+(\S.*)$', x.text)
            if not m:
                continue
            kopf = m.group(1) + ' ' + ' '.join(zeilen[j].text.strip() for j in range(i + 1, min(i + 3, len(zeilen))))
            if vergleichbar(kopf).startswith(ziel[:12]) or ziel.startswith(vergleichbar(m.group(1))[:12]):
                gefunden = i
                break
        if gefunden is None:
            fehlt.append(e)
            continue
        if e['nr'] == '1':                               # Zwischentitel «Botschaft» gehört zu Kapitel 1
            j = gefunden - 1
            while j > 0 and not zeilen[j].text.strip():
                j -= 1
            if zeilen[j].text.strip() == 'Botschaft':
                gefunden = j
        grenzen.append((gefunden, e))
        pos = gefunden + 1
    # Abkürzungsverzeichnis und Anhänge
    for i in range(pos, len(zeilen)):
        s = zeilen[i].text.strip()
        if s == 'Abkürzungsverzeichnis':
            grenzen.append((i, dict(nr='abk', titel='Abkürzungsverzeichnis', seite=zeilen[i].seite)))
        m = re.match(r'^Anhang\s+([\d.]+)\s*\((\d+)\)\s*:\s*(.*)$', ohne_hoch(s))
        if m and zeilen[i].text[:1] != ' ':
            grenzen.append((i, dict(nr=f'anh_{m.group(1)}_{m.group(2)}', titel=norm(ohne_hoch(s)), seite=zeilen[i].seite)))
    grenzen.sort(key=lambda g: g[0])
    titel_nach_nr = {e['nr']: e['titel'] for e in numeriert}
    zettel = []
    for gi, (a, e) in enumerate(grenzen):
        b = grenzen[gi + 1][0] if gi + 1 < len(grenzen) else len(zeilen)
        nrx = e['nr']
        if nrx[0].isdigit():
            teile_nr = nrx.split('.')
            pfad = [f"{'.'.join(teile_nr[:k])} {titel_nach_nr.get('.'.join(teile_nr[:k]), '')}".strip()
                    for k in range(1, len(teile_nr))]
            slug, label, art = f'ziff_{nrx}', f"{nrx} {e['titel']}", 'ziffer'
        else:
            pfad = [] if not nrx.startswith('anh_') else ['Anhänge']
            slug = {'vorspann': 'vorspann', 'Übersicht': 'uebersicht', 'inhalt': 'inhaltsverzeichnis',
                    'abk': 'abkuerzungen'}.get(nrx, nrx)
            label, art = e['titel'], 'abschnitt'
        # Erläuterungen Artikel für Artikel: Zwischentitel «Art. 1 Gegenstand …» werden Unterzettel
        unter = erlaeuterte_artikel(zeilen, a, b) if nrx[0].isdigit() else []
        grenzen_u = [a] + [u[0] for u in unter]
        for ti, ta in enumerate(grenzen_u):
            tb = grenzen_u[ti + 1] if ti + 1 < len(grenzen_u) else b
            if ti == 0:
                zettel.append(dict(art=art, slug=slug, label=label, titel=e['titel'],
                                   nummer=nrx if nrx[0].isdigit() else None, pfad=pfad, zitiert=False,
                                   zeilen=zeilen[ta:tb], toc_seite=e.get('seite')))
                continue
            _, unr, utitel, ulabel = unter[ti - 1]
            zettel.append(dict(art='erlaeuterung', slug=f"{slug}/{'art_' + slugify(unr.replace('/', ' ziff ')) if unr != 'präambel' else 'praeambel'}",
                               label=ulabel,
                               titel=utitel, nummer=unr, pfad=pfad + [label], zitiert=False, zeilen=zeilen[ta:tb]))
    eindeutige_slugs(zettel)
    return zettel, eintraege, fehlt


ARTIKEL_ERL = re.compile(r'^Art\.\s+(\d+[a-z]*(?:bis|ter|quater|quinquies|sexies)?(?:–\d+[a-z]*)?)(?:,?\s+(\S.*?))?\s*$')
GLIED_ERL = re.compile(r'^(\d+[a-z]?\.\s+(?:Kapitel|Abschnitt|Titel)\b|(?:Kapitel|Abschnitt|Titel)\s+\S+:|Gliederungstitel)')


ZIFFER_ERL = re.compile(r'^Artikel\s+(\d+[a-z]*)\s+Ziffern?\s+([\d–\-, und]+?)\s+(?:des|der)\s+'
                        r'(Änderungsprotokolls|Protokolls|Abkommens|ÄP-[\w-]+|IP-[\w-]+)\b(.*)$')


def erlaeuterte_artikel(zeilen, a, b):
    """Unterabschnitte einer Ziffer der Botschaft, die einen einzelnen Artikel erläutern:
    [(beginn, nummer, titel, label)]. Erkannt werden Zwischentitel am linken Rand
      «Art. 2a», «Art. 2 Abs. 2ter», «Art. 15a  Pflichten …» nach einer Leerzeile, mit Titel auch nach einem Satzende;
      «Artikel 1 Ziffer 2 des Änderungsprotokolls betreffend …» und «Präambel» nach einer Leerzeile.
    Ein Gliederungstitel direkt davor gehört mit zum Unterzettel."""
    funde = []
    for i in range(a + 1, b):
        t = ohne_hoch(zeilen[i].text.rstrip())
        if t[:1] == ' ' or len(t) > 90:
            continue
        j = i - 1
        while j > a and not zeilen[j].text.strip():
            j -= 1
        vor = ohne_hoch(zeilen[j].text.strip())
        nach_leer = j < i - 1 or j == a
        beginn = j if GLIED_ERL.match(vor) else i
        m = ARTIKEL_ERL.match(t)
        if m and not re.search(r'\)\.?$|\.$', t):
            rest = norm(m.group(2) or '')
            if nach_leer or GLIED_ERL.match(vor) or (re.search(r'[.:;)»]$', vor) and re.match(r'[A-ZÄÖÜ«(]', rest)
                                                       and len(t) <= 78 and not re.match(r'(Abs|Bst|Ziff|BV|FZA)\b', rest)):
                funde.append((beginn, m.group(1), rest, f'Art. {m.group(1)} {rest}'.strip()))
            continue
        m = ZIFFER_ERL.match(t)
        if m and nach_leer:
            kopf = t
            offen = t.count('(') > t.count(')') or t.endswith('-') or re.search(r'\b(des|der|den|die|dem|und|zu|zur|zum|betreffend|von|über)$', t)
            weiter = i + 1 < b and zeilen[i + 1].text.strip()
            if weiter and (offen or re.match(r'[a-zäöü]', zeilen[i + 1].text.strip())):
                kopf = absatz(zeilen, i, 2)                                  # Titel läuft auf der nächsten Zeile weiter
            funde.append((beginn, f'{m.group(1)}/{norm(m.group(2))}', norm(kopf), norm(kopf)))
            continue
        if t.strip() == 'Präambel' and nach_leer:
            funde.append((beginn, 'präambel', 'Präambel', 'Präambel'))
    return funde


def nachfolger(alt, neu):
    """Ist die Ziffer neu eine zulässige Nachfolgerin von alt? (1 → 1.1 → 1.2 → 2 …)"""
    a, n = [int(x) for x in alt.split('.')] if alt else [], [int(x) for x in neu.split('.')]
    if not a:
        return n == [1]
    if len(n) == len(a) + 1:
        return n[:-1] == a and n[-1] == 1
    if len(n) <= len(a):
        return n[:-1] == a[:len(n) - 1] and n[-1] == a[len(n) - 1] + 1
    return False


def gliedern_bericht(nr, z):
    """Bericht und Stellungnahme ohne Inhaltsverzeichnis: Ziffern am linken Rand mit breitem Abstand,
    in lückenloser Folge; dazu «Übersicht» und Erläuterungen Artikel für Artikel."""
    zeilen = z['rumpf']
    grenzen = [(0, 'vorspann', 'Titel und Antrag')]
    letzte = ''
    for i, x in enumerate(zeilen):
        t = ohne_hoch(x.text.rstrip())
        if t.strip() == 'Übersicht' and len(grenzen) == 1:
            grenzen.append((i, 'uebersicht', 'Übersicht'))
            continue
        m = re.match(r'^(\d+(?:\.\d+)*)\s{2,}(\S.*)$', t)
        if m and nachfolger(letzte, m.group(1)):
            titel = norm(m.group(2))
            if i + 1 < len(zeilen) and re.match(r'^\s{8,}\S', zeilen[i + 1].text):
                titel = norm(titel + ' ' + zeilen[i + 1].text)                # Titel auf zwei Zeilen
            grenzen.append((i, m.group(1), titel))
            letzte = m.group(1)
    titel_nach_nr = {g[1]: g[2] for g in grenzen}
    zettel = []
    for gi, (a, nrx, titel) in enumerate(grenzen):
        b = grenzen[gi + 1][0] if gi + 1 < len(grenzen) else len(zeilen)
        if nrx[0].isdigit():
            teile_nr = nrx.split('.')
            pfad = [f"{'.'.join(teile_nr[:k])} {titel_nach_nr.get('.'.join(teile_nr[:k]), '')}".strip()
                    for k in range(1, len(teile_nr))]
            slug, label, art = f'ziff_{nrx}', f'{nrx} {titel}', 'ziffer'
        else:
            pfad, slug, label, art = [], nrx, titel, 'abschnitt'
        unter = erlaeuterte_artikel(zeilen, a, b) if nrx[0].isdigit() else []
        grenzen_u = [a] + [u[0] for u in unter]
        for ti, ta in enumerate(grenzen_u):
            tb = grenzen_u[ti + 1] if ti + 1 < len(grenzen_u) else b
            if ti == 0:
                zettel.append(dict(art=art, slug=slug, label=label, titel=titel, nummer=nrx if nrx[0].isdigit() else None,
                                   pfad=pfad, zitiert=False, zeilen=zeilen[ta:tb]))
            else:
                _, unr, utitel, ulabel = unter[ti - 1]
                zettel.append(dict(art='erlaeuterung', slug=f"{slug}/art_{slugify(unr.replace('/', ' ziff '))}",
                                   label=ulabel, titel=utitel, nummer=unr, pfad=pfad + [label], zitiert=False,
                                   zeilen=zeilen[ta:tb]))
    eindeutige_slugs(zettel)
    return zettel


def eindeutige_slugs(zettel):
    gesehen = collections.Counter()
    for z in zettel:
        gesehen[z['slug']] += 1
        if gesehen[z['slug']] > 1:
            z['slug'] = f"{z['slug']}_{gesehen[z['slug']]}"


# ------------------------------------------------------------------ Ausgabe

def zettel_fertig(nr, z, fussnoten, seiten_fn):
    text = fliesstext(x.text for x in z['zeilen'])
    fn = sorted({k for x in z['zeilen'] for k in x.fn})
    fns = [dict(nr=fussnoten[k][1], text=fussnoten[k][2]) for k in fn if k in fussnoten]
    seiten = [x.seite for x in z['zeilen'] if x.text.strip()]
    w = woerter(text) + sum(woerter(f['text']) for f in fns)
    out = dict(id=f'fga/2026/{nr}/{z["slug"]}', dok=nr, art=z['art'], nummer=z['nummer'], titel=z['titel'],
               label=z['label'], pfad=z['pfad'], woerter=w, seiten=[min(seiten), max(seiten)] if seiten else [],
               text=text, fussnoten=fns, status='Rohextraktion')
    if z.get('zitiert'):
        out['zitiert'] = True
    return out


def main():
    utf8_ausgabe()
    args = sys.argv[1:]
    sprache = args[args.index('--sprache') + 1] if '--sprache' in args else 'de'
    zeigen = int(args[args.index('--zeigen') + 1]) if '--zeigen' in args else None
    q = quellen(sprache)
    dokumente, alle, berichte = [], [], []
    for nr, kurz, typ, gruppe in DOKUMENTE:
        if zeigen and nr != zeigen:
            continue
        pfad = text_pfad(nr, sprache)
        if not pfad.exists():
            print(f'FEHLT: {pfad} (zuerst laden.py)')
            sys.exit(1)
        roh = pfad.read_text(encoding='utf8')
        z = zerlegen(roh, nr)
        extra = {}
        if typ == 'Botschaft':
            roh_zettel, eintraege, fehlt = gliedern_botschaft(nr, z)
            extra = dict(inhaltsverzeichnis=len(eintraege), ziffern_nicht_gefunden=[f"{e['nr']} {e['titel']}" for e in fehlt])
        elif typ in ('Bericht', 'Stellungnahme'):
            roh_zettel = gliedern_bericht(nr, z)
        else:
            roh_zettel = gliedern_werk(nr, typ, z)
        zettel = [zettel_fertig(nr, x, z['fussnoten'], None) for x in roh_zettel]
        # unabhängige Zählung über den ganzen Rumpf (Ziffer 9.1)
        netto = woerter(fliesstext(x.text for x in z['rumpf'])) + sum(woerter(t) for _, _, t in z['fussnoten'].values())
        zugeordnet = {k for x in roh_zettel for zl in x['zeilen'] for k in zl.fn}
        info = q.get(str(nr), {})
        dokumente.append(dict(nr=nr, kurz=kurz, typ=typ, gruppe=gruppe, titel=info.get('titel', ''),
                              eli=f'https://fedlex.data.admin.ch/eli/fga/2026/{nr}', seiten=z['seiten'],
                              woerter_roh=woerter(roh), woerter_kopf_fuss=sum(woerter(x) for x in z['kopf_fuss']),
                              woerter=netto, fussnoten=len(z['fussnoten']),
                              fussnoten_ohne_zeichen=z['ohne_marke'], fussnoten_auffaellig=z['auffaellig'],
                              fussnoten_ohne_zettel=sorted(set(z['fussnoten']) - zugeordnet), **extra))
        alle.extend(zettel)
        summe = sum(x['woerter'] for x in zettel)
        berichte.append(f"{nr:>5} {kurz[:28]:<28} {len(zettel):>4} Zettel  {netto:>7} Wörter  "
                        f"Summe {summe:>7} {'ok' if summe == netto else 'ABWEICHUNG ' + str(summe - netto)}  "
                        f"Fn {len(z['fussnoten']):>4} (ohne Zeichen {len(z['ohne_marke'])})"
                        + (f"  Botschaft-Ziffern nicht gefunden: {len(extra['ziffern_nicht_gefunden'])}" if extra else ''))
        if zeigen:
            for x in zettel:
                tiefe = len(x['pfad'])
                print(f"{'  ' * tiefe}{x['label'][:90]}  [{x['art']}, {x['woerter']} W., S. {x['seiten']}]  {x['id']}")
            if extra.get('ziffern_nicht_gefunden'):
                print('Nicht gefunden:', extra['ziffern_nicht_gefunden'])
    print('\n'.join(berichte))
    ids = collections.Counter(x['id'] for x in alle)
    doppelt = [i for i, c in ids.items() if c > 1]
    if doppelt:
        print('DOPPELTE KENNUNGEN:', doppelt[:10])
    if zeigen:
        return
    aus = dict(stand=date.today().isoformat(), sprache=sprache, gruppen=[dict(id=g, name=n) for g, n in GRUPPEN],
               dokumente=dokumente, zettel=alle)
    ziel = DATEN / 'zettel.json'
    ziel.write_text(json.dumps(aus, ensure_ascii=False, separators=(',', ':')), encoding='utf8')
    print(f"{len(alle)} Zettel, {sum(d['woerter'] for d in dokumente)} Wörter, "
          f"{ziel.stat().st_size // 1024} KB in {ziel.relative_to(DATEN.parent)}")


if __name__ == '__main__':
    main()
