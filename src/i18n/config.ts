import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import zhCNTranslations from './locales/zh-CN/translation.json';
import enTranslations from './locales/en/translation.json';
import { DEFAULT_LOCALE, type Locale } from './locales';

// 初始化 i18n（同步初始化，语言从 storage 异步读取）
i18n
  .use(initReactI18next)
  .init({
    resources: {
      [DEFAULT_LOCALE]: {
        translation: zhCNTranslations,
      },
      'en': {
        translation: enTranslations,
      },
    },
    lng: DEFAULT_LOCALE, // 默认语言
    fallbackLng: DEFAULT_LOCALE,
    interpolation: {
      escapeValue: false, // React 已经转义了
    },
  });

// 在初始化后从 storage 读取用户语言偏好（首次启动时自动检测浏览器语言）
const initLocale = async () => {
  try {
    const { initLocale: initLocaleFromStorage } = await import('../lib/storage');
    const locale = await initLocaleFromStorage();
    if (locale && i18n.language !== locale) {
      await i18n.changeLanguage(locale);
    }
  } catch (error) {
    console.error('Failed to load locale from storage:', error);
  }
};

// 异步初始化语言偏好
void initLocale();

// 监听语言变化
export const changeLanguage = async (locale: Locale) => {
  await i18n.changeLanguage(locale);
  // 保存到 storage
  try {
    const { saveLocale } = await import('../lib/storage');
    await saveLocale(locale);
  } catch (error) {
    console.error('Failed to save locale to storage:', error);
  }
};

export default i18n;
