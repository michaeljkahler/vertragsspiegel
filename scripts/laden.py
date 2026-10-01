"""Lädt die Texte des Pakets Schweiz–EU (Bilaterale III) von Fedlex und zieht den Text aus den PDF.

Alle Werke, Deutsch:           python3 scripts/laden.py
Andere Sprache:                python3 scripts/laden.py --sprache fr
Nur bestimmte Werke:           python3 scripts/laden.py 615 632
Vorhandene Dateien ersetzen:   python3 scripts/laden.py --neu

Grundlage ist daten/fedlex_stand.json (von scripts/fedlex_pruefen.py gepflegt):
  1. Werke mit Umfang «by-reference» (BBl 2026 615–644 bis zur Vollpublikation):
     PDF des Volltext-Anhangs (eli/fgae/2026/42–71);
  2. Werke mit Umfang «complete»: PDF des Werks, dazu das XML für Etappe 4.

Schreibt:
  daten/pdf/<sprache>/<nr>.pdf, daten/xml/<sprache>/<nr>.xml   Rohdaten, nicht versioniert
  daten/text/<sprache>/<nr>.txt                               pdftotext -layout, nicht versioniert
  daten/quellen.json                                          Herkunft je Datei: Adresse, Grösse, SHA-256, Datum

Braucht pdftotext aus Poppler (Windows: winget install oschwartz10612.Poppler). Das pdftotext aus Xpdf
(unter Git for Windows in /mingw64/bin) setzt den Text anders und zählt weniger Wörter; laden.py
übergeht es und bricht ab, wenn kein Poppler im PATH ist, damit die Zählung reproduzierbar bleibt.
Abbruchcodes: 0 = alles geladen, 1 = mindestens eine Datei fehlt.
"""
import hashlib
import json
import os
import pathlib
import shutil
import subprocess
import sys
import urllib.request
from datetime import date

WURZEL = pathlib.Path(__file__).resolve().parent.parent
STAND = WURZEL / 'daten' / 'fedlex_stand.json'
QUELLEN = WURZEL / 'daten' / 'quellen.json'
AGENT = 'vertragsspiegel-laden/1.0'


def holen(url, ziel):
    req = urllib.request.Request(url, headers={'User-Agent': AGENT})
    with urllib.request.urlopen(req, timeout=180) as r:
        inhalt = r.read()
    ziel.parent.mkdir(parents=True, exist_ok=True)
    ziel.write_bytes(inhalt)


def quelle_waehlen(werk, sprache):
    """PDF- und XML-Adresse eines Werks: Volltext-Anhang bei Verweispublikation, sonst das Werk selbst."""
    dateien = werk['dateien'].get(sprache, {})
    if werk['umfang'] == 'by-reference':
        for anh in sorted(werk['anhaenge']):
            pdf = werk['anhaenge'][anh]['dateien'].get(sprache, {}).get('PDF')
            if pdf:
                return pdf, '', anh
        return '', '', ''
    return dateien.get('PDF', ''), dateien.get('XML', ''), ''


def werkzeug():
    """Pfad und Version des ersten pdftotext aus Poppler im PATH; leer, wenn keins da ist.
    Unter Git Bash steht das pdftotext aus Xpdf (/mingw64/bin) meist vor Poppler, darum alle prüfen."""
    for ordner in os.environ.get('PATH', '').split(os.pathsep):
        exe = shutil.which('pdftotext', path=ordner) if ordner else None
        if not exe:
            continue
        r = subprocess.run([exe, '-v'], capture_output=True, text=True)
        aus = r.stdout + r.stderr
        if 'Poppler' in aus:
            return exe, aus.splitlines()[0].strip()
    return '', ''


def text_ziehen(exe, pdf, txt):
    txt.parent.mkdir(parents=True, exist_ok=True)
    subprocess.run([exe, '-layout', '-enc', 'UTF-8', '-eol', 'unix', str(pdf), str(txt)], check=True)


def main():
    args = sys.argv[1:]
    sprache = args[args.index('--sprache') + 1] if '--sprache' in args else 'de'
    neu = '--neu' in args
    nur = {a for a in args if a.isdigit()}
    exe, version = werkzeug()
    if not exe:
        print('FEHLER: pdftotext aus Poppler nicht gefunden (Xpdf oder gar keins im PATH).')
        sys.exit(1)

    werke = json.loads(STAND.read_text(encoding='utf8'))['werke']
    quellen = json.loads(QUELLEN.read_text(encoding='utf8')) if QUELLEN.exists() else {}
    fehlt = []
    for eli in sorted(werke, key=lambda e: int(e.rsplit('/', 1)[1])):
        nr = eli.rsplit('/', 1)[1]
        if nur and nr not in nur:
            continue
        werk = werke[eli]
        pdf_url, xml_url, anhang = quelle_waehlen(werk, sprache)
        if not pdf_url:
            fehlt.append(f'{nr}: keine PDF-Datei in {sprache}')
            continue
        pdf = WURZEL / 'daten' / 'pdf' / sprache / f'{nr}.pdf'
        txt = WURZEL / 'daten' / 'text' / sprache / f'{nr}.txt'
        eintrag = quellen.setdefault(sprache, {}).get(nr, {})
        try:
            if neu or not pdf.exists() or eintrag.get('pdf') != pdf_url:
                holen(pdf_url, pdf)
                eintrag = {'pdf': pdf_url, 'geladen': date.today().isoformat()}
            if xml_url:
                xml = WURZEL / 'daten' / 'xml' / sprache / f'{nr}.xml'
                if neu or not xml.exists() or eintrag.get('xml') != xml_url:
                    holen(xml_url, xml)
                eintrag['xml'] = xml_url
            if neu or not txt.exists() or txt.stat().st_mtime < pdf.stat().st_mtime                     or eintrag.get('werkzeug') != version:
                text_ziehen(exe, pdf, txt)
                eintrag['werkzeug'] = version
        except Exception as e:  # Netz, Fedlex, pdftotext
            fehlt.append(f'{nr}: {e}')
            continue
        inhalt = pdf.read_bytes()
        eintrag.update({'eli': eli, 'anhang': anhang, 'umfang': werk['umfang'], 'titel': werk['titel'],
                        'bytes': len(inhalt), 'sha256': hashlib.sha256(inhalt).hexdigest(),
                        'seiten': txt.read_text(encoding='utf8').count('\f')})
        quellen[sprache][nr] = dict(sorted(eintrag.items()))
        print(f"{nr}  {eintrag['seiten']:>5} S.  {len(inhalt) // 1024:>6} KB  {werk['titel'][:70]}")

    QUELLEN.write_text(json.dumps(quellen, ensure_ascii=False, indent=1, sort_keys=True) + '\n', encoding='utf8')
    if fehlt:
        print(f'{len(fehlt)} Dateien fehlen:')
        for f in fehlt:
            print('  ' + f)
        sys.exit(1)
    print(f'Geladen: {len(quellen[sprache])} Werke in {sprache}. Herkunft in {QUELLEN.relative_to(WURZEL)}.')


if __name__ == '__main__':
    main()
