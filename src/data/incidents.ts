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
