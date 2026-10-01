# Auftrag an Claude Code: Vertragsspiegel auf GitHub einrichten

Stand 1. Oktober 2026. Dieser Auftrag ist so geschrieben, dass er ohne Rückfragen abgearbeitet werden kann. Ausnahmen sind die mit **Michael** markierten Schritte: Dort handelt Michael selbst, Claude Code wartet und prüft danach.

Projektordner: `C:\Users\Admin\Documents\Claude\Projects\Politik\Bilaterale III`

**Wo Claude Code läuft:** lokal auf Michaels Rechner, im Projektordner gestartet (Terminal: in den Ordner wechseln, `claude`). Nicht in der Cloud: Der Inhalt liegt bis zum ersten Push nur auf diesem Rechner, und der erste Push braucht Michaels Git-Zugang. Erst ab Schritt 5 läuft alles Weitere in der Cloud, am Repository auf GitHub.

Ziel:

1. Der Ordner ist ein Git-Repository und liegt öffentlich auf GitHub unter `michaeljkahler/vertragsspiegel`.
2. Claude hat über die GitHub-Verbindung von claude.ai Lese- und Schreibzugriff auf dieses Repository.
3. Die Fedlex- und Parlamentskontrolle läuft als geplante Aufgabe in der Cloud (Auftrag `docs/AUFTRAG_fedlex-kontrolle.md`).

Nicht Teil dieses Auftrags: GitHub Pages (erst ab Etappe 3, wenn es `site/` gibt), der Kasten im Politspiegel, die Pipeline.

---

## Was hier veröffentlicht wird

Amtliche Texte und Metadaten des Bundes, ein Prototyp und Dokumentation. Personendaten enthält das Repository keine. Heikel sind allein Zugangsdaten: Es gibt im Ordner keine, und es darf auch keine geben. Der Push läuft über Michaels eigenen Git-Zugang, die Läufe in der Cloud über die GitHub-Verbindung von claude.ai. Ein Token in einer Datei oder in der Fernadresse braucht es in keinem der beiden Fälle.

Die Rohtexte unter `prototyp/an/` (31 Dateien, rund 5 MB) sind in `.gitignore` ausgeschlossen. Sie sind öffentlich auf Fedlex und werden später von `laden.py` wiederhergestellt.

---

## Schritt 1: Vorflugkontrolle

Unter Windows heisst Python oft `python` oder `py` statt `python3`. Nimm, was vorhanden ist, und verwende es in allen folgenden Schritten.

```bash
cd "/c/Users/Admin/Documents/Claude/Projects/Politik/Bilaterale III"
git --version
python3 --version || python --version
gh --version          # optional; fehlt es, geht Schritt 3 von Hand
```

Dann beide Prüfskripte einmal als Probelauf, ohne `--apply`:

```bash
python3 scripts/fedlex_pruefen.py;    echo "Abbruchcode $?"
python3 scripts/parlament_pruefen.py; echo "Abbruchcode $?"
```

Erwartet: Abbruchcode 0 mit «Unverändert seit 2026-10-01» oder 3 mit einer Liste von Änderungen. Abbruchcode 3 ist hier kein Fehler: Notiere die Meldung für den Bericht an Michael, übernimm aber keinen neuen Stand. Abbruchcode 1 heisst, die Quelle ist von diesem Rechner aus nicht erreichbar; das ist für die Einrichtung ohne Belang, weil die Kontrolle in der Cloud läuft. Notieren und weitermachen.

---

## Schritt 2: Git-Repository anlegen

```bash
git init -b main
git config user.name "Vertragsspiegel"
git config user.email "michaeljkahler@users.noreply.github.com"
git add -A
git status --short
```

Erwartet sind genau diese 16 Dateien, rund 3,5 MB:

