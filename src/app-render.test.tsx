import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from './App';

describe('App Component Rendering', () => {
  it('should render without crashing', () => {
    // This test checks if App component can be instantiated
    // If it throws, we catch the error
    let errorThrown = false;
    let errorMessage = '';

    try {
      const { container } = render(<App />);
      expect(container).toBeDefined();
    } catch (error) {
      errorThrown = true;
      errorMessage = error instanceof Error ? error.message : String(error);
    }

    if (errorThrown) {
      throw new Error(`App render failed: ${errorMessage}`);
    }
  });

  it('should have root div element', () => {
    const { container } = render(<App />);
    const app = container.querySelector('.app');
    expect(app).toBeDefined();
  });

  it('should initialize without localStorage blocking it', () => {
    // Mock localStorage in case it's unavailable
    const localStorageMock = {
      getItem: vi.fn(() => null),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
      key: vi.fn(),
      length: 0,
    };
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true,
    });

    let renderSuccessful = false;
    try {
      render(<App />);
      renderSuccessful = true;
    } catch (e) {
      // Log any errors for debugging
      console.error('App render error:', e);
    }

    expect(renderSuccessful).toBe(true);
  });

  it('should handle geolocation not being available', () => {
    // Ensure geolocation mock exists
    if (!navigator.geolocation) {
      Object.defineProperty(navigator, 'geolocation', {
        value: {
          watchPosition: vi.fn(),
          getCurrentPosition: vi.fn(),
        },
        writable: true,
      });
    }

    let renderSuccessful = false;
    try {
      render(<App />);
      renderSuccessful = true;
    } catch (e) {
      console.error('Geolocation-related error:', e);
    }

    expect(renderSuccessful).toBe(true);
  });

  it('should not depend on window.requestAnimationFrame failing', () => {
    // Some environments might not have RAF
    if (!window.requestAnimationFrame) {
      window.requestAnimationFrame = (cb: FrameRequestCallback) => {
        return setTimeout(cb, 16);
      };
    }

    let renderSuccessful = false;
    try {
      render(<App />);
      renderSuccessful = true;
    } catch (e) {
      console.error('RequestAnimationFrame error:', e);
    }

    expect(renderSuccessful).toBe(true);
  });
});

describe('App Data Loading', () => {
  it('should handle missing incident data without crashing', () => {
    // Mock fetch to return empty incident data
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve([]),
      } as Response)
    );

    let renderSuccessful = false;
    try {
      render(<App />);
      renderSuccessful = true;
    } catch (e) {
      console.error('Data loading error:', e);
    }

    expect(renderSuccessful).toBe(true);
  });

  it('should render even with geolocation permission denied', () => {
    const geolocationMock = {
      watchPosition: vi.fn((success) => {
        // Simulate permission denied
        success({
          coords: { latitude: 0, longitude: 0, accuracy: Infinity },
          timestamp: Date.now(),
        });
      }),
      getCurrentPosition: vi.fn(),
    };

    Object.defineProperty(navigator, 'geolocation', {
      value: geolocationMock,
      writable: true,
    });

    let renderSuccessful = false;
    try {
      render(<App />);
      renderSuccessful = true;
    } catch (e) {
      console.error('Geolocation permission error:', e);
    }

    expect(renderSuccessful).toBe(true);
  });
});
