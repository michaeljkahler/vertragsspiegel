"""Baut die Seite site/ aus daten/zettel.json, daten/kanten.json und den Vorlagen in seite/.

Bauen:        python3 scripts/bauen.py

Schreibt:
  site/index.html, site/app.css, site/app.js     aus seite/, Stand und Kennzahlen eingesetzt
  site/daten/index.json                          Dokumente, Zettel ohne Wortlaut, Kanten, Gesetze, EU-Titel, Themen
  site/daten/text/<teil>.json                    Wortlaut und Fussnoten, je Werk; die Botschaft je Kapitel
                                                 (2.1 bis 2.15 einzeln), damit ein Zettel nicht 3 MB nachlädt
  site/kennzahlen.json                           für den Kasten im Politspiegel (Projektbrief Ziffer 10.1)

Die Seite lädt zuerst nur index.json (Gliederung, Umfang, Kanten) und den Wortlaut erst beim Öffnen eines
Zettels oder bei der Volltextsuche.
"""
import collections
import hashlib
import json
import re
import shutil
import sys

from paket import DATEN, GRUPPEN, WURZEL, quellen, utf8_ausgabe
from themen import zaehlen

SEITE, SITE = WURZEL / 'seite', WURZEL / 'site'


def textteil(zid):
    """Datei, in der der Wortlaut eines Zettels liegt (gleiche Regel in app.js)."""
    teile = zid.split('/')
    if teile[2] != '615':
        return teile[2]
    m = re.match(r'ziff_(\d+)(?:\.(\d+))?', teile[3])
    if not m:
        return '615-rest'
    return f'615-{m.group(1)}.{m.group(2)}' if m.group(1) == '2' and m.group(2) else f'615-{m.group(1)}'


def kompakt_json(obj):
    return json.dumps(obj, ensure_ascii=False, separators=(',', ':'))


def version(index):
    """Kennung für den Cache: ändert sich mit den Daten und den Vorlagen."""
    h = hashlib.sha1(kompakt_json(index).encode())
    for name in ('index.html', 'app.css', 'app.js'):
        h.update((SEITE / name).read_bytes())
    return h.hexdigest()[:10]


