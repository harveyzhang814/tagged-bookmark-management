import { useMemo, useState, useEffect } from 'react';
import { SearchInput } from './SearchInput';
import { Pagination } from './Pagination';
import type { Tag } from '../lib/types';
import { getTheme, type Theme } from '../lib/theme';
import { getTagDotColor } from '../lib/colorUtils';
import './tagSidebar.css';

interface TagSidebarProps {
  tags: Tag[];
  onCreateTag?: (name: string) => Promise<void>;
}

export const TagSidebar = ({ tags, onCreateTag }: TagSidebarProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [theme, setTheme] = useState<Theme>('light');
  const ITEMS_PER_PAGE = 15;

  // 过滤标签
  const filteredTags = useMemo(() => {
    if (!searchQuery.trim()) {
      return tags;
    }
    const query = searchQuery.toLowerCase();
    return tags.filter((tag) => tag.name.toLowerCase().includes(query));
  }, [tags, searchQuery]);

  // 检查是否有完全匹配的标签
  const hasExactMatch = useMemo(() => {
    if (!searchQuery.trim()) {
      return false;
    }
    const query = searchQuery.trim().toLowerCase();
    return tags.some((tag) => tag.name.toLowerCase() === query);
  }, [tags, searchQuery]);

  // 是否显示创建标签card
  const showCreateCard = searchQuery.trim() && !hasExactMatch && onCreateTag;

  // 分页计算
  const totalPages = Math.ceil(filteredTags.length / ITEMS_PER_PAGE);
  const paginatedTags = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return filteredTags.slice(startIndex, endIndex);
  }, [filteredTags, currentPage]);

  // 当搜索条件改变时，重置到第一页
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

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

  const handleDragStart = (e: React.DragEvent, tagId: string) => {
    e.dataTransfer.setData('tagId', tagId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleCreateTag = async () => {
    if (onCreateTag && searchQuery.trim()) {
      await onCreateTag(searchQuery.trim());
      setSearchQuery(''); // 创建后清空搜索
    }
  };

  return (
    <div className="tag-sidebar">
      <div className="tag-sidebar__header">
        <h3 className="tag-sidebar__title">标签列表</h3>
      </div>
      
      <div className="tag-sidebar__search">
        <SearchInput
          value={searchQuery}
          placeholder="搜索标签..."
          onChange={setSearchQuery}
        />
      </div>

      <div className="tag-sidebar__content">
        {paginatedTags.length === 0 && !showCreateCard ? (
          <div className="tag-sidebar__empty">
            {searchQuery ? '未找到匹配的标签' : '暂无标签'}
          </div>
        ) : (
          <div className="tag-sidebar__list">
            {showCreateCard && (
              <div
                className="tag-sidebar__item tag-sidebar__item--create"
                onClick={handleCreateTag}
                draggable={false}
              >
                <svg 
                  className="tag-sidebar__create-icon"
                  width="12" 
                  height="12" 
                  viewBox="0 0 12 12" 
                  fill="none" 
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path 
                    d="M6 2V10M2 6H10" 
                    stroke="currentColor" 
                    strokeWidth="1.5" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  />
                </svg>
                <span className="tag-sidebar__name">创建标签: {searchQuery.trim()}</span>
              </div>
            )}
            {paginatedTags.map((tag) => (
              <div
                key={tag.id}
                className="tag-sidebar__item"
                draggable={true}
                onDragStart={(e) => handleDragStart(e, tag.id)}
              >
                <span className="tag-sidebar__color-dot" style={{ backgroundColor: getTagDotColor(tag.color, theme) }} />
                <span className="tag-sidebar__name">{tag.name}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="tag-sidebar__pagination">
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
