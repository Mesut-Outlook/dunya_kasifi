/* Dünya Kaşifi / Wereldontdekker — atlas + küre + oyunlar (TR/NL) */
(function () {
'use strict';
const GEO = window.GEO, C = GEO.countries, FLAGS = window.FLAGS;

// ---------------------------------------------------------------- yardımcılar
const $ = s => document.querySelector(s);
const store = {
  get(k, d) { try { const v = localStorage.getItem('dk_' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem('dk_' + k, JSON.stringify(v)); } catch (e) { /* yok say */ } }
};
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.random() * (i + 1) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; };
const pick = a => a[Math.random() * a.length | 0];
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const flagCache = {};
function flagURL(c) {
  if (!FLAGS[c]) return '';
  return flagCache[c] || (flagCache[c] = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(FLAGS[c]));
}

// ---------------------------------------------------------------- dil
let lang = store.get('lang', 'tr');
let dualOn = store.get('dual', true);
const other = () => (lang === 'tr' ? 'nl' : 'tr');
const T = {
  tr: {
    title: 'Dünya Kaşifi', sub: 'Atlas · Küre · Oyunlar', explore: 'Keşfet', play: 'Oyna', atlas: 'Atlas', globe: 'Küre',
    search: 'Ülke, başkent, nehir, dağ ara…', dual: 'İki dili birlikte göster', sound: 'Ses',
    passport: 'Pasaport: oyunlarda doğru bildiğin ülkeler', home: 'Tüm dünya',
    l_names: 'Ülke adları', l_cap: 'Başkentler', l_city: 'Şehirler', l_river: 'Nehir & göl', l_mount: 'Dağlar',
    l_sea: 'Deniz & okyanus', l_desert: 'Çöller', l_wonder: 'Harikalar', l_school: 'buiteNLand',
    capital: 'Başkent', continent: 'Kıta', population: 'Nüfus', area: 'Yüzölçümü', language: 'Dil', currency: 'Para birimi',
    neighbors: 'Komşuları', noNeighbors: 'Kara komşusu yok (ada ülkesi)', landlocked: 'Denize kıyısı yok',
    didyouknow: 'Biliyor musun?', listen: 'Dinle', hudMin: 'Soruyu küçült / büyüt', showCap: 'Başkenti göster', stamp: 'Pasaportta',
    size_vs: (x, w) => x >= 1 ? `${w.gen} ${fmtNum(x)} katı` : `${w.abl} ${fmtNum(1 / x)} kat küçük`,
    size_same: w => `${w.name} ile hemen hemen aynı büyüklükte`,
    million: 'milyon', billion: 'milyar', thousand: 'bin', people: 'kişi',
    k: { eu: 'Avrupa', as: 'Asya', af: 'Afrika', na: 'Kuzey Amerika', sa: 'Güney Amerika', oc: 'Okyanusya' },
    kind: { peak: 'Dağ', range: 'Dağ sırası', desert: 'Çöl', landmark: 'Dünya harikası', city: 'Şehir', sea: 'Deniz', ocean: 'Okyanus', strait: 'Boğaz / kanal', lake: 'Göl', river: 'Nehir', school: 'buiteNLand', country: 'Ülke' },
    welcomeT: 'Merhaba kaşif!', welcomeB: ['Haritada bir ülkeye tıkla: başkenti, nüfusu, dili ve ilginç bilgileri gör.', 'Üstten <b>Atlas</b> ile <b>Küre</b> arasında geçiş yap; küreyi sürükleyerek, iki parmakla kaydırarak ya da ok tuşlarıyla çevir.', 'Aşağıdaki düğmelerle nehirleri, dağları, denizleri aç/kapat.', '<b>Oyna</b> ile tek başına ya da ailece yarış!'],
    playNow: 'Oyuna başla', chooseGame: 'Hangi oyun?', region: 'Bölge', level: 'Zorluk', players: 'Oyuncular', perPlayer: 'Oyuncu başına soru',
    all: 'Tüm dünya', tkOnly: 'Türkiye', lv: ['Kolay', 'Orta', 'Zor'], lvDesc: ['bilinen ülkeler', 'daha fazla ülke', 'bütün ülkeler'],
    addPlayer: 'Oyuncu ekle', player: 'Oyuncu', start: 'Başla!', cancel: 'Vazgeç',
    g: {
      find: ['Haritada bul', 'Söylenen ülkeyi haritada bul ve tıkla.'],
      name: ['Bu hangi ülke?', 'Parlayan ülkenin adını seç.'],
      capital: ['Başkentler', 'Ülkenin başkentini ya da başkentin ülkesini bil.'],
      flag: ['Bayraklar', 'Bayrağa bak, ülkeyi tahmin et.'],
      place: ['Coğrafya avı', 'Nehirler, dağlar, denizler, şehirler ve harikalar.'],
      mix: ['Karışık', 'Hepsinden biraz!'],
      school: ['buiteNLand', 'Okul kitabından kavramlar ve sorular (HAVO 3).'],
    },
    q_find: n => `<b>${n}</b> haritada nerede? Tıkla!`,
    q_name: 'Parlayan ülke hangisi?',
    q_capOf: n => `<b>${n}</b> ülkesinin başkenti hangisi?`,
    q_capWho: n => `<b>${n}</b> hangi ülkenin başkenti?`,
    q_flag: 'Bu bayrak hangi ülkenin?',
    q_flagOf: n => `<b>${n}</b> ülkesinin bayrağı hangisi?`,
    q_which: k => `Haritada parlayan ${k.toLocaleLowerCase('tr')} hangisi?`,
    q_where: n => `<b>${n}</b> nerede? Haritada tahmin ettiğin yere tıkla.`,
    q_concept: 'Bu tanım hangi kavrama ait?',
    turnOf: n => `Sıra: ${n}`, q: 'Soru',
    right: ['Harika!', 'Süper!', 'Doğru!', 'Bravo!', 'Aferin!'], wrong: 'Olmadı…', correctIs: 'Doğru cevap:',
    thisIs: n => `Bu ${n}. Tekrar dene!`, triesLeft: n => `${n} hakkın kaldı.`,
    kmAway: km => `${km} km uzaktaydın.`, next: 'Sonraki', finish: 'Sonuçlar', points: 'puan', streak: 'seri',
    endT: 'Oyun bitti!', winner: n => `Kazanan: ${n}`, draw: 'Berabere!', again: 'Tekrar oyna', menu: 'Oyun menüsü', toExplore: 'Keşfete dön',
    review: 'Tekrar çalışılacaklar', perfect: 'Hiç hata yok. Mükemmel!',
    quitQ: 'Oyundan çık', chapters: 'Bölüm', noSchool: 'Okul içeriği henüz eklenmedi.',
    passT: 'Pasaportum', passB: n => `Oyunlarda ${n} ülkeyi doğru bildin. Her doğru cevap pasaportuna bir damga ekler.`,
    reset: 'Sıfırla', close: 'Kapat', flyTo: 'Haritada göster', inCountry: 'Ülke',
    tests: 'Testler', testsT: 'Testler', testsB: 'Her test sabit 10–15 sorudan oluşur. Hollanda usulü not: 1–10, 5,5 ve üstü geçer. En iyi notun kaydedilir.',
    questionsN: n => `${n} soru`, best: 'En iyi', voldoende: 'Geçtin! (voldoende)', onvoldoende: 'Kaldın (onvoldoende)', correctN: (a, n) => `${n} sorudan ${a} doğru`,
    gradeExplain: 'Not 1–10 · 5,5 ve üstü geçer', fouten: 'Hata turu', retry: 'Testi tekrarla', otherTest: 'Başka test',
    hintFind: 'İpucu: haritayı yakınlaştırmak için tekerleği ya da iki parmağını kullan.',
  },
  nl: {
    title: 'Wereldontdekker', sub: 'Atlas · Globe · Spellen', explore: 'Ontdek', play: 'Speel', atlas: 'Atlas', globe: 'Globe',
    search: 'Zoek land, hoofdstad, rivier, berg…', dual: 'Beide talen tonen', sound: 'Geluid',
    passport: 'Paspoort: landen die je goed had in de spellen', home: 'Hele wereld',
    l_names: 'Landnamen', l_cap: 'Hoofdsteden', l_city: 'Steden', l_river: 'Rivieren & meren', l_mount: 'Bergen',
    l_sea: 'Zeeën & oceanen', l_desert: 'Woestijnen', l_wonder: 'Wonderen', l_school: 'buiteNLand',
    capital: 'Hoofdstad', continent: 'Werelddeel', population: 'Inwoners', area: 'Oppervlakte', language: 'Taal', currency: 'Munteenheid',
    neighbors: 'Buurlanden', noNeighbors: 'Geen buurlanden over land (eiland)', landlocked: 'Geen zee',
    didyouknow: 'Wist je dat?', listen: 'Luister', hudMin: 'Vraag verkleinen / vergroten', showCap: 'Toon hoofdstad', stamp: 'In paspoort',
    size_vs: (x, w) => x >= 1 ? `${fmtNum(x)} keer zo groot als ${w.name}` : `${fmtNum(1 / x)} keer zo klein als ${w.name}`,
    size_same: w => `ongeveer even groot als ${w.name}`,
    million: 'miljoen', billion: 'miljard', thousand: 'duizend', people: 'mensen',
    k: { eu: 'Europa', as: 'Azië', af: 'Afrika', na: 'Noord-Amerika', sa: 'Zuid-Amerika', oc: 'Oceanië' },
    kind: { peak: 'Berg', range: 'Gebergte', desert: 'Woestijn', landmark: 'Wereldwonder', city: 'Stad', sea: 'Zee', ocean: 'Oceaan', strait: 'Zee-engte / kanaal', lake: 'Meer', river: 'Rivier', school: 'buiteNLand', country: 'Land' },
    welcomeT: 'Hoi ontdekker!', welcomeB: ['Klik op een land: zie de hoofdstad, inwoners, taal en leuke weetjes.', 'Wissel bovenin tussen <b>Atlas</b> en <b>Globe</b>; draai de globe door te slepen, met twee vingers te scrollen of met de pijltjestoetsen.', 'Zet met de knoppen onderin rivieren, bergen en zeeën aan of uit.', 'Met <b>Speel</b> oefen je alleen of speel je tegen elkaar!'],
    playNow: 'Start een spel', chooseGame: 'Welk spel?', region: 'Gebied', level: 'Niveau', players: 'Spelers', perPlayer: 'Vragen per speler',
    all: 'Hele wereld', tkOnly: 'Turkije', lv: ['Makkelijk', 'Gemiddeld', 'Moeilijk'], lvDesc: ['bekende landen', 'meer landen', 'alle landen'],
    addPlayer: 'Speler toevoegen', player: 'Speler', start: 'Start!', cancel: 'Annuleren',
    g: {
      find: ['Vind op de kaart', 'Zoek het genoemde land en klik erop.'],
      name: ['Welk land is dit?', 'Kies de naam van het oplichtende land.'],
      capital: ['Hoofdsteden', 'Ken de hoofdstad van het land, of het land van de hoofdstad.'],
      flag: ['Vlaggen', 'Kijk naar de vlag en raad het land.'],
      place: ['Topo-jacht', 'Rivieren, bergen, zeeën, steden en wonderen.'],
      mix: ['Mix', 'Van alles een beetje!'],
      school: ['buiteNLand', 'Begrippen en vragen uit je schoolboek (havo 3).'],
    },
    q_find: n => `Waar ligt <b>${n}</b>? Klik op de kaart!`,
    q_name: 'Welk land licht op?',
    q_capOf: n => `Wat is de hoofdstad van <b>${n}</b>?`,
    q_capWho: n => `Van welk land is <b>${n}</b> de hoofdstad?`,
    q_flag: 'Van welk land is deze vlag?',
    q_flagOf: n => `Welke vlag hoort bij <b>${n}</b>?`,
    q_which: k => `Welke ${k.toLowerCase()} licht op op de kaart?`,
    q_where: n => `Waar ligt <b>${n}</b>? Klik op de plek die jij denkt.`,
    q_concept: 'Bij welk begrip hoort deze omschrijving?',
    turnOf: n => `Aan de beurt: ${n}`, q: 'Vraag',
    right: ['Goed zo!', 'Super!', 'Klopt!', 'Top!', 'Knap!'], wrong: 'Helaas…', correctIs: 'Het goede antwoord:',
    thisIs: n => `Dit is ${n}. Probeer opnieuw!`, triesLeft: n => `Nog ${n} kans${n > 1 ? 'en' : ''}.`,
    kmAway: km => `Je zat er ${km} km naast.`, next: 'Volgende', finish: 'Uitslag', points: 'punten', streak: 'reeks',
    endT: 'Einde spel!', winner: n => `Winnaar: ${n}`, draw: 'Gelijkspel!', again: 'Nog een keer', menu: 'Spelmenu', toExplore: 'Terug naar ontdekken',
    review: 'Nog even oefenen', perfect: 'Geen enkele fout. Perfect!',
    quitQ: 'Stop spel', chapters: 'Hoofdstuk', noSchool: 'Er is nog geen schoolinhoud toegevoegd.',
    passT: 'Mijn paspoort', passB: n => `Je had ${n} landen goed in de spellen. Elk goed antwoord geeft een stempel in je paspoort.`,
    reset: 'Wissen', close: 'Sluiten', flyTo: 'Toon op kaart', inCountry: 'Land',
    tests: 'Toetsen', testsT: 'Toetsen', testsB: 'Elke toets heeft vaste 10–15 vragen. Cijfer 1–10, voldoende vanaf 5,5. Je beste cijfer wordt bewaard.',
    questionsN: n => `${n} vragen`, best: 'Beste', voldoende: 'Voldoende!', onvoldoende: 'Onvoldoende', correctN: (a, n) => `${a} van de ${n} goed`,
    gradeExplain: 'Cijfer 1–10 · voldoende vanaf 5,5', fouten: 'Foutenronde', retry: 'Opnieuw', otherTest: 'Andere toets',
    hintFind: 'Tip: zoom in met het scrollwiel of met twee vingers.',
  }
};
const t = () => T[lang];
const L = o => (o == null ? '' : typeof o === 'string' ? o : (o[lang] || o[other()] || ''));
const L2 = o => (o == null || typeof o === 'string' ? '' : o[other()] || '');
function dual(o, cls) {
  const a = L(o), b = L2(o);
  return esc(a) + (dualOn && b && b !== a ? ` <span class="alt ${cls || ''}">${esc(b)}</span>` : '');
}
const cname = c => (C[c] ? C[c][lang] : c);
const cnameObj = c => (C[c] ? { tr: C[c].tr, nl: C[c].nl } : { tr: c, nl: c });
function fmtNum(x) {
  const loc = lang === 'tr' ? 'tr-TR' : 'nl-NL';
  return x >= 10 ? Math.round(x).toLocaleString(loc) : x.toLocaleString(loc, { maximumFractionDigits: 1 });
}
function fmtPop(n) {
  if (!n) return '—';
  if (n >= 1e9) return fmtNum(n / 1e9) + ' ' + t().billion;
  if (n >= 1e6) return fmtNum(n / 1e6) + ' ' + t().million;
  if (n >= 1e4) return fmtNum(n / 1e3) + ' ' + t().thousand;
  return n.toLocaleString(lang === 'tr' ? 'tr-TR' : 'nl-NL');
}

// ---------------------------------------------------------------- ses
let soundOn = store.get('sound', true);
let actx = null;
function tone(seq) {
  if (!soundOn) return;
  try {
    actx = actx || new (window.AudioContext || window.webkitAudioContext)();
    let tt = actx.currentTime;
    seq.forEach(([f, d, type]) => {
      const o = actx.createOscillator(), g = actx.createGain();
      o.type = type || 'triangle'; o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, tt); g.gain.exponentialRampToValueAtTime(0.18, tt + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, tt + d);
      o.connect(g); g.connect(actx.destination); o.start(tt); o.stop(tt + d + 0.02); tt += d * 0.8;
    });
  } catch (e) { /* ses yok */ }
}
const sfx = {
  good: () => tone([[660, .12], [880, .12], [1320, .22]]),
  bad: () => tone([[300, .18, 'square'], [220, .28, 'square']]),
  click: () => tone([[520, .06]]),
  win: () => tone([[523, .15], [659, .15], [784, .15], [1047, .4]]),
};
function speak(text, lg) {
  if (!('speechSynthesis' in window) || !text) return;
  try {
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text.replace(/<[^>]+>/g, ''));
    u.lang = (lg || lang) === 'tr' ? 'tr-TR' : 'nl-NL';
    const v = speechSynthesis.getVoices().find(v => v.lang && v.lang.toLowerCase().startsWith((lg || lang)));
    if (v) u.voice = v;
    u.rate = 0.95;
    speechSynthesis.speak(u);
  } catch (e) { /* konuşma yok */ }
}

