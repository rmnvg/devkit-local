import {
  getFavorites, toggleFavorite, isFavorite, getRecents, pushRecent, getSettings, updateSettings,
  getToolInput, setToolInput, getToolSettings, setToolSettings, getStoredTheme, setStoredTheme, readJSON,
} from './storage';

beforeEach(() => localStorage.clear());

describe('favorites', () => {
  it('toggles on and off', () => {
    expect(toggleFavorite('a')).toBe(true);
    expect(isFavorite('a')).toBe(true);
    expect(toggleFavorite('a')).toBe(false);
    expect(getFavorites()).toEqual([]);
  });
  it('ignores corrupted storage', () => {
    localStorage.setItem('devkit:favorites', '{not json');
    expect(getFavorites()).toEqual([]);
    localStorage.setItem('devkit:favorites', JSON.stringify(['a', 3, null]));
    expect(getFavorites()).toEqual(['a']);
  });
});

describe('recents', () => {
  it('keeps most recent first, de-duplicated, max 8', () => {
    for (let i = 0; i < 10; i++) pushRecent(`t${i}`);
    pushRecent('t5');
    const r = getRecents();
    expect(r).toHaveLength(8);
    expect(r[0]).toBe('t5');
    expect(new Set(r).size).toBe(8);
  });
});

describe('theme', () => {
  it('round-trips and rejects junk', () => {
    expect(getStoredTheme()).toBeNull();
    setStoredTheme('light');
    expect(getStoredTheme()).toBe('light');
    localStorage.setItem('devkit:theme', '"purple"');
    expect(getStoredTheme()).toBeNull();
  });
});

describe('tool inputs', () => {
  it('are not stored unless rememberInputs is on', () => {
    expect(getSettings().rememberInputs).toBe(false);
    setToolInput('x', { text: 'secret' });
    expect(readJSON('tool:x:input', null)).toBeNull();
    expect(getToolInput('x')).toEqual({});
  });
  it('are stored when enabled and wiped when disabled', () => {
    updateSettings({ rememberInputs: true });
    setToolInput('x', { text: 'hi' });
    expect(getToolInput('x')).toEqual({ text: 'hi' });
    updateSettings({ rememberInputs: false });
    expect(readJSON('tool:x:input', null)).toBeNull();
  });
  it('settings are always stored', () => {
    setToolSettings('x', { model: 'm' });
    expect(getToolSettings('x')).toEqual({ model: 'm' });
  });
});
