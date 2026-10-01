"""Prüft auf Fedlex, ob sich am Paket Schweiz–EU (Bilaterale III) etwas geändert hat.

Probelauf (schreibt nichts):   python3 scripts/fedlex_pruefen.py
Stand übernehmen:              python3 scripts/fedlex_pruefen.py --apply
Bericht als JSON:              python3 scripts/fedlex_pruefen.py --json

Verglichen wird mit daten/fedlex_stand.json:
  1. die 30 Einträge BBl 2026 615–644 (Botschaft, Abkommen, Bundesbeschlüsse):
     Änderungsdatum, Publikationsumfang («by-reference» oder «complete»),
     vorhandene Dateiformate je Sprache, Volltext-Anhänge und deren Dateien;
  2. neue Einträge im Bundesblatt seit dem 19. März 2026, deren Titel das Paket nennt
     (Kommissionsberichte, Entwürfe, Stellungnahmen, Schlussabstimmungstexte);
  3. neue Einträge in der Amtlichen Sammlung (AS), deren Titel das Paket nennt.

Abbruchcodes: 0 = unverändert, 3 = Änderungen gefunden, 1 = Fehler (Fedlex nicht erreichbar).
Nur Standardbibliothek, damit der Lauf überall geht, wo Python 3 läuft.
"""
import json
import pathlib
import sys
import urllib.parse
import urllib.request
from datetime import date

WURZEL = pathlib.Path(__file__).resolve().parent.parent
STAND = WURZEL / 'daten' / 'fedlex_stand.json'
ENDPUNKT = 'https://fedlex.data.admin.ch/sparqlendpoint'
FEST = list(range(615, 645))                      # BBl 2026 615–644
SEIT = '2026-03-19'                               # Tag nach der Publikation der Botschaft
MUSTER = 'Bilateralen? III|Paket Schweiz.EU|Beziehungen Schweiz.EU|Stabilisierung der Beziehungen'
SPRACHEN = {'DEU': 'de', 'FRA': 'fr', 'ITA': 'it'}
PREFIX = 'PREFIX jolux: <http://data.legilux.public.lu/resource/ontology/jolux#>\n' \
         'PREFIX dct: <http://purl.org/dc/terms/>\n' \
         'PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>\n'


def sparql(abfrage):
    url = ENDPUNKT + '?' + urllib.parse.urlencode({'query': PREFIX + abfrage})
    req = urllib.request.Request(url, headers={'Accept': 'application/sparql-results+json',
                                               'User-Agent': 'vertragsspiegel-fedlex-pruefen/1.0'})
    with urllib.request.urlopen(req, timeout=90) as r:
        return json.load(r)['results']['bindings']


def kurz(uri):
    return uri.replace('https://fedlex.data.admin.ch/', '')


