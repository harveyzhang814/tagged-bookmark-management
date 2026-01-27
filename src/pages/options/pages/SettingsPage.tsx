import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  type BookmarkOpenMode,
  getBrowserDefaultOpenMode,
  getBrowserTagWorkstationOpenMode,
  getInstallUpdateTime,
  saveBrowserDefaultOpenMode,
  saveBrowserTagWorkstationOpenMode,
  getLocale,
  saveLocale,
} from '../../../lib/storage';
import { changeLanguage } from '../../../i18n/config';
import { SUPPORTED_LOCALES, LOCALE_CODES, type Locale } from '../../../i18n/locales';
import { IconButton } from '../../../components/IconButton';
import './settingsPage.css';

interface SettingsPageProps {
  onClose: () => void;
}

export const SettingsPage = ({ onClose }: SettingsPageProps) => {
  const { t } = useTranslation();
  const [defaultOpenMode, setDefaultOpenMode] = useState<BookmarkOpenMode>('newTab');
  const [tagWorkstationOpenMode, setTagWorkstationOpenMode] = useState<BookmarkOpenMode>('newTab');
  const [currentLocale, setCurrentLocale] = useState<Locale>('zh-CN');
  const [version, setVersion] = useState<string>('');
  const [installUpdateTimeMs, setInstallUpdateTimeMs] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const [defaultMode, tagWorkstationMode, locale] = await Promise.all([
        getBrowserDefaultOpenMode(),
        getBrowserTagWorkstationOpenMode(),
        getLocale()
      ]);
      if (cancelled) return;
      setDefaultOpenMode(defaultMode);
      setTagWorkstationOpenMode(tagWorkstationMode);
      setCurrentLocale(locale);
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadAbout = async () => {
      // Version: prefer Chrome runtime manifest if available
      const v =
        typeof chrome !== 'undefined' && chrome.runtime?.getManifest
          ? chrome.runtime.getManifest().version
          : '';

      const timeMs = await getInstallUpdateTime();
      if (cancelled) return;
      setVersion(v ?? '');
      setInstallUpdateTimeMs(timeMs);
    };

    void loadAbout();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleDefaultOpenModeChange = useCallback((mode: BookmarkOpenMode) => {
    setDefaultOpenMode(mode);
    void saveBrowserDefaultOpenMode(mode);
  }, []);

  const handleTagWorkstationOpenModeChange = useCallback((mode: BookmarkOpenMode) => {
    setTagWorkstationOpenMode(mode);
    void saveBrowserTagWorkstationOpenMode(mode);
  }, []);

  const handleLocaleChange = useCallback(async (locale: Locale) => {
    setCurrentLocale(locale);
    await saveLocale(locale);
    await changeLanguage(locale);
  }, []);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div className="settings-page">
      <div className="settings-toolbar">
        <IconButton
          variant="secondary"
          aria-label={t('settings.back')}
          onClick={onClose}
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M15 18l-6-6 6-6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          }
        />
        <div className="settings-toolbar__title">{t('settings.title')}</div>
      </div>

      <section className="pixel-panel settings-module">
        <h3 className="section-title">{t('settings.language.title')}</h3>

        <div className="settings-row">
          <label className="settings-row__label" htmlFor="settings-locale">
            {t('settings.language.selectLabel')}
          </label>
          <div className="settings-row__control">
            <select
              id="settings-locale"
              className="settings-select"
              value={currentLocale}
              onChange={(e) => void handleLocaleChange(e.target.value as Locale)}
            >
              {LOCALE_CODES.map((locale) => (
                <option key={locale} value={locale}>
                  {SUPPORTED_LOCALES[locale].name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <section className="pixel-panel settings-module">
        <h3 className="section-title">{t('settings.browser.title')}</h3>

        <div className="settings-row">
          <label className="settings-row__label" htmlFor="settings-default-open-mode">
            {t('settings.browser.defaultOpenMode')}
          </label>
          <div className="settings-row__control">
            <select
              id="settings-default-open-mode"
              className="settings-select"
              value={defaultOpenMode}
              onChange={(e) => handleDefaultOpenModeChange(e.target.value as BookmarkOpenMode)}
            >
              <option value="newTab">{t('settings.browser.newTab')}</option>
              <option value="newWindow">{t('settings.browser.newWindow')}</option>
            </select>
          </div>
        </div>

        <div className="settings-row">
          <label className="settings-row__label" htmlFor="settings-tag-workstation-open-mode">
            {t('settings.browser.tagWorkstationOpenMode')}
          </label>
          <div className="settings-row__control">
            <select
              id="settings-tag-workstation-open-mode"
              className="settings-select"
              value={tagWorkstationOpenMode}
              onChange={(e) => handleTagWorkstationOpenModeChange(e.target.value as BookmarkOpenMode)}
            >
              <option value="newTab">{t('settings.browser.newTab')}</option>
              <option value="newWindow">{t('settings.browser.newWindow')}</option>
            </select>
          </div>
        </div>
      </section>

      <section className="pixel-panel settings-module">
        <h3 className="section-title">{t('settings.about.title')}</h3>

        <div className="settings-row">
          <div className="settings-row__label">{t('settings.about.version')}</div>
          <div className="settings-row__control">
            <div className="settings-row__value">{version || '—'}</div>
          </div>
        </div>

        <div className="settings-row">
          <div className="settings-row__label">{t('settings.about.updateTime')}</div>
          <div className="settings-row__control">
            <div className="settings-row__value">
              {installUpdateTimeMs
                ? new Date(installUpdateTimeMs).toLocaleDateString(currentLocale, {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                  })
                : '—'}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};


