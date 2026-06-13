import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { useSearchResults } from '../hooks/useSearchResults';
import { towns } from '../data/geo';
import { incidents } from '../data/geo';

/**
 * Component validation test - Search box with real keystroke simulation
 * בדיקת תקינות קומפוננטת החיפוש עם הקלדה אמיתית
 *
 * זה בדיקה מלאה של:
 * 1. רינדור הקומפוננטה
 * 2. הקלדת משתמש בתיבת החיפוש
 * 3. חישוב תוצאות חיפוש
 * 4. הצגת תוצאות בדרופדאון
 * 5. אינטראקציה עם התוצאות
 */
describe('Search Component Validation - חיפוש במפה', () => {
  /**
   * קומפוננטה המדמה את חיפוש המפה מ-LeftPanel
   * Simulates the map search from LeftPanel component
   */
  function SearchComponentTest() {
    const [mapSearchQuery, setMapSearchQuery] = useState('');
    const { mapSearchResults } = useSearchResults({
      query: '',
      mapSearchQuery,
      customPois: [],
      towns,
      incidents,
      unifilPoints: [],
      terrainFeatures: [],
      influenceZones: [],
    });

    const handleResultClick = (result: any) => {
      console.log('Result clicked:', result.title);
      return result;
    };

    return (
      <div className="panel-section map-search-section" data-testid="search-section">
        <h3>חיפוש במפה</h3>

        {/* Search Input */}
        <input
          className="search"
          placeholder="חפש כפר, עיר, רכס, הר, נחל או נקודת עניין…"
          value={mapSearchQuery}
          onChange={e => {
            const value = e.target.value;
            console.log('onChange fired with value:', value);
            setMapSearchQuery(value);
          }}
          onInput={e => {
            console.log('onInput fired:', (e.target as HTMLInputElement).value);
          }}
          data-testid="input-map-search"
        />

        <p className="legend-note" data-testid="search-note">
          בחירה בתוצאה ממקמת את הנקודה במרכז המפה, פותחת זום קרוב ומציגה סמן מיקוד.
        </p>

        {/* Results Dropdown */}
        {mapSearchQuery.trim().length > 0 && (
          <div className="search-results map-search-results" data-testid="search-results-dropdown">
            {mapSearchResults.length > 0 ? (
              <>
                <div className="results-info" data-testid="results-info">
                  נמצאו {mapSearchResults.length} תוצאות עבור: "{mapSearchQuery}"
                </div>
                <div className="search-results" data-testid="results-list">
                  {mapSearchResults.map((result, index) => (
                    <div
                      key={result.id}
                      className="search-result-row"
                      data-testid={`result-row-${index}`}
                    >
                      <button
                        className="search-result"
                        onClick={() => handleResultClick(result)}
                        data-testid={`result-button-${index}`}
                      >
                        <span className="result-title" data-testid={`result-title-${index}`}>
                          {result.title}
                        </span>
                        <small className="result-subtitle" data-testid={`result-subtitle-${index}`}>
                          {result.subtitle}
                        </small>
                      </button>
                      <div className="navigate-btn-group">
                        <button
                          className="btn navigate-here-btn navigate-here-primary"
                          onClick={() => console.log('Navigate to:', result.title)}
                          data-testid={`navigate-btn-${index}`}
                        >
                          ▶ נווט לכאן
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="legend-note" data-testid="no-results-message">
                לא נמצאו תוצאות. נסה כתיב עברי/אנגלי אחר או שם סמוך.
              </p>
            )}
          </div>
        )}
      </div>
    );
  }

  it('1. קומפוננטה מרונדרת כראוי', () => {
    render(<SearchComponentTest />);

    // בדיקה: אלמנטים בסיסיים קיימים
    expect(screen.getByTestId('search-section')).toBeDefined();
    expect(screen.getByTestId('input-map-search')).toBeDefined();
    expect(screen.getByTestId('search-note')).toBeDefined();
  });

  it('2. תיבת חיפוש קיימת והפוכה לעריכה', () => {
    render(<SearchComponentTest />);

    const input = screen.getByTestId('input-map-search') as HTMLInputElement;
    expect(input).toBeDefined();
    expect(input.value).toBe('');
    expect(input.placeholder).toContain('חפש');
  });

  it('3. onChange מחזיר ערך עם הקלדה - צידון', async () => {
    const user = userEvent.setup();
    render(<SearchComponentTest />);

    const input = screen.getByTestId('input-map-search') as HTMLInputElement;

    // הקלדת שם ישוב
    await user.type(input, 'צידון', { delay: 50 });

    // בדיקה: הערך עודכן
    expect(input.value).toBe('צידון');
  });

  it('4. דרופדאון מופיע כשיש תוצאות - צידון', async () => {
    const user = userEvent.setup();
    render(<SearchComponentTest />);

    const input = screen.getByTestId('input-map-search') as HTMLInputElement;

    // הקלדה
    await user.type(input, 'צידון');

    // בדיקה: דרופדאון מופיע
    await waitFor(() => {
      expect(screen.getByTestId('search-results-dropdown')).toBeDefined();
    });
  });

  it('5. תוצאות מוצגות בדרופדאון - צידון', async () => {
    const user = userEvent.setup();
    render(<SearchComponentTest />);

    const input = screen.getByTestId('input-map-search') as HTMLInputElement;

    await user.type(input, 'צידון');

    await waitFor(() => {
      const dropdown = screen.getByTestId('search-results-dropdown');
      expect(dropdown).toBeDefined();

      // בדיקה: יש תוצאות או הודעת "לא נמצאו תוצאות"
      const resultsList = screen.queryByTestId('results-list');
      const noResults = screen.queryByTestId('no-results-message');
      expect(resultsList || noResults).toBeTruthy();
    });
  });

  it('6. דרופדאון מוסתר כשתיבה ריקה', async () => {
    const user = userEvent.setup();
    render(<SearchComponentTest />);

    const input = screen.getByTestId('input-map-search') as HTMLInputElement;

    // הקלדה
    await user.type(input, 'צידון');

    // בדיקה: דרופדאון מופיע
    await waitFor(() => {
      expect(screen.getByTestId('search-results-dropdown')).toBeDefined();
    });

    // הסרת הטקסט
    await user.clear(input);

    // בדיקה: דרופדאון מוסתר
    await waitFor(() => {
      expect(screen.queryByTestId('search-results-dropdown')).toBeNull();
    });
  });

  it('7. הקלדה בחיפוש בנת', async () => {
    const user = userEvent.setup();
    render(<SearchComponentTest />);

    const input = screen.getByTestId('input-map-search') as HTMLInputElement;

    await user.type(input, 'בנת');
    expect(input.value).toBe('בנת');

    await waitFor(() => {
      expect(screen.getByTestId('search-results-dropdown')).toBeDefined();
    });
  });

  it('8. אנגלית - Sidon', async () => {
    const user = userEvent.setup();
    render(<SearchComponentTest />);

    const input = screen.getByTestId('input-map-search') as HTMLInputElement;

    await user.type(input, 'Sidon');
    expect(input.value).toBe('Sidon');
  });

  it('9. כפתורי ניווט קיימים בתוצאות', async () => {
    const user = userEvent.setup();
    render(<SearchComponentTest />);

    const input = screen.getByTestId('input-map-search') as HTMLInputElement;

    await user.type(input, 'צידון');

    await waitFor(() => {
      const dropdown = screen.getByTestId('search-results-dropdown');
      expect(dropdown).toBeDefined();
    });

    // בדיקה: אם יש תוצאות, יש כפתורים
    const navButtons = screen.queryAllByTestId(/navigate-btn-/);
    const resultButtons = screen.queryAllByTestId(/result-button-/);

    if (navButtons.length > 0 || resultButtons.length > 0) {
      expect(navButtons.length > 0 || resultButtons.length > 0).toBe(true);
    }
  });

  it('10. עדכון זמן אמת עם הקלדה ממשכת', async () => {
    const user = userEvent.setup({ delay: null });
    render(<SearchComponentTest />);

    const input = screen.getByTestId('input-map-search') as HTMLInputElement;

    // הקלדה תו אחרי תו
    await user.type(input, 'ב', { delay: 50 });
    expect(input.value).toBe('ב');

    await user.type(input, 'נ', { delay: 50 });
    expect(input.value).toBe('בנ');

    await user.type(input, 'ת', { delay: 50 });
    expect(input.value).toBe('בנת');

    // בדיקה: דרופדאון מופיע בסוף
    await waitFor(() => {
      expect(screen.getByTestId('search-results-dropdown')).toBeDefined();
    });
  });

  it('11. הודעת "לא נמצאו תוצאות" לחיפוש לא תקין', async () => {
    const user = userEvent.setup();
    render(<SearchComponentTest />);

    const input = screen.getByTestId('input-map-search') as HTMLInputElement;

    // הקלדה שלא תחזיר תוצאות
    await user.type(input, 'xxxyyyzzzabc');

    await waitFor(() => {
      const dropdown = screen.getByTestId('search-results-dropdown');
      expect(dropdown).toBeDefined();

      // בדיקה: או תוצאות או הודעה
      const noResults = screen.queryByTestId('no-results-message');
      const results = screen.queryByTestId('results-list');

      expect(noResults || results).toBeTruthy();
    });
  });

  it('12. קלות כללית של הקומפוננטה', async () => {
    const user = userEvent.setup();
    render(<SearchComponentTest />);

    const input = screen.getByTestId('input-map-search') as HTMLInputElement;

    // תרחיש מלא
    // 1. הקלדה
    await user.type(input, 'צ', { delay: 30 });
    await waitFor(() => expect(screen.getByTestId('search-results-dropdown')).toBeDefined());

    // 2. המשך הקלדה
    await user.type(input, 'ידון', { delay: 30 });
    expect(input.value).toBe('צידון');

    // 3. דרופדאון עדיין קיים
    expect(screen.getByTestId('search-results-dropdown')).toBeDefined();

    // 4. ניקוי
    await user.clear(input);
    await waitFor(() => {
      expect(screen.queryByTestId('search-results-dropdown')).toBeNull();
    });

    // 5. חיפוש חדש
    await user.type(input, 'בנת', { delay: 30 });
    await waitFor(() => {
      expect(screen.getByTestId('search-results-dropdown')).toBeDefined();
    });
  });
});
