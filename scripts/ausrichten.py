"""Französischer und italienischer Wortlaut, ausgerichtet an den deutschen Zetteln (Etappe 5).

Beide Sprachen:               python3 scripts/ausrichten.py
Eine Sprache:                 python3 scripts/ausrichten.py fr
Ausrichtung eines Werks:      python3 scripts/ausrichten.py fr --zeigen 621

Liest daten/zettel.json (deutsch, von gliedern.py) und daten/text/<sprache>/<nr>.txt (von laden.py),
schreibt daten/zettel_<sprache>.json.

Warum ausrichten statt neu gliedern: Ein Zettel hat in allen Sprachen dieselbe Kennung, damit die Seite
zwischen den Sprachen umschalten kann. Die deutsche Gliederung gibt die Zettel vor; in der anderen Sprache
wird für jeden Zettel die Zeile gesucht, mit der er beginnt (Anker):
  Artikel             «Art. 4», in den EU-Abkommen auch «Art. 24 bis» für deutsch «Art. 24a»
  Ziffer              «3. …» in Änderungsartikeln, «2.11.3 …» in Botschaft und Berichten
  Teil, Gliederung    «Annexe I», «Allegato I», «Protocole …», «Partie V», «Capitolo 2», «Section A»
  Rechtsakt           CELEX-Nummer «31977 L 0486»
  Erläuterung         «Art. 1, ch. 5, …», «Articolo 1 numero 5 …», «Préambule»
Unter allen Fundstellen wird die längste Folge in der Reihenfolge der deutschen Zettel gewählt; bei
gleicher Länge die Folge, deren Lage im Werk (Anteil der Wörter davor) der deutschen am nächsten liegt.
Ein Zettel ohne Anker hat keinen eigenen Wortlaut; sein Text steht im vorangehenden Zettel.

Selbstprüfung je Werk: Summe der Zettel gleich der Zählung über den ganzen Rumpf (wie Ziffer 9.1), dazu
der Anteil der Zettel mit eigenem Wortlaut und das Wortverhältnis zur deutschen Fassung als Hinweis auf
falsche Anker.
"""
import bisect
import collections
import json
import re
import sys
from datetime import date

import paket
from gliedern import ARTIKEL, BUCHST, norm, ohne_hoch, zerlegen
from paket import DATEN, DOKUMENTE, fliesstext, text_pfad, utf8_ausgabe, woerter

SPRACHEN = ('fr', 'it')
# Deutsch «24a, 24b …» in den EU-Abkommen: französisch und italienisch «24bis, 24ter …»
LATEIN = ['bis', 'ter', 'quater', 'quinquies', 'sexies', 'septies', 'octies', '(?:novies|nonies)', 'decies', 'undecies',
          'duodecies', 'terdecies', 'quaterdecies', 'quinquiesdecies', 'sexiesdecies']
WORT = {
    'fr': dict(anhang='Annexe', anlage='Appendice', protokoll='Protocole', erklaerung='Déclaration',
               teil='Partie', titel='Titre', kapitel='Chapitre', abschnitt='Section', unterabschnitt='Sous-section',
               uebersicht='Condensé', inhalt='Table des matières', abk='Liste des abréviations',
               praeambel='Préambule', schluss=r'Fait (?:à|en)'),
    'it': dict(anhang='Allegato', anlage='Appendice', protokoll='Protocollo', erklaerung='Dichiarazione',
               teil='Parte', titel='Titolo', kapitel='Capitolo', abschnitt='Sezione', unterabschnitt='Sottosezione',
               uebersicht='Compendio', inhalt='Indice', abk='Abbreviazioni',
               praeambel='Preambolo', schluss=r'Fatto (?:a|in)'),
}
STUFE_WORT = {'Teil': 'teil', 'Titel': 'titel', 'Kapitel': 'kapitel', 'Abschnitt': 'abschnitt',
              'Unterabschnitt': 'unterabschnitt'}
GRENZE = r'(?![0-9A-Za-zÀ-ÿ])'


