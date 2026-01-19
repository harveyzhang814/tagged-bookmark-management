// 统一语言配置中心
// 添加新语言只需在此文件中添加一项配置

export const SUPPORTED_LOCALES = {
  'zh-CN': {
    code: 'zh-CN',
    name: '中文 (简体)',
    nativeName: '中文 (简体)',
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
