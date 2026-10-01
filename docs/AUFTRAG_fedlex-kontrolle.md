# Auftrag: Fedlex-Kontrolle Vertragsspiegel

Wiederkehrende Prüfung, ob sich an den amtlichen Texten des Pakets Schweiz–EU (Bilaterale III) etwas geändert hat. Projektordner ist das Repository `vertragsspiegel` (lokal: `Politik\Bilaterale III`). Stand dieses Auftrags: 1. Oktober 2026.

Es gibt zwei Teile, beide bei jedem Lauf: A) Fedlex. B) Beratungsstand im Parlament.

## A) Fedlex

1. Führe aus: `python3 scripts/fedlex_pruefen.py`
   Das Skript fragt den SPARQL-Endpunkt von Fedlex ab (rund 3 Sekunden) und vergleicht mit `daten/fedlex_stand.json`. Abbruchcode 0 heisst unverändert, 3 heisst Änderungen, 1 heisst Fedlex nicht erreichbar.
2. Abbruchcode 1: einmal nach fünf Minuten wiederholen. Bleibt es dabei, melde das in einem Satz und beende den Lauf ohne Änderung.
3. Abbruchcode 0: melde in einem Satz «Fedlex unverändert seit …» und geh zu Teil B.
4. Abbruchcode 3: Ordne jeden Befund einer der folgenden Arten zu und handle danach.
   1. **Publikationsumfang geändert** bei BBl 2026 615–644, typischerweise von `by-reference` zu `complete`: Das ist die angekündigte Vollpublikation. Melde, welche Dokumente betroffen sind und welche Formate je Sprache neu vorliegen (XML, HTML, PDF). Lade nichts neu und baue nichts um: Die Umstellung auf die Vollpublikation ist Etappe 4 des Projektbriefs und wird mit Michael zusammen gemacht.
   2. **Datei ersetzt oder Anhang geändert** bei BBl 2026 615–644: Lade die neue Datei, vergleiche den Text mit dem bisherigen (`daten/text/`, bis zur Etappe 2 `prototyp/an/<nummer>.txt`) und melde je Dokument: Wörter vorher und nachher, betroffene Artikel oder Abschnitte. Wortlaut nicht zitieren, nur benennen.
   3. **Neuer Bundesblatt-Eintrag zum Paket**: Melde BBl-Nummer, Datum, Titel und Link `https://fedlex.data.admin.ch/eli/fga/<jahr>/<nummer>`. Trage ihn in `daten/quellen.json` als Begleitgeschäft ein (`status: "gemeldet"`). In die Ansichten kommt er erst nach Michaels Entscheid.
   4. **Neuer AS-Eintrag zum Paket**: Melde Nummer, Datum, Titel und Link. Das deutet auf Inkrafttreten oder vorläufige Anwendung hin; nichts weiter tun.
   5. **Eintrag entfallen**: Melde ihn. Nicht aus dem Stand löschen, bis Michael es bestätigt.
5. Übernimm den neuen Stand mit `python3 scripts/fedlex_pruefen.py --apply`, ausser bei Art 5.
6. Committe `daten/fedlex_stand.json` und gegebenenfalls `daten/quellen.json` mit der Nachricht «Fedlex-Stand <Datum>: <Anzahl> Änderungen». Push nur, wenn das Repository auf GitHub eingerichtet ist und keine andere Regel dagegen spricht. Die Seite (`site/`) wird in diesem Auftrag nicht neu gebaut.

## B) Beratungsstand im Parlament

1. Führe aus: `python3 scripts/parlament_pruefen.py`
   Das Skript liest den Webservice der Parlamentsdienste zum Geschäft 26.023 (`https://ws-old.parlament.ch/affairs/20260023`, dieselben Angaben wie Curia Vista) und vergleicht Geschäftsstatus und Beschlüsse je Entwurf mit `daten/parlament_stand.json`. Abbruchcodes wie in Teil A.