// ---------------------------------------------------------------- konfeti
const cv = $('#confetti'), cx = cv.getContext('2d');
let parts = [], confRAF = 0;
function confetti(n) {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const r = cv.getBoundingClientRect(); cv.width = r.width; cv.height = r.height;
  const cols = ['#FF5D73', '#FFC53D', '#22A565', '#3B82F6', '#A855F7', '#fff'];
  for (let i = 0; i < n; i++) parts.push({ x: r.width / 2 + (Math.random() - .5) * 200, y: r.height * .35, vx: (Math.random() - .5) * 12, vy: -Math.random() * 12 - 4, s: 4 + Math.random() * 6, c: pick(cols), a: Math.random() * 6, life: 90 + Math.random() * 60 });
  if (!confRAF) confRAF = requestAnimationFrame(stepConf);
}
function stepConf() {
  cx.clearRect(0, 0, cv.width, cv.height);
  parts = parts.filter(p => p.life > 0);
  parts.forEach(p => { p.vy += .35; p.x += p.vx; p.y += p.vy; p.a += .2; p.life--; cx.save(); cx.translate(p.x, p.y); cx.rotate(p.a); cx.fillStyle = p.c; cx.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2); cx.restore(); });
  confRAF = parts.length ? requestAnimationFrame(stepConf) : 0;
  if (!parts.length) cx.clearRect(0, 0, cv.width, cv.height);
}

// ---------------------------------------------------------------- veri hazırlığı
const EXTRA = {
  AQ: { tr: 'Antarktika', nl: 'Antarctica', fact: { tr: 'Dünyanın en soğuk, en rüzgârlı ve en kuru kıtasıdır. Hiçbir ülkeye ait değildir; sadece araştırma istasyonlarında bilim insanları yaşar. Dünyadaki buzun yaklaşık %90\'ı buradadır.', nl: 'Het koudste, winderigste en droogste werelddeel. Het is van geen enkel land; er wonen alleen onderzoekers in onderzoeksstations. Ongeveer 90% van al het ijs op aarde ligt hier.' } },
  NCY: { tr: 'Kuzey Kıbrıs Türk Cumhuriyeti', nl: 'Turkse Republiek Noord-Cyprus', fact: { tr: '1983\'te kuruldu. Başkenti Lefkoşa\'nın kuzeyidir. Yalnızca Türkiye tarafından tanınır.', nl: 'Uitgeroepen in 1983. De hoofdstad is het noorden van Nicosia. Alleen Turkije erkent het als land.' } },
  EH: { tr: 'Batı Sahra', nl: 'Westelijke Sahara', fact: { tr: 'Statüsü tartışmalı bir bölgedir; büyük bölümü Fas tarafından yönetilir.', nl: 'Een gebied waarvan de status omstreden is; het grootste deel wordt bestuurd door Marokko.' } },
};
const FEAT = {};            // id -> nokta/nehir/göl/dağ sırası
GEO.points.forEach(p => { FEAT[p.id] = p; });
GEO.rivers.forEach(r => { FEAT[r.id] = r; r.geom = { type: 'MultiLineString', coordinates: r.lines }; let best = r.lines[0]; r.lines.forEach(l => { if (l.length > best.length) best = l; }); const m = best[best.length >> 1]; r.ll = [m[1], m[0]]; });
GEO.lakes.forEach(l => { FEAT[l.id] = l; if (l.polys) l.geom = { type: 'MultiPolygon', coordinates: l.polys }; });
GEO.ranges.forEach(r => { FEAT[r.id] = r; r.geom = { type: 'LineString', coordinates: r.line }; });

// okul (buiteNLand) içeriği
const SCHOOL = { chapters: [], places: [] };
(function () {
  const R = GEO.research || {};
  ['chapters_a', 'chapters_b'].forEach(k => { if (R[k] && R[k].chapters) SCHOOL.chapters.push(...R[k].chapters); });
  const seen = new Set();
  const addPlace = (p, ch) => {
    if (p.lat == null || p.lon == null || !(p.name_nl || p.name_tr)) return;
    const key = (p.name_nl || p.name_tr).toLowerCase();
    if (seen.has(key)) { const ex = SCHOOL.places.find(x => x.key === key); if (ex && (p.fact_nl || p.note_nl) && !ex.fact.nl) ex.fact = { nl: p.fact_nl || p.note_nl || '', tr: p.fact_tr || '' }; return; }
    seen.add(key);
    const id = 'sch_' + SCHOOL.places.length;
    const it = { id, key, kind: 'school', tr: p.name_tr || p.name_nl, nl: p.name_nl || p.name_tr, ll: [p.lat, p.lon], cc: p.country && C[p.country] ? p.country : null, ch, fact: { nl: p.fact_nl || p.note_nl || '', tr: p.fact_tr || '' }, ptype: p.type };
    SCHOOL.places.push(it); FEAT[id] = it;
  };
  SCHOOL.chapters.forEach(ch => (ch.places || []).forEach(p => addPlace(p, ch.id)));
  if (R.topografie && R.topografie.sections) R.topografie.sections.forEach(s => (s.items || []).forEach(p => addPlace(p, s.chapter)));
})();
const HAS_SCHOOL = SCHOOL.chapters.some(ch => (ch.questions || []).length || (ch.concepts || []).length);

const QUIZ_CODES = Object.keys(C).filter(c => !C[c].nq);
let stamps = new Set(store.get('stamps', []));

// ---------------------------------------------------------------- harita
const stage = $('#stage');
const svg = d3.select('#map');
let W = 800, H = 600;
const defs = svg.append('defs');
const og = defs.append('radialGradient').attr('id', 'oceanGrad').attr('cx', '38%').attr('cy', '32%').attr('r', '75%');
og.append('stop').attr('offset', '0%').attr('stop-color', '#C4ECFA');
og.append('stop').attr('offset', '60%').attr('stop-color', '#6FC1E6');
og.append('stop').attr('offset', '100%').attr('stop-color', '#2F7FB5');
const gGeo = svg.append('g');
const sphereP = gGeo.append('path').attr('class', 'sphere');
const gratP = gGeo.append('path').attr('class', 'grat');
const eqP = gGeo.append('path').attr('class', 'equator');
const gHi = gGeo.append('g'), gLo = gGeo.append('g').style('display', 'none');
const gLakes = gGeo.append('g'), gRivers = gGeo.append('g'), gRanges = gGeo.append('g'), gHL = gGeo.append('g');
const gPts = svg.append('g'), gPins = svg.append('g');
const graticule = d3.geoGraticule10();
const equator = { type: 'LineString', coordinates: d3.range(-180, 181, 5).map(x => [x, 0]) };

const topoHi = window.TOPO50, topoLo = window.TOPO110;
const featHi = topojson.feature(topoHi, topoHi.objects.countries).features;
const featLo = topojson.feature(topoLo, topoLo.objects.countries).features;
const PAL = ['#F9D56E', '#F4A7A0', '#9FD69B', '#C5B3E6', '#F8BB86', '#8DD5CB'];
const colorOf = {};
(function colorize() {
  const geoms = topoHi.objects.countries.geometries;
  const nb = topojson.neighbors(geoms);
  const order = d3.range(geoms.length).sort((a, b) => nb[b].length - nb[a].length);
  order.forEach(i => {
    const c = geoms[i].properties.c; if (!c || colorOf[c] != null) return;
    const used = new Set(nb[i].map(j => colorOf[geoms[j].properties.c]));
    let k = 0; while (used.has(k) && k < PAL.length) k++;
    colorOf[c] = k % PAL.length;
  });
})();
const selectable = c => !!(C[c] || EXTRA[c]);
function countryClass(d) {
  const c = d.properties.c;
  return 'country' + (c === 'AQ' ? ' aq' : '') + (!selectable(c) ? ' nc' : '');
}
function drawCountries(g, feats) {
  g.selectAll('path').data(feats).join('path')
    .attr('class', countryClass).attr('data-c', d => d.properties.c)
    .style('fill', d => (C[d.properties.c] || d.properties.c === 'NCY' || d.properties.c === 'EH') ? PAL[colorOf[d.properties.c] || 0] : null);
}
drawCountries(gHi, featHi); drawCountries(gLo, featLo);
const featByCode = {};
featHi.forEach(f => { const c = f.properties.c; if (!c) return; if (!featByCode[c]) featByCode[c] = { type: 'Feature', geometry: { type: 'MultiPolygon', coordinates: [] } }; const g = f.geometry; featByCode[c].geometry.coordinates.push(...(g.type === 'Polygon' ? [g.coordinates] : g.coordinates)); });

gRivers.selectAll('path.river').data(GEO.rivers).join('path').attr('class', d => 'river' + (d.tk ? ' tk' : ''));
gRivers.selectAll('path.river-hit').data(GEO.rivers).join('path').attr('class', 'river-hit').attr('data-p', d => d.id);
gLakes.selectAll('path').data(GEO.lakes.filter(l => l.geom)).join('path').attr('class', 'lake').attr('data-p', d => d.id);
gRanges.selectAll('path.range').data(GEO.ranges).join('path').attr('class', 'range');
gRanges.selectAll('path.range-hit').data(GEO.ranges).join('path').attr('class', 'range-hit').attr('data-p', d => d.id);

