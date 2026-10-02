"""Themenkatalog prüfen und Treffer je Zettel zählen.

Liest daten/themen.json und daten/zettel.json, zählt jede Fundstelle eines Begriffs in Wortlaut und Fussnoten
und schreibt daten/themen_treffer.json. bauen.py übernimmt die Zuordnung in site/daten/index.json.

Prüfungen (Abbruch mit Code 1, wenn eine scheitert):
  T1  IDs eindeutig, Namen eindeutig, Reihenfolge alphabetisch nach Namen
  T2  Muster ohne Konstrukte, die in JavaScript anders oder gar nicht wirken
      (Lookbehind, \\p, Inline-Schalter, \\b neben Nicht-ASCII-Zeichen)
  T3  jeder Begriff kommt im Paket mindestens einmal vor
Hinweise (kein Abbruch):
  H1  Begriff trifft mehr als 15 % aller Zettel (zu breit für eine Hervorhebung)
  H2  Suchbegriff kommt im Wortlaut nicht vor (führt nur zum Thema)

Aufruf: python3 scripts/themen.py [--still]
"""
import json
import re
import sys
import unicodedata

from paket import DATEN, utf8_ausgabe

BREIT = 0.15
VERBOTEN = [
    (re.compile(r'\(\?<[=!]'), 'Lookbehind'),
    (re.compile(r'\\[pP]\{'), 'Unicode-Klasse \\p'),
    (re.compile(r'\(\?[aiLmsux]'), 'Inline-Schalter'),
]
# \b wirkt in JavaScript (ohne u-Schalter) nur an ASCII-Buchstaben, Ziffern und _.
B_NEBEN = re.compile(r'\\b(?=[^\x00-\x7f])|(?<=[^\x00-\x7f])\\b')


def sortierschluessel(name):
    zerlegt = unicodedata.normalize('NFD', name.casefold())
    return ''.join(c for c in zerlegt if not unicodedata.combining(c))


def zettel_text(z):
    teile = [z.get('text') or '']
    teile += [f.get('text') or '' for f in z.get('fussnoten') or []]
    return '\n'.join(teile)


def zaehlen():
    """Gibt (Katalog, Ergebnis je Thema, Fehler, Hinweise) zurück."""
    katalog = json.loads((DATEN / 'themen.json').read_text(encoding='utf-8'))
    zettel = json.loads((DATEN / 'zettel.json').read_text(encoding='utf-8'))['zettel']
    texte = [zettel_text(z) for z in zettel]
    gesamt = '\n'.join(texte)
    gesamt_klein = gesamt.casefold()
    fehler, hinweise = [], []

    themen = katalog['themen']
    ids = [t['id'] for t in themen]
    namen = [t['name'] for t in themen]
    for liste, art in ((ids, 'ID'), (namen, 'Name')):
        doppelt = sorted({x for x in liste if liste.count(x) > 1})
        if doppelt:
            fehler.append(f'T1 {art} doppelt: {", ".join(doppelt)}')
    if namen != sorted(namen, key=sortierschluessel):
        fehler.append('T1 Themen nicht alphabetisch: ' + ' | '.join(sorted(namen, key=sortierschluessel)))

    ergebnis = []
    for t in themen:
        je_zettel = {}
        begriffe = []
        for anzeige, muster in t['begriffe']:
            for rx, was in VERBOTEN:
                if rx.search(muster):
                    fehler.append(f'T2 {t["id"]}: «{muster}» enthält {was}')
            if B_NEBEN.search(muster):
                fehler.append(f'T2 {t["id"]}: «{muster}» hat \\b neben einem Nicht-ASCII-Zeichen')
            rx = re.compile(muster)
            n_treffer, n_zettel = 0, 0
            for i, s in enumerate(texte):
                n = len(rx.findall(s))
                if n:
                    n_treffer += n
                    n_zettel += 1
                    je_zettel[i] = je_zettel.get(i, 0) + n
            if n_treffer == 0:
                fehler.append(f'T3 {t["id"]}: Begriff «{anzeige}» ({muster}) ohne Treffer')
            if n_zettel > BREIT * len(zettel):
                hinweise.append(f'H1 {t["id"]}: «{anzeige}» trifft {n_zettel} Zettel ({n_zettel / len(zettel):.0%})')
            begriffe.append({'anzeige': anzeige, 'muster': muster, 'treffer': n_treffer, 'zettel': n_zettel})
        such = []
        for s in t.get('suchbegriffe') or []:
            n = gesamt_klein.count(s.casefold())
            such.append({'wort': s, 'im_wortlaut': n})
            if n == 0:
                hinweise.append(f'H2 {t["id"]}: Suchbegriff «{s}» nicht im Wortlaut')
        ergebnis.append({
            'id': t['id'], 'name': t['name'],
            'zettel_anzahl': len(je_zettel), 'treffer': sum(je_zettel.values()),
            'woerter': sum(int(zettel[i]['woerter']) for i in je_zettel),
            'begriffe': begriffe, 'suchbegriffe': such,
            'zettel': [[zettel[i]['id'], n] for i, n in sorted(je_zettel.items())],
        })

    return katalog, ergebnis, fehler, hinweise


def main():
    utf8_ausgabe()
    still = '--still' in sys.argv
    katalog, ergebnis, fehler, hinweise = zaehlen()
    zettel_gesamt = json.loads((DATEN / 'zettel.json').read_text(encoding='utf-8'))['zettel']
    aus = {'stand': katalog['stand'], 'zettel_gesamt': len(zettel_gesamt), 'themen': ergebnis}
    text = json.dumps(aus, ensure_ascii=False, indent=1)
    text = re.sub(r'\[\n\s+("fga/[^"]+"),\n\s+(\d+)\n\s+\]', r'[\1, \2]', text)   # [Zettel, Fundstellen] je auf einer Zeile
    (DATEN / 'themen_treffer.json').write_text(text + '\n', encoding='utf-8')

    if not still:
        print(f'{len(ergebnis)} Themen, {len(zettel_gesamt)} Zettel')
        for e in ergebnis:
            print(f'\n{e["name"]} [{e["id"]}]: {e["zettel_anzahl"]} Zettel, {e["treffer"]} Fundstellen')
            for b in e['begriffe']:
                print(f'   {b["treffer"]:6d} in {b["zettel"]:5d}  {b["anzeige"]}')
    print()
    for h in hinweise:
        print(h)
    for f in fehler:
        print('FEHLER', f)
    print(f'\n{len(fehler)} Fehler, {len(hinweise)} Hinweise')
    return 1 if fehler else 0


if __name__ == '__main__':
    sys.exit(main())
