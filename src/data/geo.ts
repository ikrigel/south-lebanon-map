// All coordinates are approximate, for illustrative/educational use only.
// Sources: OpenStreetMap, Wikipedia (Blue Line / Litani / village articles),
// UNIFIL public materials, Reuters / AP / BBC / Times of Israel / UN News
// public reporting. See sources.ts for full URL list.

// ---------------------------------------------------------------------------
// Approximate Blue Line polyline (Israel–Lebanon withdrawal line, 2000).
// Coast at Ras al-Naqoura/Rosh HaNikra → eastward to the Hasbani / Shebaa area.
// This is a coarse public-reference sketch — not a survey-grade boundary.
// ---------------------------------------------------------------------------
export const blueLine: [number, number][] = [
  [33.0905, 35.1030], // Ras al-Naqoura (Mediterranean coast)
  [33.0945, 35.1180],
  [33.0960, 35.1330], // near Alma al-Shaab area
  [33.0935, 35.1520], // Yarine / Dhayra vicinity
  [33.0900, 35.1700], // Aita al-Shaab area south
  [33.0880, 35.1900], // Ramyeh vicinity
  [33.0905, 35.2080], // Yaroun / Maroun al-Ras area
  [33.1000, 35.2280], // Aitaroun southern edge
  [33.0975, 35.2470], // Blida / Mais al-Jabal area
  [33.0920, 35.2680], // Markaba southern edge
  [33.1020, 35.2900], // Houla / Mhaibib area
  [33.1090, 35.3100], // Adaisseh / Kfar Kila area
  [33.1840, 35.3380], // Metula salient (Lebanese side opposite Metula)
  [33.2120, 35.3700], // Wazzani / Ghajar approach
  [33.2350, 35.5760], // Shebaa Farms approach (disputed area; shown only as reference)
];

// ---------------------------------------------------------------------------
// Litani River — northern reference for the buffer area as set by UNSCR 1701.
// Coarse polyline from estuary north of Tyre eastward to the Beqaa.
// ---------------------------------------------------------------------------
export const litaniRiver: [number, number][] = [
  [33.3380, 35.2280], // estuary at the Mediterranean (Qasmiyeh, north of Tyre)
  [33.3300, 35.2800],
  [33.3260, 35.3300],
  [33.3380, 35.3800],
  [33.3560, 35.4400],
  [33.3650, 35.5000],
  [33.3870, 35.5600],
  [33.4180, 35.6000], // bend northward toward Qaraoun reservoir
  [33.4900, 35.6400],
  [33.5500, 35.6800], // approaching Qaraoun Lake
];

// ---------------------------------------------------------------------------
// Approximate 5 km buffer strip south of the Litani (illustrative polygon).
// Highlights the operational depth of the 1701 buffer concept.
// ---------------------------------------------------------------------------
export const litaniBufferZone: [number, number][] = [
  [33.3380, 35.2280],
  [33.3300, 35.2800],
  [33.3260, 35.3300],
  [33.3380, 35.3800],
  [33.3560, 35.4400],
  [33.3650, 35.5000],
  [33.3870, 35.5600],
  [33.4180, 35.6000],
  // back south along a ~5 km offset
  [33.3700, 35.6000],
  [33.3300, 35.5500],
  [33.3050, 35.5000],
  [33.2900, 35.4400],
  [33.2800, 35.3800],
  [33.2780, 35.3300],
  [33.2820, 35.2800],
  [33.2900, 35.2280],
];

// ---------------------------------------------------------------------------
// Civilian towns / villages — approximate public coordinates and population
// bands. Population figures are illustrative public-source approximations
// (Wikipedia town pages, Lebanese government estimates pre-2023).
// ---------------------------------------------------------------------------
export type Town = {
  id: string;
  name_he: string;
  name_en: string;
  lat: number;
  lon: number;
  pop_band: 'sm' | 'md' | 'lg' | 'xl'; // <2k / 2-10k / 10-30k / >30k
  pop_estimate: number;
  side: 'LB' | 'IL';
  note?: string;
};