def nummer_muster(nr, eu_stil=True):
    """Artikelnummer als Muster: «24a» auch «24 bis», «13bis» auch «13 bis», «I.4» wie geschrieben."""
    m = re.fullmatch(r'(\d+)([a-z]?)((?:' + '|'.join(LATEIN) + r')?)', nr or '')
    if not m:
        return re.escape(nr or '').replace(r'\.', r'\.\s?') + GRENZE         # «I.1» auch «I. 1» (632 fr)
    zahl, buchst, latein = m.groups()
    formen = [re.escape(nr)]
    if latein:
        formen.append(re.escape(zahl + buchst) + r'\s?' + latein)
    if buchst and not latein and eu_stil:
        i = ord(buchst) - ord('a')
        if i < len(LATEIN):
            formen.append(zahl + r'\s?' + LATEIN[i])
    return '(?:' + '|'.join(formen) + ')' + GRENZE


def anker(z, sp, eu_stil):
    """Muster für die erste Zeile des Zettels z in der Sprache sp, oder None. Verglichen wird mit der Zeile ohne
    Einzug und ohne Fussnotenzeichen."""
    w, art, nr, label = WORT[sp], z['art'], z.get('nummer'), z['label']
    if art == 'ingress' or z['id'].endswith('/vorspann'):
        return 'ANFANG'
    if art in ('artikel', 'artikel_zitiert', 'artikel_aenderung'):
        if not nr:
            return None
        nr = nr.split()[0]
        # auch «ART. 42» (632 fr) und ausgeschrieben «Article 21» (624 fr)
        return r'^(?:\d\.\s+)?«?\s*(?i:Art\.?|Article|Articolo)\s*' + nummer_muster(nr, eu_stil) + r'(?:er)?'
    if art == 'schluss':
        return r'^' + w['schluss'] + r'\b'
    if art == 'rechtsakt' and nr:
        m = re.fullmatch(r'3(\d{4})([A-Z])(\d+)(.*)', nr)
        if m:
            return (r'^(?:\(?\d{1,3}[a-z]?[.)]\s+)?3\s?' + m.group(1) + r'\s?' + m.group(2) + r'\s?' + m.group(3)
                    + re.escape(m.group(4)))
        return None
    if art == 'ziffer':
        if z['dok'] in (615, 2099, 2174):
            # nicht «2.8.7.2 (2) riassume …»: Tabellenverweis am Zeilenanfang (615 it)
            return r'^' + re.escape(nr) + r'\s+(?!\()\S' if nr else None
        return r'^' + re.escape(nr) + r'[.)]\s+\S' if nr else None        # deutsch «1.», EU-Texte fr/it «1)»
    if art == 'abschnitt':
        slug = z['id'].rsplit('/', 1)[1]
        if slug == 'uebersicht':
            return r'^' + w['uebersicht'] + r'\s*$'
        if slug == 'inhaltsverzeichnis':
            return r'^' + w['inhalt'] + r'\s*$'
        if slug == 'abkuerzungen':
            return r'^' + w['abk'] + r'\s*$'
        m = re.match(r'^Anhang ([\d.]+) \((\d+)\)', label)                 # Botschaft «Anhang 2.8 (1): …»
        if m:
            return r'^' + w['anhang'] + r'\s+' + re.escape(m.group(1)) + r'\s*\(' + m.group(2) + r'\)'
        return None
    if art == 'teil':
        m = re.match(r'^Anhang\s*(\S*)', label)
        if m:
            return r'^' + w['anhang'] + (r'\s+' + re.escape(m.group(1)) + GRENZE if m.group(1) else r'\s*$')
        m = re.match(r'^Anlage\s*(\S*)', label)
        if m:
            return r'^' + w['anlage'] + (r'\s+' + re.escape(m.group(1)) + GRENZE if m.group(1) else r'\s*$')
        if label.startswith('Beilage'):
            return r'^' + w['anhang'] + r'\s+[^\d\sIVX]'                    # «Annexe relative à la LSAE»
        m = re.match(r'^Protokoll\s+(\d+)\b', label)
        if m:
            return r'^' + w['protokoll'] + r'\s+(?:n[°o]\s*)?' + m.group(1) + GRENZE
        if label.startswith('Protokoll'):
            return r'^' + w['protokoll'] + r'\b'
        if 'Erklärung' in label.split()[:2] or label.startswith('Erklärung'):
            return r'^' + w['erklaerung'] + r'\b'
        return None
    if art == 'gliederung':
        m = re.match(r'^(Teil|Titel|Kapitel|Abschnitt|Unterabschnitt)\s+(\S+?)[:.]?(?:\s|$)', label)
        if m:
            return r'^' + w[STUFE_WORT[m.group(1)]] + r'\s+' + re.escape(m.group(2)) + GRENZE
        m = re.match(r'^Ziff\.\s+([IVX]+)$', label)
        if m:
            return r'^' + m.group(1) + r'\s*$'
        return None
    if art == 'erlaeuterung':
        # «Artikel 1 Ziffer 5 des Änderungsprotokolls»: fr «Art. 1, ch. 5», «Art. 1, point 5», «Art. 1, pt 5»;
        # it «Art. 1 n. 5», «Articolo 1 numero 5», «Art. 1 numeri 2 e 3»
        m = re.match(r'^Artikel\s+(\d+[a-z]*)\s+Ziffern?\s+(\d+)', label)
        if m:
            return (r'^(?:Art\.|Article|Articolo)\s*' + m.group(1) + r',?\s*(?:ch\.|chiffres?|points?|pts?|n\.|'
                    r'numer[oi])\s*' + m.group(2) + GRENZE)
        if label.startswith('Präambel'):
            return r'^' + w['praeambel'] + r'\b'
        m = re.match(r'^Art\.\s+(\d+[a-z]*)\s*[–-]\s*(\d+[a-z]*)\b', label)        # «Art. 7–9», fr «Art. 7 à 9»
        if m:
            return (r'^Art\.?\s*' + nummer_muster(m.group(1), eu_stil) + r'\s*(?:–|-|‒|à|a|e)\s*'
                    + nummer_muster(m.group(2), eu_stil))
        m = re.match(r'^Art\.\s+(\S+)', label)
        if m:
            return r'^Art\.?\s*' + nummer_muster(m.group(1).rstrip(',)'), eu_stil)
        return None
    return None


