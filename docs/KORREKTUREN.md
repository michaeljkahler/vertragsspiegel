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

## 2. Grenzen der Extraktion

1. Fussnotenzeichen, die im Text nicht gefunden werden: Botschaft Fussnoten 60, 65, 262, 602, 603, 606, 612, 613, 732, 936 (meist in Grafiken oder Tabellen), 633 Fussnote 72, 2100 Fussnote 3 («Art. 197 Ziff. 17³» ist von der Ziffer 173 nicht zu unterscheiden). Die Fussnote kommt zum letzten Zettel der Seite.
2. Artikelverweise ohne Bezugswerk werden nur innerhalb desselben Teils aufgelöst. Verweise auf Erlasse ausserhalb des Pakets (BV, OR, EU-Rechtsakte, nicht geänderte Artikel der Grundabkommen) bleiben ohne Kante; ihre Zahl steht in `daten/kanten.json` unter `offen`.
3. In der Botschaft werden Verweise nur mit Bezugswerk aufgelöst («Art. 5 E-BHÜG», «Artikel 14a FZA»). Rund 2300 Verweise ohne Bezugswerk bleiben ohne Kante.
4. Erläuterungen der Botschaft zu einzelnen Artikeln: 496 von 517 einem Artikel zugeordnet. Offen sind vor allem zusammengefasste Ziffern des ÄP-LandVA («Artikel 1 Ziffer 3–5 … zu den Artikeln 7, 9 …») und die Koordinationsbeilage zum StromVG.
5. Tabellen (Anhang III FZA, Anhänge MRA) verlieren beim Textauszug ihre Spalten. Der Wortlaut ist vollständig, die Anordnung nicht.

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
