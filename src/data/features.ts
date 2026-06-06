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
  { id: 'zahrani', name_he: 'נהר הזהרני / הזהראני', name_en: 'Zahrani River', type: 'river', lat: 33.4430, lon: 35.4590, note_he: 'מוכר גם בכתיב נהר הזהראני' },
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
