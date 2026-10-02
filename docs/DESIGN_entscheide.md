# Gestaltungsentscheide

Stand 1. Oktober 2026, Etappe 3. Ergänzt den Projektbrief, Ziffern 5 und 6. Jeder Eintrag: Entscheid, Grund, betroffene Ansicht.

## 1. Aufbau der Seite

1. **Quellen und Ausgabe getrennt.** Vorlagen in `seite/` (HTML, CSS, JavaScript), `scripts/bauen.py` schreibt `site/`. Grund: `site/` ist das, was GitHub Pages ausliefert, und enthält nur Erzeugtes.
2. **Daten in zwei Stufen.** `site/daten/index.json` (rund 1,3 MB, komprimiert ausgeliefert) enthält Gliederung, Wortzahlen und Kanten, aber keinen Wortlaut. Der Wortlaut liegt je Werk in `site/daten/text/`, die Botschaft je Kapitel (2.1 bis 2.15 einzeln). Grund: Der Wortlaut umfasst 6 MB, davon 3 MB Botschaft; wer einen Artikel öffnet, soll nicht das ganze Paket laden.
3. **Volltextsuche lädt nach.** Ab drei Zeichen werden alle Textdateien geladen; bis dahin sucht die Seite in den Titeln und sagt das. Grund: wie 1.2.
4. **Direkter Link auf jeden Zettel** über die Kennung als Anker, `#fga-2026-632-art_4` (Projektbrief Ziffer 10.4). Die Adresse folgt dem geöffneten Zettel. Seit 2. Oktober 2026 mit `&thema-<id>` und `&text-<art>` kombinierbar; ohne Zettelanker öffnet die Seite die Ergebnisliste.
6. **Cache-Kennung aus dem Inhalt.** `?v=` an CSS, JavaScript und Daten ist ein Prüfwert über `index.json` und die Vorlagen. Grund: Die frühere Kennung aus Datum und Kantenzahl änderte sich nicht, wenn nur Themen oder Vorlagen geändert wurden.
5. **Fundstelle als PDF-Seite.** Solange das Paket nur als Verweis publiziert ist, hat es keine BBl-Seitenzahlen. Der Zettel verlinkt deshalb die Seite im amtlichen PDF (`…pdf#page=12`). Nach der Vollpublikation (Etappe 4) kommt die BBl-Seite dazu.
7. **Start ohne geöffneten Text.** Ohne Anker in der Adresse zeigt die Zettelspalte nur, wie man einen Text öffnet; der Umfang zeigt das ganze Paket. Grund: Bis 2. Oktober 2026 öffnete die Seite den Artikel des Stromabkommens mit den meisten Verknüpfungen (Art. 32, Auslegungs- und Anwendungsschwierigkeiten). Jeder vorausgewählte Artikel stellt eine Bestimmung vor alle anderen und widerspricht damit der Wertungsfreiheit (Projektbrief Ziffer 6).

## 2. Umfang (Icicle) mit Übersichtsfeld (Ziffer 5.1)

1. **Übersichtsfeld links neben dem Icicle**, gleich hoch, mit vier festen Spalten: Vorlage, Dokument, erste Gliederungsebene, alle Zettel. Grund: Die Gliederung ist bis zu zehn Ebenen tief (Botschaft 2.3.8.1.1, Erläuterung zu Art. 21b); eine Spalte je Ebene wäre im schmalen Feld nicht lesbar.
2. **Rahmen mindestens 8 Pixel hoch.** Ein einzelnes Kapitel ist im ganzen Paket oft kleiner als ein Pixel; der Rahmen bleibt sichtbar und zentriert sich auf den Ausschnitt.
3. **Marken:** geöffneter Zettel als Linie mit Pfeil über die ganze Breite, Suchtreffer als helle Striche in der Zettelspalte.
4. **Klick ins Übersichtsfeld** springt zum Teil in der angeklickten Spalte; ein Zettel springt zu seinem übergeordneten Teil.
5. **Hauptansicht: Ausschnitt plus drei Ebenen.** Beim Öffnen eines Zettels von aussen (Suche, Graph, Link) wählt die Seite den Ausschnitt so, dass der Zettel in der letzten Spalte steht.
6. **Gliederung aus dem Pfad der Zettel.** Ein Zettel, der den Kopf einer Gruppe bildet («Art. 1 Änderungen des Abkommens» zur Gruppe «Art. 1» mit den Ziffern), wird deren erstes Kind. So stehen Einleitung und Unterteile beieinander.