// ---- nokta katmanı
const LAYERS = [
  { id: 'names', sw: '#F9D56E' }, { id: 'cap', sw: '#fff', star: 1 }, { id: 'city', sw: '#1B2A41' },
  { id: 'river', sw: '#3B8FD0' }, { id: 'mount', sw: '#9A6A3A' }, { id: 'sea', sw: '#A8DCF0' },
  { id: 'desert', sw: '#E9C46A' }, { id: 'wonder', sw: '#A855F7' },
];
if (SCHOOL.places.length) LAYERS.push({ id: 'school', sw: '#0EA5A4' });
const layerOn = Object.assign({ names: 1, cap: 1, city: 1, river: 1, mount: 1, sea: 1, desert: 1, wonder: 1, school: 1 }, store.get('layers', {}));
const LAYER_OF = { peak: 'mount', range: 'mount', desert: 'desert', landmark: 'wonder', city: 'city', sea: 'sea', ocean: 'sea', strait: 'sea', lake: 'river', river: 'river', school: 'school' };
// [işaret için min zoom, etiket için min zoom]
const ZL = { cap: [1.4, 2.4], city: [2, 3], peak: [1, 2.6], range: [99, 1.8], desert: [99, 1.3], landmark: [1.6, 2.8], sea: [99, 1.7], ocean: [99, 0], strait: [3, 3.6], lake: [99, 2.6], river: [99, 2.6], school: [2.2, 3.2], dot: [0, 99] };
const PT = [];
Object.keys(C).forEach(c => {
  const d = C[c];
  PT.push({ key: 'lab_' + c, kind: 'clabel', ll: d.ll, c, size: Math.sqrt(d.area || 1) });
  if (d.capll) PT.push({ key: 'cap_' + c, kind: 'cap', ll: d.capll, c });
  if (d.dot) PT.push({ key: 'dot_' + c, kind: 'dot', ll: d.ll, c });
});
[...GEO.points, ...GEO.rivers, ...GEO.lakes, ...GEO.ranges, ...SCHOOL.places].forEach(f => PT.push({ key: f.id, kind: f.kind, ll: f.ll, f }));
const STAR = 'M0,-5.5L1.6,-1.8L5.5,-1.7L2.5,0.8L3.4,4.6L0,2.4L-3.4,4.6L-2.5,0.8L-5.5,-1.7L-1.6,-1.8Z';
const ptSel = gPts.selectAll('g').data(PT).join('g')
  .attr('class', d => 'pt ' + d.kind + (d.f && d.f.kind === 'ocean' ? ' ocean' : ''))
  .attr('data-p', d => d.f ? d.f.id : (d.kind === 'cap' ? 'cap_' + d.c : null))
  .attr('data-c', d => (d.kind === 'dot' ? d.c : null))
  .each(function (d) {
    const g = d3.select(this);
    const k = d.kind;
    if (k === 'cap') { g.append('circle').attr('r', 5.2).attr('fill', '#fff').attr('stroke', '#1B2A41').attr('stroke-width', 1.6); g.append('path').attr('d', STAR).attr('transform', 'scale(.62)').attr('fill', '#FF5D73'); }
    else if (k === 'city') g.append('circle').attr('r', 3.2).attr('fill', '#1B2A41').attr('stroke', '#fff').attr('stroke-width', 1.2);
    else if (k === 'peak') g.append('path').attr('d', 'M0,-6L6,5H-6Z').attr('fill', '#9A6A3A').attr('stroke', '#fff').attr('stroke-width', 1.3);
    else if (k === 'landmark') g.append('path').attr('d', 'M0,-6L6,0L0,6L-6,0Z').attr('fill', '#A855F7').attr('stroke', '#fff').attr('stroke-width', 1.4);
    else if (k === 'strait') g.append('circle').attr('r', 4).attr('fill', '#fff').attr('stroke', '#3B8FD0').attr('stroke-width', 2.4);
    else if (k === 'school') g.append('rect').attr('x', -4.5).attr('y', -4.5).attr('width', 9).attr('height', 9).attr('rx', 2).attr('fill', '#0EA5A4').attr('stroke', '#fff').attr('stroke-width', 1.4);
    else if (k === 'dot') g.append('circle').attr('r', 4.2).attr('fill', PAL[colorOf[d.c] || 0]).attr('stroke', '#1B2A41').attr('stroke-width', 1.3);
    if (k !== 'dot') {
      const tx = g.append('text');
      if (['sea', 'ocean', 'desert', 'range', 'clabel', 'lake', 'river'].includes(k)) tx.attr('text-anchor', 'middle').attr('y', 4);
      else tx.attr('x', 8).attr('y', 4);
      if (k === 'desert') tx.style('fill', '#9C6B12').style('font-style', 'italic');
      if (k === 'range') tx.style('fill', '#7A4E22').style('font-style', 'italic');
      if (k === 'river' || k === 'lake') tx.style('fill', '#1F6FAE').style('font-style', 'italic');
    }
    if (k === 'clabel') g.classed('clabel', true);
  });
function setLabels() {
  ptSel.select('text').text(d => {
    if (d.kind === 'clabel') return C[d.c].snl && lang === 'nl' ? C[d.c].snl : (lang === 'tr' && C[d.c].str) || C[d.c][lang];
    if (d.kind === 'cap') return C[d.c].cap[lang];
    return d.f ? d.f[lang] : '';
  });
}
setLabels();

// ---- projeksiyon ve zoom
let view = 'atlas';
let proj, base = { s: 1, t: [0, 0] }, globeBase = 1, rot = [-20, -30, 0];
const path = d3.geoPath();
let quizMode = false, moving = false, rafPending = false;
let lastT = d3.zoomIdentity, ignoreZoom = false;
const zoom = d3.zoom().clickDistance(6).on('start', onZoomStart).on('zoom', onZoom).on('end', () => { moving = false; schedule(); });
svg.call(zoom).on('dblclick.zoom', null);
// kürede touchpad iki parmak kaydırma çevirir; Ctrl+kaydırma / sıkıştırma ve fare tekerleği yakınlaştırır
function isTrackpad(e) {
  if (e.deltaMode !== 0) return false;
  if (e.deltaX !== 0) return true;
  if (e.wheelDeltaY) return e.wheelDeltaY % 120 !== 0; // fare tekerleği 120'nin katlarıyla gelir
  return !Number.isInteger(e.deltaY) || Math.abs(e.deltaY) < 50;
}
zoom.filter(e => (e.type === 'wheel' ? !(view === 'globe' && !e.ctrlKey && isTrackpad(e)) : !e.ctrlKey) && !e.button);
let rotEndT = 0;
function rotateGlobeBy(dx, dy) {
  stopSpin(); peekHud();
  const f = 180 / Math.PI / proj.scale(), r = proj.rotate();
  proj.rotate([r[0] + dx * f, clamp(r[1] - dy * f, -88, 88), 0]); rot = proj.rotate();
  moving = true; schedule();
  clearTimeout(rotEndT); rotEndT = setTimeout(() => { moving = false; schedule(); }, 150);
}
svg.node().addEventListener('wheel', e => {
  if (view !== 'globe' || e.ctrlKey || !isTrackpad(e)) return;
  e.preventDefault(); rotateGlobeBy(-e.deltaX, -e.deltaY);
}, { passive: false });

// geniş ekranda oyun kartı sola yaslanır; harita kalan alana ortalanır
const HUD_DOCK = matchMedia('(min-width: 1000px)');
let padL = 0;
function hudInset() { return quizMode && HUD_DOCK.matches ? 404 : 0; }
function refitForHud() { if (hudInset() !== padL) setupProjection(); }
function setupProjection() {
  const r = stage.getBoundingClientRect(); W = r.width; H = r.height; padL = hudInset();
  svg.attr('viewBox', `0 0 ${W} ${H}`);
  if (view === 'atlas') {
    proj = d3.geoNaturalEarth1().precision(0.3).fitExtent([[12 + padL, 12], [W - 12, H - 12]], { type: 'Sphere' });
    base = { s: proj.scale(), t: proj.translate() };
    zoom.scaleExtent([1, 80]).translateExtent([[0, 0], [W, H]]);
  } else {
    globeBase = Math.min(W - padL, H) * 0.44;
    proj = d3.geoOrthographic().clipAngle(90).precision(0.4).rotate(rot).scale(globeBase).translate([(W + padL) / 2, H / 2]);
    zoom.scaleExtent([0.7, 60]).translateExtent([[-Infinity, -Infinity], [Infinity, Infinity]]);
  }
  ignoreZoom = true; svg.call(zoom.transform, d3.zoomIdentity); ignoreZoom = false;
  lastT = d3.zoomIdentity;
  path.projection(proj);
  stage.classList.toggle('atlas', view === 'atlas'); stage.classList.toggle('globe', view === 'globe');
  moving = false; render();
}
function onZoomStart(e) { if (e.sourceEvent) stopSpin(); }
let peekT = 0;
function peekHud() {
  if (!quizMode) return;
  const h = $('#hud'); h.classList.add('peek');
  clearTimeout(peekT); peekT = setTimeout(() => h.classList.remove('peek'), 700);
}
function onZoom(e) {
  if (ignoreZoom) return;
  if (e.sourceEvent) peekHud();
  const tr = e.transform;
  if (view === 'atlas') {
    proj.scale(base.s * tr.k).translate([tr.x + tr.k * base.t[0], tr.y + tr.k * base.t[1]]);
  } else {
    if (tr.k !== lastT.k) proj.scale(globeBase * tr.k);
    else {
      const f = 180 / Math.PI / proj.scale(), r = proj.rotate();
      proj.rotate([r[0] + (tr.x - lastT.x) * f, clamp(r[1] - (tr.y - lastT.y) * f, -88, 88), 0]);
      rot = proj.rotate();
    }
  }
  lastT = tr; moving = true; schedule();
}
function zl() { return view === 'atlas' ? proj.scale() / base.s : proj.scale() / globeBase; }
function schedule() { if (!rafPending) { rafPending = true; requestAnimationFrame(() => { rafPending = false; render(); }); } }
function render() {
  path.projection(proj);
  sphereP.attr('d', path({ type: 'Sphere' }));
  gratP.attr('d', path(graticule)); eqP.attr('d', path(equator));
  if (moving) {
    gLo.style('display', null).selectAll('path').attr('d', path); gHi.style('display', 'none');
  } else {
    gHi.style('display', null).selectAll('path').attr('d', path); gLo.style('display', 'none');
  }
  const showR = layerOn.river && !quizMode, showM = layerOn.mount && !quizMode;
  gRivers.style('display', showR ? null : 'none'); gLakes.style('display', showR ? null : 'none'); gRanges.style('display', showM ? null : 'none');
  if (showR) { gRivers.selectAll('path').attr('d', d => path(d.geom)); gLakes.selectAll('path').attr('d', d => path(d.geom)); }
  if (showM) gRanges.selectAll('path').attr('d', d => path(d.geom));
  gHL.selectAll('path').data(overlays.geo).join('path').attr('class', d => d.cls).attr('d', d => path(d.geom));
  updatePoints();
}
function screen(ll) {
  if (!ll) return null;
  const lonlat = [ll[1], ll[0]];
  if (view === 'globe') { const r = proj.rotate(); if (d3.geoDistance(lonlat, [-r[0], -r[1]]) > Math.PI / 2 - 0.02) return null; }
  const p = proj(lonlat);
  if (!p || p[0] < -80 || p[0] > W + 80 || p[1] < -40 || p[1] > H + 40) return null;
  return p;
}
function updatePoints() {
  const z = zl();
  ptSel.each(function (d) {
    const el = this;
    let show = false, label = false;
    if (!quizMode) {
      if (d.kind === 'clabel') { show = label = layerOn.names && d.size * z >= 1400; }
      else if (d.kind === 'cap') { show = layerOn.cap && z >= (C[d.c].lvl === 1 ? 1.2 : ZL.cap[0]); label = show && z >= (C[d.c].lvl === 1 ? 1.9 : ZL.cap[1]); }
      else if (d.kind === 'dot') { show = true; }
      else {
        const k = d.f.kind, lay = LAYER_OF[k], zz = ZL[k] || [1, 3];
        if (layerOn[lay]) {
          const markShown = z >= zz[0], labShown = z >= zz[1];
          show = markShown || labShown; label = labShown;
        }
      }
    } else if (d.kind === 'dot') show = true;
    if (show) {
      const p = screen(d.ll);
      if (!p) show = false; else el.setAttribute('transform', `translate(${p[0].toFixed(1)},${p[1].toFixed(1)})`);
    }
    el.style.display = show ? '' : 'none';
    const tx = el.lastChild; if (tx && tx.tagName === 'text') tx.style.display = label ? '' : 'none';
  });
  // pinler
  const pins = gPins.selectAll('g').data(overlays.pins).join(enter => {
    const g = enter.append('g');
    g.each(function (d) {
      const s = d3.select(this);
      if (d.cls === 'ring') { s.append('circle').attr('class', 'pin-ring').attr('r', 6); s.append('circle').attr('r', 5).attr('fill', '#FF5D73').attr('stroke', '#fff').attr('stroke-width', 2); }
      else if (d.cls === 'guess') s.append('circle').attr('class', 'guess-pin').attr('r', 6);
      else if (d.cls === 'cap') { s.append('circle').attr('r', 7).attr('fill', '#fff').attr('stroke', '#1B2A41').attr('stroke-width', 2); s.append('path').attr('d', STAR).attr('transform', 'scale(.85)').attr('fill', '#FF5D73'); }
      if (d.label) s.append('text').attr('x', 10).attr('y', 4).attr('class', 'pinlab').text(d.label)
        .style('font-weight', 800).style('font-size', '13px').style('paint-order', 'stroke').style('stroke', '#fff').style('stroke-width', '3.5px').style('fill', '#1B2A41');
    });
    return g;
  });
  pins.each(function (d) { const p = screen(d.ll); this.style.display = p ? '' : 'none'; if (p) this.setAttribute('transform', `translate(${p[0]},${p[1]})`); });
}
let overlays = { geo: [], pins: [] };
function setOverlays(o) { overlays = { geo: o.geo || [], pins: o.pins || [] }; gPins.selectAll('g').remove(); render(); }

