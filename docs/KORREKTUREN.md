# Korrekturprotokoll

Projektbrief Ziffer 6.8 und 9.6. Hier stehen Fehler in den amtlichen Vorlagen, Grenzen der automatischen Extraktion und die Ergebnisse der Stichproben von Hand. Die Vorlagen werden nicht korrigiert: Der Vertragsspiegel zeigt den Wortlaut, wie er publiziert ist, und weist die Stelle hier aus.

Fundstellen: Werk (BBl-Nummer), Seite im PDF des Volltext-Anhangs, Zettelkennung.

## 1. Fehler in den Vorlagen

Stand 1. Oktober 2026, Fassung «by-reference» vom 18. März 2026.

| Nr. | Werk | Seite | Zettel | Befund | Behandlung |
|---|---|---|---|---|---|
| 1 | 631 BB Elektrizität | 18–19 | `fga/2026/631/anh/…` | Fussnoten springen von 34 auf 37; die Nummer 37 steht dreimal, 35 und 36 fehlen. | Fussnoten werden in der Reihenfolge der Vorlage übernommen und als «Fussnote 37 nach 34» gemeldet. |
| 2 | 638 Protokoll Parl. Zusammenarbeit | 1 | `fga/2026/638/art_1` | Artikelkopf «1. Art. 1» mit überzähliger Listennummer. | Als Art. 1 gelesen. |
| 3 | 632 Stromabkommen | 38 | `fga/2026/632/anh_i/ra_32024l01366` | Anhang I, Rechtsakt (15): CELEX-Nummer «32024 L 01366». Der Titel nennt die Delegierte Verordnung (EU) 2024/1366; deren CELEX-Nummer ist 32024R1366. | Zettel behält die Nummer der Vorlage; die Kante «nennt» aus dem Titel zeigt auf 32024R1366. |
| 4 | 615 Botschaft | 972 | `fga/2026/615/ziff_2.13.6.1.4` | «Verordnung (EU) 2022/3271». Eine solche Verordnung gibt es auf EUR-Lex nicht; gemeint ist nach dem Zusammenhang (schwerwiegende grenzüberschreitende Gesundheitsgefahren) die Verordnung (EU) 2022/2371. | Kante «nennt» auf die Nummer der Vorlage, auf EUR-Lex nicht gefunden, in `pruefen.py` als Vorlagefehler ausgewiesen. |
| 5 | 625 IP-LuftVA | 4 | `fga/2026/625/art_4` | Sachüberschrift «Teilnahme and er Ausarbeitung von Rechtsakten der Union» statt «an der». | Wortlaut unverändert. |
| 6 | 615 Botschaft | 518–519 | `fga/2026/615/ziff_2.5.7.1.1/art_40aquater` | Die Botschaft erläutert einen «Art. 40aquater» des Eisenbahngesetzes. Der Entwurf (616 Anhang 6 Ziff. 6) enthält keinen solchen Artikel; der erläuterte Inhalt (die RailCom informiert das BAV über Antrag und Entscheid) steht dort als letzter Satz von Art. 40ater Abs. 2bis. | Keine Kante «erläutert»; einzige Erläuterung ohne Ziel in `daten/kanten.json` unter `offen`. |

## 2. Grenzen der Extraktion

