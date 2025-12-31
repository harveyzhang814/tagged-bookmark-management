import { useState, useRef, useEffect } from 'react';
import './tooltip.css';

interface TooltipProps {
  content: string;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export const Tooltip = ({ content, children, position = 'top' }: TooltipProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isVisible && tooltipRef.current) {
      const tooltip = tooltipRef.current;
      const rect = tooltip.getBoundingClientRect();
      
      // 确保tooltip不会超出视口
      if (rect.right > window.innerWidth) {
        tooltip.style.left = 'auto';
        tooltip.style.right = '0';
      }
      if (rect.left < 0) {
        tooltip.style.left = '0';
        tooltip.style.right = 'auto';
      }
      if (rect.bottom > window.innerHeight) {
        tooltip.style.top = 'auto';
        tooltip.style.bottom = '100%';
      }
      if (rect.top < 0) {
        tooltip.style.top = '100%';
        tooltip.style.bottom = 'auto';
      }
    }
  }, [isVisible]);

  return (
    <div
      className="tooltip-wrapper"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onFocus={() => setIsVisible(true)}
      onBlur={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div
          ref={tooltipRef}
          className={`tooltip tooltip--${position}`}
          role="tooltip"
        >
          {content}
        </div>
      )}
    </div>
  );
};