// ---- uçuş
let spinTimer = null;
function startSpin() {
  if (spinTimer || view !== 'globe' || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  let last = performance.now();
  spinTimer = d3.timer(now => { const dt = now - last; last = now; const r = proj.rotate(); proj.rotate([r[0] + dt * 0.006, r[1], 0]); rot = proj.rotate(); moving = true; render(); });
}
function stopSpin() { if (spinTimer) { spinTimer.stop(); spinTimer = null; moving = false; schedule(); } }
function geomOf(target) {
  if (!target) return null;
  if (typeof target === 'string' && C[target]) return featByCode[target] || { type: 'Point', coordinates: [C[target].ll[1], C[target].ll[0]] };
  if (typeof target === 'string' && featByCode[target]) return featByCode[target];
  if (target.geom) return target.geom;
  if (target.ll) return { type: 'Point', coordinates: [target.ll[1], target.ll[0]] };
  return target;
}
function flyTo(target, opts) {
  opts = opts || {};
  stopSpin();
  let g = geomOf(target); if (!g) return;
  const small = typeof target === 'string' && C[target] && (C[target].area || 0) < 30000;
  if (typeof target === 'string' && C[target] && (C[target].c === 'RU' || C[target].c === 'US' || C[target].c === 'FJ' || C[target].c === 'KI' || C[target].c === 'NZ')) g = { type: 'Point', coordinates: [C[target].ll[1], C[target].ll[0]] };
  const isPt = g.type === 'Point';
  const dur = opts.dur || 1000;
  if (view === 'atlas') {
    const bp = d3.geoNaturalEarth1().precision(0.3).fitExtent([[12 + padL, 12], [W - 12, H - 12]], { type: 'Sphere' });
    let k, cxy;
    if (isPt || small) {
      cxy = bp(isPt ? g.coordinates : d3.geoCentroid(g)); k = opts.k || (small ? 9 : 5);
    } else {
      const b = d3.geoPath(bp).bounds(g); cxy = [(b[0][0] + b[1][0]) / 2, (b[0][1] + b[1][1]) / 2];
      k = clamp((opts.fill || 0.7) / Math.max((b[1][0] - b[0][0]) / (W - padL), (b[1][1] - b[0][1]) / H), 1, opts.maxK || 14);
    }
    const T0 = d3.zoomIdentity.translate((W + padL) / 2 - k * cxy[0], H / 2 - k * cxy[1]).scale(k);
    svg.transition().duration(dur).call(zoom.transform, T0);
  } else {
    let center, k;
    if (isPt) { center = g.coordinates; k = opts.k || 4; }
    else {
      center = d3.geoCentroid(g);
      const b = d3.geoBounds(g); let dx = b[1][0] - b[0][0]; if (dx < 0) dx += 360; if (dx > 180) dx = 60;
      const span = Math.max(dx * Math.cos(center[1] * Math.PI / 180), b[1][1] - b[0][1], small ? 3 : 6);
      k = clamp(110 / span * (opts.fill || 0.7) / 0.7, 1, opts.maxK || 16);
    }
    const r0 = proj.rotate(); let dl = (-center[0] - r0[0]) % 360; if (dl > 180) dl -= 360; if (dl < -180) dl += 360;
    const ir = d3.interpolate([r0[0], r0[1]], [r0[0] + dl, -center[1]]);
    const s0 = proj.scale(), s1 = globeBase * k;
    svg.transition('fly').duration(dur).tween('fly', () => tt => {
      const r = ir(tt); proj.rotate([r[0], r[1], 0]); rot = proj.rotate();
      proj.scale(s0 * Math.pow(s1 / s0, tt)); moving = true; render();
    }).on('end', () => { syncGlobeZoom(); moving = false; render(); });
  }
}
function syncGlobeZoom() { const k = proj.scale() / globeBase; lastT = d3.zoomIdentity.translate(lastT.x, lastT.y).scale(k); svg.node().__zoom = lastT; }
const REGION_BOX = { eu: [[-25, 34], [45, 71]], as: [[26, -10], [150, 60]], af: [[-19, -36], [52, 38]], na: [[-168, 6], [-52, 72]], sa: [[-83, -56], [-34, 13]], oc: [[110, -48], [180, 2]], tr: [[25.5, 35.6], [45, 42.3]], nl: [[3.2, 50.7], [7.3, 53.6]] };
function flyRegion(r) {
  if (!r || r === 'all' || !REGION_BOX[r]) return goHome();
  const [[x0, y0], [x1, y1]] = REGION_BOX[r];
  flyTo({ type: 'Polygon', coordinates: [[[x0, y0], [x0, y1], [x1, y1], [x1, y0], [x0, y0]]] }, { fill: 0.9, maxK: 30 });
}
function goHome() {
  stopSpin();
  if (view === 'atlas') svg.transition().duration(800).call(zoom.transform, d3.zoomIdentity);
  else flyTo({ type: 'Point', coordinates: [-rot[0], 25] }, { k: 1 });
}

// ---------------------------------------------------------------- seçim & bilgi paneli
const panel = $('#panel');
let selected = null;
function markCountries(fn) {
  svg.selectAll('.country').each(function () { fn(this, this.getAttribute('data-c')); });
}
function clearMarks() { markCountries(el => el.classList.remove('sel', 'target', 'good', 'bad', 'dim')); }
function select(kind, id, fly) {
  selected = { kind, id };
  clearMarks();
  if (kind === 'country') {
    markCountries((el, c) => { if (c === id) el.classList.add('sel'); });
    setOverlays({ pins: C[id] && C[id].capll ? [{ ll: C[id].capll, cls: 'cap' }] : [] });
    showCountry(id);
  } else {
    const f = FEAT[id];
    const geo = f.kind === 'river' || f.kind === 'range' ? [{ geom: f.geom, cls: 'hl-line' }] : f.kind === 'lake' && f.geom ? [{ geom: f.geom, cls: 'hl-poly' }] : [];
    setOverlays({ geo, pins: f.kind === 'river' || f.kind === 'range' || (f.kind === 'lake' && f.geom) ? [] : [{ ll: f.ll, cls: 'ring' }] });
    showFeature(f);
  }
  if (fly) flyTo(kind === 'country' ? id : FEAT[id], kind === 'country' ? {} : { k: FEAT[id].kind === 'city' ? 6 : 4 });
}
function closePanel() { panel.hidden = true; selected = null; clearMarks(); setOverlays({}); }
function speakBtn(text, lg) { return `<button class="btn" data-speak="${esc(text)}" data-lang="${lg}"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M17 9a4 4 0 0 1 0 6"/></svg>${esc(t().listen)}</button>`; }
function sizeCompare(area) {
  const out = [];
  [['TR', lang === 'tr' ? { name: 'Türkiye', gen: "Türkiye'nin", abl: "Türkiye'den" } : { name: 'Turkije' }], ['NL', lang === 'tr' ? { name: 'Hollanda', gen: "Hollanda'nın", abl: "Hollanda'dan" } : { name: 'Nederland' }]].forEach(([c, who]) => {
    const x = area / C[c].area;
    out.push(x > 0.87 && x < 1.15 ? t().size_same(who) : t().size_vs(x, who));
  });
  return out;
}
function showCountry(c) {
  const d = C[c], ex = EXTRA[c];
  if (!d && ex) {
    panel.innerHTML = `<div class="panel-head"><div><h2>${dual(ex)}</h2></div><button class="panel-x" aria-label="${esc(t().close)}">×</button></div>
      <div class="panel-body"><div class="bubble"><b>${esc(t().didyouknow)}</b>${esc(L(ex.fact))}${dualOn ? `<span class="alt">${esc(L2(ex.fact))}</span>` : ''}</div></div>`;
    panel.hidden = false; return;
  }
  if (!d) return;
  const conts = [d.k, d.k2].filter(Boolean).map(k => t().k[k]).join(' + ');
  const nb = d.b.filter(x => C[x]);
  const cur = d.cur.map(x => `${esc(x[lang])}${x.s ? ` <small>(${esc(x.s)})</small>` : ''}`).join(', ');
  const fact = d.fact && L(d.fact);
  const speakText = `${d[lang]}. ${t().capital}: ${d.cap[lang]}. ${fact || ''}`;
  const sc = sizeCompare(d.area || 0);
  panel.innerHTML = `
  <div class="panel-head">
    ${FLAGS[c] ? `<img class="big-flag" src="${flagURL(c)}" alt="">` : ''}
    <div><h2>${esc(d[lang])}</h2><div class="sub">${dualOn ? esc(d[other()]) + ' · ' : ''}${esc(conts)}</div></div>
    <button class="panel-x" aria-label="${esc(t().close)}">×</button>
  </div>
  <div class="panel-body">
    <dl class="facts">
      <dt>${esc(t().capital)}</dt><dd>${dual(d.cap)}${d.capnote ? `<br><small>${esc(L(d.capnote))}</small>` : ''}</dd>
      <dt>${esc(t().population)}</dt><dd>${esc(fmtPop(d.pop))} <small>${esc(t().people)}</small></dd>
      <dt>${esc(t().area)}</dt><dd>${d.area ? esc(d.area.toLocaleString(lang === 'tr' ? 'tr-TR' : 'nl-NL')) + ' km²' : '—'}<br><small>${sc.map(esc).join('<br>')}</small></dd>
      <dt>${esc(t().language)}</dt><dd>${esc(d.lang[lang].join(', '))}</dd>
      <dt>${esc(t().currency)}</dt><dd>${cur || '—'}</dd>
    </dl>
    <div class="row">${d.ll0 ? `<span class="tag">${esc(t().landlocked)}</span>` : ''}${stamps.has(c) ? `<span class="tag stamp">★ ${esc(t().stamp)}</span>` : ''}</div>
    ${fact ? `<div class="bubble"><b>${esc(t().didyouknow)}</b>${esc(fact)}${dualOn && L2(d.fact) ? `<span class="alt">${esc(L2(d.fact))}</span>` : ''}</div>` : ''}
    <div><div class="muted" style="margin-bottom:6px">${esc(t().neighbors)}</div>
      ${nb.length ? `<div class="neigh">${nb.map(x => `<button data-goto="${x}">${FLAGS[x] ? `<img src="${flagURL(x)}" alt="">` : ''}${esc(C[x][lang])}</button>`).join('')}</div>` : `<div class="muted">${esc(t().noNeighbors)}</div>`}
    </div>
    <div class="row">${d.capll ? `<button class="btn" data-capfly="${c}">★ ${esc(t().showCap)}</button>` : ''}${speakBtn(speakText, lang)}</div>
  </div>`;
  panel.hidden = false;
}
function kindIcon(k) {
  const m = {
    peak: '<path d="M4 20 12 6l8 14z" fill="#9A6A3A"/><path d="m10 10 2-4 2 4-2 1z" fill="#fff"/>',
    range: '<path d="M2 20 8 9l4 6 4-8 6 13z" fill="#9A6A3A"/>',
    desert: '<circle cx="17" cy="7" r="3" fill="#FFC53D"/><path d="M2 20c4-6 8-6 10-3 3-4 7-4 10 3z" fill="#E9C46A"/>',
    landmark: '<path d="M12 3 20 12 12 21 4 12z" fill="#A855F7"/>',
    city: '<rect x="4" y="9" width="6" height="11" fill="#1B2A41"/><rect x="12" y="4" width="8" height="16" fill="#44546B"/>',
    sea: '<path d="M2 10c3-3 5 3 8 0s5 3 8 0 4 1 4 1M2 16c3-3 5 3 8 0s5 3 8 0 4 1 4 1" stroke="#3B8FD0" stroke-width="2.4" fill="none"/>',
    ocean: '<path d="M2 10c3-3 5 3 8 0s5 3 8 0 4 1 4 1M2 16c3-3 5 3 8 0s5 3 8 0 4 1 4 1" stroke="#1F5F8B" stroke-width="2.6" fill="none"/>',
    strait: '<path d="M3 4c6 4 6 12 0 16M21 4c-6 4-6 12 0 16" stroke="#9A6A3A" stroke-width="2.4" fill="none"/><path d="M12 4v16" stroke="#3B8FD0" stroke-width="2.4"/>',
    lake: '<ellipse cx="12" cy="13" rx="9" ry="6" fill="#8CCFEA" stroke="#3B8FD0" stroke-width="2"/>',
    river: '<path d="M4 3c6 4-4 8 3 12s8 2 12 6" stroke="#3B8FD0" stroke-width="3" fill="none" stroke-linecap="round"/>',
    school: '<path d="M4 5h7v14H4zM13 5h7v14h-7z" fill="#0EA5A4"/>',
  };
  return `<svg width="34" height="34" viewBox="0 0 24 24">${m[k] || m.landmark}</svg>`;
}
function showFeature(f) {
  const fact = L(f.fact), fact2 = L2(f.fact);
  panel.innerHTML = `
  <div class="panel-head">
    <div class="kind-ico">${kindIcon(f.kind)}</div>
    <div><h2>${esc(f[lang])}</h2><div class="sub">${dualOn && f[other()] !== f[lang] ? esc(f[other()]) + ' · ' : ''}${esc(t().kind[f.kind])}${f.ch ? ' · ' + esc(f.ch.toUpperCase()) : ''}</div></div>
    <button class="panel-x" aria-label="${esc(t().close)}">×</button>
  </div>
  <div class="panel-body">
    ${fact ? `<div class="bubble"><b>${esc(t().didyouknow)}</b>${esc(fact)}${dualOn && fact2 ? `<span class="alt">${esc(fact2)}</span>` : ''}</div>` : fact2 ? `<div class="bubble">${esc(fact2)}</div>` : ''}
    ${f.cc && C[f.cc] ? `<div><div class="muted" style="margin-bottom:6px">${esc(t().inCountry)}</div><div class="neigh"><button data-goto="${f.cc}">${FLAGS[f.cc] ? `<img src="${flagURL(f.cc)}" alt="">` : ''}${esc(C[f.cc][lang])}</button></div></div>` : ''}
    <div class="row"><button class="btn" data-flyf="${f.id}">${esc(t().flyTo)}</button>${speakBtn(`${f[lang]}. ${fact || ''}`, lang)}</div>
  </div>`;
  panel.hidden = false;
}
function showWelcome() {
  panel.innerHTML = `<div class="panel-head welcome"><div><h2>${esc(t().welcomeT)}</h2><div class="sub">${esc(t().sub)}</div></div><button class="panel-x" aria-label="${esc(t().close)}">×</button></div>
  <div class="panel-body welcome"><ul>${t().welcomeB.map(x => `<li>${x}</li>`).join('')}</ul>
  <div class="row"><button class="btn hot" id="wPlay">${esc(t().playNow)}</button><button class="btn sun" id="wTests">${esc(t().tests)}</button><button class="btn" data-goto="TR">Türkiye</button><button class="btn" data-goto="NL">${lang === 'tr' ? 'Hollanda' : 'Nederland'}</button></div></div>`;
  panel.hidden = false;
}
panel.addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b) return;
  if (b.classList.contains('panel-x')) return closePanel();
  if (b.dataset.goto) { sfx.click(); select('country', b.dataset.goto, true); }
  else if (b.dataset.capfly) { const d = C[b.dataset.capfly]; flyTo({ type: 'Point', coordinates: [d.capll[1], d.capll[0]] }, { k: 7 }); }
  else if (b.dataset.flyf) select('feature', b.dataset.flyf, true);
  else if (b.dataset.speak) speak(b.dataset.speak, b.dataset.lang);
  else if (b.id === 'wPlay') setMode('play');
  else if (b.id === 'wTests') setMode('tests');
});

