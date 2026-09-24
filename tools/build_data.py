#!/usr/bin/env python3
"""raw/ klasöründeki ham verilerden src/data.js üretir."""
import csv, json, math, os, re, sys, unicodedata
sys.path.insert(0, os.path.dirname(__file__))
from content import *          # noqa
from content_nl import *       # noqa

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RAW = os.path.join(ROOT, 'raw')
OUT = os.path.join(ROOT, 'src', 'data.js')
RESEARCH = os.path.join(ROOT, 'research')


def load(name):
    with open(os.path.join(RAW, name), encoding='utf-8') as f:
        return json.load(f)


def tr_cap(s):
    if not s:
        return s
    m = {'i': 'İ', 'ı': 'I', 'ş': 'Ş', 'ç': 'Ç', 'ö': 'Ö', 'ü': 'Ü', 'ğ': 'Ğ'}
    return m.get(s[0], s[0].upper()) + s[1:]


def ascii_fold(s):
    return unicodedata.normalize('NFKD', s).encode('ascii', 'ignore').decode().lower()


# ---------- ülkeler ----------
mled = load('mledoze.json')
pop = {}
with open(os.path.join(RAW, 'pop.csv'), encoding='utf-8') as f:
    for row in csv.DictReader(f):
        pop[row['Country Code']] = int(float(row['Value']))  # son yıl üstüne yazar
POP_EXTRA = {'TW': 23400000, 'XK': 1760000, 'PS': 5400000, 'EH': 600000, 'VA': 800, 'GL': 56600}

places = load('places.geojson')['features']
cap_by_iso = {}
for p in (f['properties'] for f in places):
    if p.get('adm0cap') == 1 or p.get('featurecla', '').startswith('Admin-0 capital'):
        cap_by_iso.setdefault(p['iso_a2'], []).append(p)

KEEP = {c['cca2'] for c in mled if c.get('unMember')} | {'VA', 'PS', 'XK', 'TW', 'GL'}
CONT = {'Europe': 'eu', 'Africa': 'af', 'Asia': 'as', 'Oceania': 'oc'}


def continent(c):
    if c['region'] == 'Americas':
        return 'sa' if c.get('subregion') == 'South America' else 'na'
    return CONT.get(c['region'], 'as')


def currency(code, info, name_tr, name_nl):
    if code in CURRENCY_TR:
        tr = CURRENCY_TR[code]
    else:
        n = info['name'].lower()
        unit = next((u for k, u in CURRENCY_UNIT_TR if k in n), None)
        tr = f'{name_tr} {unit}' if unit else f"{name_tr} {info['name'].split()[-1].capitalize()}"
    if code in CURRENCY_NL:
        nl = CURRENCY_NL[code]
    else:
        n = info['name'].lower()
        unit = next((u for k, u in CURRENCY_UNIT_NL if k in n), None)
        nl = f'{unit} ({name_nl})' if unit else f"{info['name'].split()[-1]} ({name_nl})"
    return {'tr': tr, 'nl': nl, 's': info.get('symbol', '')}


countries = {}
for c in mled:
    cc = c['cca2']
    if cc not in KEEP:
        continue
    name_tr = NAME_TR.get(cc) or tr_cap(c['translations'].get('tur', {}).get('common') or c['name']['common'])
    name_nl = NAME_NL.get(cc) or c['translations'].get('nld', {}).get('common') or c['name']['common']
    cap_en = (c.get('capital') or [''])[0]
    # başkent koordinatı
    cands = cap_by_iso.get(cc, [])
    capll = None
    for p in cands:
        if ascii_fold(p['name']) in ascii_fold(cap_en) or ascii_fold(cap_en) in ascii_fold(p['name']):
            capll = [round(p['latitude'], 3), round(p['longitude'], 3)]
    if not capll and cands:
        p = cands[0]
        capll = [round(p['latitude'], 3), round(p['longitude'], 3)]
    langs = list(c.get('languages', {}).values())
    ltr = [LANG_TR[l] for l in langs if l in LANG_TR]
    lnl = [LANG_NL[l] for l in langs if l in LANG_NL]
    ltr = list(dict.fromkeys(ltr)) or langs[:1]
    lnl = list(dict.fromkeys(lnl)) or langs[:1]
    curs = [currency(k, v, name_tr, name_nl) for k, v in c.get('currencies', {}).items()][:2]
    countries[cc] = {
        'c': cc, 'n3': c.get('ccn3'), 'a3': c['cca3'],
        'tr': name_tr, 'nl': name_nl,
        'str': SHORT_TR.get(cc), 'snl': SHORT_NL.get(cc),
        'cap': {'tr': CAPITAL_TR.get(cc, cap_en), 'nl': CAPITAL_NL.get(cc, cap_en)},
        'capll': capll, 'll': [round(x, 2) for x in c.get('latlng', [0, 0])],
        'k': continent(c), 'area': c.get('area'),
        'pop': pop.get(c['cca3']) or POP_EXTRA.get(cc),
        'lang': {'tr': ltr[:3], 'nl': lnl[:3]}, 'cur': curs,
        'b': c.get('borders', []), 'll0': c.get('landlocked', False),
        'lvl': 1 if cc in EASY else 2 if cc in MEDIUM else 3,
    }
    if cc in NO_QUIZ:
        countries[cc]['nq'] = 1
    f_tr, f_nl = FACTS.get(cc), FACTS_NL.get(cc)
    if f_tr or f_nl:
        countries[cc]['fact'] = {'tr': f_tr or '', 'nl': f_nl or ''}
    if cc in CAPITAL_NOTE:
        countries[cc]['capnote'] = {'tr': CAPITAL_NOTE[cc], 'nl': CAPITAL_NOTE_NL.get(cc, '')}

