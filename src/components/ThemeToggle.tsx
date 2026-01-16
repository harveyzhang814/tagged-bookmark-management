import { useEffect, useState } from 'react';
import { getTheme, toggleTheme, type Theme } from '../lib/theme';
import './themeToggle.css';

export const ThemeToggle = () => {
  const [theme, setTheme] = useState<Theme>('system');
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

  const getAriaLabel = (currentTheme: Theme): string => {
    if (currentTheme === 'light') {
      return '切换到暗黑模式';
    } else if (currentTheme === 'dark') {
      return '切换到跟随系统';
    } else {
      return '切换到明亮模式';
    }
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
      aria-label={getAriaLabel(theme)}
      title={getAriaLabel(theme)}
    >
      {theme === 'light' ? (
        <svg className="theme-toggle__icon" width="16" height="16" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* 圆形外框 */}
          <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.5" fill="none"/>
          {/* 全部亮色（不填充，只有外框） */}
        </svg>
      ) : theme === 'dark' ? (
        <svg className="theme-toggle__icon" width="16" height="16" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* 圆形外框 */}
          <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.5" fill="none"/>
          {/* 全部暗色（深填充） */}
          <circle cx="10" cy="10" r="7" fill="currentColor" opacity="0.8"/>
        </svg>
      ) : (
        <svg className="theme-toggle__icon" width="16" height="16" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* 圆形外框 */}
          <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.5" fill="none"/>
          {/* 左半圆 - 暗色部分（填充） */}
          <path
            d="M10 3C6.13401 3 3 6.13401 3 10C3 13.866 6.13401 17 10 17V3Z"
            fill="currentColor"
            opacity="0.8"
          />
          {/* 右半圆 - 亮色部分（不填充，只显示外框） */}
          <path
            d="M10 3C13.866 3 17 6.13401 17 10C17 13.866 13.866 17 10 17V3Z"
            fill="none"
          />
          {/* 中间分割线 */}
          <line x1="10" y1="3" x2="10" y2="17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      )}
    </button>
  );
};