export const towns: Town[] = [
  // ---- Lebanese villages along / near the Blue Line ----
  { id: 'naqoura', name_he: 'נאקורה', name_en: 'Naqoura', lat: 33.1110, lon: 35.1380, pop_band: 'md', pop_estimate: 5000, side: 'LB', note: 'מטה יוניפי״ל' },
  { id: 'alma',    name_he: 'עלמא א־שעב', name_en: 'Alma al-Shaab', lat: 33.0960, lon: 35.1290, pop_band: 'sm', pop_estimate: 1800, side: 'LB' },
  { id: 'dhayra',  name_he: 'דהירה', name_en: 'Dhayra', lat: 33.0985, lon: 35.1620, pop_band: 'sm', pop_estimate: 1200, side: 'LB' },
  { id: 'aitaa',   name_he: 'עיתא א־שעב', name_en: 'Aita al-Shaab', lat: 33.1050, lon: 35.2860, pop_band: 'md', pop_estimate: 8000, side: 'LB' },
  { id: 'rmeish',  name_he: 'רמייש', name_en: 'Rmeish', lat: 33.0950, lon: 35.3380, pop_band: 'md', pop_estimate: 6500, side: 'LB' },
  { id: 'yaroun',  name_he: 'יארון', name_en: 'Yaroun', lat: 33.0920, lon: 35.3940, pop_band: 'sm', pop_estimate: 2000, side: 'LB' },
  { id: 'maroun',  name_he: 'מארון א־ראס', name_en: 'Maroun al-Ras', lat: 33.0985, lon: 35.4150, pop_band: 'sm', pop_estimate: 1200, side: 'LB' },
  { id: 'aitaroun',name_he: 'עיתרון', name_en: 'Aitaroun', lat: 33.1135, lon: 35.4360, pop_band: 'md', pop_estimate: 6000, side: 'LB' },
  { id: 'bintj',   name_he: 'בינת ג׳בייל', name_en: 'Bint Jbeil', lat: 33.1230, lon: 35.4290, pop_band: 'md', pop_estimate: 9000, side: 'LB' },
  { id: 'tibnin',  name_he: 'תיבנין', name_en: 'Tibnin', lat: 33.1980, lon: 35.4070, pop_band: 'md', pop_estimate: 7500, side: 'LB' },
  { id: 'blida',   name_he: 'בלידה', name_en: 'Blida', lat: 33.1095, lon: 35.4720, pop_band: 'sm', pop_estimate: 1800, side: 'LB' },
  { id: 'mais',    name_he: 'מייס א־ג׳בל', name_en: 'Mais al-Jabal', lat: 33.1370, lon: 35.5160, pop_band: 'md', pop_estimate: 3500, side: 'LB' },
  { id: 'houla',   name_he: 'חולא', name_en: 'Houla', lat: 33.1840, lon: 35.5180, pop_band: 'md', pop_estimate: 5000, side: 'LB' },
  { id: 'markaba', name_he: 'מרכבא', name_en: 'Markaba', lat: 33.1670, lon: 35.5300, pop_band: 'sm', pop_estimate: 2200, side: 'LB' },
  { id: 'adaiss',  name_he: 'אל־עדייסה', name_en: 'Adaisseh', lat: 33.1330, lon: 35.5680, pop_band: 'sm', pop_estimate: 1500, side: 'LB' },
  { id: 'kfark',   name_he: 'כפר כלא', name_en: 'Kfar Kila', lat: 33.2090, lon: 35.5790, pop_band: 'md', pop_estimate: 6000, side: 'LB' },
  { id: 'khiam',   name_he: 'אל־ח׳יאם', name_en: 'Khiam', lat: 33.3290, lon: 35.6010, pop_band: 'md', pop_estimate: 22000, side: 'LB' },
  { id: 'marjay',  name_he: 'מרג׳עיון', name_en: 'Marjayoun', lat: 33.3610, lon: 35.5910, pop_band: 'md', pop_estimate: 9000, side: 'LB' },
  { id: 'tyre',    name_he: 'צור', name_en: 'Tyre / Sour', lat: 33.2700, lon: 35.2030, pop_band: 'xl', pop_estimate: 120000, side: 'LB' },
  { id: 'sidon',   name_he: 'צידון', name_en: 'Sidon / Saida', lat: 33.5630, lon: 35.3680, pop_band: 'xl', pop_estimate: 200000, side: 'LB', note: 'נקודת ייחוס צפונית לאזור הזהראני' },
  { id: 'nabat',   name_he: 'נבטיה', name_en: 'Nabatieh', lat: 33.3780, lon: 35.4840, pop_band: 'xl', pop_estimate: 110000, side: 'LB' },
  { id: 'kana',    name_he: 'קאנא', name_en: 'Qana', lat: 33.2090, lon: 35.3030, pop_band: 'md', pop_estimate: 12000, side: 'LB' },
  { id: 'srifa',   name_he: 'סריפא', name_en: 'Srifa', lat: 33.2570, lon: 35.3540, pop_band: 'md', pop_estimate: 4500, side: 'LB' },
  { id: 'taybeh',  name_he: 'טייבה', name_en: 'Taybeh', lat: 33.2380, lon: 35.4720, pop_band: 'sm', pop_estimate: 2800, side: 'LB' },
  { id: 'yarine',  name_he: 'יארין', name_en: 'Yarine', lat: 33.0890, lon: 35.2080, pop_band: 'sm', pop_estimate: 1600, side: 'LB' },
  { id: 'jibbain', name_he: 'ג׳יביין', name_en: 'Jibbain', lat: 33.1150, lon: 35.2220, pop_band: 'sm', pop_estimate: 1300, side: 'LB' },
  { id: 'chihine', name_he: 'שיחין', name_en: 'Chihine', lat: 33.1120, lon: 35.2470, pop_band: 'sm', pop_estimate: 1300, side: 'LB' },
  { id: 'ramyah',  name_he: 'ראמיה', name_en: 'Ramyah', lat: 33.0940, lon: 35.3050, pop_band: 'sm', pop_estimate: 900, side: 'LB' },
  { id: 'beitlif', name_he: 'בית ליף', name_en: 'Beit Lif', lat: 33.1270, lon: 35.3390, pop_band: 'sm', pop_estimate: 1800, side: 'LB' },
  { id: 'debel',   name_he: 'דבל', name_en: 'Debel', lat: 33.1120, lon: 35.3720, pop_band: 'sm', pop_estimate: 1600, side: 'LB' },
  { id: 'qouzah',  name_he: 'קוזח', name_en: 'Qouzah', lat: 33.1080, lon: 35.3530, pop_band: 'sm', pop_estimate: 1200, side: 'LB' },
  { id: 'braachit', name_he: 'ברעשית', name_en: 'Braachit', lat: 33.1680, lon: 35.4310, pop_band: 'sm', pop_estimate: 2500, side: 'LB' },
  { id: 'shaquara', name_he: 'שקרא', name_en: 'Shaqra', lat: 33.1510, lon: 35.4870, pop_band: 'sm', pop_estimate: 2800, side: 'LB' },
  { id: 'safad',   name_he: 'ספד אל־בטיח׳', name_en: 'Safad al-Battikh', lat: 33.1590, lon: 35.4610, pop_band: 'sm', pop_estimate: 1800, side: 'LB' },
  { id: 'aynata',  name_he: 'עיינאתא', name_en: 'Aynata', lat: 33.1220, lon: 35.4440, pop_band: 'sm', pop_estimate: 2000, side: 'LB' },
  { id: 'kounine', name_he: 'קונין', name_en: 'Kounine', lat: 33.1460, lon: 35.4380, pop_band: 'sm', pop_estimate: 2300, side: 'LB' },
  { id: 'qabriha', name_he: 'קבריח׳א', name_en: 'Qabrikha', lat: 33.2350, lon: 35.5110, pop_band: 'sm', pop_estimate: 1800, side: 'LB' },
  { id: 'bani-hayyan', name_he: 'בני חיאן', name_en: 'Bani Hayyan', lat: 33.2080, lon: 35.5270, pop_band: 'sm', pop_estimate: 1600, side: 'LB' },
  { id: 'tallouseh', name_he: 'טלוסה', name_en: 'Tallouseh', lat: 33.2210, lon: 35.5520, pop_band: 'sm', pop_estimate: 2200, side: 'LB' },
  { id: 'rabb-thalathine', name_he: 'רב תלתין', name_en: 'Rabb Thalathine', lat: 33.1800, lon: 35.5660, pop_band: 'sm', pop_estimate: 1300, side: 'LB' },
  { id: 'mhaibib', name_he: 'מוחייביב', name_en: 'Mhaibib', lat: 33.1410, lon: 35.5450, pop_band: 'sm', pop_estimate: 900, side: 'LB' },
  { id: 'deir-mimas', name_he: 'דיר מימאס', name_en: 'Deir Mimas', lat: 33.2510, lon: 35.5660, pop_band: 'sm', pop_estimate: 1800, side: 'LB' },
  { id: 'qlaiaa',  name_he: 'קליעה', name_en: 'Qlayaa', lat: 33.3380, lon: 35.5750, pop_band: 'sm', pop_estimate: 2500, side: 'LB' },
  { id: 'ebel-saqi', name_he: 'אבל א־סאקי', name_en: 'Ebel es-Saqi', lat: 33.3100, lon: 35.6260, pop_band: 'sm', pop_estimate: 2000, side: 'LB' },
  { id: 'hasbaya', name_he: 'חצביא', name_en: 'Hasbaya', lat: 33.3970, lon: 35.6850, pop_band: 'md', pop_estimate: 7500, side: 'LB' },
  { id: 'shebaa',  name_he: 'שבעא', name_en: 'Shebaa', lat: 33.3620, lon: 35.7260, pop_band: 'md', pop_estimate: 5000, side: 'LB' },
  { id: 'kfar-chouba', name_he: 'כפר שובא', name_en: 'Kfar Chouba', lat: 33.3190, lon: 35.6820, pop_band: 'sm', pop_estimate: 1800, side: 'LB' },
  { id: 'rashaya-foukhar', name_he: 'ראשיא אל־פוח׳אר', name_en: 'Rashaya al-Foukhar', lat: 33.3330, lon: 35.6720, pop_band: 'sm', pop_estimate: 2000, side: 'LB' },
  { id: 'chehabiyeh', name_he: 'שהאביה', name_en: 'Chehabiyeh', lat: 33.2070, lon: 35.3460, pop_band: 'sm', pop_estimate: 2600, side: 'LB' },
  { id: 'abbasiyeh', name_he: 'עבאסייה', name_en: 'Abbasiyeh', lat: 33.2910, lon: 35.3070, pop_band: 'md', pop_estimate: 5000, side: 'LB' },
  { id: 'maarakeh', name_he: 'מערכה', name_en: 'Maarakeh', lat: 33.2720, lon: 35.3620, pop_band: 'md', pop_estimate: 7000, side: 'LB' },
  { id: 'bazouriyeh', name_he: 'בזוריה', name_en: 'Bazouriyeh', lat: 33.3150, lon: 35.3160, pop_band: 'md', pop_estimate: 6000, side: 'LB' },
  { id: 'jouaiya', name_he: 'ג׳וויא', name_en: 'Jouaiya', lat: 33.2540, lon: 35.3990, pop_band: 'md', pop_estimate: 6000, side: 'LB' },
  { id: 'deir-qanoun-nahr', name_he: 'דיר קאנון א־נהר', name_en: 'Deir Qanoun El Nahr', lat: 33.3190, lon: 35.2780, pop_band: 'sm', pop_estimate: 3000, side: 'LB' },
  { id: 'qaaqaiyet-el-jisr', name_he: 'קעקעית אל־ג׳סר', name_en: 'Qaaqaiyet el-Jisr', lat: 33.3530, lon: 35.4500, pop_band: 'sm', pop_estimate: 2600, side: 'LB' },
  { id: 'arnoun', name_he: 'ארנון', name_en: 'Arnoun', lat: 33.3340, lon: 35.5240, pop_band: 'sm', pop_estimate: 2500, side: 'LB', note: 'סמוך למצודת בופור' },
  { id: 'kfar-rumman', name_he: 'כפר רומאן', name_en: 'Kfar Rumman', lat: 33.3730, lon: 35.5060, pop_band: 'sm', pop_estimate: 3500, side: 'LB' },
  { id: 'zawtar', name_he: 'זותר', name_en: 'Zawtar', lat: 33.3450, lon: 35.4720, pop_band: 'sm', pop_estimate: 2500, side: 'LB' },
  { id: 'yohmor', name_he: 'יוחמור א־שקיף', name_en: 'Yohmor el-Chqif', lat: 33.3160, lon: 35.5140, pop_band: 'sm', pop_estimate: 2400, side: 'LB' },
  { id: 'kfar-tebnit', name_he: 'כפר תבניט', name_en: 'Kfar Tebnit', lat: 33.3450, lon: 35.4980, pop_band: 'sm', pop_estimate: 3000, side: 'LB' },
  { id: 'habbouch', name_he: 'חבוש', name_en: 'Habbouch', lat: 33.4080, lon: 35.4810, pop_band: 'md', pop_estimate: 7000, side: 'LB' },
  { id: 'douair', name_he: 'דוייר', name_en: 'Doueir', lat: 33.3990, lon: 35.4440, pop_band: 'sm', pop_estimate: 3500, side: 'LB' },
  { id: 'harouf', name_he: 'חרוף', name_en: 'Harouf', lat: 33.4070, lon: 35.4680, pop_band: 'sm', pop_estimate: 3500, side: 'LB' },
  { id: 'kfar-sir', name_he: 'כפר סיר', name_en: 'Kfar Sir', lat: 33.3470, lon: 35.4320, pop_band: 'sm', pop_estimate: 3000, side: 'LB' },
  { id: 'arab-salim', name_he: 'ערב סלים', name_en: 'Arab Salim', lat: 33.4390, lon: 35.4850, pop_band: 'sm', pop_estimate: 3500, side: 'LB' },
  { id: 'houmine-fawqa', name_he: 'חומין אל־פוקא', name_en: 'Houmine el-Faouqa', lat: 33.4490, lon: 35.4660, pop_band: 'sm', pop_estimate: 2500, side: 'LB' },
  { id: 'houmine-tahta', name_he: 'חומין אל־תחתא', name_en: 'Houmine el-Tahta', lat: 33.4300, lon: 35.4310, pop_band: 'sm', pop_estimate: 2500, side: 'LB' },
  { id: 'kfour', name_he: 'כפור', name_en: 'Kfour', lat: 33.4110, lon: 35.5120, pop_band: 'sm', pop_estimate: 2500, side: 'LB' },
  { id: 'roumine', name_he: 'רומין', name_en: 'Roumine', lat: 33.4660, lon: 35.5150, pop_band: 'sm', pop_estimate: 2500, side: 'LB' },
  { id: 'kfar-fila', name_he: 'כפר פילה', name_en: 'Kfar Fila', lat: 33.4890, lon: 35.5000, pop_band: 'sm', pop_estimate: 2500, side: 'LB' },
  { id: 'jarjouaa', name_he: 'ג׳רג׳וע', name_en: 'Jarjouaa', lat: 33.4870, lon: 35.5600, pop_band: 'sm', pop_estimate: 2800, side: 'LB' },
  { id: 'mlikh', name_he: 'מליח׳', name_en: 'Mlikh', lat: 33.4700, lon: 35.5410, pop_band: 'sm', pop_estimate: 1800, side: 'LB' },
  { id: 'jbaa', name_he: 'ג׳באע', name_en: 'Jbaa', lat: 33.4910, lon: 35.5550, pop_band: 'sm', pop_estimate: 3000, side: 'LB' },
  { id: 'ansar', name_he: 'אנסאר', name_en: 'Ansar', lat: 33.3860, lon: 35.3980, pop_band: 'md', pop_estimate: 6000, side: 'LB' },
  { id: 'zrarieh', name_he: 'זרריה', name_en: 'Zrarieh', lat: 33.3800, lon: 35.3430, pop_band: 'md', pop_estimate: 5000, side: 'LB' },
  { id: 'loubiyeh', name_he: 'לוביה', name_en: 'Loubieh', lat: 33.3960, lon: 35.3600, pop_band: 'sm', pop_estimate: 3000, side: 'LB' },
  { id: 'tuffahata', name_he: 'תפאחתא', name_en: 'Tuffahata', lat: 33.3900, lon: 35.3300, pop_band: 'sm', pop_estimate: 2000, side: 'LB' },
  { id: 'insariyeh', name_he: 'אנסארייה', name_en: 'Ansariyeh', lat: 33.3940, lon: 35.2950, pop_band: 'sm', pop_estimate: 3000, side: 'LB' },
  { id: 'adlun', name_he: 'עדלון', name_en: 'Adloun', lat: 33.4020, lon: 35.2780, pop_band: 'md', pop_estimate: 6000, side: 'LB' },
  { id: 'kharayeb', name_he: 'ח׳ראייב', name_en: 'Kharayeb', lat: 33.4180, lon: 35.3350, pop_band: 'md', pop_estimate: 5000, side: 'LB' },
  { id: 'saksakiyeh', name_he: 'סקסכייה', name_en: 'Saksakiyeh', lat: 33.4270, lon: 35.3330, pop_band: 'sm', pop_estimate: 3000, side: 'LB' },
  { id: 'babliyeh', name_he: 'בביליה', name_en: 'Babliyeh', lat: 33.4220, lon: 35.3620, pop_band: 'sm', pop_estimate: 2500, side: 'LB' },
  { id: 'sarafand', name_he: 'צרפנד', name_en: 'Sarafand', lat: 33.4500, lon: 35.2850, pop_band: 'md', pop_estimate: 10000, side: 'LB' },
  { id: 'zahrani-area', name_he: 'אזור הזהראני', name_en: 'Zahrani area', lat: 33.4860, lon: 35.3430, pop_band: 'md', pop_estimate: 8000, side: 'LB', note: 'אזור ייחוס צפוני למרחב' },
  { id: 'ghaziyeh', name_he: 'ע׳אזייה', name_en: 'Ghaziyeh', lat: 33.5170, lon: 35.3680, pop_band: 'md', pop_estimate: 12000, side: 'LB', note: 'סמוך לצידון, מצפון לזהראני' },
  { id: 'maghdoucheh', name_he: 'מגדושה', name_en: 'Maghdoucheh', lat: 33.5310, lon: 35.3970, pop_band: 'md', pop_estimate: 8000, side: 'LB' },
  { id: 'haret-saida', name_he: 'חארת צידא', name_en: 'Haret Saida', lat: 33.5480, lon: 35.3820, pop_band: 'md', pop_estimate: 9000, side: 'LB' },
  { id: 'miyeh-miyeh', name_he: 'מייה ומייה', name_en: 'Mieh Mieh', lat: 33.5410, lon: 35.4020, pop_band: 'md', pop_estimate: 6000, side: 'LB' },
  { id: 'ain-el-hilweh', name_he: 'עין אל־חילווה', name_en: 'Ain al-Hilweh', lat: 33.5450, lon: 35.3860, pop_band: 'lg', pop_estimate: 50000, side: 'LB' },
  { id: 'abra', name_he: 'עברה', name_en: 'Abra', lat: 33.5570, lon: 35.4070, pop_band: 'md', pop_estimate: 7000, side: 'LB' },
  { id: 'bnaafoul', name_he: 'בנאפול', name_en: 'Bnaafoul', lat: 33.5100, lon: 35.4350, pop_band: 'sm', pop_estimate: 2500, side: 'LB' },
  { id: 'tanbourit', name_he: 'טנבורית', name_en: 'Tanbourit', lat: 33.4940, lon: 35.3930, pop_band: 'sm', pop_estimate: 2500, side: 'LB' },
  { id: 'kaouthariyet-el-siyad', name_he: 'כותריית א־סיאד', name_en: 'Kaouthariyet el-Siyad', lat: 33.4750, lon: 35.3470, pop_band: 'sm', pop_estimate: 3000, side: 'LB' },
  { id: 'kfar-hatta', name_he: 'כפר חתה', name_en: 'Kfar Hatta', lat: 33.4560, lon: 35.3860, pop_band: 'sm', pop_estimate: 2500, side: 'LB' },
  { id: 'khartoum', name_he: 'ח׳רטום', name_en: 'Khartoum', lat: 33.4580, lon: 35.4200, pop_band: 'sm', pop_estimate: 2000, side: 'LB' },
  { id: 'mazraat-kawthariyeh', name_he: 'מזרעת כותרייה', name_en: 'Mazraat Kawthariyah', lat: 33.4680, lon: 35.3650, pop_band: 'sm', pop_estimate: 2000, side: 'LB' },
  // ---- Israeli border reference communities ----
  { id: 'metula',  name_he: 'מטולה', name_en: 'Metula', lat: 33.2790, lon: 35.5790, pop_band: 'sm', pop_estimate: 1800, side: 'IL' },
  { id: 'kiryat',  name_he: 'קריית שמונה', name_en: 'Kiryat Shmona', lat: 33.2070, lon: 35.5700, pop_band: 'lg', pop_estimate: 24000, side: 'IL' },
  { id: 'malkia',  name_he: 'מלכייה', name_en: 'Malkia', lat: 33.0950, lon: 35.5400, pop_band: 'sm', pop_estimate: 600, side: 'IL' },
  { id: 'avivim',  name_he: 'אביבים', name_en: 'Avivim', lat: 33.0825, lon: 35.4180, pop_band: 'sm', pop_estimate: 300, side: 'IL' },
  { id: 'dovev',   name_he: 'דובב', name_en: 'Dovev', lat: 33.0760, lon: 35.3960, pop_band: 'sm', pop_estimate: 400, side: 'IL' },
  { id: 'shtula',  name_he: 'שתולה', name_en: 'Shtula', lat: 33.0780, lon: 35.2730, pop_band: 'sm', pop_estimate: 350, side: 'IL' },
  { id: 'zarit',   name_he: 'זרעית', name_en: 'Zarit', lat: 33.0860, lon: 35.2400, pop_band: 'sm', pop_estimate: 300, side: 'IL' },
  { id: 'shlomi',  name_he: 'שלומי', name_en: 'Shlomi', lat: 33.0760, lon: 35.1430, pop_band: 'md', pop_estimate: 6500, side: 'IL' },
  { id: 'nahari',  name_he: 'נהריה', name_en: 'Nahariya', lat: 33.0070, lon: 35.0980, pop_band: 'lg', pop_estimate: 60000, side: 'IL' },
  { id: 'rosh',    name_he: 'ראש הנקרה', name_en: 'Rosh HaNikra', lat: 33.0890, lon: 35.1100, pop_band: 'sm', pop_estimate: 200, side: 'IL' },
  { id: 'manara',  name_he: 'מנרה', name_en: 'Manara', lat: 33.2330, lon: 35.5440, pop_band: 'sm', pop_estimate: 250, side: 'IL' },
  { id: 'misgav',  name_he: 'משגב עם', name_en: 'Misgav Am', lat: 33.2440, lon: 35.5610, pop_band: 'sm', pop_estimate: 350, side: 'IL' },
];

