import { useEffect, useState } from 'react';
import { PixelButton } from '../../components/PixelButton';
import { TagInput } from '../../components/TagInput';
import { IconButton } from '../../components/IconButton';
import { ThemeToggle } from '../../components/ThemeToggle';
import { ensureDefaults, createBookmark } from '../../lib/bookmarkService';
import { getActiveTab, openOptionsPage } from '../../lib/chrome';
import { initTheme } from '../../lib/theme';
import '../../styles/global.css';
import './popup.css';

export const BookmarkPopup = () => {
  const [title, setTitle] = useState('');
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [status, setStatus] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [currentTab, setCurrentTab] = useState<chrome.tabs.Tab | null>(null);

  useEffect(() => {
    void initTheme();
    void ensureDefaults();
    void loadCurrentTab();
  }, []);

  const loadCurrentTab = async () => {
    const tab = await getActiveTab();
    if (tab) {
      setCurrentTab(tab);
      setTitle(tab.title || '');
    }
  };

  const handleSave = async () => {
    const tab = currentTab || (await getActiveTab());
    if (!tab?.url) {
      setStatus('error');
      setTimeout(() => setStatus(null), 3000);
      return;
    }

    setIsSaving(true);
    setStatus(null);

    try {
      await createBookmark({
        url: tab.url,
        title: title.trim() || tab.title || '未命名',
        tags: selectedTagIds,
        pinned: false
      });
      setStatus('success');
      setTitle('');
      setSelectedTagIds([]);
      setTimeout(() => setStatus(null), 2000);
    } catch (err) {
      setStatus('error');
      setTimeout(() => setStatus(null), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenOptions = async () => {
    await openOptionsPage();
    window.close();
  };

  const getDomain = (url?: string) => {
    if (!url) return '';
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.replace('www.', '');
    } catch {
      return '';
    }
  };

  return (
    <div className="popup-shell">
      <div className="popup-container">
        <header className="popup-header">
          <div className="header-content">
            <h1 className="popup-title">保存书签</h1>
            <div className="header-actions">
              <ThemeToggle />
              <IconButton
                variant="secondary"
                icon={
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M2 8L8 2L14 8M3 8V13H6.5V10H9.5V13H13V8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                }
                aria-label="打开管理页面"
                onClick={handleOpenOptions}
                className="settings-button"
              />
            </div>
          </div>
        </header>

        <div className="popup-content">
          {currentTab && (
            <div className="page-info">
              <div className="page-info-icon">
                {currentTab.favIconUrl ? (
                  <img src={currentTab.favIconUrl} alt="" />
                ) : (
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M2 3L8 1L14 3V13L8 15L2 13V3Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </div>
              <div className="page-info-text">
                <div className="page-domain">{getDomain(currentTab.url)}</div>
                <div className="page-url">{currentTab.url}</div>
              </div>
            </div>
          )}

          <div className="form-section">
            <div className="form-field">
              <label className="form-label">标题</label>
              <input
                type="text"
                className="form-input"
                placeholder={currentTab?.title || '输入书签标题'}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !isSaving) {
                    void handleSave();
                  }
                }}
              />
            </div>

            <div className="form-field">
              <label className="form-label">标签</label>
              <TagInput value={selectedTagIds} onChange={setSelectedTagIds} />
            </div>
          </div>

          {status && (
            <div className={`popup-status popup-status--${status}`}>
              {status === 'success' ? (
                <>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M3 8L6 11L13 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span>已保存</span>
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M8 4V8M8 12H8.01M15 8C15 11.866 11.866 15 8 15C4.13401 15 1 11.866 1 8C1 4.13401 4.13401 1 8 1C11.866 1 15 4.13401 15 8Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span>保存失败，请重试</span>
                </>
              )}
            </div>
          )}

          <PixelButton
            onClick={handleSave}
            disabled={isSaving}
            className="save-button pixel-btn--primary"
          >
            {isSaving ? (
              <>
                <svg className="spinner" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeDasharray="37.7" strokeDashoffset="9.4">
                    <animate attributeName="stroke-dashoffset" values="37.7;0;37.7" dur="1s" repeatCount="indefinite"/>
                  </circle>
                </svg>
                <span>保存中...</span>
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3 8L6 11L13 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span>保存</span>
              </>
            )}
          </PixelButton>
        </div>
      </div>
    </div>
  );
};

