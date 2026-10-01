# Projektbrief: Vertragsspiegel

Wertungsfreie, visuelle Aufbereitung des Pakets Schweiz–EU (Bilaterale III): Botschaft, Abkommen, Protokolle, Erklärungen und Bundesbeschlüsse, heruntergebrochen auf Artikel und Abschnitte, mit Umfang und Verknüpfungen.

Stand: 1. Oktober 2026. Projektordner: `C:\Users\Admin\Documents\Claude\Projects\Politik\Bilaterale III` (zugleich Wurzel des Repositorys). Repository: `github.com/michaeljkahler/vertragsspiegel`, öffentlich seit 1. Oktober 2026. Seite (ab Etappe 3): `michaeljkahler.github.io/vertragsspiegel/`. Name «Vertragsspiegel», entschieden am 1. Oktober 2026 (Ziffer 13).

## 1. Stand

1. Die 30 Dokumente BBl 2026 615–644 sind von Fedlex geladen und ausgezählt: 1945 Seiten, 677 564 Wörter. Davon Botschaft 1086 Seiten und 427 832 Wörter (63 %).
2. Musteransicht vom 1. Oktober 2026 mit Icicle (Umfang), Matrix (Verknüpfungen), Sankey (Umsetzung), Zettel mit lokalem Graph und Dokumenttabelle. Kopie und Pipeline unter `prototyp/`.
3. Rückmeldung Michael vom 1. Oktober 2026 zur Musteransicht:
   1. Textfelder zu klein.
   2. Das Icicle braucht ein Übersichtsfeld, das zeigt, wo man sich befindet.
   3. Der lokale Graph muss optimiert und erläutert werden.
4. Entscheid vom 1. Oktober 2026: eigenes Repository, verknüpft mit dem Politspiegel. Gründe:
   1. Der Politspiegel ist kantonal, das Paket ist Bundesrecht.
   2. Umfang: rund 1100 Zettel je Sprache, Rohtexte in drei Sprachen.
   3. Kommt das Paket zur Volksabstimmung, kann ein Abstimmungsspiegel auf einzelne Zettel verlinken.
5. Kontrolle: Skripte `scripts/fedlex_pruefen.py` und `scripts/parlament_pruefen.py` und Auftrag `docs/AUFTRAG_fedlex-kontrolle.md` liegen bereit. Ausgangsstand vom 1. Oktober 2026 in `daten/fedlex_stand.json` (33 Werke) und `daten/parlament_stand.json` (14 Entwürfe, 8 Beschlüsse).
6. Entscheid vom 1. Oktober 2026: Die Kontrolle läuft als geplante Aufgabe in der Cloud auf dem GitHub-Repository. Einrichtung: `docs/AUFTRAG_claude-code-einrichtung.md`. Eingerichtet am 1. Oktober 2026: Repository angelegt (erster Commit `90373f5`), Aufgabe «Vertragsspiegel Kontrolle» mittwochs 06:50, erster Lauf ohne Änderung.
7. Parlament, Stand Webservice 1. Oktober 2026: Der Ständerat hat am 28. bis 30. September 2026 beraten. Entwurf 1 (Bundesbeschluss Stabilisierung): «Beschluss abweichend vom Entwurf». Entwürfe 5 bis 8 und 10: «Beschluss gemäss Entwurf». Für die Entwürfe zu Elektrizität, Lebensmittelsicherheit, Gesundheit und Erasmus+ ist im Webservice noch kein Beschluss eingetragen.
8. Prototyp, Reiter «Bezüge» vom 1. Oktober 2026: Bogendiagramm aller Zettel auf einer Linie (Länge = Wörter) mit 1299 Bögen in fünf Arten. Klick auf einen Bogen zeigt beide Enden mit der Fundstelle im Wortlaut und öffnet den Zettel. Rohextraktion; 98 Artikelnennungen der Botschaft ohne Ziel im Paket, 92 Artikelverweise als Verweis auf einen anderen Erlass verworfen.

## 2. Ziel

1. Der gesamte Text des Pakets ist in Zettel gegliedert: ein Zettel je Artikel, Anhang oder Abschnitt der Botschaft.
2. Umfang ist sichtbar: wie viele Wörter auf welchen Paketteil, welches Dokument und welchen Artikel entfallen.
3. Verknüpfungen sind sichtbar: welcher Zettel auf welchen verweist, welche EU-Rechtsakte und SR-Erlasse er nennt, welcher Bundesbeschluss welches Abkommen genehmigt und welches Bundesgesetz ändert.
4. Jede Zahl und jede Verknüpfung ist bis zur Fundstelle im amtlichen Text verfolgbar.
5. Zielgruppe ist die breite Bevölkerung. Der Wortlaut und die Fundstellen bedienen zugleich das Fachpublikum.

