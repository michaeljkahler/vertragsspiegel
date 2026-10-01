"""Prüft den Beratungsstand des Geschäfts 26.023 (Paket Schweiz–EU) im Parlament.

Probelauf (schreibt nichts):   python3 scripts/parlament_pruefen.py
Stand übernehmen:              python3 scripts/parlament_pruefen.py --apply

Quelle: Webservice der Parlamentsdienste, https://ws-old.parlament.ch/affairs/20260023
(dieselben Angaben wie Curia Vista, Geschäft 26.023). Verglichen wird mit
daten/parlament_stand.json: Geschäftsstatus und die Beschlüsse je Entwurf (Datum, Rat, Text).

Abbruchcodes: 0 = unverändert, 3 = neue Schritte, 1 = Fehler (Webservice nicht erreichbar).
Nur Standardbibliothek.
"""
import json
import pathlib
import sys
import urllib.request
from datetime import date

WURZEL = pathlib.Path(__file__).resolve().parent.parent
STAND = WURZEL / 'daten' / 'parlament_stand.json'
URL = 'https://ws-old.parlament.ch/affairs/20260023?lang=de'
CURIA = 'https://www.parlament.ch/de/ratsbetrieb/suche-curia-vista/geschaeft?AffairId=20260023'


def erheben():
    req = urllib.request.Request(URL, headers={'Accept': 'application/json',
                                               'User-Agent': 'vertragsspiegel-parlament-pruefen/1.0'})
    with urllib.request.urlopen(req, timeout=60) as r:
        d = json.load(r)
    entwuerfe = {}
    for dr in d.get('drafts', []):
        titel = next((t.get('value', '') for t in dr.get('texts', [])
                      if isinstance(t.get('type'), dict) and t['type'].get('name') == 'Titel der Vorlage'), '')
        beschluesse = [[r.get('date', '')[:10], (r.get('council') or {}).get('abbreviation', ''), r.get('text', '')]
                       for r in (dr.get('consultation') or {}).get('resolutions', [])]
        entwuerfe[str(dr.get('index'))] = {'titel': ' '.join(titel.split()), 'beschluesse': beschluesse}
    return {'geprueft': date.today().isoformat(), 'geschaeft': d.get('shortId'), 'titel': d.get('title'),
            'status': (d.get('state') or {}).get('name', ''), 'aktualisiert': d.get('updated', ''),
            'entwuerfe': entwuerfe, 'quelle': CURIA}


def vergleichen(alt, neu):
    befunde = []
    if alt.get('status') != neu['status']:
        befunde.append(f"Geschäftsstatus: {alt.get('status') or '?'} → {neu['status']}")
    for nr, e in sorted(neu['entwuerfe'].items(), key=lambda x: int(x[0])):
        bisher = {tuple(b) for b in alt.get('entwuerfe', {}).get(nr, {}).get('beschluesse', [])}
        for b in e['beschluesse']:
            if tuple(b) not in bisher:
                befunde.append(f"Entwurf {nr} ({e['titel'][:80] or 'ohne Titel'}): {b[0]} {b[1]}: {b[2]}")
    return befunde


def main():
    try:
        neu = erheben()
    except Exception as e:
        print(f'FEHLER: Webservice nicht abfragbar: {e}')
        sys.exit(1)
    alt = json.loads(STAND.read_text(encoding='utf8')) if STAND.exists() else {}
    befunde = vergleichen(alt, neu) if alt else []
    if not alt:
        n = sum(len(e['beschluesse']) for e in neu['entwuerfe'].values())
        print(f"Kein Stand vorhanden. Status «{neu['status']}», {len(neu['entwuerfe'])} Entwürfe, {n} Beschlüsse. Mit --apply übernehmen.")
    elif not befunde:
        print(f"Unverändert seit {alt.get('geprueft', '?')}: Status «{neu['status']}».")
    else:
        print(f"{len(befunde)} neue Schritte seit {alt.get('geprueft', '?')}:")
        for i, b in enumerate(befunde, 1):
            print(f'{i}. {b}')
    if '--apply' in sys.argv:
        STAND.parent.mkdir(parents=True, exist_ok=True)
        STAND.write_text(json.dumps(neu, ensure_ascii=False, indent=1), encoding='utf8')
        print(f'Stand geschrieben: {STAND.relative_to(WURZEL)}')
    sys.exit(3 if befunde else 0)


if __name__ == '__main__':
    main()
