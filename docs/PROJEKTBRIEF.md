# Projektbrief: Vertragsspiegel

Wertungsfreie, visuelle Aufbereitung des Pakets Schweiz–EU (Bilaterale III): Botschaft, Abkommen, Protokolle, Erklärungen und Bundesbeschlüsse, heruntergebrochen auf Artikel und Abschnitte, mit Umfang und Verknüpfungen.

Stand: 3. Oktober 2026. Projektordner: `C:\Users\Admin\Documents\Claude\Projects\Politik\Bilaterale III` (zugleich Wurzel des Repositorys). Repository: `github.com/michaeljkahler/vertragsspiegel`, öffentlich seit 1. Oktober 2026. Seite (ab Etappe 3): `michaeljkahler.github.io/vertragsspiegel/`. Name «Vertragsspiegel», entschieden am 1. Oktober 2026 (Ziffer 13).

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
9. Etappe 2, Stand 1. Oktober 2026: Pipeline `laden.py`, `gliedern.py`, `verweise.py`, `pruefen.py` steht, Prüfungen 9.1 bis 9.6 bestanden.
   1. 33 Werke (BBl 2026 615–644 und das Begleitgeschäft 2099, 2100, 2174), 3103 Zettel. Feiner als die Musteransicht: Rechtsakte in den Anhängen und die Erläuterungen der Botschaft zu einzelnen Artikeln sind eigene Zettel.
   2. Wörter: 677 564 roh wie in Ziffer 1.1; ohne Kopf- und Fusszeilen, Fussnotenzeichen und Trennstriche 642 186. Die Zettel zählen Wortlaut und Fussnoten.
   3. 7649 Kanten: 1775 Artikelverweise, 2172 Nennungen von EU-Rechtsakten und SR-Erlassen, 535 Erläuterungen, 46 Änderungen von Bundesgesetzen, 18 Genehmigungen, dazu die Gliederung.
   4. Fehler in den Vorlagen und Grenzen der Extraktion: `docs/KORREKTUREN.md`.
   5. Der Reiter «Bezüge» (Ziffer 1.8, Ansicht 3a) liest noch die Rohextraktion des Prototyps; die Artikelverweise zwischen Dokumenten aus `daten/kanten.json` sind für Etappe 3 bereit.
10. Etappe 3, Stand 1. Oktober 2026: Seite aus `seite/`, gebaut mit `scripts/bauen.py` nach `site/`, Ansichten nach Ziffer 5 auf den Daten von Etappe 2, auch der Reiter «Bezüge». Gestaltungsentscheide: `docs/DESIGN_entscheide.md`. Auslieferung über `.github/workflows/pages.yml`.
11. Rückmeldung Michael vom 2. Oktober 2026:
   1. Der lokale Graph braucht mehr Struktur und Farbe und ist für Laien nicht verständlich genug.
   2. Politik, Medien und Bevölkerung sollen Inhalte so schnell wie möglich finden: über Stichworte, Filter über alle Ebenen oder eine Folge von Fragen mit Auswahlantworten. Danach soll sichtbar sein, wie weit die gefundene Stelle verknüpft ist. Beispiele: Wer zur Streitbeilegung sucht (in der Debatte «fremde Richter») oder zum Lohnschutz, soll die Stellen im Text finden.
12. Umsetzung vom 2. Oktober 2026 (Etappe 3, Ergänzung):
   1. Umfeld eines Zettels als Gliederung nach Bezugsart, der bisherige Graph als Darstellung «Netz» wählbar (Ziffer 5.2).
   2. Finden mit Thema, Textart, geführter Auswahl in drei Schritten, Themenvorschlag in der Suche und Ergebnisliste; die Auswahl ist in allen Ansichten markiert (Ziffer 5.4).
   3. Themenkatalog `daten/themen.json` mit 20 Themen, geprüft mit `scripts/themen.py`: jeder Begriff kommt im Paket vor, 0 Fehler.