// ---------------------------------------------------------------- tıklamalar
svg.on('click', e => {
  const el = e.target.closest('[data-c],[data-p]');
  const c = el && el.getAttribute('data-c'), p = el && el.getAttribute('data-p');
  if (quizMode) return quizClick(e, c);
  stopSpin();
  if (c && selectable(c)) { sfx.click(); select('country', c, false); }
  else if (p && p.startsWith('cap_')) { sfx.click(); select('country', p.slice(4), false); }
  else if (p && FEAT[p]) { sfx.click(); select('feature', p, false); }
});

// ---------------------------------------------------------------- arama
const sIn = $('#search'), sRes = $('#results');
let sItems = [], sIdx = 0;
const norm = s => (s || '').toLocaleLowerCase('tr').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ı/g, 'i');
sIn.addEventListener('input', () => {
  const q = norm(sIn.value.trim());
  if (q.length < 2) { sRes.hidden = true; return; }
  const res = [];
  Object.values(C).forEach(d => {
    const n = [d.tr, d.nl].map(norm), cp = [d.cap.tr, d.cap.nl].map(norm);
    if (n.some(x => x.startsWith(q))) res.push({ s: 0, kind: 'country', id: d.c, label: d[lang], k: t().kind.country });
    else if (n.some(x => x.includes(q))) res.push({ s: 1, kind: 'country', id: d.c, label: d[lang], k: t().kind.country });
    else if (cp.some(x => x.startsWith(q))) res.push({ s: 1, kind: 'country', id: d.c, label: `${d.cap[lang]} (${d[lang]})`, k: t().capital });
  });
  Object.values(FEAT).forEach(f => {
    const n = [f.tr, f.nl].map(norm);
    if (n.some(x => x.includes(q))) res.push({ s: n.some(x => x.startsWith(q)) ? 0.5 : 1.5, kind: 'feature', id: f.id, label: f[lang], k: t().kind[f.kind] });
  });
  res.sort((a, b) => a.s - b.s || a.label.localeCompare(b.label, lang));
  sItems = res.slice(0, 12); sIdx = 0;
  sRes.innerHTML = sItems.map((r, i) => `<button data-i="${i}" class="${i === 0 ? 'on' : ''}">${r.kind === 'country' && FLAGS[r.id] ? `<img src="${flagURL(r.id)}" alt="">` : ''}${esc(r.label)}<span class="k">${esc(r.k)}</span></button>`).join('');
  sRes.hidden = !sItems.length;
});
function pickSearch(i) { const r = sItems[i]; if (!r) return; sRes.hidden = true; sIn.value = ''; sIn.blur(); select(r.kind, r.id, true); }
sRes.addEventListener('click', e => { const b = e.target.closest('button'); if (b) pickSearch(+b.dataset.i); });
sIn.addEventListener('keydown', e => {
  if (e.key === 'Enter') pickSearch(sIdx);
  else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { sIdx = clamp(sIdx + (e.key === 'ArrowDown' ? 1 : -1), 0, sItems.length - 1); [...sRes.children].forEach((b, i) => b.classList.toggle('on', i === sIdx)); e.preventDefault(); }
  else if (e.key === 'Escape') { sRes.hidden = true; sIn.blur(); }
});
document.addEventListener('click', e => { if (!e.target.closest('#searchBox')) sRes.hidden = true; });

// ---------------------------------------------------------------- katman düğmeleri
function drawLayers() {
  const labels = { names: 'l_names', cap: 'l_cap', city: 'l_city', river: 'l_river', mount: 'l_mount', sea: 'l_sea', desert: 'l_desert', wonder: 'l_wonder', school: 'l_school' };
  $('#layers').innerHTML = LAYERS.map(l => `<button class="layer" data-l="${l.id}" aria-pressed="${!!layerOn[l.id]}" title="${esc(t()[labels[l.id]])}"><span class="sw" style="background:${l.sw}">${l.star ? '<svg width="10" height="10" viewBox="-6 -6 12 12"><path d="' + STAR + '" fill="#FF5D73"/></svg>' : ''}</span><span class="t">${esc(t()[labels[l.id]])}</span></button>`).join('');
}
$('#layers').addEventListener('click', e => {
  const b = e.target.closest('.layer'); if (!b) return;
  const id = b.dataset.l; layerOn[id] = layerOn[id] ? 0 : 1; b.setAttribute('aria-pressed', !!layerOn[id]);
  store.set('layers', layerOn); render();
});

// ---------------------------------------------------------------- üst bar
function applyLang() {
  document.documentElement.lang = lang;
  $('#appTitle').textContent = t().title; $('#appSub').textContent = t().sub;
  document.querySelectorAll('[data-i]').forEach(el => { el.textContent = t()[el.dataset.i]; });
  $('#lTR').setAttribute('aria-pressed', lang === 'tr'); $('#lNL').setAttribute('aria-pressed', lang === 'nl');
  sIn.placeholder = t().search;
  $('#dualBtn').title = t().dual; $('#dualLbl').textContent = dualOn ? 'TR+NL' : lang.toUpperCase();
  $('#dualBtn').style.opacity = dualOn ? 1 : .6;
  $('#soundBtn').title = t().sound; $('#passBtn').title = t().passport; $('#zHome').title = t().home;
  drawLayers(); setLabels(); updatePass();
  if (!quizMode && !panel.hidden) { if (selected) select(selected.kind, selected.id, false); else showWelcome(); }
  if (quizMode && game) { renderHUD(); renderScores(); }
}
function updatePass() { $('#passN').textContent = [...stamps].filter(c => C[c]).length; $('#passT').textContent = QUIZ_CODES.length; }
$('#lTR').onclick = () => { lang = 'tr'; store.set('lang', lang); applyLang(); };
$('#lNL').onclick = () => { lang = 'nl'; store.set('lang', lang); applyLang(); };
$('#dualBtn').onclick = () => { dualOn = !dualOn; store.set('dual', dualOn); applyLang(); };
$('#soundBtn').onclick = () => { soundOn = !soundOn; store.set('sound', soundOn); $('#soundBtn').setAttribute('aria-pressed', soundOn); $('#soundBtn').style.opacity = soundOn ? 1 : .5; if (soundOn) sfx.click(); };
$('#soundBtn').style.opacity = soundOn ? 1 : .5;
$('#vAtlas').onclick = () => setView('atlas');
$('#vGlobe').onclick = () => setView('globe');
$('#mExplore').onclick = () => setMode('explore');
$('#mPlay').onclick = () => setMode('play');
$('#mTests').onclick = () => setMode('tests');
$('#zIn').onclick = () => { stopSpin(); svg.transition().duration(300).call(zoom.scaleBy, 1.6); };
$('#zOut').onclick = () => { stopSpin(); svg.transition().duration(300).call(zoom.scaleBy, 1 / 1.6); };
$('#zHome').onclick = () => goHome();
$('#zTR').onclick = () => flyRegion('tr');
$('#zNL').onclick = () => flyRegion('nl');
$('#passBtn').onclick = showPassport;
function setView(v) {
  if (v === view) return;
  view = v; store.set('view', v);
  $('#vAtlas').setAttribute('aria-pressed', v === 'atlas'); $('#vGlobe').setAttribute('aria-pressed', v === 'globe');
  stopSpin(); setupProjection();
  if (quizMode && game && game.cur) focusQuestion(); else if (selected) flyTo(selected.kind === 'country' ? selected.id : FEAT[selected.id], { dur: 700 });
}
function setMode(m) {
  setModePressed(m);
  if (m === 'play') { stopSpin(); showSetup(); }
  else if (m === 'tests') { stopSpin(); showTests(); }
  else { endQuiz(); closeModal(); showWelcome(); }
}
function showPassport() {
  const list = QUIZ_CODES.filter(c => stamps.has(c)).sort((a, b) => cname(a).localeCompare(cname(b), lang));
  openModal(`<h2>${esc(t().passT)}</h2><p class="muted">${esc(t().passB(list.length))}</p>
    <div class="neigh" style="margin-top:10px">${list.map(c => `<button data-goto="${c}">${FLAGS[c] ? `<img src="${flagURL(c)}" alt="">` : ''}${esc(cname(c))}</button>`).join('')}</div>
    <div class="sheet-foot">${list.length ? `<button class="btn" id="passReset">${esc(t().reset)}</button>` : ''}<button class="btn primary" id="passClose">${esc(t().close)}</button></div>`);
  $('#modal').onclick = e => {
    const b = e.target.closest('button'); if (!b) { if (e.target.id === 'modal') closeModal(); return; }
    if (b.id === 'passClose') closeModal();
    else if (b.id === 'passReset') { const ok = b.dataset.sure; if (!ok) { b.dataset.sure = 1; b.textContent = '✓ ' + t().reset + '?'; return; } stamps = new Set(); store.set('stamps', []); updatePass(); closeModal(); }
    else if (b.dataset.goto) { closeModal(); if (!quizMode) select('country', b.dataset.goto, true); }
  };
}
function openModal(html) { const m = $('#modal'); m.innerHTML = `<div class="sheet" role="dialog" aria-modal="true">${html}</div>`; m.hidden = false; m.onclick = null; }
function closeModal() { $('#modal').hidden = true; $('#modal').innerHTML = ''; }