## 3. Zettel

1. **Wortlaut ungekürzt**, 16 px, Zeilenhöhe 1,6, Absätze wie im Text, Fussnoten darunter mit ihrer Nummer aus dem Werk.
2. **Zettelspalte 480 px ab 1280 px Fensterbreite**, darunter unter der Ansicht (Ziffer 5.3).
3. **Suchbegriff und Begriffe des Themas markiert** im Wortlaut und in den Fussnoten, das Suchwort gelb, Themenbegriffe grau unterstrichen; «Stelle 1 von n» mit ‹ › springt von Fundstelle zu Fundstelle. Die Fundstellen werden am Rohtext bestimmt und erst danach maskiert, damit keine Markierung in ein HTML-Tag fällt.

## 4. Umfeld eines Zettels (Ziffer 5.2)

Fassung vom 2. Oktober 2026, nach der Rückmeldung, der Graph sei für Laien nicht verständlich genug.

1. **Gliederung als Voreinstellung, Netz wählbar.** Der radiale Graph zeigt die Vernetzung auf einen Blick, kürzt aber die Beschriftungen und erklärt die Bedeutung der Sektoren nur in der Legende. Die Gliederung stellt die Bezüge als Fragen und Gruppen dar und zeigt volle Titel. Beide bleiben, weil sie Verschiedenes leisten; die Wahl wird im Browser gespeichert.
2. **Oben eingehend, unten ausgehend.** «Was verweist auf diesen Text?» über dem Text, «Worauf verweist dieser Text?» darunter. Grund: Die Leserichtung entspricht der Pfeilrichtung; der Text steht als farbige Karte in der Mitte.
3. **Stamm statt Linie je Karte.** Eine Linie links verbindet die Gruppen mit dem Text, je Gruppe ein Abzweig mit Pfeil. Grund: Linien von jeder Karte zum Text kreuzen bei umbrechenden Karten andere Karten. Die Linien zeichnet ein SVG über dem HTML, gemessen nach dem Umbruch, neu bei jeder Grössenänderung (ResizeObserver).
4. **Gestrichelt für Erläuterung und Genehmigung**, durchgezogen für Verweise und Nennungen, wie im Netz.
5. **Karten statt Knoten:** voller Titel auf höchstens zwei Zeilen, Vorlagefarbe als linker Rand und helle Fläche (Ziffer 8.1). EU-Rechtsakte und SR-Erlasse ohne Vorlagefarbe, grau umrandet, mit Raute und Dreieck wie im Netz. Gleiche Ziele zusammengefasst mit «×n»; die frühere Liste hatte Art. 28 sechsmal.
6. **Ganzes Dokument:** Genehmigung durch einen Bundesbeschluss und Erläuterung eines Botschaftskapitels gelten dem Dokument, nicht dem Artikel. Die Karte sagt das («erläutert das ganze Dokument Stromabkommen»).
7. **Höchstens acht Karten je Gruppe**, Rest auf Klick. Reihenfolge nach Paket.
8. **Reichweite** über Artikelverweise und Erläuterungen, ohne gleiche EU-Rechtsakte. Grund: Ein Rechtsakt wie die Unionsbürgerrichtlinie verbindet sonst über einen Schritt Hunderte Zettel, ohne dass ein Text auf den anderen verweist.
9. **Liste aller Verknüpfungen** zusammengeklappt unter dem Umfeld, eine Zeile je Art, Richtung und Ziel, mit Anzahl und bis zu vier Fundstellen.