13. Auftrag Michael vom 2. Oktober 2026: Grafikfunktion wie im Finanzspiegel, mindestens für die Netzgrafiken auf allen Stufen, das Icicle, die Bezüge und die Umsetzung, in den Formaten Social Media, Bericht und Präsentation. Entscheide vom selben Tag: eigener Titel erlaubt, die Zeile «Gezeigt» bleibt fest; Wortlautkarte nur mit ganzen Absätzen oder dem ganzen Text; Netz für Vorlagen, Dokumente und Artikel auch als Ansicht auf der Seite. Umgesetzt in `seite/grafik.js` und im Reiter «Verknüpfungen» (Ziffer 5.5).
14. Rückmeldung Michael vom 2. Oktober 2026: Themenkatalog freigegeben (Ziffer 13.6); die Seite ist an Testpersonen verschickt; der Kasten im Politspiegel (Etappe 7) besteht; Etappe 5 umsetzen; Etappe 2 sorgfältig nachführen.
15. Nachführung Etappe 2 vom 2. Oktober 2026, Einzelheiten in `docs/KORREKTUREN.md` (Abschnitt 3, 2. Oktober):
   1. EDA-Übersicht abgeglichen: alle 95 Gesetzgebungsakte im Paket genannt.
   2. Gliederung: Änderungsprotokolle LandVA und MRA vollständig nach Ziffern, sechs Artikel mit einfachem Leerzeichen nach der Nummer erkannt, zwei falsche Kapitel entfernt; Trennstriche am Seitenende aufgelöst; eine Scheinerläuterung in Ziffer 2.2.8 entfernt. 3132 Zettel, 647 927 Wörter.
   3. Verweise: Artikelnummern mit «bis», «ter», «quater» werden nicht mehr gekürzt; Botschaft ohne Zusatz über das Bezugswerk der Ziffer (418 Kanten, Stichprobe 40 von 40); Protokolle im EUPA mit eigenem Geltungsbereich. 8112 Kanten, davon 2186 Artikelverweise und 555 Erläuterungen.
   4. Erläuterungen der Botschaft zu einzelnen Artikeln: 515 von 516 zugeordnet; die letzte erläutert einen Artikel, den der Entwurf nicht enthält (Fehler der Vorlage).
   5. Prüfungen 9.1 bis 9.6 bestanden, Stichprobe 20 von 20.
16. Etappe 5, Stand 2. Oktober 2026: Französisch und Italienisch, Entscheid Michael vom selben Tag: zuerst der Wortlaut mit Umschalter, Bedienung deutsch; Themen aus der deutschen Zuordnung.
   1. `laden.py --sprache fr|it` lädt die 33 Werke; `ausrichten.py` richtet den Wortlaut an den deutschen Zetteln aus, damit jeder Zettel in allen Sprachen dieselbe Kennung hat (`daten/zettel_fr.json`, `daten/zettel_it.json`).
   2. Französisch 3123, italienisch 3127 von 3132 Zetteln mit eigener Stelle; 836 009 und 752 033 Wörter. Die übrigen Zettel haben in der Vorlage keine eigene Überschrift (`docs/KORREKTUREN.md`, Abschnitt 1, Nr. 7 bis 14).
   3. Seite: Umschalter DE, FR, IT neben der Suche; Anker `&fr`, `&it`. Es wechseln Wortlaut, Fussnoten, Bezeichnungen, Gliederung, Wörter, Seiten und PDF; Verknüpfungen, Themen und Fundstellen bleiben aus der deutschen Fassung, der Zettel sagt das.
   4. Prüfung 7 in `pruefen.py`: gleiche Kennungen, Wörter je Werk, höchstens 1 % der Zettel ohne eigene Stelle.
   5. Offen: Bedienung und Erklärtexte auf Französisch und Italienisch, Themenbegriffe in beiden Sprachen (je mit Freigabe).
17. Rückmeldung von Testpersonen, weitergegeben von Michael am 3. Oktober 2026: Die Seite ist unübersichtlich. Vorschläge Michael: Anleitung mit kleinen Einblendungen und Kreisen um die Bedienelemente, oder Hervorhebung der Felder mit einer Infoblase rechts oben, oder beides. Entscheid vom selben Tag: beides, nach dem Stand der Technik für Laien, auch für ältere und wenig technikvertraute Personen.
18. Umsetzung vom 3. Oktober 2026: Aufbau in drei nummerierten Bereichen, gekürzter Kopf, Hervorhebung über Kontrast, Infoblasen an jedem Bereich und jeder Ansicht, freiwilliger Rundgang in fünf Schritten, grössere Schrift und Klickflächen (Ziffer 5.6).

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
| EDA, Seite «Botschaft Paket Schweiz–EU» | Übersicht der 95 EU-Gesetzgebungsakte (abgeglichen mit `scripts/eda_abgleich.py`), Kontrollzahlen (36 geänderte und 3 neue Bundesgesetze) | PDF | 13. März 2026 |

