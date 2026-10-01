"""Extrahiert die Kanten zwischen Zetteln, Dokumenten, EU-Rechtsakten, SR-Erlassen und Bundesgesetzen.

Alle Kanten:                   python3 scripts/verweise.py
Mit Titeln der EU-Rechtsakte:  python3 scripts/verweise.py --eurlex    (fragt den SPARQL-Endpunkt des
                                                                       Amts für Veröffentlichungen der EU ab)

Liest daten/zettel.json, schreibt daten/kanten.json. Jede Kante führt Quelle (Zettel), Textstelle,
Extraktionsregel und Status «automatisch» (Projektbrief Ziffer 7.4). Kantenarten (Ziffer 7.3):
  teil_von      Zettel gehört zum übergeordneten Zettel oder Dokument
  verweist_auf  Artikelverweis im Wortlaut, auch zwischen Dokumenten (Fehlerbild 4)
  nennt         Zettel nennt EU-Rechtsakt (CELEX) oder SR-Erlass (SR-Nummer)
  genehmigt     Art. 1 eines Bundesbeschlusses genehmigt ein Abkommen oder Protokoll
  erlaeutert    Kapitel 2.x der Botschaft erläutert ein Dokument; Erläuterung zu einem Artikel → Artikel
  aendert       Bundesbeschluss schafft oder ändert ein Bundesgesetz (Fehlerbild 3)
Nur Verweise, die im Text stehen; keine Kante aus inhaltlicher Ähnlichkeit (Ziffer 3.3).
"""
import collections
import json
import re
import sys
import urllib.parse
import urllib.request
from datetime import date

from paket import DATEN, DOKUMENTE, PAKET, utf8_ausgabe

KURZ = {d[0]: d[1] for d in DOKUMENTE}

# ------------------------------------------------------------------ EU-Rechtsakte

EU_TYP = (r'(Durchführungsverordnung|Durchführungsbeschluss|Durchführungsrichtlinie|Delegierten? Verordnung|'
          r'Delegierten? Richtlinie|Delegierter? Beschluss|Rahmenbeschluss|Verordnung|Richtlinie|Beschluss|Entscheidung|Empfehlung)')
EU_AKT = re.compile(EU_TYP + r'(?:en)?\s*(?:\((EU|EG|EWG|Euratom|EGKS|GASP)\)\s*)?(?:Nr\.\s*)?'
                    r'(\d{1,4})/(\d{1,4})(?:/(EU|EG|EWG|Euratom|EGKS|GASP|JI))?(?!\d)')
NICHT_EU = re.compile(r'^\s*(des|der)\s+(Gemischten|Gemeinsamen|Assoziations|Ausschusses|Verwaltungskommission|Rates? der EFTA|EWR)')
CELEX_ROH = re.compile(r'\b(3)(\d{4})\s?([A-Z])\s?(\d{4})(\(\d{2}\))?(?!\d)')
BUCHSTABE = {'Verordnung': 'R', 'Richtlinie': 'L', 'Beschluss': 'D', 'Entscheidung': 'D', 'Rahmenbeschluss': 'F',
             'Empfehlung': 'H'}


def eu_celex(typ, reihe, a, b, suffix, nr_davor):
    """CELEX-Nummer aus einer Zitierung wie «Verordnung (EG) Nr. 883/2004» oder «Richtlinie 2004/38/EG»."""
    grund = next(v for k, v in BUCHSTABE.items() if k.lower() in typ.lower().replace('durchführungs', '')
                 .replace('delegierte', '').replace('delegierter', '').replace('delegierten', '')) \
        if not typ.startswith('Rahmen') else 'F'
    a_i, b_i = int(a), int(b)
    if suffix:                                         # «2004/38/EG», auch «Richtlinie Nr. 2014/50/EU»
        jahr, nummer = a_i, b_i
    elif nr_davor:                                     # «Nr. 883/2004»: Nummer/Jahr
        nummer, jahr = a_i, b_i
    elif reihe == 'EU' or (len(a) == 4 and 1950 <= a_i <= 2030):
        jahr, nummer = a_i, b_i                         # «(EU) 2018/1724»
    elif len(b) in (2, 4):
        nummer, jahr = a_i, b_i
    else:
        return None
    if jahr < 100:
        jahr += 1900 if jahr >= 50 else 2000
    if not 1950 <= jahr <= 2030:
        return None
    return f'3{jahr}{grund}{nummer:04d}'


def eu_nennungen(text):
    """[(celex, zitat)] aus einem Wortlaut."""
    funde = []
    for m in EU_AKT.finditer(text):
        if NICHT_EU.match(text[m.end():m.end() + 60]):
            continue
        celex = eu_celex(m.group(1), m.group(2), m.group(3), m.group(4), m.group(5), 'Nr.' in m.group(0))
        if celex:
            funde.append((celex, m.group(0)))
    for m in CELEX_ROH.finditer(text):
        funde.append((f'{m.group(1)}{m.group(2)}{m.group(3)}{m.group(4)}{m.group(5) or ""}', m.group(0)))
    return funde


# ------------------------------------------------------------------ SR

SR_NR = re.compile(r'\bSR\s+(\d{1,3}(?:\.\d+)*)(?![\d.]*\d)')


# ------------------------------------------------------------------ Artikelverweise

ART_NR = r'\d+[a-z]{0,2}(?:bis|ter|quater|quinquies|sexies)?'
VERWEIS = re.compile(r'\b(?:Artikel|Artikeln|Art\.)\s+(' + ART_NR + r'(?:\s*(?:–|-|bis)\s*' + ART_NR + r')?'
                     r'(?:\s*(?:,|und|sowie|oder)\s*' + ART_NR + r'(?=\s|,|\)|;|$))*)')
