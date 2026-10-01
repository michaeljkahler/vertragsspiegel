"""Baut den Datensatz für die Musterseite aus den Fedlex-Volltexten (BBl 2026 615–644).

Dokumentebene: gezählt. Gliederung, Verweise, EU-Rechtsakte, SR-Nummern: Rohextraktion per Regex.
"""
import json, re, collections, pathlib

S = pathlib.Path(__file__).parent
AN = S / 'an'
titles = {b['act']['value'].rsplit('/', 1)[1]: b['title']['value']
          for b in json.load(open(S / 'bbl53.json'))['results']['bindings']}

# ------------------------------------------------------------------ Dokumente
DOCS = [
    # id, kurz, typ, gruppe, kuerzel_fuer_matching
    (615, 'Botschaft', 'Botschaft', 'botschaft'),
    (616, 'BB Stabilisierung', 'Bundesbeschluss', 'stab'),
    (617, 'ÄP-FZA', 'Protokoll', 'stab'),
    (618, 'IP-FZA', 'Protokoll', 'stab'),
    (619, 'ÄP-MRA', 'Protokoll', 'stab'),
    (620, 'IP-MRA', 'Protokoll', 'stab'),
    (621, 'ÄP-LandVA', 'Protokoll', 'stab'),
    (622, 'IP-LandVA', 'Protokoll', 'stab'),
    (623, 'Beihilfeprotokoll LandVA', 'Protokoll', 'stab'),
    (624, 'ÄP-LuftVA', 'Protokoll', 'stab'),
    (625, 'IP-LuftVA', 'Protokoll', 'stab'),
    (626, 'Beihilfeprotokoll LuftVA', 'Protokoll', 'stab'),
    (627, 'ÄP-LwA', 'Protokoll', 'stab'),
    (628, 'EUPA', 'Abkommen', 'stab'),
    (629, 'EUSPA-Abkommen', 'Abkommen', 'stab'),
    (630, 'Beitragsabkommen', 'Abkommen', 'stab'),
    (631, 'BB Elektrizität', 'Bundesbeschluss', 'strom'),
    (632, 'Stromabkommen', 'Abkommen', 'strom'),
    (633, 'BB Lebensmittelsicherheit', 'Bundesbeschluss', 'lms'),
    (634, 'Protokoll Lebensmittelsicherheit', 'Protokoll', 'lms'),
    (635, 'BB Gesundheit', 'Bundesbeschluss', 'ges'),
    (636, 'Gesundheitsabkommen', 'Abkommen', 'ges'),
    (637, 'BB Parl. Zusammenarbeit', 'Bundesbeschluss', 'weitere'),
    (638, 'Protokoll Parl. Zusammenarbeit', 'Protokoll', 'weitere'),
    (639, 'BB Kredit Kohäsion', 'Bundesbeschluss', 'weitere'),
    (640, 'BB Kredit Migration', 'Bundesbeschluss', 'weitere'),
    (641, 'BB Kredit zus. Kohäsion', 'Bundesbeschluss', 'weitere'),
    (642, 'BB Kredit Erasmus+', 'Bundesbeschluss', 'weitere'),
    (643, 'Erklärung Hochrangiger Dialog', 'Erklärung', 'weitere'),
    (644, 'Erklärung Übergangszeit', 'Erklärung', 'weitere'),
]
GRUPPEN = [
    ('botschaft', 'Botschaft'),
    ('stab', 'Stabilisierung'),
    ('strom', 'Elektrizität'),
    ('lms', 'Lebensmittelsicherheit'),
    ('ges', 'Gesundheit'),
    ('weitere', 'Weitere Beschlüsse und Erklärungen'),
]
# Genehmigungsbeziehungen laut Art. 1 der Bundesbeschlüsse (aus dem Text gelesen)
GENEHMIGT = {616: list(range(617, 631)), 631: [632], 633: [634], 635: [636], 637: [638]}

