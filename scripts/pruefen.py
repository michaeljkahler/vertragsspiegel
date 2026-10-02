"""Selbstprüfung nach Projektbrief Ziffer 9. Bricht mit Abbruchcode 2 ab, wenn eine Prüfung scheitert.

Alle Prüfungen:        python3 scripts/pruefen.py
Bericht als JSON:      python3 scripts/pruefen.py --json

Liest daten/zettel.json (gliedern.py) und, falls vorhanden, daten/kanten.json (verweise.py).
  1. Wörter: Summe der Zettel je Werk gleich der unabhängigen Zählung über den ganzen Rumpf.
  2. Artikel: lückenlose Nummernfolge je Abkommen, Protokoll, Bundesbeschluss und Gesetz.
     Zitierte Artikel (Änderungsprotokolle) und Artikel in Änderungslisten sind ausgenommen,
     weil sie nur die geänderten Artikel enthalten. Abweichungen werden einzeln gemeldet.
  3. Botschaft: jede Ziffer des Inhaltsverzeichnisses hat einen Zettel.
  4. Gesetze: 36 geänderte und 3 neue Bundesgesetze laut Botschaft (aus kanten.json).
  5. EU-Rechtsakte: jede erkannte Nummer hat eine CELEX-Nummer (aus kanten.json), und jeder der 95
     Gesetzgebungsakte der EDA-Übersicht (daten/eda_liste.json, eda_abgleich.py) ist im Paket genannt.
  6. Stichprobe: 20 zufällige Kanten zum Nachprüfen von Hand, Ergebnis ins Korrekturprotokoll.
Prüfungen 4 bis 6 laufen erst, wenn kanten.json besteht.
"""
import collections
import json
import random
import re
import sys

from paket import DATEN, utf8_ausgabe

GESETZE_GEAENDERT, GESETZE_NEU = 36, 3
# Fehler in der Vorlage, im Korrekturprotokoll (docs/KORREKTUREN.md) gemeldet: kein Abbruch, aber Ausweis
VORLAGEFEHLER_EU = {
    '32024L01366': '632 Anhang I Nr. 15: CELEX «32024 L 01366» statt 32024R1366',
    '32022R3271': '615 Ziff. 2.13: «(EU) 2022/3271», gemeint wohl 2022/2371',
}


def nummer_teile(nr):
    """«4a» → (4, 'a'); «III.2» → ('III', 2); sonst None."""
    m = re.fullmatch(r'(\d+)([a-z]*(?:bis|ter|quater|quinquies|sexies|septies|octies)?)', nr or '')
    if m:
        return int(m.group(1)), m.group(2)
    m = re.fullmatch(r'([IVXLC]+)\.(\d+)', nr or '')
    if m:
        return m.group(1), int(m.group(2))
    return None


def artikelfolge(zettel):
    """Lücken und Sprünge in der Artikelfolge je Geltungsbereich (Werk und Teil)."""
    bereiche = collections.defaultdict(list)
    for z in zettel:
        if z['art'] != 'artikel':
            continue
        bereich = z['id'].rsplit('/', 1)[0]
        bereiche[bereich].append(z)
    befunde = []
    for bereich, zs in bereiche.items():
        vorher = None
        for z in zs:
            n = nummer_teile(z['nummer'])
            if n is None:
                befunde.append(f"{bereich}: Nummer nicht lesbar: {z['label'][:60]}")
                continue
            if vorher is None:
                if isinstance(n[0], int) and n[0] != 1 and not n[1]:
                    befunde.append(f"{bereich}: beginnt mit Art. {z['nummer']}")
            elif isinstance(n[0], int) and isinstance(vorher[0], int):
                ok = (n[0] == vorher[0] + 1 and not n[1]) or (n[0] == vorher[0] and n[1] > vorher[1])
                if not ok:
                    befunde.append(f"{bereich}: Art. {z['nummer']} folgt auf Art. {vorher_nr}")
            elif isinstance(n[0], str) and isinstance(vorher[0], str):
                ok = (n[0] == vorher[0] and n[1] == vorher[1] + 1) or (n[0] != vorher[0] and n[1] == 1)
                if not ok:
                    befunde.append(f"{bereich}: Art. {z['nummer']} folgt auf Art. {vorher_nr}")
            vorher, vorher_nr = n, z['nummer']
    return befunde