Netz (Fassung Etappe 3, unverändert):

1. **Feste Sektoren:** oben Dokumente und Zettel anderer Dokumente, rechts Zettel im selben Dokument, unten EU-Rechtsakte, links SR-Erlasse. Der Brief nennt «Dokument oben»; Zettel aus anderen Dokumenten (Verweise zwischen Dokumenten, Erläuterungen der Botschaft) gehören zu ihrem Dokument und stehen deshalb ebenfalls oben, mit dem Dokumentkürzel im Namen.
2. **Zweiter Schritt** im äusseren Ring: je EU-Rechtsakt bis zwei andere Dokumente, die ihn nennen (ohne Botschaft), und zum Dokument der genehmigende Bundesbeschluss und das Botschaftskapitel (höchstens drei).
3. **Höchstens neun Knoten je Sektor.** Der Rest wird in der Sektorüberschrift gezählt («+6») und steht in der Liste unter dem Graph.
4. **Beschriftung ohne Überlappung:** Jede Beschriftung wird gekürzt, bis sie frei ist; findet sie keinen Platz, entfällt sie und erscheint beim Überfahren. Oben und unten liegen die Knoten abwechselnd auf zwei Radien, weil dort die Beschriftungen waagrecht nebeneinander stehen.
5. **Filter je Kantenart** (verweist auf, nennt, genehmigt, erläutert, Teil von); die Wahl bleibt im Browser gespeichert.
6. **Überfahren** hebt den Weg zum Mittelpunkt hervor und blendet den Rest ab.
7. **Liste unter dem Graph** mit allen Verknüpfungen, Kantenart, Ziel und Fundstelle; die Regel steht im Titel der Kantenart. Sie ersetzt die Chips der Musteransicht. Seit 2. Oktober 2026 für Gliederung und Netz gemeinsam (Punkt 9 oben).
8. **Knoten gleich gross**, Form nach Art (Kreis Zettel, Quadrat Dokument, Raute EU-Rechtsakt, Dreieck SR-Erlass), Farbe nach Vorlage (Ziffer 6.2).

## 4a. Finden (Ziffer 5.4)

1. **Leiste «Finden» unter den Reitern**, nicht im Kopf. Grund: Die Auswahl wirkt auf alle Ansichten und gehört deshalb zwischen Reiter und Ansicht.
2. **Thema als Auswahlliste** mit Anzahl Zettel, nicht als 20 Knöpfe. Grund: Platz; die geführte Auswahl zeigt die Themen als Karten.
3. **Geführte Auswahl als modaler Dialog** mit drei Schritten; ein Klick auf eine Antwort führt weiter, «Zurück» zum vorigen Schritt. Die Antworten zu Schritt 2 nennen die Textart als Frage («Was mit der EU vereinbart ist») und mit Typen und Anzahl.
4. **Schnittmenge**: Thema, Textart, Reichweite und Suchwort schränken gemeinsam ein. Jede Einschränkung steht als Knopf mit × im Stand der Auswahl.
5. **Markierung je Ansicht**: Umfang blass ausserhalb, schwarzer Streifen am rechten Rand mit dem Anteil markierter Wörter je Feld und «x % markiert» in der Unterzeile; Bezüge mit markiertem Ende mittelkräftig, übrige fast ausgeblendet; Matrix zählt nur Bezüge aus markierten Zetteln; Umsetzung blasst Dokumente und Bundesbeschlüsse ohne markierten Zettel ab; Tabelle mit Spalte «Markiert».
6. **Ergebnisliste im Zettelbereich**, nach Textart gruppiert, Voreinstellung Paketreihenfolge (Projektbrief Ziffer 6.3). Sortierung nach Fundstellen auf Wahl, mit Balken in der Vorlagefarbe.
7. **Themenvorschlag in der Suche** über den Treffern, mit «Thema»-Marke. Wählt man ihn, wird das Suchwort geleert, damit die Schnittmenge nicht leer bleibt, und die Liste nennt das gesuchte Wort.
8. **Themenbegriffe nicht anklickbar.** Sie zeigen Anzahl Fundstellen im Paket; eine Einschränkung auf einen Begriff braucht den ganzen Wortlaut im Browser und ist zurückgestellt.