```
.gitignore
README.md
daten/fedlex_stand.json
daten/parlament_stand.json
docs/AUFTRAG_claude-code-einrichtung.md
docs/AUFTRAG_fedlex-kontrolle.md
docs/PROJEKTBRIEF.md
prototyp/README.md
prototyp/bbl53.json
prototyp/build_data.py
prototyp/seite_bauen.py
prototyp/vertragsspiegel.html
prototyp/vertragsspiegel_daten.json
prototyp/vertragsspiegel_template.html
scripts/fedlex_pruefen.py
scripts/parlament_pruefen.py
```

Prüfen, dass die Rohtexte nicht erfasst sind:

```bash
git check-ignore -q prototyp/an/615.txt && echo "ok  prototyp/an ausgeschlossen" || echo "GEFAHR  prototyp/an erfasst"
git ls-files --cached | wc -l
git ls-files --cached -z | xargs -0 du -cb | tail -1
```

Inhaltsprobe über alle erfassten Dateien. Diese Anleitung selbst ist ausgenommen, weil sie die Suchmuster enthält:

```bash
python3 - <<'PY'
import subprocess
muster = ("github_pat_", "ghp_", "gho_", "michael.j.kahler@", "BEGIN PRIVATE KEY")
dateien = subprocess.run(["git", "ls-files", "--cached"], capture_output=True, text=True).stdout.split("\n")
treffer = 0
for f in filter(None, dateien):
    if f == "docs/AUFTRAG_claude-code-einrichtung.md":
        continue
    t = open(f, encoding="utf-8", errors="ignore").read()
    for m in muster:
        if m in t:
            print("FUND:", f, "->", m); treffer += 1
print("Probe fertig,", treffer, "Treffer")
PY
```

Erwartet: 0 Treffer. **Jeder Treffer ist ein Abbruchgrund.** Melde ihn und mach nicht weiter.

Weicht die Dateiliste ab, ist seit dem 1. Oktober 2026 etwas dazugekommen oder weggefallen. Nachsehen, nicht wegklicken: Neue Dateien nur mitnehmen, wenn klar ist, was sie enthalten.

Dann der erste Commit:

```bash
git commit -m "Vertragsspiegel: Projektbrief, Kontrolle, Prototyp vom 1. Oktober 2026"
```

---

## Schritt 3: Repository auf GitHub anlegen und pushen

Öffentlich, leer, **ohne** README, .gitignore oder Lizenz: Ein vorinitialisiertes Repository führt beim ersten Push zu einem Konflikt.

Ist `gh` installiert und angemeldet (`gh auth status`):

```bash
gh repo create michaeljkahler/vertragsspiegel --public \
  --description "Paket Schweiz–EU (Bilaterale III): Texte, Umfang und Verknüpfungen, wertungsfrei" \
  --source . --remote origin --push
```

Sonst **Michael**: auf github.com ein neues Repository `vertragsspiegel` anlegen, öffentlich, ohne Vorlage. Danach:

```bash
git remote add origin https://github.com/michaeljkahler/vertragsspiegel.git
git push -u origin main
```

Der Push läuft über Michaels Git-Zugang auf diesem Rechner (Git Credential Manager), wie im Politspiegel. Fragt Git nach Anmeldedaten, erledigt das Michael im sich öffnenden Fenster. Claude Code erzeugt **kein** Token und legt keine Zugangsdatei an.

Prüfen:

```bash
git remote -v                        # https://github.com/michaeljkahler/vertragsspiegel.git, ohne Zugangsdaten
git ls-remote origin main            # zeigt den Hash des ersten Commits
```

Im Browser `https://github.com/michaeljkahler/vertragsspiegel` öffnen: 16 Dateien, README wird angezeigt, kein Ordner `prototyp/an`.

---

## Schritt 4: Claude Zugriff auf das Repository geben (Michael)

Die geplante Aufgabe läuft in der Cloud und arbeitet am Repository auf GitHub. Dafür braucht Claude über die GitHub-Verbindung von claude.ai Zugriff auf `vertragsspiegel`.

1. Auf claude.ai unter Einstellungen, Connectors prüfen, ob GitHub verbunden ist. Falls nicht: verbinden.
2. Ist die GitHub-App von Claude nur für ausgewählte Repositories installiert: auf github.com unter Settings, Applications, Installed GitHub Apps, bei Claude das Repository `vertragsspiegel` hinzufügen.