EU = re.compile(r'(?:Verordnung|Richtlinie|Durchführungsverordnung|Delegierte[nr]? Verordnung|Beschluss|Durchführungsbeschluss|Entscheidung)'
                r'\s*(?:\((?:EU|EG|EWG|Euratom)\)\s*)?(?:Nr\.\s*)?(\d{2,4}/\d{1,4}(?:/(?:EU|EG|EWG))?)')
SR = re.compile(r'\bSR\s+(\d+(?:\.\d+)+)')
NOISE = re.compile(r'(«%ASFF_YYYY_ID»|^\s*\d+\s*/\s*\d+\s*$|^\s*20\d\d-[\d…\.]+\s|BBl 2026 \d+\s*$|^\s*AS 2026\s*$|^\s*SR…\s*$)')


def clean(lines):
    out = []
    for l in lines:
        if NOISE.search(l):
            continue
        out.append(l.strip())
    txt = '\n'.join(out)
    txt = re.sub(r'-\n(?=[a-zäöü])', '', txt)       # Silbentrennung
    txt = re.sub(r'[ \t]{2,}', ' ', txt)
    txt = re.sub(r'\n{3,}', '\n\n', txt)
    return txt.strip()


def words(s):
    return len(re.findall(r'\w+', s))


def trim(s, n):
    w = s.split()
    return ' '.join(w[:n]) + (' …' if len(w) > n else '')


ART = re.compile(r'^\s*Art\.\s+(\d+[a-z]?)(?:\s{2,}(\S.*?))?\s*$')
ANH = re.compile(r'^\s*Anhang\s+([IVXLC]+|\d+[a-z]?)\s*$')

docs_out, leaves, tree_groups = [], [], {g: [] for g, _ in GRUPPEN}
eu_all, sr_all = set(), set()

for did, kurz, typ, grp in DOCS:
    raw = open(AN / f'{did}.txt', encoding='utf8').read()
    pages = raw.split('\f')
    n_pages = len([p for p in pages if p.strip()])
    w_total = words(raw)
    docs_out.append(dict(id=did, kurz=kurz, titel=titles[str(did)], typ=typ, gruppe=grp,
                         seiten=n_pages, woerter=w_total,
                         eli=f'https://fedlex.data.admin.ch/eli/fga/2026/{did}'))
    if did == 615:
        continue
    lines = raw.split('\n')
    # Abschnitte: Anhang-Grenzen (Ebene Teil), Artikel (Ebene Blatt)
    teile = [dict(name='Hauptteil', start=0, arts=[])]
    for i, l in enumerate(lines):
        m = ANH.match(l)
        if m:
            teile.append(dict(name=f'Anhang {m.group(1)}', start=i, arts=[]))
            continue
        m = ART.match(l)
        if m:
            teile[-1]['arts'].append((i, m.group(1), (m.group(2) or '').strip()))
    teile_out = []
    bounds = []
    for t in teile:
        for (i, nr, tit) in t['arts']:
            bounds.append(i)
        bounds.append(t['start'])
    bounds = sorted(set(bounds + [len(lines)]))

    def seg(a):
        b = next(x for x in bounds if x > a)
        return lines[a:b]
    for ti, t in enumerate(teile):
        t_end = teile[ti + 1]['start'] if ti + 1 < len(teile) else len(lines)
        kids = []
        # Text vor dem ersten Artikel des Teils (Präambel, Anhangstitel)
        first = t['arts'][0][0] if t['arts'] else t_end
        pre = clean(lines[t['start']:first])
        if words(pre) > 25:
            lab = 'Ingress' if t['name'] == 'Hauptteil' else (f"{t['name']}, Einleitung" if t['arts'] else t['name'])
            kids.append((lab, pre, None))
        for (i, nr, tit) in t['arts']:
            txt = clean(seg(i))
            kids.append((f'Art. {nr}' + (f' {tit}' if tit else ''), txt, nr))
        for lab, txt, nr in kids:
            lid = f'{did}-{len(leaves)}'
            e = sorted(set(EU.findall(txt)))
            s = sorted(set(SR.findall(txt)))
            eu_all.update(e); sr_all.update(s)
            refs = [] if t['name'] != 'Hauptteil' and nr is None else sorted(set(re.findall(r'(?:Artikels?|Art\.)\s+(\d+[a-z]?)(?!\s*(?:Abs\.\s*\d+\s*)?(?:der|des|BV|AEUV|EUV|EMRK))', txt[len(lab):])))
            leaves.append(dict(id=lid, doc=did, teil=t['name'], label=lab, nr=nr, woerter=words(txt),
                               text=trim(txt, 650), eu=e, sr=s, refs=refs))
            t.setdefault('leafids', []).append(lid)
        if t.get('leafids'):
            teile_out.append(dict(name=t['name'], leaves=t['leafids']))
    tree_groups[grp].append(dict(doc=did, teile=teile_out))

