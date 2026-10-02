# Vertragsspiegel

Paket Schweiz–EU (Bilaterale III): Botschaft, Abkommen, Protokolle, Erklärungen und Bundesbeschlüsse, gegliedert in Artikel und Abschnitte, mit Umfang und Verknüpfungen. Wertungsfrei, jede Angabe bis zur Fundstelle auf Fedlex verfolgbar. Teil des Umfelds des [Politspiegels](https://michaeljkahler.github.io/politspiegel/).

Stand 1. Oktober 2026: Aufbau, Pipeline (Etappe 2) und Ansichten (Etappe 3) stehen. Seite: [michaeljkahler.github.io/vertragsspiegel](https://michaeljkahler.github.io/vertragsspiegel/). Einstieg: [`docs/PROJEKTBRIEF.md`](docs/PROJEKTBRIEF.md).

## Ordner

| Ordner | Inhalt |
|---|---|
| `docs/` | Projektbrief, Aufträge für die Einrichtung und die wiederkehrende Kontrolle, Korrekturprotokoll |
| `scripts/` | Kontrolle (`fedlex_pruefen.py`, `parlament_pruefen.py`) und Pipeline (`laden.py`, `gliedern.py`, `verweise.py`, `eda_abgleich.py`, `pruefen.py`, `themen.py`, `bauen.py`) |
| `daten/` | Stand der Kontrollen, Herkunft der Texte (`quellen.json`), Zettel (`zettel.json`), Kanten (`kanten.json`), EUR-Lex-Titel (`eurlex.json`), Abgleich mit der EDA-Übersicht (`eda_liste.json`); Rohdaten unter `daten/pdf/`, `daten/text/`, `daten/xml/` sind nicht versioniert |
| `seite/` | Vorlagen der Seite (HTML, CSS, JavaScript); `grafik.js` erzeugt Grafiken für Social Media, Präsentation und Bericht |
| `site/` | veröffentlichte Seite, erzeugt von `bauen.py`, ausgeliefert über GitHub Pages |
| `prototyp/` | Musteransicht vom 1. Oktober 2026 mit Datenaufbereitung |

## Pipeline

```
python3 scripts/laden.py               # Texte von Fedlex, pdftotext aus Poppler (Windows: winget install oschwartz10612.Poppler)
python3 scripts/gliedern.py            # Zettel je Artikel, Anhangsteil und Ziffer der Botschaft → daten/zettel.json
python3 scripts/verweise.py --eurlex   # Kanten, EU-Rechtsakte gegen EUR-Lex geprüft → daten/kanten.json
python3 scripts/eda_abgleich.py        # 95 EU-Gesetzgebungsakte der EDA-Übersicht gegen die Kanten → daten/eda_liste.json
python3 scripts/pruefen.py             # Selbstprüfung nach Projektbrief Ziffer 9; Abbruchcode 2 bei Abweichung
python3 scripts/themen.py              # Themenkatalog prüfen, Fundstellen zählen → daten/themen_treffer.json
python3 scripts/bauen.py               # Seite site/ aus seite/ und den Daten (bricht ab, wenn der Themenkatalog fehlerhaft ist)
```

`gliedern.py --zeigen 632` zeigt die Gliederung eines Werks. Fehler der Vorlagen und Grenzen der Extraktion: [`docs/KORREKTUREN.md`](docs/KORREKTUREN.md).

## Kontrolle

```
python3 scripts/fedlex_pruefen.py       # Änderungen auf Fedlex
python3 scripts/parlament_pruefen.py    # neue Beschlüsse zum Geschäft 26.023
```

Beide nur mit Python-Standardbibliothek. `--apply` übernimmt den neuen Stand. Abbruchcode 0 unverändert, 3 Änderungen, 1 Quelle nicht erreichbar.

## Quellen und Rechte

Texte: Fedlex, Bundesblatt 2026 615–644 und Folgepublikationen. Beratungsstand: Parlamentsdienste. Völkerrechtliche Verträge, Erlasse und Berichte von Behörden sind nach Art. 5 Abs. 1 lit. a und c URG urheberrechtlich nicht geschützt.
