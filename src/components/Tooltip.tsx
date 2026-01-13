import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import './tooltip.css';

interface TooltipProps {
  content: string;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export const Tooltip = ({ content, children, position = 'top' }: TooltipProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({});
  const wrapperRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isVisible && wrapperRef.current) {
      const updatePosition = () => {
        if (!wrapperRef.current || !tooltipRef.current) return;

        const wrapper = wrapperRef.current;
        const tooltip = tooltipRef.current;
        const wrapperRect = wrapper.getBoundingClientRect();
        const tooltipRect = tooltip.getBoundingClientRect();
        
        // 触发元素的中心点
        const triggerCenterX = wrapperRect.left + wrapperRect.width / 2;
        const triggerCenterY = wrapperRect.top + wrapperRect.height / 2;
        
        let top = 0;
        let left = 0;
        let arrowOffset = 0;

        // 根据position计算初始位置
        switch (position) {
          case 'top':
            top = wrapperRect.top - tooltipRect.height - 6;
            left = triggerCenterX;
            break;
          case 'bottom':
            top = wrapperRect.bottom + 6;
            left = triggerCenterX;
            break;
          case 'left':
            top = triggerCenterY;
            left = wrapperRect.left - tooltipRect.width - 6;
            break;
          case 'right':
            top = triggerCenterY;
            left = wrapperRect.right + 6;
            break;
        }

        // 确保tooltip不会超出视口
        if (left + tooltipRect.width / 2 > window.innerWidth) {
          left = window.innerWidth - tooltipRect.width / 2 - 8;
        }
        if (left - tooltipRect.width / 2 < 8) {
          left = tooltipRect.width / 2 + 8;
        }
        if (top + tooltipRect.height / 2 > window.innerHeight) {
          top = window.innerHeight - tooltipRect.height / 2 - 8;
        }
        if (top - tooltipRect.height / 2 < 8) {
          top = tooltipRect.height / 2 + 8;
        }

        // 计算箭头偏移量（相对于tooltip中心）
        // 箭头应该指向触发元素的中心点
        if (position === 'top' || position === 'bottom') {
          // 水平方向：箭头应该指向触发元素中心，计算偏移
          arrowOffset = triggerCenterX - left;
          // 限制箭头偏移范围，避免超出tooltip边界（留出一些边距）
          const maxOffset = tooltipRect.width / 2 - 12;
          arrowOffset = Math.max(-maxOffset, Math.min(maxOffset, arrowOffset));
        } else {
          // 垂直方向：箭头应该指向触发元素中心，计算偏移
          arrowOffset = triggerCenterY - top;
          // 限制箭头偏移范围，避免超出tooltip边界（留出一些边距）
          const maxOffset = tooltipRect.height / 2 - 12;
          arrowOffset = Math.max(-maxOffset, Math.min(maxOffset, arrowOffset));
        }

        setTooltipStyle({
          position: 'fixed',
          top: `${top}px`,
          left: `${left}px`,
          transform: position === 'top' || position === 'bottom' 
            ? 'translateX(-50%)' 
            : 'translateY(-50%)',
          '--arrow-offset': `${arrowOffset}px`,
        } as React.CSSProperties & { '--arrow-offset': string });
      };

      // 使用requestAnimationFrame确保tooltip已经渲染
      requestAnimationFrame(() => {
        requestAnimationFrame(updatePosition);
      });

      // 监听滚动和窗口大小变化
      window.addEventListener('scroll', updatePosition, true);
      window.addEventListener('resize', updatePosition);

      return () => {
        window.removeEventListener('scroll', updatePosition, true);
        window.removeEventListener('resize', updatePosition);
      };
    } else {
      setTooltipStyle({});
    }
  }, [isVisible, position]);

  return (
    <>
      <div
        ref={wrapperRef}
        className="tooltip-wrapper"
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        onFocus={() => setIsVisible(true)}
        onBlur={() => setIsVisible(false)}
      >
        {children}
      </div>
      {isVisible &&
        createPortal(
          <div
            ref={tooltipRef}
            className={`tooltip tooltip--${position}`}
            style={tooltipStyle}
            role="tooltip"
          >
            {content}
          </div>,
          document.body
        )}
    </>
  );
};