# ------------------------------------------------------------------ Botschaft: Inhaltsverzeichnis
raw = open(AN / '615.txt', encoding='utf8').read()
pages = raw.split('\f')
page_words = [words(p) for p in pages]
lines = raw.split('\n')
toc_start = next(i for i, l in enumerate(lines) if l.strip() == 'Inhaltsverzeichnis')
body_start = next(i for i, l in enumerate(lines) if i > toc_start + 50 and re.match(r'^1\s{3,}Allgemeiner Teil', l))
entries, cur = [], None
for l in lines[toc_start + 1:body_start]:
    s = l.rstrip()
    if not s.strip() or NOISE.search(s) or re.match(r'^\s*\d+\s*/\s*1086\s*$', s):
        continue
    m = re.match(r'^\s*(\d+(?:\.\d+)*)\s+(.*?)\s*(\d{1,4})?$', s)
    roman = re.match(r'^\s*(I{1,3})\.\s+(.*?)\s*(\d{1,4})?$', s)
    if roman:
        continue
    if m and (cur is None or cur.get('page') is not None):
        cur = dict(nr=m.group(1), titel=m.group(2).strip(), page=int(m.group(3)) if m.group(3) else None)
        entries.append(cur)
    elif cur is not None and cur.get('page') is None:
        m2 = re.match(r'^\s*(.*?)\s*(\d{1,4})?$', s)
        cur['titel'] = (cur['titel'] + ' ' + m2.group(1).strip()).strip()
        if m2.group(2):
            cur['page'] = int(m2.group(2))
entries = [e for e in entries if e.get('page') and len(e['nr'].split('.')) <= 3 and 0 < e['page'] <= 1086]
# Seitenpositionen; Wörter anteilig je Seite
by_page = collections.Counter(e['page'] for e in entries)
seen = collections.Counter()
for e in entries:
    seen[e['page']] += 1
    e['pos'] = e['page'] - 1 + (seen[e['page']] - 1) / by_page[e['page']]
first_pos = entries[0]['pos']
vorspann = sum(page_words[:entries[0]['page'] - 1]) + page_words[entries[0]['page'] - 1] * (first_pos - (entries[0]['page'] - 1))


def words_between(a, b):
    tot = 0.0
    p = int(a)
    while p < b and p < len(page_words):
        lo, hi = max(a, p), min(b, p + 1)
        if hi > lo:
            tot += page_words[p] * (hi - lo)
        p += 1
    return tot


for i, e in enumerate(entries):
    nxt = entries[i + 1]['pos'] if i + 1 < len(entries) else len(page_words)
    e['w_own'] = words_between(e['pos'], nxt)

# Hierarchie: Kapitel (1 Ziffer) > Ziffer (2) > Blatt (3); Text vor der ersten Unterziffer wird eigenes Blatt
body = '\n'.join(lines[body_start:])


