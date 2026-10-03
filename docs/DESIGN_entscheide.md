# Gestaltungsentscheide

Stand 1. Oktober 2026, Etappe 3. Ergänzt den Projektbrief, Ziffern 5 und 6. Jeder Eintrag: Entscheid, Grund, betroffene Ansicht.

## 1. Aufbau der Seite

1. **Quellen und Ausgabe getrennt.** Vorlagen in `seite/` (HTML, CSS, JavaScript), `scripts/bauen.py` schreibt `site/`. Grund: `site/` ist das, was GitHub Pages ausliefert, und enthält nur Erzeugtes.
2. **Daten in zwei Stufen.** `site/daten/index.json` (rund 1,3 MB, komprimiert ausgeliefert) enthält Gliederung, Wortzahlen und Kanten, aber keinen Wortlaut. Der Wortlaut liegt je Werk in `site/daten/text/`, die Botschaft je Kapitel (2.1 bis 2.15 einzeln). Grund: Der Wortlaut umfasst 6 MB, davon 3 MB Botschaft; wer einen Artikel öffnet, soll nicht das ganze Paket laden.
3. **Volltextsuche lädt nach.** Ab drei Zeichen werden alle Textdateien geladen; bis dahin sucht die Seite in den Titeln und sagt das. Grund: wie 1.2.
4. **Direkter Link auf jeden Zettel** über die Kennung als Anker, `#fga-2026-632-art_4` (Projektbrief Ziffer 10.4). Die Adresse folgt dem geöffneten Zettel. Seit 2. Oktober 2026 mit `&thema-<id>` und `&text-<art>` kombinierbar; ohne Zettelanker öffnet die Seite die Ergebnisliste.
5. **Fundstelle als PDF-Seite.** Solange das Paket nur als Verweis publiziert ist, hat es keine BBl-Seitenzahlen. Der Zettel verlinkt deshalb die Seite im amtlichen PDF (`…pdf#page=12`). Nach der Vollpublikation (Etappe 4) kommt die BBl-Seite dazu.
6. **Cache-Kennung aus dem Inhalt.** `?v=` an CSS, JavaScript und Daten ist ein Prüfwert über `index.json` und die Vorlagen. Grund: Die frühere Kennung aus Datum und Kantenzahl änderte sich nicht, wenn nur Themen oder Vorlagen geändert wurden.
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

1. **Finden im Bereich 1 mit der Suche**, vor der Wahl der Ansicht. Fassung vom 3. Oktober 2026 (Entscheid 4e.2); bis dahin als Leiste zwischen Reitern und Ansicht. Grund: Suchwort, Thema und Textart sind derselbe Schritt «auswählen» und wirken auf alle Ansichten.
2. **Thema als Auswahlliste** mit Anzahl Zettel, nicht als 20 Knöpfe. Grund: Platz; die geführte Auswahl zeigt die Themen als Karten.
3. **Geführte Auswahl als modaler Dialog** mit drei Schritten; ein Klick auf eine Antwort führt weiter, «Zurück» zum vorigen Schritt. Die Antworten zu Schritt 2 nennen die Textart als Frage («Was mit der EU vereinbart ist») und mit Typen und Anzahl.
4. **Schnittmenge**: Thema, Textart, Reichweite und Suchwort schränken gemeinsam ein. Jede Einschränkung steht als Knopf mit × im Stand der Auswahl.
5. **Markierung je Ansicht**: Umfang blass ausserhalb, schwarzer Streifen am rechten Rand mit dem Anteil markierter Wörter je Feld und «x % markiert» in der Unterzeile; Bezüge mit markiertem Ende mittelkräftig, übrige fast ausgeblendet; Matrix zählt nur Bezüge aus markierten Zetteln; Umsetzung blasst Dokumente und Bundesbeschlüsse ohne markierten Zettel ab; Tabelle mit Spalte «Markiert».
6. **Ergebnisliste im Zettelbereich**, nach Textart gruppiert, Voreinstellung Paketreihenfolge (Projektbrief Ziffer 6.3). Sortierung nach Fundstellen auf Wahl, mit Balken in der Vorlagefarbe.
7. **Themenvorschlag in der Suche** über den Treffern, mit «Thema»-Marke. Wählt man ihn, wird das Suchwort geleert, damit die Schnittmenge nicht leer bleibt, und die Liste nennt das gesuchte Wort.
8. **Themenbegriffe nicht anklickbar.** Sie zeigen Anzahl Fundstellen im Paket; eine Einschränkung auf einen Begriff braucht den ganzen Wortlaut im Browser und ist zurückgestellt.

## 4b. Grafiken (Ziffer 5.5)

