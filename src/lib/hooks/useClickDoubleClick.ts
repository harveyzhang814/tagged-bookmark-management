import { useRef, type MouseEvent } from 'react';

interface UseClickDoubleClickOptions {
  onClick: () => void;
  onDoubleClick: () => void;
  dragStartTime?: number; // 如果提供了拖拽开始时间，会在300ms内忽略点击
}

/**
 * 可复用的单击/双击判断Hook
 * 使用300ms延迟来区分单击和双击，与BookmarkCard和TagCard的逻辑保持一致
 */
export const useClickDoubleClick = ({ onClick, onDoubleClick, dragStartTime }: UseClickDoubleClickOptions) => {
  const clickTimer = useRef<NodeJS.Timeout | null>(null);

  const handleClick = (e: MouseEvent) => {
    // 如果刚刚拖拽过（300ms内），不触发点击
    if (dragStartTime !== undefined && dragStartTime > 0) {
      const timeSinceDragStart = Date.now() - dragStartTime;
      if (timeSinceDragStart < 300) {
        e.preventDefault();
        return;
      }
    }

    // 使用延迟来区分单点击和双击
    if (clickTimer.current) {
      clearTimeout(clickTimer.current);
    }

    clickTimer.current = setTimeout(() => {
      onClick();
      clickTimer.current = null;
    }, 300); // 300ms延迟，如果在这期间检测到双击则取消
  };

  const handleDoubleClick = (e: MouseEvent) => {
    e.stopPropagation();
    // 清除单点击的延迟执行
    if (clickTimer.current) {
      clearTimeout(clickTimer.current);
      clickTimer.current = null;
    }
    onDoubleClick();
  };

  return { handleClick, handleDoubleClick };
};
