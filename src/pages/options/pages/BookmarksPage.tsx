import { useEffect, useMemo, useState } from 'react';
import { PixelButton } from '../../../components/PixelButton';
import { PixelCard } from '../../../components/PixelCard';
import { SearchInput } from '../../../components/SearchInput';
import { TagFilterDropdown } from '../../../components/TagFilterDropdown';
import { SortDropdown } from '../../../components/SortDropdown';
import { BookmarkCard } from '../../../components/BookmarkCard';
import { BookmarkEditModal } from '../../../components/BookmarkEditModal';
import { Tooltip } from '../../../components/Tooltip';
import { Pagination } from '../../../components/Pagination';
import { TagSidebar } from '../../../components/TagSidebar';
import { WorkstationSidebar } from '../../../components/WorkstationSidebar';
import { IconButton } from '../../../components/IconButton';
import { deleteBookmark, getAllBookmarks, getAllTags, updateBookmark, createBookmark, createTag, incrementBookmarkClick } from '../../../lib/bookmarkService';
import { getAllWorkstations, createWorkstation, addBookmarkToWorkstation } from '../../../lib/workstationService';
import { openUrlWithMode } from '../../../lib/chrome';
import type { BookmarkItem, Tag, Workstation } from '../../../lib/types';
import './bookmarksPage.css';
import { getBrowserDefaultOpenMode } from '../../../lib/storage';
import { ChromeSyncModal } from '../../../components/ChromeSyncModal';

interface BookmarksPageProps {
  onRefresh?: () => void;
}

