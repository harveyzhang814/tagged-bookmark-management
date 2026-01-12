import { useMemo, useState, useEffect } from 'react';
import { SearchInput } from './SearchInput';
import { Pagination } from './Pagination';
import type { Workstation } from '../lib/types';
import { getTheme, type Theme } from '../lib/theme';
import { getTagDotColor } from '../lib/colorUtils';
import './tagSidebar.css';

interface WorkstationSidebarProps {
  workstations: Workstation[];
  onCreateWorkstation?: (name: string) => Promise<void>;
}

export const WorkstationSidebar = ({ workstations, onCreateWorkstation }: WorkstationSidebarProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [theme, setTheme] = useState<Theme>('light');
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

  const handleDragStart = (e: React.DragEvent, workstationId: string) => {
    e.dataTransfer.setData('workstationId', workstationId);
    e.dataTransfer.effectAllowed = 'move';
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
        <h3 className="tag-sidebar__title">工作区列表</h3>
      </div>
      
      <div className="tag-sidebar__search">
        <SearchInput
          value={searchQuery}
          placeholder="搜索工作区..."
          onChange={setSearchQuery}
        />
      </div>

      <div className="tag-sidebar__content">
        {paginatedWorkstations.length === 0 && !showCreateCard ? (
          <div className="tag-sidebar__empty">
            {searchQuery ? '未找到匹配的工作区' : '暂无工作区'}
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
                <span className="tag-sidebar__name">创建工作区: {searchQuery.trim()}</span>
              </div>
            )}
            {paginatedWorkstations.map((workstation) => (
              <div
                key={workstation.id}
                className="tag-sidebar__item"
                draggable={true}
                onDragStart={(e) => handleDragStart(e, workstation.id)}
              >
                <span className="tag-sidebar__color-dot" style={{ backgroundColor: getTagDotColor(workstation.color, theme) }} />
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
