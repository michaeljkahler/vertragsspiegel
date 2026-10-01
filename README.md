# Vertragsspiegel

Paket Schweiz–EU (Bilaterale III): Botschaft, Abkommen, Protokolle, Erklärungen und Bundesbeschlüsse, gegliedert in Artikel und Abschnitte, mit Umfang und Verknüpfungen. Wertungsfrei, jede Angabe bis zur Fundstelle auf Fedlex verfolgbar. Teil des Umfelds des [Politspiegels](https://michaeljkahler.github.io/politspiegel/).

Stand 1. Oktober 2026: Aufbau. Einstieg: [`docs/PROJEKTBRIEF.md`](docs/PROJEKTBRIEF.md).

## Ordner

| Ordner | Inhalt |
|---|---|
| `docs/` | Projektbrief, Aufträge für die Einrichtung und die wiederkehrende Kontrolle |
| `scripts/` | `fedlex_pruefen.py`, `parlament_pruefen.py` |
| `daten/` | Stand der letzten Kontrollen; Rohdaten unter `daten/pdf/` und `daten/text/` sind nicht versioniert |
| `prototyp/` | Musteransicht vom 1. Oktober 2026 mit Datenaufbereitung |

## Kontrolle

```
python3 scripts/fedlex_pruefen.py       # Änderungen auf Fedlex
python3 scripts/parlament_pruefen.py    # neue Beschlüsse zum Geschäft 26.023
```

Beide nur mit Python-Standardbibliothek. `--apply` übernimmt den neuen Stand. Abbruchcode 0 unverändert, 3 Änderungen, 1 Quelle nicht erreichbar.

## Quellen und Rechte

Texte: Fedlex, Bundesblatt 2026 615–644 und Folgepublikationen. Beratungsstand: Parlamentsdienste. Völkerrechtliche Verträge, Erlasse und Berichte von Behörden sind nach Art. 5 Abs. 1 lit. a und c URG urheberrechtlich nicht geschützt.
