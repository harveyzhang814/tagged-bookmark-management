import { useEffect, useState } from 'react';
import { getTheme, toggleTheme, type Theme } from '../lib/theme';
import './themeToggle.css';

export const ThemeToggle = () => {
  const [theme, setTheme] = useState<Theme>('light');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadTheme = async () => {
      const currentTheme = await getTheme();
      setTheme(currentTheme);
      setIsLoading(false);
    };
    void loadTheme();
  }, []);

  const handleToggle = async () => {
    setIsLoading(true);
    const newTheme = await toggleTheme();
    setTheme(newTheme);
    setIsLoading(false);
  };

  if (isLoading) {
    return (
      <button className="theme-toggle" disabled aria-label="切换主题">
        <div className="theme-toggle__icon theme-toggle__icon--loading">
          <svg width="16" height="16" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="25" strokeDashoffset="6">
              <animate attributeName="stroke-dashoffset" values="25;0;25" dur="1s" repeatCount="indefinite"/>
            </circle>
          </svg>
        </div>
      </button>
    );
  }

  return (
    <button
      className="theme-toggle"
      onClick={handleToggle}
      aria-label={theme === 'light' ? '切换到暗黑模式' : '切换到明亮模式'}
      title={theme === 'light' ? '切换到暗黑模式' : '切换到明亮模式'}
    >
      {theme === 'light' ? (
        <svg className="theme-toggle__icon" width="16" height="16" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M10 3V1M10 19V17M17 10H19M1 10H3M15.657 4.343L17.071 2.929M2.929 17.071L4.343 15.657M15.657 15.657L17.071 17.071M2.929 2.929L4.343 4.343M14 10C14 12.2091 12.2091 14 10 14C7.79086 14 6 12.2091 6 10C6 7.79086 7.79086 6 10 6C12.2091 6 14 7.79086 14 10Z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ) : (
        <svg className="theme-toggle__icon" width="16" height="16" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M10 3C6.13401 3 3 6.13401 3 10C3 13.866 6.13401 17 10 17C13.866 17 17 13.866 17 10C17 9.28977 16.889 8.60347 16.682 7.95869M10 1V3M10 17V19M3 10H1M19 10H17M4.34315 4.34315L2.92893 2.92893M17.0711 17.0711L15.6569 15.6569M4.34315 15.6569L2.92893 17.0711M17.0711 2.92893L15.6569 4.34315"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </button>
  );
};