def main():
    utf8_ausgabe()
    daten = json.loads((DATEN / 'zettel.json').read_text(encoding='utf8'))
    zettel, dokumente = daten['zettel'], daten['dokumente']
    ergebnis = {}

    # 1. Wörter
    je_dok = collections.Counter()
    for z in zettel:
        je_dok[z['dok']] += z['woerter']
    abw = [f"{d['nr']} {d['kurz']}: Zettel {je_dok[d['nr']]}, Werk {d['woerter']}" for d in dokumente
           if je_dok[d['nr']] != d['woerter']]
    ergebnis['1_woerter'] = dict(ok=not abw, befunde=abw,
                                 summe=sum(d['woerter'] for d in dokumente))

    # 2. Artikelfolge
    befunde = artikelfolge(zettel)
    ergebnis['2_artikel'] = dict(ok=not befunde, befunde=befunde)

    # 3. Botschaft
    bot = next(d for d in dokumente if d['typ'] == 'Botschaft')
    fehlt = bot.get('ziffern_nicht_gefunden', [])
    ergebnis['3_botschaft'] = dict(ok=not fehlt, befunde=fehlt, ziffern=bot.get('inhaltsverzeichnis'))

    # Fussnoten: nur melden, kein Abbruch (Fehler der Vorlage sind möglich)
    ergebnis['fussnoten'] = dict(ok=True, befunde=[f"{d['nr']}: {x}" for d in dokumente for x in d.get('fussnoten_auffaellig', [])]
                                 + [f"{d['nr']}: Zeichen im Text nicht gefunden für Fussnote {', '.join(map(str, d['fussnoten_ohne_zeichen']))}"
                                    for d in dokumente if d.get('fussnoten_ohne_zeichen')])

    # 4.–6. Kanten
    kpfad = DATEN / 'kanten.json'
    if kpfad.exists():
        k = json.loads(kpfad.read_text(encoding='utf8'))
        kanten = k['kanten']
        gesetze = k.get('gesetze', [])
        neu = [g for g in gesetze if g.get('neu')]
        geaendert = [g for g in gesetze if not g.get('neu')]
        ok4 = len(neu) == GESETZE_NEU and len(geaendert) == GESETZE_GEAENDERT
        ergebnis['4_gesetze'] = dict(ok=ok4, befunde=[] if ok4 else
                                     [f'neu {len(neu)} statt {GESETZE_NEU}, geändert {len(geaendert)} statt {GESETZE_GEAENDERT}'],
                                     neu=[g['titel'] for g in neu], geaendert=[g['titel'] for g in geaendert])
        eu = k.get('eu_rechtsakte', {})
        ohne = sorted(n for n, v in eu.items() if not v.get('celex'))
        unbekannt = sorted(n for n, v in eu.items() if v.get('gefunden') is False and n not in VORLAGEFEHLER_EU)
        bekannt = sorted(n for n, v in eu.items() if v.get('gefunden') is False and n in VORLAGEFEHLER_EU)
        geprueft = any('gefunden' in v for v in eu.values())
        # Abgleich mit der EDA-Übersicht der EU-Gesetzgebungsakte (eda_abgleich.py): jeder Eintrag im Paket genannt
        epfad = DATEN / 'eda_liste.json'
        genannt = {x['nach'][6:] for x in kanten if x['art'] == 'nennt' and x['nach'].startswith('celex:')}
        eda = json.loads(epfad.read_text(encoding='utf8'))['eintraege'] if epfad.exists() else []
        eda_fehlt = [f"EDA-Übersicht {e['gruppe']} Nr. {e['nr']} nicht im Paket: {e['celex']} ({e['zitat']})"
                     for e in eda if e['celex'] not in genannt]
        ergebnis['5_eu'] = dict(ok=not ohne and not unbekannt and geprueft and bool(eda) and not eda_fehlt,
                                anzahl=len(eu), eda=f'{len(eda) - len(eda_fehlt)} von {len(eda)}',
                                befunde=[f'ohne CELEX: {n}' for n in ohne]
                                + [f"auf EUR-Lex nicht gefunden: {n} ({', '.join(eu[n]['zitate'][:2])})" for n in unbekannt]
                                + [f'Fehler der Vorlage (Korrekturprotokoll): {VORLAGEFEHLER_EU[n]}' for n in bekannt]
                                + ([] if geprueft else ['nicht gegen EUR-Lex geprüft (verweise.py --eurlex)'])
                                + ([] if eda else ['EDA-Übersicht fehlt (eda_abgleich.py)']) + eda_fehlt)
        rnd = random.Random(k.get('stand', ''))
        inhaltlich = [x for x in kanten if x['art'] != 'teil_von']     # Gliederungskanten sind nicht strittig
        probe = rnd.sample(inhaltlich, min(20, len(inhaltlich)))
        ergebnis['6_stichprobe'] = dict(ok=True, befunde=[], probe=[
            f"{x['art']}: {x['von']} → {x['nach']} | {x.get('stelle', '')[:80]}" for x in probe])
    else:
        ergebnis['4_gesetze'] = ergebnis['5_eu'] = ergebnis['6_stichprobe'] = dict(ok=True, befunde=['kanten.json fehlt, übersprungen'])

    if '--json' in sys.argv:
        print(json.dumps(ergebnis, ensure_ascii=False, indent=1))
    else:
        for name, e in ergebnis.items():
            print(f"{'ok    ' if e['ok'] else 'FEHLER'} {name}: {len(e['befunde'])} Befunde")
            for b in e['befunde'][:40]:
                print(f'         {b}')
            if len(e['befunde']) > 40:
                print(f"         … {len(e['befunde']) - 40} weitere")
            for p in e.get('probe', []):
                print(f'         {p}')
    sys.exit(0 if all(e['ok'] for e in ergebnis.values()) else 2)


if __name__ == '__main__':
    main()