Urheberrecht: Völkerrechtliche Verträge, Erlasse und Berichte von Behörden sind nach Art. 5 Abs. 1 lit. a und c URG nicht geschützt. Der Wortlaut darf vollständig veröffentlicht werden.

## 5. Ansichten

| Nr. | Ansicht | Zeigt | Änderungen gegenüber der Musteransicht |
|---|---|---|---|
| 1 | Umfang (Icicle) | Paket, Vorlage, Dokument, Teil, Zettel; Fläche gleich Wörter | Übersichtsfeld neu (Ziffer 5.1); grössere Schrift |
| 2 | Verknüpfungen (Matrix) | Dokument × Dokument | neues Mass «Artikelverweise zwischen Dokumenten»; bisherige Masse «gemeinsame EU-Rechtsakte» und «genehmigt und erläutert» bleiben |
| 2b | Verknüpfungen (Netz) | Vorlagen, Dokumente oder Artikel eines Dokuments auf einem Kreis | neu am 2. Oktober 2026; gleiche Zählung wie die Matrix (Ziffer 5.5.3) |
| 3 | Umsetzung (Sankey) | Abkommen, Bundesbeschluss, Bundesgesetz | Gesetzesliste vollständig (36 geändert, 3 neu) |
| 3a | Bezüge (Bogendiagramm) | alle Zettel auf einer Linie, Länge = Wörter; Bögen oben: Artikelverweise im selben Dokument; unten: Botschaft nennt Artikel, gleicher EU-Rechtsakt, genehmigt, erläutert | im Prototyp vorhanden; Klick auf einen Bogen zeigt beide Enden mit Fundstelle; Artikelverweise zwischen Dokumenten ergänzen, sobald `verweise.py` sie liefert |
| 4 | Zettel | Wortlaut, Fundstelle, ein- und ausgehende Verweise, genannte EU-Rechtsakte und SR-Erlasse | Wortlaut ungekürzt; grössere Schrift; Link auf die Fedlex-Stelle |
| 5 | Umfeld (lokaler Graph) | Bezüge eines Zettels nach Art, Reichweite über einen und zwei Schritte | Gliederung als Voreinstellung, Netz wählbar (Ziffer 5.2) |
| 6 | Tabelle | alle Dokumente mit Seiten, Wörtern, Zetteln | unverändert |
| 7 | Suche | Titel und Wortlaut aller Zettel | Treffer in allen Ansichten markiert; Themenvorschlag aus dem Katalog (Ziffer 5.4) |
| 8 | Fassungsvergleich | Entwurf Bundesrat, Beschluss Parlament, Referendumsvorlage | neu, sobald eine zweite Fassung vorliegt |
| 9 | Finden | Thema, Textart, geführte Auswahl, Ergebnisliste | neu (Ziffer 5.4) |
| 10 | Grafik | jede Ansicht als PNG für Social Media, Präsentation und Bericht | neu (Ziffer 5.5) |
| 11 | Hilfe | drei nummerierte Bereiche, Infoblasen, Rundgang | neu am 3. Oktober 2026 (Ziffer 5.6) |

### 5.1 Übersichtsfeld zum Icicle

1. Das ganze Paket als verkleinertes Icicle über alle Ebenen, fest neben oder über der Hauptansicht.
2. Der Ausschnitt, den die Hauptansicht zeigt, ist im Übersichtsfeld als Rahmen eingezeichnet.
3. Klick ins Übersichtsfeld springt zum angeklickten Teil.
4. Suchtreffer und der geöffnete Zettel sind im Übersichtsfeld markiert.
5. Die Pfadleiste über der Hauptansicht bleibt.

### 5.2 Umfeld eines Zettels (lokaler Graph)

Fassung vom 2. Oktober 2026. Zwei Darstellungen, die Wahl bleibt im Browser gespeichert.

