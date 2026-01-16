import { useEffect, useState } from 'react';
import type { Theme } from '../lib/theme';
import { getTagBorderColor, getTagTintColor } from '../lib/colorUtils';
import './tagPill.css';

interface Props {
  label: string;
  color: string;
  active?: boolean;
  onClick?: () => void;
  size?: 'default' | 'small' | 'large';
  disabled?: boolean;
}

// 从 DOM 读取当前实际应用的主题（同步，高效）
const getThemeFromDOM = (): 'light' | 'dark' => {
  return document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
};

export const TagPill = ({ label, color, active, onClick, size = 'default', disabled = false }: Props) => {
  // 优化：直接使用 'light' | 'dark' 类型，因为颜色计算只需要实际应用的主题
  const [effectiveTheme, setEffectiveTheme] = useState<'light' | 'dark'>(() => getThemeFromDOM());
  const [borderColor, setBorderColor] = useState<string>(color);
  const [tintColor, setTintColor] = useState<string>('');

  // 计算颜色的辅助函数
  const updateColors = (theme: 'light' | 'dark') => {
    // 传递 'system' 让 colorUtils 从 DOM 读取（确保始终使用最新主题）
    // 或者直接传递实际主题，避免重复读取
    setBorderColor(getTagBorderColor(color, theme));
    setTintColor(getTagTintColor(color, theme));
  };

  // 初始化：从 DOM 读取主题并计算颜色（同步，无需异步）
  useEffect(() => {
    const theme = getThemeFromDOM();
    setEffectiveTheme(theme);
    updateColors(theme);
  }, [color]);

  // 监听主题变化
  useEffect(() => {
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
  }, [color]);

  const className = `tag-pill ${active ? 'tag-pill--active' : ''} ${size === 'small' ? 'tag-pill--small' : ''} ${size === 'large' ? 'tag-pill--large' : ''} ${disabled ? 'tag-pill--disabled' : ''}`;
  const style: React.CSSProperties = { 
    borderColor: borderColor,
    backgroundColor: tintColor,
    ...(active && { boxShadow: `0 0 0 2px ${borderColor}` }),
  };
  
  if (onClick && !disabled) {
    return (
      <button className={className} style={style} onClick={onClick} type="button">
        {label}
      </button>
    );
  }
  
  return (
    <span className={className} style={style}>
      {label}
    </span>
  );
};


