import { useCallback, useEffect, useMemo, useState } from 'react';
import { BookmarksPage } from './pages/BookmarksPage';
import { TagsPage } from './pages/TagsPage';
import { HomepagePage } from './pages/HomepagePage';
import { RankingPage } from './pages/RankingPage';
import { WorkstationsPage } from './pages/WorkstationsPage';
import { SettingsPage } from './pages/SettingsPage';
import { ThemeToggle } from '../../components/ThemeToggle';
import { ImportExportModal } from '../../components/ImportExportModal';
import { IconButton } from '../../components/IconButton';
import { NavigationSidebar } from '../../components/NavigationSidebar';
import { initTheme } from '../../lib/theme';
import { type ActiveTab, getActiveTab, saveActiveTab } from '../../lib/storage';
import './optionsApp.css';

export type TabKey = 'home' | 'bookmarks' | 'tags' | 'ranking' | 'workstations' | 'settings';

const PERSISTED_TABS = ['home', 'bookmarks', 'tags', 'ranking', 'workstations'] as const;

export const OptionsApp = () => {
  const [activeTab, setActiveTab] = useState<TabKey>('home');
  const [lastNonSettingsTab, setLastNonSettingsTab] = useState<ActiveTab>('home');
  const [isInitialized, setIsInitialized] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isImportExportModalOpen, setIsImportExportModalOpen] = useState(false);

  // 获取图标 URL
  const getIconUrl = (size: '16' | '48' | '128' = '48') => {
    if (typeof chrome !== 'undefined' && chrome.runtime?.getURL) {
      return chrome.runtime.getURL(`icons/icon-${size}.png`);
    }
    return `icons/icon-${size}.png`;
  };

  // 初始化：从存储或URL参数读取tab
  useEffect(() => {
    const initializeTab = async () => {
      // 优先从URL参数读取（用于直接链接）
      const params = new URLSearchParams(window.location.search);
      const urlTab = params.get('tab') as TabKey | null;
      
      // settings 是隐藏tab：允许通过URL进入，但不写入 activeTab 持久化
      if (urlTab === 'settings') {
        const savedTab = await getActiveTab();
        const fallbackTab: ActiveTab = savedTab && PERSISTED_TABS.includes(savedTab) ? savedTab : 'home';
        setLastNonSettingsTab(fallbackTab);
        setActiveTab('settings');
        setIsInitialized(true);
        return;
      }

      if (urlTab && PERSISTED_TABS.includes(urlTab)) {
        setActiveTab(urlTab);
        setLastNonSettingsTab(urlTab);
        await saveActiveTab(urlTab);
        setIsInitialized(true);
      } else {
        // 从存储读取上次保存的tab
        const savedTab = await getActiveTab();
        // 如果没有保存的tab或保存的tab无效，默认显示首页
        const finalTab = savedTab && PERSISTED_TABS.includes(savedTab)
          ? savedTab 
          : 'home';
        setActiveTab(finalTab);
        setLastNonSettingsTab(finalTab);
        if (!savedTab || !PERSISTED_TABS.includes(savedTab)) {
          await saveActiveTab('home');
        }
        setIsInitialized(true);
      }
    };
    
    void initializeTab();
    void initTheme();
  }, []);

  // 切换tab时保存到存储（settings 不参与持久化）
  const handleTabChange = useCallback(async (tab: TabKey) => {
    if (tab === 'settings') {
      // 进入设置页前记录上一个普通 tab（用于返回）
      if (activeTab !== 'settings' && PERSISTED_TABS.includes(activeTab as ActiveTab)) {
        setLastNonSettingsTab(activeTab as ActiveTab);
      }
    } else {
      setLastNonSettingsTab(tab);
    }

    setActiveTab(tab);
    if (tab !== 'settings') {
      await saveActiveTab(tab);
    }
    // 更新URL（不刷新页面）
    const url = new URL(window.location.href);
    const hasTagParam = url.searchParams.has('tag');
    url.searchParams.set('tab', tab);
    window.history.replaceState({}, '', url.toString());
    // 如果切换到bookmarks页面且URL中有tag参数，触发刷新以重新读取参数
    if (tab === 'bookmarks' && hasTagParam) {
      setRefreshKey((prev) => prev + 1);
    }
  }, [activeTab]);

  const handleRefresh = useCallback(() => {
    // 触发刷新：增加refreshKey，子组件会监听这个变化
    setRefreshKey((prev) => prev + 1);
  }, []);

  const renderContent = useMemo(() => {
    if (!isInitialized) {
      return null; // 等待初始化完成
    }
    
    switch (activeTab) {
      case 'home':
        return <HomepagePage key={refreshKey} onNavigate={(tab) => void handleTabChange(tab)} />;
      case 'tags':
        return <TagsPage key={refreshKey} />;
      case 'workstations':
        return <WorkstationsPage key={refreshKey} />;
      case 'ranking':
        return <RankingPage key={refreshKey} onNavigate={(tab) => void handleTabChange(tab)} onRefresh={handleRefresh} />;
      case 'settings':
        return <SettingsPage onClose={() => void handleTabChange(lastNonSettingsTab)} />;
      case 'bookmarks':
      default:
        return <BookmarksPage key={refreshKey} onRefresh={handleRefresh} />;
    }
  }, [activeTab, isInitialized, handleTabChange, refreshKey, handleRefresh, lastNonSettingsTab]);

  return (
    <div className="options-shell">
      <header className="options-navigator">
        <div className="options-navigator__brand">
          <img 
            src={getIconUrl('48')} 
            alt="CrossTag Bookmarks" 
            className="options-navigator__icon"
          />
          <h1>CrossTag Bookmarks</h1>
        </div>

        <div className="options-navigator__actions">
          <IconButton
            variant="secondary"
            icon={
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M8 12h8M8 12l-2-2m2 2l-2 2M16 12l2-2m-2 2l2 2"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle
                  cx="4"
                  cy="12"
                  r="2"
                  stroke="currentColor"
                  strokeWidth="2"
                />
                <circle
                  cx="20"
                  cy="12"
                  r="2"
                  stroke="currentColor"
                  strokeWidth="2"
                />
              </svg>
            }
            aria-label="导入导出"
            onClick={() => setIsImportExportModalOpen(true)}
          />
          <ThemeToggle />
          <IconButton
            variant="secondary"
            icon={
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M10 12a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M15.2 12.2a1.2 1.2 0 0 0 .25 1.3l.04.04a1.5 1.5 0 0 1 0 2.12 1.5 1.5 0 0 1-2.12 0l-.04-.04a1.2 1.2 0 0 0-1.3-.25 1.2 1.2 0 0 0-.72 1.08v.04a1.5 1.5 0 0 1-1.5 1.5 1.5 1.5 0 0 1-1.5-1.5v-.04a1.2 1.2 0 0 0-.72-1.08 1.2 1.2 0 0 0-1.3.25l-.04.04a1.5 1.5 0 0 1-2.12 0 1.5 1.5 0 0 1 0-2.12l.04-.04a1.2 1.2 0 0 0 .25-1.3 1.2 1.2 0 0 0-1.08-.72h-.04a1.5 1.5 0 0 1-1.5-1.5 1.5 1.5 0 0 1 1.5-1.5h.04a1.2 1.2 0 0 0 1.08-.72 1.2 1.2 0 0 0-.25-1.3l-.04-.04a1.5 1.5 0 0 1 0-2.12 1.5 1.5 0 0 1 2.12 0l.04.04a1.2 1.2 0 0 0 1.3.25h0a1.2 1.2 0 0 0 .72-1.08v-.04a1.5 1.5 0 0 1 1.5-1.5 1.5 1.5 0 0 1 1.5 1.5v.04a1.2 1.2 0 0 0 .72 1.08 1.2 1.2 0 0 0 1.3-.25l.04-.04a1.5 1.5 0 0 1 2.12 0 1.5 1.5 0 0 1 0 2.12l-.04.04a1.2 1.2 0 0 0-.25 1.3v0a1.2 1.2 0 0 0 1.08.72h.04a1.5 1.5 0 0 1 1.5 1.5 1.5 1.5 0 0 1-1.5 1.5h-.04a1.2 1.2 0 0 0-1.08.72Z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            }
            aria-label="设置"
            onClick={() => void handleTabChange('settings')}
          />
        </div>
      </header>

      <div className="options-content-wrapper">
        <NavigationSidebar activeTab={activeTab} onTabChange={handleTabChange} />
        
        <div className="options-content">
          <main>{renderContent}</main>
        </div>
      </div>

      <ImportExportModal
        isOpen={isImportExportModalOpen}
        onClose={() => setIsImportExportModalOpen(false)}
        onImportSuccess={handleRefresh}
      />
    </div>
  );
};