def kette(kandidaten, n):
    """Längste Folge (Zettelnummer und Zeile steigen), bei Gleichstand kleinste Abweichung.
    kandidaten: [(zeile, zettel, abweichung)]. Ergebnis {zettel: zeile}."""
    kandidaten.sort(key=lambda x: (x[0], -x[1]))
    # Fenwick-Baum über die Zettelnummer: bestes (Länge, -Abweichung, Index) für Zettel < k
    baum = [(0, 0.0, -1)] * (n + 1)
    best, vor = [], []

    def frage(k):
        r = (0, 0.0, -1)
        while k > 0:
            if baum[k][:2] > r[:2]:
                r = baum[k]
            k -= k & -k
        return r

    def setze(k, wert):
        k += 1
        while k <= n:
            if wert[:2] > baum[k][:2]:
                baum[k] = wert
            k += k & -k

    for idx, (zeile, zk, abw) in enumerate(kandidaten):
        laenge, gut, v = frage(zk)                  # Zettel 0 … zk-1
        wert = (laenge + 1, gut - abw, idx)
        best.append(wert)
        vor.append(v)
        setze(zk, wert)
    if not best:
        return {}
    i = max(range(len(best)), key=lambda j: best[j][:2])
    aus = {}
    while i >= 0:
        zeile, zk, _ = kandidaten[i]
        aus[zk] = zeile
        i = vor[i]
    return aus


def bindestrich_woerter(sp):
    """Zusammensetzungen mit Bindestrich, die im Korpus innerhalb einer Zeile stehen («vingt-six», «Royaume-Uni»).
    Ein solches Wort am Zeilenende behält seinen Bindestrich; sonst gilt der Strich als Silbentrennung."""
    w = set()
    for nr, *_ in DOKUMENTE:
        p = text_pfad(nr, sp)
        if p.exists():
            w.update(m.group(0).lower() for m in re.finditer(r'[' + BUCHST + r']+-[' + BUCHST + r']+',
                                                               p.read_text(encoding='utf8')))
    return w