## 3. Abgrenzung

1. Keine Bewertung des Pakets, keine Argumente dafür oder dagegen. Argumente gehören bei einer Volksabstimmung in den Abstimmungsspiegel.
2. Keine Zusammenfassungen durch ein Sprachmodell. Der Zettel zeigt den Wortlaut.
3. Keine Verknüpfungen aus inhaltlicher Ähnlichkeit. Eine Kante entsteht nur aus einem Verweis, der im Text steht.
4. Keine Auslegung, welche Wirkung ein Artikel hat. Gezeigt werden Struktur, Umfang und Verweise.
5. EU-Rechtsakte erscheinen mit Nummer, Titel und Link auf EUR-Lex, ohne eigenen Volltext.

## 4. Datengrundlage

| Quelle | Inhalt | Form | Stand |
|---|---|---|---|
| Fedlex, BBl 2026 615–644 | Botschaft, 20 Abkommen, Protokolle und Erklärungen, 9 Bundesbeschlüsse | Verweis-PDF im BBl, Volltext als Anhang fgae 2026/42–71, nur PDF, DE/FR/IT | 18. März 2026 |
| Fedlex, Vollpublikation | dieselben Texte vollständig im Bundesblatt | voraussichtlich PDF, HTML, XML | angekündigt bis spätestens Ende November 2026 |
| Fedlex, BBl 2026 2099, 2100, 2174 | Parlamentarische Initiative der SPK-S «Verfassungsanpassung betreffend die Bilateralen III»: Bericht, Entwurf Bundesbeschluss, Stellungnahme des Bundesrates | vollständig im BBl | 4. und 17. August 2026 |
| Fedlex, SPARQL-Endpunkt | Metadaten, Änderungsdaten, Dateien | `fedlex.data.admin.ch/sparqlendpoint` | laufend |
| Fedlex, SR | Bundesgesetze, die die Bundesbeschlüsse ändern oder neu schaffen | SR-Nummern | laufend |
| EUR-Lex | Titel und CELEX-Nummer der genannten EU-Rechtsakte | Suche über Nummer | laufend |
| Parlamentsdienste, Geschäft 26.023 | Beratungsstand, Beschlüsse je Entwurf | Webservice `ws-old.parlament.ch/affairs/20260023`, Curia Vista | laufend |
| EDA, Seite «Botschaft Paket Schweiz–EU» | Übersicht der 94 EU-Gesetzgebungsakte, Kontrollzahlen (36 geänderte und 3 neue Bundesgesetze) | PDF | 13. März 2026 |

Urheberrecht: Völkerrechtliche Verträge, Erlasse und Berichte von Behörden sind nach Art. 5 Abs. 1 lit. a und c URG nicht geschützt. Der Wortlaut darf vollständig veröffentlicht werden.

## 5. Ansichten

| Nr. | Ansicht | Zeigt | Änderungen gegenüber der Musteransicht |
|---|---|---|---|
| 1 | Umfang (Icicle) | Paket, Vorlage, Dokument, Teil, Zettel; Fläche gleich Wörter | Übersichtsfeld neu (Ziffer 5.1); grössere Schrift |
| 2 | Verknüpfungen (Matrix) | Dokument × Dokument | neues Mass «Artikelverweise zwischen Dokumenten»; bisherige Masse «gemeinsame EU-Rechtsakte» und «genehmigt und erläutert» bleiben |
| 3 | Umsetzung (Sankey) | Abkommen, Bundesbeschluss, Bundesgesetz | Gesetzesliste vollständig (36 geändert, 3 neu) |
| 3a | Bezüge (Bogendiagramm) | alle Zettel auf einer Linie, Länge = Wörter; Bögen oben: Artikelverweise im selben Dokument; unten: Botschaft nennt Artikel, gleicher EU-Rechtsakt, genehmigt, erläutert | im Prototyp vorhanden; Klick auf einen Bogen zeigt beide Enden mit Fundstelle; Artikelverweise zwischen Dokumenten ergänzen, sobald `verweise.py` sie liefert |
| 4 | Zettel | Wortlaut, Fundstelle, ein- und ausgehende Verweise, genannte EU-Rechtsakte und SR-Erlasse | Wortlaut ungekürzt; grössere Schrift; Link auf die Fedlex-Stelle |
| 5 | Lokaler Graph | Umfeld eines Zettels in zwei Schritten | neu aufgebaut und erläutert (Ziffer 5.2) |
| 6 | Tabelle | alle Dokumente mit Seiten, Wörtern, Zetteln | unverändert |
| 7 | Suche | Titel und Wortlaut aller Zettel | Treffer zusätzlich im Übersichtsfeld markiert |
| 8 | Fassungsvergleich | Entwurf Bundesrat, Beschluss Parlament, Referendumsvorlage | neu, sobald eine zweite Fassung vorliegt |