// ---------------------------------------------------------------- OYUN
const PCOL = ['#FF5D73', '#3B82F6', '#22A565', '#A855F7'];
let setup = Object.assign({ type: 'find', region: 'all', level: 1, n: 10, players: [''], chapter: 'all' }, store.get('setup', {}));
let game = null;
const gameIcons = {
  find: '<circle cx="12" cy="10" r="5" fill="#FF5D73" stroke="#1B2A41" stroke-width="2"/><path d="M12 15v6" stroke="#1B2A41" stroke-width="2.4" stroke-linecap="round"/>',
  name: '<path d="M3 7l5-3 5 3 5-3v13l-5 3-5-3-5 3z" fill="#9FD69B" stroke="#1B2A41" stroke-width="2" stroke-linejoin="round"/><path d="M13 7v13" stroke="#1B2A41" stroke-width="2"/>',
  capital: '<circle cx="12" cy="12" r="9" fill="#fff" stroke="#1B2A41" stroke-width="2"/><path d="' + 'M12,6.5L13.6,10.2L17.5,10.3L14.5,12.8L15.4,16.6L12,14.4L8.6,16.6L9.5,12.8L6.5,10.3L10.4,10.2Z' + '" fill="#FF5D73"/>',
  flag: '<path d="M5 21V4" stroke="#1B2A41" stroke-width="2.4" stroke-linecap="round"/><path d="M5 4h13l-3 4 3 4H5z" fill="#FFC53D" stroke="#1B2A41" stroke-width="2" stroke-linejoin="round"/>',
  place: '<path d="M2 20 8 9l4 6 4-8 6 13z" fill="#C79A6A" stroke="#1B2A41" stroke-width="2" stroke-linejoin="round"/><path d="M3 20c5-3 12 1 18-2" stroke="#3B8FD0" stroke-width="2.4" fill="none"/>',
  mix: '<rect x="3" y="3" width="8" height="8" rx="2" fill="#F4A7A0" stroke="#1B2A41" stroke-width="2"/><rect x="13" y="3" width="8" height="8" rx="2" fill="#8DD5CB" stroke="#1B2A41" stroke-width="2"/><rect x="3" y="13" width="8" height="8" rx="2" fill="#C5B3E6" stroke="#1B2A41" stroke-width="2"/><rect x="13" y="13" width="8" height="8" rx="2" fill="#F9D56E" stroke="#1B2A41" stroke-width="2"/>',
  school: '<path d="M3 5h8v15H3zM13 5h8v15h-8z" fill="#0EA5A4" stroke="#1B2A41" stroke-width="2" stroke-linejoin="round"/>',
};
function showSetup() {
  const types = ['find', 'name', 'capital', 'flag', 'place', 'mix'].concat(HAS_SCHOOL ? ['school'] : []);
  if (!types.includes(setup.type)) setup.type = 'find';
  const regions = setup.type === 'place' ? ['all', 'tr'] : setup.type === 'school' ? null : ['all', 'eu', 'as', 'af', 'na', 'sa', 'oc'];
  const chapters = setup.type === 'school' ? ['all'].concat(SCHOOL.chapters.filter(ch => (ch.questions || []).length || (ch.concepts || []).length).map(ch => ch.id)) : null;
  if (regions && !regions.includes(setup.region)) setup.region = 'all';
  const regLabel = r => r === 'all' ? t().all : r === 'tr' ? t().tkOnly : t().k[r];
  const chLabel = id => { if (id === 'all') return t().all.replace(/.*/, lang === 'tr' ? 'Hepsi' : 'Alles'); const ch = SCHOOL.chapters.find(c => c.id === id); return id.toUpperCase() + (ch ? ' · ' + (lang === 'tr' ? ch.title_tr || ch.title_nl : ch.title_nl) : ''); };
  openModal(`
    <h2>${esc(t().chooseGame)}</h2>
    <div class="games">${types.map(k => `<button class="game" data-type="${k}" aria-pressed="${setup.type === k}"><svg viewBox="0 0 24 24">${gameIcons[k]}</svg><b>${esc(t().g[k][0])}</b><span>${esc(t().g[k][1])}</span></button>`).join('')}</div>
    ${regions ? `<h3>${esc(t().region)}</h3><div class="pills">${regions.map(r => `<button class="pill" data-region="${r}" aria-pressed="${setup.region === r}">${esc(regLabel(r))}</button>`).join('')}</div>` : ''}
    ${chapters ? `<h3>${esc(t().chapters)}</h3><div class="pills">${chapters.map(r => `<button class="pill" data-chapter="${r}" aria-pressed="${setup.chapter === r}">${esc(chLabel(r))}</button>`).join('')}</div>` : ''}
    ${setup.type !== 'school' && setup.type !== 'place' ? `<h3>${esc(t().level)}</h3><div class="pills">${[1, 2, 3].map(l => `<button class="pill" data-level="${l}" aria-pressed="${setup.level === l}">${esc(t().lv[l - 1])} <span class="alt" style="font-weight:600">· ${esc(t().lvDesc[l - 1])}</span></button>`).join('')}</div>` : ''}
    <h3>${esc(t().perPlayer)}</h3><div class="pills">${[5, 10, 15, 20].map(n => `<button class="pill" data-n="${n}" aria-pressed="${setup.n === n}">${n}</button>`).join('')}</div>
    <h3>${esc(t().players)}</h3>
    <div class="players">${setup.players.map((p, i) => `<div class="prow"><span class="av" style="background:${PCOL[i]}"></span><input id="pl${i}" value="${esc(p)}" placeholder="${esc(t().player)} ${i + 1}" maxlength="16">${i > 0 ? `<button class="chip-btn" data-rm="${i}" aria-label="x">×</button>` : ''}</div>`).join('')}</div>
    ${setup.players.length < 4 ? `<div style="margin-top:8px"><button class="btn" id="addP">+ ${esc(t().addPlayer)}</button></div>` : ''}
    <div class="sheet-foot"><button class="btn" id="cancelSetup">${esc(t().cancel)}</button><button class="btn hot" id="startGame">${esc(t().start)}</button></div>`);
  const m = $('#modal');
  const saveNames = () => { setup.players = setup.players.map((p, i) => { const el = $('#pl' + i); return el ? el.value.trim() : p; }); };
  m.onclick = e => {
    const b = e.target.closest('button'); if (!b) return;
    saveNames();
    if (b.dataset.type) { setup.type = b.dataset.type; showSetup(); }
    else if (b.dataset.region) { setup.region = b.dataset.region; showSetup(); }
    else if (b.dataset.chapter) { setup.chapter = b.dataset.chapter; showSetup(); }
    else if (b.dataset.level) { setup.level = +b.dataset.level; showSetup(); }
    else if (b.dataset.n) { setup.n = +b.dataset.n; showSetup(); }
    else if (b.dataset.rm) { setup.players.splice(+b.dataset.rm, 1); showSetup(); }
    else if (b.id === 'addP') { setup.players.push(''); showSetup(); setTimeout(() => { const el = $('#pl' + (setup.players.length - 1)); el && el.focus(); }, 0); }
    else if (b.id === 'cancelSetup') { closeModal(); if (!quizMode) setModePressed('explore'); }
    else if (b.id === 'startGame') { store.set('setup', setup); startGame(); }
  };
}
function startGame() {
  closeModal(); closePanel();
  setModePressed('play');
  game = {
    cfg: JSON.parse(JSON.stringify(setup)),
    players: setup.players.map((n, i) => ({ name: n || `${t().player} ${i + 1}`, color: PCOL[i], score: 0, streak: 0, right: 0 })),
    turn: 0, qi: 0, used: new Set(), missed: [], cur: null,
  };
  game.total = game.cfg.n * game.players.length;
  beginQuiz();
}
function beginQuiz() {
  quizMode = true; stage.classList.add('quiz');
  $('#searchBox').hidden = true; $('#layers').hidden = true;
  refitForHud(); render();
  nextQuestion();
}
function endQuiz() {
  quizMode = false; game = null; stage.classList.remove('quiz');
  $('#hud').hidden = true; $('#scores').hidden = true; $('#hint').hidden = true;
  $('#searchBox').hidden = false; $('#layers').hidden = false;
  clearMarks(); setOverlays({}); refitForHud();
}
// ---- soru havuzları
function countryPool(cfg) {
  return QUIZ_CODES.filter(c => {
    const d = C[c];
    if (d.lvl > cfg.level) return false;
    if (cfg.region !== 'all' && d.k !== cfg.region && d.k2 !== cfg.region) return false;
    return true;
  });
}
function distractors(ans, n, pool, key) {
  const d = C[ans];
  const same = shuffle(pool.filter(c => c !== ans && C[c].k === d.k));
  const any = shuffle(QUIZ_CODES.filter(c => c !== ans && C[c].lvl <= Math.max(2, game.cfg.level)));
  const out = [];
  for (const c of same.concat(any)) { if (out.length >= n) break; if (out.includes(c)) continue; if (key && key(c) === key(ans)) continue; out.push(c); }
  return out;
}
const PLACE_GROUP = { river: 'water', lake: 'water', sea: 'sea', ocean: 'sea', strait: 'sea', peak: 'mount', range: 'mount', desert: 'land', landmark: 'wonder', city: 'city' };
function placePool(cfg) {
  const all = [...GEO.points, ...GEO.rivers, ...GEO.lakes, ...GEO.ranges];
  return cfg.region === 'tr' ? all.filter(f => f.tk || f.cc === 'TR') : all;
}
function takeUnused(pool, keyFn) {
  let cand = pool.filter(x => !game.used.has(keyFn(x)));
  if (!cand.length) { game.used.clear(); cand = pool; }
  const x = pick(cand); game.used.add(keyFn(x)); return x;
}
function makeQuestion(type) {
  const cfg = game.cfg;
  if (type === 'mix') type = pick(['find', 'name', 'capital', 'flag', 'flag', 'place']);
  if (type === 'place') {
    const f = takeUnused(placePool(cfg), x => 'f_' + x.id);
    return buildFromSpec({ t: f.kind !== 'ocean' && Math.random() < 0.4 ? 'where' : 'which', id: f.id });
  }
  if (type === 'school') {
    const items = [];
    SCHOOL.chapters.filter(ch => cfg.chapter === 'all' || ch.id === cfg.chapter).forEach(ch => {
      (ch.questions || []).forEach((q, i) => items.push({ t: 'sq', ch: ch.id, i }));
      (ch.concepts || []).forEach((q, i) => items.push({ t: 'sc', ch: ch.id, i }));
    });
    return buildFromSpec(takeUnused(items, x => x.t + x.ch + x.i));
  }
  const pool0 = countryPool(cfg);
  const pool = type === 'flag' ? pool0.filter(c => FLAGS[c]) : type === 'capital' ? pool0.filter(c => C[c].capll) : pool0;
  const c = takeUnused(pool, x => type + x);
  const t_ = type === 'capital' ? (Math.random() < 0.5 ? 'capOf' : 'capWho') : type === 'flag' ? (Math.random() < 0.65 ? 'flag' : 'flagOf') : type;
  return buildFromSpec({ t: t_, c }, pool);
}
const chapterOf = id => SCHOOL.chapters.find(c => c.id === id);
function buildFromSpec(s, pool) {
  pool = pool || QUIZ_CODES;
  let q;
  const ans = s.c;
  if (s.t === 'find') q = { type: 'find', ans, tries: 0 };
  else if (s.t === 'name') q = { type: 'name', ans, options: shuffle([ans, ...distractors(ans, 3, pool)]).map(c => ({ c, label: cnameObj(c), ok: c === ans })) };
  else if (s.t === 'capOf' || s.t === 'capWho') {
    const ds = distractors(ans, 3, pool.filter(c => C[c].capll), c => C[c].cap.tr);
    q = { type: s.t, ans, options: shuffle([ans, ...ds]).map(c => ({ c, label: s.t === 'capOf' ? C[c].cap : cnameObj(c), ok: c === ans })) };
  } else if (s.t === 'flag' || s.t === 'flagOf') {
    const fp = pool.filter(c => FLAGS[c]);
    const ds = distractors(ans, 3, fp.length > 6 ? fp : QUIZ_CODES.filter(c => FLAGS[c]));
    q = { type: s.t, ans, options: shuffle([ans, ...ds]).map(c => ({ c, label: cnameObj(c), ok: c === ans })) };
  } else if (s.t === 'where') q = { type: 'where', f: FEAT[s.id] };
  else if (s.t === 'which') {
    const f = FEAT[s.id], grp = PLACE_GROUP[f.kind];
    const same = placePool({ region: 'all' }).filter(x => x.id !== f.id && PLACE_GROUP[x.kind] === grp && x[lang] !== f[lang]);
    const tkFirst = f.tk || f.cc === 'TR' || game.cfg.region === 'tr';
    const order = tkFirst ? shuffle(same.filter(x => x.tk || x.cc === 'TR')).concat(shuffle(same)) : shuffle(same);
    const opts = []; for (const x of order) { if (opts.length >= 3) break; if (!opts.includes(x)) opts.push(x); }
    q = { type: 'which', f, options: shuffle([f, ...opts]).map(x => ({ id: x.id, label: { tr: x.tr, nl: x.nl }, ok: x === f })) };
  } else if (s.t === 'sq') {
    const ch = chapterOf(s.ch), qq = ch.questions[s.i];
    const opts = [{ label: { nl: qq.answer_nl, tr: qq.answer_tr || qq.answer_nl }, ok: true }]
      .concat((qq.wrong_nl || []).slice(0, 3).map((w, i) => ({ label: { nl: w, tr: (qq.wrong_tr || [])[i] || w }, ok: false })));
    const place = qq.place && SCHOOL.places.find(p => p.nl && p.nl.toLowerCase() === String(qq.place).toLowerCase());
    q = { type: 'school', text: { nl: qq.q_nl, tr: qq.q_tr || qq.q_nl }, options: shuffle(opts), place, ch: ch.id };
  } else if (s.t === 'sc') {
    const ch = chapterOf(s.ch), term = ch.concepts[s.i], concepts = ch.concepts;
    const others = shuffle(concepts.filter(c => c !== term && c.nl !== term.nl)).slice(0, 3);
    if (others.length < 3) others.push(...shuffle(SCHOOL.chapters.flatMap(c => c.concepts || []).filter(c => c !== term && !others.includes(c))).slice(0, 3 - others.length));
    q = { type: 'concept', text: { nl: term.def_nl, tr: term.def_tr || term.def_nl }, options: shuffle([term, ...others]).map(c => ({ label: { nl: c.nl, tr: c.tr || c.nl }, ok: c === term })), ch: ch.id, term };
  }
  q.spec = s;
  return q;
}