// ---------------------------------------------------------------------------
// Hebrew terrain and hydrography labels — approximate public-reference points.
// These labels help orientation only; they are not survey-grade coordinates.
// ---------------------------------------------------------------------------
export type TerrainFeature = {
  id: string;
  name_he: string;
  name_en: string;
  type: 'ridge' | 'wadi' | 'river' | 'valley' | 'mountain' | 'water';
  lat: number;
  lon: number;
  note_he?: string;
};

export const terrainFeatures: TerrainFeature[] = [
  { id: 'litani', name_he: 'נהר הליטני', name_en: 'Litani River', type: 'river', lat: 33.3600, lon: 35.4600, note_he: 'תוואי נהר מקורב' },
  { id: 'awali', name_he: 'נהר האוואלי', name_en: 'Awali River', type: 'river', lat: 33.5000, lon: 35.3900, note_he: 'נהר מצפון למרחב המפה' },
  { id: 'hasbani', name_he: 'נחל/נהר החצבאני', name_en: 'Hasbani River', type: 'river', lat: 33.2500, lon: 35.6200 },
  { id: 'wazzani', name_he: 'נחל ואזאני', name_en: 'Wazzani Stream', type: 'river', lat: 33.2350, lon: 35.6100 },
  { id: 'qasmiyeh', name_he: 'שפך קאסמייה', name_en: 'Qasmiyeh / Litani Estuary', type: 'water', lat: 33.3380, lon: 35.2280 },
  { id: 'zahrani', name_he: 'נהר הזהרני / הזהראני', name_en: 'Zahrani River', type: 'river', lat: 33.4100, lon: 35.3200, note_he: 'מוכר גם בכתיב נהר הזהראני' },
  { id: 'wadi-saluki', name_he: 'ואדי סלוקי', name_en: 'Wadi Saluki', type: 'wadi', lat: 33.2700, lon: 35.5100 },
  { id: 'wadi-hujeir', name_he: 'ואדי חוג׳ייר', name_en: 'Wadi Hujeir', type: 'wadi', lat: 33.2250, lon: 35.5100 },
  { id: 'wadi-dibbin', name_he: 'ואדי דיבין', name_en: 'Wadi Dibbin', type: 'wadi', lat: 33.3850, lon: 35.6050 },
  { id: 'wadi-khardali', name_he: 'ואדי חרדלי', name_en: 'Wadi Khardali', type: 'wadi', lat: 33.3300, lon: 35.5100 },
  { id: 'zahrani-mouth', name_he: 'שפך הזהראני', name_en: 'Zahrani River Mouth', type: 'water', lat: 33.4820, lon: 35.3140, note_he: 'נקודת ייחוס מקורבת לשפך' },
  { id: 'wadi-zahrani', name_he: 'ואדי הזהראני', name_en: 'Wadi Zahrani', type: 'wadi', lat: 33.4550, lon: 35.3900 },
  { id: 'zahrani-valley', name_he: 'עמק הזהראני', name_en: 'Zahrani Valley', type: 'valley', lat: 33.4380, lon: 35.4300 },
  { id: 'wadi-qasmiyeh', name_he: 'ואדי קאסמייה', name_en: 'Wadi Qasmiyeh', type: 'wadi', lat: 33.3230, lon: 35.2650 },
  { id: 'wadi-kfour', name_he: 'ואדי כפור', name_en: 'Wadi Kfour', type: 'wadi', lat: 33.4250, lon: 35.5050 },
  { id: 'wadi-taybeh', name_he: 'ואדי טייבה', name_en: 'Wadi Taybeh', type: 'wadi', lat: 33.2350, lon: 35.4850 },
  { id: 'wadi-siddiqin', name_he: 'ואדי סידיקין', name_en: 'Wadi Siddiqin', type: 'wadi', lat: 33.2300, lon: 35.3600 },
  { id: 'wadi-bint-jbeil', name_he: 'ואדי בינת ג׳בייל', name_en: 'Wadi Bint Jbeil', type: 'wadi', lat: 33.1370, lon: 35.4050 },
  { id: 'jabal-amel', name_he: 'רכס ג׳בל עאמל', name_en: 'Jabal Amel Highlands', type: 'ridge', lat: 33.2100, lon: 35.4100 },
  { id: 'bint-jbeil-ridge', name_he: 'רכס בינת ג׳בייל', name_en: 'Bint Jbeil Ridge', type: 'ridge', lat: 33.1300, lon: 35.4300 },
  { id: 'maroun-ridge', name_he: 'רכס מארון א־ראס', name_en: 'Maroun al-Ras Ridge', type: 'ridge', lat: 33.1050, lon: 35.4200 },
  { id: 'tibnin-ridge', name_he: 'רכס תיבנין', name_en: 'Tibnin Ridge', type: 'ridge', lat: 33.2050, lon: 35.4050 },
  { id: 'beaufort-ridge', name_he: 'רכס בופור / ארנון', name_en: 'Beaufort / Arnoun Ridge', type: 'ridge', lat: 33.3360, lon: 35.5320 },
  { id: 'silvester-ridge', name_he: 'רכס הסילבסטר', name_en: 'Silvester Ridge', type: 'ridge', lat: 33.1660, lon: 35.4240, note_he: 'נקודת ייחוס מקורבת לרכס מקומי באזור ברעשית–בינת ג׳בייל' },
  { id: 'iqlim-tuffah-ridge', name_he: 'רכס אקלים א־תפאח', name_en: 'Iqlim al-Tuffah Ridge', type: 'ridge', lat: 33.4700, lon: 35.5250 },
  { id: 'jabal-safi', name_he: 'הר סאפי', name_en: 'Jabal Safi', type: 'mountain', lat: 33.5050, lon: 35.5750 },
  { id: 'jabal-rafi', name_he: 'הר רפי', name_en: 'Jabal Rafi', type: 'mountain', lat: 33.4820, lon: 35.5520 },
  { id: 'jabal-rihan', name_he: 'הר ריחאן', name_en: 'Jabal Rihan', type: 'mountain', lat: 33.4050, lon: 35.6200 },
  { id: 'jabal-adathir', name_he: 'הר עדתיר', name_en: 'Jabal Adathir', type: 'mountain', lat: 33.1780, lon: 35.3650 },
  { id: 'naqoura-ridge', name_he: 'רכס נאקורה', name_en: 'Naqoura Ridge', type: 'ridge', lat: 33.1120, lon: 35.1500 },
  { id: 'rumaysh-ridge', name_he: 'רכס רמייש', name_en: 'Rmeish Ridge', type: 'ridge', lat: 33.0950, lon: 35.3450 },
  { id: 'nabatieh-heights', name_he: 'גבעות נבטיה', name_en: 'Nabatieh Heights', type: 'ridge', lat: 33.3950, lon: 35.5000 },
  { id: 'zahrani-coastal-plain', name_he: 'מישור החוף של הזהראני', name_en: 'Zahrani Coastal Plain', type: 'valley', lat: 33.4550, lon: 35.3000 },
  { id: 'hermon-foothills', name_he: 'מורדות החרמון הלבנוני', name_en: 'Hermon Foothills', type: 'mountain', lat: 33.3300, lon: 35.7100 },
  { id: 'hula-valley-north', name_he: 'עמק החולה — שוליים צפוניים', name_en: 'Northern Hula Valley', type: 'valley', lat: 33.2200, lon: 35.5850 },
  { id: 'tyre-coastal-plain', name_he: 'מישור החוף של צור', name_en: 'Tyre Coastal Plain', type: 'valley', lat: 33.2600, lon: 35.2350 },
  { id: 'nabatieh-plateau', name_he: 'רמת נבטיה', name_en: 'Nabatieh Plateau', type: 'ridge', lat: 33.3800, lon: 35.4850 },
];

