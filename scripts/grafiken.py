"""Grafiken der Seite als PNG, ohne Browserfenster: für Social Media und Berichte.

Öffnet site/ über einen lokalen Server in Chromium (Playwright), stellt je Auftrag Motiv,
Format und Einstellungen im Grafikdialog ein (window.VSGrafik aus seite/grafik.js) und
speichert die Leinwand. Ein Zeichenprogramm, deckungsgleich mit «Als Bild speichern».

    pip install playwright && python3 -m playwright install chromium
    python3 scripts/grafiken.py site site/social auftraege.json

auftraege.json: [{"name": "2026-10-umfang/01-zahlen", "motiv": "zahlen", "format": "hoch",
                  "G": {"bb": "616"}}]
Motive und Felder von G: siehe MOTIVE und G in seite/grafik.js.
Social-Media-Beiträge liegen unter site/social/<serie>/ mit posts.json (Texte, Termine, Metricool).
"""
import base64, functools, http.server, json, socketserver, sys, threading, time
from pathlib import Path
from playwright.sync_api import sync_playwright

site, aus, jobs = Path(sys.argv[1]), Path(sys.argv[2]), json.loads(Path(sys.argv[3]).read_text())
aus.mkdir(parents=True, exist_ok=True)
H = functools.partial(http.server.SimpleHTTPRequestHandler, directory=str(site))
H.log_message = lambda *a, **k: None
srv = socketserver.TCPServer(("127.0.0.1", 0), H)
port = srv.server_address[1]
threading.Thread(target=srv.serve_forever, daemon=True).start()

with sync_playwright() as p:
    b = p.chromium.launch()
    for job in jobs:
        pg = b.new_page(viewport={"width": 1600, "height": 1000})
        fehler = []
        pg.on("pageerror", lambda e: fehler.append(str(e)))
        pg.goto(f"http://127.0.0.1:{port}/index.html{job.get('hash', '')}")
        pg.wait_for_function("window.VS && window.VS.D && window.VSGrafik", timeout=60000)
        pg.evaluate("document.fonts.ready")
        time.sleep(1.0)
        for vor in job.get("vorher", []):
            pg.evaluate(vor)
            time.sleep(0.5)
        url = pg.evaluate("""async (job) => {
            const g = window.VSGrafik;
            g.oeffne(job.motiv);
            Object.assign(g.G, {format: job.format || 'hoch'}, job.G || {});
            await Promise.all(['700 48px Archivo', '600 20px Archivo', '400 20px "Public Sans"', '500 20px "Public Sans"', '600 20px "Public Sans"', '700 20px "Public Sans"'].map(f => document.fonts.load(f)));
            g.zeichnen();
            await new Promise(r => setTimeout(r, 400));
            g.zeichnen();
            return document.querySelector('#grafikCanvas').toDataURL('image/png');
        }""", job)
        p = aus / f"{job["name"]}.png"; p.parent.mkdir(parents=True, exist_ok=True); p.write_bytes(base64.b64decode(url.split(",", 1)[1]))
        print(job["name"], "ok", "Fehler: " + "; ".join(fehler) if fehler else "")
        pg.close()
    b.close()
srv.shutdown()