1. Gliederung (Voreinstellung):
   1. Oben «Was verweist auf diesen Text?», in der Mitte der Text in der Farbe seiner Vorlage, unten «Worauf verweist dieser Text?».
   2. Gruppen nach Bezugsart, als Frage oder Aussage benannt: «Erläutert in der Botschaft», «Genehmigt durch», «Andere Artikel verweisen hierher», «Verweist auf diese Artikel», «Erläutert», «Genehmigt», «Nennt EU-Rechtsakte», «Nennt Schweizer Erlasse (SR)». Leere Gruppen entfallen.
   3. Ein Stamm links verbindet die Gruppen mit dem Text; Pfeile zeigen vom verweisenden zum verwiesenen Text. Durchgezogen: Verweis oder Nennung im Wortlaut. Gestrichelt: Erläuterung oder Genehmigung.
   4. Jeder Bezug als Karte mit vollem Titel (höchstens zwei Zeilen), Farbe der Vorlage als Rand und Fläche; EU-Rechtsakte und SR-Erlasse grau mit Raute und Dreieck. Gleiche Ziele zusammengefasst, Anzahl als «×n».
   5. Reihenfolge in der Gruppe nach Paket. Höchstens acht Karten je Gruppe, der Rest auf Klick.
   6. Überfahren zeigt die Fundstelle im Wortlaut und hebt den Weg der Gruppe zum Text hervor; Klick öffnet den Zettel.
   7. Zweiter Schritt bei EU-Rechtsakten: «auch genannt in» mit den anderen Dokumenten, die denselben Rechtsakt nennen (ohne Botschaft).
   8. Erläuterung «So lesen» in Sätzen, mit den Farben der Vorlagen.
2. Netz: der radiale Graph mit festen Sektoren je Knotenart, Filtern je Kantenart und Hervorhebung des Wegs zum Mittelpunkt, wie in Etappe 3 gebaut.
3. Reichweite unter dem Umfeld (Antwort auf «wie weit ist das verknüpft?»):
   1. Zettel, die über Artikelverweise oder Erläuterungen der Botschaft mit dem Zettel verbunden sind, in beide Richtungen: direkt und über einen Zwischenschritt, mit Anzahl Dokumente und einem Balken nach Vorlage.
   2. Gleiche EU-Rechtsakte zählen nicht, weil ein häufig genannter Rechtsakt sonst fast das ganze Paket verbindet.
   3. «Im Umfang markieren» übernimmt die Reichweite als Auswahl (Ziffer 5.4); «Im Bezugsdiagramm zeigen» wechselt zu den Bögen des Zettels.
4. Darunter alle Verknüpfungen als Liste, für Bildschirmleser und zum Kopieren: eine Zeile je Art, Richtung und Ziel, mit Anzahl und allen Fundstellen.

### 5.3 Schrift und Grössen

1. Grundschrift 16 px, Wortlaut im Zettel 16 px mit Zeilenhöhe 1,6.
2. Beschriftungen in Grafiken mindestens 13 px, im lokalen Graph mindestens 12 px bei voller Breite.
3. Zettelspalte ab 1280 px Fensterbreite 480 px breit, darunter unter der Hauptansicht.
4. Schriften und Farbflächen wie im Politspiegel: Archivo für Titel, Public Sans für Text, Tokens `grund`, `flaeche`, `karte`, `text`, `text-leise`, `linie`; hell und dunkel.

### 5.4 Finden

Ziel: Politik, Medien und Bevölkerung finden die Stellen zu einer Frage in wenigen Schritten und sehen danach, wie weit sie verknüpft sind (Ziffer 1.11).

1. Einstiege:
   1. Suchfeld: Titel und Wortlaut wie bisher. Passt das Stichwort zu einem Thema (Name, Begriff oder Suchbegriff), steht das Thema als erster Vorschlag über den Treffern. Steht das Stichwort nicht im Wortlaut, sagt die Seite das («fremde Richter» → Thema «Streitbeilegung, Schiedsgericht und EuGH»).
   2. «Finden» im Bereich 1 unter dem Suchfeld (bis 3. Oktober 2026 als Leiste unter den Reitern): Auswahl Thema, Schalter Textart (Alle Texte, Vertragstexte, Umsetzung, Botschaft und Berichte), Stand der Auswahl mit Anzahl markierter Zettel und Knöpfen zum Aufheben.
   3. «In drei Schritten finden»: geführte Auswahl mit Auswahlantworten. Schritt 1 «Worum geht es Ihnen?» (Themen alphabetisch, Stichwortfeld), Schritt 2 «Welche Texte wollen Sie sehen?» (Was mit der EU vereinbart ist, Was die Schweiz dafür ändert, Wie es erläutert wird, Alle Texte; je mit Anzahl Zettel), Schritt 3 «Wie wollen Sie die Stellen sehen?» (Liste, Umfang, Bezüge, Verknüpfungen).
