import { useMemo, useState, useEffect } from 'react';
import { SearchInput } from './SearchInput';
import { Pagination } from './Pagination';
import type { Tag } from '../lib/types';
import './tagSidebar.css';

interface TagSidebarProps {
  tags: Tag[];
}

export const TagSidebar = ({ tags }: TagSidebarProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 15;

  // 过滤标签
  const filteredTags = useMemo(() => {
    if (!searchQuery.trim()) {
      return tags;
    }
    const query = searchQuery.toLowerCase();
    return tags.filter((tag) => tag.name.toLowerCase().includes(query));
  }, [tags, searchQuery]);

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

  const handleDragStart = (e: React.DragEvent, tagId: string) => {
    e.dataTransfer.setData('tagId', tagId);
    e.dataTransfer.effectAllowed = 'move';
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
        {paginatedTags.length === 0 ? (
          <div className="tag-sidebar__empty">
            {searchQuery ? '未找到匹配的标签' : '暂无标签'}
          </div>
        ) : (
          <div className="tag-sidebar__list">
            {paginatedTags.map((tag) => (
              <div
                key={tag.id}
                className="tag-sidebar__item"
                draggable={true}
                onDragStart={(e) => handleDragStart(e, tag.id)}
              >
                <span className="tag-sidebar__color-dot" style={{ backgroundColor: tag.color }} />
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
