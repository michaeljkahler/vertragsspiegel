"""Baut den Datensatz für die Musterseite aus den Fedlex-Volltexten (BBl 2026 615–644).

Dokumentebene: gezählt. Gliederung, Verweise, EU-Rechtsakte, SR-Nummern, Bögen: Rohextraktion per Regex.
Texte aus prototyp/an/ oder, falls nicht vorhanden, aus daten/text/de/ (scripts/laden.py).
"""
import json, re, collections, pathlib

S = pathlib.Path(__file__).parent
AN = S / 'an' if (S / 'an' / '615.txt').exists() else S.parent / 'daten' / 'text' / 'de'
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
FULL = {}  # ungekürzter Wortlaut je Zettel, für die Fundstellen der Bögen

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
            FULL[lid] = txt
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

# ------------------------------------------------------------------ Bögen mit Fundstellen (Reiter «Bezüge»)
# Botschaft: Text je Abschnitt über die Wortpositionen rekonstruieren (seitenanteilig, Grenzen ungenau)
tok = [m.start() for m in re.finditer(r'\w+', raw)] + [len(raw)]
cum = 0
for l in leaves:
    if l['doc'] != 615:
        continue
    a, b = cum, cum + l['woerter']
    FULL[l['id']] = raw[tok[min(a, len(tok) - 1)]:tok[min(b, len(tok) - 1)]]
    cum = b


def flach(t):
    t = '\n'.join(z for z in t.split('\n') if not NOISE.search(z))
    t = re.sub(r'-\n\s*(?=[a-zäöü])', '', t)
    t = re.sub(r'-\n\s*(?=[A-ZÄÖÜ])', '-', t)
    t = re.sub(r'\s+', ' ', t).strip()
    return re.sub(r'(IP|ÄP)-\s+', r'\1-', t)


FLACH = {k: flach(v) for k, v in FULL.items()}
for l in leaves:
    if l['doc'] == 615:
        l['eu'] = sorted(set(EU.findall(FLACH[l['id']])))


def stelle(lid, m0, m1, fenster=200):
    """Ausschnitt um die Fundstelle: [Text, Beginn, Ende der Markierung]."""
    t = FLACH[lid]
    a, b = max(0, m0 - fenster), min(len(t), m1 + fenster)
    if a > 0:
        a = t.find(' ', a) + 1
    if b < len(t):
        b = t.rfind(' ', m0, b) if t.rfind(' ', m0, b) > m1 else b
    vor, nach = ('… ' if a > 0 else ''), (' …' if b < len(t) else '')
    return [vor + t[a:b] + nach, len(vor) + m0 - a, len(vor) + m1 - a]


def anfang(lid, n=420):
    t = FLACH[lid]
    if len(t) <= n:
        return [t, 0, 0]
    return [t[:t.rfind(' ', 0, n)] + ' …', 0, 0]


bydoc = collections.defaultdict(list)
for l in leaves:
    bydoc[l['doc']].append(l)


def artikel(doc, nr, teil=None):
    c = [x for x in bydoc[doc] if x['nr'] == nr]
    c.sort(key=lambda x: (x['teil'] != (teil or 'Hauptteil'), x['teil'] != 'Hauptteil'))
    return c[0] if c else None


bogen = []
# 1. Artikelverweis im selben Dokument. Verweis gilt als extern, wenn im selben Satzteil ein anderer Erlass folgt
#    («Artikel 54 Absatz 1 und 166 Absatz 2 der Bundesverfassung», «Art. 3 der Verordnung (EU) …»).
EXTERN = re.compile(r'[^.;:()]{0,90}?(?:\b(?:der|des|dieser|dieses)\s+(?:Bundesverfassung|Verordnung|Richtlinie|Durchführungs|Delegierten|'
                    r'Bundesgesetz|Gesetz|Beschluss|Übereinkommen|Vertrag|Statut|Rahmenabkommen|Zollkodex)|\b(?:BV|AEUV|EUV|EMRK|SR)\b|'
                    r'\b[A-ZÄÖÜ][A-Za-zäöü]*G\b(?!-))')
intern_extern = 0
for l in leaves:
    if l['doc'] == 615 or not l['refs']:
        continue
    t = FLACH[l['id']]
    kopf = len(flach(l['label']))
    gueltig = []
    for r in l['refs']:
        z = artikel(l['doc'], r, l['teil'])
        if not z or z['id'] == l['id']:
            continue
        treffer = [m for m in re.compile(r'(?:Artikels?|Art\.)\s+' + re.escape(r) + r'\b').finditer(t, kopf)
                   if not EXTERN.match(t, m.end())]
        if not treffer:
            intern_extern += 1
            continue
        m = treffer[0]
        gueltig.append(r)
        bogen.append(dict(t='intern', a=l['id'], b=z['id'], sa=stelle(l['id'], m.start(), m.end()), sb=anfang(z['id'])))
    l['refs'] = gueltig

# 2. Botschaft nennt Artikel eines Abkommens
ABK = [('IP-FZA', 618), ('ÄP-FZA', 617), ('IP-MRA', 620), ('IP-LandVA', 622), ('IP-LuftVA', 625),
       ('FZA', 617), ('MRA', 619), ('LandVA', 621), ('LuftVA', 624), ('EUPA', 628), ('EUSPA-Abkommens?', 629),
       ('EUSPA', 629), ('Stromabkommens?', 632), ('StromA', 632), ('Gesundheitsabkommens?', 636), ('Beitragsabkommens?', 630)]
