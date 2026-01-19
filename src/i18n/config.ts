import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import zhCNTranslations from './locales/zh-CN/translation.json';
import { DEFAULT_LOCALE, type Locale } from './locales';

// 初始化 i18n（同步初始化，语言从 storage 异步读取）
i18n
  .use(initReactI18next)
  .init({
    resources: {
      [DEFAULT_LOCALE]: {
        translation: zhCNTranslations,
      },
    },
    lng: DEFAULT_LOCALE, // 默认语言
    fallbackLng: DEFAULT_LOCALE,
    interpolation: {
      escapeValue: false, // React 已经转义了
    },
  });

// 在初始化后从 storage 读取用户语言偏好
const initLocale = async () => {
  try {
    const { getLocale } = await import('../lib/storage');
    const locale = await getLocale();
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
