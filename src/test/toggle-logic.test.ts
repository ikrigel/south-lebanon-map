/**
 * Toggle Logic Test
 * Pure function tests that don't depend on vitest setup or React
 */

import { describe, it, expect } from 'vitest';

describe('Toggle Logic - Pure Functions', () => {
  it('visibleKey should return a function that toggles state', () => {
    // Simulate App.tsx visibleKey behavior
    let state = { drones: false };

    const visibleKey = (k: keyof typeof state) => () =>
      (state = { ...state, [k]: !state[k] });

    // Initial state
    expect(state.drones).toBe(false);

    // First toggle
    const toggle1 = visibleKey('drones');
    expect(typeof toggle1).toBe('function');
    toggle1();
    expect(state.drones).toBe(true);

    // Second toggle
    const toggle2 = visibleKey('drones');
    toggle2();
    expect(state.drones).toBe(false);
  });

  it('onClick handler with () () pattern should work', () => {
    let state = { drones: false };
    const visibleKey = (k: keyof typeof state) => () =>
      (state = { ...state, [k]: !state[k] });

    // Simulate onClick={() => props.visibleKey('drones')()}
    const onClick = () => visibleKey('drones')();

    expect(state.drones).toBe(false);
    onClick();
    expect(state.drones).toBe(true);
    onClick();
    expect(state.drones).toBe(false);
  });

  it('onClick handler WITHOUT final () would NOT work', () => {
    let state = { drones: false };
    const visibleKey = (k: keyof typeof state) => () =>
      (state = { ...state, [k]: !state[k] });

    // Simulate onClick={() => props.visibleKey('drones')} (WRONG)
    const wrongOnClick = () => visibleKey('drones');

    expect(state.drones).toBe(false);
    // This just returns a function, doesn't execute it
    const result = wrongOnClick();
    expect(typeof result).toBe('function');
    // State is still false because we didn't call the returned function
    expect(state.drones).toBe(false);
  });

  it('correct pattern: () () - function is called', () => {
    let state = { drones: false };
    const visibleKey = (k: keyof typeof state) => () =>
      (state = { ...state, [k]: !state[k] });

    // Pattern: onClick={() => props.visibleKey('drones')()}
    //          This is: arrow function that calls another function and executes it
    const executeImmediately = () => visibleKey('drones')();

    executeImmediately();
    expect(state.drones).toBe(true);
  });

  it('incorrect pattern: () - function is NOT called', () => {
    let state = { drones: false };
    const visibleKey = (k: keyof typeof state) => () =>
      (state = { ...state, [k]: !state[k] });

    // Pattern: onClick={() => props.visibleKey('drones')}
    //          This is: arrow function that returns another function but doesn't call it
    const returnButDontCall = () => visibleKey('drones');

    returnButDontCall();
    expect(state.drones).toBe(false); // Still false!
  });

  it('difference: returned function vs called function', () => {
    let state = { drones: false };
    const visibleKey = (k: keyof typeof state) => () =>
      (state = { ...state, [k]: !state[k] });

    // Get the function without calling it
    const fnRef = visibleKey('drones');
    expect(state.drones).toBe(false); // Still false

    // Now call the function
    fnRef();
    expect(state.drones).toBe(true); // Now it's true!
  });

  it('all toggles work with the () () pattern', () => {
    let state = {
      pop: true,
      unifil: true,
      drones: false,
      navLabels: true
    };

    const visibleKey = (k: keyof typeof state) => () =>
      (state = { ...state, [k]: !state[k] });

    // Test toggling each layer
    const testToggle = (key: keyof typeof state) => {
      const initial = state[key];
      visibleKey(key)();
      expect(state[key]).toBe(!initial);
      visibleKey(key)();
      expect(state[key]).toBe(initial);
    };

    testToggle('pop');
    testToggle('unifil');
    testToggle('drones');
    testToggle('navLabels');
  });

  it('rapid toggles should work correctly', () => {
    let state = { drones: false };
    const visibleKey = (k: keyof typeof state) => () =>
      (state = { ...state, [k]: !state[k] });

    // Toggle 7 times
    for (let i = 0; i < 7; i++) {
      visibleKey('drones')();
    }

    // Should be ON (false → true → false → true → false → true → false → true)
    expect(state.drones).toBe(true);
  });

  it('drones visibility should be independent of other toggles', () => {
    let state = { pop: true, unifil: true, drones: false, navLabels: true };
    const visibleKey = (k: keyof typeof state) => () =>
      (state = { ...state, [k]: !state[k] });

    const originalPop = state.pop;
    const originalUnifilKey = state.unifil;
    const originalNavLabels = state.navLabels;

    // Toggle drones
    visibleKey('drones')();

    // Others should not change
    expect(state.pop).toBe(originalPop);
    expect(state.unifil).toBe(originalUnifilKey);
    expect(state.navLabels).toBe(originalNavLabels);
    expect(state.drones).toBe(true);
  });
});
