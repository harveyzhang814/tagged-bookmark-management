import { useMemo, useState, useEffect, useRef } from 'react';
import { SearchInput } from './SearchInput';
import { Pagination } from './Pagination';
import { TagPill } from './TagPill';
import { incrementBookmarkClick } from '../lib/bookmarkService';
import { getTheme, type Theme } from '../lib/theme';
import { getTagBorderColor, getTagTintColor } from '../lib/colorUtils';
import type { BookmarkItem, Tag } from '../lib/types';
import './bookmarkSidebar.css';

type SortOption = 'createdAt' | 'clickCount';

interface BookmarkSidebarProps {
  tagId: string | null;
  bookmarks: BookmarkItem[];
  tags: Tag[];
  onClose?: () => void;
  onRemoveTag?: (bookmarkId: string, tagId: string) => Promise<void>;
  onRefresh?: () => Promise<void>;
}

export const BookmarkSidebar = ({ tagId, bookmarks, tags, onClose, onRemoveTag, onRefresh }: BookmarkSidebarProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('createdAt');
  const [currentPage, setCurrentPage] = useState(1);
  const [theme, setTheme] = useState<Theme>('light');
  const dragStartTime = useRef<number>(0);
  const ITEMS_PER_PAGE = 15;

  // 根据tagId过滤书签
  const filteredByTag = useMemo(() => {
    if (!tagId) return [];
    return bookmarks.filter((bookmark) => bookmark.tags.includes(tagId));
  }, [bookmarks, tagId]);

  // 搜索过滤
  const filteredBySearch = useMemo(() => {
    if (!searchQuery.trim()) {
      return filteredByTag;
    }
    const query = searchQuery.toLowerCase();
    return filteredByTag.filter((bookmark) => {
      const text = `${bookmark.title} ${bookmark.url}`.toLowerCase();
      return text.includes(query);
    });
  }, [filteredByTag, searchQuery]);

  // 排序
  const sorted = useMemo(() => {
    const sortedList = [...filteredBySearch];
    if (sortBy === 'createdAt') {
      return sortedList.sort((a, b) => b.createdAt - a.createdAt);
    } else if (sortBy === 'clickCount') {
      return sortedList.sort((a, b) => b.clickCount - a.clickCount);
    }
    return sortedList;
  }, [filteredBySearch, sortBy]);

  // 分页计算
  const totalPages = Math.ceil(sorted.length / ITEMS_PER_PAGE);
  const paginatedBookmarks = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return sorted.slice(startIndex, endIndex);
  }, [sorted, currentPage]);

  // 当搜索条件或排序改变时，重置到第一页
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, sortBy]);

  // 当总页数变化时，确保当前页不超过总页数
  useEffect(() => {
    if (totalPages > 0 && currentPage > totalPages) {
      setCurrentPage(totalPages);
    } else if (totalPages === 0 && currentPage > 1) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

  // 当tagId改变时，重置搜索和分页
  useEffect(() => {
    setSearchQuery('');
    setCurrentPage(1);
  }, [tagId]);

  // 初始化主题并监听变化
  useEffect(() => {
    const initTheme = async () => {
      const currentTheme = await getTheme();
      setTheme(currentTheme);
    };
    void initTheme();

    const observer = new MutationObserver(() => {
      const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
      setTheme(isDark ? 'dark' : 'light');
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });

    return () => {
      observer.disconnect();
    };
  }, []);

  const handleBookmarkClick = async (bookmark: BookmarkItem) => {
    await incrementBookmarkClick(bookmark.id);
    window.open(bookmark.url, '_blank');
  };

  const handleDragStart = (e: React.DragEvent, bookmarkId: string) => {
    dragStartTime.current = Date.now();
    e.dataTransfer.setData('bookmarkId', bookmarkId);
    e.dataTransfer.setData('source', 'bookmarkSidebar');
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    // 重置拖拽开始时间
    dragStartTime.current = 0;
  };

  const handleItemClick = async (bookmark: BookmarkItem, e: React.MouseEvent) => {
    // 如果刚刚拖拽过（300ms内），不触发点击
    const timeSinceDragStart = Date.now() - dragStartTime.current;
    if (timeSinceDragStart < 300 && dragStartTime.current > 0) {
      e.preventDefault();
      e.stopPropagation();
      dragStartTime.current = 0;
      return;
    }
    await handleBookmarkClick(bookmark);
  };

  const selectedTag = tags.find((t) => t.id === tagId);

  if (!tagId || !selectedTag) {
    return null;
  }

  return (
    <div className="bookmark-sidebar">
      <div className="bookmark-sidebar__header">
        <div className="bookmark-sidebar__title-wrapper">
          <h3 className="bookmark-sidebar__title">{selectedTag.name}</h3>
          {onClose && (
            <button
              className="bookmark-sidebar__close"
              onClick={onClose}
              aria-label="关闭侧边栏"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M12 4L4 12M4 4L12 12"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          )}
        </div>
      </div>

      <div className="bookmark-sidebar__toolbar">
        <div className="bookmark-sidebar__search">
          <SearchInput
            value={searchQuery}
            placeholder="搜索书签..."
            onChange={setSearchQuery}
          />
        </div>
        <div className="bookmark-sidebar__sort">
          <select
            className="bookmark-sidebar__sort-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
          >
            <option value="createdAt">创建日期</option>
            <option value="clickCount">点击次数</option>
          </select>
        </div>
      </div>

      <div className="bookmark-sidebar__content">
        {paginatedBookmarks.length === 0 ? (
          <div className="bookmark-sidebar__empty">
            {searchQuery ? '未找到匹配的书签' : '该标签下暂无书签'}
          </div>
        ) : (
          <div className="bookmark-sidebar__list">
            {paginatedBookmarks.map((bookmark) => {
              // 获取其他标签（排除当前标签）
              const otherTags = bookmark.tags
                .filter((tId) => tId !== tagId)
                .map((tId) => tags.find((t) => t.id === tId))
                .filter((t): t is Tag => t !== undefined);

              // 获取当前选中标签的颜色样式
              const itemStyle = selectedTag ? {
                borderColor: getTagBorderColor(selectedTag.color, theme),
                backgroundColor: getTagTintColor(selectedTag.color, theme),
              } : undefined;

              return (
                <div
                  key={bookmark.id}
                  className="bookmark-sidebar__item"
                  style={itemStyle}
                  draggable={true}
                  onDragStart={(e) => handleDragStart(e, bookmark.id)}
                  onDragEnd={handleDragEnd}
                  onClick={(e) => handleItemClick(bookmark, e)}
                >
                  <div className="bookmark-sidebar__item-header">
                    <h4 className="bookmark-sidebar__item-title">{bookmark.title}</h4>
                  </div>
                  {otherTags.length > 0 && (
                    <div className="bookmark-sidebar__item-tags">
                      {otherTags.map((tag) => (
                        <TagPill key={tag.id} label={tag.name} color={tag.color} size="small" />
                      ))}
                    </div>
                  )}
                  <div className="bookmark-sidebar__item-footer">
                    <div className="bookmark-sidebar__item-click-count">
                      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
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
                      <span>{bookmark.clickCount || 0}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="bookmark-sidebar__pagination">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      )}
    </div>
  );
};
