import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';
import { PixelButton } from '../../../components/PixelButton';
import { SearchInput } from '../../../components/SearchInput';
import { TagFilterDropdown } from '../../../components/TagFilterDropdown';
import { SortDropdown } from '../../../components/SortDropdown';
import { BookmarkCard } from '../../../components/BookmarkCard';
import { BookmarkEditModal } from '../../../components/BookmarkEditModal';
import { Tooltip } from '../../../components/Tooltip';
import { TagSidebar } from '../../../components/TagSidebar';
import { WorkstationSidebar } from '../../../components/WorkstationSidebar';
import { IconButton } from '../../../components/IconButton';
import { deleteBookmark, getAllBookmarks, getAllTags, updateBookmark, createBookmark, createTag, incrementBookmarkClick } from '../../../lib/bookmarkService';
import { getAllWorkstations, createWorkstation, addBookmarkToWorkstation } from '../../../lib/workstationService';
import { openUrlWithMode } from '../../../lib/chrome';
import type { BookmarkItem, Tag, Workstation } from '../../../lib/types';
import { Virtuoso, type VirtuosoHandle } from 'react-virtuoso';
import './bookmarksPage.css';
import { getBrowserDefaultOpenMode } from '../../../lib/storage';
import { ChromeSyncModal } from '../../../components/ChromeSyncModal';

interface BookmarksPageProps {
  onRefresh?: () => void;
}

