import { useEffect, useState } from 'react';
import { getTheme, type Theme } from '../lib/theme';
import { getTextColor } from '../lib/colorUtils';
import './tagPill.css';

interface Props {
  label: string;
  color: string;
  active?: boolean;
  onClick?: () => void;
  size?: 'default' | 'small' | 'large';
}

export const TagPill = ({ label, color, active, onClick, size = 'default' }: Props) => {
  const [textColor, setTextColor] = useState<string>('#2c2c2c');

  // 初始化主题并计算文字颜色
  useEffect(() => {
    const initTheme = async () => {
      const currentTheme = await getTheme();
      setTextColor(getTextColor(color, currentTheme));
    };
    void initTheme();
  }, [color]);

  // 监听主题变化
  useEffect(() => {
    const observer = new MutationObserver(() => {
      const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
      const currentTheme: Theme = isDark ? 'dark' : 'light';
      setTextColor(getTextColor(color, currentTheme));
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });

    return () => {
      observer.disconnect();
    };
  }, [color]);

  const className = `tag-pill ${active ? 'tag-pill--active' : ''} ${size === 'small' ? 'tag-pill--small' : ''} ${size === 'large' ? 'tag-pill--large' : ''}`;
  const style = { 
    backgroundColor: color,
    color: textColor,
  };
  
  if (onClick) {
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


