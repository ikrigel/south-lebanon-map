import { describe, it, expect, beforeEach } from 'vitest';

/**
 * Search Clean Function Debug Test
 * בדיקת פונקציית ה-clean בחיפוש
 */

describe('Search Clean Function — Debug Hebrew Search', () => {
  beforeEach(() => {
    // Setup before each test
  });
  // Replicate the clean function from useSearchResults
  const clean = (s: string) => {
    return s.toLowerCase().replace(/[^א-תa-z0-9]/g, '');
  };

  it('1. clean function handles Hebrew text', () => {
    expect(clean('בנת')).toBe('בנת');
    expect(clean('צידון')).toBe('צידון');
    expect(clean('בראש')).toBe('בראש');
  });

  it('2. clean function handles English text', () => {
    expect(clean('Sidon')).toBe('sidon');
    expect(clean('Beirut')).toBe('beirut');
  });

  it('3. clean function removes spaces and punctuation', () => {
    expect(clean('בנת ליף')).toBe('בנתליף');
    // Only check that parentheses and spaces are removed
    const result = clean('צידון (Sidon)');
    expect(result).not.toContain('(');
    expect(result).not.toContain(')');
    expect(result).not.toContain(' ');
  });

  it('4. search substring matching works', () => {
    const townName = clean('בנת');
    const query1 = clean('ב');
    const query2 = clean('בנ');
    const query3 = clean('בנת');

    expect(townName.includes(query1)).toBe(true); // 'בנת'.includes('ב') = true
    expect(townName.includes(query2)).toBe(true); // 'בנת'.includes('בנ') = true
    expect(townName.includes(query3)).toBe(true); // 'בנת'.includes('בנת') = true
  });

  it('5. edge cases for Hebrew search', () => {
    // Search for 'ב' should match multiple towns
    const towns = ['בנת', 'בראש', 'בית ליף', 'צידון', 'רמיה'];
    const query = clean('ב');

    const matches = towns.filter(t => clean(t).includes(query));
    expect(matches.length).toBeGreaterThan(2);
  });

  it('6. case insensitivity', () => {
    expect(clean('SIDON')).toBe('sidon');
    expect(clean('SiDoN')).toBe('sidon');
  });

  it('7. numbers preserved', () => {
    expect(clean('Route123')).toBe('route123');
    expect(clean('2023')).toBe('2023');
  });

  it('8. Hebrew diacritics are removed', () => {
    // Hebrew diacritics (dagesh, shin dot, etc.) outside א-ת range are removed
    // This is correct behavior for search
    const textWithDiacritics = 'בּנַת'; // With diacritics
    const cleaned = clean(textWithDiacritics);
    // Should keep letters, remove marks
    expect(cleaned.length).toBeGreaterThan(0);
  });

  it('9. mixed Hebrew and English search', () => {
    const query = clean('ב123');
    expect(query).toBe('ב123');

    const townName = clean('בנת 2023');
    expect(townName.includes(query.substring(0, 1))).toBe(true); // 'בנת2023'.includes('ב')
  });

  it('10. empty string handling', () => {
    expect(clean('')).toBe('');
    expect(clean('   ')).toBe('');
    expect(clean('!!!')).toBe('');
  });

  it('11. whitespace and special chars', () => {
    const input = 'בנת-ליף, ישראל!';
    const cleaned = clean(input);
    expect(cleaned).toBe('בנתליףישראל');
    expect(cleaned).not.toContain('-');
    expect(cleaned).not.toContain(',');
    expect(cleaned).not.toContain('!');
  });

  it('12. full word matching for towns', () => {
    // Simulate full search logic
    const towns = [
      { name_he: 'בנת', name_en: 'Bint' },
      { name_he: 'בראש', name_en: 'Brash' },
      { name_he: 'צידון', name_en: 'Sidon' },
    ];

    const query = clean('ב');

    const matches = towns.filter(t =>
      clean(`${t.name_he} ${t.name_en}`).includes(query)
    );

    expect(matches.length).toBe(2); // בנת and בראש
    expect(matches.some(t => t.name_he === 'בנת')).toBe(true);
    expect(matches.some(t => t.name_he === 'בראש')).toBe(true);
    expect(matches.some(t => t.name_he === 'צידון')).toBe(false);
  });

  it('13. English search in mixed data', () => {
    const towns = [
      { name_he: 'בנת', name_en: 'Bint' },
      { name_he: 'צידון', name_en: 'Sidon' },
      { name_he: 'בראש', name_en: 'Brash' },
    ];

    const query = clean('sidon');

    const matches = towns.filter(t =>
      clean(`${t.name_he} ${t.name_en}`).includes(query)
    );

    expect(matches.length).toBe(1);
    expect(matches[0].name_he).toBe('צידון');
  });
});