QUALI = [
    # (Muster direkt nach dem Verweis, Bedeutung)
    (re.compile(r'^(?:\s+(?:Abs\.|Absatz|Absätze|Absätzen|Bst\.|Buchstabe|Buchstaben|Ziff\.|Ziffer|Unterabsatz|Satz|'
                r'erster|zweiter|dritter)[^,;()]{0,40}?)?\s+(?:dieses|des vorliegenden)\s+(Abkommens|Protokolls|Beschlusses)\b'), 'eigenes'),
    (re.compile(r'^(?:\s+(?:Abs\.|Absatz|Absätze|Bst\.|Buchstabe|Ziff\.|Ziffer)[^,;()]{0,40}?)?\s+dieses\s+(Anhangs|Gesetzes|Erlasses)\b'), 'teil'),
    (re.compile(r'^(?:\s+(?:Abs\.|Absatz|Absätze|Bst\.|Buchstabe|Ziff\.|Ziffer)[^,;()]{0,40}?)?\s+des\s+Anhangs(?:\s+([IVX]+|\d+)\b)?'), 'des_anhangs'),
    (re.compile(r'^(?:\s+(?:Abs\.|Absatz|Absätze|Absätzen|Bst\.|Buchstabe|Buchstaben|Ziff\.|Ziffer|Unterabsatz)[^,;()]{0,40}?)?'
                r'\s+des\s+Abkommens\b(?!\s+(?:vom|zwischen|über))'), 'des_abkommens'),
    (re.compile(r'^(?:\s+(?:Abs\.|Absatz|Absätze|Absätzen|Bst\.|Buchstabe|Buchstaben|Ziff\.|Ziffer|Unterabsatz)[^,;()]{0,40}?)?'
                r'\s+des\s+Protokolls\b(?!\s*\(Nr|\s+(?:vom|zwischen|über|zum))'), 'des_protokolls'),
    (re.compile(r'^(?:\s+(?:Abs\.|Absatz|Absätze|Bst\.|Buchstabe|Ziff\.|Ziffer)[^,;()]{0,40}?)?\s+(?:der|des)\s+'
                r'(Richtlinie|Verordnung|Durchführungs|Delegierten|Beschlusses|Entscheidung|Protokolls \(Nr|Vertrags|'
                r'Übereinkommens|Bundesverfassung|Abkommens vom|Abkommens zwischen|Gesetzes|Bundesgesetzes|Verordnung)'), 'extern'),
    (re.compile(r'^(?:\s+(?:Abs\.|Absatz|Absätze|Bst\.|Buchstabe|Ziff\.|Ziffer)[^,;()]{0,40}?)?\s+(E-)?([A-ZÄÖÜ][A-Za-zÄÖÜäöü\-]{1,14})\b'), 'abk'),
]
# Abkürzungen von Werken und Erlassen im Paket → Kennungspräfix des Geltungsbereichs
ABK = {
    'BHÜG': 'fga/2026/616/anh_1', 'BGVB': 'fga/2026/616/anh_2', 'KoBG': 'fga/2026/616/anh_3',
    'FZA': 'fga/2026/617', 'MRA': 'fga/2026/619', 'LandVA': 'fga/2026/621', 'LVA': 'fga/2026/621',
    'LuftVA': 'fga/2026/624', 'LwA': 'fga/2026/627', 'Agrarabkommen': 'fga/2026/627',
    'EUPA': 'fga/2026/628', 'StromA': 'fga/2026/632', 'Stromabkommen': 'fga/2026/632',
    'GesA': 'fga/2026/636', 'Gesundheitsabkommen': 'fga/2026/636',
    'AIG': 'fga/2026/616/anh_4', 'EntsG': 'fga/2026/616/anh_5',
    'IP-FZA': 'fga/2026/618', 'IP-MRA': 'fga/2026/620', 'IP-LandVA': 'fga/2026/622', 'IP-LuftVA': 'fga/2026/625',
    'ÄP-FZA': 'fga/2026/617', 'ÄP-MRA': 'fga/2026/619', 'ÄP-LandVA': 'fga/2026/621', 'ÄP-LuftVA': 'fga/2026/624',
    'ÄP-LwA': 'fga/2026/627',
}
EXTERN_ABK = {'BV', 'OR', 'ZGB', 'StGB', 'VwVG', 'BGG', 'VGG', 'KG', 'LFG', 'EUV', 'AEUV', 'EMRK', 'EWR', 'EWRA',
              'SchKG', 'BGBM', 'ParlG', 'RVOG', 'BöB', 'EBG', 'PBG', 'StromVG', 'EnG', 'LMG', 'TSG', 'HMG', 'EpG'}


def nummern(liste):
    """«13, 14 und 15» → [13, 14, 15]; «5a–5f» → [5a, 5f] (Bereich nur mit den Enden)."""
    return [x for x in re.split(r'\s*(?:,|und|sowie|oder|–|-|bis)\s*', liste) if re.fullmatch(ART_NR, x)]