2. Abbruchcode 1: einmal wiederholen, sonst die Curia-Vista-Seite des Geschäfts öffnen (`https://www.parlament.ch/de/ratsbetrieb/suche-curia-vista/geschaeft?AffairId=20260023`) und den Abschnitt «Chronologie» lesen. Geht beides nicht, in einem Satz melden.
3. Abbruchcode 3: Melde jeden neuen Schritt mit Datum, Rat, Entwurf und Beschluss im Wortlaut der Parlamentsdienste, zum Beispiel «30.9.2026, Ständerat, Entwurf 1 (Bundesbeschluss Stabilisierung): Beschluss abweichend vom Entwurf». Keine Einschätzung, wie es weitergeht.
4. Ein «Beschluss abweichend vom Entwurf» heisst, dass es eine zweite Fassung des Bundesbeschlusses gibt. Melde das als Hinweis für den Fassungsvergleich (Etappe 6). Die Fahne mit dem Wortlaut erscheint bei den Ratsunterlagen auf parlament.ch, später im Bundesblatt; nicht selbst nachbauen.
5. Übernimm den Stand mit `python3 scripts/parlament_pruefen.py --apply` und committe `daten/parlament_stand.json` zusammen mit dem Fedlex-Stand.

## Meldung

1. Knapp, in nummerierten Listen, Hochdeutsch, generisches Maskulinum, kein Gedankenstrich mit Leerzeichen.
2. Gab es weder in A noch in B etwas Neues: ein Satz.
3. Keine Wertung des Pakets, keine Zusammenfassung des Inhalts, keine Zitate aus Medien oder Parteien.

## Grenzen

1. Quellen sind ausschliesslich Fedlex, parlament.ch, EUR-Lex und die Seiten des Bundes (admin.ch). Keine Medien, keine Parteiseiten, keine sozialen Netzwerke.
2. Nichts aus `.gitignore` entfernen. Zugangsdaten nie ausgeben, auch nicht in Commit-Nachrichten.
3. Bei Zweifeln nicht pushen, sondern melden.

---

## Wo der Auftrag läuft

Entschieden am 1. Oktober 2026: als geplante Aufgabe in der Cloud, auf dem GitHub-Repository `vertragsspiegel`. Einrichtung: `docs/AUFTRAG_claude-code-einrichtung.md`.

1. Die Prüfung braucht nur Netzzugang zu Fedlex und zum Webservice des Parlaments. Beide sind aus der Cloud erreichbar (geprüft am 1. Oktober 2026), der Rechner muss dafür nicht laufen.
2. Jeder Lauf startet eine frische Sitzung und arbeitet am Repository auf GitHub. Committen und Pushen laufen über den GitHub-Zugang von Claude, den Michael einmal für das Repository freigibt; ein Token in `daten/github_zugang.json` braucht es dafür nicht.
3. Voraussetzung: Das Repository ist auf GitHub angelegt und der Inhalt dieses Ordners gepusht.
4. Rhythmus: wöchentlich, mittwochs früh. Um die angekündigte Vollpublikation (spätestens Ende November 2026) nicht um eine Woche zu verpassen, ab Samstag, 14. November 2026, bis zur Vollpublikation zusätzlich samstags.

Verworfene Alternative: lokal auf dem Rechner mit Zugriff auf den Ordner `Politik\Bilaterale III`. Dann läuft der Auftrag nur, wenn der Rechner eingeschaltet und die Claude-Desktop-App offen ist, und gepusht wird wie im Politspiegel mit dem Token aus `daten/github_zugang.json`.

Die Prüfung selbst sind zwei Skripte ohne Sprachmodell (`scripts/fedlex_pruefen.py`, `scripts/parlament_pruefen.py`, nur Python-Standardbibliothek). Sie liessen sich auch als GitHub-Actions-Arbeitsablauf mit Zeitplan ausführen, der bei Abbruchcode 3 ein Issue eröffnet. Claude braucht es für die Einordnung der Befunde und für das Nachladen geänderter Dateien.

Text für die geplante Aufgabe:

> Lies im Repository `vertragsspiegel` die Datei `docs/AUFTRAG_fedlex-kontrolle.md` und führe die Teile A und B aus. Melde das Ergebnis nach dem Abschnitt «Meldung».
