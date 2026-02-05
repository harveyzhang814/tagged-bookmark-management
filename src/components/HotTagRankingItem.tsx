import { useEffect, useState } from 'react';
import type { Tag } from '../lib/types';
import { RankingItem } from './RankingItem';
import { getTagBorderColor, getTagTintColor } from '../lib/colorUtils';
import './hotTagRankingItem.css';

interface HotTagRankingItemProps {
  tag: Tag;
  rank: number;
  onClick: () => void;
}

// 从 DOM 读取当前实际应用的主题（同步，高效）
const getThemeFromDOM = (): 'light' | 'dark' => {
  return document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
};

export const HotTagRankingItem = ({ tag, rank, onClick }: HotTagRankingItemProps) => {
  // 优化：直接使用 'light' | 'dark' 类型，因为颜色计算只需要实际应用的主题
  const [effectiveTheme, setEffectiveTheme] = useState<'light' | 'dark'>(() => getThemeFromDOM());
  const [borderColor, setBorderColor] = useState<string>(tag.color);
  const [tintColor, setTintColor] = useState<string>('');

  // 计算颜色的辅助函数
  const updateColors = (theme: 'light' | 'dark') => {
    setBorderColor(getTagBorderColor(tag.color, theme));
    setTintColor(getTagTintColor(tag.color, theme));
  };

  useEffect(() => {
    // 初始化：从 DOM 读取主题并计算颜色（同步，无需异步）
    const theme = getThemeFromDOM();
    setEffectiveTheme(theme);
    updateColors(theme);

    // 监听主题变化
    const observer = new MutationObserver(() => {
      const theme = getThemeFromDOM();
      setEffectiveTheme(theme);
      updateColors(theme);
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });

    return () => {
      observer.disconnect();
    };
  }, [tag.color]);

  const dotStyle = {
    borderColor: borderColor,
    backgroundColor: tintColor,
  };

  return (
    <RankingItem rank={rank} onClick={onClick}>
      <span className="hot-tag-ranking-color-dot" style={dotStyle} />
      <h4 className="hot-tag-ranking-title" title={tag.name}>
        {tag.name}
      </h4>
      <div className="hot-tag-ranking-stat-item">
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
      <div className="hot-tag-ranking-stat-item">
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
    </RankingItem>
  );
};
