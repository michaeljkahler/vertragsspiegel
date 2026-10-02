"""Gleicht die EU-Rechtsakte aus kanten.json mit der Übersicht der EU-Gesetzgebungsakte des EDA ab
(Projektbrief Ziffer 9.5).

Abgleich:                      python3 scripts/eda_abgleich.py
PDF neu laden:                 python3 scripts/eda_abgleich.py --neu

Quelle: EDA, «Übersicht EU-Gesetzgebungsakte Paket Schweiz-EU», PDF vom 13. März 2026, 95 Einträge in
14 Verhandlungsgruppen. Die Übersicht führt nur Gesetzgebungsakte (Parlament und Rat), keine delegierten
und keine Durchführungsrechtsakte; sie ist deshalb eine Teilmenge der Rechtsakte im Paket.

Schreibt:
  daten/pdf/eda/uebersicht_eu_gesetzgebungsakte.pdf   Rohdaten, nicht versioniert
  daten/eda_liste.json                                 Einträge mit Gruppe, Nummer, CELEX, Fundort im Paket
Selbstprüfung beim Lesen: Einträge je Gruppe gleich dem «Zwischentotal» der Übersicht, Summe 95.
Abbruchcodes: 0 = alle Einträge im Paket gefunden, 2 = Lesefehler oder Eintrag fehlt.
"""
import collections
import hashlib
import json
import re
import subprocess
import sys
from datetime import date

from laden import holen, werkzeug
from paket import DATEN, utf8_ausgabe
from verweise import EU_AKT, eu_celex

URL = ('https://www.europa.eda.admin.ch/dam/en/sd-web/PGFF7KWbg388/'
       '%C3%9Cbersicht%20EU-Gesetzgebungsakte%20Paket%20CH-EU.pdf')
PDF = DATEN / 'pdf' / 'eda' / 'uebersicht_eu_gesetzgebungsakte.pdf'
TXT = DATEN / 'text' / 'eda' / 'uebersicht_eu_gesetzgebungsakte.txt'
LISTE = DATEN / 'eda_liste.json'
TOTAL = 95

# Eintrag: «13. Verordnung (EU) Nr. 1024/2012 …» oder «60. Artikel 107 … der Verordnung (EU) 2019/6 …»;
# links davon kann die Spalte «Verhandlungsgruppe» stehen
EINTRAG = re.compile(r'(?:^|\s)(\d{1,2})\.\s+((?:Artikel\s+\d|(?:Delegierte\s+|Durchführungs)?'
                     r'(?:Verordnung|Richtlinie|Beschluss|Entscheidung)\b).*)')
ZWISCHENTOTAL = re.compile(r'Zwischentotal\s+(.+?):\s+(\d+)\s+EU-Gesetzgebungsakt')
GESAMT = re.compile(r'^\s*Total\s+(\d+)\s+EU-Gesetzgebungsakte')


def eintraege_lesen(text):
    """[(gruppe, nr, wortlaut)] in der Reihenfolge der Übersicht; Gruppe aus dem folgenden Zwischentotal."""
    offen, fertig, total = [], [], None
    for zeile in text.splitlines():
        m = GESAMT.match(zeile)
        if m:
            total = int(m.group(1))
        m = ZWISCHENTOTAL.search(zeile)
        if m:
            gruppe, soll = m.group(1).strip(), int(m.group(2))
            if len(offen) != soll:
                raise SystemExit(f'Lesefehler: {gruppe} hat {len(offen)} Einträge, Zwischentotal {soll}')
            fertig += [(gruppe, nr, ' '.join(w)) for nr, w in offen]
            offen = []
            continue
        m = EINTRAG.search(zeile)
        if m:
            offen.append((int(m.group(1)), [m.group(2).strip()]))
        elif offen and zeile.strip() and not zeile.strip().isdigit() and 'Eidgenössisches Departement' not in zeile:
            offen[-1][1].append(zeile.strip())
    if offen:
        raise SystemExit(f'Lesefehler: {len(offen)} Einträge ohne Zwischentotal')
    if total != TOTAL or len(fertig) != TOTAL:
        raise SystemExit(f'Lesefehler: {len(fertig)} Einträge, Total der Übersicht {total}, erwartet {TOTAL}')
    return fertig


def hauptakt(wortlaut):
    """CELEX des Eintrags: die erste Zitierung, also der Akt selbst, nicht «zuletzt geändert durch»."""
    m = EU_AKT.search(wortlaut)
    if not m:
        return None, ''
    return eu_celex(m.group(1), m.group(2), m.group(3), m.group(4), m.group(5), 'Nr.' in m.group(0)), m.group(0)


def main():
    utf8_ausgabe()
    if '--neu' in sys.argv or not PDF.exists():
        holen(URL, PDF)
    exe, version = werkzeug()
    if not exe:
        raise SystemExit('Kein pdftotext aus Poppler im PATH (siehe laden.py).')
    TXT.parent.mkdir(parents=True, exist_ok=True)
    subprocess.run([exe, '-layout', '-enc', 'UTF-8', '-eol', 'unix', str(PDF), str(TXT)], check=True)
    eintraege = eintraege_lesen(TXT.read_text(encoding='utf-8'))

    kanten = json.loads((DATEN / 'kanten.json').read_text(encoding='utf-8'))
    fundorte = collections.defaultdict(lambda: collections.Counter())
    for k in kanten['kanten']:
        if k['art'] == 'nennt' and k['nach'].startswith('celex:'):
            fundorte[k['nach'][6:]][int(k['von'].split('/')[2])] += 1

    liste, fehlt = [], []
    for gruppe, nr, wortlaut in eintraege:
        celex, zitat = hauptakt(wortlaut)
        orte = fundorte.get(celex, {})
        liste.append({'gruppe': gruppe, 'nr': nr, 'celex': celex, 'zitat': zitat,
                      'titel': re.sub(r'\s+', ' ', wortlaut)[:400],
                      'im_paket': bool(orte),
                      'fundorte': {str(d): n for d, n in sorted(orte.items())}})
        if not orte:
            fehlt.append(liste[-1])

    pdf = PDF.read_bytes()
    LISTE.write_text(json.dumps({
        'stand': date.today().isoformat(),
        'quelle': {'titel': 'Übersicht EU-Gesetzgebungsakte Paket Schweiz-EU', 'herausgeber': 'EDA',
                   'datum': '2026-03-13', 'pdf': URL, 'sha256': hashlib.sha256(pdf).hexdigest(),
                   'bytes': len(pdf), 'werkzeug': version},
        'eintraege': liste,
    }, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')

    gruppen = collections.Counter(e['gruppe'] for e in liste)
    print(f'EDA-Übersicht: {len(liste)} Einträge in {len(gruppen)} Gruppen, '
          f'{len(liste) - len(fehlt)} im Paket gefunden, {len(fehlt)} fehlen.')
    for g, n in gruppen.items():
        drin = sum(1 for e in liste if e['gruppe'] == g and e['im_paket'])
        print(f'  {g:<28} {drin:>3} von {n:>3}')
    for e in fehlt:
        print(f'  FEHLT {e["gruppe"]} Nr. {e["nr"]}: {e["celex"]} ({e["zitat"]})')
    nur_botschaft = [e for e in liste if e['im_paket'] and set(e['fundorte']) <= {'615'}]
    for e in nur_botschaft:
        print(f'  nur in der Botschaft: {e["gruppe"]} Nr. {e["nr"]}: {e["celex"]} ({e["zitat"]})')
    print(f'Geschrieben: {LISTE.relative_to(DATEN.parent)}')
    sys.exit(2 if fehlt else 0)


if __name__ == '__main__':
    main()
