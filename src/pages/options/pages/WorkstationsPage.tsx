import { useEffect, useMemo, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { PixelButton } from '../../../components/PixelButton';
import { SearchInput } from '../../../components/SearchInput';
import { SortDropdown, type SortField } from '../../../components/SortDropdown';
import { WorkstationCard } from '../../../components/WorkstationCard';
import { WorkstationEditModal } from '../../../components/WorkstationEditModal';
import { Pagination } from '../../../components/Pagination';
import { AddBookmarkToWorkstationModal } from '../../../components/AddBookmarkToWorkstationModal';
import { WorkstationBookmarkSidebar } from '../../../components/WorkstationBookmarkSidebar';
import {
  getAllWorkstations,
  createWorkstation,
  updateWorkstation,
  deleteWorkstation,
  removeBookmarkFromWorkstation
} from '../../../lib/workstationService';
import { getAllTags, getAllBookmarks } from '../../../lib/bookmarkService';
import type { Workstation, BookmarkItem, Tag } from '../../../lib/types';
import './workstationsPage.css';

/** 内容区侧边栏类型（与左侧全局导航无关）；新增侧栏时在此扩展 */
type WorkstationsSidebarKind = 'workstation-bookmark';

export const WorkstationsPage = () => {
  const { t } = useTranslation();
  const [workstations, setWorkstations] = useState<Workstation[]>([]);
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortField>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [editingWorkstation, setEditingWorkstation] = useState<Workstation | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [openSidebar, setOpenSidebar] = useState<WorkstationsSidebarKind | null>(null);
  const [selectedWorkstationId, setSelectedWorkstationId] = useState<string | null>(null);
  const [isAddBookmarkModalOpen, setIsAddBookmarkModalOpen] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const ITEMS_PER_PAGE = 40;

  const refresh = async () => {
    const [workstationsList, bookmarksList, tagsList] = await Promise.all([
      getAllWorkstations(),
      getAllBookmarks(),
      getAllTags()
    ]);
    setWorkstations(workstationsList);
    setBookmarks(bookmarksList);
    setTags(tagsList);
  };

  useEffect(() => {
    void refresh();
  }, []);

  const filtered = useMemo(() => {
    let list = workstations;
    // 搜索过滤
    if (search) {
      list = list.filter((workstation) => workstation.name.toLowerCase().includes(search.toLowerCase()));
    }
    // 排序
    const sortedList = [...list];
    sortedList.sort((a, b) => {
      // 首先按 pinned 排序（置顶在前）
      if (a.pinned !== b.pinned) {
        return a.pinned ? -1 : 1;
      }
      // 然后根据选择的排序字段和排序方向进行排序
      let diff = 0;
      if (sortBy === 'createdAt') {
        diff = sortOrder === 'desc' ? b.createdAt - a.createdAt : a.createdAt - b.createdAt;
      } else if (sortBy === 'bookmarkCount') {
        const aCount = a.bookmarks.length;
        const bCount = b.bookmarks.length;
        diff = sortOrder === 'desc' ? bCount - aCount : aCount - bCount;
      } else if (sortBy === 'clickCount') {
        diff = sortOrder === 'desc' ? b.clickCount - a.clickCount : a.clickCount - b.clickCount;
      }
      return diff;
    });
    return sortedList;
  }, [workstations, search, sortBy, sortOrder]);

  // 分页计算
  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginatedWorkstations = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return filtered.slice(startIndex, endIndex);
  }, [filtered, currentPage]);

  // 当搜索条件或排序改变时，重置到第一页
  useEffect(() => {
    setCurrentPage(1);
  }, [search, sortBy, sortOrder]);

  // 当总页数变化时，确保当前页不超过总页数
  useEffect(() => {
    if (totalPages > 0 && currentPage > totalPages) {
      setCurrentPage(totalPages);
    } else if (totalPages === 0 && currentPage > 1) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

  /* Esc 关闭当前打开的侧边栏（不写死优先级，仅关闭当前） */
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || !openSidebar) return;
      setOpenSidebar(null);
      setSelectedWorkstationId(null);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [openSidebar]);

  const handleCreateWorkstation = async (data: { name: string; description?: string; pinned: boolean }) => {
    const newWorkstation = await createWorkstation({
      name: data.name,
      description: data.description,
      pinned: data.pinned
    });
    // 不立即关闭弹窗，让成功提示先显示，弹窗会在1.5秒后自动关闭
    // 延迟刷新数据，让成功提示先显示
    setTimeout(async () => {
      await refresh();
    }, 1600);
  };

  const handleEdit = (workstation: Workstation) => {
    setEditingWorkstation(workstation);
  };

  const handleCloseEditModal = () => {
    setEditingWorkstation(null);
  };

  const handleCloseCreateModal = () => {
    setIsCreateModalOpen(false);
  };

  const handleSaveEdit = async (
    workstationId: string,
    data: { name: string; description?: string; pinned: boolean }
  ) => {
    await updateWorkstation(workstationId, data);
    await refresh();
  };

  const handleDeleteWorkstation = async (workstationId: string) => {
    await deleteWorkstation(workstationId);
    await refresh();
    if (selectedWorkstationId === workstationId) {
      setOpenSidebar(null);
      setSelectedWorkstationId(null);
    }
  };

  const handleTogglePin = async (workstationId: string) => {
    const workstation = workstations.find((w) => w.id === workstationId);
    if (workstation) {
      await updateWorkstation(workstationId, { pinned: !workstation.pinned });
      await refresh();
    }
  };

  const handleWorkstationClick = (workstationId: string) => {
    if (openSidebar !== 'workstation-bookmark' || selectedWorkstationId !== workstationId) {
      setSelectedWorkstationId(workstationId);
      setOpenSidebar('workstation-bookmark');
    } else {
      // 如果已经打开且是同一个工作区，刷新数据
      void refresh();
    }
  };

  const handleCloseSidebar = () => {
    setOpenSidebar(null);
    setSelectedWorkstationId(null);
  };

  const handleRemoveBookmark = async (bookmarkId: string) => {
    if (!selectedWorkstationId) return;
    await removeBookmarkFromWorkstation(selectedWorkstationId, bookmarkId);
    await refresh();
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    
    const bookmarkId = e.dataTransfer.getData('bookmarkId');
    const source = e.dataTransfer.getData('source');
    
    // 只处理来自工作区侧边栏的拖拽
    if (source !== 'workstationBookmarkSidebar' || !bookmarkId || !selectedWorkstationId) return;
    
    // 检查是否拖拽到侧边栏外
    const sidebarElement = sidebarRef.current;
    if (!sidebarElement) return;
    
    // 使用鼠标位置来判断是否在侧边栏内
    const x = e.clientX;
    const y = e.clientY;
    const rect = sidebarElement.getBoundingClientRect();
    const isInsideSidebar = 
      x >= rect.left && 
      x <= rect.right && 
      y >= rect.top && 
      y <= rect.bottom;
    
    // 如果拖拽到侧边栏外，移除书签关系
    if (!isInsideSidebar) {
      await handleRemoveBookmark(bookmarkId);
    }
  };

  const selectedWorkstation = workstations.find((w) => w.id === selectedWorkstationId) || null;

  return (
    <div 
      className="workstations-page"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <div className="workstations-toolbar-merged">
        <div className="workstations-filters">
          <SearchInput value={search} placeholder={t('workstation.searchPlaceholder')} onChange={setSearch} />
          <SortDropdown
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSortByChange={setSortBy}
            onSortOrderToggle={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
            options={[
              { value: 'createdAt', label: t('sort.byCreatedAt') },
              { value: 'bookmarkCount', label: t('workstation.bookmarkCount') },
              { value: 'clickCount', label: t('workstation.clickCount') }
            ]}
          />
        </div>
        <div className="workstations-actions">
          <PixelButton onClick={() => setIsCreateModalOpen(true)}>
            {t('workstation.new')}
          </PixelButton>
        </div>
      </div>

      <div className="workstations-content-wrapper">
        <div className="workstations-content">
          {filtered.length > 0 ? (
            <div className="workstations-section">
              <h2 className="workstations-section-title">{t('workstation.title')}</h2>
              <div className="workstation-grid">
                {paginatedWorkstations.map((workstation) => (
                  <WorkstationCard
                    key={workstation.id}
                    workstation={workstation}
                    onTogglePin={handleTogglePin}
                    onClick={handleWorkstationClick}
                  />
                ))}
              </div>
              {totalPages > 1 && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
              )}
            </div>
          ) : (
            <div className="workstations-empty">
              <p>{t('workstation.noWorkstations')}</p>
            </div>
          )}
        </div>

        {openSidebar === 'workstation-bookmark' && selectedWorkstation && (
          <div ref={sidebarRef} className="workstations-sidebar-wrapper">
            <WorkstationBookmarkSidebar
              workstationId={selectedWorkstationId}
              workstation={selectedWorkstation}
              bookmarks={bookmarks}
              tags={tags}
              onClose={handleCloseSidebar}
              onRemoveBookmark={handleRemoveBookmark}
              onAddBookmarkClick={() => setIsAddBookmarkModalOpen(true)}
              onWorkstationUpdated={() => void refresh()}
              onDeleteClick={handleEdit}
            />
          </div>
        )}
      </div>

      {editingWorkstation && (
        <WorkstationEditModal
          mode="edit"
          workstation={editingWorkstation}
          onClose={handleCloseEditModal}
          onSave={handleSaveEdit}
          onDelete={handleDeleteWorkstation}
        />
      )}

      {isCreateModalOpen && (
        <WorkstationEditModal
          mode="create"
          onClose={handleCloseCreateModal}
          onCreate={handleCreateWorkstation}
        />
      )}

      {isAddBookmarkModalOpen && selectedWorkstationId && selectedWorkstation && (
        <AddBookmarkToWorkstationModal
          isOpen={isAddBookmarkModalOpen}
          onClose={async () => {
            await refresh();
            setIsAddBookmarkModalOpen(false);
          }}
          workstationId={selectedWorkstationId}
          workstation={selectedWorkstation}
          bookmarks={bookmarks}
          tags={tags}
        />
      )}
    </div>
  );
};
