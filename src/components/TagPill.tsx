import { useEffect, useState } from 'react';
import { getTheme, type Theme } from '../lib/theme';
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

export const TagPill = ({ label, color, active, onClick, size = 'default', disabled = false }: Props) => {
  const [theme, setTheme] = useState<Theme>('light');
  const [borderColor, setBorderColor] = useState<string>(color);
  const [tintColor, setTintColor] = useState<string>('');

  // 初始化主题并计算颜色
  useEffect(() => {
    const initTheme = async () => {
      const currentTheme = await getTheme();
      setTheme(currentTheme);
      setBorderColor(getTagBorderColor(color, currentTheme));
      setTintColor(getTagTintColor(color, currentTheme));
    };
    void initTheme();
  }, [color]);

  // 监听主题变化
  useEffect(() => {
    const observer = new MutationObserver(() => {
      const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
      const currentTheme: Theme = isDark ? 'dark' : 'light';
      setTheme(currentTheme);
      setBorderColor(getTagBorderColor(color, currentTheme));
      setTintColor(getTagTintColor(color, currentTheme));
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