def artikel_index(zettel):
    """Geltungsbereich (Kennung ohne letzten Teil) → {Artikelnummer: Zettelkennung}, dazu je Werk alle Artikel."""
    idx = collections.defaultdict(dict)
    for z in zettel:
        if z['art'] in ('artikel', 'artikel_aenderung', 'artikel_zitiert') and z['nummer']:
            nr = z['nummer'].split()[0]
            bereich = z['id'].rsplit('/', 1)[0]
            idx[bereich].setdefault(nr, z['id'])
            # zitierte Artikel eines Änderungsprotokolls: auch unter dem Werk erreichbar (FZA Art. 14 → 617)
            # nur Artikel des Abkommenstexts (unter «Art. 1 Änderungen des Abkommens»), nicht zitierte Anhänge
            if z['art'] == 'artikel_zitiert' and re.match(r'^fga/2026/\d+/art_\d+/', z['id']):
                idx['zitiert:' + '/'.join(z['id'].split('/')[:3])].setdefault(nr, z['id'])
            if z['art'] == 'artikel_aenderung':
                idx['aenderung:' + bereich.split('/ziff_')[0]].setdefault(nr, z['id'])
    return idx


AEND_PROT = {d[0] for d in DOKUMENTE if d[1].startswith('ÄP-')}         # Änderungsprotokolle
# Protokolle zu einem bestehenden Abkommen → Änderungsprotokoll, das dessen geänderte Artikel zitiert
GRUND = {617: 617, 618: 617, 619: 619, 620: 619, 621: 621, 622: 621, 623: 621, 624: 624, 625: 624, 626: 624,
         627: 627, 634: 627}
TYP = {d[0]: d[2] for d in DOKUMENTE}


def ziel_suchen(idx, praefix, nr, modus='genau'):
    """Zettel mit Artikelnummer nr im Geltungsbereich praefix.
    genau          nur Artikel direkt im Bereich (Hauptteil, Anhang, Ziffer)
    gesetz         Gesetz in einem Anhang: auch eine Ebene tiefer und unter den geänderten Artikeln
    grundabkommen  Artikel des geänderten Abkommens, wie sie ein Änderungsprotokoll zitiert"""
    if modus == 'grundabkommen':
        return idx.get('zitiert:' + praefix, {}).get(nr)
    if nr in idx.get(praefix, {}):
        return idx[praefix][nr]
    if modus == 'gesetz':
        if nr in idx.get('aenderung:' + praefix, {}):
            return idx['aenderung:' + praefix][nr]
        for bereich, nrn in idx.items():
            if bereich.startswith(praefix + '/') and nr in nrn and '/beil' not in bereich[len(praefix):]:
                return nrn[nr]
    return None


LISTENWORT = {'der', 'die', 'den', 'und', 'oder', 'sowie', 'bis', 'artikel', 'artikeln', 'art', 'absatz', 'absätze',
              'absätzen', 'abs', 'buchstabe', 'buchstaben', 'bst', 'ziffer', 'ziffern', 'ziff', 'unterabsatz', 'satz'}
ZUSATZ_ANFANG = re.compile(r'\s(?=(?:dieses|des|der)\s+(?:Abkommens|Protokolls|Anhangs|Richtlinie|Verordnung|Vertrags|'
                           r'Übereinkommens|Bundesverfassung|Beschlusses)\b|E-?[A-ZÄÖÜ][A-Za-zÄÖÜ\-]*[A-ZÄÖÜ]\b)')


def zusatz_gilt(q, bedeutung):
    """Ein Zusatz direkt nach dem Verweis; bei «abk» nur echte Abkürzungen («FZA», «E-BHÜG»), nicht «Absatz»."""
    if not q:
        return False
    if bedeutung != 'abk':
        return True
    abk = q.group(2)
    return abk in ABK or abk in EXTERN_ABK or sum(c.isupper() for c in abk) >= 2


def zusatz_nach_liste(text, ab):
    """«Artikel 1 bis 6, der Artikel 10 bis 15, der Artikel 17 oder 18 des Protokolls (Nr. 7)»: der Zusatz
    am Ende einer Aufzählung gilt für alle Glieder. Gibt den Text ab dem Zusatz zurück (mit führendem Leerschlag)."""
    rest = re.split(r'[.;:]\s|\n', text[ab:ab + 200], maxsplit=1)[0]
    for m in ZUSATZ_ANFANG.finditer(rest):
        davor = rest[:m.start()]
        woerter = re.findall(r'[A-Za-zÄÖÜäöüß]+', davor)
        if all(w.lower() in LISTENWORT or re.fullmatch(r'[a-z]{1,2}|bis|ter|quater', w) for w in woerter):
            return rest[m.start():] + text[ab + len(rest):ab + len(rest) + 40]
        return None
    return None


def einleitung_vor_liste(text, bis):
    """«Die … aufgehobenen Bestimmungen des Abkommens sind nachstehend aufgeführt: a) Artikel 1 …»:
    der Bezug steht im Satz vor dem Doppelpunkt, der die Liste einleitet."""
    davor = text[max(0, bis - 300):bis]
    m = re.search(r'([^.:]*):\s*\n(?:(?:[a-z]\)|[a-z]\.|–|-)[^\n]*\n)*(?:[a-z]\)|[a-z]\.|–|-)?\s*$', davor)
    if not m:
        return None
    satz = m.group(1) or ''
    if re.search(r'\bBestimmungen\s+(dieses|des)\s+(Abkommens|Protokolls)\b', satz):
        return ' ' + re.search(r'(dieses|des)\s+(Abkommens|Protokolls)', satz).group(0)
    return None