### 5.1 Übersichtsfeld zum Icicle

1. Das ganze Paket als verkleinertes Icicle über alle Ebenen, fest neben oder über der Hauptansicht.
2. Der Ausschnitt, den die Hauptansicht zeigt, ist im Übersichtsfeld als Rahmen eingezeichnet.
3. Klick ins Übersichtsfeld springt zum angeklickten Teil.
4. Suchtreffer und der geöffnete Zettel sind im Übersichtsfeld markiert.
5. Die Pfadleiste über der Hauptansicht bleibt.

### 5.2 Lokaler Graph

1. Feste Sektoren je Knotenart: Dokument oben, Zettel im gleichen Dokument rechts, EU-Rechtsakte unten, SR-Erlasse links. Gleiche Lage bei jedem Zettel.
2. Beschriftungen ohne Überlappung; was nicht passt, erscheint beim Überfahren.
3. Filter je Kantenart: verweist auf, nennt, genehmigt, erläutert, Teil von.
4. Überfahren eines Knotens hebt den Weg zum Mittelpunkt hervor.
5. Erläuterung in Sätzen unter dem Graph:
   1. Was ein Knoten ist (Zettel, Dokument, EU-Rechtsakt, SR-Erlass).
   2. Was eine Kante bedeutet und woher sie stammt (Textstelle im Wortlaut, Art. 1 eines Bundesbeschlusses, Kapitel 2.x der Botschaft).
   3. Was der zweite Schritt zeigt: andere Zettel, die denselben EU-Rechtsakt nennen, und der Bundesbeschluss, der das Dokument genehmigt.
   4. Dass Lage und Abstand keine Bedeutung tragen.
6. Unter dem Graph dieselben Verknüpfungen als Liste, für Bildschirmleser und zum Kopieren.

### 5.3 Schrift und Grössen

1. Grundschrift 16 px, Wortlaut im Zettel 16 px mit Zeilenhöhe 1,6.
2. Beschriftungen in Grafiken mindestens 13 px, im lokalen Graph mindestens 12 px bei voller Breite.
3. Zettelspalte ab 1280 px Fensterbreite 480 px breit, darunter unter der Hauptansicht.
4. Schriften und Farbflächen wie im Politspiegel: Archivo für Titel, Public Sans für Text, Tokens `grund`, `flaeche`, `karte`, `text`, `text-leise`, `linie`; hell und dunkel.

## 6. Neutralitätsregeln

1. Farbe bezeichnet nur die Vorlage (Stabilisierung, Elektrizität, Lebensmittelsicherheit, Gesundheit; Botschaft und Übriges neutral grau). Keine Ampelfarben (Rot, Grün), nicht die Pro- und Contra-Farben des Politspiegels (Türkis, Violett). Palette mit dem Farbsehschwäche-Prüfskript geprüft (Musteransicht: Orange, Blau, Gelb, Magenta in dieser Reihenfolge).
2. Grösse bezeichnet nur die Wortzahl, mit Einheit. Knoten im Graph sind gleich gross.
3. Reihenfolge nach BBl-Nummer und Gliederung, nie nach Grösse oder Anzahl Verknüpfungen.
4. Kanten nur aus Verweisen im Wortlaut, mit Kantenart und Fundstelle.
5. Titel eines Zettels ist die amtliche Artikel- oder Abschnittsüberschrift.
6. Suche ohne vorgeschlagene Begriffe.
7. Automatisch extrahierte Angaben tragen die Marke «Rohextraktion», bis sie geprüft sind.
8. Fehler werden über ein sichtbares Korrekturprotokoll gemeldet und behoben, wie im Politspiegel.

## 7. Datenmodell