def excerpt(nr, titel):
    pat = re.compile(r'^\s*' + re.escape(nr) + r'\s+' + re.escape(titel.split()[0]) + r'.*$', re.M)
    m = pat.search(body)
    if not m:
        return ''
    seg = body[m.end():m.end() + 6000]
    seg = '\n'.join(l for l in seg.split('\n') if not NOISE.search(l))
    seg = re.sub(r'-\n(?=[a-zäöü])', '', seg)
    seg = re.sub(r'\s+', ' ', seg)
    return trim(seg, 140)


bot_kap = []
for e in entries:
    lvl = len(e['nr'].split('.'))
    e['lvl'] = lvl
botschaft_leaves = []
kap = None; zif = None
vors_id = f'615-{len(leaves)}'
leaves.append(dict(id=vors_id, doc=615, teil='Vorspann', label='Übersicht und Inhaltsverzeichnis', nr=None,
                   woerter=round(vorspann), text='', eu=[], sr=[], refs=[]))
bot_kap.append(dict(name='Vorspann', leaves=[vors_id], ziffern=[]))
for e in entries:
    lid = f'615-{len(leaves)}'
    lab = f"{e['nr']} {e['titel']}"
    if e['lvl'] == 1:
        kap = dict(name=lab, leaves=[], ziffern=[]); bot_kap.append(kap); zif = None
        if e['w_own'] >= 1:
            leaves.append(dict(id=lid, doc=615, teil=lab, label=lab, nr=e['nr'], woerter=round(e['w_own']),
                               text=excerpt(e['nr'], e['titel']), eu=[], sr=[], refs=[]))
            kap['leaves'].append(lid)
    elif e['lvl'] == 2:
        zif = dict(name=lab, leaves=[]); kap['ziffern'].append(zif)
        if e['w_own'] >= 1:
            leaves.append(dict(id=lid, doc=615, teil=kap['name'], label=lab, nr=e['nr'], woerter=round(e['w_own']),
                               text=excerpt(e['nr'], e['titel']), eu=[], sr=[], refs=[]))
            zif['leaves'].append(lid)
    else:
        if e['w_own'] < 1:
            continue
        leaves.append(dict(id=lid, doc=615, teil=kap['name'], label=lab, nr=e['nr'], woerter=round(e['w_own']),
                           text=excerpt(e['nr'], e['titel']), eu=[], sr=[], refs=[]))
        (zif or kap)['leaves'].append(lid)
tree_groups['botschaft'].append(dict(doc=615, kapitel=bot_kap))

# Botschaft-Kapitel 2.x den Dokumenten zuordnen (über Titelstichwort)
KAP_MAP = {
    'Freizügigkeit': [617, 618], 'Konformitätsbewertung': [619, 620], 'Landverkehr': [621, 622, 623],
    'Luftverkehr': [624, 625, 626], 'Landwirtschaft': [627], 'Programm': [628], 'Weltraum': [629],
    'Beitrag': [630, 639, 640, 641], 'Strom': [632, 631], 'Elektrizität': [632, 631],
    'Lebensmittel': [634, 633], 'Gesundheit': [636, 635], 'Hochrangiger Dialog': [643],
    'Parlamente': [638, 637], 'Erasmus': [642],
}
erlaeutert = []
for e in entries:
    if e['lvl'] == 2 and e['nr'].startswith('2.'):
        for k, ds in KAP_MAP.items():
            if k.lower() in e['titel'].lower():
                for d in ds:
                    erlaeutert.append(dict(kap=f"{e['nr']} {e['titel']}", doc=d))
erlaeutert = sorted([dict(t) for t in {tuple(x.items()) for x in erlaeutert}], key=lambda x: (x['kap'], x['doc']))

# ------------------------------------------------------------------ Matrix: gemeinsam genannte EU-Rechtsakte je Dokumentpaar
doc_eu = collections.defaultdict(set)
for l in leaves:
    doc_eu[l['doc']].update(l['eu'])
bot_raw_eu = set(EU.findall(raw))
doc_eu[615] = bot_raw_eu
ids = [d[0] for d in DOCS]
matrix = [[(len(doc_eu[a] & doc_eu[b]) if a != b else 0) for b in ids] for a in ids]