def verweise_zettel(z, idx, eigene_bereiche):
    """Kanten «verweist_auf» aus dem Wortlaut eines Zettels."""
    kanten, offen = [], collections.Counter()
    text = z['text']
    eigener_bereich = z['id'].rsplit('/', 1)[0]
    dok_praefix = '/'.join(z['id'].split('/')[:3])
    im_grundabkommen = z['dok'] in AEND_PROT and (z['art'] in ('artikel_zitiert', 'ziffer', 'rechtsakt')
                                                   or '/anh_' in z['id'] or '/prot_' in z['id'])
    for m in VERWEIS.finditer(text):
        nach = text[m.end():m.end() + 80]
        if not any(zusatz_gilt(muster.match(nach), bedeutung) for muster, bedeutung in QUALI):
            nach = zusatz_nach_liste(text, m.end()) or einleitung_vor_liste(text, m.start()) or nach
        ziel_praefix, regel, modus = None, None, 'genau'
        for muster, bedeutung in QUALI:
            q = muster.match(nach)
            if not zusatz_gilt(q, bedeutung):
                continue
            if bedeutung == 'eigenes':
                ziel_praefix = dok_praefix
                if im_grundabkommen:
                    regel, modus = 'dieses Abkommens: geändertes Abkommen', 'grundabkommen'
                else:
                    regel = 'dieses Abkommens/Protokolls'
            elif bedeutung == 'des_abkommens':
                if TYP[z['dok']] == 'Abkommen':
                    ziel_praefix, regel = dok_praefix, 'des Abkommens: eigenes Abkommen'
                elif z['dok'] in GRUND:
                    ziel_praefix, regel, modus = f"fga/2026/{GRUND[z['dok']]}", 'des Abkommens: Grundabkommen', 'grundabkommen'
                else:
                    ziel_praefix = 'extern'
            elif bedeutung == 'des_protokolls':
                if TYP[z['dok']] == 'Protokoll':
                    ziel_praefix, regel = dok_praefix, 'des Protokolls: eigenes Protokoll'
                else:
                    ziel_praefix = 'extern'
            elif bedeutung == 'des_anhangs':
                anh = [b for b in idx if b.startswith(dok_praefix + '/anh') and b.count('/') == 3]
                if q.group(1):
                    anh = [b for b in anh if b.endswith('/anh_' + q.group(1).lower())]
                if len(anh) == 1:
                    ziel_praefix, regel = anh[0], 'des Anhangs'
                else:
                    ziel_praefix = 'extern'                       # mehrdeutig oder Anhang eines anderen Werks
            elif bedeutung == 'teil':
                ziel_praefix, regel = eigener_bereich, 'dieses Anhangs/Gesetzes'
            elif bedeutung == 'extern':
                ziel_praefix = 'extern'
            else:
                abk = q.group(2)
                if abk in ABK:
                    ziel_praefix, regel = ABK[abk], f'Abkürzung {(q.group(1) or "") + abk}'
                    ziel_dok = int(ABK[abk].split('/')[2])
                    if ziel_dok in AEND_PROT and ABK[abk].count('/') == 2 and not abk.startswith('ÄP-'):
                        modus = 'grundabkommen'                  # «Artikel 14 FZA»: im ÄP zitierter Artikel
                    elif '/anh_' in ABK[abk]:
                        modus = 'gesetz'                         # «Artikel 2 BHÜG»: Gesetz im Anhang
                elif abk in EXTERN_ABK or sum(c.isupper() for c in abk) >= 2:
                    ziel_praefix = 'extern'                       # Abkürzung eines Erlasses ausserhalb des Pakets
            break
        if ziel_praefix == 'extern':
            continue
        if ziel_praefix is None:
            if z['dok'] == 615 or z['dok'] in (2099, 2174):
                offen['Botschaft ohne Bezug'] += 1        # in Berichten ohne Bezugswerk nicht auflösbar
                continue
            if z['art'] == 'artikel_zitiert':
                ziel_praefix, regel, modus = dok_praefix, 'ohne Zusatz: im zitierten Abkommen', 'grundabkommen'
            elif z['art'] in ('rechtsakt', 'teil', 'gliederung'):
                offen['ohne Zusatz in Anhangstext (meist Artikel eines EU-Rechtsakts)'] += 1
                continue
            else:
                ziel_praefix, regel = eigener_bereich, 'ohne Zusatz: gleicher Teil'
        for nr in nummern(m.group(1)):
            ziel = ziel_suchen(idx, ziel_praefix, nr, modus)
            r = regel
            if ziel and ziel != z['id']:
                kanten.append(dict(art='verweist_auf', von=z['id'], nach=ziel, stelle=m.group(0) + nach[:30],
                                   regel=r, status='automatisch'))
            elif ziel is None:
                offen[r] += 1
    return kanten, offen


# ------------------------------------------------------------------ Dokumentkanten

def woerter_von(s):
    return {w for w in re.findall(r'[a-zäöüß]{4,}', s.lower())
            if w not in {'zwischen', 'schweizerischen', 'eidgenossenschaft', 'europäischen', 'gemeinschaft', 'union',
                         'einerseits', 'andererseits', 'ihren', 'mitgliedstaaten', 'abkommen', 'abkommens', 'protokoll'}}


def genehmigt(zettel, dokumente):
    """Art. 1 der Bundesbeschlüsse: jede genehmigte Urkunde dem Werk mit dem ähnlichsten Titel zuordnen."""
    titel = {d['nr']: d['titel'] for d in dokumente if d['typ'] in ('Abkommen', 'Protokoll')}
    kanten = []
    for z in zettel:
        if not (z['art'] == 'artikel' and z['nummer'] == '1' and z['id'].count('/') == 3
                and next(d for d in dokumente if d['nr'] == z['dok'])['typ'] == 'Bundesbeschluss'):
            continue
        teile = re.split(r'\n(?=[a-n]\.\s)', z['text'])
        for t in teile:
            if not re.search(r'(das|Das)\s+(Änderungsprotokoll|Institutionelle Protokoll|Protokoll|Abkommen)', t):
                continue
            art_wort = re.search(r'(Änderungsprotokoll|Institutionelle Protokoll|Protokoll über staatliche Beihilfen|Protokoll|Abkommen)', t).group(1)
            w = woerter_von(t)
            beste = max(titel, key=lambda d: (art_wort.split()[0][:12].lower() in titel[d].lower(),
                                              len(w & woerter_von(titel[d])) / (len(w | woerter_von(titel[d])) or 1)))
            kanten.append(dict(art='genehmigt', von=z['id'], nach=f'fga/2026/{beste}', stelle=' '.join(t.split())[:160],
                               regel='Art. 1 Bundesbeschluss, Titelvergleich', status='automatisch'))
    return kanten