// ---------------------------------------------------------------------------
// UNIFIL public reference points. Restricted to publicly known locations
// (HQ Naqoura and town-of-record sector references). Not a position list.
// Source: UNIFIL public materials, Wikipedia UNIFIL article.
// ---------------------------------------------------------------------------
export type UnifilPoint = {
  id: string;
  name_he: string;
  name_en: string;
  lat: number;
  lon: number;
  kind: 'hq' | 'sector' | 'reference';
  note_he: string;
};

export const unifilPoints: UnifilPoint[] = [
  { id: 'hq', name_he: 'מטה יוניפי״ל — נאקורה', name_en: 'UNIFIL HQ Naqoura', lat: 33.1110, lon: 35.1380, kind: 'hq', note_he: 'מטה המשימה, פורסם פומבית' },
  { id: 'sw', name_he: 'מפקדת מגזר מערב (אזור צור)', name_en: 'Sector West HQ (Tyre area)', lat: 33.2660, lon: 35.2400, kind: 'sector', note_he: 'מיקום מגזרי כללי על־פי דיווח פתוח' },
  { id: 'se', name_he: 'מפקדת מגזר מזרח (אזור מרג׳עיון)', name_en: 'Sector East HQ (Marjayoun area)', lat: 33.3550, lon: 35.5870, kind: 'sector', note_he: 'מיקום מגזרי כללי על־פי דיווח פתוח' },
  { id: 'r1', name_he: 'אזור עמדות לאורך הקו הכחול — מערב', name_en: 'Blue Line patrol area — west', lat: 33.0960, lon: 35.1700, kind: 'reference', note_he: 'אזור סיורים פומבי, אינו מיקום עמדה ספציפי' },
  { id: 'r2', name_he: 'אזור עמדות לאורך הקו הכחול — מרכז', name_en: 'Blue Line patrol area — central', lat: 33.0985, lon: 35.4150, kind: 'reference', note_he: 'אזור סיורים פומבי, אינו מיקום עמדה ספציפי' },
  { id: 'r3', name_he: 'אזור עמדות לאורך הקו הכחול — מזרח', name_en: 'Blue Line patrol area — east', lat: 33.1330, lon: 35.5680, kind: 'reference', note_he: 'אזור סיורים פומבי, אינו מיקום עמדה ספציפי' },
];

