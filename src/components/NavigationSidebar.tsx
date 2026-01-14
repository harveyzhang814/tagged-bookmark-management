import type { TabKey } from '../pages/options/OptionsApp';
import { Tooltip } from './Tooltip';
import './navigationSidebar.css';

interface NavigationSidebarProps {
  activeTab: TabKey;
  onTabChange: (tab: TabKey) => void | Promise<void>;
}

const tabs: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  {
    key: 'bookmarks',
    label: '书签',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    key: 'tags',
    label: '标签',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <line x1="7" y1="7" x2="7.01" y2="7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    key: 'workstations',
    label: '工作区',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    key: 'ranking',
    label: '榜单',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <line x1="12" y1="20" x2="12" y2="10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <line x1="18" y1="20" x2="18" y2="4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <line x1="6" y1="20" x2="6" y2="16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
];

export const NavigationSidebar = ({ activeTab, onTabChange }: NavigationSidebarProps) => {
  return (
    <nav className="navigation-sidebar">
      {tabs.map((tab) => (
        <Tooltip key={tab.key} content={tab.label} position="right">
          <button
            type="button"
            className={`navigation-sidebar__button ${tab.key === activeTab ? 'active' : ''}`}
            onClick={() => onTabChange(tab.key)}
            aria-label={tab.label}
            aria-current={tab.key === activeTab ? 'page' : undefined}
          >
            {tab.icon}
          </button>
        </Tooltip>
      ))}
    </nav>
  );
};
