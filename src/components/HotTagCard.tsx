import { useEffect, useState } from 'react';
import type { Tag } from '../lib/types';
import { getTheme, type Theme } from '../lib/theme';
import { getTagDotColor } from '../lib/colorUtils';
import './hotTagCard.css';

interface HotTagCardProps {
  tag: Tag;
  onClick: () => void;
}

export const HotTagCard = ({ tag, onClick }: HotTagCardProps) => {
  const [theme, setTheme] = useState<Theme>('light');
  const [dotColor, setDotColor] = useState<string>(tag.color);

  useEffect(() => {
    const initTheme = async () => {
      const currentTheme = await getTheme();
      setTheme(currentTheme);
      setDotColor(getTagDotColor(tag.color, currentTheme));
    };
    void initTheme();

    const observer = new MutationObserver(() => {
      const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
      const currentTheme: Theme = isDark ? 'dark' : 'light';
      setTheme(currentTheme);
      setDotColor(getTagDotColor(tag.color, currentTheme));
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });

    return () => {
      observer.disconnect();
    };
  }, [tag.color]);

  return (
    <div className="hot-tag-card" onClick={onClick}>
      <div className="hot-tag-header">
        <span className="hot-tag-color-dot" style={{ backgroundColor: dotColor }} />
        <h4 className="hot-tag-title" title={tag.name}>
          {tag.name}
        </h4>
      </div>
      {tag.description && (
        <div className="hot-tag-description">{tag.description}</div>
      )}
      <div className="hot-tag-stats">
        <div className="hot-tag-stat-item">
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M2.66667 3.33333H13.3333"
              stroke="currentColor"
              strokeWidth="1.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M2.66667 8H13.3333"
              stroke="currentColor"
              strokeWidth="1.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M2.66667 12.6667H13.3333"
              stroke="currentColor"
              strokeWidth="1.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span>{tag.usageCount || 0}</span>
        </div>
        <div className="hot-tag-stat-item">
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M8 2.66667C4.66667 2.66667 2.07333 5.04 1.33333 8C2.07333 10.96 4.66667 13.3333 8 13.3333C11.3333 13.3333 13.9267 10.96 14.6667 8C13.9267 5.04 11.3333 2.66667 8 2.66667Z"
              stroke="currentColor"
              strokeWidth="1.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
            <path
              d="M8 10.6667C9.47276 10.6667 10.6667 9.47276 10.6667 8C10.6667 6.52724 9.47276 5.33333 8 5.33333C6.52724 5.33333 5.33333 6.52724 5.33333 8C5.33333 9.47276 6.52724 10.6667 8 10.6667Z"
              stroke="currentColor"
              strokeWidth="1.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </svg>
          <span>{tag.clickCount || 0}</span>
        </div>
      </div>
    </div>
  );
};