def werk_zustand(eli_liste):
    """Änderungsdatum, Umfang, Formate und Dateien je Werk und Anhang."""
    werte = ' '.join(f'<https://fedlex.data.admin.ch/{e}>' for e in eli_liste)
    zeilen = sparql(f'''
SELECT ?werk ?geaendert ?umfang ?anhang ?anhGeaendert ?sprache ?format ?datei ?titel WHERE {{
  VALUES ?werk {{ {werte} }}
  OPTIONAL {{ ?werk dct:modified ?geaendert }}
  OPTIONAL {{ ?werk jolux:legalResourcePublicationCompleteness ?umfang }}
  OPTIONAL {{ ?werk jolux:isRealizedBy ?td . ?td jolux:language <http://publications.europa.eu/resource/authority/language/DEU> ; jolux:title ?titel }}
  {{
    ?werk jolux:isRealizedBy ?e . ?e jolux:language ?sprache . ?e jolux:isEmbodiedBy ?m .
    ?m jolux:format ?format . OPTIONAL {{ ?m jolux:isExemplifiedBy ?datei }}
    BIND("" AS ?anhang)
  }} UNION {{
    ?werk jolux:workHasAnnex ?anhang . OPTIONAL {{ ?anhang dct:modified ?anhGeaendert }}
    ?anhang jolux:isRealizedBy ?e . ?e jolux:language ?sprache . ?e jolux:isEmbodiedBy ?m .
    ?m jolux:format ?format . OPTIONAL {{ ?m jolux:isExemplifiedBy ?datei }}
  }}
}}''')
    stand = {}
    for z in zeilen:
        w = kurz(z['werk']['value'])
        s = stand.setdefault(w, {'titel': '', 'geaendert': '', 'umfang': '', 'dateien': {}, 'anhaenge': {}})
        s['titel'] = z.get('titel', {}).get('value', s['titel'])
        s['geaendert'] = z.get('geaendert', {}).get('value', s['geaendert'])
        s['umfang'] = z.get('umfang', {}).get('value', s['umfang']).rsplit('/', 1)[-1]
        spr = SPRACHEN.get(z['sprache']['value'].rsplit('/', 1)[-1], z['sprache']['value'].rsplit('/', 1)[-1])
        fmt = z['format']['value'].rsplit('/', 1)[-1]
        datei = z.get('datei', {}).get('value', '')
        anh = z.get('anhang', {}).get('value', '')
        if anh:
            a = s['anhaenge'].setdefault(kurz(anh), {'geaendert': z.get('anhGeaendert', {}).get('value', ''), 'dateien': {}})
            a['dateien'].setdefault(spr, {})[fmt] = datei
        else:
            s['dateien'].setdefault(spr, {})[fmt] = datei
    return stand


def neue_eintraege(sammlung):
    """Einträge im Bundesblatt (fga) oder in der AS (oc) seit SEIT, deren Titel das Paket nennt."""
    zeilen = sparql(f'''
SELECT DISTINCT ?werk ?datum ?titel WHERE {{
  ?werk jolux:publicationDate ?datum .
  FILTER(?datum >= "{SEIT}"^^xsd:date)
  FILTER(STRSTARTS(STR(?werk), "https://fedlex.data.admin.ch/eli/{sammlung}/"))
  ?werk jolux:isRealizedBy ?e . ?e jolux:language <http://publications.europa.eu/resource/authority/language/DEU> .
  ?e jolux:title ?titel .
  FILTER(REGEX(?titel, "{MUSTER}", "i"))
}} ORDER BY ?datum''')
    return {kurz(z['werk']['value']): {'datum': z['datum']['value'], 'titel': z['titel']['value']} for z in zeilen}


def erheben():
    fest = [f'eli/fga/2026/{n}' for n in FEST]
    weitere = neue_eintraege('fga')
    as_eintraege = neue_eintraege('oc')
    zus = sorted(set(weitere) - set(fest))
    werke = werk_zustand(fest + zus) if zus else werk_zustand(fest)
    return {'geprueft': date.today().isoformat(), 'werke': werke,
            'bbl_neu': {k: v for k, v in weitere.items() if k not in fest}, 'as': as_eintraege}