1. Fussnotenzeichen, die im Text nicht gefunden werden: Botschaft Fussnoten 60, 65, 262, 602, 603, 606, 612, 613, 732, 936 (meist in Grafiken oder Tabellen), 633 Fussnote 72, 2100 Fussnote 3 («Art. 197 Ziff. 17³» ist von der Ziffer 173 nicht zu unterscheiden). Die Fussnote kommt zum letzten Zettel der Seite.
2. Artikelverweise ohne Bezugswerk werden nur innerhalb desselben Teils aufgelöst. Verweise auf Erlasse ausserhalb des Pakets (BV, OR, EU-Rechtsakte, nicht geänderte Artikel der Grundabkommen) bleiben ohne Kante; ihre Zahl steht in `daten/kanten.json` unter `offen`.
3. In der Botschaft werden Verweise mit Bezugswerk aufgelöst («Art. 5 E-BHÜG», «Artikel 14a FZA»). Seit 2. Oktober 2026 auch Verweise ohne Zusatz in einer Ziffer, die ein bestimmtes Werk erläutert (Erläuterungen zu einzelnen Artikeln eines Gesetzes oder Abkommens): Sie gelten als Verweis auf dieses Werk, aber nur, wenn der Satz kein anderes Werk nennt (Gesetz, Verordnung, Richtlinie, Abkommen, Protokoll, Anhang, eine Abkürzung wie BV oder VwVG) und vor dem Verweis weder EU-Recht noch bisheriges Recht («dem bisherigen Artikel 3») steht. Regel «Botschaft ohne Zusatz: Bezugswerk der Ziffer», 418 Kanten. Rund 1800 Verweise bleiben ohne Kante, vor allem im allgemeinen Teil, in Ziffern über mehrere Werke und in Sätzen über EU-Recht.
4. Erläuterungen der Botschaft zu einzelnen Artikeln: 516 von 517 einem Artikel zugeordnet (bis 2. Oktober 2026: 496). Offen ist nur «Art. 40aquater» EBG, ein Fehler der Vorlage (Abschnitt 1, Nr. 6).
5. Tabellen (Anhang III FZA, Anhänge MRA) verlieren beim Textauszug ihre Spalten. Der Wortlaut ist vollständig, die Anordnung nicht.
6. Trennstrich am Seitenende (gefunden am 2. Oktober 2026): Ein am Seitenende getrenntes Wort stand in `daten/zettel.json` in zwei Absätzen («Abkom-» und «mens»), 797 Fälle. Behoben am 2. Oktober 2026 in `paket.py` (`fliesstext`): Endet ein Absatz vor einer Leerzeile mit Trennstrich und beginnt der nächste klein, werden die Teile verbunden. Gesamtwortzahl 648 727 → 647 928, Prüfung 9.1 für alle 33 Werke bestanden, Stichprobe 30 von 30 verbundenen Wörtern richtig. Übrig sind 4 Stellen: zwei in Tabellen der Botschaft und zwei vor einem Bindewort («Geschäfts- und Fabrikationsgeheimnis»), die so stehen bleiben. `themen.py` neu gezählt.
7. EU-Rechtsakte: `daten/kanten.json` führt 492 Rechtsakte. Seit 2. Oktober 2026 hat jeder eine Kante «nennt»: Rechtsakt-Einträge in den Anhängen, deren Titel keine Nummer zitiert («Beschluss Nr. H14 der Verwaltungskommission …»), zeigen auf die CELEX-Nummer des Eintrags, wenn EUR-Lex sie kennt (Regel «EU-Rechtsakt, CELEX-Nummer des Eintrags», 4 Kanten). Ausnahme ist 32024L01366, ein Fehler der Vorlage (Abschnitt 1, Nr. 3).
8. «Beschluss Nr. 2/2019 des Landverkehrsausschusses Gemeinschaft/Schweiz» (621, Gemeinsame Erklärung) wurde bis 2. Oktober 2026 als EU-Beschluss 32019D0002 gelesen; EUR-Lex lieferte dazu einen fremden Beschluss der EZB. Beschlüsse von Ausschüssen («…ausschusses») zählen nicht mehr als EU-Rechtsakt. Daraus folgt: Ein Treffer auf EUR-Lex bestätigt nur, dass die Nummer besteht, nicht dass sie gemeint ist.
9. EDA-Übersicht der EU-Gesetzgebungsakte (13. März 2026): 95 Einträge in 7 Verhandlungsgruppen, alle 95 im Paket genannt. Abgleich mit `scripts/eda_abgleich.py`, Ergebnis in `daten/eda_liste.json`, Teil von Prüfung 9.5. Der Projektbrief nannte 94; die Übersicht selbst zählt 95.

## 3. Stichproben

### 1. Oktober 2026, Etappe 2

Regel nach Ziffer 9.6: 20 zufällige Kanten je Bau, ohne Gliederungskanten («teil_von»), Zufallsquelle ist das Datum des Baus.