1. **Eigene Zeichnung je Format statt Abbild der Seite.** Die Ansichten der Seite sind auf die Bildschirmbreite ausgelegt; ein Abbild wäre in 4:5 unlesbar (Bogendiagramm breit und flach, Beschriftungen 13 px). Jedes Motiv wird deshalb im Canvas neu angeordnet; Daten, Zählungen und Layout-Rechnungen (Partition, Sankey, Netzlage, Umfeld, Reichweite) kommen aus `app.js` über `window.VS`.
2. **Schriften und Rahmen wie im Finanzspiegel**: Archivo für Marke und Titel, Public Sans für Text; Marke «PAKET SCHWEIZ–EU (BILATERALE III)» und «VERTRAGSSPIEGEL», Fuss «Politspiegel · Vertragsspiegel» mit Quelle, Adresse und Stand. Mass 1 = 1080 Pixel der kürzeren Seite.
3. **Feste Zeile «Gezeigt».** Ein eigener Titel ist erlaubt, weil Medien eigene Überschriften setzen. Die Zeile darunter beschreibt, was die Grafik zeigt, und lässt sich nicht ändern; eine wertende Überschrift steht so nie allein unter der Marke.
4. **Auswahl in der Grafik benannt** («Markiert: Thema … : 164 Zettel»), weil eine markierte Grafik ohne diese Angabe eine Gewichtung nahelegt.
5. **Seitlicher Kopf im Querformat** für Netz und Matrix: Titel und Erläuterung links, die Grafik erhält die ganze Höhe. Grund: Ein Kreis oder eine 33 × 33-Matrix unter einem Kopf von 400 Pixeln wäre in 16:9 zu klein.
6. **Umfeld im Querformat** links eingehend, rechts ausgehend, Reichweite unter dem Text. Reicht der Platz nicht, werden die Karten bis auf 70 % verkleinert, danach mit «+ n weitere» abgeschlossen.
7. **Bezüge in allen Formaten waagrecht**, auch in 4:5: oben die Verweise im selben Dokument, unten die Bezüge zwischen Dokumenten, wie auf der Seite. Die senkrechte Fassung vom 2. Oktober 2026 liess im Hochformat die halbe Fläche leer und war schwer lesbar (Rückmeldung Michael vom selben Tag). Im Hochformat erhalten die Bögen im selben Dokument 24 % der Höhe, die Bögen zwischen Dokumenten den Rest (im Querformat 30 %).
8. **Wortlautkarte ohne Kürzung**: Schrift von 34 bis 15 Pixel, die grösste, bei der alles passt; sonst ein Hinweis statt Text. Auszug nur als ganzer Absatz.
9. **Dateiname** aus Motiv, Stufe oder Zettel, «auswahl» bei aktiver Auswahl und Format, zum Beispiel `vertragsspiegel-netz-dokumente-verweise-folie.png`.

## 4c. Netz der Vorlagen, Dokumente und Artikel (Ziffer 5.5.3)

1. **Kreis in Paketreihenfolge** statt Kräftemodell. Ein Kräftemodell rückt stark verbundene Knoten zusammen und ordnet bei jedem Laden anders; beides läse man als Aussage.
2. **Kreisfläche = Wörter** (Ziffer 6.2), Linienbreite = Wurzel der Anzahl, damit wenige grosse Werte (Botschaft) die kleinen nicht verdecken.
3. **Stufe «Vorlagen»:** Bezüge zwischen Dokumenten derselben Gruppe als «intern» beim Knoten. Beim Mass «gemeinsame EU-Rechtsakte» zählt die Zahl der verschiedenen Rechtsakte, nicht die Summe der Dokumentpaare.
4. **Stufe «Ein Dokument»:** nur Artikel mit einem Verweis innerhalb des Dokuments; Klick auf ein Dokument im Netz der Dokumente führt dorthin.

## 4d. Sprache des Wortlauts (Etappe 5)

1. **Umschalter DE, FR, IT** als Schalter wie «Textart», seit 3. Oktober 2026 im Kopf der Seite mit der Bezeichnung «Sprache der Texte» (Entscheid 4e.9), bis dahin in der Leiste neben der Suche. Grund: Er wirkt auf alle Ansichten wie die Suche, gehört also nicht in den Zettel.
2. **Was wechselt:** Wortlaut und Fussnoten, Bezeichnungen in Gliederung, Umfeld, Listen und Grafiken, Wörter (also die Grössen im Umfang), Seiten, PDF-Link und Amtsblatt («FF 2026 632»). Kennzahlen Seiten und Wörter zählen die gewählte Sprache.
3. **Was bleibt:** Kennungen, Gliederung, Verknüpfungen und ihre Fundstellen, Themenzuordnung, Bedienung und Erklärtexte (deutsch). Der Zettel sagt in einem Satz, dass Gliederung und Verknüpfungen aus der deutschen Fassung stammen.
4. **Anker** `&fr`, `&it` am Zettelanker (`#fga-2026-632-art_4&fr`), sonst die zuletzt gewählte Sprache aus dem Browser. Ein Anker ohne Sprache behält die gewählte, damit interne Links nicht zurückschalten.
5. **Themen in FR und IT:** Zettel markiert, Wörter nicht, weil die Begriffe deutsch sind.
6. **Zettel ohne eigene Stelle** (in der Vorlage fehlt die Überschrift): leerer Wortlaut mit Hinweis, der Text steht im vorangehenden Zettel. Grund: lieber eine sichtbare Lücke als eine falsche Grenze.
7. `lang`-Attribut am Wortlaut, damit Silbentrennung und Vorleseprogramme die Sprache kennen.