export const BookmarksPage = ({ onRefresh }: BookmarksPageProps) => {
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [workstations, setWorkstations] = useState<Workstation[]>([]);
  const [query, setQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'createdAt' | 'clickCount'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [isChromeSyncModalOpen, setIsChromeSyncModalOpen] = useState(false);
  const [editingBookmark, setEditingBookmark] = useState<BookmarkItem | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [isTagSidebarOpen, setIsTagSidebarOpen] = useState(false);
  const [isWorkstationSidebarOpen, setIsWorkstationSidebarOpen] = useState(false);
  const ITEMS_PER_PAGE = 18;

  const refresh = async () => {
    const [bookmarksList, tagsList, workstationsList] = await Promise.all([
      getAllBookmarks(),
      getAllTags(),
      getAllWorkstations()
    ]);
    setBookmarks(bookmarksList);
    setTags(tagsList);
    setWorkstations(workstationsList);
  };

  useEffect(() => {
    void refresh();
  }, []);

  // 从URL参数读取tag筛选条件（在组件挂载时和URL变化时）
  useEffect(() => {
    const checkUrlParams = () => {
      const params = new URLSearchParams(window.location.search);
      const tagParam = params.get('tag');
      if (tagParam) {
        setSelectedTags([tagParam]);
        // 清除URL参数，避免刷新时重复应用
        const url = new URL(window.location.href);
        url.searchParams.delete('tag');
        window.history.replaceState({}, '', url.toString());
      }
    };

    // 立即检查一次
    checkUrlParams();

    // 监听popstate事件（浏览器前进/后退）
    window.addEventListener('popstate', checkUrlParams);
    
    return () => {
      window.removeEventListener('popstate', checkUrlParams);
    };
  }, []);


  const filtered = useMemo(() => {
    let list = bookmarks;
    if (query || selectedTags.length) {
      list = list.filter((bookmark) => {
        const q = query.toLowerCase();
        const text = `${bookmark.title} ${bookmark.url}`.toLowerCase();
        const matchQuery = query ? text.includes(q) : true;
        const matchTags = selectedTags.every((tagId) => bookmark.tags.includes(tagId));
        return matchQuery && matchTags;
      });
    }
    // 根据选择的排序字段和排序方向进行排序
    const sortedList = [...list];
    if (sortBy === 'createdAt') {
      sortedList.sort((a, b) => {
        const diff = sortOrder === 'desc' ? b.createdAt - a.createdAt : a.createdAt - b.createdAt;
        return diff;
      });
    } else if (sortBy === 'clickCount') {
      sortedList.sort((a, b) => {
        const diff = sortOrder === 'desc' ? b.clickCount - a.clickCount : a.clickCount - b.clickCount;
        return diff;
      });
    }
    return sortedList;
  }, [bookmarks, query, selectedTags, sortBy, sortOrder]);

  // 分离置顶和普通书签
  const { pinnedBookmarks, normalBookmarks } = useMemo(() => {
    const pinned = filtered.filter((bookmark) => bookmark.pinned);
    const normal = filtered.filter((bookmark) => !bookmark.pinned);
    return { pinnedBookmarks: pinned, normalBookmarks: normal };
  }, [filtered]);

  // 普通书签分页计算
  const totalPages = Math.ceil(normalBookmarks.length / ITEMS_PER_PAGE);
  const paginatedBookmarks = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return normalBookmarks.slice(startIndex, endIndex);
  }, [normalBookmarks, currentPage]);

  // 当筛选条件或排序改变时，重置到第一页
  useEffect(() => {
    setCurrentPage(1);
  }, [query, selectedTags, sortBy, sortOrder]);

  // 当总页数变化时，确保当前页不超过总页数
  useEffect(() => {
    if (totalPages > 0 && currentPage > totalPages) {
      setCurrentPage(totalPages);
    } else if (totalPages === 0 && currentPage > 1) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

  const handleTagToggle = (tagId: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    );
  };

  const handleBookmarkChange = (id: string, patch: Partial<BookmarkItem>) => {
    setBookmarks((prev) => {
      const item = prev.find((b) => b.id === id);
      if (!item) return prev;
      
      const updated: BookmarkItem = { ...item, ...patch };
      
      // 立即保存置顶状态变化
      void updateBookmark(id, {
        title: updated.title,
        url: updated.url,
        tags: updated.tags,
        pinned: updated.pinned
      });
      
      return prev.map((b) => (b.id === id ? updated : b));
    });
  };

  const handleTogglePin = (bookmarkId: string) => {
    const bookmark = bookmarks.find((b) => b.id === bookmarkId);
    if (bookmark) {
      handleBookmarkChange(bookmarkId, { pinned: !bookmark.pinned });
    }
  };

  const handleEdit = (bookmark: BookmarkItem) => {
    setEditingBookmark(bookmark);
  };

  const handleCloseEditModal = () => {
    setEditingBookmark(null);
  };

  const handleBookmarkDoubleClick = async (bookmark: BookmarkItem) => {
    // 双击在当前浏览器窗口打开对应网页
    await incrementBookmarkClick(bookmark.id);
    const mode = await getBrowserDefaultOpenMode();
    await openUrlWithMode(bookmark.url, mode);
    await refresh();
  };

  const handleSaveEdit = async (
    bookmarkId: string,
    data: { title: string; url: string; tags: string[]; pinned: boolean }
  ) => {
    await updateBookmark(bookmarkId, data);
    await refresh();
  };

  const handleDeleteBookmark = async (bookmarkId: string) => {
    await deleteBookmark(bookmarkId);
    await refresh();
  };

  const handleCreateBookmark = async (data: { title: string; url: string; tags: string[]; pinned: boolean }) => {
    await createBookmark(data);
    // 不立即关闭弹窗，让成功提示先显示，弹窗会在1.5秒后自动关闭
    // 延迟刷新数据，让成功提示先显示
    setTimeout(async () => {
      await refresh();
      // 触发父组件刷新
      if (onRefresh) {
        onRefresh();
      }
    }, 1600);
  };

  const handleTagDrop = async (bookmarkId: string, tagId: string) => {
    const bookmark = bookmarks.find((b) => b.id === bookmarkId);
    if (!bookmark) return;
    
    // 检查书签是否已有该标签
    if (bookmark.tags.includes(tagId)) {
      return; // 已有该标签，不重复添加
    }
    
    // 添加标签到书签
    await updateBookmark(bookmarkId, {
      title: bookmark.title,
      url: bookmark.url,
      tags: [...bookmark.tags, tagId],
      pinned: bookmark.pinned
    });
    
    await refresh();
  };

  const handleCreateTag = async (name: string) => {
    await createTag({ name, color: '' });
    await refresh();
  };

  const handleCreateWorkstation = async (name: string) => {
    await createWorkstation({ name, color: '', description: undefined, pinned: false });
    await refresh();
  };

  const handleWorkstationDrop = async (bookmarkId: string, workstationId: string) => {
    await addBookmarkToWorkstation(workstationId, bookmarkId);
    await refresh();
  };


  const handleOpenSyncModal = () => {
    setIsChromeSyncModalOpen(true);
  };


  return (
    <div className="bookmarks-page">
      <div className="bookmarks-toolbar-merged">
        <div className="bookmarks-toolbar-left">
          <div className="bookmarks-filters">
            <SearchInput value={query} placeholder="搜索标题或URL" onChange={setQuery} />
            <TagFilterDropdown tags={tags} selected={selectedTags} onToggle={handleTagToggle} />
            <SortDropdown
              sortBy={sortBy}
              sortOrder={sortOrder}
              onSortByChange={(newSortBy) => {
                if (newSortBy === 'createdAt' || newSortBy === 'clickCount') {
                  setSortBy(newSortBy);
                }
              }}
              onSortOrderToggle={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
              options={[
                { value: 'createdAt', label: '创建日期' },
                { value: 'clickCount', label: '点击数量' }
              ]}
            />
          </div>
        </div>
        <div className="bookmarks-actions">
          <PixelButton onClick={() => setIsCreateModalOpen(true)}>
            新建书签
          </PixelButton>
          <Tooltip content="一键导入 Chrome 收藏夹中的所有书签，已存在的书签会自动跳过">
            <PixelButton 
              onClick={handleOpenSyncModal}
            >
              同步
            </PixelButton>
          </Tooltip>
          <Tooltip content={isTagSidebarOpen ? '隐藏标签栏' : '显示标签栏'}>
            <IconButton
              variant={isTagSidebarOpen ? 'primary' : 'secondary'}
              icon={
                <svg 
                  width="16" 
                  height="16" 
                  viewBox="0 0 16 16" 
                  fill="none" 
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M2.5 3C2.5 2.72386 2.72386 2.5 3 2.5H9.5C9.77614 2.5 10 2.72386 10 3V8.5L12.5 11L10 13.5V13C10 12.7239 9.77614 12.5 9.5 12.5H3C2.72386 12.5 2.5 12.7239 2.5 13V3Z"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill={isTagSidebarOpen ? 'currentColor' : 'none'}
                  />
                  <path
                    d="M10 8.5L12.5 11L15 8.5"
                    stroke={isTagSidebarOpen ? 'var(--bg-card)' : 'currentColor'}
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                  />
                </svg>
              }
              aria-label={isTagSidebarOpen ? '隐藏标签栏' : '显示标签栏'}
              onClick={() => setIsTagSidebarOpen(!isTagSidebarOpen)}
              className="bookmarks-sidebar-toggle"
            />
          </Tooltip>
          <Tooltip content={isWorkstationSidebarOpen ? '隐藏工作区栏' : '显示工作区栏'}>
            <IconButton
              variant={isWorkstationSidebarOpen ? 'primary' : 'secondary'}
              icon={
                <svg 
                  width="16" 
                  height="16" 
                  viewBox="0 0 16 16" 
                  fill="none" 
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M2.5 4C2.5 3.17157 3.17157 2.5 4 2.5H6.5C7.32843 2.5 8 3.17157 8 4V6.5C8 7.32843 7.32843 8 6.5 8H4C3.17157 8 2.5 7.32843 2.5 6.5V4Z"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill={isWorkstationSidebarOpen ? 'currentColor' : 'none'}
                  />
                  <path
                    d="M8 4C8 3.17157 8.67157 2.5 9.5 2.5H12C12.8284 2.5 13.5 3.17157 13.5 4V6.5C13.5 7.32843 12.8284 8 12 8H9.5C8.67157 8 8 7.32843 8 6.5V4Z"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill={isWorkstationSidebarOpen ? 'currentColor' : 'none'}
                  />
                  <path
                    d="M2.5 9.5C2.5 8.67157 3.17157 8 4 8H6.5C7.32843 8 8 8.67157 8 9.5V12C8 12.8284 7.32843 13.5 6.5 13.5H4C3.17157 13.5 2.5 12.8284 2.5 12V9.5Z"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill={isWorkstationSidebarOpen ? 'currentColor' : 'none'}
                  />
                  <path
                    d="M8 9.5C8 8.67157 8.67157 8 9.5 8H12C12.8284 8 13.5 8.67157 13.5 9.5V12C13.5 12.8284 12.8284 13.5 12 13.5H9.5C8.67157 13.5 8 12.8284 8 12V9.5Z"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill={isWorkstationSidebarOpen ? 'currentColor' : 'none'}
                  />
                </svg>
              }
              aria-label={isWorkstationSidebarOpen ? '隐藏工作区栏' : '显示工作区栏'}
              onClick={() => setIsWorkstationSidebarOpen(!isWorkstationSidebarOpen)}
              className="bookmarks-sidebar-toggle"
            />
          </Tooltip>
        </div>
      </div>

      <div className="bookmarks-content-wrapper">
        <div className="bookmarks-content">
          {/* 置顶书签区域 */}
          {pinnedBookmarks.length > 0 && (
            <div className="bookmarks-section">
              <h2 className="bookmarks-section-title">置顶书签</h2>
              <div className="bookmark-list">
                {pinnedBookmarks.map((bookmark) => (
                  <BookmarkCard
                    key={bookmark.id}
                    bookmark={bookmark}
                    tags={tags}
                    onEdit={handleEdit}
                    onTogglePin={handleTogglePin}
                    onTagDrop={(tagId) => handleTagDrop(bookmark.id, tagId)}
                    onWorkstationDrop={(workstationId) => handleWorkstationDrop(bookmark.id, workstationId)}
                    onDoubleClick={handleBookmarkDoubleClick}
                  />
                ))}
              </div>
            </div>
          )}

          {/* 普通书签区域 */}
          {normalBookmarks.length > 0 && (
            <div className="bookmarks-section">
              {pinnedBookmarks.length > 0 && (
                <h2 className="bookmarks-section-title">普通书签</h2>
              )}
              <div className="bookmark-list">
                {paginatedBookmarks.map((bookmark) => (
                  <BookmarkCard
                    key={bookmark.id}
                    bookmark={bookmark}
                    tags={tags}
                    onEdit={handleEdit}
                    onTogglePin={handleTogglePin}
                    onTagDrop={(tagId) => handleTagDrop(bookmark.id, tagId)}
                    onWorkstationDrop={(workstationId) => handleWorkstationDrop(bookmark.id, workstationId)}
                    onDoubleClick={handleBookmarkDoubleClick}
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
          )}

          {/* 空状态 */}
          {pinnedBookmarks.length === 0 && normalBookmarks.length === 0 && (
            <div className="bookmarks-empty">
              <p>暂无书签</p>
            </div>
          )}
        </div>

        {isTagSidebarOpen && (
          <TagSidebar tags={tags} onCreateTag={handleCreateTag} />
        )}
        {isWorkstationSidebarOpen && (
          <WorkstationSidebar 
            workstations={workstations} 
            onCreateWorkstation={handleCreateWorkstation}
            onBookmarkDrop={handleWorkstationDrop}
          />
        )}
      </div>

      {editingBookmark && (
        <BookmarkEditModal
          mode="edit"
          bookmark={editingBookmark}
          onClose={handleCloseEditModal}
          onSave={handleSaveEdit}
          onDelete={handleDeleteBookmark}
        />
      )}

      {isCreateModalOpen && (
        <BookmarkEditModal
          mode="create"
          onClose={() => setIsCreateModalOpen(false)}
          onCreate={handleCreateBookmark}
        />
      )}

      <ChromeSyncModal
        isOpen={isChromeSyncModalOpen}
        onClose={() => setIsChromeSyncModalOpen(false)}
        onSyncSuccess={async () => {
          await refresh();
          if (onRefresh) {
            onRefresh();
          }
        }}
      />
    </div>
  );
};


