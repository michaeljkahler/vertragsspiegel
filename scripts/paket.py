"""Gemeinsame Angaben und Textregeln für gliedern.py, verweise.py und pruefen.py.

Dokumentliste: Kurzname, Typ und Vorlage je Werk. Titel und Adressen stehen in daten/quellen.json.
"""
import json
import pathlib
import re
import sys

WURZEL = pathlib.Path(__file__).resolve().parent.parent
DATEN = WURZEL / 'daten'

# nr, kurz, typ, gruppe
DOKUMENTE = [
    (615, 'Botschaft', 'Botschaft', 'botschaft'),
    (616, 'BB Stabilisierung', 'Bundesbeschluss', 'stab'),
    (617, 'ÄP-FZA', 'Protokoll', 'stab'),
    (618, 'IP-FZA', 'Protokoll', 'stab'),
    (619, 'ÄP-MRA', 'Protokoll', 'stab'),
    (620, 'IP-MRA', 'Protokoll', 'stab'),
    (621, 'ÄP-LandVA', 'Protokoll', 'stab'),
    (622, 'IP-LandVA', 'Protokoll', 'stab'),
    (623, 'Beihilfeprotokoll LandVA', 'Protokoll', 'stab'),
    (624, 'ÄP-LuftVA', 'Protokoll', 'stab'),
    (625, 'IP-LuftVA', 'Protokoll', 'stab'),
    (626, 'Beihilfeprotokoll LuftVA', 'Protokoll', 'stab'),
    (627, 'ÄP-LwA', 'Protokoll', 'stab'),
    (628, 'EUPA', 'Abkommen', 'stab'),
    (629, 'EUSPA-Abkommen', 'Abkommen', 'stab'),
    (630, 'Beitragsabkommen', 'Abkommen', 'stab'),
    (631, 'BB Elektrizität', 'Bundesbeschluss', 'strom'),
    (632, 'Stromabkommen', 'Abkommen', 'strom'),
    (633, 'BB Lebensmittelsicherheit', 'Bundesbeschluss', 'lms'),
    (634, 'Protokoll Lebensmittelsicherheit', 'Protokoll', 'lms'),
    (635, 'BB Gesundheit', 'Bundesbeschluss', 'ges'),
    (636, 'Gesundheitsabkommen', 'Abkommen', 'ges'),
    (637, 'BB Parl. Zusammenarbeit', 'Bundesbeschluss', 'weitere'),
    (638, 'Protokoll Parl. Zusammenarbeit', 'Protokoll', 'weitere'),
    (639, 'BB Kredit Kohäsion', 'Bundesbeschluss', 'weitere'),
    (640, 'BB Kredit Migration', 'Bundesbeschluss', 'weitere'),
    (641, 'BB Kredit zus. Kohäsion', 'Bundesbeschluss', 'weitere'),
    (642, 'BB Kredit Erasmus+', 'Bundesbeschluss', 'weitere'),
    (643, 'Erklärung Hochrangiger Dialog', 'Erklärung', 'weitere'),
    (644, 'Erklärung Übergangszeit', 'Erklärung', 'weitere'),
    (2099, 'Bericht SPK-S Verfassungsanpassung', 'Bericht', 'begleit'),
    (2100, 'BB Verfassungsanpassung (Entwurf SPK-S)', 'Bundesbeschluss', 'begleit'),
    (2174, 'Stellungnahme Bundesrat zur Pa. Iv.', 'Stellungnahme', 'begleit'),
]
GRUPPEN = [
    ('botschaft', 'Botschaft'),
    ('stab', 'Stabilisierung'),
    ('strom', 'Elektrizität'),
    ('lms', 'Lebensmittelsicherheit'),
    ('ges', 'Gesundheit'),
    ('weitere', 'Weitere Beschlüsse und Erklärungen'),
    ('begleit', 'Begleitgeschäft: Parlamentarische Initiative 26.425'),
]
PAKET = [d[0] for d in DOKUMENTE if 615 <= d[0] <= 644]

WORT = re.compile(r'[^\W⁰¹²³⁴⁵⁶⁷⁸⁹]+')       # Wörter; hochgestellte Fussnotenzeichen zählen nicht
HOCH = str.maketrans('0123456789', '⁰¹²³⁴⁵⁶⁷⁸⁹')
# Nach einem Trennstrich am Zeilenende bleibt der Strich stehen, wenn das nächste Wort eines dieser ist
# («Güter- und Personenverkehr»).
BINDEWORT = {'und', 'oder', 'bis', 'sowie', 'bzw', 'als', 'noch', 'wie', 'resp', 'beziehungsweise'}
AUFZAEHLUNG = re.compile(r'^(?:\d+[a-z]*(?:bis|ter|quater)?\s|\d+\.\s|[a-z]{1,6}\.\s|[a-z]\)\s|[–—•-]\s|\([a-z0-9]+\)\s|[ivx]+\)\s)')


def woerter(s):
    return len(WORT.findall(s))


def hoch(n):
    return str(n).translate(HOCH)


def fliesstext(zeilen):
    """Zeilen aus pdftotext -layout zu Absätzen. Silbentrennung am Zeilenende wird aufgelöst,
    Leerzeilen und Aufzählungen beginnen einen neuen Absatz."""
    absaetze, cur = [], ''
    for z in zeilen:
        t = ' '.join(z.split())
        if not t:
            if cur:
                absaetze.append(cur)
            cur = ''
            continue
        if not cur:
            cur = t
        elif AUFZAEHLUNG.match(t) or cur.endswith(':'):
            absaetze.append(cur)
            cur = t
        elif re.search(r'[A-Za-zÄÖÜäöüß]-$', cur):
            erstes = re.match(r'[\wäöüÄÖÜß]+', t)
            if erstes and erstes.group(0)[0].islower() and erstes.group(0).rstrip('.') not in BINDEWORT:
                cur = cur[:-1] + t                       # Silbentrennung: «Europäi-» + «schen»
            elif erstes and erstes.group(0).rstrip('.') in BINDEWORT:
                cur = cur + ' ' + t                      # «Güter- und»
            else:
                cur = cur + t                            # «EU-» + «Recht»
        else:
            cur = cur + ' ' + t
    if cur:
        absaetze.append(cur)
    return '\n'.join(absaetze)


def utf8_ausgabe():
    """Windows-Konsole: Ausgabe als UTF-8, damit Umlaute und Sonderzeichen nicht abbrechen."""
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except (AttributeError, ValueError):
        pass


def quellen(sprache='de'):
    return json.loads((DATEN / 'quellen.json').read_text(encoding='utf8')).get(sprache, {})


def text_pfad(nr, sprache='de'):
    return DATEN / 'text' / sprache / f'{nr}.txt'