## 4e. Hilfe für Laien (Ziffer 5.6)

Fassung vom 3. Oktober 2026, nach der Rückmeldung von Testpersonen, die Seite sei unübersichtlich (Projektbrief Ziffer 1.17).

1. **Grundlagen:**
   1. Nielsen Norman Group, «Onboarding Tutorials vs. Contextual Help»: Anleitungen vor der Nutzung werden übersprungen und rasch vergessen und verbessern die Leistung nicht. Hilfe im Kontext, die der Nutzer selbst aufruft, die sich leicht schliessen und später wiederfinden lässt, wirkt.
   2. Nielsen Norman Group, «Usability for Senior Citizens»: Hauptprobleme älterer Nutzer sind kleine Schrift, kleine Klickflächen und unklare Bezeichnungen.
   3. Nielsen Norman Group, «Instructional Overlays and Coach Marks for Mobile Apps»: Einblendungen kurz halten, eine Handlung je Hinweis; viele Hinweise hintereinander werden schneller weggeklickt.
   4. WCAG 2.2: Kriterium 1.4.13 (Inhalt bei Hover oder Fokus schliessbar, überfahrbar, beständig) und 2.5.8 (Zielgrösse mindestens 24 × 24 px).
2. **Gliederung vor Erklärung.** Drei nummerierte Bereiche in Leserichtung; die Nummern stehen auch in der Startseite, den Infoblasen und dem Rundgang. Grund: Eine unübersichtliche Seite wird durch Erklärungen allein nicht übersichtlich.
3. **Fragen unter den Reitern.** «Umfang», «Verknüpfungen» und «Bezüge» bezeichnen die Darstellung; die Frage darunter sagt, wozu die Ansicht dient.
4. **Kontrast statt Farbe.** Farbe bezeichnet nur die Vorlage (Abschnitt 8.1); eine farbige Hervorhebung von Suche und Knöpfen läse man als Gruppe oder Wertung. Hervorgehoben wird mit dunklen Flächen, Rahmen, Nummern und Symbolen. Das wirkt hell, dunkel und bei Farbsehschwäche gleich.
5. **Infoblasen auch ohne Maus.** Darüberfahren allein schliesst Tablet, Handy und Tastatur aus; derselbe Knopf öffnet deshalb auch per Klick, Antippen und Fokus. Öffnen nach 0,22 s, Schliessen nach 0,35 s, damit die Maus vom Knopf in die Blase wechseln kann. Per Klick geöffnet, bleibt die Blase offen, bis sie geschlossen wird. Mit der Tastatur geöffnet, erhält sie den Fokus; Esc gibt ihn an den Knopf zurück.
6. **Rundgang freiwillig und kurz.** Fünf Schritte mit je ein bis zwei Sätzen, die Einzelheiten in den Infoblasen; einmal angeboten, nie erzwungen. «Nein, danke» und ein beendeter Rundgang bleiben im Browser gespeichert (`vs-rundgang`). Bei einer Adresse mit Anker erscheint das Angebot nicht, weil der Leser dann einen bestimmten Text sucht. Der Kreis ist ein Rahmen mit Schatten über der ganzen Fläche; die Seite bleibt darunter unverändert.
7. **Ohne Popover-API und ohne Bibliothek.** Die Popover-API ist erst seit April 2024 in allen gängigen Browsern verfügbar und fehlt auf älteren Geräten. Blase und Rundgang sind eigene Elemente mit fester Lage in `seite/hilfe.js`, rund 170 Zeilen.
8. **Grössen nach WCAG mit Reserve:** Klickflächen mindestens 36 px statt der verlangten 24 px, Knöpfe 40 px, Suchfeld 52 px hoch mit 18 px Schrift; Erklärtexte 14 bis 15 px. Ausgenommen sind Links im Fliesstext (WCAG 2.5.8, Ausnahme «inline»).
9. **Sprache der Texte im Kopf** mit sichtbarer Bezeichnung. Die Leiste über den Ansichten entfällt; der Umschalter wirkt auf alle Ansichten (Entscheid 4d.1) und steht deshalb im Kopf, wo auch amtliche Seiten die Sprachwahl führen.
10. **Einheitlich «Als Bild speichern»** an allen Grafikknöpfen, mit Bildsymbol («Wortlaut als Bild speichern», «Umfeld als Bild speichern», «Liste als Bild speichern»). «Grafik» sagt nicht, was geschieht; «speichern» nennt die Handlung.
11. **Kopf der Zettelspalte:** «3 Text lesen» bleibt ab 1280 px mit der Spalte stehen. Zwischen 1280 und 1719 px Fensterbreite hält er 64 px Abstand zum Testphase-Band, das sonst den Knopf «i» verdeckt.
12. **«Geöffneter Text ↓»** nur unter 1280 px und erst nach einer Handlung des Lesers (Klick, Antippen, Taste), nicht beim Laden über einen Link. Grund: Der Knopf antwortet auf einen Klick, nach dem sich scheinbar nichts ändert, weil der Text ausserhalb des Bilds aufgeht.

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