ZIFF = {'fr': 'ch.', 'it': 'n.'}


def label_von(zeilen, i, z, sp):
    """Bezeichnung in der Sprache: die Ankerzeile, bei Artikeln mit Sachüberschrift. Ziffern eines Änderungsartikels
    wie im Deutschen («Ziff. 5 …»): «ch. 5 …», «n. 5 …», damit die Seite sie unter ihre Gruppe ordnet."""
    s = ohne_hoch(norm(zeilen[i].text))
    if z['art'] in ('artikel', 'artikel_zitiert', 'artikel_aenderung', 'erlaeuterung'):
        m = ARTIKEL.match(ohne_hoch(zeilen[i].text.strip()))
        if m and m.group(5):
            s = f'Art. {m.group(3)} {norm(m.group(5))}'
    elif z['art'] == 'ziffer' and z['dok'] not in (615, 2099, 2174):
        s = f"{ZIFF[sp]} {z['nummer']} " + re.sub(r'^\d+[.)]\s*', '', s)
    return s.lstrip('«')[:160]


def ausrichten(nr, sp, de_zettel, de_woerter):
    roh = text_pfad(nr, sp).read_text(encoding='utf8')
    z = zerlegen(roh, nr)
    zeilen = z['rumpf']
    # Lage jeder Zeile im Werk: Anteil der Wörter davor
    kum, summe = [], 0
    for x in zeilen:
        kum.append(summe)
        summe += woerter(x.text)
    summe = max(summe, 1)
    erwartet, s = [], 0
    for x in de_zettel:
        erwartet.append(s / max(de_woerter, 1))
        s += x['woerter']
    # erlaubte Abweichung der Lage: weit in kurzen Werken, eng in der Botschaft (0,04 sind dort rund 20 000 Wörter)
    fenster = 0.25 if len(de_zettel) < 40 else 0.1 if len(de_zettel) < 500 else 0.04
    texte = [ohne_hoch(x.text.strip()) for x in zeilen]
    einzug = [len(x.text) - len(x.text.lstrip()) for x in zeilen]
    kandidaten, ohne_muster = [], []
    for k, dz in enumerate(de_zettel):
        # «24a» auch als «24 bis»: Schweizer Gesetze behalten den Buchstaben, die EU-Abkommen nicht; ein Werk
        # enthält nie beide Formen nebeneinander, darum gelten immer beide
        muster = anker(dz, sp, True)
        if muster == 'ANFANG':
            kandidaten.append((0, k, 0.0))
            continue
        if muster is None:
            ohne_muster.append(dz['id'])
            continue
        rx = re.compile(muster)
        for i, t in enumerate(texte):
            if t and rx.search(t):
                abw = abs(kum[i] / summe - erwartet[k])
                if abw <= fenster:
                    kandidaten.append((i, k, abw))
    lage = kette(kandidaten, len(de_zettel))
    lage[0] = 0                                     # der erste Zettel beginnt immer am Anfang
    anfaenge = sorted((zeile, k) for k, zeile in lage.items())
    # Zeilen je Zettel: von seinem Anker bis zum nächsten
    zuteilung = {}
    for j, (zeile, k) in enumerate(anfaenge):
        ende = anfaenge[j + 1][0] if j + 1 < len(anfaenge) else len(zeilen)
        if ende > zeile or k not in zuteilung:
            zuteilung[k] = (zeile, ende)
    aus = []
    for k, dz in enumerate(de_zettel):
        if k in zuteilung:
            a, b = zuteilung[k]
            teil = zeilen[a:b]
        else:
            teil = []
        text = fliesstext(x.text for x in teil)
        fn = sorted({f for x in teil for f in x.fn})
        fns = [dict(nr=z['fussnoten'][f][1], text=z['fussnoten'][f][2]) for f in fn if f in z['fussnoten']]
        seiten = [x.seite for x in teil if x.text.strip()]
        w = woerter(text) + sum(woerter(f['text']) for f in fns)
        eintrag = dict(id=dz['id'], dok=nr, art=dz['art'], nummer=dz['nummer'],
                       label=label_von(zeilen, zuteilung[k][0], dz, sp) if k in zuteilung and dz['art'] not in
                       ('ingress', 'abschnitt') else '', woerter=w,
                       seiten=[min(seiten), max(seiten)] if seiten else [], text=text, fussnoten=fns)
        if k not in zuteilung:
            eintrag['ohne_stelle'] = True
        aus.append(eintrag)
    netto = woerter(fliesstext(x.text for x in zeilen)) + sum(woerter(t) for _, _, t in z['fussnoten'].values())
    return aus, dict(nr=nr, seiten=z['seiten'], woerter=netto, fussnoten=len(z['fussnoten']),
                     fussnoten_ohne_zeichen=z['ohne_marke'], ohne_muster=ohne_muster)


