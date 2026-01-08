import { useCallback, useEffect, useMemo, useState } from 'react';
import { BookmarksPage } from './pages/BookmarksPage';
import { TagsPage } from './pages/TagsPage';
import { HomePage } from './pages/HomePage';
import { RankingPage } from './pages/RankingPage';
import { ThemeToggle } from '../../components/ThemeToggle';
import { ImportExportModal } from '../../components/ImportExportModal';
import { IconButton } from '../../components/IconButton';
import { initTheme } from '../../lib/theme';
import { getActiveTab, saveActiveTab } from '../../lib/storage';
import './optionsApp.css';

type TabKey = 'home' | 'bookmarks' | 'tags' | 'ranking';

const tabs: { key: TabKey; label: string }[] = [
  { key: 'bookmarks', label: '书签' },
  { key: 'tags', label: '标签' },
  { key: 'ranking', label: '榜单' }
];

export const OptionsApp = () => {
  const [activeTab, setActiveTab] = useState<TabKey>('bookmarks');
  const [isInitialized, setIsInitialized] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isImportExportModalOpen, setIsImportExportModalOpen] = useState(false);

  // 初始化：从存储或URL参数读取tab
  useEffect(() => {
    const initializeTab = async () => {
      // 优先从URL参数读取（用于直接链接）
      const params = new URLSearchParams(window.location.search);
      const urlTab = params.get('tab') as TabKey | null;
      
      if (urlTab && ['home', 'bookmarks', 'tags', 'ranking'].includes(urlTab)) {
        // 如果 URL 参数是 'home'，跳转到默认 tab 'bookmarks'
        const finalTab = urlTab === 'home' ? 'bookmarks' : urlTab;
        setActiveTab(finalTab);
        await saveActiveTab(finalTab);
        setIsInitialized(true);
      } else {
        // 从存储读取上次保存的tab
        const savedTab = await getActiveTab();
        // 如果保存的是 'home'，则跳转到默认 tab 'bookmarks'
        const finalTab = savedTab === 'home' ? 'bookmarks' : savedTab;
        setActiveTab(finalTab);
        // 如果保存的是 'home'，更新存储为默认 tab
        if (savedTab === 'home') {
          await saveActiveTab('bookmarks');
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
    url.searchParams.set('tab', tab);
    window.history.replaceState({}, '', url.toString());
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
        return <HomePage key={refreshKey} onNavigate={(tab) => void handleTabChange(tab)} onRefresh={handleRefresh} />;
      case 'tags':
        return <TagsPage key={refreshKey} />;
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
          <h1>CrossTag Bookmarks</h1>
        </div>
        
        <nav className="options-navigator__tabs">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              className={`options-navigator__tab ${tab.key === activeTab ? 'active' : ''}`}
              onClick={() => void handleTabChange(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </nav>

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

      <main>{renderContent}</main>

      <ImportExportModal
        isOpen={isImportExportModalOpen}
        onClose={() => setIsImportExportModalOpen(false)}
        onImportSuccess={handleRefresh}
      />
    </div>
  );
};


