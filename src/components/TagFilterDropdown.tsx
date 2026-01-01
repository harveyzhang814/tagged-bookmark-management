import { useMemo, useState, useRef, useEffect, useCallback } from 'react';
import { SearchInput } from './SearchInput';
import type { Tag } from '../lib/types';
import './tagFilterDropdown.css';

interface TagFilterDropdownProps {
  tags: Tag[];
  selected: string[];
  onToggle: (tagId: string) => void;
}

export const TagFilterDropdown = ({ tags, selected, onToggle }: TagFilterDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [visibleCount, setVisibleCount] = useState(30); // 初始显示30个
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const listEndRef = useRef<HTMLDivElement>(null);

  // 获取已选中的tags
  const selectedTags = useMemo(() => {
    return tags.filter(tag => selected.includes(tag.id));
  }, [tags, selected]);

  // 过滤未选中的tags（根据搜索关键词）
  const filteredAvailableTags = useMemo(() => {
    const available = tags.filter(tag => !selected.includes(tag.id));
    if (!searchQuery.trim()) {
      return available;
    }
    const query = searchQuery.toLowerCase();
    return available.filter(tag => tag.name.toLowerCase().includes(query));
  }, [tags, selected, searchQuery]);

  // 可见的tag列表（lazy loading）
  const visibleTags = useMemo(() => {
    return filteredAvailableTags.slice(0, visibleCount);
  }, [filteredAvailableTags, visibleCount]);

  // 计算下拉菜单位置的函数
  const updateMenuPosition = useCallback(() => {
    if (triggerRef.current) {
      const triggerRect = triggerRef.current.getBoundingClientRect();
      const menuWidth = 320; // 菜单宽度
      const menuHeight = 400; // 最大高度
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
  }, []);

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

  // Lazy loading: 使用IntersectionObserver监听列表末尾
  useEffect(() => {
    if (!isOpen || visibleTags.length >= filteredAvailableTags.length) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisibleCount(prev => Math.min(prev + 20, filteredAvailableTags.length));
        }
      },
      { threshold: 0.1 }
    );

    if (listEndRef.current) {
      observer.observe(listEndRef.current);
    }

    return () => {
      if (listEndRef.current) {
        observer.unobserve(listEndRef.current);
      }
    };
  }, [isOpen, visibleTags.length, filteredAvailableTags.length]);

  // 重置可见数量当搜索改变时
  useEffect(() => {
    if (isOpen) {
      setVisibleCount(30);
    }
  }, [searchQuery, isOpen]);

  // 切换下拉列表
  const handleToggle = useCallback(() => {
    setIsOpen(prev => !prev);
    if (!isOpen) {
      setSearchQuery('');
      setVisibleCount(30);
    }
  }, [isOpen]);

  // 处理tag选择
  const handleTagClick = useCallback((tagId: string) => {
    onToggle(tagId);
  }, [onToggle]);

  // 处理已选tag的删除
  const handleRemoveSelected = useCallback((tagId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onToggle(tagId);
  }, [onToggle]);

  return (
    <div className="tag-filter-dropdown" ref={dropdownRef}>
      <button
        type="button"
        ref={triggerRef}
        className="tag-filter-dropdown__trigger"
        onClick={handleToggle}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <span className="tag-filter-dropdown__trigger-text">Tag</span>
        {selected.length > 0 && (
          <span className="tag-filter-dropdown__count">{selected.length}</span>
        )}
        <svg
          className={`tag-filter-dropdown__arrow ${isOpen ? 'tag-filter-dropdown__arrow--open' : ''}`}
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M3 4.5L6 7.5L9 4.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {isOpen && (
        <div 
          ref={menuRef}
          className="tag-filter-dropdown__menu"
          style={{
            top: `${menuPosition.top}px`,
            left: `${menuPosition.left}px`
          }}
        >
          <div className="tag-filter-dropdown__search">
            <SearchInput
              value={searchQuery}
              placeholder="搜索标签..."
              onChange={setSearchQuery}
            />
          </div>

          {selectedTags.length > 0 && (
            <div className="tag-filter-dropdown__selected">
              <div className="tag-filter-dropdown__selected-header">已选择</div>
              <div className="tag-filter-dropdown__selected-list">
                {selectedTags.map(tag => (
                  <div
                    key={tag.id}
                    className="tag-filter-dropdown__selected-item"
                    onClick={(e) => handleRemoveSelected(tag.id, e)}
                  >
                    <span className="tag-filter-dropdown__color-dot" style={{ backgroundColor: tag.color }} />
                    <span className="tag-filter-dropdown__tag-name">{tag.name}</span>
                    <svg
                      className="tag-filter-dropdown__remove-icon"
                      width="14"
                      height="14"
                      viewBox="0 0 14 14"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M10.5 3.5L3.5 10.5M3.5 3.5L10.5 10.5"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="tag-filter-dropdown__available">
            <div className="tag-filter-dropdown__available-header">可选标签</div>
            <div className="tag-filter-dropdown__available-list">
              {visibleTags.length === 0 ? (
                <div className="tag-filter-dropdown__empty">
                  {searchQuery ? '未找到匹配的标签' : '暂无标签'}
                </div>
              ) : (
                <>
                  {visibleTags.map(tag => (
                    <div
                      key={tag.id}
                      className="tag-filter-dropdown__item"
                      onClick={() => handleTagClick(tag.id)}
                    >
                      <span className="tag-filter-dropdown__color-dot" style={{ backgroundColor: tag.color }} />
                      <span className="tag-filter-dropdown__tag-name">{tag.name}</span>
                    </div>
                  ))}
                  {visibleTags.length < filteredAvailableTags.length && (
                    <div ref={listEndRef} className="tag-filter-dropdown__load-more" />
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