// ---------------------------------------------------------------------------
// Hezbollah influence zones — qualitative public-reporting approximations.
// These are broad polygons indicating *areas of reported social/political
// influence and historical presence*, not tactical sites. They deliberately
// do NOT include weapons depots, launch sites, tunnels or targeting data.
// Sources: ICG, Reuters, BBC, Wikipedia 2024 Lebanon war.
// ---------------------------------------------------------------------------
export type InfluenceZone = {
  id: string;
  name_he: string;
  intensity: 'broad' | 'reported';
  polygon: [number, number][];
  note_he: string;
};

export const influenceZones: InfluenceZone[] = [
  {
    id: 'border-belt',
    name_he: 'רצועת הכפרים הסמוכה לקו הכחול',
    intensity: 'reported',
    polygon: [
      [33.108, 35.110],
      [33.110, 35.230],
      [33.115, 35.350],
      [33.118, 35.450],
      [33.140, 35.560],
      [33.215, 35.580],
      [33.205, 35.470],
      [33.180, 35.380],
      [33.150, 35.280],
      [33.135, 35.180],
      [33.120, 35.110],
    ],
    note_he: 'אזור בו דווחו בעבר נוכחות חברתית-פוליטית ופעילות מליציונית רחבה (דיווחי תקשורת פתוחים).',
  },
  {
    id: 'nabatieh-corridor',
    name_he: 'מסדרון נבטייה–אזורי השפעה',
    intensity: 'broad',
    polygon: [
      [33.250, 35.380],
      [33.260, 35.480],
      [33.330, 35.560],
      [33.410, 35.560],
      [33.430, 35.470],
      [33.400, 35.380],
      [33.340, 35.340],
      [33.280, 35.350],
    ],
    note_he: 'אזור רחב המתואר בספרות אקדמית ובדיווחי תקשורת כאזור השפעה היסטורי. נועד להמחשה גסה בלבד.',
  },
  {
    id: 'tyre-hinterland',
    name_he: 'עורף צור — אזור השפעה רחב',
    intensity: 'broad',
    polygon: [
      [33.225, 35.210],
      [33.240, 35.340],
      [33.310, 35.330],
      [33.330, 35.230],
      [33.290, 35.180],
      [33.240, 35.180],
    ],
    note_he: 'אזור רחב המתואר בדיווחי תקשורת. אינו מציין מתקנים מבצעיים.',
  },
];

