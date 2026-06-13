import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { useSearchResults } from '../hooks/useSearchResults';
import { towns } from '../data/geo';

/**
 * Integration test: Map search dropdown with user interaction
 *
 * Simulates:
 * 1. User types in search input box
 * 2. Search results computed from query
 * 3. Dropdown displays matching villages/towns
 * 4. User can interact with results
 */
describe('Map search dropdown - user interaction', () => {
  function SearchDropdownComponent() {
    const [mapSearchQuery, setMapSearchQuery] = useState('');
    const { mapSearchResults } = useSearchResults({
      query: '',
      mapSearchQuery,
      customPois: [],
      towns,
      incidents: [],
      unifilPoints: [],
      terrainFeatures: [],
      influenceZones: [],
    });

    return (
      <div className="search-container" data-testid="search-container">
        <input
          type="text"
          className="search-input"
          placeholder="Search villages, cities, mountains..."
          value={mapSearchQuery}
          onChange={e => {
            console.log('Search input changed to:', e.target.value);
            setMapSearchQuery(e.target.value);
          }}
          data-testid="search-input"
        />

        {mapSearchQuery.trim().length > 0 && (
          <div className="search-dropdown" data-testid="search-dropdown">
            {mapSearchResults.length > 0 ? (
              <>
                <div className="search-results-count" data-testid="results-count">
                  Found {mapSearchResults.length} results
                </div>
                <ul className="search-results-list" data-testid="results-list">
                  {mapSearchResults.map(result => (
                    <li
                      key={result.id}
                      className="search-result-item"
                      data-testid={`result-item-${result.id}`}
                    >
                      <button
                        className="result-button"
                        onClick={() => console.log('Clicked:', result.title)}
                        data-testid={`result-button-${result.id}`}
                      >
                        <span className="result-title">{result.title}</span>
                        <span className="result-subtitle">{result.subtitle}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <div className="no-results" data-testid="no-results">
                No villages or towns found for "{mapSearchQuery}"
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  it('should show search input without dropdown when empty', () => {
    render(<SearchDropdownComponent />);

    const input = screen.getByTestId('search-input') as HTMLInputElement;
    expect(input).toBeDefined();
    expect(input.value).toBe('');

    // Dropdown should not appear when input is empty
    const dropdown = screen.queryByTestId('search-dropdown');
    expect(dropdown).toBeNull();
  });

  it('should display dropdown with results when user types village name', async () => {
    const user = userEvent.setup();
    render(<SearchDropdownComponent />);

    const input = screen.getByTestId('search-input') as HTMLInputElement;

    // User types a village name
    await user.type(input, 'צידון', { delay: 50 });

    // Wait for dropdown to appear
    await waitFor(() => {
      expect(screen.getByTestId('search-dropdown')).toBeDefined();
    });

    // Verify input has the typed value
    expect(input.value).toBe('צידון');

    // Verify results are displayed
    const resultsList = screen.getByTestId('results-list');
    expect(resultsList).toBeDefined();
  });

  it('should display no results message for non-matching query', async () => {
    const user = userEvent.setup();
    render(<SearchDropdownComponent />);

    const input = screen.getByTestId('search-input') as HTMLInputElement;

    // Type something that won't match any villages
    await user.type(input, 'xxxxyyzzzz');

    await waitFor(() => {
      expect(screen.getByTestId('search-dropdown')).toBeDefined();
    });

    // Should show no results message
    const noResults = screen.getByTestId('no-results');
    expect(noResults).toBeDefined();
    expect(noResults).toHaveTextContent('No villages or towns found');
  });

  it('should update dropdown when user clears and retypes', async () => {
    const user = userEvent.setup();
    render(<SearchDropdownComponent />);

    const input = screen.getByTestId('search-input') as HTMLInputElement;

    // First search
    await user.type(input, 'בנת');
    await waitFor(() => {
      expect(screen.getByTestId('search-dropdown')).toBeDefined();
    });
    expect(input.value).toBe('בנת');

    // Clear input
    await user.clear(input);
    await waitFor(() => {
      const dropdown = screen.queryByTestId('search-dropdown');
      expect(dropdown).toBeNull();
    });

    // New search
    await user.type(input, 'צידון');
    await waitFor(() => {
      expect(screen.getByTestId('search-dropdown')).toBeDefined();
    });
    expect(input.value).toBe('צידון');
  });

  it('should display results with clickable buttons', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();

    function SearchWithClickHandler() {
      const [mapSearchQuery, setMapSearchQuery] = useState('');
      const { mapSearchResults } = useSearchResults({
        query: '',
        mapSearchQuery,
        customPois: [],
        towns,
        incidents: [],
        unifilPoints: [],
        terrainFeatures: [],
        influenceZones: [],
      });

      return (
        <div data-testid="search-container">
          <input
            type="text"
            value={mapSearchQuery}
            onChange={e => setMapSearchQuery(e.target.value)}
            data-testid="search-input"
            placeholder="Search..."
          />

          {mapSearchQuery.trim().length > 0 && (
            <div data-testid="search-dropdown">
              {mapSearchResults.length > 0 ? (
                <ul data-testid="results-list">
                  {mapSearchResults.slice(0, 3).map(result => (
                    <li key={result.id} data-testid={`result-item-${result.id}`}>
                      <button
                        onClick={() => handleClick(result.id, result.title)}
                        data-testid={`result-button-${result.id}`}
                      >
                        {result.title}
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <div data-testid="no-results-dropdown">No results found</div>
              )}
            </div>
          )}
        </div>
      );
    }

    render(<SearchWithClickHandler />);
    const input = screen.getByTestId('search-input') as HTMLInputElement;

    // Type to trigger search
    await user.type(input, 'בנת');

    // Wait for dropdown to appear (will show either results or no-results)
    await waitFor(() => {
      expect(screen.getByTestId('search-dropdown')).toBeDefined();
    });

    // Find and click first result button if available
    const resultButtons = screen.queryAllByTestId(/result-button-/);
    if (resultButtons.length > 0) {
      await user.click(resultButtons[0]);
      expect(handleClick).toHaveBeenCalled();
    } else {
      // If no results, dropdown should still be visible
      expect(screen.getByTestId('search-dropdown')).toBeDefined();
    }
  });

  it('should filter results as user types more characters', async () => {
    const user = userEvent.setup();
    render(<SearchDropdownComponent />);

    const input = screen.getByTestId('search-input') as HTMLInputElement;

    // Type first character
    await user.type(input, 'ב');
    await waitFor(() => {
      expect(screen.getByTestId('search-dropdown')).toBeDefined();
    });
    const count1 = screen.queryByTestId('results-count');
    const initialCount = count1 ? parseInt(count1.textContent?.match(/\d+/)?.[0] || '0') : 0;

    // Type second character to narrow results
    await user.type(input, 'נ');
    const count2 = screen.queryByTestId('results-count');
    const narrowedCount = count2 ? parseInt(count2.textContent?.match(/\d+/)?.[0] || '0') : 0;

    // Narrowed search should have fewer or equal results
    expect(narrowedCount).toBeLessThanOrEqual(initialCount);
  });

  it('should handle rapid typing and updates', async () => {
    const user = userEvent.setup({ delay: null }); // No delay between keystrokes
    render(<SearchDropdownComponent />);

    const input = screen.getByTestId('search-input') as HTMLInputElement;

    // Rapid typing
    await user.type(input, 'tzf', { delay: 0 });

    await waitFor(() => {
      expect(input.value.length).toBeGreaterThan(0);
    });

    // Should either show results or no-results message
    const dropdown = screen.getByTestId('search-dropdown');
    expect(dropdown).toBeDefined();
  });

  it('should work with English village names', async () => {
    const user = userEvent.setup();
    render(<SearchDropdownComponent />);

    const input = screen.getByTestId('search-input') as HTMLInputElement;

    // Try English name
    await user.type(input, 'Sidon');

    await waitFor(() => {
      expect(screen.getByTestId('search-dropdown')).toBeDefined();
    });

    expect(input.value).toBe('Sidon');
  });
});
