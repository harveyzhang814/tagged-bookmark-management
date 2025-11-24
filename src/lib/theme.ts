import { getTheme as getThemeFromStorage, saveTheme, type Theme } from './storage';

export type { Theme };

export const applyTheme = (theme: Theme) => {
  const root = document.documentElement;
  if (theme === 'dark') {
    root.setAttribute('data-theme', 'dark');
  } else {
    root.removeAttribute('data-theme');
  }
};

export const initTheme = async () => {
  const theme = await getThemeFromStorage();
  applyTheme(theme);
  return theme;
};

export const getTheme = getThemeFromStorage;

export const toggleTheme = async (): Promise<Theme> => {
  const currentTheme = await getTheme();
  const newTheme: Theme = currentTheme === 'light' ? 'dark' : 'light';
  await saveTheme(newTheme);
  applyTheme(newTheme);
  return newTheme;
};

export const setTheme = async (theme: Theme) => {
  await saveTheme(theme);
  applyTheme(theme);
};