1. Zettel: Kennung aus ELI und Gliederung, zum Beispiel `fga/2026/632/art_4` oder `fga/2026/615/ziff_2.11.3`. Felder: Dokument, Teil, Nummer, amtliche Überschrift, Sprache, Wörter, Wortlaut, Fundstelle (Seite im BBl, sobald vollständig publiziert).
2. Externe Knoten: EU-Rechtsakt (CELEX-Nummer, Titel), SR-Erlass (SR-Nummer, Titel), Bundesgesetz (Titel, SR-Nummer, neu oder geändert).
3. Kantenarten:
   1. `teil_von`: Zettel gehört zu Teil und Dokument.
   2. `verweist_auf`: Artikelverweis im Wortlaut, auch zwischen Dokumenten.
   3. `nennt`: Zettel nennt EU-Rechtsakt oder SR-Erlass.
   4. `genehmigt`: Bundesbeschluss genehmigt Abkommen oder Protokoll (Art. 1 des Bundesbeschlusses).
   5. `erlaeutert`: Kapitel 2.x der Botschaft erläutert das Dokument.
   6. `aendert`: Bundesbeschluss ändert oder schafft ein Bundesgesetz (Anhänge der Bundesbeschlüsse).
   7. `entspricht`: derselbe Zettel in einer anderen Fassung (Fassungsvergleich).
4. Jede Kante führt Quelle (Zettel und Textstelle), Extraktionsregel und Status (`automatisch`, `geprueft`, `verworfen`).
5. Ausgabe doppelt: `daten/zettel.json` und `daten/kanten.json` für die Seite, dazu ein Obsidian-Vault (`vault/`, Markdown mit Frontmatter und `[[Wikilinks]]`) zum Herunterladen.

## 8. Repository

```
vertragsspiegel/
  README.md
  docs/
    PROJEKTBRIEF.md              dieses Dokument
    AUFTRAG_fedlex-kontrolle.md  wiederkehrende Prüfung
    AUFTRAG_claude-code-einrichtung.md  Repository und geplante Aufgabe einrichten
    DESIGN_entscheide.md         ab Etappe 3
    KORREKTUREN.md               Korrekturprotokoll
  scripts/
    fedlex_pruefen.py            Änderungen auf Fedlex erkennen (vorhanden)
    parlament_pruefen.py         neue Beschlüsse im Parlament erkennen (vorhanden)
    laden.py                     PDF, später XML von Fedlex holen
    gliedern.py                  Texte in Zettel teilen
    verweise.py                  Kanten extrahieren
    pruefen.py                   Selbstprüfung (Ziffer 9)
    bauen.py                     site/ erzeugen
    vault.py                     Obsidian-Vault erzeugen
    publish.py                   bauen, committen, pushen
  daten/
    fedlex_stand.json            Stand der letzten Fedlex-Prüfung (vorhanden)
    parlament_stand.json         Stand der letzten Parlamentsprüfung (vorhanden)
    quellen.json, zettel.json, kanten.json
    pdf/, text/                  Rohdaten, nicht versioniert
  vault/                         erzeugt
  site/                          veröffentlichte Seite
  prototyp/                      Musteransicht und Pipeline vom 1. Oktober 2026
  .github/workflows/pages.yml    liefert site/ aus, wie im Politspiegel
```

Technik:

1. Python 3, Textauszug mit `pdftotext -layout`, nach der Vollpublikation aus dem Fedlex-XML.
2. Seite statisch, D3 7.9.0 und d3-sankey 0.12.3 über cdnjs und jsDelivr, keine Cookies, kein Zählpixel.
3. Veröffentlichung wie im Politspiegel: `publish.py` committet und pusht, `pages.yml` liefert `site/` aus.
4. Zugangsdaten nie im Repository (`.gitignore` an erster Stelle).

## 9. Qualitätssicherung

Selbstprüfung bei jedem Bau, Abbruch bei Abweichung:

1. Wörter: Summe der Zettel je Dokument gleich Wörter im Dokument ohne Kopf- und Fusszeilen.
2. Artikel: lückenlose Nummernfolge je Abkommen und Bundesbeschluss, Abweichungen einzeln gemeldet.
3. Botschaft: jede Ziffer des Inhaltsverzeichnisses hat einen Zettel.
4. Gesetze: 36 geänderte und 3 neue Bundesgesetze laut Botschaft.
5. EU-Rechtsakte: jede erkannte Nummer löst auf EUR-Lex zu einer CELEX-Nummer auf; die 94 Gesetzgebungsakte der EDA-Übersicht sind alle enthalten.
6. Stichprobe von Hand: 20 zufällige Kanten je Bau, Ergebnis im Korrekturprotokoll.

Bekannte Fehlerbilder der Rohextraktion vom 1. Oktober 2026:

