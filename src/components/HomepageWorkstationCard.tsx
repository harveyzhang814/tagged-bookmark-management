import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import type { Workstation, BookmarkItem } from '../lib/types';
import { IconButton } from './IconButton';
import './homepageWorkstationCard.css';

interface HomepageWorkstationCardProps {
  workstation: Workstation;
  bookmarks: BookmarkItem[];
  onOpenAll: (workstationId: string) => void;
  onDelete: (workstationId: string) => void;
}

export const HomepageWorkstationCard = ({
  workstation,
  bookmarks,
  onOpenAll,
  onDelete,
}: HomepageWorkstationCardProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // 获取工作区绑定的书签
  const workstationBookmarks = bookmarks.filter((bookmark) =>
    workstation.bookmarks.includes(bookmark.id)
  );

  // 显示所有书签（最多8条可见，超过可滚动）
  const displayedBookmarks = workstationBookmarks;

  // 计算下拉菜单位置
  const updateMenuPosition = useCallback(() => {
    if (triggerRef.current) {
      const triggerRect = triggerRef.current.getBoundingClientRect();
      const menuWidth = 120;
      const menuHeight = 80;
      const gap = 8;

      let left = triggerRect.right - menuWidth;
      if (left < 20) {
        left = triggerRect.left;
      }

      let top = triggerRect.bottom + gap;
      if (top + menuHeight > window.innerHeight - 20) {
        top = triggerRect.top - menuHeight - gap;
        if (top < 20) {
          top = 20;
        }
      }

      setMenuPosition({ top, left });
    }
  }, []);

  // 监听菜单打开状态，更新位置
  useEffect(() => {
    if (isMenuOpen) {
      updateMenuPosition();
    }
  }, [isMenuOpen, updateMenuPosition]);

  // 监听窗口大小改变和滚动，更新菜单位置
  useEffect(() => {
    if (isMenuOpen) {
      const handleResize = () => updateMenuPosition();
      const handleScroll = () => updateMenuPosition();

      window.addEventListener('resize', handleResize);
      window.addEventListener('scroll', handleScroll, true);

      return () => {
        window.removeEventListener('resize', handleResize);
        window.removeEventListener('scroll', handleScroll, true);
      };
    }
  }, [isMenuOpen, updateMenuPosition]);

  // 处理点击外部关闭下拉列表
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        isMenuOpen &&
        triggerRef.current &&
        !triggerRef.current.contains(target) &&
        menuRef.current &&
        !menuRef.current.contains(target)
      ) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isMenuOpen]);

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onOpenAll(workstation.id);
  };

  const handleToggleMenu = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMenuOpen((prev) => !prev);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMenuOpen(false);
    onDelete(workstation.id);
  };

  return (
    <div className="homepage-workstation-card" onDoubleClick={handleDoubleClick}>
      <div className="homepage-workstation-card__header">
        <h3 className="homepage-workstation-card__title">{workstation.name}</h3>
        <div ref={triggerRef}>
          <IconButton
            variant="secondary"
            icon={
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="8" cy="3" r="1.5" fill="currentColor" />
                <circle cx="8" cy="8" r="1.5" fill="currentColor" />
                <circle cx="8" cy="13" r="1.5" fill="currentColor" />
              </svg>
            }
            aria-label="更多"
            onClick={handleToggleMenu}
          />
        </div>
        {isMenuOpen &&
          createPortal(
            <div
              ref={menuRef}
              className="homepage-workstation-card__menu"
              style={{
                position: 'fixed',
                top: `${menuPosition.top}px`,
                left: `${menuPosition.left}px`,
              }}
            >
              <button
                type="button"
                className="homepage-workstation-card__menu-item homepage-workstation-card__menu-item--danger"
                onClick={handleDelete}
              >
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M12 4L4 12M4 4l8 8"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                删除
              </button>
            </div>,
            document.body
          )}
      </div>

      <div className="homepage-workstation-card__bookmarks">
        {displayedBookmarks.length > 0 ? (
          displayedBookmarks.map((bookmark) => (
            <div key={bookmark.id} className="homepage-workstation-card__bookmark-item">
              {bookmark.title}
            </div>
          ))
        ) : (
          <div className="homepage-workstation-card__empty">暂无书签</div>
        )}
      </div>
    </div>
  );
};