# Kapitel 2.x der Botschaft → Dokumente (Titelstichwort; Projektbrief Ziffer 7.3.5)
KAPITEL = {
    '2.1': [618, 620, 622, 625], '2.2': [623, 626, 616], '2.3': [617, 618], '2.4': [619, 620], '2.5': [621, 622, 623],
    '2.6': [624, 625, 626], '2.7': [627], '2.8': [628], '2.9': [629], '2.10': [630, 639, 640, 641],
    '2.11': [632, 631], '2.12': [634, 633], '2.13': [636, 635], '2.14': [643], '2.15': [638, 637],
}


def erlaeutert(zettel, idx, gesetze):
    """Kapitel 2.x der Botschaft → Dokumente; Erläuterung zu einem Artikel → Artikelzettel."""
    kanten, offen = [], []
    ziffern = {z['nummer']: z for z in zettel if z['dok'] == 615 and z['art'] == 'ziffer'}
    for nr, z in ziffern.items():
        for d in KAPITEL.get(nr, []):
            kanten.append(dict(art='erlaeutert', von=z['id'], nach=f'fga/2026/{d}', stelle=z['label'],
                               regel='Kapitel 2.x der Botschaft', status='automatisch'))
    ids = {z['id'] for z in zettel}
    for z in zettel:
        if z['art'] != 'erlaeuterung' or z['dok'] != 615:
            continue
        oben = re.match(r'fga/2026/615/ziff_([\d.]+)/', z['id']).group(1)
        werk, modus = bezugswerk(oben, ziffern, gesetze, idx)
        ziele = []
        mz = re.match(r'^Artikel\s+(\d+[a-z]*)\s+Ziffern?\s+([\d–\-, und]+?)\s+(?:des|der)\s+(\S+)', z['label'])
        m = re.match(r'^Art\.\s+(' + ART_NR + r')', z['label'])
        if mz:
            werk_p = ABK.get(mz.group(3)) or (werk if werk and werk.count('/') == 2 else None)
            # «… zu Artikel 55 LandVA», «… betreffend die neuen Artikel 5a–5f des FZA»: der zitierte Artikel
            zu = re.search(r'\b(?:zu|betreffend)\s+(?:den\s+|die\s+|der\s+)?(?:neuen\s+)?(?:Artikeln?|Art\.)\s+(.+?)'
                           r'(?:\s+(?:des\s+)?[A-ZÄÖÜ][\w-]*[A-ZÄÖÜ]\b|\s*\(|$)', z['label'])
            if werk_p and zu:
                for nr in nummern(zu.group(1)):
                    ziel = ziel_suchen(idx, werk_p, nr, 'grundabkommen')
                    if ziel:
                        ziele.append(ziel)
            if werk_p and not ziele:
                for zf in re.split(r'\s*(?:,|und|–|-)\s*', mz.group(2)):
                    kand = f'{werk_p}/art_{mz.group(1)}/ziff_{zf}'
                    if zf.isdigit() and kand in ids:
                        ziele.append(kand)
        elif m and werk:
            ziel = ziel_suchen(idx, werk, m.group(1), modus)
            if ziel:
                ziele.append(ziel)
        elif z['label'] == 'Präambel' and werk:
            kand = '/'.join(werk.split('/')[:3]) + '/ingress'
            if kand in ids:
                ziele.append(kand)
        for ziel in ziele:
            kanten.append(dict(art='erlaeutert', von=z['id'], nach=ziel, stelle=z['label'][:120],
                               regel=f'Erläuterung zu Artikel, Bezugswerk aus Ziffer {oben}', status='automatisch'))
        if not ziele:
            offen.append(f"{z['id']} ({oben} {ziffern[oben]['titel'][:45]})")
    return kanten, offen


# Umsetzungserlass eines Kapitels, wenn kein Titel der Ziffern das Gesetz nennt
UMSETZUNGSERLASS = {'2.10': 'Kohäsionsbeitragsgesetz'}


def kompakt(s):
    """Vergleichsform eines Gesetzesnamens: ohne Datum, Satz- und Leerzeichen, «Bundesgesetz» → «bg»."""
    s = re.sub(r'\s+vom\s+(?:\d{1,2}\.\s*\w+\s+\d{4}|…)', '', ohne_hoch(s or ''))
    s = re.sub(r'[\W\d_]+', '', s.lower())
    return s.replace('bundesgesetz', 'bg')


def bester_bereich(g, idx):
    """Fundstelle eines Gesetzes mit den meisten Artikeln (Änderungsanhang statt Beilage-Ziffer)."""
    kandidaten = [g['praefix']] + list(g['bbs'].values()) + g['stellen']
    kandidaten = {re.sub(r'/ziff_[ivx]+$', '', k) for k in kandidaten if k}       # «Anhang 5, Ziff. I» → Anhang 5
    kandidaten = {('/'.join(k.split('/')[:4]) if '/anh_' in k and '/ziff_' not in k and '/beil' not in k else k)
                  for k in kandidaten}

    def anzahl(p):
        return sum(len(n) for b, n in idx.items() if b == p or b.startswith(p + '/') or b == 'aenderung:' + p)
    return max(sorted(kandidaten), key=anzahl)


