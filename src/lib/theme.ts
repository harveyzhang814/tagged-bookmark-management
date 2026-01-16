import { getTheme as getThemeFromStorage, saveTheme, type Theme } from './storage';

export type { Theme };

// 实际应用的主题类型（不包含 system）
type EffectiveTheme = 'light' | 'dark';

// 缓存当前实际应用的主题，避免重复检测系统偏好
let cachedEffectiveTheme: EffectiveTheme | null = null;

/**
 * 检测系统是否偏好暗色模式
 */
export const getSystemPreference = (): EffectiveTheme => {
  if (typeof window === 'undefined') {
    return 'light';
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

/**
 * 从 DOM 读取当前实际应用的主题
 * 这是最高效的方式，因为 DOM 属性已经反映了实际应用的主题
 */
export const getCurrentEffectiveThemeFromDOM = (): EffectiveTheme => {
  if (typeof document === 'undefined') {
    return 'light';
  }
  return document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
};

/**
 * 获取当前实际应用的主题（带缓存）
 * 优先从 DOM 读取，如果 DOM 不可用则使用缓存或重新计算
 */
export const getCurrentEffectiveTheme = (): EffectiveTheme => {
  // 优先从 DOM 读取，这是最准确的
  if (typeof document !== 'undefined') {
    const domTheme = getCurrentEffectiveThemeFromDOM();
    cachedEffectiveTheme = domTheme;
    return domTheme;
  }
  
  // 如果 DOM 不可用，使用缓存
  if (cachedEffectiveTheme !== null) {
    return cachedEffectiveTheme;
  }
  
  // 最后才检测系统偏好
  return getSystemPreference();
};

/**
 * 根据用户选择的主题获取实际应用的主题
 * 如果用户选择 'system'，则返回系统偏好
 * 
 * @deprecated 推荐使用 getCurrentEffectiveTheme() 直接从 DOM 读取，性能更好
 */
export const getEffectiveTheme = (userTheme: Theme): EffectiveTheme => {
  if (userTheme === 'system') {
    return getSystemPreference();
  }
  return userTheme;
};

/**
 * 应用主题到 DOM
 */
export const applyTheme = (theme: Theme) => {
  const root = document.documentElement;
  const effectiveTheme = theme === 'system' ? getSystemPreference() : theme;
  
  // 更新缓存
  cachedEffectiveTheme = effectiveTheme;
  
  if (effectiveTheme === 'dark') {
    root.setAttribute('data-theme', 'dark');
  } else {
    root.removeAttribute('data-theme');
  }
};

// 系统主题变化监听器的清理函数
let systemThemeListener: (() => void) | null = null;

/**
 * 初始化主题，并设置系统主题变化监听
 */
export const initTheme = async () => {
  const theme = await getThemeFromStorage();
  applyTheme(theme);
  
  // 清理旧的监听器
  if (systemThemeListener) {
    systemThemeListener();
    systemThemeListener = null;
  }
  
  // 如果用户选择跟随系统，则监听系统主题变化
  if (theme === 'system' && typeof window !== 'undefined') {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemThemeChange = () => {
      // 重新获取用户设置，确保仍然是 'system'
      getThemeFromStorage().then((currentTheme) => {
        if (currentTheme === 'system') {
          applyTheme('system');
        }
      });
    };
    
    // 添加监听器
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleSystemThemeChange);
      systemThemeListener = () => {
        mediaQuery.removeEventListener('change', handleSystemThemeChange);
      };
    } else {
      // 兼容旧版浏览器
      mediaQuery.addListener(handleSystemThemeChange);
      systemThemeListener = () => {
        mediaQuery.removeListener(handleSystemThemeChange);
      };
    }
  }
  
  return theme;
};

export const getTheme = getThemeFromStorage;

/**
 * 切换主题：light -> dark -> system -> light
 */
export const toggleTheme = async (): Promise<Theme> => {
  const currentTheme = await getTheme();
  let newTheme: Theme;
  
  if (currentTheme === 'light') {
    newTheme = 'dark';
  } else if (currentTheme === 'dark') {
    newTheme = 'system';
  } else {
    newTheme = 'light';
  }
  
  await saveTheme(newTheme);
  await initTheme(); // 重新初始化以设置/移除监听器
  return newTheme;
};

/**
 * 设置主题
 */
export const setTheme = async (theme: Theme) => {
  await saveTheme(theme);
  await initTheme(); // 重新初始化以设置/移除监听器
};