// ---------------------------------------------------------------- TOETSEN (Hollanda usulü testler)
const TESTS = [], TGROUPS = [];
let toetsRes = store.get('toets', {});
function splitN(arr, n) { const out = []; for (let i = 0; i < n; i++) out.push(arr.slice(Math.round(i * arr.length / n), Math.round((i + 1) * arr.length / n))); return out.filter(x => x.length); }
const chunkBy = (arr, size) => splitN(arr, Math.max(1, Math.round(arr.length / size)));
(function buildCatalog() {
  if (HAS_SCHOOL) {
    TGROUPS.push({ id: 'school', tr: 'buiteNLand · havo 3', nl: 'buiteNLand · havo 3' });
    SCHOOL.chapters.forEach(ch => {
      const qs = (ch.questions || []).map((q, i) => ({ t: 'sq', ch: ch.id, i }));
      const cs = (ch.concepts || []).map((c, i) => ({ t: 'sc', ch: ch.id, i, p: c.paragraph || '' }));
      const total = qs.length + cs.length; if (!total) return;
      const n = Math.max(1, Math.round(total / 15));
      const cp = splitN(cs, n);
      const label = ch.id === 'welkom' ? 'Welkom' : ch.id.toUpperCase();
      for (let k = 0; k < n; k++) {
        const specs = (cp[k] || []).concat(qs.filter((_, i) => i % n === k));
        const ps = [...new Set((cp[k] || []).map(x => x.p).filter(Boolean))].sort();
        const par = ps.length ? ' · §' + ps[0] + (ps.length > 1 ? '–' + ps[ps.length - 1] : '') : '';
        TESTS.push({ id: `s_${ch.id}_${k + 1}`, grp: 'school', region: 'all', title: { tr: `${label} · Test ${k + 1}`, nl: `${label} · Toets ${k + 1}` }, sub: { tr: (ch.title_tr || ch.title_nl || '') + par, nl: (ch.title_nl || '') + par }, specs });
      }
    });
  }
  const KN = { eu: ['Avrupa', 'Europa'], as: ['Asya', 'Azië'], af: ['Afrika', 'Afrika'], na: ['Kuzey Amerika', 'Noord-Amerika'], sa: ['Güney Amerika', 'Zuid-Amerika'], oc: ['Okyanusya', 'Oceanië'] };
  Object.keys(KN).forEach(k => {
    TGROUPS.push({ id: k, tr: KN[k][0], nl: KN[k][1] });
    const codes = QUIZ_CODES.filter(c => C[c].k === k || C[c].k2 === k).sort((a, b) => C[a].lvl - C[b].lvl || (C[b].pop || 0) - (C[a].pop || 0));
    const sub = arr => ({ tr: arr.slice(0, 3).map(c => C[c].tr).join(', ') + (arr.length > 3 ? '…' : ''), nl: arr.slice(0, 3).map(c => C[c].nl).join(', ') + (arr.length > 3 ? '…' : '') });
    chunkBy(codes, 15).forEach((arr, j) => {
      const nr = chunkBy(codes, 15).length > 1 ? ' ' + (j + 1) : '';
      TESTS.push({ id: `c_${k}_find_${j + 1}`, grp: k, region: k, title: { tr: 'Ülkeler' + nr, nl: 'Landen' + nr }, sub: sub(arr), specs: arr.map(c => ({ t: 'find', c })) });
      const ca = arr.filter(c => C[c].capll);
      TESTS.push({ id: `c_${k}_cap_${j + 1}`, grp: k, region: k, title: { tr: 'Başkentler' + nr, nl: 'Hoofdsteden' + nr }, sub: sub(ca), specs: ca.map((c, i) => ({ t: i % 2 ? 'capWho' : 'capOf', c })) });
      const fa = arr.filter(c => FLAGS[c]);
      TESTS.push({ id: `c_${k}_flag_${j + 1}`, grp: k, region: k, title: { tr: 'Bayraklar' + nr, nl: 'Vlaggen' + nr }, sub: sub(fa), specs: fa.map((c, i) => ({ t: i % 3 === 2 ? 'flagOf' : 'flag', c })) });
    });
  });
  TGROUPS.push({ id: 'topo', tr: 'Dünya topografyası', nl: 'Topografie wereld' });
  const fs = (list, id, tr, nl, region) => {
    const ps = splitN(list, Math.max(1, Math.floor(list.length / 15)));
    ps.forEach((arr, j) => {
      const nr = ps.length > 1 ? ' ' + (j + 1) : '';
      TESTS.push({ id: `t_${id}_${j + 1}`, grp: region === 'tr' ? 'tr' : 'topo', region: region || 'all', title: { tr: tr + nr, nl: nl + nr }, sub: { tr: arr.slice(0, 3).map(f => f.tr).join(', ') + (arr.length > 3 ? '…' : ''), nl: arr.slice(0, 3).map(f => f.nl).join(', ') + (arr.length > 3 ? '…' : '') }, specs: arr.map((f, i) => ({ t: f.kind === 'ocean' || i % 2 === 0 ? 'which' : 'where', id: f.id })) });
    });
  };
  const P = GEO.points, world = f => !f.tk && f.cc !== 'TR';
  fs([...GEO.rivers, ...GEO.lakes.filter(f => f.id !== 'aral')].filter(world), 'water', 'Nehirler ve göller', 'Rivieren en meren');
  fs([...P.filter(f => f.kind === 'peak'), ...GEO.ranges, ...P.filter(f => f.kind === 'desert'), FEAT.aral].filter(world), 'mount', 'Dağlar ve çöller', 'Bergen en woestijnen');
  fs(P.filter(f => ['sea', 'ocean', 'strait'].includes(f.kind)).filter(world), 'sea', 'Denizler, okyanuslar, boğazlar', 'Zeeën, oceanen, zee-engtes');
  fs(P.filter(f => f.kind === 'city' || f.kind === 'landmark').filter(world), 'city', 'Şehirler ve harikalar', 'Steden en wereldwonderen');
  TGROUPS.push({ id: 'tr', tr: 'Türkiye', nl: 'Turkije' });
  fs([...P, ...GEO.rivers, ...GEO.lakes, ...GEO.ranges].filter(f => !world(f)), 'turkey', 'Türkiye coğrafyası', 'Aardrijkskunde Turkije', 'tr');
})();
const gradeOf = (frac, n) => Math.max(1, Math.round((1 + 9 * frac / Math.max(1, n)) * 10) / 10);
const fmtGrade = g => g.toFixed(1).replace('.', ',');
function gradeChip(id) {
  const r = toetsRes[id];
  if (!r) return `<span class="gchip none">—</span>`;
  return `<span class="gchip ${r.best >= 5.5 ? 'pass' : 'fail'}">${fmtGrade(r.best)}</span>`;
}
let openGroup = store.get('tgroup', HAS_SCHOOL ? 'school' : 'eu');
function showTests() {
  const tabs = TGROUPS.map(g => {
    const ts = TESTS.filter(x => x.grp === g.id), done = ts.filter(x => toetsRes[x.id] && toetsRes[x.id].best >= 5.5).length;
    return `<button class="pill" data-g="${g.id}" aria-pressed="${openGroup === g.id}">${esc(L(g))} <span class="alt" style="font-weight:700">${done}/${ts.length}</span></button>`;
  }).join('');
  const list = TESTS.filter(x => x.grp === openGroup);
  openModal(`<h2>${esc(t().testsT)}</h2><p class="muted" style="margin:0">${esc(t().testsB)}</p>
    <div class="pills" style="margin-top:12px">${tabs}</div>
    <div class="tlist">${list.map(x => `<button class="trow" data-t="${x.id}"><span class="tt">${esc(L(x.title))}</span><span class="ts">${esc(L(x.sub))}</span><span class="tn">${esc(t().questionsN(x.specs.length))}${toetsRes[x.id] ? ` · ${esc(t().best)} ${fmtGrade(toetsRes[x.id].best)} · ${toetsRes[x.id].n}×` : ''}</span>${gradeChip(x.id)}</button>`).join('')}</div>
    <div class="sheet-foot"><button class="btn" id="tClose">${esc(t().close)}</button></div>`);
  $('#modal').onclick = e => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.g) { openGroup = b.dataset.g; store.set('tgroup', openGroup); showTests(); }
    else if (b.dataset.t) { const x = TESTS.find(y => y.id === b.dataset.t); startToets(x, x.specs, false); }
    else if (b.id === 'tClose') { closeModal(); if (!quizMode) setModePressed('explore'); }
  };
}
function setModePressed(m) { $('#mExplore').setAttribute('aria-pressed', m === 'explore'); $('#mPlay').setAttribute('aria-pressed', m === 'play'); $('#mTests').setAttribute('aria-pressed', m === 'tests'); }
function startToets(test, specs, fouten) {
  closeModal(); closePanel(); endQuiz(); setModePressed('tests');
  game = {
    cfg: { type: 'toets', region: test.region || 'all', level: 2, n: specs.length, chapter: 'all' },
    players: [{ name: (setup.players[0] || t().player + ' 1'), color: PCOL[0], score: 0, streak: 0, right: 0 }],
    turn: 0, qi: 0, used: new Set(), missed: [], missedSpecs: [], frac: 0, cur: null,
    toets: { test, fouten }, specs: shuffle(specs),
  };
  game.total = specs.length;
  beginQuiz();
}
function showToetsEnd() {
  const { test, fouten } = game.toets, n = game.total, g = gradeOf(game.frac, n), pass = g >= 5.5;
  let r = toetsRes[test.id];
  if (!fouten) {
    r = r || { best: 0, n: 0 };
    r.best = Math.max(r.best, g); r.last = g; r.n++; r.date = new Date().toISOString().slice(0, 10);
    toetsRes[test.id] = r; store.set('toets', toetsRes);
  }
  if (pass) { sfx.win(); confetti(160); } else sfx.bad();
  $('#hud').hidden = true;
  const miss = game.missed, ms = game.missedSpecs;
  openModal(`<h2>${esc(L(test.title))}${fouten ? ` · ${esc(t().fouten)}` : ''}</h2><div class="muted">${esc(L(test.sub))}</div>
    <div class="gradebox"><div class="grade ${pass ? 'pass' : 'fail'}">${fmtGrade(g)}</div>
      <div><b style="font-size:22px;font-family:var(--f-display);font-weight:600">${esc(pass ? t().voldoende : t().onvoldoende)}</b>
      <div style="font-weight:700">${esc(t().correctN(game.players[0].right, n))}</div>
      <div class="muted">${esc(t().gradeExplain)}${r && !fouten ? ` · ${esc(t().best)}: ${fmtGrade(r.best)}` : ''}</div></div></div>
    <h3>${esc(t().review)}</h3>
    ${miss.length ? `<div class="review wide">${miss.map(m => `<div>${m.qtext ? `<small class="muted">${esc(L(m.qtext))}</small><br>` : ''}✓ ${esc(L(m))}${m.sub ? ` · ${esc(L(m.sub))}` : ''}${dualOn && L2(m) && L2(m) !== L(m) ? ` <span class="alt">(${esc(L2(m))})</span>` : ''}</div>`).join('')}</div>` : `<p style="font-weight:700">${esc(t().perfect)}</p>`}
    <div class="sheet-foot"><button class="btn" id="eExplore">${esc(t().toExplore)}</button><button class="btn" id="eTests">${esc(t().otherTest)}</button><button class="btn" id="eRetry">${esc(t().retry)}</button>${ms.length ? `<button class="btn hot" id="eFouten">${esc(t().fouten)} (${ms.length})</button>` : ''}</div>`);
  $('#modal').onclick = e => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.id === 'eFouten') startToets(test, ms, true);
    else if (b.id === 'eRetry') startToets(test, test.specs, false);
    else if (b.id === 'eTests') { endQuiz(); showTests(); }
    else if (b.id === 'eExplore') setMode('explore');
  };
}
function nextQuestion() {
  if (game.qi >= game.total) return showEnd();
  game.turn = game.qi % game.players.length;
  game.cur = game.specs ? buildFromSpec(game.specs[game.qi]) : makeQuestion(game.cfg.type);
  game.cur.answered = false;
  clearMarks(); setOverlays({});
  renderHUD(); renderScores();
  focusQuestion();
  $('#hint').hidden = true;
}
function focusQuestion() {
  const q = game.cur;
  if (q.type === 'find' || q.type === 'where') {
    if (q.type === 'where' && game.cfg.region === 'tr') flyRegion('tr');
    else if (q.type === 'find') flyRegion(game.cfg.region);
    else goHome();
    if (q.type === 'find' && game.players.length && !game.hintShown) { game.hintShown = true; const h = $('#hint'); h.textContent = t().hintFind; h.hidden = false; setTimeout(() => { h.hidden = true; }, 4500); }
  } else if (q.type === 'name') {
    markCountries((el, c) => { if (c === q.ans) el.classList.add('target'); });
    if (C[q.ans].dot) setOverlays({ pins: [{ ll: C[q.ans].ll, cls: 'ring' }] });
    flyTo(q.ans, { fill: 0.35, maxK: 7 });
  } else if (q.type === 'which') {
    const f = q.f;
    const geo = f.kind === 'river' || f.kind === 'range' ? [{ geom: f.geom, cls: 'hl-line' }] : f.kind === 'lake' && f.geom ? [{ geom: f.geom, cls: 'hl-poly' }] : [];
    setOverlays({ geo, pins: geo.length ? [] : [{ ll: f.ll, cls: 'ring' }] });
    flyTo(f, { k: f.kind === 'ocean' ? 1.3 : f.kind === 'sea' || f.kind === 'desert' ? 3 : 4, fill: 0.5, maxK: 8 });
  } else if (q.type === 'capOf' || q.type === 'capWho' || q.type === 'flag' || q.type === 'flagOf') {
    // cevaptan önce harita ipucu vermesin: sadece genel görünüm
  }
}
function renderScores() {
  const s = $('#scores');
  if (!game) { s.hidden = true; return; }
  s.innerHTML = game.players.map((p, i) => `<div class="pchip ${i === game.turn && game.players.length > 1 ? 'on' : ''}"><span class="av" style="background:${p.color}">${esc(p.name[0].toLocaleUpperCase(lang))}</span><span>${esc(p.name)}</span><span class="pts">${p.score}</span>${p.streak >= 3 ? `<span class="streak">🔥${p.streak}</span>` : ''}</div>`).join('')
    + `<button class="chip-btn" id="quitBtn" title="${esc(t().quitQ)}">×</button>`;
  s.hidden = false;
  $('#quitBtn').onclick = () => setMode('explore');
}
function qText(q) {
  const T_ = t();
  switch (q.type) {
    case 'find': return { main: T_.q_find(esc(cname(q.ans))), alt: dualOn ? C[q.ans][other()] : '' };
    case 'name': return { main: esc(T_.q_name) };
    case 'capOf': return { main: T_.q_capOf(esc(cname(q.ans))), alt: dualOn ? C[q.ans][other()] : '' };
    case 'capWho': return { main: T_.q_capWho(esc(C[q.ans].cap[lang])), alt: dualOn && C[q.ans].cap[other()] !== C[q.ans].cap[lang] ? C[q.ans].cap[other()] : '' };
    case 'flag': return { main: esc(T_.q_flag) };
    case 'flagOf': return { main: T_.q_flagOf(esc(cname(q.ans))), alt: dualOn ? C[q.ans][other()] : '' };
    case 'which': return { main: esc(T_.q_which(T_.kind[q.f.kind])) };
    case 'where': return { main: T_.q_where(esc(q.f[lang])), alt: dualOn && q.f[other()] !== q.f[lang] ? q.f[other()] : '' };
    case 'school': return { main: esc(L(q.text)), alt: dualOn ? L2(q.text) : '' };
    case 'concept': return { main: `<span style="font-size:.8em;color:var(--muted)">${esc(T_.q_concept)}</span><br>${esc(L(q.text))}`, alt: dualOn ? L2(q.text) : '' };
  }
}
let hudMini = false;
function renderHUD() {
  const q = game.cur, p = game.players[game.turn], hud = $('#hud');
  const qt = qText(q);
  let body = '';
  if (q.type === 'flag') body += `<div class="qflag"><img src="${flagURL(q.ans)}" alt=""></div>`;
  if (q.options) {
    body += `<div class="opts">${q.options.map((o, i) => q.type === 'flagOf'
      ? `<button class="opt flagopt" data-o="${i}" aria-label="${i + 1}"><img src="${flagURL(o.c)}" alt=""></button>`
      : `<button class="opt" data-o="${i}"><span>${esc(L(o.label))}${dualOn && L2(o.label) && L2(o.label) !== L(o.label) ? `<span class="alt">${esc(L2(o.label))}</span>` : ''}</span></button>`).join('')}</div>`;
  }
  hud.innerHTML = `<div class="qcard">
    <div class="qtop">${game.players.length > 1 ? `<span class="turn" style="background:${p.color}">${esc(t().turnOf(p.name))}</span>` : `<span>${esc(game.toets ? L(game.toets.test.title) + (game.toets.fouten ? ' · ' + t().fouten : '') : t().g[game.cfg.type][0])}</span>`}<span class="qn">${esc(t().q)} ${game.qi + 1}/${game.total}</span>
      <button class="chip-btn" id="qSpeak" style="padding:3px 7px;box-shadow:none" aria-label="${esc(t().listen)}"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M17 9a4 4 0 0 1 0 6"/></svg></button>
      <button class="chip-btn qmin" id="qMin" style="padding:3px 7px;box-shadow:none" aria-label="${esc(t().hudMin)}" title="${esc(t().hudMin)}"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="m6 15 6-6 6 6"/></svg></button></div>
    <div class="qtext">${qt.main}${qt.alt ? `<span class="alt">${esc(qt.alt)}</span>` : ''}</div>
    ${body}<div id="fb"></div></div>`;
  hud.hidden = false; hud.classList.toggle('mini', hudMini);
  $('#qMin').onclick = () => { hudMini = !hud.classList.contains('mini'); hud.classList.toggle('mini', hudMini); };
  hud.querySelectorAll('.opt').forEach(b => { b.onclick = () => answerOption(+b.dataset.o); });
  $('#qSpeak').onclick = () => speak(qt.main.replace(/<[^>]+>/g, ''));
}
function award(ok, pts) {
  const p = game.players[game.turn];
  if (ok) { if (game.frac != null) game.frac += Math.min(1, pts / 10); p.streak++; p.right++; p.score += pts + (p.streak >= 3 ? 2 : 0); sfx.good(); confetti(p.streak >= 3 ? 70 : 35); }
  else { p.streak = 0; sfx.bad(); }
  renderScores();
}
function stamp(c) { if (c && C[c] && !C[c].nq) { stamps.add(c); store.set('stamps', [...stamps]); updatePass(); } }
function missed(label) { game.missed.push(label); if (game.missedSpecs && game.cur && game.cur.spec && !game.missedSpecs.includes(game.cur.spec)) game.missedSpecs.push(game.cur.spec); }
function answerOption(i) {
  const q = game.cur; if (q.answered) return;
  q.answered = true;
  const o = q.options[i], ok = o.ok;
  document.querySelectorAll('.opt').forEach((b, j) => { b.disabled = true; if (q.options[j].ok) b.classList.add('good'); else if (j === i) b.classList.add('bad'); });
  award(ok, 10);
  const correct = q.options.find(x => x.ok);
  let fact = null, reveal = null;
  if (q.ans) {
    if (ok) stamp(q.ans); else missed({ tr: C[q.ans].tr, nl: C[q.ans].nl, sub: q.type.startsWith('cap') ? C[q.ans].cap : null });
    markCountries((el, c) => { el.classList.remove('target'); if (c === q.ans) el.classList.add(ok ? 'good' : 'target'); });
    fact = C[q.ans].fact;
    if (q.type === 'capOf' || q.type === 'capWho') { setOverlays({ pins: [{ ll: C[q.ans].capll, cls: 'cap', label: C[q.ans].cap[lang] }] }); flyTo({ type: 'Point', coordinates: [C[q.ans].capll[1], C[q.ans].capll[0]] }, { k: C[q.ans].area > 1e6 ? 3 : 5 }); fact = C[q.ans].capnote || fact; }
    else if (q.type !== 'name') flyTo(q.ans, { fill: 0.45, maxK: 7 });
    reveal = { tr: C[q.ans].tr, nl: C[q.ans].nl };
    if (q.type === 'capOf') reveal = C[q.ans].cap;
  } else if (q.f) {
    if (!ok) missed({ tr: q.f.tr, nl: q.f.nl });
    fact = q.f.fact; reveal = { tr: q.f.tr, nl: q.f.nl };
  } else {
    if (!ok) missed(Object.assign({ qtext: q.text }, correct.label));
    reveal = correct.label;
    if (q.place) { setOverlays({ pins: [{ ll: q.place.ll, cls: 'ring', label: q.place[lang] }] }); flyTo(q.place, { k: 4 }); fact = q.place.fact; }
    if (q.term) fact = null;
  }
  showFeedback(ok, ok ? null : reveal, fact);
}
function quizClick(e, c) {
  const q = game && game.cur; if (!q || q.answered) return;
  if (q.type === 'find') {
    if (!c || !selectable(c)) return;
    if (c === q.ans) {
      q.answered = true;
      const pts = [10, 6, 3][q.tries] || 3;
      markCountries((el, x) => { if (x === c) el.classList.add('good'); });
      award(true, pts); stamp(c);
      showFeedback(true, null, C[c].fact);
    } else {
      q.tries++;
      markCountries((el, x) => { if (x === c) { el.classList.add('bad'); setTimeout(() => el.classList.remove('bad'), 900); } });
      sfx.bad();
      const nm = C[c] ? C[c][lang] : L(EXTRA[c]);
      if (q.tries >= 3) {
        q.answered = true;
        markCountries((el, x) => { if (x === q.ans) el.classList.add('target'); });
        if (C[q.ans].dot) setOverlays({ pins: [{ ll: C[q.ans].ll, cls: 'ring' }] });
        flyTo(q.ans, { fill: 0.4, maxK: 7 });
        award(false); missed({ tr: C[q.ans].tr, nl: C[q.ans].nl });
        showFeedback(false, { tr: C[q.ans].tr, nl: C[q.ans].nl }, C[q.ans].fact, t().thisIs(nm).replace(/\..*$/, '.'));
      } else {
        $('#fb').innerHTML = `<div class="feedback"><div class="msg ko"><b>${esc(t().thisIs(nm))}</b> ${esc(t().triesLeft(3 - q.tries))}</div></div>`;
      }
    }
  } else if (q.type === 'where') {
    const [x, y] = d3.pointer(e, svg.node());
    const lonlat = proj.invert([x, y]);
    if (!lonlat || isNaN(lonlat[0])) return;
    if (view === 'globe') { const r = proj.rotate(); if (d3.geoDistance(lonlat, [-r[0], -r[1]]) > Math.PI / 2) return; }
    q.answered = true;
    const f = q.f;
    let pts = [];
    if (f.kind === 'river') f.lines.forEach(l => pts.push(...l));
    else if (f.kind === 'range') pts = f.line.slice();
    else if (f.kind === 'lake' && f.polys) f.polys.forEach(p => pts.push(...p[0]));
    // doğrusal çizgilerde ara noktalar ekle
    if (f.kind === 'range') { const extra = []; for (let i = 1; i < f.line.length; i++) for (let s = 1; s < 5; s++) extra.push(d3.geoInterpolate(f.line[i - 1], f.line[i])(s / 5)); pts.push(...extra); }
    if (!pts.length) pts = [[f.ll[1], f.ll[0]]];
    let best = pts[0], bd = Infinity;
    pts.forEach(p => { const dd = d3.geoDistance(lonlat, p); if (dd < bd) { bd = dd; best = p; } });
    const km = Math.round(bd * 6371);
    const inside = f.kind === 'lake' && f.geom && d3.geoContains(f.geom, lonlat);
    const kmEff = inside ? 0 : km;
    const score = kmEff < 300 ? 10 : kmEff < 700 ? 7 : kmEff < 1500 ? 4 : kmEff < 3000 ? 1 : 0;
    const geo = [{ geom: { type: 'LineString', coordinates: [lonlat, best] }, cls: 'answer-line' }];
    if (f.kind === 'river' || f.kind === 'range') geo.unshift({ geom: f.geom, cls: 'hl-line' });
    if (f.kind === 'lake' && f.geom) geo.unshift({ geom: f.geom, cls: 'hl-poly' });
    setOverlays({ geo, pins: [{ ll: [lonlat[1], lonlat[0]], cls: 'guess' }, { ll: [best[1], best[0]], cls: 'ring', label: f[lang] }] });
    flyTo({ type: 'MultiPoint', coordinates: [lonlat, best] }, { fill: 0.5, maxK: 8 });
    if (score > 0) award(true, score); else { award(false); }
    if (score < 7) missed({ tr: f.tr, nl: f.nl });
    showFeedback(score >= 4, null, f.fact, (kmEff === 0 ? '' : t().kmAway(kmEff.toLocaleString(lang === 'tr' ? 'tr-TR' : 'nl-NL'))) + ` +${score} ${t().points}`);
  }
}
function showFeedback(ok, reveal, fact, extra) {
  const last = game.qi + 1 >= game.total;
  const head = ok ? pick(t().right) : t().wrong;
  const rv = reveal ? ` ${esc(t().correctIs)} <b style="font-size:16px;color:var(--ink)">${esc(L(reveal))}</b>${dualOn && L2(reveal) && L2(reveal) !== L(reveal) ? ` <span class="alt">(${esc(L2(reveal))})</span>` : ''}` : '';
  const f1 = fact && L(fact), f2 = fact && L2(fact);
  $('#fb').innerHTML = `<div class="feedback"><div class="msg ${ok ? 'ok' : 'ko'}"><b>${esc(head)}</b>${rv}${extra ? ` <span>${esc(extra)}</span>` : ''}
    ${f1 ? `<div class="bubble" style="margin-top:8px;font-size:14px">${esc(f1)}${dualOn && f2 ? `<span class="alt">${esc(f2)}</span>` : ''}</div>` : ''}</div>
    <button class="btn primary" id="nextBtn">${esc(last ? t().finish : t().next)} →</button></div>`;
  $('#hud').classList.remove('mini');
  const nb = $('#nextBtn'); nb.focus({ preventScroll: true });
  nb.onclick = () => { game.qi++; nextQuestion(); };
}
function showEnd() {
  if (game.toets) return showToetsEnd();
  const ps = game.players.slice().sort((a, b) => b.score - a.score);
  const multi = ps.length > 1;
  const tie = multi && ps[0].score === ps[1].score;
  sfx.win(); confetti(160);
  $('#hud').hidden = true;
  const miss = game.missed;
  openModal(`<h2>${esc(t().endT)}</h2>
    ${multi ? `<p style="font-weight:800;font-size:18px;margin:4px 0">${esc(tie ? t().draw : t().winner(ps[0].name))}</p>` : ''}
    <div class="podium">${ps.map((p, i) => `<div class="pr"><span class="medal">${i + 1}</span><span class="av" style="width:14px;height:14px;border-radius:50%;background:${p.color};border:2px solid var(--line)"></span>${esc(p.name)} <span class="muted">${p.right}/${game.cfg.n}</span><span class="sc">${p.score} ${esc(t().points)}</span></div>`).join('')}</div>
    <h3>${esc(t().review)}</h3>
    ${miss.length ? `<div class="review">${miss.map(m => `<div>${esc(L(m))}${m.sub ? ` · ${esc(L(m.sub))}` : ''}${dualOn && L2(m) && L2(m) !== L(m) ? `<br><span class="alt">${esc(L2(m))}</span>` : ''}</div>`).join('')}</div>` : `<p style="font-weight:700">${esc(t().perfect)}</p>`}
    <div class="sheet-foot"><button class="btn" id="eExplore">${esc(t().toExplore)}</button><button class="btn" id="eMenu">${esc(t().menu)}</button><button class="btn hot" id="eAgain">${esc(t().again)}</button></div>`);
  $('#modal').onclick = e => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.id === 'eAgain') { closeModal(); startGame(); }
    else if (b.id === 'eMenu') { endQuiz(); showSetup(); }
    else if (b.id === 'eExplore') setMode('explore');
  };
}
// ok tuşları: kürede çevir, atlasta kaydır
const ARROWS = { ArrowLeft: [1, 0], ArrowRight: [-1, 0], ArrowUp: [0, 1], ArrowDown: [0, -1] };
document.addEventListener('keydown', e => {
  const a = ARROWS[e.key];
  if (!a || e.ctrlKey || e.metaKey || e.altKey || !$('#modal').hidden || /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
  e.preventDefault();
  const step = e.shiftKey ? 180 : 60;
  if (view === 'globe') rotateGlobeBy(a[0] * step, a[1] * step);
  else { stopSpin(); peekHud(); svg.call(zoom.translateBy, a[0] * step / zl(), a[1] * step / zl()); }
});
document.addEventListener('keydown', e => {
  if (!quizMode || !game || !game.cur || !$('#modal').hidden) return;
  if (e.target.tagName === 'INPUT') return;
  if (!game.cur.answered && game.cur.options && /^[1-4]$/.test(e.key)) answerOption(+e.key - 1);
});

// ---------------------------------------------------------------- başlat
view = store.get('view', 'atlas');
$('#vAtlas').setAttribute('aria-pressed', view === 'atlas'); $('#vGlobe').setAttribute('aria-pressed', view === 'globe');
setupProjection();
applyLang();
showWelcome();
if (view === 'globe') startSpin();
let rsz = 0;
window.addEventListener('resize', () => { clearTimeout(rsz); rsz = setTimeout(() => { setupProjection(); }, 150); });
})();