def bezugswerk(nr, ziffern, gesetze, idx):
    """(Kennungspräfix, Suchmodus) des Werks, dessen Artikel die Botschaft-Ziffer nr erläutert.
    Gesucht wird in den Titeln der Ziffer, ihrer Vorfahren und deren erster Unterziffer («2.12.9 Umsetzung in der
    Lebensmittelgesetzgebung», «2.12.9.1 Lebensmittelgesetz»): zuerst ein Gesetz des Pakets nach Name oder
    Abkürzung, dann ein Abkommen oder Protokoll des Kapitels."""
    teile = nr.split('.')
    kapitel = '.'.join(teile[:2])
    kette = ['.'.join(teile[:k]) for k in range(len(teile), 1, -1)]          # spezifischste zuerst
    for stufe in kette:
        kontext = ' '.join(ziffern[x]['titel'] for x in (stufe, stufe + '.1') if x in ziffern)
        kk = kompakt(kontext)
        treffer = []
        for g in gesetze:
            namen = {kompakt(g['titel'])} | {kompakt(x) for x in (g.get('kurz'), g.get('abk')) if x}
            if any(len(n) > 5 and n in kk for n in namen) \
                    or (g.get('abk') and re.search(r'\(' + re.escape(g['abk']) + r'\)', kontext)):
                treffer.append(g)
        if not treffer and 'Umsetzungserlass' in kontext and kapitel in UMSETZUNGSERLASS:
            ziel = kompakt(UMSETZUNGSERLASS[kapitel])
            treffer = [g for g in gesetze if ziel in kompakt(g.get('kurz') or '') or ziel in kompakt(g['titel'])]
        if treffer:
            g = max(treffer, key=lambda g: len(kompakt(g.get('kurz') or g['titel'])))
            return bester_bereich(g, idx), 'gesetz'
        if re.search(r'\bBeilage\b', kontext):
            for bb in KAPITEL.get(kapitel, []):
                if TYP[bb] == 'Bundesbeschluss':
                    return f'fga/2026/{bb}/anh/beil', 'genau'
        m = re.search(r'Artikeln des (Abkommens|Protokolls|Änderungsprotokolls)|^(Hauptteil|Horizontaler Teil|Änderungsprotokoll)', kontext)
        if m:
            docs = [d for d in KAPITEL.get(kapitel, []) if TYP[d] in ('Abkommen', 'Protokoll')]
            vorfahren = ' '.join(ziffern[x]['titel'] for x in kette if x in ziffern)
            if len(docs) > 1:
                art = 'Institutionelle' if re.search(r'Institutionelle', vorfahren) else \
                    'Änderungsprotokoll' if re.search(r'Änderungsprotokoll', vorfahren) else None
                if art:
                    docs = [d for d in docs if KURZ[d].startswith('IP-' if art == 'Institutionelle' else 'ÄP-')] or docs
            if docs:
                return f'fga/2026/{docs[0]}', 'genau'
    return None, 'genau'


def norm_text(s):
    return ' '.join(re.sub(r'[\W\d_]+', ' ', ohne_hoch(s or '')).lower().split())


# ------------------------------------------------------------------ Bundesgesetze

GESETZ_ZEILE = re.compile(r'^(Bundesgesetz\s+über.+?|[A-ZÄÖÜ][\w\-äöü]*(?:gesetz|buch|recht))\s*(?:\(([^)]*)\))?\s*vom\s+(…|\.\.\.|\d)')