1. Stichprobe `pruefen.py`: 20 Kanten (13 «nennt», 4 «erläutert», 3 «verweist auf»). Alle 20 am Wortlaut geprüft und richtig.
2. Vorgängig vier Stichproben zu je 30 Kanten «verweist auf» während der Entwicklung, richtig waren 24, 27, 28 und 30. Gefundene Fehlerarten und Regel, die sie behebt:
   1. Verweise in Rechtsakt-Einträgen der Anhänge («Artikel 27 Absätze 1 bis 5») meinen den EU-Rechtsakt, nicht das Abkommen: Verweise ohne Zusatz in Anhangstexten werden nicht aufgelöst.
   2. «Artikel 15 des Abkommens» in einem Institutionellen oder Beihilfe-Protokoll meint das Grundabkommen: Auflösung über die im Änderungsprotokoll zitierten Artikel, sonst keine Kante.
   3. «Artikel 2 dieses Abkommens» im zitierten Text eines Änderungsprotokolls meint das geänderte Abkommen: Auflösung nur unter den zitierten Artikeln.
   4. Zusatz am Ende einer Aufzählung («Artikel 1 bis 6, der Artikel 10 bis 15 … des Protokolls (Nr. 7)») gilt für alle Glieder.
   5. Einleitender Satz vor einer Liste («Die … aufgehobenen Bestimmungen des Abkommens sind nachstehend aufgeführt:») bestimmt den Bezug der Liste.
   6. Abkürzung nach einer Artikelliste («… 64 und 180 LwG»): fremder Erlass, keine Kante.
   7. «Artikel 1 des Anhangs» meint den Anhang.

### 2. Oktober 2026, Nachführung Etappe 2

1. Stichprobe `pruefen.py` (Zufallsquelle 2. Oktober 2026): 20 Kanten, alle am Wortlaut geprüft und richtig. Eine erste Ziehung am selben Tag enthielt einen Fehler (Nr. 2.6 unten), der vor dieser Ziehung behoben wurde.
2. Neue Regel «Botschaft ohne Zusatz: Bezugswerk der Ziffer» (Abschnitt 2, Nr. 3): vier Stichproben zu je 40 Kanten, richtig waren 37, 38, 37 und, nach der letzten Anpassung der Regel, 40. Fehlerarten und Behebung:
   1. Abkürzung im Satz beendete die Prüfung zu früh («Art. 16 Abs. 2 Bst. a des Stromabkommens»): Satzende nicht nach «Abs.», «Bst.», «Ziff.», «Art.», «i.V.m.».
   2. Trennstrich im Satz («des Stromabkom- mens»): vor der Prüfung entfernt.
   3. Verweis in einer Klammer, deren Bezug danach folgt («Artikel 1 bis 24 (mit Ausnahme des Art. 24 Abs. 4) von Anhang I»): Klammer beendet den Satz nicht.
   4. Bisheriges Recht und EU-Recht vor dem Verweis («dem bisherigen Artikel 3», «Die Strombinnenmarkt-Verordnung verlangt … (Art. 20 Abs. 1)»): keine Kante.
   5. Eigene Überschrift der Erläuterung («Art. 33 Selbstkontrollpflicht …») ergibt keine zusätzliche Kante; die Kante «erläutert» besteht schon.
3. Weitere Fehler, gefunden beim Abgleich der Erläuterungen und der Stichproben, alle behoben:
   1. Artikelnummern mit Zusatz wurden gekürzt: «Art. 14bis» → «14bi», «40ater» → «40at», «3quater» → «3qu»; «bis» in «14bis» trennte zudem Listen. Betraf alle Verweise auf solche Artikel.
   2. 621 ÄP-LandVA: Art. 1 war nicht in seine 20 Ziffern gegliedert (Ziffern um bis zu neun Zeichen eingerückt). Die zitierten Artikel 24a bis 53a stehen jetzt unter ihrer Ziffer.
   3. 619 ÄP-MRA: Die Aufzählung «Abschnitt IV: …» im zitierten neuen Art. 3 galt als Gliederung, «3. Kapitel 5 wird wie folgt geändert:» als Kapitel. Ziffern 3 bis 9 von Art. 1 und 3 bis 5 von Art. 2 fehlten.
   4. 623 und 626: Der Listeneintrag «1. Kapitel I und III der Verordnung (EU) Nr. 651/2014» galt als Kapitelüberschrift.
   5. 616 Anhang 3 (Art. 10 bis 13 KoBG) und 633 Anhang 2 (Art. 32a, Art. 50b): Sachüberschriften mit nur einem Leerzeichen nach der Nummer wurden nicht als Artikel erkannt.
   6. 628 EUPA, Protokolle I bis III: «Artikel 1 dieses Protokolls» zeigte auf das Abkommen statt auf das Protokoll (13 Kanten).
   7. «Beschluss Nr. 2/2019 des Landverkehrsausschusses» als EU-Rechtsakt gelesen (Abschnitt 2, Nr. 8).
   8. 621 ÄP-LandVA: Die acht zitierten Artikel haben ihre Sachüberschrift auf der Zeile unter «Art. 24a»; sie fehlte im Titel des Zettels. Wortlaut und Wortzahl unverändert.