2. Textarten nach Dokumenttyp: Vertragstexte = Abkommen, Protokolle, Erklärungen; Umsetzung = Bundesbeschlüsse; Botschaft und Berichte = Botschaft, Bericht SPK-S, Stellungnahme des Bundesrates.
3. Themen (`daten/themen.json`):
   1. 20 Themen, Namen in der Sprache der amtlichen Texte, alphabetisch.
   2. Je Thema Begriffe als reguläre Ausdrücke, gross- und kleinschreibungsgenau, in Python und JavaScript gleich auswertbar (kein Lookbehind, kein `\p`, `\b` nur an ASCII-Zeichen).
   3. Ein Zettel gehört zum Thema, wenn Wortlaut oder Fussnoten mindestens einen Begriff enthalten. Gezählt wird jede Fundstelle.
   4. Suchbegriffe aus der öffentlichen Debatte führen in der Suche zum Thema, ordnen aber keinen Zettel zu und erscheinen nicht als Themenname.
   5. `scripts/themen.py` prüft den Katalog (T1 eindeutig und alphabetisch, T2 Muster ohne unzulässige Konstrukte, T3 jeder Begriff mindestens einmal im Paket) und meldet Begriffe, die mehr als 15 % der Zettel treffen, und Suchbegriffe ohne Vorkommen. `bauen.py` bricht bei einem Fehler ab.
4. Wirkung der Auswahl: Thema, Textart, Reichweite und Suche werden geschnitten. Die Auswahl ist markiert im Umfang (Felder ausserhalb blass, Streifen mit dem Anteil markierter Wörter je Feld), im Übersichtsfeld, in den Bezügen (Bögen mit markiertem Ende), in der Matrix (nur Bezüge aus markierten Zetteln), in der Umsetzung (Dokumente ohne markierten Zettel blass), in der Tabelle (Spalte «Markiert») und im Umfeld (Karten ausserhalb blass).
5. Ergebnisliste im Zettelbereich: Thema mit Begriffen und Anzahl Fundstellen, Hinweis zum gesuchten Wort, Zettel nach Textart gruppiert, je 15 sichtbar. Reihenfolge nach Paket; auf Wahl nach Anzahl Fundstellen mit Balken.
6. Im geöffneten Zettel sind die Begriffe des Themas und das Suchwort markiert, mit «Stelle 1 von n» zum Springen; «Zurück zur Liste» führt zur Ergebnisliste.
7. Anker: `#thema-<id>` und `#text-<art>`, kombinierbar mit dem Zettelanker (`#fga-2026-617-art_4&thema-lohnschutz`).

### 5.5 Grafiken für Social Media, Präsentation und Bericht

Aufbau wie im Finanzspiegel (`politspiegel/finanzspiegel/grafik.js`): Knopf unten rechts und in jeder Ansicht, seit 3. Oktober 2026 einheitlich «Als Bild speichern» mit Bildsymbol, Dialog mit Motiv, Format, Hintergrund und eigenem Titel, Vorschau, PNG oder Zwischenablage.

1. Formate: Social Media 4:5 (1080 × 1350), Präsentation 16:9 (1920 × 1080), Bericht 3:2 (1800 × 1200). Jedes Motiv hat eine eigene Anordnung je Format; die Grafiken sind immer hell.
2. Motive:
   1. Paket in Zahlen: Dokumente, Seiten, Wörter, Zettel, Artikelverweise, genannte EU-Rechtsakte, Bundesgesetze; Wörter nach Vorlage.
   2. Umfang: der gewählte Ausschnitt des Icicle mit drei Ebenen, Auswahl blass ausserhalb und als Streifen mit dem markierten Anteil.
   3. Umfeld des geöffneten Zettels: Gliederung (Querformat links eingehend, rechts ausgehend) oder Netz, mit Reichweite.
   4. Netz auf vier Stufen: Vorlagen, Dokumente, Artikel eines Dokuments, Zettel.
   5. Matrix der Verknüpfungen.
   6. Bezüge auf einer Linie, mit den eingeblendeten Bogenarten und dem Ausschnitt; in allen Formaten waagrecht.
   7. Umsetzung (Sankey), alle Bundesbeschlüsse oder einer.
   8. Thema in Zahlen: Zettel, Fundstellen, Anteil am Paket, nach Textart und nach Dokument in Paketreihenfolge, Begriffe.
   9. Wortlautkarte: ganzer Text oder ein ganzer Absatz, ohne Kürzung, mit Fundstelle. Passt der Text nicht, sagt die Grafik das, statt zu kürzen.