export const BookmarksPage = ({ onRefresh }: BookmarksPageProps) => {
  const { t } = useTranslation();
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
  const [isTagSidebarOpen, setIsTagSidebarOpen] = useState(false);
  const [isWorkstationSidebarOpen, setIsWorkstationSidebarOpen] = useState(false);

  // Virtual grid (row virtualization)
  const GRID_GAP_PX = 12;
  const CARD_MIN_WIDTH_PX = 260;
  const CARD_TARGET_MAX_WIDTH_PX = 320;
  const CARD_DISABLE_MAX_WIDTH_AT_PX = 1600;
  const MAX_COLUMNS = 5;
  const bookmarksContentRef = useRef<HTMLDivElement>(null);
  const gridMeasureRef = useRef<HTMLDivElement>(null);
  const virtuosoRef = useRef<VirtuosoHandle>(null);
  const [scrollParent, setScrollParent] = useState<HTMLElement | null>(null);
  const [columnCount, setColumnCount] = useState<number>(3);
  const [cardMaxWidth, setCardMaxWidth] = useState<string>(`${CARD_TARGET_MAX_WIDTH_PX}px`);
  const [cardJustifySelf, setCardJustifySelf] = useState<'center' | 'stretch'>('center');
  const [showScrollToTop, setShowScrollToTop] = useState(false);

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

  useEffect(() => {
    setScrollParent(bookmarksContentRef.current);
  }, []);

  useEffect(() => {
    if (!scrollParent) return;

    const onScroll = () => {
      setShowScrollToTop(scrollParent.scrollTop > 400);
    };

    onScroll();
    scrollParent.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      scrollParent.removeEventListener('scroll', onScroll);
    };
  }, [scrollParent]);

  useEffect(() => {
    if (!gridMeasureRef.current) return;

    const el = gridMeasureRef.current;
    const updateColumns = () => {
      const width = el.clientWidth;
      if (!width) return;

      // Column ranges by container width:
      // - <720: 1
      // - 720..959: 2
      // - 960..1279: 3-4
      // - >=1280: 4-5
      const range =
        width >= 1280 ? { min: 4, max: 5 } :
        width >= 960 ? { min: 3, max: 4 } :
        width >= 720 ? { min: 2, max: 2 } :
        { min: 1, max: 1 };

      const perCardWidth = (cols: number) => (width - GRID_GAP_PX * (cols - 1)) / cols;

      // Choose the largest cols within range that still respects minimum width.
      let cols = range.min;
      for (let c = range.max; c >= range.min; c--) {
        if (perCardWidth(c) >= CARD_MIN_WIDTH_PX) {
          cols = c;
          break;
        }
      }

      const disableMaxWidth = width >= CARD_DISABLE_MAX_WIDTH_AT_PX;
      if (!disableMaxWidth) {
        // If cards are too wide, prefer more columns (within range) to keep line-length readable.
        while (
          cols < range.max &&
          perCardWidth(cols) > CARD_TARGET_MAX_WIDTH_PX &&
          perCardWidth(cols + 1) >= CARD_MIN_WIDTH_PX
        ) {
          cols += 1;
        }
      }

      const computedMax = disableMaxWidth
        ? 'none'
        : `${Math.floor(Math.min(CARD_TARGET_MAX_WIDTH_PX, perCardWidth(cols)))}px`;
      setColumnCount(cols);
      setCardMaxWidth(computedMax);
      setCardJustifySelf(disableMaxWidth ? 'stretch' : 'center');
    };

    updateColumns();
    const ro = new ResizeObserver(() => updateColumns());
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // 从URL参数读取tag筛选条件和query搜索关键词（在组件挂载时和URL变化时）
  useEffect(() => {
    const checkUrlParams = () => {
      const params = new URLSearchParams(window.location.search);
      const url = new URL(window.location.href);
      let hasChanges = false;

      // 读取tag参数
      const tagParam = params.get('tag');
      if (tagParam) {
        setSelectedTags([tagParam]);
        url.searchParams.delete('tag');
        hasChanges = true;
      }

      // 读取query参数
      const queryParam = params.get('query');
      if (queryParam) {
        setQuery(queryParam);
        url.searchParams.delete('query');
        hasChanges = true;
      }

      // 清除URL参数，避免刷新时重复应用
      if (hasChanges) {
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

  type VirtualItem =
    | { kind: 'divider'; title: string }
    | { kind: 'row'; bookmarks: BookmarkItem[] };

  const virtualItems: VirtualItem[] = useMemo(() => {
    const chunk = (list: BookmarkItem[], size: number) => {
      const rows: BookmarkItem[][] = [];
      for (let i = 0; i < list.length; i += size) {
        rows.push(list.slice(i, i + size));
      }
      return rows;
    };

    const items: VirtualItem[] = [];

    if (pinnedBookmarks.length > 0) {
      items.push({ kind: 'divider', title: t('bookmark.pinnedBookmarks') });
      for (const row of chunk(pinnedBookmarks, columnCount)) {
        items.push({ kind: 'row', bookmarks: row });
      }
    }

    if (normalBookmarks.length > 0) {
      // 与旧 UI 一致：只有存在 pinned 时才显示“normal”标题
      if (pinnedBookmarks.length > 0) {
        items.push({ kind: 'divider', title: t('bookmark.normalBookmarks') });
      }
      for (const row of chunk(normalBookmarks, columnCount)) {
        items.push({ kind: 'row', bookmarks: row });
      }
    }

    return items;
  }, [pinnedBookmarks, normalBookmarks, columnCount, t]);

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
    await createWorkstation({ name, description: undefined, pinned: false });
    await refresh();
  };

  const handleWorkstationDrop = async (bookmarkId: string, workstationId: string) => {
    await addBookmarkToWorkstation(workstationId, bookmarkId);
    await refresh();
  };


  const handleOpenSyncModal = () => {
    setIsChromeSyncModalOpen(true);
  };

  const handleScrollToTop = () => {
    // Prefer Virtuoso API; fall back to raw scroll.
    virtuosoRef.current?.scrollToIndex({ index: 0, align: 'start', behavior: 'smooth' });
    scrollParent?.scrollTo({ top: 0, behavior: 'smooth' });
  };


  return (
    <div className="bookmarks-page">
      <div className="bookmarks-toolbar-merged">
        <div className="bookmarks-toolbar-left">
          <div className="bookmarks-filters">
            <SearchInput value={query} placeholder={t('bookmark.searchPlaceholder')} onChange={setQuery} />
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
                { value: 'createdAt', label: t('sort.byCreatedAt') },
                { value: 'clickCount', label: t('sort.byClickCount') }
              ]}
            />
          </div>
        </div>
        <div className="bookmarks-actions">
          <PixelButton onClick={() => setIsCreateModalOpen(true)}>
            {t('bookmark.new')}
          </PixelButton>
          <Tooltip content={t('chromeSync.description')}>
            <PixelButton 
              onClick={handleOpenSyncModal}
            >
              {t('chromeSync.syncButton')}
            </PixelButton>
          </Tooltip>
          <Tooltip content={isTagSidebarOpen ? t('tag.hideSidebar') : t('tag.showSidebar')}>
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
              aria-label={isTagSidebarOpen ? t('tag.hideSidebar') : t('tag.showSidebar')}
              onClick={() => setIsTagSidebarOpen(!isTagSidebarOpen)}
              className="bookmarks-sidebar-toggle"
            />
          </Tooltip>
          <Tooltip content={isWorkstationSidebarOpen ? t('workstation.hideSidebar') : t('workstation.showSidebar')}>
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
              aria-label={isWorkstationSidebarOpen ? t('workstation.hideSidebar') : t('workstation.showSidebar')}
              onClick={() => setIsWorkstationSidebarOpen(!isWorkstationSidebarOpen)}
              className="bookmarks-sidebar-toggle"
            />
          </Tooltip>
        </div>
      </div>

      <div className="bookmarks-content-wrapper">
        <div className="bookmarks-content" ref={bookmarksContentRef}>
          <div className="bookmarks-virtual-container" ref={gridMeasureRef}>
            {pinnedBookmarks.length === 0 && normalBookmarks.length === 0 ? (
              <div className="bookmarks-empty">
                <p>{t('bookmark.noBookmarks')}</p>
              </div>
            ) : (
              <Virtuoso
                ref={virtuosoRef}
                customScrollParent={scrollParent ?? undefined}
                data={virtualItems}
                itemContent={(_, item) => {
                  if (item.kind === 'divider') {
                    return <h2 className="bookmarks-section-title bookmarks-virtual-divider">{item.title}</h2>;
                  }

                  return (
                    <div
                      className="bookmark-row"
                      style={
                        {
                          ['--bookmark-cols' as unknown as string]: String(columnCount),
                          ['--bookmark-card-max-w' as unknown as string]: cardMaxWidth,
                          ['--bookmark-card-justify-self' as unknown as string]: cardJustifySelf,
                        } as CSSProperties
                      }
                    >
                      {item.bookmarks.map((bookmark) => (
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
                  );
                }}
              />
            )}
          </div>
        </div>

        {showScrollToTop && (
          <IconButton
            variant="secondary"
            className="bookmarks-scroll-to-top"
            aria-label={t('common.backToTop', 'Back to top')}
            onClick={handleScrollToTop}
            icon={
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M12 5l-7 7m7-7l7 7M12 5v14"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            }
          />
        )}

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


