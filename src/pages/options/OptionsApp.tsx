import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BookmarksPage } from './pages/BookmarksPage';
import { TagsPage } from './pages/TagsPage';
import { HomepagePage } from './pages/HomepagePage';
import { RankingPage } from './pages/RankingPage';
import { WorkstationsPage } from './pages/WorkstationsPage';
import { SettingsPage } from './pages/SettingsPage';
import { GlobalSearchOverlay } from '../../components/GlobalSearchOverlay';
import { NavigationSidebar } from '../../components/NavigationSidebar';
import { initTheme } from '../../lib/theme';
import { type ActiveTab, getActiveTab, saveActiveTab } from '../../lib/storage';
import './optionsApp.css';

export type TabKey = 'home' | 'bookmarks' | 'tags' | 'ranking' | 'workstations' | 'settings';

const PERSISTED_TABS = ['home', 'bookmarks', 'tags', 'ranking', 'workstations'] as const;

export const OptionsApp = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<TabKey>('home');
  const [lastNonSettingsTab, setLastNonSettingsTab] = useState<ActiveTab>('home');
  const [isInitialized, setIsInitialized] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [headerSearchQuery, setHeaderSearchQuery] = useState('');

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

  const handleNavigateToBookmarks = useCallback(
    (params?: { tag?: string; query?: string }) => {
      const url = new URL(window.location.href);
      url.searchParams.set('tab', 'bookmarks');
      if (params?.tag) url.searchParams.set('tag', params.tag);
      if (params?.query) url.searchParams.set('query', params.query);
      window.history.replaceState({}, '', url.toString());
      setActiveTab('bookmarks');
      void saveActiveTab('bookmarks');
      setLastNonSettingsTab('bookmarks');
      if (params?.tag || params?.query) setRefreshKey((k) => k + 1);
    },
    []
  );

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
        return (
          <SettingsPage
            onClose={() => void handleTabChange(lastNonSettingsTab)}
            onDataCleared={handleRefresh}
          />
        );
      case 'bookmarks':
      default:
        return <BookmarksPage key={refreshKey} onRefresh={handleRefresh} />;
    }
  }, [activeTab, isInitialized, handleTabChange, refreshKey, handleRefresh, lastNonSettingsTab]);

  return (
    <div className="options-shell">
      <NavigationSidebar
        activeTab={activeTab}
        onTabChange={handleTabChange}
        iconUrl={getIconUrl('48')}
        appTitle={t('app.title')}
        onOpenSettings={() => void handleTabChange('settings')}
        isSettingsActive={activeTab === 'settings'}
      />
      <div className="options-right">
        {/* 全局搜索暂时不渲染，组件与 state 保留便于恢复 */}
        {false && (
          <GlobalSearchOverlay
            searchQuery={headerSearchQuery}
            onNavigateToBookmarks={handleNavigateToBookmarks}
          />
        )}
        <div className="options-content">
          <main>{renderContent}</main>
        </div>
      </div>
    </div>
  );
};