3. Netz (auch als Ansicht auf der Seite): Knoten auf einem Kreis in Paketreihenfolge, Kreisfläche = Wörter, Linienbreite = Anzahl Bezüge beider Richtungen, Linie in Vorlagefarbe, wenn beide Enden zur gleichen Vorlage gehören. Kein Kräftemodell, weil dort Nähe als Aussage gelesen wird (Ziffer 6.3).
4. Jede Grafik trägt Marke, Titel, die feste Zeile «Gezeigt», bei aktiver Auswahl die Zeile «Markiert», die Legende der Vorlagen, Quelle, Adresse der Seite, Datenstand und bei Verweisen «Rohextraktion». Ein eigener Titel ersetzt nur den Titel.
5. Die Grafik rechnet nichts Eigenes: Daten und Zählungen kommen aus denselben Funktionen wie die Seite.

### 5.6 Hilfe für Laien

Ziel: Die Seite ist ohne Vorwissen und ohne Übung mit Maus oder Bildschirm bedienbar, auch für ältere Personen (Ziffer 1.17). Gestaltungsentscheide und Quellen: `docs/DESIGN_entscheide.md`, Abschnitt 4e.

1. Drei nummerierte Bereiche in Leserichtung:
   1. «Suchen und auswählen»: Suchfeld mit sichtbarer Frage «Wonach suchen Sie?», Thema, Textart, «In drei Schritten finden», «Neu beginnen», Stand der Auswahl.
   2. «Ansicht wählen»: fünf Reiter, unter jedem Namen die Frage, die die Ansicht beantwortet («Wie viel Text steht wo?», «Welche Dokumente hängen zusammen?», «Welcher Artikel verweist auf welchen?», «Welche Gesetze ändern sich?», «Alle Dokumente als Liste»).
   3. «Text lesen»: der Zettel. Die Startseite der Zettelspalte nennt die Wege mit den Nummern der Bereiche.
2. Kopf: Kennzahlen; Hinweis «Keine Bewertung, keine Zusammenfassung», die Herkunft der Angaben zum Aufklappen; «Sprache der Texte» DE, FR, IT; Knopf «Rundgang»; Hinweis, wie man die Schrift mit Strg und + vergrössert.
3. Hervorhebung über Kontrast, Form und Nummer, nicht über Farbe (Ziffer 6.1): dunkle Kreise mit der Nummer des Bereichs, dunkel gefüllter gewählter Reiter, Rahmen in Textfarbe an Knöpfen und Suchfeld, Bildsymbol an «Als Bild speichern».
4. Infoblasen: Knopf «i» rechts oben an jedem Bereich und jeder Ansicht. Öffnet beim Darüberfahren mit der Maus, beim Antippen und mit der Tastatur; bleibt offen, solange Maus oder Fokus auf Knopf oder Blase liegen; schliesst mit Esc, «×» oder Klick daneben.
5. Rundgang in fünf Schritten: Suchen und auswählen, Ansicht wählen, In die Ansicht klicken, Text lesen, Als Bild speichern. Kreis um den Bereich, der Rest abgedunkelt, Karte mit «Zurück», «Weiter» und «Rundgang beenden». Beim ersten Besuch ohne Anker in der Adresse einmal angeboten, nie von selbst gestartet; jederzeit über den Knopf im Kopf. Je Schritt ein bis zwei Sätze; die Einzelheiten stehen in den Infoblasen.
6. Grössen: Grundschrift 16 px (Ziffer 5.3), Erklärtexte mindestens 14 px, Suchfeld 18 px. Klickflächen mindestens 36 px hoch, Knöpfe 40 px.
7. «Neu beginnen» hebt Suche, Thema, Textart und Reichweite auf, schliesst den Text und zeigt den Umfang des ganzen Pakets.
8. Unter 1280 px Fensterbreite steht der Text unter der Ansicht. Ist er nach dem Öffnen nicht im Bild, erscheint unten der Knopf «Geöffneter Text ↓»; er verschwindet, sobald der Text sichtbar ist, spätestens nach 9 Sekunden.
9. Die Hilfe beschreibt die Bedienung, nicht den Inhalt des Pakets. Sie nennt keine Bestimmung als Beispiel ausser den Suchwörtern im Platzhalter, die aus dem Themenkatalog stammen.

