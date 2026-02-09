import { useEffect, useMemo, useState, useRef, type CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';
import { PixelButton } from '../../../components/PixelButton';
import { PixelCard } from '../../../components/PixelCard';
import { SearchInput } from '../../../components/SearchInput';
import { SortDropdown, type SortField } from '../../../components/SortDropdown';
import { TagCard } from '../../../components/TagCard';
import { TagEditModal } from '../../../components/TagEditModal';
import { TagGraphOverlay } from '../../../components/TagGraphOverlay';
import { AddBookmarkToTagModal } from '../../../components/AddBookmarkToTagModal';
import { IconButton } from '../../../components/IconButton';
import { BookmarkSidebar } from '../../../components/BookmarkSidebar';
import {
  createTag,
  deleteTag,
  getAllTags,
  getAllBookmarks,
  updateTag,
  updateBookmark
} from '../../../lib/bookmarkService';
import { openUrlsWithMode } from '../../../lib/chrome';
import { getBrowserTagWorkstationOpenMode, getTagsMap, saveTagsMap } from '../../../lib/storage';
import type { Tag, BookmarkItem } from '../../../lib/types';
import { Virtuoso, type VirtuosoHandle } from 'react-virtuoso';
import './tagsPage.css';

/** 内容区侧边栏类型（与左侧全局导航无关）；新增侧栏时在此扩展 */
type TagsSidebarKind = 'tag-bookmark';

export const TagsPage = () => {
  const { t } = useTranslation();
  const [tags, setTags] = useState<Tag[]>([]);
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortField>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [openSidebar, setOpenSidebar] = useState<TagsSidebarKind | null>(null);
  const [isAddBookmarkModalOpen, setIsAddBookmarkModalOpen] = useState(false);
  const [isGraphOpen, setIsGraphOpen] = useState(false);
  const [selectedTagId, setSelectedTagId] = useState<string | null>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);

  // Virtual grid (row virtualization) — column count derived solely from fixed card width
  const GRID_GAP_PX = 12;
  const TAG_CARD_WIDTH_PX = 200;
  const tagsContentRef = useRef<HTMLDivElement>(null);
  const gridMeasureRef = useRef<HTMLDivElement>(null);
  const virtuosoRef = useRef<VirtuosoHandle>(null);
  const [scrollParent, setScrollParent] = useState<HTMLElement | null>(null);
  const [columnCount, setColumnCount] = useState<number>(1);
  const [showScrollToTop, setShowScrollToTop] = useState(false);

  const refresh = async () => {
    const [tagsList, bookmarksList] = await Promise.all([
      getAllTags(),
      getAllBookmarks()
    ]);
    setTags(tagsList);
    setBookmarks(bookmarksList);
  };

  useEffect(() => {
    void refresh();
  }, []);

  useEffect(() => {
    setScrollParent(tagsContentRef.current);
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

  /* Esc 关闭当前打开的侧边栏（不写死优先级，仅关闭当前） */
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || !openSidebar) return;
      setOpenSidebar(null);
      setSelectedTagId(null);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [openSidebar]);

  useEffect(() => {
    if (!gridMeasureRef.current) return;

    const el = gridMeasureRef.current;
    const updateColumns = () => {
      const width = el.clientWidth;
      if (!width) return;
      const cols = Math.max(1, Math.floor((width + GRID_GAP_PX) / (TAG_CARD_WIDTH_PX + GRID_GAP_PX)));
      setColumnCount(cols);
    };

    updateColumns();
    const ro = new ResizeObserver(() => updateColumns());
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const filtered = useMemo(() => {
    let list = tags;
    // 搜索过滤
    if (search) {
      list = list.filter((tag) => tag.name.toLowerCase().includes(search.toLowerCase()));
    }
    // 排序（不在这里按 pinned 排序，因为我们会分离它们）
    const sortedList = [...list];
    sortedList.sort((a, b) => {
      // 根据选择的排序字段和排序方向进行排序
      let diff = 0;
      if (sortBy === 'createdAt') {
        diff = sortOrder === 'desc' ? b.createdAt - a.createdAt : a.createdAt - b.createdAt;
      } else if (sortBy === 'usageCount') {
        diff = sortOrder === 'desc' ? b.usageCount - a.usageCount : a.usageCount - b.usageCount;
      } else if (sortBy === 'clickCount') {
        diff = sortOrder === 'desc' ? b.clickCount - a.clickCount : a.clickCount - b.clickCount;
      }
      return diff;
    });
    return sortedList;
  }, [tags, search, sortBy, sortOrder]);

  // 分离置顶和普通标签
  const { pinnedTags, normalTags } = useMemo(() => {
    const pinned = filtered.filter((tag) => tag.pinned);
    const normal = filtered.filter((tag) => !tag.pinned);
    return { pinnedTags: pinned, normalTags: normal };
  }, [filtered]);

  type VirtualItem =
    | { kind: 'divider'; title: string }
    | { kind: 'row'; tags: Tag[] };

  const virtualItems: VirtualItem[] = useMemo(() => {
    const chunk = (list: Tag[], size: number) => {
      const rows: Tag[][] = [];
      for (let i = 0; i < list.length; i += size) {
        rows.push(list.slice(i, i + size));
      }
      return rows;
    };

    const items: VirtualItem[] = [];

    if (pinnedTags.length > 0) {
      items.push({ kind: 'divider', title: t('tag.pinnedTags') });
      for (const row of chunk(pinnedTags, columnCount)) {
        items.push({ kind: 'row', tags: row });
      }
    }

    if (normalTags.length > 0) {
      if (pinnedTags.length > 0) {
        items.push({ kind: 'divider', title: t('tag.normalTags') });
      }
      for (const row of chunk(normalTags, columnCount)) {
        items.push({ kind: 'row', tags: row });
      }
    }

    return items;
  }, [pinnedTags, normalTags, columnCount, t]);

  const handleCreateTag = async (data: { name: string; color: string; description?: string; pinned: boolean }) => {
    const newTag = await createTag({ 
      name: data.name, 
      color: data.color, 
      description: data.description 
    });
    // 如果设置了置顶，需要更新标签
    if (data.pinned) {
      await updateTag(newTag.id, { pinned: true });
    }
    // 不立即关闭弹窗，让成功提示先显示，弹窗会在1.5秒后自动关闭
    // 延迟刷新数据，让成功提示先显示
    setTimeout(async () => {
      await refresh();
    }, 1600);
  };

  const handleCloseCreateModal = () => {
    setIsCreateModalOpen(false);
  };

  const handleDeleteTag = async (tagId: string) => {
    await deleteTag(tagId);
    await refresh();
  };

  const handleTogglePin = async (tagId: string) => {
    const tag = tags.find((t) => t.id === tagId);
    if (tag) {
      await updateTag(tagId, { pinned: !tag.pinned });
      await refresh();
    }
  };

  const handleTagClick = (tagId: string) => {
    // 单点击打开侧边栏
    if (openSidebar !== 'tag-bookmark' || selectedTagId !== tagId) {
      setSelectedTagId(tagId);
      setOpenSidebar('tag-bookmark');
    } else {
      void refresh();
    }
  };

  const handleDeleteTagFromSidebar = (tag: Tag) => {
    const confirmed = window.confirm(t('tag.deleteConfirm'));
    if (!confirmed) return;
    void handleDeleteTag(tag.id).then(() => {
      if (selectedTagId === tag.id) {
        handleCloseSidebar();
      }
    });
  };

  const handleTagDoubleClick = async (tagId: string) => {
    // 双击打开标签下的所有书签
    const tagBookmarks = bookmarks.filter((bookmark) => bookmark.tags.includes(tagId));
    if (tagBookmarks.length === 0) return;

    // 获取所有书签的URL
    const urls = tagBookmarks.map((bookmark) => bookmark.url).filter(Boolean);
    if (urls.length > 0) {
      const mode = await getBrowserTagWorkstationOpenMode();
      await openUrlsWithMode(urls, mode);
      
      // 更新标签的点击计数
      const tag = tags.find((t) => t.id === tagId);
      if (tag) {
        const tagsMap = await getTagsMap();
        const targetTag = tagsMap[tagId];
        if (targetTag) {
          targetTag.clickCount += 1;
          targetTag.updatedAt = Date.now();
          await saveTagsMap(tagsMap);
          await refresh();
        }
      }
    }
  };

  const handleCloseSidebar = () => {
    setOpenSidebar(null);
    setSelectedTagId(null);
  };

  const handleRemoveTag = async (bookmarkId: string, tagId: string) => {
    const bookmark = bookmarks.find((b) => b.id === bookmarkId);
    if (!bookmark) return;
    
    // 移除标签关系
    const updatedTags = bookmark.tags.filter((id) => id !== tagId);
    await updateBookmark(bookmarkId, {
      title: bookmark.title,
      url: bookmark.url,
      tags: updatedTags,
      pinned: bookmark.pinned
    });
    
    // 刷新数据
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
    
    // 只处理来自侧边栏的拖拽
    if (source !== 'bookmarkSidebar' || !bookmarkId || !selectedTagId) return;
    
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
    
    // 如果拖拽到侧边栏外，移除标签关系
    if (!isInsideSidebar) {
      await handleRemoveTag(bookmarkId, selectedTagId);
    }
  };

  const handleScrollToTop = () => {
    virtuosoRef.current?.scrollToIndex({ index: 0, align: 'start', behavior: 'smooth' });
    scrollParent?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div 
      className="tags-page"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <div className="tags-toolbar-merged">
        <div className="tags-filters">
          <SearchInput value={search} placeholder={t('tag.searchPlaceholder')} onChange={setSearch} />
          <SortDropdown
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSortByChange={setSortBy}
            onSortOrderToggle={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
            options={[
              { value: 'createdAt', label: t('sort.byCreatedAt') },
              { value: 'usageCount', label: t('tag.usageCount') },
              { value: 'clickCount', label: t('sort.byClickCount') }
            ]}
          />
        </div>
        <div className="tags-actions">
          <PixelButton
            variant="secondary"
            onClick={() => setIsGraphOpen(true)}
            aria-label={t('tag.graph')}
          >
            {t('tag.graph')}
          </PixelButton>
          <PixelButton onClick={() => setIsCreateModalOpen(true)}>
            {t('tag.new')}
          </PixelButton>
        </div>
      </div>

      <div className="tags-content-wrapper">
        <div className="tags-content" ref={tagsContentRef}>
          <div className="tags-virtual-container" ref={gridMeasureRef}>
            {pinnedTags.length === 0 && normalTags.length === 0 ? (
              <div className="tags-empty">
                <p>{t('tag.noTags')}</p>
              </div>
            ) : (
              <Virtuoso
                ref={virtuosoRef}
                customScrollParent={scrollParent ?? undefined}
                data={virtualItems}
                itemContent={(_, item) => {
                  if (item.kind === 'divider') {
                    return <h2 className="tags-section-title tags-virtual-divider">{item.title}</h2>;
                  }

                  return (
                    <div
                      className="tag-row"
                      style={
                        {
                          ['--tag-cols' as unknown as string]: String(columnCount),
                          ['--tag-card-w' as unknown as string]: `${TAG_CARD_WIDTH_PX}px`,
                        } as CSSProperties
                      }
                    >
                      {item.tags.map((tag) => (
                        <TagCard
                          key={tag.id}
                          tag={tag}
                          onTogglePin={handleTogglePin}
                          onClick={handleTagClick}
                          onDoubleClick={handleTagDoubleClick}
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
            className="tags-scroll-to-top"
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

        {openSidebar === 'tag-bookmark' && selectedTagId && (
          <div ref={sidebarRef} className="tags-sidebar-wrapper">
            <BookmarkSidebar
              tagId={selectedTagId}
              tag={tags.find((t) => t.id === selectedTagId) ?? null}
              bookmarks={bookmarks}
              tags={tags}
              onClose={handleCloseSidebar}
              onRemoveTag={handleRemoveTag}
              onTagUpdated={() => void refresh()}
              onAddBookmarkClick={() => setIsAddBookmarkModalOpen(true)}
              onDeleteClick={handleDeleteTagFromSidebar}
            />
          </div>
        )}
      </div>

      {isCreateModalOpen && (
        <TagEditModal
          mode="create"
          onClose={handleCloseCreateModal}
          onCreate={handleCreateTag}
        />
      )}

      {isAddBookmarkModalOpen && selectedTagId && (
        <AddBookmarkToTagModal
          isOpen={isAddBookmarkModalOpen}
          onClose={async () => {
            await refresh();
            setIsAddBookmarkModalOpen(false);
          }}
          tagId={selectedTagId}
          tag={tags.find((t) => t.id === selectedTagId)!}
          bookmarks={bookmarks}
          tags={tags}
        />
      )}

      <TagGraphOverlay isOpen={isGraphOpen} onClose={() => setIsGraphOpen(false)} />
    </div>
  );
};


