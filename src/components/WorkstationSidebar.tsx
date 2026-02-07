import { useMemo, useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { SearchInput } from './SearchInput';
import { Pagination } from './Pagination';
import type { Workstation } from '../lib/types';
import './tagSidebar.css';

interface WorkstationSidebarProps {
  workstations: Workstation[];
  onCreateWorkstation?: (name: string) => Promise<void>;
  onBookmarkDrop?: (bookmarkId: string, workstationId: string) => Promise<void>;
}

export const WorkstationSidebar = ({ workstations, onCreateWorkstation, onBookmarkDrop }: WorkstationSidebarProps) => {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 15;

  // 过滤工作区
  const filteredWorkstations = useMemo(() => {
    if (!searchQuery.trim()) {
      return workstations;
    }
    const query = searchQuery.toLowerCase();
    return workstations.filter((workstation) => workstation.name.toLowerCase().includes(query));
  }, [workstations, searchQuery]);

  // 检查是否有完全匹配的工作区
  const hasExactMatch = useMemo(() => {
    if (!searchQuery.trim()) {
      return false;
    }
    const query = searchQuery.trim().toLowerCase();
    return workstations.some((workstation) => workstation.name.toLowerCase() === query);
  }, [workstations, searchQuery]);

  // 是否显示创建工作区card
  const showCreateCard = searchQuery.trim() && !hasExactMatch && onCreateWorkstation;

  // 分页计算
  const totalPages = Math.ceil(filteredWorkstations.length / ITEMS_PER_PAGE);
  const paginatedWorkstations = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return filteredWorkstations.slice(startIndex, endIndex);
  }, [filteredWorkstations, currentPage]);

  // 当搜索条件改变时，重置到第一页
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const [draggedOverWorkstationId, setDraggedOverWorkstationId] = useState<string | null>(null);
  const dragEnterCount = useRef<Map<string, number>>(new Map());

  const handleDragStart = (e: React.DragEvent, workstationId: string) => {
    e.dataTransfer.setData('workstationId', workstationId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleWorkstationDragEnter = (e: React.DragEvent, workstationId: string) => {
    e.preventDefault();
    e.stopPropagation();
    // 检查是否有拖拽数据
    const hasData = e.dataTransfer.types.length > 0;
    if (hasData) {
      // 使用计数器跟踪进入次数，避免移动到子元素时误清除
      const count = dragEnterCount.current.get(workstationId) || 0;
      dragEnterCount.current.set(workstationId, count + 1);
      setDraggedOverWorkstationId(workstationId);
    }
  };

  const handleWorkstationDragOver = (e: React.DragEvent, workstationId: string) => {
    e.preventDefault();
    e.stopPropagation();
    // 如果有拖拽数据，设置 dropEffect
    if (e.dataTransfer.types.length > 0) {
      e.dataTransfer.dropEffect = 'move';
    }
  };

  const handleWorkstationDragLeave = (e: React.DragEvent, workstationId: string) => {
    e.preventDefault();
    e.stopPropagation();
    // 使用计数器，只有当计数器归零时才清除悬停状态
    const count = dragEnterCount.current.get(workstationId) || 0;
    if (count > 0) {
      dragEnterCount.current.set(workstationId, count - 1);
      if (count - 1 === 0) {
        setDraggedOverWorkstationId(null);
        dragEnterCount.current.delete(workstationId);
      }
    }
  };

  const handleWorkstationDrop = async (e: React.DragEvent, workstationId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDraggedOverWorkstationId(null);
    dragEnterCount.current.delete(workstationId);
    
    const bookmarkId = e.dataTransfer.getData('bookmarkId');
    const source = e.dataTransfer.getData('source');
    
    // 只处理来自书签卡片的拖拽
    if (bookmarkId && source === 'bookmarkCard' && onBookmarkDrop) {
      await onBookmarkDrop(bookmarkId, workstationId);
    }
  };

  const handleCreateWorkstation = async () => {
    if (onCreateWorkstation && searchQuery.trim()) {
      await onCreateWorkstation(searchQuery.trim());
      setSearchQuery(''); // 创建后清空搜索
    }
  };

  return (
    <div className="tag-sidebar">
      <div className="tag-sidebar__header">
        <h3 className="tag-sidebar__title">{t('workstation.workstationList')}</h3>
      </div>
      
      <div className="tag-sidebar__search">
        <SearchInput
          value={searchQuery}
          placeholder={t('workstation.searchPlaceholder')}
          onChange={setSearchQuery}
        />
      </div>

      <div className="tag-sidebar__content">
        {paginatedWorkstations.length === 0 && !showCreateCard ? (
          <div className="tag-sidebar__empty">
            {searchQuery ? t('workstation.noMatch') : t('workstation.noWorkstations')}
          </div>
        ) : (
          <div className="tag-sidebar__list">
            {showCreateCard && (
              <div
                className="tag-sidebar__item tag-sidebar__item--create"
                onClick={handleCreateWorkstation}
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
                <span className="tag-sidebar__name">{t('workstation.createWorkstation')}: {searchQuery.trim()}</span>
              </div>
            )}
            {paginatedWorkstations.map((workstation) => (
              <div
                key={workstation.id}
                className={`tag-sidebar__item ${draggedOverWorkstationId === workstation.id ? 'tag-sidebar__item--drag-over' : ''}`}
                draggable={true}
                onDragStart={(e) => handleDragStart(e, workstation.id)}
                onDragEnter={(e) => handleWorkstationDragEnter(e, workstation.id)}
                onDragOver={(e) => handleWorkstationDragOver(e, workstation.id)}
                onDragLeave={(e) => handleWorkstationDragLeave(e, workstation.id)}
                onDrop={(e) => handleWorkstationDrop(e, workstation.id)}
              >
                <span className="tag-sidebar__name">{workstation.name}</span>
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
