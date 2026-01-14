import { useCallback, useEffect, useMemo, useState } from 'react';
import { BookmarksPage } from './pages/BookmarksPage';
import { TagsPage } from './pages/TagsPage';
import { HomepagePage } from './pages/HomepagePage';
import { RankingPage } from './pages/RankingPage';
import { WorkstationsPage } from './pages/WorkstationsPage';
import { ThemeToggle } from '../../components/ThemeToggle';
import { ImportExportModal } from '../../components/ImportExportModal';
import { IconButton } from '../../components/IconButton';
import { NavigationSidebar } from '../../components/NavigationSidebar';
import { initTheme } from '../../lib/theme';
import { getActiveTab, saveActiveTab } from '../../lib/storage';
import './optionsApp.css';

export type TabKey = 'home' | 'bookmarks' | 'tags' | 'ranking' | 'workstations';

export const OptionsApp = () => {
  const [activeTab, setActiveTab] = useState<TabKey>('home');
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
      
      if (urlTab && ['home', 'bookmarks', 'tags', 'ranking', 'workstations'].includes(urlTab)) {
        setActiveTab(urlTab);
        await saveActiveTab(urlTab);
        setIsInitialized(true);
      } else {
        // 从存储读取上次保存的tab
        const savedTab = await getActiveTab();
        // 如果没有保存的tab或保存的tab无效，默认显示首页
        const finalTab = savedTab && ['home', 'bookmarks', 'tags', 'ranking', 'workstations'].includes(savedTab) 
          ? savedTab 
          : 'home';
        setActiveTab(finalTab);
        if (!savedTab || !['home', 'bookmarks', 'tags', 'ranking', 'workstations'].includes(savedTab)) {
          await saveActiveTab('home');
        }
        setIsInitialized(true);
      }
    };
    
    void initializeTab();
    void initTheme();
  }, []);

  // 切换tab时保存到存储
  const handleTabChange = useCallback(async (tab: TabKey) => {
    setActiveTab(tab);
    await saveActiveTab(tab);
    // 更新URL（不刷新页面）
    const url = new URL(window.location.href);
    const hasTagParam = url.searchParams.has('tag');
    url.searchParams.set('tab', tab);
    window.history.replaceState({}, '', url.toString());
    // 如果切换到bookmarks页面且URL中有tag参数，触发刷新以重新读取参数
    if (tab === 'bookmarks' && hasTagParam) {
      setRefreshKey((prev) => prev + 1);
    }
  }, []);

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
      case 'bookmarks':
      default:
        return <BookmarksPage key={refreshKey} onRefresh={handleRefresh} />;
    }
  }, [activeTab, isInitialized, handleTabChange, refreshKey, handleRefresh]);

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


