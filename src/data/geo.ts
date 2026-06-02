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
// Litani River — OSM relation 384062, 70 downsampled points.
// 54 of 60 member ways chained (canal branch excluded).
// Mouth: 33.3388°N 35.2444°E (Qasmiyeh, Wikipedia confirmed)
// Source end: Qaraoun Lake area (lon≈35.92)
// ---------------------------------------------------------------------------
export const litaniRiver: [number, number][] = [
  [33.3388, 35.24439],
  [33.33687, 35.25258],
  [33.33, 35.25825],
  [33.32107, 35.26576],
  [33.32259, 35.27307],
  [33.32066, 35.29029],
  [33.32515, 35.30555],
  [33.32351, 35.31366],
  [33.32206, 35.32399],
  [33.32373, 35.33234],
  [33.32587, 35.34321],
  [33.31994, 35.34488],
  [33.31461, 35.34638],
  [33.3105, 35.36047],
  [33.31193, 35.36988],
  [33.30641, 35.38172],
  [33.30812, 35.39647],
  [33.30321, 35.40892],
  [33.30837, 35.41431],
  [33.31567, 35.42257],
  [33.31079, 35.42985],
  [33.30894, 35.4436],
  [33.31164, 35.4578],
  [33.3079, 35.46756],
  [33.30942, 35.47807],
  [33.30477, 35.48744],
  [33.30287, 35.49753],
  [33.2999, 35.51899],
  [33.29696, 35.53207],
  [33.31338, 35.53904],
  [33.32906, 35.5403],
  [33.34238, 35.54268],
  [33.34622, 35.54091],
  [33.35617, 35.54709],
  [33.36721, 35.54886],
  [33.37628, 35.55707],
  [33.38201, 35.56834],
  [33.37998, 35.58601],
  [33.39444, 35.59603],
  [33.4132, 35.61041],
  [33.4204, 35.62406],
  [33.43104, 35.64073],
  [33.44145, 35.65298],
  [33.45613, 35.66034],
  [33.47143, 35.6647],
  [33.48119, 35.66357],
  [33.48795, 35.65744],
  [33.49836, 35.66423],
  [33.50802, 35.67707],
  [33.51615, 35.68311],
  [33.5289, 35.69026],
  [33.53963, 35.69358],
  [33.61361, 35.72136],
  [33.61941, 35.743],
  [33.63238, 35.76452],
  [33.6454, 35.78545],
  [33.6677, 35.81275],
  [33.68828, 35.81767],
  [33.70094, 35.82146],
  [33.73476, 35.83376],
  [33.74194, 35.84526],
  [33.7488, 35.85545],
  [33.75472, 35.86281],
  [33.76308, 35.87105],
  [33.7708, 35.88217],
  [33.77616, 35.88976],
  [33.77805, 35.8977],
  [33.78309, 35.90398],
  [33.79147, 35.91243],
  [33.79831, 35.91997],
];
// ---------------------------------------------------------------------------
// Zahrani River — OSM relation 1371721, 45 downsampled points.
// Mouth: 33.4953°N 35.3346°E (Wikipedia confirmed)
// Source: Shouf highlands, lon≈35.58
// ---------------------------------------------------------------------------
export const zahraniRiver: [number, number][] = [
  [33.491, 35.58364],
  [33.4897, 35.57742],
  [33.48486, 35.57523],
  [33.48031, 35.57231],
  [33.47605, 35.57015],
  [33.47169, 35.56498],
  [33.46572, 35.55644],
  [33.45976, 35.55307],
  [33.45833, 35.53973],
  [33.45386, 35.53355],
  [33.44826, 35.52881],
  [33.44205, 35.52344],
  [33.4352, 35.51787],
  [33.42649, 35.51861],
  [33.41789, 35.51848],
  [33.41092, 35.51585],
  [33.41143, 35.50629],
  [33.41707, 35.49888],
  [33.41878, 35.49302],
  [33.42532, 35.48827],
  [33.43075, 35.48603],
  [33.43473, 35.47928],
  [33.43729, 35.47063],
  [33.44311, 35.45855],
  [33.44326, 35.44363],
  [33.44355, 35.43535],
  [33.44915, 35.42499],
  [33.45145, 35.41385],
  [33.45559, 35.4036],
  [33.46133, 35.40009],
  [33.46701, 35.39991],
  [33.47068, 35.39002],
  [33.47428, 35.39086],
  [33.47645, 35.38685],
  [33.4775, 35.3826],
  [33.47844, 35.38039],
  [33.47657, 35.37893],
  [33.47701, 35.37398],
  [33.47816, 35.36969],
  [33.48057, 35.36647],
  [33.48405, 35.35783],
  [33.48826, 35.34745],
  [33.49158, 35.34459],
  [33.49352, 35.33849],
  [33.49532, 35.3346],
];
// ---------------------------------------------------------------------------
// Awali River — OSM relation 1332273 (784 pts, source→lon=35.386) +
// manual extension to Jiyeh mouth [33.6481°N, 35.3792°E].
// OSM relation does not include the lower western section.
// ---------------------------------------------------------------------------
export const awaliRiver: [number, number][] = [
  [33.71167, 35.69073],
  [33.71023, 35.68512],
  [33.70945, 35.67952],
  [33.70835, 35.67583],
  [33.70319, 35.67199],
  [33.70221, 35.66583],
  [33.69427, 35.65808],
  [33.68679, 35.65125],
  [33.67842, 35.6454],
  [33.67345, 35.63928],
  [33.67189, 35.63162],
  [33.66795, 35.623],
  [33.66494, 35.61574],
  [33.65924, 35.60794],
  [33.65063, 35.60401],
  [33.63139, 35.59982],
  [33.61978, 35.59975],
  [33.61025, 35.59612],
  [33.60171, 35.59282],
  [33.59904, 35.58602],
  [33.59773, 35.57324],
  [33.59706, 35.56455],
  [33.59659, 35.56273],
  [33.5943, 35.55839],
  [33.59344, 35.55503],
  [33.59096, 35.55191],
  [33.59037, 35.54768],
  [33.58668, 35.54453],
  [33.58219, 35.53857],
  [33.58049, 35.53291],
  [33.58106, 35.52879],
  [33.58171, 35.52317],
  [33.58165, 35.51704],
  [33.5769, 35.51016],
  [33.57419, 35.49996],
  [33.57439, 35.4932],
  [33.57264, 35.48552],
  [33.5735, 35.48033],
  [33.57467, 35.47744],
  [33.56732, 35.47556],
  [33.56378, 35.47189],
  [33.56858, 35.47044],
  [33.56481, 35.46568],
  [33.56713, 35.45829],
  [33.56711, 35.45247],
  [33.57254, 35.44682],
  [33.57278, 35.44465],
  [33.57362, 35.44252],
  [33.57395, 35.43856],
  [33.57074, 35.43461],
  [33.57285, 35.43001],
  [33.57545, 35.43156],
  [33.57888, 35.42309],
  [33.5813, 35.42258],
  [33.58145, 35.41562],
  [33.58362, 35.41168],
  [33.58142, 35.40561],
  [33.58542, 35.40152],
  [33.58897, 35.38648],
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
export type Sect = 'shia' | 'sunni' | 'druze' | 'christian' | 'mixed' | 'jewish';

export type Town = {
  id: string;
  name_he: string;
  name_en: string;
  lat: number;
  lon: number;
  pop_band: 'sm' | 'md' | 'lg' | 'xl'; // <2k / 2-10k / 10-30k / >30k
  pop_estimate: number;
  side: 'LB' | 'IL';
  sect?: Sect;
  note?: string;
};

export const towns: Town[] = [
  // ---- Lebanese villages along / near the Blue Line ----
  { id: 'naqoura', name_he: 'נאקורה', name_en: 'Naqoura', lat: 33.1183, lon: 35.1400, pop_band: 'md', pop_estimate: 5000, sect: 'shia', side: 'LB', note: 'מטה יוניפי״ל' },
  { id: 'alma',    name_he: 'עלמא א־שעב', name_en: 'Alma al-Shaab', lat: 33.1039, lon: 35.1828, pop_band: 'sm', pop_estimate: 1800, sect: 'christian', side: 'LB' },
  { id: 'dhayra',  name_he: 'דהירה', name_en: 'Dhayra', lat: 33.0985, lon: 35.1620, pop_band: 'sm', pop_estimate: 1200, sect: 'sunni', side: 'LB' },
  { id: 'mansouri', name_he: 'אל־מנסורי', name_en: 'Al Mansouri', lat: 33.1630, lon: 35.2150, pop_band: 'sm', pop_estimate: 1800, sect: 'shia', side: 'LB' },
  { id: 'majd-zoun', name_he: 'מג׳דל זון', name_en: 'Majdal Zoun', lat: 33.1460, lon: 35.2070, pop_band: 'sm', pop_estimate: 2500, sect: 'shia', side: 'LB' },
  { id: 'zibqin', name_he: 'זבקין', name_en: 'Zibqin', lat: 33.1780, lon: 35.2550, pop_band: 'sm', pop_estimate: 2500, sect: 'shia', side: 'LB' },
  { id: 'siddiqin', name_he: 'סידיקין', name_en: 'Siddiqin', lat: 33.1900, lon: 35.3103, pop_band: 'sm', pop_estimate: 3000, sect: 'shia', side: 'LB' },
  { id: 'ramadiyeh', name_he: 'רמדייה', name_en: 'Ramadiyeh', lat: 33.1980, lon: 35.2850, pop_band: 'sm', pop_estimate: 1800, sect: 'mixed', side: 'LB' },
  { id: 'hallousiyeh', name_he: 'חלוסייה', name_en: 'Hallousiyeh', lat: 33.2360, lon: 35.3100, pop_band: 'sm', pop_estimate: 2200, sect: 'shia', side: 'LB' },
  { id: 'maaroub', name_he: 'מערוב', name_en: 'Maaroub', lat: 33.2480, lon: 35.3200, pop_band: 'sm', pop_estimate: 3000, sect: 'shia', side: 'LB' },
  { id: 'selaa', name_he: 'סלעא', name_en: 'Selaa', lat: 33.1930, lon: 35.3750, pop_band: 'sm', pop_estimate: 1800, sect: 'mixed', side: 'LB' },
  { id: 'batoulay', name_he: 'באטוליה', name_en: 'Batoulay', lat: 33.2100, lon: 35.2550, pop_band: 'sm', pop_estimate: 1600, sect: 'shia', side: 'LB' },
  { id: 'aitaa',   name_he: 'עיתא א־שעב', name_en: 'Aita al-Shaab', lat: 33.0972, lon: 35.3344, pop_band: 'md', pop_estimate: 8000, sect: 'shia', side: 'LB' },
  { id: 'rmeish',  name_he: 'רמייש', name_en: 'Rmeish', lat: 33.0792, lon: 35.3689, pop_band: 'md', pop_estimate: 6500, sect: 'christian', side: 'LB' },
  { id: 'yater', name_he: 'יאטר', name_en: 'Yater', lat: 33.1539, lon: 35.3286, pop_band: 'md', pop_estimate: 4500, sect: 'shia', side: 'LB' },
  { id: 'haris', name_he: 'חריס', name_en: 'Haris', lat: 33.1744, lon: 35.3767, pop_band: 'md', pop_estimate: 4000, sect: 'shia', side: 'LB' },
  { id: 'hadatha', name_he: 'חדאתא', name_en: 'Hadatha', lat: 33.1667, lon: 35.3833, pop_band: 'sm', pop_estimate: 2500, sect: 'shia', side: 'LB' },
  { id: 'beit-yahoun', name_he: 'בית יאחון', name_en: 'Beit Yahoun', lat: 33.1592, lon: 35.4217, pop_band: 'sm', pop_estimate: 2200, sect: 'shia', side: 'LB', note: 'סמוך לרכס הסילבסטר' },
  { id: 'rachaf', name_he: 'רשאף', name_en: 'Rachaf', lat: 33.1850, lon: 35.4430, pop_band: 'sm', pop_estimate: 2500, sect: 'shia', side: 'LB' },
  { id: 'hanine', name_he: 'חאנין', name_en: 'Hanine', lat: 33.1856, lon: 35.2236, pop_band: 'sm', pop_estimate: 1800, sect: 'shia', side: 'LB' },
  { id: 'kafra', name_he: 'כפרא', name_en: 'Kafra', lat: 33.1758, lon: 35.3514, pop_band: 'sm', pop_estimate: 2200, sect: 'shia', side: 'LB' },
  { id: 'yaroun',  name_he: 'יארון', name_en: 'Yaroun', lat: 33.0806, lon: 35.4225, pop_band: 'sm', pop_estimate: 2000, sect: 'mixed', side: 'LB' },
  { id: 'maroun',  name_he: 'מארון א־ראס', name_en: 'Maroun al-Ras', lat: 33.1075, lon: 35.4447, pop_band: 'sm', pop_estimate: 1200, sect: 'shia', side: 'LB' },
  { id: 'aitaroun',name_he: 'עיתרון', name_en: 'Aitaroun', lat: 33.1164, lon: 35.4683, pop_band: 'md', pop_estimate: 6000, sect: 'shia', side: 'LB' },  // Wikipedia: 33°06′59″N 35°28″6″E
  { id: 'bintj',   name_he: 'בינת ג׳בייל', name_en: 'Bint Jbeil', lat: 33.1230, lon: 35.4290, pop_band: 'md', pop_estimate: 9000, sect: 'shia', side: 'LB' },
  { id: 'tibnin',  name_he: 'תיבנין', name_en: 'Tibnin', lat: 33.1933, lon: 35.4108, pop_band: 'md', pop_estimate: 7500, sect: 'shia', side: 'LB' },
  { id: 'sultaniyeh', name_he: 'סולטאנייה', name_en: 'Sultaniyeh', lat: 33.2050, lon: 35.4053, pop_band: 'sm', pop_estimate: 2200, sect: 'shia', side: 'LB' },
  { id: 'tulin', name_he: 'תולין', name_en: 'Tulin', lat: 33.2220, lon: 35.4480, pop_band: 'sm', pop_estimate: 2500, sect: 'mixed', side: 'LB' },
  { id: 'majdal-selm', name_he: 'מג׳דל סלם', name_en: 'Majdal Selm', lat: 33.2310, lon: 35.4960, pop_band: 'sm', pop_estimate: 3500, sect: 'shia', side: 'LB' },
  { id: 'souaneh', name_he: 'סואנה', name_en: 'Souaneh', lat: 33.2470, lon: 35.4550, pop_band: 'sm', pop_estimate: 2200, sect: 'shia', side: 'LB' },
  { id: 'khirbet-selm', name_he: 'ח׳רבת סלם', name_en: 'Khirbet Selm', lat: 33.2180, lon: 35.4700, pop_band: 'sm', pop_estimate: 3000, sect: 'shia', side: 'LB' },
  { id: 'deir-ntar', name_he: 'דיר נטר', name_en: 'Deir Ntar', lat: 33.2186, lon: 35.3758, pop_band: 'sm', pop_estimate: 1800, sect: 'shia', side: 'LB' },
  { id: 'froun', name_he: 'פרון', name_en: 'Froun', lat: 33.2969, lon: 35.4286, pop_band: 'sm', pop_estimate: 2000, sect: 'shia', side: 'LB' },
  { id: 'ghandouriyeh', name_he: 'גנדוריה', name_en: 'Ghandouriyeh', lat: 33.2700, lon: 35.4840, pop_band: 'sm', pop_estimate: 2200, sect: 'shia', side: 'LB' },
  { id: 'qantara', name_he: 'קנטרה', name_en: 'Qantara', lat: 33.2460, lon: 35.5350, pop_band: 'sm', pop_estimate: 1800, sect: 'shia', side: 'LB' },
  { id: 'deir-siryan', name_he: 'דיר סיריאן', name_en: 'Deir Siryan', lat: 33.2520, lon: 35.5310, pop_band: 'sm', pop_estimate: 1800, sect: 'shia', side: 'LB' },
  { id: 'blida',   name_he: 'בלידה', name_en: 'Blida', lat: 33.1400, lon: 35.5153, pop_band: 'sm', pop_estimate: 1800, sect: 'shia', side: 'LB' },
  { id: 'mais',    name_he: 'מייס א־ג׳בל', name_en: 'Mais al-Jabal', lat: 33.1694, lon: 35.5256, pop_band: 'md', pop_estimate: 3500, sect: 'shia', side: 'LB' },
  { id: 'houla',   name_he: 'חולא', name_en: 'Houla', lat: 33.2100, lon: 35.5169, pop_band: 'md', pop_estimate: 5000, sect: 'shia', side: 'LB' },
  { id: 'markaba', name_he: 'מרכבא', name_en: 'Markaba', lat: 33.2333, lon: 35.5167, pop_band: 'sm', pop_estimate: 2200, sect: 'shia', side: 'LB' },
  { id: 'adaiss',  name_he: 'אל־עדייסה', name_en: 'Adaisseh', lat: 33.1330, lon: 35.5680, pop_band: 'sm', pop_estimate: 1500, sect: 'shia', side: 'LB' },
  { id: 'kfark',   name_he: 'כפר כלא', name_en: 'Kfar Kila', lat: 33.2789, lon: 35.5556, pop_band: 'md', pop_estimate: 6000, sect: 'shia', side: 'LB' },
  { id: 'khiam',   name_he: 'אל־ח׳יאם', name_en: 'Khiam', lat: 33.3272, lon: 35.6111, pop_band: 'md', pop_estimate: 22000, sect: 'shia', side: 'LB' },
  { id: 'marjay',  name_he: 'מרג׳עיון', name_en: 'Marjayoun', lat: 33.3619, lon: 35.5897, pop_band: 'md', pop_estimate: 9000, sect: 'christian', side: 'LB' },
  { id: 'ghajar-lb', name_he: "ע'ג'ר", name_en: 'Ghajar (LB)', lat: 33.2728, lon: 35.6231, pop_band: 'sm', pop_estimate: 2500, sect: 'mixed', side: 'LB' },
  { id: 'burj-el-muluk', name_he: 'בורג׳ אל־מלוכ', name_en: 'Burj el-Muluk', lat: 33.3280, lon: 35.5980, pop_band: 'sm', pop_estimate: 2500, sect: 'christian', side: 'LB' },
  { id: 'kawkaba', name_he: 'כאוכבא', name_en: 'Kawkaba', lat: 33.3956, lon: 35.6383, pop_band: 'sm', pop_estimate: 1800, sect: 'christian', side: 'LB' },  // פויקיפדיה: 33°23′44″N 35°38′18″E; צפונית לאל-מארי
  { id: 'kfar-hamam', name_he: 'כפר חמאם', name_en: 'Kfar Hamam', lat: 33.3100, lon: 35.6610, pop_band: 'sm', pop_estimate: 1800, sect: 'sunni', side: 'LB' },
  { id: 'hebbariyeh', name_he: 'הבארייה', name_en: 'Hebbariyeh', lat: 33.3230, lon: 35.7000, pop_band: 'sm', pop_estimate: 2000, sect: 'sunni', side: 'LB' },
  { id: 'ain-arab', name_he: 'עין ערב', name_en: 'Ain Arab', lat: 33.2920, lon: 35.6850, pop_band: 'sm', pop_estimate: 1500, sect: 'mixed', side: 'LB' },
  { id: 'mari', name_he: 'אל-מארי', name_en: 'Al-Mari', lat: 33.3205, lon: 35.6417, pop_band: 'sm', pop_estimate: 1200, sect: 'shia', side: 'LB' },  // mapcarta/OSM: 33.32051, 35.64174; מזרחית לאל-חיאם, דרומית לכאוכבא
  { id: 'tyre',    name_he: 'צור', name_en: 'Tyre / Sour', lat: 33.2700, lon: 35.2030, pop_band: 'xl', pop_estimate: 120000, sect: 'shia', side: 'LB' },
  { id: 'burj-el-shemali', name_he: 'בורג׳ א־שמאלי', name_en: 'Burj el-Shemali', lat: 33.2860, lon: 35.2370, pop_band: 'md', pop_estimate: 10000, sect: 'shia', side: 'LB' },
  { id: 'rashidiyeh', name_he: 'ראשידייה', name_en: 'Rashidiyeh', lat: 33.2360, lon: 35.2220, pop_band: 'md', pop_estimate: 7000, sect: 'mixed', side: 'LB' },
  { id: 'ain-baal', name_he: 'עין בעל', name_en: 'Ain Baal', lat: 33.2920, lon: 35.2900, pop_band: 'md', pop_estimate: 5000, sect: 'shia', side: 'LB' },
  { id: 'hanaouay', name_he: 'חנאווייה', name_en: 'Hanaouay', lat: 33.2520, lon: 35.3300, pop_band: 'sm', pop_estimate: 2500, sect: 'mixed', side: 'LB' },
  { id: 'derdkaya', name_he: 'דרדקאיה', name_en: 'Derdghaya', lat: 33.2920, lon: 35.3460, pop_band: 'sm', pop_estimate: 2500, sect: 'christian', side: 'LB' },
  { id: 'sidon',   name_he: 'צידון', name_en: 'Sidon / Saida', lat: 33.5630, lon: 35.3680, pop_band: 'xl', pop_estimate: 200000, sect: 'sunni', side: 'LB', note: 'נקודת ייחוס צפונית לאזור הזהראני' },
  { id: 'nabat',   name_he: 'נבטיה', name_en: 'Nabatieh', lat: 33.3780, lon: 35.4840, pop_band: 'xl', pop_estimate: 110000, sect: 'shia', side: 'LB' },
  { id: 'mayfadoun', name_he: 'מייפדון', name_en: 'Mayfadoun', lat: 33.3600, lon: 35.4750, pop_band: 'sm', pop_estimate: 3500, sect: 'christian', side: 'LB' },
  { id: 'zibdine', name_he: 'זבדין', name_en: 'Zibdine', lat: 33.3950, lon: 35.5030, pop_band: 'sm', pop_estimate: 2500, sect: 'shia', side: 'LB' },
  { id: 'jibchit', name_he: 'ג׳יבשית', name_en: 'Jibchit', lat: 33.3600, lon: 35.4330, pop_band: 'md', pop_estimate: 5000, sect: 'shia', side: 'LB' },
  { id: 'shoukine', name_he: 'שוקין', name_en: 'Shoukine', lat: 33.3970, lon: 35.5150, pop_band: 'sm', pop_estimate: 2500, sect: 'shia', side: 'LB' },
  { id: 'kfar-jaouz', name_he: 'כפר ג׳וז', name_en: 'Kfar Jaouz', lat: 33.3820, lon: 35.5120, pop_band: 'sm', pop_estimate: 2500, sect: 'shia', side: 'LB' },
  { id: 'kana',    name_he: 'קאנא', name_en: 'Qana', lat: 33.2090, lon: 35.3030, pop_band: 'md', pop_estimate: 12000, sect: 'shia', side: 'LB' },
  { id: 'bafliyeh', name_he: 'בפלייה', name_en: 'Bafliyeh', lat: 33.2410, lon: 35.3500, pop_band: 'sm', pop_estimate: 2200, sect: 'shia', side: 'LB' },
  { id: 'jwaya-west', name_he: 'ג׳וויא מערב', name_en: 'Jwaya area', lat: 33.2500, lon: 35.3870, pop_band: 'sm', pop_estimate: 2200, sect: 'shia', side: 'LB', note: 'נקודת ייחוס באזור ג׳וויא' },
  { id: 'mahrouneh', name_he: 'מחרונה', name_en: 'Mahrouneh', lat: 33.2750, lon: 35.3880, pop_band: 'sm', pop_estimate: 2500, sect: 'christian', side: 'LB' },
  { id: 'barish', name_he: 'באריש', name_en: 'Barish', lat: 33.2731, lon: 35.3539, pop_band: 'sm', pop_estimate: 2200, sect: 'shia', side: 'LB' },
  { id: 'srifa',   name_he: 'סריפא', name_en: 'Srifa', lat: 33.2570, lon: 35.3540, pop_band: 'md', pop_estimate: 4500, sect: 'shia', side: 'LB' },
  { id: 'taybeh',  name_he: 'טייבה', name_en: 'Taybeh', lat: 33.2380, lon: 35.4720, pop_band: 'sm', pop_estimate: 2800, sect: 'shia', side: 'LB' },
  { id: 'yarine',  name_he: 'יארין', name_en: 'Yarine', lat: 33.0890, lon: 35.2080, pop_band: 'sm', pop_estimate: 1600, sect: 'sunni', side: 'LB' },
  { id: 'jibbain', name_he: 'ג׳יביין', name_en: 'Jibbain', lat: 33.1150, lon: 35.2220, pop_band: 'sm', pop_estimate: 1300, sect: 'shia', side: 'LB' },
  { id: 'chihine', name_he: 'שיחין', name_en: 'Chihine', lat: 33.1120, lon: 35.2470, pop_band: 'sm', pop_estimate: 1300, sect: 'shia', side: 'LB' },
  { id: 'ramyah',  name_he: 'ראמיה', name_en: 'Ramyah', lat: 33.0940, lon: 35.3050, pop_band: 'sm', pop_estimate: 900, sect: 'shia', side: 'LB' },
  { id: 'beitlif', name_he: 'בית ליף', name_en: 'Beit Lif', lat: 33.1270, lon: 35.3390, pop_band: 'sm', pop_estimate: 1800, sect: 'shia', side: 'LB' },
  { id: 'debel',   name_he: 'דבל', name_en: 'Debel', lat: 33.1120, lon: 35.3720, pop_band: 'sm', pop_estimate: 1600, sect: 'christian', side: 'LB' },
  { id: 'qouzah',  name_he: 'קוזח', name_en: 'Qouzah', lat: 33.1080, lon: 35.3530, pop_band: 'sm', pop_estimate: 1200, sect: 'shia', side: 'LB' },
  { id: 'braachit', name_he: 'ברעשית', name_en: 'Braachit', lat: 33.1761, lon: 35.4433, pop_band: 'sm', pop_estimate: 2500, sect: 'mixed', side: 'LB' },
  { id: 'shaquara', name_he: 'שקרא', name_en: 'Shaqra', lat: 33.1510, lon: 35.4870, pop_band: 'sm', pop_estimate: 2800, sect: 'shia', side: 'LB' },
  { id: 'safad',   name_he: 'ספד אל־בטיח׳', name_en: 'Safad al-Battikh', lat: 33.1590, lon: 35.4610, pop_band: 'sm', pop_estimate: 1800, sect: 'mixed', side: 'LB' },
  { id: 'aynata',  name_he: 'עיינאתא', name_en: 'Aynata', lat: 33.1220, lon: 35.4440, pop_band: 'sm', pop_estimate: 2000, sect: 'shia', side: 'LB' },
  { id: 'kounine', name_he: 'קונין', name_en: 'Kounine', lat: 33.1460, lon: 35.4380, pop_band: 'sm', pop_estimate: 2300, sect: 'shia', side: 'LB' },
  { id: 'qabriha', name_he: 'קבריח׳א', name_en: 'Qabrikha', lat: 33.2350, lon: 35.5110, pop_band: 'sm', pop_estimate: 1800, sect: 'shia', side: 'LB' },
  { id: 'bani-hayyan', name_he: 'בני חיאן', name_en: 'Bani Hayyan', lat: 33.2080, lon: 35.5270, pop_band: 'sm', pop_estimate: 1600, sect: 'shia', side: 'LB' },
  { id: 'tallouseh', name_he: 'טלוסה', name_en: 'Tallouseh', lat: 33.2210, lon: 35.5520, pop_band: 'sm', pop_estimate: 2200, sect: 'shia', side: 'LB' },
  { id: 'rabb-thalathine', name_he: 'רב תלתין', name_en: 'Rabb Thalathine', lat: 33.1800, lon: 35.5660, pop_band: 'sm', pop_estimate: 1300, sect: 'shia', side: 'LB' },
  { id: 'mhaibib', name_he: 'מוחייביב', name_en: 'Mhaibib', lat: 33.1410, lon: 35.5450, pop_band: 'sm', pop_estimate: 900, sect: 'shia', side: 'LB' },
  { id: 'deir-mimas', name_he: 'דיר מימאס', name_en: 'Deir Mimas', lat: 33.3019, lon: 35.5453, pop_band: 'sm', pop_estimate: 1800, sect: 'christian', side: 'LB' },
  { id: 'qlaiaa',  name_he: 'קליעה', name_en: 'Qlayaa', lat: 33.3380, lon: 35.5750, pop_band: 'sm', pop_estimate: 2500, sect: 'shia', side: 'LB' },
  { id: 'ebel-saqi', name_he: 'אבל א־סאקי', name_en: 'Ebel es-Saqi', lat: 33.3573, lon: 35.6275, pop_band: 'sm', pop_estimate: 2000, sect: 'mixed', side: 'LB' },
  { id: 'hasbaya', name_he: 'חצביא', name_en: 'Hasbaya', lat: 33.3970, lon: 35.6850, pop_band: 'md', pop_estimate: 7500, sect: 'mixed', side: 'LB' },
  { id: 'shebaa',  name_he: 'שבעא', name_en: 'Shebaa', lat: 33.3620, lon: 35.7260, pop_band: 'md', pop_estimate: 5000, sect: 'sunni', side: 'LB' },
  { id: 'kfar-chouba', name_he: 'כפר שובא', name_en: 'Kfar Chouba', lat: 33.3190, lon: 35.6820, pop_band: 'sm', pop_estimate: 1800, sect: 'sunni', side: 'LB' },
  { id: 'rashaya-foukhar', name_he: 'ראשיא אל־פוח׳אר', name_en: 'Rashaya al-Foukhar', lat: 33.3330, lon: 35.6720, pop_band: 'sm', pop_estimate: 2000, sect: 'druze', side: 'LB' },
  { id: 'chehabiyeh', name_he: 'שהאביה', name_en: 'Chehabiyeh', lat: 33.2070, lon: 35.3460, pop_band: 'sm', pop_estimate: 2600, sect: 'mixed', side: 'LB' },
  { id: 'abbasiyeh', name_he: 'עבאסייה', name_en: 'Abbasiyeh', lat: 33.2910, lon: 35.3070, pop_band: 'md', pop_estimate: 5000, sect: 'shia', side: 'LB' },
  { id: 'maarakeh', name_he: 'מערכה', name_en: 'Maarakeh', lat: 33.2728, lon: 35.3097, pop_band: 'md', pop_estimate: 7000, sect: 'shia', side: 'LB' },
  { id: 'bazouriyeh', name_he: 'בזוריה', name_en: 'Bazouriyeh', lat: 33.3150, lon: 35.3160, pop_band: 'md', pop_estimate: 6000, sect: 'shia', side: 'LB' },
  { id: 'jouaiya', name_he: 'ג׳וויא', name_en: 'Jouaiya', lat: 33.2540, lon: 35.3990, pop_band: 'md', pop_estimate: 6000, sect: 'shia', side: 'LB' },
  { id: 'deir-qanoun-nahr', name_he: 'דיר קאנון א־נהר', name_en: 'Deir Qanoun El Nahr', lat: 33.3190, lon: 35.2780, pop_band: 'sm', pop_estimate: 3000, sect: 'shia', side: 'LB' },
  { id: 'qaaqaiyet-el-jisr', name_he: 'קעקעית אל־ג׳סר', name_en: 'Qaaqaiyet el-Jisr', lat: 33.3530, lon: 35.4500, pop_band: 'sm', pop_estimate: 2600, sect: 'shia', side: 'LB' },
  { id: 'arnoun', name_he: 'ארנון', name_en: 'Arnoun', lat: 33.3340, lon: 35.5240, pop_band: 'sm', pop_estimate: 2500, sect: 'shia', side: 'LB', note: 'סמוך למצודת בופור' },
  { id: 'kfar-rumman', name_he: 'כפר רומאן', name_en: 'Kfar Rumman', lat: 33.3730, lon: 35.5060, pop_band: 'sm', pop_estimate: 3500, sect: 'shia', side: 'LB' },
  { id: 'zawtar', name_he: 'זותר', name_en: 'Zawtar', lat: 33.3450, lon: 35.4720, pop_band: 'sm', pop_estimate: 2500, sect: 'shia', side: 'LB' },
  { id: 'yohmor', name_he: 'יוחמור א־שקיף', name_en: 'Yohmor el-Chqif', lat: 33.3160, lon: 35.5140, pop_band: 'sm', pop_estimate: 2400, sect: 'shia', side: 'LB' },
  { id: 'kfar-tebnit', name_he: 'כפר תבניט', name_en: 'Kfar Tebnit', lat: 33.3450, lon: 35.4980, pop_band: 'sm', pop_estimate: 3000, sect: 'shia', side: 'LB' },
  { id: 'habbouch', name_he: 'חבוש', name_en: 'Habbouch', lat: 33.4080, lon: 35.4810, pop_band: 'md', pop_estimate: 7000, sect: 'shia', side: 'LB' },
  { id: 'douair', name_he: 'דוייר', name_en: 'Doueir', lat: 33.3990, lon: 35.4440, pop_band: 'sm', pop_estimate: 3500, sect: 'druze', side: 'LB' },
  { id: 'harouf', name_he: 'חרוף', name_en: 'Harouf', lat: 33.4070, lon: 35.4680, pop_band: 'sm', pop_estimate: 3500, sect: 'shia', side: 'LB' },
  { id: 'kfar-sir', name_he: 'כפר סיר', name_en: 'Kfar Sir', lat: 33.3470, lon: 35.4320, pop_band: 'sm', pop_estimate: 3000, sect: 'shia', side: 'LB' },
  { id: 'arab-salim', name_he: 'ערב סלים', name_en: 'Arab Salim', lat: 33.4390, lon: 35.4850, pop_band: 'sm', pop_estimate: 3500, sect: 'shia', side: 'LB' },
  { id: 'houmine-fawqa', name_he: 'חומין אל־פוקא', name_en: 'Houmine el-Faouqa', lat: 33.4490, lon: 35.4660, pop_band: 'sm', pop_estimate: 2500, sect: 'shia', side: 'LB' },
  { id: 'houmine-tahta', name_he: 'חומין אל־תחתא', name_en: 'Houmine el-Tahta', lat: 33.4300, lon: 35.4310, pop_band: 'sm', pop_estimate: 2500, sect: 'shia', side: 'LB' },
  { id: 'kfour', name_he: 'כפור', name_en: 'Kfour', lat: 33.4110, lon: 35.5120, pop_band: 'sm', pop_estimate: 2500, sect: 'druze', side: 'LB' },
  { id: 'roumine', name_he: 'רומין', name_en: 'Roumine', lat: 33.4660, lon: 35.5150, pop_band: 'sm', pop_estimate: 2500, sect: 'mixed', side: 'LB' },
  { id: 'kfar-fila', name_he: 'כפר פילה', name_en: 'Kfar Fila', lat: 33.4890, lon: 35.5000, pop_band: 'sm', pop_estimate: 2500, sect: 'shia', side: 'LB' },
  { id: 'jarjouaa', name_he: 'ג׳רג׳וע', name_en: 'Jarjouaa', lat: 33.4870, lon: 35.5600, pop_band: 'sm', pop_estimate: 2800, sect: 'shia', side: 'LB' },
  { id: 'mlikh', name_he: 'מליח׳', name_en: 'Mlikh', lat: 33.4700, lon: 35.5410, pop_band: 'sm', pop_estimate: 1800, sect: 'mixed', side: 'LB' },
  { id: 'jbaa', name_he: 'ג׳באע', name_en: 'Jbaa', lat: 33.4910, lon: 35.5550, pop_band: 'sm', pop_estimate: 3000, sect: 'shia', side: 'LB' },
  { id: 'ansar', name_he: 'אנסאר', name_en: 'Ansar', lat: 33.3860, lon: 35.3980, pop_band: 'md', pop_estimate: 6000, sect: 'shia', side: 'LB' },
  { id: 'zrarieh', name_he: 'זרריה', name_en: 'Zrarieh', lat: 33.3800, lon: 35.3430, pop_band: 'md', pop_estimate: 5000, sect: 'shia', side: 'LB' },
  { id: 'loubiyeh', name_he: 'לוביה', name_en: 'Loubieh', lat: 33.3960, lon: 35.3600, pop_band: 'sm', pop_estimate: 3000, sect: 'shia', side: 'LB' },
  { id: 'tuffahata', name_he: 'תפאחתא', name_en: 'Tuffahata', lat: 33.3900, lon: 35.3300, pop_band: 'sm', pop_estimate: 2000, sect: 'shia', side: 'LB' },
  { id: 'insariyeh', name_he: 'אנסארייה', name_en: 'Ansariyeh', lat: 33.3940, lon: 35.2950, pop_band: 'sm', pop_estimate: 3000, sect: 'shia', side: 'LB' },
  { id: 'adlun', name_he: 'עדלון', name_en: 'Adloun', lat: 33.4020, lon: 35.2780, pop_band: 'md', pop_estimate: 6000, sect: 'sunni', side: 'LB' },
  { id: 'kharayeb', name_he: 'ח׳ראייב', name_en: 'Kharayeb', lat: 33.4180, lon: 35.3350, pop_band: 'md', pop_estimate: 5000, sect: 'shia', side: 'LB' },
  { id: 'saksakiyeh', name_he: 'סקסכייה', name_en: 'Saksakiyeh', lat: 33.4270, lon: 35.3330, pop_band: 'sm', pop_estimate: 3000, sect: 'shia', side: 'LB' },
  { id: 'babliyeh', name_he: 'בביליה', name_en: 'Babliyeh', lat: 33.4220, lon: 35.3620, pop_band: 'sm', pop_estimate: 2500, sect: 'mixed', side: 'LB' },
  { id: 'sarafand', name_he: 'צרפנד', name_en: 'Sarafand', lat: 33.4500, lon: 35.2850, pop_band: 'md', pop_estimate: 10000, sect: 'shia', side: 'LB' },
  { id: 'zahrani-area', name_he: 'אזור הזהראני', name_en: 'Zahrani area', lat: 33.4860, lon: 35.3430, pop_band: 'md', pop_estimate: 8000, sect: 'shia', side: 'LB', note: 'אזור ייחוס צפוני למרחב' },
  { id: 'ghaziyeh', name_he: 'ע׳אזייה', name_en: 'Ghaziyeh', lat: 33.5170, lon: 35.3680, pop_band: 'md', pop_estimate: 12000, sect: 'shia', side: 'LB', note: 'סמוך לצידון, מצפון לזהראני' },
  { id: 'maghdoucheh', name_he: 'מגדושה', name_en: 'Maghdoucheh', lat: 33.5310, lon: 35.3970, pop_band: 'md', pop_estimate: 8000, sect: 'druze', side: 'LB' },
  { id: 'haret-saida', name_he: 'חארת צידא', name_en: 'Haret Saida', lat: 33.5480, lon: 35.3820, pop_band: 'md', pop_estimate: 9000, sect: 'sunni', side: 'LB' },
  { id: 'miyeh-miyeh', name_he: 'מייה ומייה', name_en: 'Mieh Mieh', lat: 33.5410, lon: 35.4020, pop_band: 'md', pop_estimate: 6000, sect: 'sunni', side: 'LB' },
  { id: 'ain-el-hilweh', name_he: 'עין אל־חילווה', name_en: 'Ain al-Hilweh', lat: 33.5450, lon: 35.3860, pop_band: 'lg', pop_estimate: 50000, sect: 'sunni', side: 'LB' },
  { id: 'abra', name_he: 'עברה', name_en: 'Abra', lat: 33.5570, lon: 35.4070, pop_band: 'md', pop_estimate: 7000, sect: 'sunni', side: 'LB' },
  { id: 'bnaafoul', name_he: 'בנאפול', name_en: 'Bnaafoul', lat: 33.5100, lon: 35.4350, pop_band: 'sm', pop_estimate: 2500, sect: 'mixed', side: 'LB' },
  { id: 'tanbourit', name_he: 'טנבורית', name_en: 'Tanbourit', lat: 33.4940, lon: 35.3930, pop_band: 'sm', pop_estimate: 2500, sect: 'shia', side: 'LB' },
  { id: 'kaouthariyet-el-siyad', name_he: 'כותריית א־סיאד', name_en: 'Kaouthariyet el-Siyad', lat: 33.4750, lon: 35.3470, pop_band: 'sm', pop_estimate: 3000, sect: 'shia', side: 'LB' },
  { id: 'kfar-hatta', name_he: 'כפר חתה', name_en: 'Kfar Hatta', lat: 33.4560, lon: 35.3860, pop_band: 'sm', pop_estimate: 2500, sect: 'shia', side: 'LB' },
  { id: 'khartoum', name_he: 'ח׳רטום', name_en: 'Khartoum', lat: 33.4580, lon: 35.4200, pop_band: 'sm', pop_estimate: 2000, sect: 'shia', side: 'LB' },
  { id: 'mazraat-kawthariyeh', name_he: 'מזרעת כותרייה', name_en: 'Mazraat Kawthariyah', lat: 33.4680, lon: 35.3650, pop_band: 'sm', pop_estimate: 2000, sect: 'shia', side: 'LB' },
  // ---- Israeli border reference communities ----
  // ---- Israeli communities — verified coordinates (Wikipedia/CBS) ----
  // Western sector: coast → Galilee
  { id: 'nahari',    name_he: 'נהריה', name_en: 'Nahariya', lat: 33.0070, lon: 35.0980, pop_band: 'lg', pop_estimate: 60000, side: 'IL' },
  { id: 'rosh',      name_he: 'ראש הנקרה', name_en: 'Rosh HaNikra', lat: 33.0890, lon: 35.1100, pop_band: 'sm', pop_estimate: 200, side: 'IL' },
  { id: 'shlomi',    name_he: 'שלומי', name_en: 'Shlomi', lat: 33.0760, lon: 35.1430, pop_band: 'md', pop_estimate: 6500, side: 'IL' },
  { id: 'liman',     name_he: 'לימן', name_en: 'Liman', lat: 33.0589, lon: 35.1128, pop_band: 'sm', pop_estimate: 480, side: 'IL' },
  { id: 'kabri',     name_he: 'כברי', name_en: 'Kibbutz Kabri', lat: 33.0208, lon: 35.1489, pop_band: 'sm', pop_estimate: 800, side: 'IL' },
  { id: 'evron',     name_he: 'עברון', name_en: 'Evron', lat: 32.9914, lon: 35.1003, pop_band: 'sm', pop_estimate: 1100, side: 'IL' },
  // Western heights: Adamit ridge
  { id: 'ya-ara',    name_he: 'יערה', name_en: "Ya'ara", lat: 33.0669, lon: 35.1847, pop_band: 'sm', pop_estimate: 650, side: 'IL' },
  { id: 'adamit',    name_he: 'אדמית', name_en: 'Adamit', lat: 33.0783, lon: 35.2111, pop_band: 'sm', pop_estimate: 350, side: 'IL' },
  { id: 'manot',     name_he: 'מנות', name_en: 'Manot', lat: 33.0386, lon: 35.1953, pop_band: 'sm', pop_estimate: 500, side: 'IL' },
  { id: 'elkosh',    name_he: 'אלקוש', name_en: 'Elkosh', lat: 33.0333, lon: 35.3228, pop_band: 'sm', pop_estimate: 600, side: 'IL' },
  { id: 'zarit',     name_he: 'זרעית', name_en: 'Zarit', lat: 33.1000, lon: 35.2886, pop_band: 'sm', pop_estimate: 300, side: 'IL' },
  { id: 'shtula',    name_he: 'שתולה', name_en: 'Shtula', lat: 33.0856, lon: 35.3131, pop_band: 'sm', pop_estimate: 350, side: 'IL' },
  { id: 'goren',     name_he: 'גורן', name_en: 'Goren', lat: 33.0567, lon: 35.2392, pop_band: 'sm', pop_estimate: 600, side: 'IL' },
  // Central Galilee: Maalot area
  { id: 'tzurit',    name_he: 'צורית', name_en: 'Tzurit', lat: 32.9019, lon: 35.2506, pop_band: 'sm', pop_estimate: 700, side: 'IL' },
  { id: 'kfar-vradim', name_he: 'כפר ורדים', name_en: 'Kfar Vradim', lat: 32.9906, lon: 35.2736, pop_band: 'sm', pop_estimate: 4500, side: 'IL' },
  { id: 'maalot-tarshiha', name_he: 'מעלות-תרשיחא', name_en: "Ma'alot-Tarshiha", lat: 33.0167, lon: 35.2708, pop_band: 'md', pop_estimate: 22000, side: 'IL' },
  { id: 'fassouta',  name_he: 'פסוטה', name_en: 'Fassouta', lat: 33.0494, lon: 35.3058, pop_band: 'sm', pop_estimate: 3500, side: 'IL' },
  { id: 'peqi-in',   name_he: 'פקיעין', name_en: "Peki'in", lat: 32.9742, lon: 35.3314, pop_band: 'sm', pop_estimate: 4800, side: 'IL' },
  { id: 'hurfeish',  name_he: 'חורפיש', name_en: 'Hurfeish', lat: 33.0178, lon: 35.3461, pop_band: 'sm', pop_estimate: 5500, side: 'IL' },
  { id: 'beit-jann', name_he: "בית ג'ן", name_en: 'Beit Jann', lat: 32.9653, lon: 35.3794, pop_band: 'sm', pop_estimate: 6500, side: 'IL' },
  // Upper Galilee: Meron → Baram area
  { id: 'sasa',      name_he: 'סאסא', name_en: 'Sasa', lat: 33.0269, lon: 35.3944, pop_band: 'sm', pop_estimate: 750, side: 'IL' },
  { id: 'dovev',     name_he: 'דובב', name_en: 'Dovev', lat: 33.0522, lon: 35.4075, pop_band: 'sm', pop_estimate: 400, side: 'IL' },
  { id: 'baram',     name_he: 'ברעם', name_en: "Bar'am", lat: 33.0583, lon: 35.4333, pop_band: 'sm', pop_estimate: 950, side: 'IL' },
  { id: 'yiron',     name_he: 'יראון', name_en: "Yir'on", lat: 33.0769, lon: 35.4550, pop_band: 'sm', pop_estimate: 1100, side: 'IL' },
  { id: 'avivim',    name_he: 'אביבים', name_en: 'Avivim', lat: 33.0892, lon: 35.4719, pop_band: 'sm', pop_estimate: 300, side: 'IL' },
  // Malkia – Metula corridor
  { id: 'malkia',    name_he: 'מלכייה', name_en: 'Malkia', lat: 33.0983, lon: 35.5111, pop_band: 'sm', pop_estimate: 600, side: 'IL' },
  { id: 'kfar-blum', name_he: 'כפר בלום', name_en: 'Kfar Blum', lat: 33.1722, lon: 35.6097, pop_band: 'sm', pop_estimate: 700, side: 'IL' },
  { id: 'manara',    name_he: 'מנרה', name_en: 'Manara', lat: 33.1958, lon: 35.5444, pop_band: 'sm', pop_estimate: 250, side: 'IL' },
  { id: 'margaliot', name_he: 'מרגליות', name_en: 'Margaliot', lat: 33.2144, lon: 35.5447, pop_band: 'sm', pop_estimate: 350, side: 'IL' },
  { id: 'misgav',    name_he: 'משגב עם', name_en: 'Misgav Am', lat: 33.2478, lon: 35.5483, pop_band: 'sm', pop_estimate: 350, side: 'IL' },
  { id: 'metula',    name_he: 'מטולה', name_en: 'Metula', lat: 33.2789, lon: 35.5744, pop_band: 'sm', pop_estimate: 1800, side: 'IL' },
  { id: 'kiryat',    name_he: 'קריית שמונה', name_en: 'Kiryat Shmona', lat: 33.2070, lon: 35.5700, pop_band: 'lg', pop_estimate: 24000, side: 'IL' },
  // Hula Valley – Hermon foothills
  { id: 'kfar-giladi', name_he: 'כפר גלעדי', name_en: 'Kfar Giladi', lat: 33.2425, lon: 35.5750, pop_band: 'sm', pop_estimate: 1400, side: 'IL' },
  { id: 'yuval',     name_he: 'יובל', name_en: 'Yuval', lat: 33.2467, lon: 35.5983, pop_band: 'sm', pop_estimate: 634, side: 'IL' },
  { id: 'maayan-baruch', name_he: 'מעיין ברוך', name_en: "Ma'ayan Baruch", lat: 33.2411, lon: 35.6089, pop_band: 'sm', pop_estimate: 500, side: 'IL' },
  { id: 'lehavot-habashan', name_he: 'להבות הבשן', name_en: 'Lehavot HaBashan', lat: 33.1414, lon: 35.6467, pop_band: 'sm', pop_estimate: 700, side: 'IL' },
  { id: 'kfar-szold', name_he: 'כפר סאלד', name_en: 'Kfar Szold', lat: 33.1953, lon: 35.6575, pop_band: 'sm', pop_estimate: 600, side: 'IL' },
  { id: 'beit-hillel', name_he: 'בית הלל', name_en: 'Beit Hillel', lat: 33.2075, lon: 35.6058, pop_band: 'sm', pop_estimate: 1200, side: 'IL' },
  { id: 'hagoshrim', name_he: 'הגושרים', name_en: 'HaGoshrim', lat: 33.2208, lon: 35.6236, pop_band: 'sm', pop_estimate: 800, side: 'IL' },
  { id: 'ghajar-il', name_he: "ע'ג'ר", name_en: 'Ghajar', lat: 33.2728, lon: 35.6231, pop_band: 'sm', pop_estimate: 2500, side: 'IL' },
  { id: 'she-ar-yashuv', name_he: 'שאר ישוב', name_en: "She'ar Yashuv", lat: 33.2264, lon: 35.6467, pop_band: 'sm', pop_estimate: 500, side: 'IL' },
  { id: 'snir',      name_he: 'שניר', name_en: 'Snir', lat: 33.2403, lon: 35.6778, pop_band: 'sm', pop_estimate: 400, side: 'IL' },
  { id: 'dan-kibbutz', name_he: 'דן', name_en: 'Dan', lat: 33.2403, lon: 35.6531, pop_band: 'sm', pop_estimate: 600, side: 'IL' },
  // Golan / Hermon communities
  { id: 'neve-ativ',  name_he: 'נווה אטיב', name_en: 'Neve Ativ', lat: 33.2617, lon: 35.7411, pop_band: 'sm', pop_estimate: 700, side: 'IL' },
  { id: 'nimrod',     name_he: 'נמרוד', name_en: 'Nimrod', lat: 33.2453, lon: 35.7514, pop_band: 'sm', pop_estimate: 400, side: 'IL' },
  { id: 'ein-qiniyye', name_he: 'עין קיניה', name_en: 'Ein Qiniyye', lat: 33.2369, lon: 35.7308, pop_band: 'sm', pop_estimate: 2500, side: 'IL' },
  { id: 'majdal-shams', name_he: "מג'דל שמס", name_en: 'Majdal Shams', lat: 33.2670, lon: 35.7670, pop_band: 'md', pop_estimate: 11000, side: 'IL' },
  { id: 'masada-golan', name_he: 'מסעדה', name_en: "Mas'ade", lat: 33.2331, lon: 35.7575, pop_band: 'sm', pop_estimate: 9000, side: 'IL' },
  { id: 'buqata',    name_he: 'בוקעתא', name_en: "Buq'ata", lat: 33.2000, lon: 35.7830, pop_band: 'md', pop_estimate: 9500, side: 'IL' },
  { id: 'el-rom',    name_he: 'אל-רום', name_en: 'El-Rom', lat: 33.1794, lon: 35.7714, pop_band: 'sm', pop_estimate: 500, side: 'IL' },
  // Additional reference communities
  { id: 'rosh-pina', name_he: 'ראש פינה', name_en: 'Rosh Pinna', lat: 32.9700, lon: 35.5422, pop_band: 'sm', pop_estimate: 3000, side: 'IL' },
  { id: 'hazor',     name_he: 'חצור הגלילית', name_en: 'Hazor HaGlilit', lat: 32.9794, lon: 35.5436, pop_band: 'md', pop_estimate: 9000, side: 'IL' },
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
  { id: 'litani', name_he: 'נהר הליטני', name_en: 'Litani River', type: 'river', lat: 33.318, lon: 35.420, note_he: 'תוואי נהר מקורב' },
  { id: 'awali', name_he: 'נהר האוואלי', name_en: 'Awali River', type: 'river', lat: 33.615, lon: 35.540, note_he: 'נהר מצפון למרחב המפה' },
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
  { id: 'maroun-ridge', name_he: 'רכס מארון א־ראס', name_en: 'Maroun al-Ras Ridge', type: 'ridge', lat: 33.1075, lon: 35.4447 },
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
