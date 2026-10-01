# Prototyp vom 1. Oktober 2026

Musteransicht mit Icicle, Matrix, Sankey, Zettel mit lokalem Graph und Dokumenttabelle. Grundlage für Etappe 2 und 3 des Projektbriefs, nicht für die Veröffentlichung.

1. `an/<nummer>.txt`: Text der Volltext-Anhänge BBl 2026 615–644, erzeugt mit `pdftotext -layout` aus den PDF unter `https://fedlex.data.admin.ch/filestore/fedlex.data.admin.ch/eli/fgae/2026/<42–71>/de/pdf-a/…`. Nicht versioniert.
2. `bbl53.json`: Titel der Einträge im Bundesblatt Nr. 53 vom 18. März 2026, Antwort des Fedlex-SPARQL-Endpunkts.
3. `build_data.py`: gliedert die Texte, zählt Wörter, extrahiert Verweise, EU-Rechtsakt- und SR-Nummern und die Gesetzesliste; schreibt `vertragsspiegel_daten.json`.
4. `seite_bauen.py`: setzt die Daten in `vertragsspiegel_template.html` ein und schreibt `vertragsspiegel.html`.

```
python3 build_data.py
python3 seite_bauen.py
```

Bekannte Fehlerbilder: Projektbrief, Ziffer 9.
