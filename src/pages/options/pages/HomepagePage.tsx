import { useEffect, useState, useRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { getAllBookmarks, getAllTags, createBookmark, createTag, getPinnedBookmarks, updateTag, updateBookmark, deleteBookmark } from '../../../lib/bookmarkService';
import { getAllWorkstations, createWorkstation, updateWorkstation, openWorkstation } from '../../../lib/workstationService';
import { openUrlsWithMode, openUrlWithMode } from '../../../lib/chrome';
import { getBrowserTagWorkstationOpenMode, getBrowserDefaultOpenMode } from '../../../lib/storage';
import type { Tag, Workstation, BookmarkItem } from '../../../lib/types';
import { IconButton } from '../../../components/IconButton';
import { HorizontalScrollList } from '../../../components/HorizontalScrollList';
import { HomepagePinnedWorkstationCard } from '../../../components/HomepagePinnedWorkstationCard';
import { HomepagePinnedTagCard } from '../../../components/HomepagePinnedTagCard';
import { HomepagePinnedBookmarkCard } from '../../../components/HomepagePinnedBookmarkCard';
import { WorkstationBookmarkSidebar } from '../../../components/WorkstationBookmarkSidebar';
import { BookmarkSidebar } from '../../../components/BookmarkSidebar';
import { BookmarkEditSidebar } from '../../../components/BookmarkEditSidebar';
import { FloatingActionButton } from '../../../components/FloatingActionButton';
import { AddBookmarkToTagModal } from '../../../components/AddBookmarkToTagModal';
import { AddBookmarkToWorkstationModal } from '../../../components/AddBookmarkToWorkstationModal';
import { BookmarkEditModal } from '../../../components/BookmarkEditModal';
import { TagEditModal } from '../../../components/TagEditModal';
import { WorkstationEditModal } from '../../../components/WorkstationEditModal';
import './homepagePage.css';

interface HomepagePageProps {
  onNavigate: (tab: 'bookmarks' | 'tags' | 'workstations') => void;
}

/** 内容区侧边栏类型（与左侧全局导航无关）；新增侧栏时在此扩展 */
type HomepageSidebarKind = 'workstation' | 'tag' | 'bookmark-edit';

export const HomepagePage = ({ onNavigate }: HomepagePageProps) => {
  const { t } = useTranslation();
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [workstations, setWorkstations] = useState<Workstation[]>([]);
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const pageRef = useRef<HTMLDivElement>(null);
  const homepageContentRef = useRef<HTMLDivElement>(null);
  const [showScrollToTop, setShowScrollToTop] = useState(false);
  const [isBookmarkModalOpen, setIsBookmarkModalOpen] = useState(false);
  const [isTagModalOpen, setIsTagModalOpen] = useState(false);
  const [isWorkstationModalOpen, setIsWorkstationModalOpen] = useState(false);
  const [isAddBookmarkToTagModalOpen, setIsAddBookmarkToTagModalOpen] = useState(false);
  const [isAddBookmarkToWorkstationModalOpen, setIsAddBookmarkToWorkstationModalOpen] = useState(false);

  // 内容区侧边栏：同一时间只允许一个打开，不写死优先级
  const [openSidebar, setOpenSidebar] = useState<HomepageSidebarKind | null>(null);
  const [selectedWorkstationId, setSelectedWorkstationId] = useState<string | null>(null);
  const [selectedTagId, setSelectedTagId] = useState<string | null>(null);
  const [editingBookmark, setEditingBookmark] = useState<BookmarkItem | null>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [workstationsData, bookmarksData, tagsData] = await Promise.all([
        getAllWorkstations(),
        getAllBookmarks(),
        getAllTags(),
      ]);
      setWorkstations(workstationsData);
      setBookmarks(bookmarksData);
      setAllTags(tagsData);
    } catch (error) {
      console.error('Failed to load homepage data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  // 获取置顶数据（按clickCount倒序）
  const pinnedWorkstations = useMemo(() => {
    return workstations
      .filter((w) => w.pinned)
      .sort((a, b) => b.clickCount - a.clickCount);
  }, [workstations]);

  const pinnedTags = useMemo(() => {
    return allTags
      .filter((t) => t.pinned)
      .sort((a, b) => b.clickCount - a.clickCount);
  }, [allTags]);

  const pinnedBookmarks = useMemo(() => {
    return bookmarks
      .filter((b) => b.pinned)
      .sort((a, b) => b.clickCount - a.clickCount);
  }, [bookmarks]);

  /* 内容区滚动：超过阈值显示回到顶部（与 bookmarks/tags 一致） */
  useEffect(() => {
    const scrollParent = homepageContentRef.current;
    if (!scrollParent) return;

    const onScroll = () => {
      setShowScrollToTop(scrollParent.scrollTop > 400);
    };

    onScroll();
    scrollParent.addEventListener('scroll', onScroll, { passive: true });
    return () => scrollParent.removeEventListener('scroll', onScroll);
  }, []);

  /* Esc 关闭当前打开的侧边栏（不写死优先级，仅关闭当前） */
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || !openSidebar) return;
      setOpenSidebar(null);
      if (openSidebar === 'workstation') setSelectedWorkstationId(null);
      else if (openSidebar === 'tag') setSelectedTagId(null);
      else if (openSidebar === 'bookmark-edit') setEditingBookmark(null);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [openSidebar]);

  const handleScrollToTop = () => {
    homepageContentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 工作区交互
  const handleWorkstationClick = (workstationId: string) => {
    if (openSidebar !== 'workstation' || selectedWorkstationId !== workstationId) {
      setSelectedWorkstationId(workstationId);
      setOpenSidebar('workstation');
    } else {
      void loadData();
    }
  };

  const handleWorkstationDoubleClick = async (workstationId: string) => {
    await openWorkstation(workstationId);
    await loadData();
  };

  const handleToggleWorkstationPin = async (workstationId: string) => {
    const workstation = workstations.find((w) => w.id === workstationId);
    if (workstation) {
      await updateWorkstation(workstationId, { pinned: !workstation.pinned });
      await loadData();
    }
  };

  const handleCloseWorkstationSidebar = () => {
    setOpenSidebar(null);
    setSelectedWorkstationId(null);
  };

  // Tag交互
  const handleTagClick = (tagId: string) => {
    if (openSidebar !== 'tag' || selectedTagId !== tagId) {
      setSelectedTagId(tagId);
      setOpenSidebar('tag');
    } else {
      void loadData();
    }
  };

  const handleTagDoubleClick = async (tagId: string) => {
    const tagBookmarks = bookmarks.filter((b) => b.tags.includes(tagId));
    const urls = tagBookmarks.map((b) => b.url).filter(Boolean);
    if (urls.length > 0) {
      const mode = await getBrowserTagWorkstationOpenMode();
      await openUrlsWithMode(urls, mode);
    }
  };

  const handleToggleTagPin = async (tagId: string) => {
    const tag = allTags.find((t) => t.id === tagId);
    if (tag) {
      await updateTag(tagId, { pinned: !tag.pinned });
      await loadData();
    }
  };

  const handleCloseTagSidebar = () => {
    setOpenSidebar(null);
    setSelectedTagId(null);
  };

  // Bookmark交互
  const handleBookmarkClick = (bookmark: BookmarkItem) => {
    setEditingBookmark(bookmark);
    setOpenSidebar('bookmark-edit');
  };

  const handleBookmarkDoubleClick = async (bookmark: BookmarkItem) => {
    const mode = await getBrowserDefaultOpenMode();
    await openUrlWithMode(bookmark.url, mode);
  };

  const handleToggleBookmarkPin = async (bookmarkId: string) => {
    const bookmark = bookmarks.find((b) => b.id === bookmarkId);
    if (bookmark) {
      await updateBookmark(bookmarkId, { pinned: !bookmark.pinned });
      await loadData();
    }
  };

  const handleCloseBookmarkEditSidebar = () => {
    setOpenSidebar(null);
    setEditingBookmark(null);
  };

  const handleDeleteBookmark = async (bookmarkId: string) => {
    await deleteBookmark(bookmarkId);
    await loadData();
    setOpenSidebar(null);
    setEditingBookmark(null);
  };

  // 更多按钮
  const handleMoreWorkstations = () => {
    onNavigate('workstations');
  };

  const handleMoreTags = () => {
    onNavigate('tags');
  };

  const handleMoreBookmarks = () => {
    onNavigate('bookmarks');
  };

  const handleCreateBookmark = async (data: { title: string; url: string; tags: string[]; pinned: boolean }) => {
    await createBookmark(data);
    // 延迟刷新数据，让成功提示先显示
    setTimeout(() => {
      void loadData();
    }, 1600);
  };

  const handleCreateTag = async (data: { name: string; color: string; description?: string; pinned: boolean }) => {
    await createTag(data);
    // 延迟刷新数据，让成功提示先显示
    setTimeout(() => {
      void loadData();
    }, 1600);
  };

  const handleCreateWorkstation = async (data: { name: string; description?: string; pinned: boolean }) => {
    await createWorkstation({ name: data.name, description: data.description, pinned: data.pinned });
    // 延迟刷新数据，让成功提示先显示
    setTimeout(() => {
      void loadData();
    }, 1600);
  };

  if (isLoading) {
    return <div className="homepage-page" aria-busy="true" />;
  }

  const selectedWorkstation = workstations.find((w) => w.id === selectedWorkstationId);
  const selectedTag = allTags.find((t) => t.id === selectedTagId);

  return (
    <div className="homepage-page" ref={pageRef}>
      <div className="homepage-page__header-section">
        <div className="homepage-page__header">
          <h1 className="homepage-page__title">{t('app.title')}</h1>
          <p className="homepage-page__slogan">{t('homepage.slogan')}</p>
        </div>
      </div>

      <div className="homepage-content-wrapper">
        <div className="homepage-page__content" ref={homepageContentRef}>
          {pinnedWorkstations.length > 0 && (
            <HorizontalScrollList
              title={t('homepage.pinnedWorkstations')}
              onMoreClick={handleMoreWorkstations}
            >
              {pinnedWorkstations.map((workstation) => (
                <HomepagePinnedWorkstationCard
                  key={workstation.id}
                  workstation={workstation}
                  bookmarks={bookmarks}
                  onClick={handleWorkstationClick}
                  onDoubleClick={handleWorkstationDoubleClick}
                  onTogglePin={handleToggleWorkstationPin}
                />
              ))}
            </HorizontalScrollList>
          )}

          {pinnedTags.length > 0 && (
            <HorizontalScrollList
              title={t('homepage.pinnedTags')}
              onMoreClick={handleMoreTags}
            >
              {pinnedTags.map((tag) => (
                <HomepagePinnedTagCard
                  key={tag.id}
                  tag={tag}
                  onClick={handleTagClick}
                  onDoubleClick={handleTagDoubleClick}
                  onTogglePin={handleToggleTagPin}
                />
              ))}
            </HorizontalScrollList>
          )}

          {pinnedBookmarks.length > 0 && (
            <HorizontalScrollList
              title={t('homepage.pinnedBookmarks')}
              onMoreClick={handleMoreBookmarks}
            >
              {pinnedBookmarks.map((bookmark) => (
                <HomepagePinnedBookmarkCard
                  key={bookmark.id}
                  bookmark={bookmark}
                  onClick={handleBookmarkClick}
                  onDoubleClick={handleBookmarkDoubleClick}
                  onTogglePin={handleToggleBookmarkPin}
                />
              ))}
            </HorizontalScrollList>
          )}
        </div>

        {openSidebar === 'workstation' && selectedWorkstation && (
          <div ref={sidebarRef} className="homepage-sidebar-wrapper">
            <WorkstationBookmarkSidebar
              workstationId={selectedWorkstationId}
              workstation={selectedWorkstation}
              bookmarks={bookmarks}
              tags={allTags}
              onClose={handleCloseWorkstationSidebar}
              onRemoveBookmark={async () => {}}
              onRefresh={() => loadData()}
              onAddBookmarkClick={() => setIsAddBookmarkToWorkstationModalOpen(true)}
              onWorkstationUpdated={() => void loadData()}
              onDeleteClick={() => {}}
            />
          </div>
        )}

        {openSidebar === 'tag' && selectedTag && (
          <div ref={sidebarRef} className="homepage-sidebar-wrapper">
            <BookmarkSidebar
              tagId={selectedTagId}
              tag={selectedTag}
              bookmarks={bookmarks}
              tags={allTags}
              onClose={handleCloseTagSidebar}
              onRefresh={() => loadData()}
              onTagUpdated={() => void loadData()}
              onAddBookmarkClick={() => setIsAddBookmarkToTagModalOpen(true)}
            />
          </div>
        )}

        {openSidebar === 'bookmark-edit' && editingBookmark && (
          <div ref={sidebarRef} className="homepage-sidebar-wrapper">
            <BookmarkEditSidebar
              bookmark={editingBookmark}
              workstations={workstations}
              tags={allTags}
              onClose={handleCloseBookmarkEditSidebar}
              onBookmarkUpdated={() => void loadData()}
              onDelete={handleDeleteBookmark}
            />
          </div>
        )}
      </div>

      {showScrollToTop && (
        <IconButton
          variant="secondary"
          className="homepage-scroll-to-top"
          aria-label={t('common.backToTop')}
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

      <FloatingActionButton
        onBookmarkClick={() => setIsBookmarkModalOpen(true)}
        onTagClick={() => setIsTagModalOpen(true)}
        onWorkstationClick={() => setIsWorkstationModalOpen(true)}
      />

      {isBookmarkModalOpen && (
        <BookmarkEditModal
          mode="create"
          onClose={() => setIsBookmarkModalOpen(false)}
          onCreate={handleCreateBookmark}
        />
      )}

      {isTagModalOpen && (
        <TagEditModal
          mode="create"
          onClose={() => setIsTagModalOpen(false)}
          onCreate={handleCreateTag}
        />
      )}

      {isWorkstationModalOpen && (
        <WorkstationEditModal
          mode="create"
          onClose={() => setIsWorkstationModalOpen(false)}
          onCreate={handleCreateWorkstation}
        />
      )}

      {isAddBookmarkToTagModalOpen && selectedTagId && selectedTag && (
        <AddBookmarkToTagModal
          isOpen={isAddBookmarkToTagModalOpen}
          onClose={async () => {
            await loadData();
            setIsAddBookmarkToTagModalOpen(false);
          }}
          tagId={selectedTagId}
          tag={selectedTag}
          bookmarks={bookmarks}
          tags={allTags}
        />
      )}

      {isAddBookmarkToWorkstationModalOpen && selectedWorkstationId && selectedWorkstation && (
        <AddBookmarkToWorkstationModal
          isOpen={isAddBookmarkToWorkstationModalOpen}
          onClose={async () => {
            await loadData();
            setIsAddBookmarkToWorkstationModalOpen(false);
          }}
          workstationId={selectedWorkstationId}
          workstation={selectedWorkstation}
          bookmarks={bookmarks}
          tags={allTags}
        />
      )}
    </div>
  );
};
