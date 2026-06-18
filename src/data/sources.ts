export type SourceEntry = {
  category: 'un' | 'media' | 'osm' | 'data';
  title_he: string;
  url: string;
};

export const sources: SourceEntry[] = [
  // UN / official
  { category: 'un', title_he: 'UNIFIL — אתר רשמי של כוח האו״ם בדרום לבנון', url: 'https://unifil.unmissions.org/' },
  { category: 'un', title_he: 'UN News — הסבר על החלטה 1701 (אוקטובר 2024)', url: 'https://news.un.org/en/story/2024/10/1155221' },
  { category: 'un', title_he: 'Wikipedia — החלטת מועצת הביטחון 1701', url: 'https://en.wikipedia.org/wiki/United_Nations_Security_Council_Resolution_1701' },
  { category: 'un', title_he: 'Wikipedia — הקו הכחול (Blue Line)', url: 'https://en.wikipedia.org/wiki/Blue_Line_(withdrawal_line)' },
  { category: 'un', title_he: 'Wikipedia — UNIFIL', url: 'https://en.wikipedia.org/wiki/United_Nations_Interim_Force_in_Lebanon' },
  { category: 'un', title_he: 'UN OCHA / ReliefWeb — דרום לבנון', url: 'https://reliefweb.int/country/lbn' },
  { category: 'un', title_he: 'OCHA Flash Update — הסלמת אוקטובר 2023', url: 'https://reliefweb.int/report/lebanon/lebanon-flash-update-1-escalation-hostilities-south-lebanon-9-october-2023' },
  // Media
  { category: 'media', title_he: 'Reuters — מטח רקטות מאזור צור (אפריל 2023)', url: 'https://www.reuters.com/world/middle-east/least-25-rockets-fired-lebanon-into-israel-israeli-army-says-2023-04-06/' },
  { category: 'media', title_he: 'Reuters — תקיפות נרחבות בדרום לבנון (ספטמבר 2024)', url: 'https://www.reuters.com/world/middle-east/israel-launches-air-strikes-across-southern-lebanon-2024-09-23/' },
  { category: 'media', title_he: 'Reuters — הפסקת אש לבנון–ישראל (נובמבר 2024)', url: 'https://www.reuters.com/world/middle-east/lebanon-israel-ceasefire-2024-11-27/' },
  { category: 'media', title_he: 'BBC — סיקור התקיפות באזור הגבול (2023–2024)', url: 'https://www.bbc.com/news/world-middle-east-67482000' },
  { category: 'media', title_he: 'BBC / ACLED — נזקים וחשש לאורך גבול לבנון–ישראל', url: 'https://acleddata.com/media-citation/damage-destruction-and-fear-along-israel-lebanon-border-bbc' },
  { category: 'media', title_he: 'AP — סיקור אירועי הגבול הצפוני', url: 'https://apnews.com/article/israel-lebanon-hezbollah-border-attacks-7c3e7f6b6a5d' },
  { category: 'media', title_he: 'NPR — תקיפה באזור מסיילה (אוקטובר 2025)', url: 'https://www.npr.org/2025/10/11/g-s1-93117/israel-strikes-south-lebanon' },
  { category: 'media', title_he: 'Times of Israel — סיקור שוטף של אזור הגבול', url: 'https://www.timesofisrael.com/' },
  { category: 'media', title_he: 'New Lines Magazine — סיקור כפרי הגבול הדרומיים בלבנון', url: 'https://newlinesmag.com/spotlight/the-devastation-of-lebanons-southern-border-towns/' },
  { category: 'media', title_he: 'Wikipedia — מלחמת לבנון 2024', url: 'https://en.wikipedia.org/wiki/2024_Lebanon_war' },
  // Drone Intelligence
  { category: 'media', title_he: 'IDF Spokesperson — דו״חות רשמיים על התקפות כלים (2024–2026)', url: 'https://www.idf.il/en/' },
  { category: 'media', title_he: 'Bellingcat — ניתוח OSINT של טיסות כלים בדרום לבנון', url: 'https://bellingcat.com' },
  { category: 'media', title_he: 'ISW (Institute for the Study of War) — דוחות מודיעיניים יומיים', url: 'https://www.understandingwar.org' },
  { category: 'media', title_he: 'Janes Defence Weekly — טכנולוגיה של כלים בעזה ולבנון', url: 'https://www.janes.com' },
  { category: 'media', title_he: 'Debka File — כיסוי מודיעיני של פעילות כלים', url: 'https://www.debka.com' },
  { category: 'media', title_he: 'Al Jazeera — כיסוי של התנגדות בעולם ערב', url: 'https://www.aljazeera.com' },
  { category: 'media', title_he: 'Middle East Eye — ניתוח של התנגדות מזוינת בלבנון', url: 'https://www.middleeasteye.net' },
  { category: 'media', title_he: 'Haaretz — דו״חות אבטחה וביטחון מודיעיני', url: 'https://www.haaretz.com' },
  // Data
  { category: 'data', title_he: 'ACLED — בסיס נתוני אירועי קונפליקט', url: 'https://acleddata.com/dashboard/' },
  { category: 'data', title_he: 'ecoi.net — דו״ח אירועים שנתי, לבנון 2024 (ACLED)', url: 'https://www.ecoi.net/en/file/local/2121567/2024yLebanon_en.pdf' },
  // OSM
  { category: 'osm', title_he: 'OpenStreetMap — שכבת המפה הבסיסית', url: 'https://www.openstreetmap.org/copyright' },
  { category: 'osm', title_he: 'CARTO — שכבת אריחי כהה (Dark Matter)', url: 'https://carto.com/attributions' },
];
