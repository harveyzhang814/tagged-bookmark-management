import { useState, useRef, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import './sortDropdown.css';

export type SortField = 'createdAt' | 'clickCount' | 'usageCount' | 'bookmarkCount';

interface SortOption {
  value: SortField;
  label: string;
}

interface SortDropdownProps {
  sortBy: SortField;
  sortOrder: 'asc' | 'desc';
  onSortByChange: (sortBy: SortField) => void;
  onSortOrderToggle: () => void;
  options: SortOption[];
}

export const SortDropdown = ({ sortBy, sortOrder, onSortByChange, onSortOrderToggle, options }: SortDropdownProps) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // 排序字段显示文本
  const sortByText = options.find(opt => opt.value === sortBy)?.label || t('sort.title');

  // 计算下拉菜单位置的函数
  const updateMenuPosition = useCallback(() => {
    if (triggerRef.current) {
      const triggerRect = triggerRef.current.getBoundingClientRect();
      const menuWidth = 200; // 菜单宽度
      const menuHeight = Math.min(80 + options.length * 40, 400); // 根据选项数量动态调整高度
      const gap = 8;
      
      // 计算左侧位置（尽量与触发器左对齐）
      let left = triggerRect.left;
      
      // 如果右侧空间不足，调整位置
      if (left + menuWidth > window.innerWidth) {
        left = window.innerWidth - menuWidth - 20; // 留出20px边距
      }
      
      // 如果左侧空间不足，使用触发器右对齐
      if (left < 20) {
        left = triggerRect.right - menuWidth;
        if (left < 20) {
          left = 20; // 最小边距
        }
      }
      
      // 计算顶部位置（在触发器下方）
      let top = triggerRect.bottom + gap;
      
      // 如果下方空间不足，在触发器上方显示
      if (top + menuHeight > window.innerHeight - 20) {
        top = triggerRect.top - menuHeight - gap;
        // 如果上方也不够，限制在窗口内
        if (top < 20) {
          top = 20;
        }
      }
      
      setMenuPosition({ top, left });
    }
  }, [options.length]);

  // 计算下拉菜单位置
  useEffect(() => {
    if (isOpen) {
      updateMenuPosition();
    }
  }, [isOpen, updateMenuPosition]);

  // 监听窗口大小改变和滚动，更新菜单位置
  useEffect(() => {
    if (isOpen) {
      const handleResize = () => {
        updateMenuPosition();
      };
      
      const handleScroll = () => {
        updateMenuPosition();
      };

      window.addEventListener('resize', handleResize);
      window.addEventListener('scroll', handleScroll, true); // 使用捕获阶段监听所有滚动
      
      return () => {
        window.removeEventListener('resize', handleResize);
        window.removeEventListener('scroll', handleScroll, true);
      };
    }
  }, [isOpen, updateMenuPosition]);

  // 处理点击外部关闭下拉列表
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        isOpen &&
        triggerRef.current &&
        !triggerRef.current.contains(target) &&
        menuRef.current &&
        !menuRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isOpen]);

  // 切换下拉列表
  const handleToggle = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  // 处理排序字段选择
  const handleSortBySelect = useCallback((newSortBy: SortField) => {
    if (newSortBy !== sortBy) {
      onSortByChange(newSortBy);
    }
    setIsOpen(false);
  }, [sortBy, onSortByChange]);

  // 处理排序方向切换（阻止事件冒泡）
  const handleSortOrderClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onSortOrderToggle();
  }, [onSortOrderToggle]);

  return (
    <div className="sort-dropdown" ref={dropdownRef}>
      <button
        type="button"
        ref={triggerRef}
        className="sort-dropdown__trigger"
        onClick={handleToggle}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <span className="sort-dropdown__trigger-text">{sortByText}</span>
        <button
          type="button"
          className="sort-dropdown__order-button"
          onClick={handleSortOrderClick}
          aria-label={sortOrder === 'desc' ? t('sort.toggleAsc') : t('sort.toggleDesc')}
        >
          {sortOrder === 'asc' ? (
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M3.5 7L7 3.5L10.5 7M7 3.5V10.5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M3.5 7L7 10.5L10.5 7M7 10.5V3.5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </button>
      </button>

      {isOpen && (
        <div 
          ref={menuRef}
          className="sort-dropdown__menu"
          style={{
            top: `${menuPosition.top}px`,
            left: `${menuPosition.left}px`
          }}
        >
          {options.map((option) => (
            <div
              key={option.value}
              className="sort-dropdown__item"
              onClick={() => handleSortBySelect(option.value)}
            >
              <span className="sort-dropdown__item-text">{option.label}</span>
              {sortBy === option.value && (
                <svg
                  className="sort-dropdown__check"
                  width="14"
                  height="14"
                  viewBox="0 0 14 14"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M3 7L6 10L11 3"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
