import { useTranslation } from 'react-i18next';
import type { TabKey } from '../pages/options/OptionsApp';
import { IconButton } from './IconButton';
import { ThemeToggle } from './ThemeToggle';
import { Tooltip } from './Tooltip';
import './navigationSidebar.css';

interface NavigationSidebarProps {
  activeTab: TabKey;
  onTabChange: (tab: TabKey) => void | Promise<void>;
  iconUrl?: string;
  appTitle?: string;
  onOpenSettings?: () => void;
  isSettingsActive?: boolean;
}

const SettingsIcon = () => (
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
);

export const NavigationSidebar = ({
  activeTab,
  onTabChange,
  iconUrl,
  appTitle,
  onOpenSettings,
  isSettingsActive = false,
}: NavigationSidebarProps) => {
  const { t } = useTranslation();

  const tabs: { key: TabKey; label: string; icon: React.ReactNode }[] = [
    {
      key: 'home',
      label: t('navigation.home'),
      icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <polyline
          points="9 22 9 12 15 12 15 22"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
    {
      key: 'bookmarks',
      label: t('navigation.bookmarks'),
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
      label: t('navigation.tags'),
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
      label: t('navigation.workstations'),
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
      label: t('navigation.ranking'),
      icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <line x1="12" y1="20" x2="12" y2="10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <line x1="18" y1="20" x2="18" y2="4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <line x1="6" y1="20" x2="6" y2="16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      ),
    },
  ];

  return (
    <nav className="navigation-sidebar">
      {iconUrl ? (
        <div className="navigation-sidebar__brand">
          <img
            src={iconUrl}
            alt={appTitle ?? ''}
            className="navigation-sidebar__icon"
          />
        </div>
      ) : null}
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
      <div className="navigation-sidebar__footer">
        <ThemeToggle />
        {onOpenSettings ? (
          <Tooltip content={t('tooltip.settings')} position="right">
            <IconButton
              variant="secondary"
              icon={<SettingsIcon />}
              aria-label={t('tooltip.settings')}
              onClick={() => void onOpenSettings()}
              className={isSettingsActive ? 'navigation-sidebar__button--active' : undefined}
            />
          </Tooltip>
        ) : null}
      </div>
    </nav>
  );
};
