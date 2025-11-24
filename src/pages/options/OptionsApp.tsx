import { useEffect, useMemo, useState } from 'react';
import { BookmarksPage } from './pages/BookmarksPage';
import { TagsPage } from './pages/TagsPage';
import { HomePage } from './pages/HomePage';
import { ThemeToggle } from '../../components/ThemeToggle';
import { initTheme } from '../../lib/theme';
import './optionsApp.css';

type TabKey = 'home' | 'bookmarks' | 'tags';

const tabs: { key: TabKey; label: string }[] = [
  { key: 'home', label: '首页' },
  { key: 'bookmarks', label: '网页' },
  { key: 'tags', label: '标签' }
];

export const OptionsApp = () => {
  const [activeTab, setActiveTab] = useState<TabKey>(() => {
    // 从URL参数读取tab
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab') as TabKey | null;
    return tab && ['home', 'bookmarks', 'tags'].includes(tab) ? tab : 'home';
  });

  useEffect(() => {
    void initTheme();
  }, []);

  const renderContent = useMemo(() => {
    switch (activeTab) {
      case 'home':
        return <HomePage onNavigate={(tab) => setActiveTab(tab)} />;
      case 'tags':
        return <TagsPage />;
      case 'bookmarks':
      default:
        return <BookmarksPage />;
    }
  }, [activeTab]);

  return (
    <div className="options-shell">
      <header className="options-header">
        <div>
          <h1>标签书签管家</h1>
          <p>管理你的书签和标签</p>
        </div>
        <ThemeToggle />
      </header>

      <nav className="options-tabs">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            className={`options-tab ${tab.key === activeTab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <main>{renderContent}</main>
    </div>
  );
};