def main():
    utf8_ausgabe()
    zd = json.loads((DATEN / 'zettel.json').read_text(encoding='utf8'))
    kd = json.loads((DATEN / 'kanten.json').read_text(encoding='utf8'))
    q = quellen('de')
    zettel = zd['zettel']
    nr_von = {z['id']: i for i, z in enumerate(zettel)}

    docs = []
    for d in zd['dokumente']:
        qu = q.get(str(d['nr']), {})
        docs.append(dict(nr=d['nr'], kurz=d['kurz'], titel=d['titel'], typ=d['typ'], gruppe=d['gruppe'],
                         seiten=d['seiten'], woerter=d['woerter'], eli=d['eli'], pdf=qu.get('pdf', ''),
                         umfang=qu.get('umfang', '')))

    z_aus = [dict(i=z['id'], d=z['dok'], a=z['art'], l=z['label'], w=z['woerter'], s=z['seiten'],
                  p=z['pfad'], n=z['nummer']) for z in zettel]

    # Kanten ohne Gliederung (die Gliederung ergibt sich aus der Kennung und dem Pfad)
    def ref(x):
        return nr_von.get(x, x)
    kanten = [[k['art'], ref(k['von']), ref(k['nach']), k.get('stelle', ''), k.get('regel', '')]
              for k in kd['kanten'] if k['art'] != 'teil_von']

    # Gleicher EU-Rechtsakt in zwei Werken (ohne Botschaft): je Werkpaar der erste Zettel jedes Werks
    erste = collections.defaultdict(dict)
    for k in kd['kanten']:
        if k['art'] == 'nennt' and k['nach'].startswith('celex:'):
            dok = int(k['von'].split('/')[2])
            if dok != 615:
                erste[k['nach'][6:]].setdefault(dok, k['von'])
    eu_paare = []
    for celex, je in sorted(erste.items()):
        doks = sorted(je)
        for a in range(len(doks)):
            for b in range(a + 1, len(doks)):
                eu_paare.append([celex, nr_von[je[doks[a]]], nr_von[je[doks[b]]]])

    eu = {c: (v.get('titel') or (v.get('zitate') or [''])[0]) for c, v in kd['eu_rechtsakte'].items()}
    eu_gefunden = [c for c, v in kd['eu_rechtsakte'].items() if v.get('gefunden')]
    gesetze = [dict(id=g['id'], titel=g['titel'], kurz=g.get('kurz'), abk=g.get('abk'), sr=g.get('sr'), neu=g['neu'],
                    totalrevision=g['totalrevision'], bbs=[int(b) for b in g['bbs']]) for g in kd['gesetze']]

    # Themen (daten/themen.json): Begriffe mit Muster und Trefferzahl, Suchbegriffe, Zettel mit Fundstellen
    _, themen_erg, themen_fehler, _ = zaehlen()
    if themen_fehler:
        print('Themenkatalog fehlerhaft, zuerst python3 scripts/themen.py ausführen:')
        for f in themen_fehler:
            print('  ', f)
        sys.exit(1)
    themen = [dict(id=t['id'], name=t['name'],
                   b=[[b['anzeige'], b['muster'], b['treffer']] for b in t['begriffe']],
                   s=[[x['wort'], x['im_wortlaut']] for x in t['suchbegriffe']],
                   z=[[nr_von[zid], n] for zid, n in t['zettel']]) for t in themen_erg]

    paket = [d for d in docs if 615 <= d['nr'] <= 644]
    stand = zd['stand']
    kennzahlen = dict(stand=stand, dokumente=len(paket), seiten=sum(d['seiten'] for d in paket),
                      woerter=sum(d['woerter'] for d in paket), zettel=sum(1 for z in zettel if 615 <= z['dok'] <= 644),
                      kanten=len(kanten), eu=len(eu), sr=len(kd['sr_erlasse']),
                      gesetze_neu=sum(g['neu'] for g in gesetze), gesetze_geaendert=sum(not g['neu'] for g in gesetze))
    index = dict(stand=stand, gruppen=[dict(id=g, name=n) for g, n in GRUPPEN], docs=docs, z=z_aus, k=kanten,
                 eu=eu, eu_gefunden=eu_gefunden, eu_paare=eu_paare, gesetze=gesetze, themen=themen, kennzahlen=kennzahlen)

    # Ausgabe
    if SITE.exists():
        for p in ('daten', 'index.html', 'app.css', 'app.js', 'kennzahlen.json'):
            ziel = SITE / p
            if ziel.is_dir():
                shutil.rmtree(ziel)
            elif ziel.exists():
                ziel.unlink()
    (SITE / 'daten' / 'text').mkdir(parents=True, exist_ok=True)
    (SITE / 'daten' / 'index.json').write_text(kompakt_json(index), encoding='utf8')
    texte = collections.defaultdict(dict)
    for z in zettel:
        texte[textteil(z['id'])][z['id']] = [z['text'], [[f['nr'], f['text']] for f in z['fussnoten']]]
    for teil, inhalt in texte.items():
        (SITE / 'daten' / 'text' / f'{teil}.json').write_text(kompakt_json(inhalt), encoding='utf8')
    (SITE / 'kennzahlen.json').write_text(json.dumps(kennzahlen, ensure_ascii=False, indent=1) + '\n', encoding='utf8')

    fmt = lambda n: f'{n:,}'.replace(',', ' ')
    ersatz = {'__STAND__': '.'.join(reversed(stand.split('-'))), '__WOERTER__': fmt(kennzahlen['woerter']),
              '__SEITEN__': fmt(kennzahlen['seiten']), '__VERSION__': version(index)}
    for name in ('index.html', 'app.css', 'app.js'):
        t = (SEITE / name).read_text(encoding='utf8')
        for k, v in ersatz.items():
            t = t.replace(k, v)
        (SITE / name).write_text(t, encoding='utf8')
    for extra in SEITE.glob('*'):
        if extra.name not in ('index.html', 'app.css', 'app.js') and extra.is_file():
            shutil.copy(extra, SITE / extra.name)

    groesse = sum(p.stat().st_size for p in SITE.rglob('*') if p.is_file())
    print(f"site/: {len(zettel)} Zettel, {len(kanten)} Kanten, {len(eu_paare)} EU-Werkpaare, {len(themen)} Themen, "
          f"{len(texte)} Textdateien, "
          f"index.json {(SITE / 'daten' / 'index.json').stat().st_size // 1024} KB, gesamt {groesse // 1024} KB")


if __name__ == '__main__':
    main()