# iki kıtalı ülkeler
countries['TR']['k2'] = 'eu'
countries['RU']['k2'] = 'as'
countries['KZ']['k2'] = 'eu'
# a3 -> a2 komşular
a3 = {v['a3']: k for k, v in countries.items()}
for v in countries.values():
    v['b'] = [a3[x] for x in v['b'] if x in a3]

MANUAL_CAP = {'GL': [64.18, -51.72], 'XK': [42.66, 21.17], 'NR': [-0.547, 166.92], 'PS': [31.9, 35.2], 'BO': [-19.04, -65.26], 'ZA': [-25.75, 28.19], 'NL': [52.37, 4.9], 'CI': [6.82, -5.28]}
for k, v in MANUAL_CAP.items():
    countries[k]['capll'] = v
missing_cap = [k for k, v in countries.items() if not v['capll']]
print('başkent koordinatı eksik:', missing_cap, file=sys.stderr)

# ---------- topojson ----------
by_n3 = {v['n3']: k for k, v in countries.items() if v['n3']}


def tag_topo(name):
    t = load(name)
    geoms = t['objects']['countries']['geometries']
    for g in geoms:
        nm = g['properties'].get('name')
        code = by_n3.get(g.get('id'))
        if nm == 'Kosovo':
            code = 'XK'
        elif nm == 'Somaliland':
            code = 'SO'
        elif nm == 'N. Cyprus':
            code = 'NCY'
        elif nm == 'Antarctica':
            code = 'AQ'
        elif nm == 'W. Sahara':
            code = 'EH'
        g['properties'] = {'c': code or ''}
        g.pop('id', None)
    t['objects'] = {'countries': t['objects']['countries']}
    return t


topo50 = tag_topo('c50.json')
topo110 = tag_topo('c110.json')
in_topo = {g['properties']['c'] for g in topo50['objects']['countries']['geometries']}
tiny = sorted(k for k in countries if k not in in_topo)
print('haritada olmayan ülkeler (nokta ile gösterilecek):', tiny, file=sys.stderr)
for k in countries:
    a = countries[k]['area'] or 0
    if k not in in_topo or a < 12000:
        countries[k]['dot'] = 1


# ---------- nehirler ----------
def simplify(pts, tol):
    if len(pts) < 3:
        return pts
    def d(p, a, b):
        (x, y), (x1, y1), (x2, y2) = p, a, b
        dx, dy = x2 - x1, y2 - y1
        if dx == dy == 0:
            return math.hypot(x - x1, y - y1)
        t = max(0, min(1, ((x - x1) * dx + (y - y1) * dy) / (dx * dx + dy * dy)))
        return math.hypot(x - x1 - t * dx, y - y1 - t * dy)
    mx, idx = 0, 0
    for i in range(1, len(pts) - 1):
        dd = d(pts[i], pts[0], pts[-1])
        if dd > mx:
            mx, idx = dd, i
    if mx > tol:
        return simplify(pts[:idx + 1], tol)[:-1] + simplify(pts[idx:], tol)
    return [pts[0], pts[-1]]


rivers10 = json.load(open(os.path.join(RAW, 'rivers10.geojson'), encoding='utf-8'))['features']
rivers_out = []
for rid, name_tr, ne_names, fact_tr in RIVERS:
    lines = []
    for f in rivers10:
        nm = f['properties'].get('name') or ''
        if nm in ne_names:
            g = f['geometry']
            ls = g['coordinates'] if g['type'] == 'MultiLineString' else [g['coordinates']]
            for l in ls:
                s = simplify([[round(x, 3), round(y, 3)] for x, y in l], 0.03)
                s = [[round(x, 2), round(y, 2)] for x, y in s]
                if len(s) >= 2:
                    lines.append(s)
    if not lines:
        print('nehir bulunamadı:', rid, file=sys.stderr)
        continue
    nm_nl, f_nl = FEATURES_NL[rid]
    rivers_out.append({'id': rid, 'kind': 'river', 'tr': name_tr, 'nl': nm_nl,
                       'fact': {'tr': fact_tr, 'nl': f_nl}, 'lines': lines,
                       'tk': 1 if rid in ('firat', 'dicle', 'kizilirmak', 'sakarya', 'aras', 'menderes', 'ceyhan', 'meric') else 0})