def main():
    utf8_ausgabe()
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    zeigen = int(sys.argv[sys.argv.index('--zeigen') + 1]) if '--zeigen' in sys.argv else None
    sprachen = [a for a in args if a in SPRACHEN] or list(SPRACHEN)
    de = json.loads((DATEN / 'zettel.json').read_text(encoding='utf8'))
    je_dok = collections.defaultdict(list)
    for x in de['zettel']:
        je_dok[x['dok']].append(x)
    de_woerter = {d['nr']: d['woerter'] for d in de['dokumente']}
    for sp in sprachen:
        paket.BINDESTRICH = bindestrich_woerter(sp)
        alle, dokumente, zeilen_bericht = [], [], []
        for nr, kurz, typ, gruppe in DOKUMENTE:
            if zeigen and nr != zeigen:
                continue
            if not text_pfad(nr, sp).exists():
                print(f'FEHLT: {text_pfad(nr, sp)} (zuerst laden.py --sprache {sp})')
                sys.exit(1)
            zettel, info = ausrichten(nr, sp, je_dok[nr], de_woerter[nr])
            alle.extend(zettel)
            dokumente.append(info)
            mit = sum(1 for x in zettel if not x.get('ohne_stelle'))
            summe = sum(x['woerter'] for x in zettel)
            dz = {x['id']: x['woerter'] for x in je_dok[nr]}
            auffaellig = [x['id'] for x in zettel if not x.get('ohne_stelle') and dz[x['id']] >= 40
                          and not 0.6 <= x['woerter'] / dz[x['id']] <= 1.8]
            info['auffaellig'] = auffaellig
            zeilen_bericht.append(f"{nr:>5} {kurz[:28]:<28} {mit:>4}/{len(zettel):<4} Zettel mit Stelle  "
                                  f"{info['woerter']:>7} Wörter  Summe {'ok' if summe == info['woerter'] else 'ABWEICHUNG ' + str(summe - info['woerter'])}"
                                  f"  Verhältnis auffällig {len(auffaellig)}")
            if zeigen:
                for x in zettel:
                    print(f"{'  ' * len(x['id'].split('/')[3:])}{'—' if x.get('ohne_stelle') else ' '} "
                          f"{(x['label'] or x['id'])[:80]}  [{x['woerter']} W., DE {dz[x['id']]}]  {x['id']}")
        print(f'== {sp}')
        print('\n'.join(zeilen_bericht))
        mit = sum(1 for x in alle if not x.get('ohne_stelle'))
        print(f"{mit} von {len(alle)} Zettel mit eigener Stelle, {sum(d['woerter'] for d in dokumente)} Wörter")
        if zeigen:
            continue
        ziel = DATEN / f'zettel_{sp}.json'
        ziel.write_text(json.dumps(dict(stand=date.today().isoformat(), sprache=sp, dokumente=dokumente, zettel=alle),
                                   ensure_ascii=False, separators=(',', ':')), encoding='utf8')
        print(f"{ziel.stat().st_size // 1024} KB in {ziel.relative_to(DATEN.parent)}")


if __name__ == '__main__':
    main()