// ---------------------------------------------------------------------------
// Security incidents — public-report dataset, illustrative.
// All entries derive from public news/UN/think-tank reporting.
// Coordinates are approximate to the nearest locality.
// ---------------------------------------------------------------------------
export type Incident = {
  id: string;
  date: string; // ISO yyyy-mm-dd
  year: number;
  type: 'rocket' | 'atgm' | 'uav' | 'idf_strike' | 'unifil' | 'ground' | 'displacement';
  severity: 'low' | 'med' | 'high';
  side: 'cross-border' | 'lebanon' | 'israel' | 'un';
  lat: number;
  lon: number;
  approx: boolean;
  title_he: string;
  desc_he: string;
  source_label: string;
  source_url: string;
};

export const incidents: Incident[] = [
  // 2021
  {
    id: 'i-2021-08-rocket',
    date: '2021-08-06', year: 2021, type: 'rocket', severity: 'med', side: 'cross-border',
    lat: 33.1300, lon: 35.4400, approx: true,
    title_he: 'ירי רקטות מדרום לבנון לעבר ישראל (אזור עיתרון/בינת ג׳בייל)',
    desc_he: 'ירי של כ-19 רקטות לעבר צפון ישראל; דווחו תגובות ארטילריה ישראליות באזור.',
    source_label: 'Reuters',
    source_url: 'https://www.reuters.com/world/middle-east/rockets-fired-southern-lebanon-into-israel-lebanese-army-says-2021-08-06/',
  },
  {
    id: 'i-2021-08-strike',
    date: '2021-08-06', year: 2021, type: 'idf_strike', severity: 'med', side: 'israel',
    lat: 33.1100, lon: 35.4150, approx: true,
    title_he: 'תגובת אש ישראלית באזור מארון א־ראס',
    desc_he: 'דווח על אש ארטילריה ישראלית באזור הגבול בעקבות ירי הרקטות.',
    source_label: 'BBC',
    source_url: 'https://www.bbc.com/news/world-middle-east-58101226',
  },
  // 2022
  {
    id: 'i-2022-04-rocket',
    date: '2022-04-25', year: 2022, type: 'rocket', severity: 'low', side: 'cross-border',
    lat: 33.0970, lon: 35.1700, approx: true,
    title_he: 'ירי בודד מדרום לבנון; ישראל מגיבה באש',
    desc_he: 'דווח על ניסיון ירי בודד מאזור עלמא א־שעב; ישראל הגיבה באש ארטילריה.',
    source_label: 'Times of Israel',
    source_url: 'https://www.timesofisrael.com/idf-fires-back-after-rocket-launched-from-lebanon-toward-israel/',
  },
  // 2023 — pre October
  {
    id: 'i-2023-04-rockets',
    date: '2023-04-06', year: 2023, type: 'rocket', severity: 'high', side: 'cross-border',
    lat: 33.2700, lon: 35.2030, approx: true,
    title_he: 'מטח רקטות מאזור צור לעבר ישראל',
    desc_he: 'מטח רקטות גדול מאזור צור לעבר צפון ישראל; דווח כירי בידי גורמים פלסטיניים מאזור השפעה רחב.',
    source_label: 'Reuters',
    source_url: 'https://www.reuters.com/world/middle-east/least-25-rockets-fired-lebanon-into-israel-israeli-army-says-2023-04-06/',
  },
  // 2023 — post October 7
  {
    id: 'i-2023-10-atgm',
    date: '2023-10-09', year: 2023, type: 'atgm', severity: 'high', side: 'cross-border',
    lat: 33.0950, lon: 35.3380, approx: true,
    title_he: 'ירי טילים נ״ט מאזור רמייש לעבר עמדות צה״ל',
    desc_he: 'ירי טילים נגד טנקים מדרום לבנון כחלק מהסלמת אוקטובר 2023.',
    source_label: 'AP',
    source_url: 'https://apnews.com/article/israel-lebanon-hezbollah-border-attacks-7c3e7f6b6a5d',
  },
  {
    id: 'i-2023-11-strike',
    date: '2023-11-21', year: 2023, type: 'idf_strike', severity: 'high', side: 'israel',
    lat: 33.1050, lon: 35.2860, approx: true,
    title_he: 'תקיפת חיל אוויר באזור עיתא א־שעב',
    desc_he: 'דיווחים על תקיפות אוויר ישראליות באזורי עיתא א־שעב לאחר ירי לעבר ישראל.',
    source_label: 'BBC',
    source_url: 'https://www.bbc.com/news/world-middle-east-67482000',
  },
  {
    id: 'i-2023-12-disp',
    date: '2023-12-01', year: 2023, type: 'displacement', severity: 'high', side: 'lebanon',
    lat: 33.1700, lon: 35.4000, approx: true,
    title_he: 'תנועות עקורים מהכפרים סמוך לקו הכחול',
    desc_he: 'OCHA מדווח על עשרות אלפי עקורים מכפרי הגבול בדרום לבנון.',
    source_label: 'UN OCHA',
    source_url: 'https://reliefweb.int/report/lebanon/lebanon-flash-update-1-escalation-hostilities-south-lebanon-9-october-2023',
  },
  // 2024
  {
    id: 'i-2024-01-uav',
    date: '2024-01-08', year: 2024, type: 'uav', severity: 'high', side: 'cross-border',
    lat: 33.1230, lon: 35.4290, approx: true,
    title_he: 'שיגור כטב״ם מאזור בינת ג׳בייל',
    desc_he: 'דיווח פתוח על שיגורי כטב״ם מאזור בינת ג׳בייל לעבר צפון ישראל.',
    source_label: 'Times of Israel',
    source_url: 'https://www.timesofisrael.com/liveblog-january-8-2024/',
  },
  {
    id: 'i-2024-02-strike',
    date: '2024-02-14', year: 2024, type: 'idf_strike', severity: 'high', side: 'israel',
    lat: 33.3780, lon: 35.4840, approx: true,
    title_he: 'תקיפות עומק באזור נבטייה',
    desc_he: 'דיווחי תקשורת על תקיפות אוויר ישראליות באזור נבטייה.',
    source_label: 'Reuters',
    source_url: 'https://www.reuters.com/world/middle-east/israel-strikes-deep-lebanon-after-soldier-killed-2024-02-14/',
  },
  {
    id: 'i-2024-04-unifil',
    date: '2024-04-22', year: 2024, type: 'unifil', severity: 'med', side: 'un',
    lat: 33.1110, lon: 35.1380, approx: false,
    title_he: 'דיווחי יוניפי״ל על פגיעה בעמדות הכוח',
    desc_he: 'יוניפי״ל דיווחה על אירועים שגרמו לנזק לעמדות באזור מטה נאקורה והקו הכחול.',
    source_label: 'UNIFIL',
    source_url: 'https://unifil.unmissions.org/unifil-statement-incidents-affecting-peacekeepers',
  },
  {
    id: 'i-2024-05-disp',
    date: '2024-05-01', year: 2024, type: 'displacement', severity: 'high', side: 'lebanon',
    lat: 33.2700, lon: 35.4000, approx: true,
    title_he: 'הרחבת מעגל העקורים בדרום לבנון',
    desc_he: 'דיווחי OCHA על למעלה מ-90,000 עקורים מכפרי הגבול בדרום.',
    source_label: 'UN OCHA',
    source_url: 'https://reliefweb.int/country/lbn',
  },
  {
    id: 'i-2024-07-acled',
    date: '2024-07-15', year: 2024, type: 'idf_strike', severity: 'high', side: 'israel',
    lat: 33.1840, lon: 35.5180, approx: true,
    title_he: 'תקיפות באזור חולא',
    desc_he: 'ACLED מתעד אירועי תקיפה חוזרים ונשנים באזור חולא ומרכבא.',
    source_label: 'ACLED',
    source_url: 'https://acleddata.com/dashboard/',
  },
  {
    id: 'i-2024-09-strike',
    date: '2024-09-23', year: 2024, type: 'idf_strike', severity: 'high', side: 'israel',
    lat: 33.2700, lon: 35.2030, approx: true,
    title_he: 'יום התקיפות הנרחב בדרום לבנון',
    desc_he: 'דיווחים על מאות תקיפות אוויר באזורי דרום לבנון, כולל סמוך לצור ובאזור הליטני.',
    source_label: 'Reuters',
    source_url: 'https://www.reuters.com/world/middle-east/israel-launches-air-strikes-across-southern-lebanon-2024-09-23/',
  },
  {
    id: 'i-2024-10-ground',
    date: '2024-10-01', year: 2024, type: 'ground', severity: 'high', side: 'cross-border',
    lat: 33.0985, lon: 35.4150, approx: true,
    title_he: 'פתיחת שלב תמרון יבשתי באזור הגבול',
    desc_he: 'דיווחים על כניסת כוחות יבשה לאזור הכפרים הסמוכים לקו הכחול.',
    source_label: 'BBC',
    source_url: 'https://www.bbc.com/news/world-middle-east-67930541',
  },
  {
    id: 'i-2024-10-unifil2',
    date: '2024-10-10', year: 2024, type: 'unifil', severity: 'high', side: 'un',
    lat: 33.1110, lon: 35.1380, approx: false,
    title_he: 'יוניפי״ל: פגיעה בעמדות נאקורה',
    desc_he: 'יוניפי״ל מדווחת על פגיעות במצלמות, בתאורה ובחומת המתחם בעמדות נאקורה.',
    source_label: 'UN News',
    source_url: 'https://news.un.org/en/story/2024/10/1155221',
  },
  {
    id: 'i-2024-11-cease',
    date: '2024-11-27', year: 2024, type: 'displacement', severity: 'med', side: 'lebanon',
    lat: 33.2090, lon: 35.5790, approx: true,
    title_he: 'הפסקת אש; חזרת עקורים לכפרי הגבול',
    desc_he: 'תחילת תהליך חזרה של עקורים לכפרי הגבול בדרום לבנון לאחר הפסקת אש בחסות ארה״ב.',
    source_label: 'Reuters',
    source_url: 'https://www.reuters.com/world/middle-east/lebanon-israel-ceasefire-2024-11-27/',
  },
  // 2025
  {
    id: 'i-2025-02-strike',
    date: '2025-02-18', year: 2025, type: 'idf_strike', severity: 'med', side: 'israel',
    lat: 33.3290, lon: 35.6010, approx: true,
    title_he: 'תקיפה מדודה באזור ח׳יאם',
    desc_he: 'דיווחי תקשורת על תקיפות מקומיות באזור ח׳יאם תוך כדי תוקף הפסקת האש.',
    source_label: 'AP',
    source_url: 'https://apnews.com/article/lebanon-israel-strike-2025-02-18',
  },
  {
    id: 'i-2025-04-unifil',
    date: '2025-04-03', year: 2025, type: 'unifil', severity: 'med', side: 'un',
    lat: 33.0985, lon: 35.4150, approx: true,
    title_he: 'יוניפי״ל: דיווחים על הפרעה למצלמות לאורך הקו הכחול',
    desc_he: 'יוניפי״ל דיווחה על הפרעות לציוד תצפית בעמדות לאורך הקו הכחול.',
    source_label: 'UNIFIL',
    source_url: 'https://unifil.unmissions.org/',
  },
  {
    id: 'i-2025-06-atgm',
    date: '2025-06-12', year: 2025, type: 'atgm', severity: 'med', side: 'cross-border',
    lat: 33.0950, lon: 35.5400, approx: true,
    title_he: 'ירי נ״ט מאזור הקו הכחול לעבר מלכייה',
    desc_he: 'דיווח על ירי טילים נגד טנקים לעבר אזור מלכייה.',
    source_label: 'Times of Israel',
    source_url: 'https://www.timesofisrael.com/',
  },
  {
    id: 'i-2025-08-uav',
    date: '2025-08-04', year: 2025, type: 'uav', severity: 'med', side: 'cross-border',
    lat: 33.1980, lon: 35.4070, approx: true,
    title_he: 'דיווח על שיגור כטב״ם מאזור תיבנין',
    desc_he: 'דיווחי תקשורת על ניסיון שיגור כטב״ם לעבר ישראל מאזור תיבנין.',
    source_label: 'Reuters',
    source_url: 'https://www.reuters.com/world/middle-east/',
  },
  {
    id: 'i-2025-10-strike',
    date: '2025-10-11', year: 2025, type: 'idf_strike', severity: 'med', side: 'israel',
    lat: 33.3380, lon: 35.4200, approx: true,
    title_he: 'תקיפת מתקן באזור מסיילה',
    desc_he: 'NPR מדווח על תקיפה במתקן ציוד כבד באזור מסיילה; הרוג ופצועים.',
    source_label: 'NPR',
    source_url: 'https://www.npr.org/2025/10/11/g-s1-93117/israel-strikes-south-lebanon',
  },
  {
    id: 'i-2025-12-disp',
    date: '2025-12-05', year: 2025, type: 'displacement', severity: 'med', side: 'lebanon',
    lat: 33.1050, lon: 35.2860, approx: true,
    title_he: 'דיווחי OCHA על המשך עקורים בכפרי הגבול',
    desc_he: 'OCHA מדווח על אלפי עקורים שעדיין לא חזרו לבתיהם בכפרי הגבול.',
    source_label: 'UN OCHA',
    source_url: 'https://reliefweb.int/country/lbn',
  },
];