# ---------- göller ----------
lakes_src = load('lakes.geojson')['features']
lakes_out = []
for lid, name_tr, ne_names, fact_tr, lat, lon in LAKES:
    polys = []
    for f in lakes_src:
        nm = f['properties'].get('name') or ''
        if nm in ne_names:
            g = f['geometry']
            ps = g['coordinates'] if g['type'] == 'MultiPolygon' else [g['coordinates']]
            for p in ps:
                ring = simplify([[round(x, 3), round(y, 3)] for x, y in p[0]], 0.02)
                ring = [[round(x, 2), round(y, 2)] for x, y in ring]
                if len(ring) >= 4:
                    polys.append([ring])
    nm_nl, f_nl = FEATURES_NL[lid]
    item = {'id': lid, 'kind': 'lake', 'tr': name_tr, 'nl': nm_nl, 'fact': {'tr': fact_tr, 'nl': f_nl},
            'll': [lat, lon], 'tk': 1 if lid in ('van_g', 'tuz') else 0}
    if polys:
        item['polys'] = polys
    else:
        print('göl poligonu yok (nokta):', lid, file=sys.stderr)
    lakes_out.append(item)


# ---------- noktalar ----------
def feat(fid, kind, name_tr, lat, lon, fact_tr, cc=None, tk=0, **extra):
    nm_nl, f_nl = FEATURES_NL[fid]
    d = {'id': fid, 'kind': kind, 'tr': name_tr, 'nl': nm_nl, 'll': [lat, lon],
         'fact': {'tr': fact_tr, 'nl': f_nl}}
    if cc:
        d['cc'] = cc
    if tk or cc == 'TR':
        d['tk'] = 1
    d.update(extra)
    return d


points = []
for fid, n, lat, lon, fact, cc in PEAKS:
    points.append(feat(fid, 'peak', n, lat, lon, fact, cc))
for fid, n, lat, lon, fact in DESERTS:
    points.append(feat(fid, 'desert', n, lat, lon, fact))
for fid, n, lat, lon, kind, fact in SEAS:
    points.append(feat(fid, kind, n, lat, lon, fact, tk=fid in ('akdeniz', 'karadeniz', 'ege', 'marmara')))
for fid, n, lat, lon, fact in STRAITS:
    points.append(feat(fid, 'strait', n, lat, lon, fact, tk=fid in ('istanbulbogazi', 'canakkale')))
for fid, n, lat, lon, fact, cc in LANDMARKS:
    points.append(feat(fid, 'landmark', n, lat, lon, fact, cc))
for fid, n, lat, lon, fact, cc in CITIES:
    if n:
        points.append(feat(fid, 'city', n, lat, lon, fact, cc))
ranges_out = []
for fid, n, line, fact in RANGES:
    mid = line[len(line) // 2]
    ranges_out.append(feat(fid, 'range', n, mid[1], mid[0], fact, tk=fid in ('toros', 'kanadolu'), line=line))

# ---------- bayraklar ----------
flags = {}
fdir = os.path.join(RAW, 'package', 'flags', '4x3')
for k in countries:
    p = os.path.join(fdir, k.lower() + '.svg')
    if os.path.exists(p):
        s = open(p, encoding='utf-8').read()
        s = re.sub(r'<!--.*?-->', '', s, flags=re.S)
        s = re.sub(r'>\s+<', '><', s).strip()
        flags[k] = s
    else:
        print('bayrak yok:', k, file=sys.stderr)

# ---------- ders kitabı araştırması (varsa) ----------
research = {}
for fn in ('topografie.json', 'chapters_a.json', 'chapters_b.json'):
    p = os.path.join(RESEARCH, fn)
    if os.path.exists(p):
        try:
            research[fn.split('.')[0]] = json.load(open(p, encoding='utf-8'))
        except Exception as e:
            print('araştırma dosyası okunamadı', fn, e, file=sys.stderr)

data = {
    'countries': countries, 'rivers': rivers_out, 'lakes': lakes_out,
    'points': points, 'ranges': ranges_out, 'research': research,
}
with open(OUT, 'w', encoding='utf-8') as f:
    f.write('window.GEO=' + json.dumps(data, ensure_ascii=False, separators=(',', ':')) + ';\n')
    f.write('window.TOPO50=' + json.dumps(topo50, separators=(',', ':')) + ';\n')
    f.write('window.TOPO110=' + json.dumps(topo110, separators=(',', ':')) + ';\n')
    f.write('window.FLAGS=' + json.dumps(flags, ensure_ascii=False, separators=(',', ':')) + ';\n')
print('yazıldı', OUT, os.path.getsize(OUT) // 1024, 'KB; ülke', len(countries), 'nehir', len(rivers_out),
      'göl', len(lakes_out), 'nokta', len(points), file=sys.stderr)