## 6. Neutralitätsregeln

1. Farbe bezeichnet nur die Vorlage (Stabilisierung, Elektrizität, Lebensmittelsicherheit, Gesundheit; Botschaft und Übriges neutral grau). Keine Ampelfarben (Rot, Grün), nicht die Pro- und Contra-Farben des Politspiegels (Türkis, Violett). Palette mit dem Farbsehschwäche-Prüfskript geprüft (Musteransicht: Orange, Blau, Gelb, Magenta in dieser Reihenfolge).
2. Grösse bezeichnet nur die Wortzahl, mit Einheit. Knoten im Graph sind gleich gross.
3. Reihenfolge nach BBl-Nummer und Gliederung, nie nach Grösse oder Anzahl Verknüpfungen. Ausnahme seit 2. Oktober 2026, zur Freigabe offen (Ziffer 13.6): Die Ergebnisliste eines Themas lässt sich auf Wahl des Lesers nach Anzahl Fundstellen ordnen, mit dem Satz, dass die Zahl nichts über Bedeutung oder Gewicht sagt.
4. Kanten nur aus Verweisen im Wortlaut, mit Kantenart und Fundstelle.
5. Titel eines Zettels ist die amtliche Artikel- oder Abschnittsüberschrift.
6. Suche ohne vorgeschlagene Begriffe aus Nutzerverhalten. Vorschläge kommen nur aus dem festen Themenkatalog (Ziffer 5.4.3), für jedes Stichwort gleich, ohne Einstieg nach Partei, Verband oder Haltung.
7. Automatisch extrahierte Angaben tragen die Marke «Rohextraktion», bis sie geprüft sind.
8. Fehler werden über ein sichtbares Korrekturprotokoll gemeldet und behoben, wie im Politspiegel.
9. Themen ordnen zu, gewichten nicht: Zugehörigkeit nur über Begriffe im Wortlaut, keine Zusammenfassung, keine Bewertung einer Stelle.

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
    eda_abgleich.py              EU-Gesetzgebungsakte der EDA-Übersicht abgleichen (Ziffer 9.5)
    ausrichten.py                Französisch und Italienisch an den deutschen Zetteln ausrichten (Etappe 5)
    pruefen.py                   Selbstprüfung (Ziffer 9)
    themen.py                    Themenkatalog prüfen, Fundstellen zählen (Ziffer 5.4)
    bauen.py                     site/ erzeugen
    vault.py                     Obsidian-Vault erzeugen
    publish.py                   bauen, committen, pushen
  daten/
    fedlex_stand.json            Stand der letzten Fedlex-Prüfung (vorhanden)
    parlament_stand.json         Stand der letzten Parlamentsprüfung (vorhanden)
    quellen.json, zettel.json, kanten.json
    themen.json                  Themenkatalog (Ziffer 5.4), von Hand gepflegt
    themen_treffer.json          Fundstellen je Thema und Zettel, erzeugt von themen.py
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
5. EU-Rechtsakte: jede erkannte Nummer löst auf EUR-Lex zu einer CELEX-Nummer auf; die 95 Gesetzgebungsakte der EDA-Übersicht sind alle enthalten (bis 2. Oktober 2026 stand hier 94; die Übersicht selbst zählt 95).
6. Stichprobe von Hand: 20 zufällige Kanten je Bau, Ergebnis im Korrekturprotokoll.

Bekannte Fehlerbilder der Rohextraktion vom 1. Oktober 2026:

