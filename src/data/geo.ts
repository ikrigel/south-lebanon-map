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
  { id: 'nabat',   name_he: 'נבטיה', name_en: 'Nabatieh', lat: 33.3780, lon: 35.4840, pop_band: 'xl', pop_estimate: 110000, side: 'LB' },
  { id: 'kana',    name_he: 'קאנא', name_en: 'Qana', lat: 33.2090, lon: 35.3030, pop_band: 'md', pop_estimate: 12000, side: 'LB' },
  { id: 'srifa',   name_he: 'סריפא', name_en: 'Srifa', lat: 33.2570, lon: 35.3540, pop_band: 'md', pop_estimate: 4500, side: 'LB' },
  { id: 'taybeh',  name_he: 'טייבה', name_en: 'Taybeh', lat: 33.2380, lon: 35.4720, pop_band: 'sm', pop_estimate: 2800, side: 'LB' },
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