def gesetze(zettel, dokumente):
    """Neue und geänderte Bundesgesetze aus den Anhängen der Bundesbeschlüsse.
    Ein Gesetz zählt einmal, auch wenn mehrere Bundesbeschlüsse es ändern (Schlüssel: bereinigter Name).
    Neu: «Bundesgesetz über … (Kurztitel, ABK) vom …» als Anhang. Wird im selben Bundesbeschluss das
    gleichnamige bisherige Gesetz aufgehoben, ist es eine Totalrevision und zählt als geändert (LMG)."""
    bbs = {d['nr'] for d in dokumente if d['typ'] == 'Bundesbeschluss' and d['nr'] in PAKET}
    liste, alias = {}, {}

    def eintrag(schluessel, bb, stelle, **kw):
        schluessel = alias.get(schluessel, schluessel)
        g = liste.setdefault(schluessel, dict(kw, bbs={}, stellen=[]))
        for k, v in kw.items():
            if v and not g.get(k):
                g[k] = v
        g['bbs'].setdefault(bb, stelle)
        g['stellen'].append(stelle)

    texte = {bb: ' '.join(z['text'] for z in zettel if z['dok'] == bb) for bb in bbs}
    for z in zettel:
        if z['dok'] not in bbs:
            continue
        txt = ohne_hoch(' '.join(z['text'].split()))
        m = re.match(r'^Anhang\s*\d*\s*\(Art\.\s*\d\)\s*(Bundesgesetz\s+über\s+.+?)\s*(?:\(([^)]+)\))?\s*vom\s*…', txt)
        if m and z['id'].count('/') == 3:
            kurz = [x.strip() for x in (m.group(2) or '').split(',')]
            name = kurz[0] if len(kurz) > 1 else m.group(1)
            abk = kurz[-1] if len(kurz) > 1 else (kurz[0] or None)
            aufgehoben = re.search(r'Das\s+' + re.escape(name) + r'\s+vom\s+\d.{0,30}?wird aufgehoben', ohne_hoch(texte[z['dok']]))
            praefix = z['id'] if z['art'] == 'teil' else z['id'].rsplit('/', 1)[0]
            schluessel = norm_gesetz(name)
            alias[norm_gesetz(m.group(1))] = schluessel
            if abk:
                alias[norm_gesetz(abk)] = schluessel
            eintrag(schluessel, z['dok'], z['id'], titel=m.group(1), kurz=name if name != m.group(1) else None, abk=abk,
                    neu=not aufgehoben, totalrevision=bool(aufgehoben), sr=None, praefix=praefix)
            continue
        m = re.match(r'^Anhang\s*\d*\s*\(Art\.\s*\d\)\s*Änderung des (.+?)\s+I\s+Das\s+(.+?)\s+vom\s+(\d.*?\d{4})', txt)
        if m:
            sr = fn_sr(z, re.search(r'vom\s+\d.*?\d{4}([⁰¹²³⁴⁵⁶⁷⁸⁹]+)', ' '.join(z['text'].split())))
            eintrag(norm_gesetz(m.group(2)), z['dok'], z['id'], titel=f'{m.group(2)} vom {m.group(3)}', neu=False,
                    sr=sr, praefix='/'.join(z['id'].split('/')[:4]))
            continue
        if z['art'] == 'ziffer' and '/ziff_' in z['id']:
            titel = ohne_hoch(z['titel'])
            if not re.search(r'gesetz|Gesetz|buch\b|recht\b', titel):
                continue
            sr = None
            for f in z['fussnoten'][:1]:
                s = re.search(r'SR\s+(\d[\d.]*\d)', f['text'])
                sr = s.group(1) if s else None
            eintrag(norm_gesetz(titel), z['dok'], z['id'], titel=re.sub(r'(?<=[a-zäöü]-)\s*\d+\s*(?=und)', ' ', titel),
                    neu=False, sr=sr, praefix=z['id'])
    # gleiche SR-Nummer, leicht anderer Titel im Text («und die Nachprüfung» / «und Nachprüfung»): ein Gesetz
    nach_sr = {}
    for schluessel, g in list(liste.items()):
        if g.get('sr') and g['sr'] in nach_sr:
            ziel = liste[nach_sr[g['sr']]]
            for bb, stelle in g['bbs'].items():
                ziel['bbs'].setdefault(bb, stelle)
            ziel['stellen'] += g['stellen']
            ziel.setdefault('titel_varianten', []).append(g['titel'])
            del liste[schluessel]
        elif g.get('sr'):
            nach_sr[g['sr']] = schluessel
    for g in liste.values():
        g['neu'] = bool(g.get('neu'))
        g['totalrevision'] = bool(g.get('totalrevision'))
    return list(liste.values())


def ohne_hoch(s):
    return re.sub(r'[⁰¹²³⁴⁵⁶⁷⁸⁹]+', '', s)


def fn_sr(z, treffer):
    if not treffer:
        return None
    nr = treffer.group(1).translate(str.maketrans('⁰¹²³⁴⁵⁶⁷⁸⁹', '0123456789'))
    for f in z['fussnoten']:
        if str(f['nr']) == nr:
            s = re.search(r'SR\s+(\d[\d.]*\d)', f['text'])
            return s.group(1) if s else None
    return None


def norm_gesetz(t):
    """Name ohne Datum, Fussnotenzeichen, Ziffern und Satzzeichen: «Regierungs- und Verwaltungsorganisationsgesetz»."""
    t = re.sub(r'\s+vom\s+(?:\d{1,2}\.\s*\w+\s+\d{4}|…|\.\.\.)', '', ohne_hoch(t))
    t = re.sub(r'^Bundesgesetz\s+über\s+', 'BG über ', t)
    return ' '.join(re.sub(r'[\W\d_]+', ' ', t).lower().split())


# ------------------------------------------------------------------ EUR-Lex

def eurlex_titel(celex_liste):
    """Titel (Deutsch) und Existenz der CELEX-Nummern über den SPARQL-Endpunkt des Amts für Veröffentlichungen."""
    ergebnis = {}
    for i in range(0, len(celex_liste), 40):
        teil = celex_liste[i:i + 40]
        werte = ' '.join(f'"{c}"^^<http://www.w3.org/2001/XMLSchema#string>' for c in teil)
        abfrage = f'''PREFIX cdm: <http://publications.europa.eu/ontology/cdm#>
SELECT ?celex ?titel WHERE {{
  VALUES ?celex {{ {werte} }}
  ?werk cdm:resource_legal_id_celex ?celex .
  OPTIONAL {{ ?ausdr cdm:expression_belongs_to_work ?werk ;
              cdm:expression_uses_language <http://publications.europa.eu/resource/authority/language/DEU> ;
              cdm:expression_title ?titel }}
}}'''
        url = 'https://publications.europa.eu/webapi/rdf/sparql?' + urllib.parse.urlencode(
            {'query': abfrage, 'format': 'application/sparql-results+json'})
        req = urllib.request.Request(url, headers={'Accept': 'application/sparql-results+json',
                                                   'User-Agent': 'vertragsspiegel-verweise/1.0'})
        with urllib.request.urlopen(req, timeout=120) as r:
            for b in json.load(r)['results']['bindings']:
                ergebnis[b['celex']['value']] = b.get('titel', {}).get('value', '')
    return ergebnis


# ------------------------------------------------------------------ Hauptteil

