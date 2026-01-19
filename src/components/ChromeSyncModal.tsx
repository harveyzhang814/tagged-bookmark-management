import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PixelButton } from './PixelButton';
import { ToggleSwitch } from './ToggleSwitch';
import { importChromeBookmarks } from '../lib/bookmarkService';
import type { ImportChromeBookmarksResult } from '../lib/bookmarkService';
import './chromeSyncModal.css';

interface ChromeSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSyncSuccess?: (result: ImportChromeBookmarksResult) => void;
}

export const ChromeSyncModal = ({ isOpen, onClose, onSyncSuccess }: ChromeSyncModalProps) => {
  const { t } = useTranslation();
  const [convertPathToTags, setConvertPathToTags] = useState(false);
  const [pathMode, setPathMode] = useState<'hierarchical' | 'independent'>('hierarchical');
  const [convertExisting, setConvertExisting] = useState(false);

  const [isSyncing, setIsSyncing] = useState(false);
  const [isSyncSuccess, setIsSyncSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ImportChromeBookmarksResult | null>(null);
  const syncStartTimeRef = useRef<number>(0);

  useEffect(() => {
    if (!isOpen) return;
    setConvertPathToTags(false);
    setPathMode('hierarchical');
    setConvertExisting(false);
    setIsSyncing(false);
    setIsSyncSuccess(false);
    setError(null);
    setResult(null);
    syncStartTimeRef.current = 0;
  }, [isOpen]);

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isSyncing) return;
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (isSyncing) return;
    if (e.key === 'Escape') {
      onClose();
    }
  };

  const handleSync = async () => {
    setIsSyncing(true);
    setIsSyncSuccess(false);
    setError(null);
    setResult(null);
    syncStartTimeRef.current = Date.now();

    try {
      const res = await importChromeBookmarks({
        convertPathToTags,
        pathMode,
        convertExisting
      });

      // 确保最少显示0.5s的加载动画
      const elapsed = Date.now() - syncStartTimeRef.current;
      const minDuration = 500;
      if (elapsed < minDuration) {
        await new Promise((resolve) => setTimeout(resolve, minDuration - elapsed));
      }

      setIsSyncing(false);
      setIsSyncSuccess(true);
      setResult(res);
      if (onSyncSuccess) {
        onSyncSuccess(res);
      }
    } catch (err) {
      setIsSyncing(false);
      setIsSyncSuccess(false);
      setError(err instanceof Error ? err.message : t('chromeSync.syncFailed'));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="chrome-sync-modal__backdrop" onClick={handleBackdropClick} onKeyDown={handleKeyDown}>
      <div className="chrome-sync-modal" onClick={(e) => e.stopPropagation()}>
        <div className="chrome-sync-modal__header">
          <h2 className="chrome-sync-modal__title">{t('chromeSync.title')}</h2>
          <button
            className="chrome-sync-modal__close"
            onClick={onClose}
            aria-label={t('common.close')}
            type="button"
            disabled={isSyncing}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M15 5L5 15M5 5L15 15"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>

        <div className="chrome-sync-modal__content">
          {error && <div className="chrome-sync-modal__error">{error}</div>}

          {isSyncing || isSyncSuccess ? (
            <div className="chrome-sync-modal__status">
              {isSyncing && (
                <>
                  <div className="chrome-sync-modal__spinner">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeDasharray="47"
                        strokeDashoffset="47"
                        opacity="0.3"
                      />
                      <circle
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeDasharray="47"
                        strokeDashoffset="11.75"
                        className="chrome-sync-modal__spinner-circle"
                      />
                    </svg>
                  </div>
                  <p className="chrome-sync-modal__status-text">{t('chromeSync.syncing')}</p>
                </>
              )}
              {isSyncSuccess && result && (
                <>
                  <div className="chrome-sync-modal__success-icon">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path
                        d="M20 6L9 17l-5-5"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  <p className="chrome-sync-modal__status-text">{t('chromeSync.syncComplete')}</p>

                  <div className="chrome-sync-modal__result">
                    <div className="chrome-sync-modal__result-item">
                      <span className="chrome-sync-modal__result-label">{t('chromeSync.imported')}:</span>
                      <span className="chrome-sync-modal__result-value">{result.imported}</span>
                    </div>
                    <div className="chrome-sync-modal__result-item">
                      <span className="chrome-sync-modal__result-label">{t('chromeSync.skipped')}:</span>
                      <span className="chrome-sync-modal__result-value">{result.skipped}</span>
                    </div>
                    <div className="chrome-sync-modal__result-item">
                      <span className="chrome-sync-modal__result-label">{t('chromeSync.updated')}:</span>
                      <span className="chrome-sync-modal__result-value">{result.updatedExisting}</span>
                    </div>
                    <div className="chrome-sync-modal__result-item">
                      <span className="chrome-sync-modal__result-label">{t('chromeSync.total')}:</span>
                      <span className="chrome-sync-modal__result-value">{result.total}</span>
                    </div>
                  </div>

                  <div className="chrome-sync-modal__actions">
                    <PixelButton variant="secondary" onClick={onClose}>
                      {t('common.close')}
                    </PixelButton>
                  </div>
                </>
              )}
            </div>
          ) : (
            <>
              <div className="chrome-sync-modal__field">
                <ToggleSwitch
                  checked={convertPathToTags}
                  onChange={(checked) => {
                    setConvertPathToTags(checked);
                    if (!checked) {
                      setConvertExisting(false);
                    }
                  }}
                  label={t('chromeSync.convertPathToTag')}
                />
                <p className="chrome-sync-modal__hint">{t('chromeSync.convertPathHint')}</p>
              </div>

              {convertPathToTags && (
                <>
                  <div className="chrome-sync-modal__field">
                    <label className="chrome-sync-modal__label">{t('chromeSync.pathMode')}</label>
                    <select
                      className="chrome-sync-modal__select"
                      value={pathMode}
                      onChange={(e) => setPathMode(e.target.value as 'hierarchical' | 'independent')}
                    >
                      <option value="hierarchical">{t('chromeSync.hierarchical')} ({t('chromeSync.hierarchicalDesc')})</option>
                      <option value="independent">{t('chromeSync.independent')} ({t('chromeSync.independentDesc')})</option>
                    </select>
                  </div>

                  <div className="chrome-sync-modal__field">
                    <ToggleSwitch
                      checked={convertExisting}
                      onChange={setConvertExisting}
                      label={t('chromeSync.convertExisting')}
                    />
                    <p className="chrome-sync-modal__hint">{t('chromeSync.convertExistingDesc')}</p>
                  </div>
                </>
              )}

              <div className="chrome-sync-modal__info">
                <div className="chrome-sync-modal__info-title">{t('chromeSync.infoTitle')}</div>
                <div className="chrome-sync-modal__info-body">
                  <ul className="chrome-sync-modal__info-list">
                    <li>{t('chromeSync.info1')}</li>
                    <li>
                      {t('chromeSync.info2')}
                      <ul className="chrome-sync-modal__info-sublist">
                        <li>{t('chromeSync.hierarchical')}: {t('chromeSync.hierarchicalDesc')}</li>
                        <li>{t('chromeSync.independent')}: {t('chromeSync.independentDesc')}</li>
                      </ul>
                    </li>
                    <li>{t('chromeSync.info3')}</li>
                  </ul>
                </div>
              </div>

              <div className="chrome-sync-modal__actions">
                <PixelButton variant="secondary" onClick={onClose} disabled={isSyncing}>
                  {t('chromeSync.cancel')}
                </PixelButton>
                <PixelButton onClick={handleSync} disabled={isSyncing}>
                  {isSyncing ? t('chromeSync.syncing') : t('chromeSync.syncButton')}
                </PixelButton>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};