ARTB = re.compile(r'\b(?:Art\.|Artikel|Artikeln)\s+(\d+[a-z]?)(?:\s+(?:Abs\.|Absatz|Absätze)\s+\d+[a-z]?(?:\s+(?:und|bis)\s+\d+)?)?'
                  r'(?:\s+(?:Bst\.|Buchstabe)\s+[a-z])?\s+(?:des\s+|der\s+)?(' + '|'.join(a for a, _ in ABK) + r')\b')
botschaft_offen = 0
for l in bydoc[615]:
    gesehen = set()
    for m in ARTB.finditer(FLACH[l['id']]):
        doc = next(d for a, d in ABK if re.fullmatch(a, m.group(2)))
        z = artikel(doc, m.group(1))
        if not z:
            botschaft_offen += 1
            continue
        if z['id'] in gesehen:
            continue
        gesehen.add(z['id'])
        bogen.append(dict(t='botschaft', a=l['id'], b=z['id'], sa=stelle(l['id'], m.start(), m.end()), sb=anfang(z['id'])))

# 3. Gleicher EU-Rechtsakt in Zetteln verschiedener Dokumente (je Zettelpaar ein Bogen)
idx = collections.defaultdict(list)
for l in leaves:
    for e in l['eu']:
        idx[e].append(l)
paare = collections.defaultdict(set)
for e, ls in idx.items():
    for i, x in enumerate(ls):
        for y in ls[i + 1:]:
            if x['doc'] != y['doc']:
                paare[(x['id'], y['id'])].add(e)


def eu_stelle(lid, e):
    m = re.search(r'(?<![\d/])' + re.escape(e) + r'(?![\d])', FLACH[lid])
    return stelle(lid, m.start(), m.end()) if m else anfang(lid)


for (a, b), es in paare.items():
    e = sorted(es)[0]
    bogen.append(dict(t='eu', a=a, b=b, eu=sorted(es), sa=eu_stelle(a, e), sb=eu_stelle(b, e)))

# 4. Bundesbeschluss genehmigt (Art. 1)
GEN_KEY = {617: ('Änderungsprotokoll', 'Freizügigkeit'), 618: ('Institutionelle', 'Freizügigkeit'),
           619: ('Änderungsprotokoll', 'gegenseitige Anerkennung'), 620: ('Institutionelle', 'gegenseitige Anerkennung'),
           621: ('Änderungsprotokoll', 'Schiene und Strasse'), 622: ('Institutionelle', 'Schiene und Strasse'),
           623: ('Beihilfen', 'Schiene und Strasse'), 624: ('Änderungsprotokoll', 'Luftverkehr'),
           625: ('Institutionelle', 'Luftverkehr'), 626: ('Beihilfen', 'Luftverkehr'),
           627: ('Änderungsprotokoll', 'landwirtschaftlichen'), 628: ('Abkommen', 'Programmen der Union'),
           629: ('Abkommen', 'Weltraumprogramm'), 630: ('Abkommen', 'finanziellen Beitrag'), 632: ('Abkommen', 'Elektrizität'),
           634: ('Protokoll', 'Lebensmittelsicherheit'), 636: ('Abkommen', 'Gesundheit'), 638: ('Protokoll', 'parlamentarische')}
for bb, ds in GENEHMIGT.items():
    q = artikel(bb, '1')
    t = FLACH[q['id']]
    for d in ds:
        art, key = GEN_KEY[d]
        sa = anfang(q['id'])
        for m in re.finditer(re.escape(key), t):
            if art in t[max(0, m.start() - 320):m.start()]:
                vor = t.rfind(art, 0, m.start())
                sa = stelle(q['id'], vor, m.end(), 120)
                break
        bogen.append(dict(t='genehmigt', a=q['id'], b=f'D{d}', sa=sa, sb=None))

# 5. Botschaft-Kapitel 2.x erläutert Dokument
kapitel = {}
for e in erlaeutert:
    nr = e['kap'].split()[0]
    zl = [l for l in bydoc[615] if l['nr'] and (l['nr'] == nr or l['nr'].startswith(nr + '.'))]
    if not zl:
        continue
    kapitel[nr] = dict(titel=e['kap'], von=zl[0]['id'], bis=zl[-1]['id'])
    bogen.append(dict(t='erlaeutert', a=f'K{nr}', b=f"D{e['doc']}", sa=anfang(zl[0]['id']), sb=None))
bogen_zahl = collections.Counter(b['t'] for b in bogen)

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
            doc_eu={str(k): sorted(v) for k, v in doc_eu.items()},
            bogen=bogen, kapitel=kapitel, bogen_offen=dict(botschaft=botschaft_offen, intern_extern=intern_extern))
json.dump(data, open(S / 'vertragsspiegel_daten.json', 'w', encoding='utf8'), ensure_ascii=False, separators=(',', ':'))
print(stats)
print('Botschaft-Einträge', len(entries), 'Kapitel', [k['name'][:40] for k in bot_kap])
print('Blätter je Dok', collections.Counter(l['doc'] for l in leaves).most_common(8))
print('Sankey', len(sankey), collections.Counter(s['gruppe'] for s in sankey))
print('erläutert', len(erlaeutert))
print('Bögen', dict(bogen_zahl), 'total', len(bogen), '| Botschaft-Nennungen ohne Ziel', botschaft_offen, '| interne Verweise als extern verworfen', intern_extern)
print('Matrix max', max(max(r) for r in matrix))
print('Grösse JSON KB', (S / 'vertragsspiegel_daten.json').stat().st_size // 1024)
bw = sum(l['woerter'] for l in leaves if l['doc'] == 615)
print('Botschaft Wörter Blätter', bw, 'vs', docs_out[0]['woerter'])