def main():
    utf8_ausgabe()
    daten = json.loads((DATEN / 'zettel.json').read_text(encoding='utf8'))
    zettel, dokumente = daten['zettel'], daten['dokumente']
    ids = {z['id'] for z in zettel}
    idx = artikel_index(zettel)
    kanten = []

    # teil_von: nächster übergeordneter Zettel, sonst das Dokument
    for z in zettel:
        teile = z['id'].split('/')
        ziel = f"fga/2026/{z['dok']}"
        for k in range(len(teile) - 1, 3, -1):
            kand = '/'.join(teile[:k])
            if kand in ids:
                ziel = kand
                break
        m = re.fullmatch(r'(fga/2026/\d+)/ziff_([\d.]+)', z['id'])
        if m and '.' in m.group(2):                      # Botschaft, Bericht: 2.2.7.1 gehört zu 2.2.7
            nr = m.group(2)
            while '.' in nr:
                nr = nr.rsplit('.', 1)[0]
                if f'{m.group(1)}/ziff_{nr}' in ids:
                    ziel = f'{m.group(1)}/ziff_{nr}'
                    break
        kanten.append(dict(art='teil_von', von=z['id'], nach=ziel, stelle='', regel='Gliederung', status='automatisch'))

    # nennt: EU-Rechtsakte und SR-Nummern in Wortlaut und Fussnoten
    eu = {}
    sr = collections.Counter()
    for z in zettel:
        texte = [z['text']] + [f['text'] for f in z['fussnoten']]
        gesehen_eu, gesehen_sr = set(), set()
        for t in texte:
            for celex, zitat in eu_nennungen(t):
                eu.setdefault(celex, dict(celex=celex, zitate=collections.Counter()))['zitate'][zitat] += 1
                if celex not in gesehen_eu:
                    gesehen_eu.add(celex)
                    kanten.append(dict(art='nennt', von=z['id'], nach=f'celex:{celex}', stelle=zitat,
                                       regel='EU-Rechtsakt', status='automatisch'))
            for m in SR_NR.finditer(t):
                nr = m.group(1)
                sr[nr] += 1
                if nr not in gesehen_sr:
                    gesehen_sr.add(nr)
                    kanten.append(dict(art='nennt', von=z['id'], nach=f'sr:{nr}', stelle=m.group(0),
                                       regel='SR-Nummer', status='automatisch'))
        if z['art'] == 'rechtsakt' and z['nummer']:
            c = z['nummer']
            eu.setdefault(c, dict(celex=c, zitate=collections.Counter()))['zitate'][z['titel'][:80]] += 1

    # verweist_auf
    offen_verweise = collections.Counter()
    for z in zettel:
        k, offen = verweise_zettel(z, idx, None)
        kanten.extend(k)
        offen_verweise.update(offen)

    # aendert, genehmigt, erlaeutert
    gl = gesetze(zettel, dokumente)
    for g in gl:
        g['id'] = 'gesetz:' + (g['sr'] or norm_gesetz(g['titel']).replace(' ', '_'))
        for bb, stelle in g['bbs'].items():
            kanten.append(dict(art='aendert', von=f'fga/2026/{bb}', nach=g['id'], stelle=stelle,
                               regel='neues Gesetz im Anhang' if g['neu'] else
                               ('Totalrevision im Anhang' if g['totalrevision'] else 'Änderung im Anhang'),
                               status='automatisch', neu=g['neu']))
    kanten.extend(genehmigt(zettel, dokumente))
    k_erl, offen_erl = erlaeutert(zettel, idx, gl)
    kanten.extend(k_erl)

    # EUR-Lex
    # EUR-Lex: Zwischenspeicher daten/eurlex.json {celex: titel oder null (nicht gefunden)}
    cache_pfad = DATEN / 'eurlex.json'
    cache = json.loads(cache_pfad.read_text(encoding='utf8')) if cache_pfad.exists() else {}
    if '--eurlex' in sys.argv:
        neu = sorted(c for c in eu if c not in cache)
        try:
            gefunden = eurlex_titel(neu) if neu else {}
            cache.update({c: gefunden.get(c) for c in neu})
            cache_pfad.write_text(json.dumps(dict(sorted(cache.items())), ensure_ascii=False, indent=0) + '\n', encoding='utf8')
            print(f'EUR-Lex: {len(neu)} Nummern abgefragt, {sum(1 for c in neu if gefunden.get(c) is not None)} gefunden')
        except Exception as e:  # Netz, Endpunkt
            print(f'EUR-Lex nicht abfragbar: {e}')
    for c, v in eu.items():
        v['zitate'] = [z for z, _ in v['zitate'].most_common(3)]
        if c in cache:
            v['gefunden'] = cache[c] is not None
            v['titel'] = cache[c] or ''

    aus = dict(stand=date.today().isoformat(), kanten=kanten, gesetze=gl,
               eu_rechtsakte=dict(sorted(eu.items())), sr_erlasse=dict(sorted(sr.items())),
               offen=dict(verweise=dict(offen_verweise), erlaeuterungen=offen_erl))
    ziel = DATEN / 'kanten.json'
    ziel.write_text(json.dumps(aus, ensure_ascii=False, separators=(',', ':')), encoding='utf8')
    arten = collections.Counter(k['art'] for k in kanten)
    print(f"{len(kanten)} Kanten: {dict(arten)}")
    print(f"EU-Rechtsakte {len(eu)}, SR-Nummern {len(sr)}, Gesetze {len(gl)} "
          f"(neu {sum(g['neu'] for g in gl)}, geändert {sum(not g['neu'] for g in gl)})")
    print(f"Verweise ohne Ziel: {dict(offen_verweise)}; Erläuterungen ohne Ziel: {len(offen_erl)}")
    print(f"{ziel.stat().st_size // 1024} KB in {ziel.relative_to(DATEN.parent)}")


if __name__ == '__main__':
    main()