## 5. Verknüpfungen (Matrix)

1. **Neues Mass «Artikelverweise»** als Voreinstellung; Zeile → Spalte, Klick listet die Verweise mit Fundstelle.
2. **Feste, logarithmisch gestufte Klassen** (1, 2–4, 5–14, 15–49, ab 50) statt linearer Skala. Grund: Die Botschaft verweist fast 500-mal auf einen einzigen Bundesbeschluss; linear wären alle anderen Zellen unsichtbar.
3. Alle 33 Werke, auch das Begleitgeschäft, nach BBl-Nummer.

## 6. Bezüge (Bogendiagramm)

1. Fünf Bogenarten: Verweis im selben Dokument (oben), Verweis zwischen Dokumenten, Botschaft erläutert, Bundesbeschluss genehmigt, gleicher EU-Rechtsakt (unten).
2. **Gleicher EU-Rechtsakt** als Werkpaar: ein Bogen je Paar von Dokumenten, die denselben Rechtsakt nennen, zwischen den jeweils ersten Nennungen, ohne Botschaft (87 Bögen). Grund: Je Zettelpaar wären es mehrere tausend Bögen, die nichts mehr zeigen.
3. Bogenfarbe: Vorlage, wenn beide Enden zur gleichen Vorlage gehören oder ein Ende Botschaft oder Begleitgeschäft ist; sonst neutral grau.

## 7. Umsetzung (Sankey)

1. Gesetze mit Kurztitel, sonst mit dem Titel ohne Datum («BG über die Meldepflicht …»); Zusatz «(neu)» oder «(Totalrevision)».
2. Ein Gesetz, das mehrere Bundesbeschlüsse ändern (Parlamentsgesetz, RVOG), hat mehrere Linien.

## 8. Farbe, Schrift, Neutralität (Ziffer 6)

1. Farben der Musteransicht übernommen: Stabilisierung Orange, Elektrizität Blau, Lebensmittelsicherheit Gelb, Gesundheit Magenta; Botschaft, weitere Beschlüsse und Begleitgeschäft in drei Grautönen. Kein Rot und kein Grün, nicht die Pro- und Contra-Farben des Politspiegels. Das Rot des Testphase-Bands ist das des Politspiegels und bezeichnet keine Daten.
2. Grundschrift 16 px, Beschriftungen in Grafiken mindestens 13 px, im Netz 12,5 px, Karten im Umfeld 14 px.
3. Hell und dunkel nach Systemeinstellung, Tokens wie im Politspiegel.
4. «Rohextraktion» an Graph, Matrix, Bezügen, Umsetzung und Gesetzesliste, bis die Kanten von Hand geprüft sind.

## 9. Politspiegel

1. Heimlink, Testphase-Band, Fehlermeldung (Web3Forms, hCaptcha) und Impressum wie im Politspiegel; die Meldung geht an dieselbe Adresse und trägt «Vertragsspiegel» im Betreff, das Feld «Wo genau?» ist mit dem geöffneten Zettel vorbelegt.
2. **Datenschutzsatz angepasst:** Die Seite lädt Schriften von Google Fonts und D3 von cdnjs und jsDelivr; der Satz nennt das, statt «diese Seiten senden nichts» zu übernehmen.
3. `site/kennzahlen.json` für den Kasten auf der Übersicht des Politspiegels (Ziffer 10.1, Etappe 7).