# ------------------------------------------------------------------ Sankey: Vorlage -> Bundesgesetz (Rohextraktion aus den Bundesbeschlüssen)
LAW = re.compile(r'^\s*\d{1,2}\.\s+((?:[A-ZÄÖÜ][\w\-äöüÄÖÜ]*(?:gesetz|ordnung|buch))|Bundesgesetz vom [^\n]{0,40}?über [^\n]+?)\s+vom\b|^\s*\d{1,2}\.\s+(Bundesgesetz) vom \d', re.M)
sankey = []
for bb, grp in [(616, 'stab'), (631, 'strom'), (633, 'lms'), (635, 'ges')]:
    t = open(AN / f'{bb}.txt', encoding='utf8').read()
    found = set()
    tl = t.split('\n')
    for i, l in enumerate(tl):
        m = re.match(r'^\s*\d{1,2}\.\s+(.*)$', l)
        if not m:
            continue
        s = (m.group(1) + ' ' + ' '.join(x.strip() for x in tl[i + 1:i + 3]))
        s = re.sub(r'-\s+(?=[a-zäöü])', '', s)
        s = re.sub(r'\s+', ' ', s)
        m1 = re.match(r'^([A-ZÄÖÜ][\wäöüÄÖÜ\-]*(?:gesetz|Gesetz)) vom \d', s)
        m2 = re.match(r'^Bundesgesetz vom \d+\.? \w+ \d{4}\d* über (?:die |das |den )?(.+)$', s)
        if m1 and m1.group(1) != 'Bundesgesetz':
            found.add(m1.group(1))
        elif m2:
            words_ = re.split(r'[\s]', m2.group(1))
            name = ' '.join(words_[:6])
            name = re.split(r'(?<=[a-zäöü])\d|\s(?=[A-ZÄÖÜ]{2,}\b)|\s\(|\s\d', name)[0].rstrip(',;')
            found.add('BG über ' + name)
    norm = {}
    for f in found:
        f = re.sub(r'enund\b', 'en- und', f).strip()
        key = ' '.join(w for w in f.split() if w not in ('die', 'der', 'das'))[:40]
        norm.setdefault(key, f)
    found = set(norm.values())
    for f in sorted(found):
        sankey.append(dict(gruppe=grp, bb=bb, gesetz=f))

stats = dict(dokumente=len(DOCS), seiten=sum(d['seiten'] for d in docs_out), woerter=sum(d['woerter'] for d in docs_out),
             zettel=len(leaves), eu=len(eu_all | bot_raw_eu), sr=len(sr_all | set(SR.findall(raw))))
data = dict(stats=stats, gruppen=[dict(id=g, name=n) for g, n in GRUPPEN], docs=docs_out, tree=tree_groups,
            leaves=leaves, genehmigt=GENEHMIGT, erlaeutert=erlaeutert, matrix=dict(ids=ids, werte=matrix), sankey=sankey,
            doc_eu={str(k): sorted(v) for k, v in doc_eu.items()})
json.dump(data, open(S / 'vertragsspiegel_daten.json', 'w', encoding='utf8'), ensure_ascii=False, separators=(',', ':'))
print(stats)
print('Botschaft-Einträge', len(entries), 'Kapitel', [k['name'][:40] for k in bot_kap])
print('Blätter je Dok', collections.Counter(l['doc'] for l in leaves).most_common(8))
print('Sankey', len(sankey), collections.Counter(s['gruppe'] for s in sankey))
print('erläutert', len(erlaeutert))
print('Matrix max', max(max(r) for r in matrix))
print('Grösse JSON KB', (S / 'vertragsspiegel_daten.json').stat().st_size // 1024)
bw = sum(l['woerter'] for l in leaves if l['doc'] == 615)
print('Botschaft Wörter Blätter', bw, 'vs', docs_out[0]['woerter'])