1. Artikelköpfe in Anhängen werden als Artikel des Abkommens erkannt, zum Beispiel im Stromabkommen «Art. 9 (entspricht Artikel 13 des Protokolls (Nr. 7))».
2. Gesetzesnamen über einen Zeilenumbruch werden abgeschnitten oder doppelt erfasst.
3. Gesetze mit offenem Datum («vom …», Beihilfeüberwachungsgesetz) fehlen in der Gesetzesliste. Die Musteransicht zeigt 33 Zuordnungen statt 39.
4. Artikelverweise zwischen Dokumenten werden nicht erkannt.
5. Die Wörter der Botschaft sind seitenanteilig auf die Abschnitte verteilt, nicht abschnittsgenau.
6. EU-Rechtsakte sind als Nummer erfasst, nicht als CELEX-Nummer. Erkannt sind 466 Nummern, die EDA-Übersicht nennt 94 Gesetzgebungsakte. Die Differenz ist nicht aufgeschlüsselt.

## 10. Verknüpfung mit dem Politspiegel

1. Kasten auf der Übersicht des Politspiegels: neuer Block `vertrag` in `politspiegel/politspiegel.json` mit Titel, Satz und Adresse; `politspiegel/bauen.py` zeichnet ihn wie den Finanzspiegel-Kasten. Ohne Kennzahlen, damit keine Zahl von Hand gepflegt wird; optional liest `bauen.py` `site/kennzahlen.json` des Vertragsspiegels.
2. Heimlink oben links auf jeder Seite des Vertragsspiegels zur Übersicht des Politspiegels.
3. Gleiche Gestaltung (Ziffer 5.3), gleiches Eckband «Testphase», gleiche Melde- und Impressumsseiten.
4. Abstimmungsspiegel: Kommt das Paket zur Volksabstimmung, verlinkt die Vorlage auf Zettel über deren Kennung als Anker (`#fga-2026-632-art_4`).

## 11. Fassungen und Termine

| Datum | Ereignis | Folge für den Vertragsspiegel |
|---|---|---|
| 13. März 2026 | Botschaft des Bundesrates | Ausgangsfassung |
| 18. März 2026 | BBl 2026 615–644 per Verweis | Volltext aus PDF-Anhängen |
| 4. und 17. August 2026 | BBl 2026 2099, 2100, 2174 (Pa. Iv. SPK-S) | als Begleitgeschäft erfassen |
| 28. bis 30. September 2026 | Ständerat: Entwurf 1 abweichend vom Entwurf, Entwürfe 5 bis 8 und 10 gemäss Entwurf | zweite Fassung des Bundesbeschlusses Stabilisierung, Fassungsvergleich |
| bis Ende November 2026 | Vollpublikation im BBl | Umstellung auf XML, neue Seitenzahlen |
| offen | weitere Beschlüsse von Ständerat und Nationalrat, Differenzbereinigung, Schlussabstimmung | Fassungsvergleich |
| offen | Referendumsfrist, gegebenenfalls Volksabstimmung | Abstimmungsspiegel |
| offen | Inkrafttreten, Publikation in AS und SR | Fundstellen nach SR |

Die Fedlex-Kontrolle erkennt neue Bundesblatt- und AS-Einträge zum Paket, die Parlamentskontrolle neue Beschlüsse je Entwurf.

## 12. Etappen

1. Repository anlegen, Prototyp übernehmen, Fedlex-Kontrolle als geplante Aufgabe starten. Abgeschlossen am 1. Oktober 2026.
2. Pipeline: `laden.py`, `gliedern.py`, `verweise.py`, `pruefen.py`; Fehlerbilder 1 bis 6 aus Ziffer 9 beheben.
3. Ansichten nach Ziffer 5: Übersichtsfeld, lokaler Graph, Schrift; `DESIGN_entscheide.md` anlegen; GitHub Pages einrichten, sobald es `site/` gibt.
4. Vollpublikation übernehmen, sobald erschienen: XML statt PDF, Seitenzahlen im BBl als Fundstelle.
5. Französisch und Italienisch.
6. Fassungsvergleich nach den Beschlüssen des Parlaments; Obsidian-Vault zum Herunterladen.
7. Kasten im Politspiegel, Testphase, Bekanntmachung.

## 13. Offene Entscheide

1. Name und Adresse: «Vertragsspiegel», Repository `vertragsspiegel`. Entschieden am 1. Oktober 2026.
2. Projektordner «Bilaterale III» bleibt Wurzel des Repositorys. Entschieden am 1. Oktober 2026.
3. Zeitpunkt für Französisch und Italienisch.
4. Rohdaten (PDF, Text, je Sprache rund 25 MB) sind aus dem Repository ausgeschlossen (`.gitignore`), `laden.py` stellt sie wieder her. Entschieden am 1. Oktober 2026.
5. Social-Media-Beiträge zum Vertragsspiegel: ja oder nein.