Claude Code kann diesen Schritt nicht prüfen. Er gilt als erledigt, wenn Schritt 5 das Repository anbinden kann.

---

## Schritt 5: Geplante Aufgabe anlegen (in der claude.ai-Unterhaltung)

Geplante Aufgaben in der Cloud werden in einer Unterhaltung auf claude.ai angelegt, nicht in Claude Code. Michael meldet dort, in der Unterhaltung, in der dieser Auftrag entstanden ist: «Repository vertragsspiegel ist bereit». Claude bindet dann das Repository mit Schreibzugriff an und legt die Aufgabe so an:

| Feld | Wert |
|---|---|
| Name | Vertragsspiegel Kontrolle |
| Zeitplan | wöchentlich mittwochs 06:50, Zeitzone Europe/Zurich (`CRON_TZ=Europe/Zurich 50 6 * * 3`) |
| Repository | `michaeljkahler/vertragsspiegel`, Schreibzugriff |
| Läuft | in der Cloud, ohne Michaels Rechner |
| Benachrichtigung | Push und E-Mail, wenn ein Lauf etwas meldet |

Text der Aufgabe:

> Du arbeitest im Repository michaeljkahler/vertragsspiegel auf dem Branch main. Lies die Datei docs/AUFTRAG_fedlex-kontrolle.md und führe die Teile A und B vollständig aus. Committe die geänderten Stand-Dateien unter daten/ mit der dort vorgegebenen Nachricht und pushe auf main. Gab es keine Änderung, committe nichts. Melde das Ergebnis nach dem Abschnitt «Meldung» des Auftrags.

Danach im selben Schritt:

1. Die Aufgabe einmal sofort auslösen und das Ergebnis mit Michael ansehen. Erwartet: «Fedlex unverändert» und «Parlament unverändert», kein Commit.
2. Eine Erinnerung in die Unterhaltung auf Freitag, 13. November 2026, setzen: Dann wird die zweite Aufgabe «Vertragsspiegel Kontrolle Samstag» angelegt, gleicher Text, `CRON_TZ=Europe/Zurich 50 6 * * 6`. Sie läuft vom 14. November 2026 bis zur Vollpublikation im Bundesblatt und wird gelöscht, sobald `fedlex_pruefen.py` für alle 30 Einträge den Umfang `complete` meldet.

---

## Schritt 6: Bericht an Michael

1. Commit-Hash des ersten Commits und Adresse des Repositorys.
2. Zahl und Grösse der versionierten Dateien.
3. Ergebnis der Probeläufe aus Schritt 1, auch wenn eine Quelle nicht erreichbar war.
4. Ob Schritt 3 mit `gh` oder von Hand lief.

---

## Danach: lokal und Cloud im Gleichtakt halten

1. Die geplante Aufgabe committet Stand-Dateien unter `daten/` direkt auf GitHub. Der lokale Ordner ist danach im Rückstand.
2. Vor jeder lokalen Arbeit im Projektordner: `git pull`.
3. Lokale Änderungen nach der Arbeit committen und pushen, damit der nächste Cloud-Lauf sie sieht.
4. Weiterentwicklung (Etappen 2 und 3) geht lokal oder in einer Cloud-Sitzung am Repository. In beiden Fällen gilt GitHub als massgebender Stand.

## Grenzen

1. Kein Token erzeugen, keins in eine Datei, eine Fernadresse oder eine Meldung schreiben.
2. Nichts aus `.gitignore` entfernen. Die Regel für Zugangsdaten steht absichtlich zuoberst.
3. Keine Inhalte ändern ausser den Befehlen dieser Anleitung. Fehler im Brief oder in den Skripten melden, nicht still korrigieren.
4. Kein `git push --force`. Schlägt ein Push fehl, melden.
5. Bei Zweifeln nicht pushen, sondern fragen. Ein öffentliches Repository lässt sich löschen, ein einmal veröffentlichter Inhalt nicht zurückholen.
