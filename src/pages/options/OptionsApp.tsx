import { useCallback, useEffect, useMemo, useState } from 'react';
import { BookmarksPage } from './pages/BookmarksPage';
import { TagsPage } from './pages/TagsPage';
import { HomePage } from './pages/HomePage';
import { ThemeToggle } from '../../components/ThemeToggle';
import { BookmarkCreateModal } from '../../components/BookmarkCreateModal';
import { PixelButton } from '../../components/PixelButton';
import { createBookmark } from '../../lib/bookmarkService';
import { initTheme } from '../../lib/theme';
import { getActiveTab, saveActiveTab } from '../../lib/storage';
import './optionsApp.css';

type TabKey = 'home' | 'bookmarks' | 'tags';

const tabs: { key: TabKey; label: string }[] = [
  { key: 'home', label: '首页' },
  { key: 'bookmarks', label: '网页' },
  { key: 'tags', label: '标签' }
];

export const OptionsApp = () => {
  const [activeTab, setActiveTab] = useState<TabKey>('home');
  const [isInitialized, setIsInitialized] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // 初始化：从存储或URL参数读取tab
  useEffect(() => {
    const initializeTab = async () => {
      // 优先从URL参数读取（用于直接链接）
      const params = new URLSearchParams(window.location.search);
      const urlTab = params.get('tab') as TabKey | null;
      
      if (urlTab && ['home', 'bookmarks', 'tags'].includes(urlTab)) {
        setActiveTab(urlTab);
        await saveActiveTab(urlTab);
        setIsInitialized(true);
      } else {
        // 从存储读取上次保存的tab
        const savedTab = await getActiveTab();
        setActiveTab(savedTab);
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

  const handleCreateBookmark = async (data: { title: string; url: string; tags: string[]; pinned: boolean }) => {
    await createBookmark(data);
    // 触发刷新：增加refreshKey，子组件会监听这个变化
    setRefreshKey((prev) => prev + 1);
  };

  const renderContent = useMemo(() => {
    if (!isInitialized) {
      return null; // 等待初始化完成
    }
    
    switch (activeTab) {
      case 'home':
        return <HomePage key={refreshKey} onNavigate={(tab) => void handleTabChange(tab)} />;
      case 'tags':
        return <TagsPage key={refreshKey} />;
      case 'bookmarks':
      default:
        return <BookmarksPage key={refreshKey} />;
    }
  }, [activeTab, isInitialized, handleTabChange, refreshKey]);

  return (
    <div className="options-shell">
      <header className="options-header">
        <div>
          <h1>标签书签管家</h1>
          <p>管理你的书签和标签</p>
        </div>
        <ThemeToggle />
      </header>

      <div className="options-toolbar">
        <PixelButton onClick={() => setIsCreateModalOpen(true)}>
          新建
        </PixelButton>
      </div>

      <nav className="options-tabs">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            className={`options-tab ${tab.key === activeTab ? 'active' : ''}`}
            onClick={() => void handleTabChange(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <main>{renderContent}</main>

      <BookmarkCreateModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={handleCreateBookmark}
      />
    </div>
  );
};