1. Artikelköpfe in Anhängen werden als Artikel des Abkommens erkannt, zum Beispiel im Stromabkommen «Art. 9 (entspricht Artikel 13 des Protokolls (Nr. 7))».
2. Gesetzesnamen über einen Zeilenumbruch werden abgeschnitten oder doppelt erfasst.
3. Gesetze mit offenem Datum («vom …», Beihilfeüberwachungsgesetz) fehlen in der Gesetzesliste. Die Musteransicht zeigt 33 Zuordnungen statt 39.
4. Artikelverweise zwischen Dokumenten werden nicht erkannt.
5. Die Wörter der Botschaft sind seitenanteilig auf die Abschnitte verteilt, nicht abschnittsgenau.
6. EU-Rechtsakte sind als Nummer erfasst, nicht als CELEX-Nummer. Erkannt sind 466 Nummern, die EDA-Übersicht nennt 94 Gesetzgebungsakte. Die Differenz ist nicht aufgeschlüsselt.

Stand nach Etappe 2 (1. Oktober 2026):

1. Behoben: Artikel in Anhängen, Anlagen, Beilagen und Protokollen gehören zu ihrem Teil (`fga/2026/632/anh_i/anl/art_9`).
2. Behoben: Gesetzesnamen über Zeilenumbrüche vollständig, Gesetze mit gleicher SR-Nummer einmal gezählt.
3. Behoben: 3 neue und 36 geänderte Bundesgesetze, 46 Zuordnungen Bundesbeschluss–Gesetz. Das Lebensmittelgesetz ist eine Totalrevision und zählt als geändert, die Änderung des Beihilfeüberwachungsgesetzes in 631 als Zuordnung zum neuen BHÜG.
4. Behoben: Artikelverweise zwischen Dokumenten über Bezugswerk und Abkürzung («Artikel 14a FZA», «Art. 5 E-BHÜG», «des Abkommens» im Protokoll zu einem bestehenden Abkommen).
5. Behoben: jede Ziffer des Inhaltsverzeichnisses der Botschaft (alle Ebenen) ist ein Zettel mit abschnittsgenauer Wortzahl.
6. Behoben (2. Oktober 2026): 492 EU-Rechtsakte mit CELEX-Nummer, 490 auf EUR-Lex bestätigt, 2 Fehler der Vorlage. Alle 95 Gesetzgebungsakte der EDA-Übersicht sind im Paket genannt (`scripts/eda_abgleich.py`, `daten/eda_liste.json`, Teil von Prüfung 9.5).

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
3. Ansichten nach Ziffer 5: Übersichtsfeld, lokaler Graph, Schrift; `DESIGN_entscheide.md` anlegen; GitHub Pages einrichten, sobald es `site/` gibt. Ergänzung vom 2. Oktober 2026: Umfeld (Ziffer 5.2), Finden (Ziffer 5.4), Netz und Grafiken (Ziffer 5.5).
4. Vollpublikation übernehmen, sobald erschienen: XML statt PDF, Seitenzahlen im BBl als Fundstelle.
5. Französisch und Italienisch. Stand 2. Oktober 2026: Wortlaut mit Umschalter umgesetzt (Ziffer 1.16); Bedienung und Themenbegriffe offen.
6. Fassungsvergleich nach den Beschlüssen des Parlaments; Obsidian-Vault zum Herunterladen.
7. Kasten im Politspiegel, Testphase, Bekanntmachung. Stand 2. Oktober 2026: Kasten besteht, Testphase läuft (Seite an Testpersonen verschickt), Bekanntmachung offen.

## 13. Offene Entscheide

1. Name und Adresse: «Vertragsspiegel», Repository `vertragsspiegel`. Entschieden am 1. Oktober 2026.
2. Projektordner «Bilaterale III» bleibt Wurzel des Repositorys. Entschieden am 1. Oktober 2026.
3. Zeitpunkt für Französisch und Italienisch. Entschieden am 2. Oktober 2026: jetzt (Etappe 5).
4. Rohdaten (PDF, Text, je Sprache rund 25 MB) sind aus dem Repository ausgeschlossen (`.gitignore`), `laden.py` stellt sie wieder her. Entschieden am 1. Oktober 2026.
5. Social-Media-Beiträge zum Vertragsspiegel: ja oder nein.
6. Themenkatalog freigeben: Auswahl der 20 Themen, ihre Namen und Begriffe (`daten/themen.json`) sowie die wählbare Sortierung nach Anzahl Fundstellen (Ziffer 6.3). Freigegeben am 2. Oktober 2026.
