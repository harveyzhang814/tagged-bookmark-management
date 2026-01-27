// 统一语言配置中心
// 添加新语言只需在此文件中添加一项配置

export const SUPPORTED_LOCALES = {
  'zh-CN': {
    code: 'zh-CN',
    name: '中文 (简体)',
    nativeName: '中文 (简体)',
  },
  'en': {
    code: 'en',
    name: 'English',
    nativeName: 'English',
  },
} as const;

// 自动生成 Locale 类型
export type Locale = keyof typeof SUPPORTED_LOCALES;

// 默认语言
export const DEFAULT_LOCALE: Locale = 'zh-CN';

// 获取所有语言代码数组
export const LOCALE_CODES = Object.keys(SUPPORTED_LOCALES) as Locale[];

// 获取语言显示名称
export const getLocaleName = (locale: Locale): string => {
  return SUPPORTED_LOCALES[locale].name;
};

// 获取语言原生名称
export const getLocaleNativeName = (locale: Locale): string => {
  return SUPPORTED_LOCALES[locale].nativeName;
};

// 浏览器语言到应用语言的映射表
// 支持精确匹配和模糊匹配（如 zh-TW -> zh-CN）
const BROWSER_LOCALE_MAP: Record<string, Locale> = {
  'zh-CN': 'zh-CN',      // 精确匹配：简体中文
  'zh': 'zh-CN',         // 模糊匹配：所有中文变体
  'zh-TW': 'zh-CN',      // 繁体中文 → 简体中文
  'zh-HK': 'zh-CN',      // 香港 → 简体中文
  'zh-SG': 'zh-CN',      // 新加坡 → 简体中文
  'en': 'en',            // 精确匹配：英文
  'en-US': 'en',         // 美式英文 → 通用英文
  'en-GB': 'en',         // 英式英文 → 通用英文
  'en-AU': 'en',         // 澳洲英文 → 通用英文
  'en-CA': 'en',         // 加拿大英文 → 通用英文
};

// 根据浏览器语言获取对应的应用语言
export const detectBrowserLocale = (): Locale => {
  // 获取浏览器语言列表（优先使用 languages，fallback 到 language）
  const browserLanguages = typeof navigator !== 'undefined' 
    ? (navigator.languages || [navigator.language])
    : [];

  // 尝试精确匹配（完整语言代码）
  for (const lang of browserLanguages) {
    const normalized = lang.toLowerCase();
    if (BROWSER_LOCALE_MAP[normalized]) {
      return BROWSER_LOCALE_MAP[normalized];
    }
  }

  // 尝试模糊匹配（只匹配语言代码，忽略地区）
  for (const lang of browserLanguages) {
    const langCode = lang.split('-')[0].toLowerCase();
    if (BROWSER_LOCALE_MAP[langCode]) {
      return BROWSER_LOCALE_MAP[langCode];
    }
  }

  // 保底：返回默认语言
  return DEFAULT_LOCALE;
};