def vergleichen(alt, neu):
    befunde = []
    aw, nw = alt.get('werke', {}), neu['werke']
    for w, n in sorted(nw.items()):
        a = aw.get(w)
        name = f"{w.replace('eli/fga/', 'BBl ').replace('/', ' ')} {n['titel'][:70]}"
        if a is None:
            befunde.append(('neu_beobachtet', name, 'erstmals im Stand'))
            continue
        if a['umfang'] != n['umfang']:
            befunde.append(('umfang', name, f"{a['umfang'] or '?'} → {n['umfang'] or '?'}"))
        if a['geaendert'] != n['geaendert']:
            befunde.append(('geaendert', name, f"{a['geaendert'] or '?'} → {n['geaendert'] or '?'}"))
        for spr in sorted(set(a['dateien']) | set(n['dateien'])):
            fa, fn = set(a['dateien'].get(spr, {})), set(n['dateien'].get(spr, {}))
            if fa != fn:
                befunde.append(('formate', name, f"{spr}: {sorted(fa)} → {sorted(fn)}"))
            for f in fa & fn:
                if a['dateien'][spr][f] != n['dateien'][spr][f]:
                    befunde.append(('datei', name, f"{spr}/{f}: neue Datei {n['dateien'][spr][f]}"))
        for anh in sorted(set(a['anhaenge']) | set(n['anhaenge'])):
            xa, xn = a['anhaenge'].get(anh), n['anhaenge'].get(anh)
            if xa is None or xn is None:
                befunde.append(('anhang', name, f"{anh} {'neu' if xa is None else 'entfallen'}"))
                continue
            if xa['geaendert'] != xn['geaendert']:
                befunde.append(('anhang', name, f"{anh} geändert {xa['geaendert'] or '?'} → {xn['geaendert'] or '?'}"))
            for spr in sorted(set(xa['dateien']) | set(xn['dateien'])):
                da, dn = xa['dateien'].get(spr, {}), xn['dateien'].get(spr, {})
                if set(da) != set(dn):
                    befunde.append(('anhang', name, f"{anh} {spr}: {sorted(da)} → {sorted(dn)}"))
                elif any(da[f] != dn[f] for f in da):
                    befunde.append(('anhang', name, f"{anh} {spr}: neue Datei"))
    for w in sorted(set(aw) - set(nw)):
        befunde.append(('entfallen', w, 'nicht mehr auf Fedlex gefunden'))
    for k, v in neu['bbl_neu'].items():
        if k not in alt.get('bbl_neu', {}):
            befunde.append(('bbl_neu', f"{k.replace('eli/fga/', 'BBl ').replace('/', ' ')}", f"{v['datum']} {v['titel']}"))
    for k, v in neu['as'].items():
        if k not in alt.get('as', {}):
            befunde.append(('as_neu', k, f"{v['datum']} {v['titel']}"))
    return befunde


ART = {
    'umfang': 'Publikationsumfang geändert (Vollpublikation?)',
    'geaendert': 'Änderungsdatum auf Fedlex neu',
    'formate': 'Dateiformate geändert',
    'datei': 'Datei ersetzt',
    'anhang': 'Volltext-Anhang geändert',
    'entfallen': 'Eintrag entfallen',
    'neu_beobachtet': 'Neu im beobachteten Bestand',
    'bbl_neu': 'Neuer Bundesblatt-Eintrag zum Paket',
    'as_neu': 'Neuer Eintrag in der Amtlichen Sammlung zum Paket',
}


def main():
    apply = '--apply' in sys.argv
    try:
        neu = erheben()
    except Exception as e:  # Netz, Endpunkt, Antwortformat
        print(f'FEHLER: Fedlex nicht abfragbar: {e}')
        sys.exit(1)
    alt = json.loads(STAND.read_text(encoding='utf8')) if STAND.exists() else {}
    befunde = vergleichen(alt, neu) if alt else []
    if '--json' in sys.argv:
        print(json.dumps({'geprueft': neu['geprueft'], 'befunde': befunde}, ensure_ascii=False, indent=1))
    elif not alt:
        print(f"Kein Stand vorhanden. Erfasst: {len(neu['werke'])} Werke, {len(neu['bbl_neu'])} weitere BBl-Einträge, "
              f"{len(neu['as'])} AS-Einträge. Mit --apply übernehmen.")
    elif not befunde:
        print(f"Unverändert seit {alt.get('geprueft', '?')}: {len(neu['werke'])} Werke, "
              f"{len(neu['bbl_neu'])} weitere BBl-Einträge, {len(neu['as'])} AS-Einträge.")
    else:
        print(f"{len(befunde)} Änderungen seit {alt.get('geprueft', '?')}:")
        for i, (art, wo, was) in enumerate(befunde, 1):
            print(f'{i}. {ART.get(art, art)}: {wo}: {was}')
    if apply:
        STAND.parent.mkdir(parents=True, exist_ok=True)
        STAND.write_text(json.dumps(neu, ensure_ascii=False, indent=1, sort_keys=True), encoding='utf8')
        print(f'Stand geschrieben: {STAND.relative_to(WURZEL)}')
    sys.exit(3 if befunde else 0)


if __name__ == '__main__':
    main()
