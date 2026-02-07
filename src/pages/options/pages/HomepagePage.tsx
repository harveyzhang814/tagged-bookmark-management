import { useEffect, useState, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { getHotTags, getAllBookmarks, getAllTags, createBookmark, createTag } from '../../../lib/bookmarkService';
import { getAllWorkstations, createWorkstation, deleteWorkstation } from '../../../lib/workstationService';
import { openUrlsWithMode } from '../../../lib/chrome';
import { getBrowserTagWorkstationOpenMode } from '../../../lib/storage';
import type { Tag, Workstation, BookmarkItem } from '../../../lib/types';
import { IconButton } from '../../../components/IconButton';
import { TagPill } from '../../../components/TagPill';
import { HomepageWorkstationCard } from '../../../components/HomepageWorkstationCard';
import { PixelButton } from '../../../components/PixelButton';
import { FloatingActionButton } from '../../../components/FloatingActionButton';
import { BookmarkEditModal } from '../../../components/BookmarkEditModal';
import { TagEditModal } from '../../../components/TagEditModal';
import { WorkstationEditModal } from '../../../components/WorkstationEditModal';
import './homepagePage.css';

interface HomepagePageProps {
  onNavigate: (tab: 'bookmarks' | 'tags' | 'workstations') => void;
}

export const HomepagePage = ({ onNavigate }: HomepagePageProps) => {
  const { t } = useTranslation();
  const [hotTags, setHotTags] = useState<Tag[]>([]);
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [workstations, setWorkstations] = useState<Workstation[]>([]);
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const pageRef = useRef<HTMLDivElement>(null);
  const [visibleTagCount, setVisibleTagCount] = useState<number>(0);
  const tagsListRef = useRef<HTMLDivElement>(null);
  const tagRefs = useRef<(HTMLDivElement | null)[]>([]);
  const homepageContentRef = useRef<HTMLDivElement>(null);
  const [showScrollToTop, setShowScrollToTop] = useState(false);
  const workstationsListRef = useRef<HTMLDivElement>(null);
  const [isBookmarkModalOpen, setIsBookmarkModalOpen] = useState(false);
  const [isTagModalOpen, setIsTagModalOpen] = useState(false);
  const [isWorkstationModalOpen, setIsWorkstationModalOpen] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [hotTagsData, workstationsData, bookmarksData, tagsData] = await Promise.all([
        getHotTags(10),
        getAllWorkstations(),
        getAllBookmarks(),
        getAllTags(),
      ]);
      setHotTags(hotTagsData.map((ht) => ht.tag));
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

  // 动态计算可见的tag数量
  const calculateVisibleTags = useCallback(() => {
    if (!tagsListRef.current || hotTags.length === 0) {
      setVisibleTagCount(hotTags.length);
      return;
    }

    const container = tagsListRef.current;
    const containerWidth = container.offsetWidth;
    const labelWidth = 80; // "choose tags" 标签的宽度
    const moreButtonWidth = 60; // more按钮的宽度
    const gap = 12; // tag之间的间距
    // 始终为more按钮预留空间（只要有标签，more按钮就会显示）
    let availableWidth = containerWidth - labelWidth - gap - moreButtonWidth - gap;
    let totalWidth = 0;
    let count = 0;

    for (let i = 0; i < hotTags.length; i++) {
      const tagElement = tagRefs.current[i];
      if (!tagElement) continue;

      const tagWidth = tagElement.offsetWidth || 0;
      const neededWidth = totalWidth + tagWidth + (count > 0 ? gap : 0);

      if (neededWidth <= availableWidth) {
        totalWidth = neededWidth;
        count++;
      } else {
        break;
      }
    }

    setVisibleTagCount(count);
  }, [hotTags]);

  // 监听容器大小变化和tag数量变化
  useEffect(() => {
    if (hotTags.length === 0) {
      setVisibleTagCount(0);
      return;
    }

    // 延迟计算，确保DOM已渲染
    const timer = setTimeout(() => {
      calculateVisibleTags();
    }, 0);

    return () => clearTimeout(timer);
  }, [hotTags, calculateVisibleTags]);

  // 使用ResizeObserver监听容器大小变化
  useEffect(() => {
    if (!tagsListRef.current) return;

    const resizeObserver = new ResizeObserver(() => {
      calculateVisibleTags();
    });

    resizeObserver.observe(tagsListRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, [calculateVisibleTags]);

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

  const handleScrollToTop = () => {
    homepageContentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenAll = async (workstationId: string) => {
    const workstation = workstations.find((w) => w.id === workstationId);
    if (!workstation) return;

    // 获取工作区绑定的书签URL
    const bookmarkUrls: string[] = [];
    for (const bookmarkId of workstation.bookmarks) {
      const bookmark = bookmarks.find((b) => b.id === bookmarkId);
      if (bookmark?.url) {
        bookmarkUrls.push(bookmark.url);
      }
    }

    if (bookmarkUrls.length > 0) {
      const mode = await getBrowserTagWorkstationOpenMode();
      await openUrlsWithMode(bookmarkUrls, mode);
    }
  };

  const handleMoreTags = () => {
    onNavigate('tags');
  };

  const handleTagClick = (tagId: string) => {
    // 跳转到书签列表页，并通过URL参数传递tag筛选条件
    const url = new URL(window.location.href);
    url.searchParams.set('tab', 'bookmarks');
    url.searchParams.set('tag', tagId);
    // 更新URL参数（不刷新页面）
    window.history.replaceState({}, '', url.toString());
    // 切换到书签页
    onNavigate('bookmarks');
  };

  const handleMoreWorkstations = () => {
    onNavigate('workstations');
  };

  const handleDeleteWorkstation = async (workstationId: string) => {
    await deleteWorkstation(workstationId);
    await loadData();
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

  return (
    <div className="homepage-page" ref={pageRef}>
      <div className="homepage-page__header-section">
        <div className="homepage-page__header">
          <h1 className="homepage-page__title">{t('app.title')}</h1>
          <p className="homepage-page__slogan">{t('homepage.slogan')}</p>
        </div>
      </div>

      <div className="homepage-page__tags-container">
        <div className="homepage-page__tags-section">
          <div className="homepage-page__tags-label">{t('homepage.chooseTags')}</div>
          <div className="homepage-page__tags-list" ref={tagsListRef}>
            {hotTags.map((tag, index) => {
              const isVisible = index < visibleTagCount;
              return (
                <div
                  key={tag.id}
                  ref={(el) => {
                    tagRefs.current[index] = el;
                  }}
                  style={{ display: isVisible ? 'block' : 'none' }}
                >
                  <TagPill
                    label={tag.name}
                    color={tag.color}
                    size="default"
                    onClick={() => handleTagClick(tag.id)}
                  />
                </div>
              );
            })}
            {hotTags.length > 0 && (
              <button
                type="button"
                className="homepage-page__tags-more-button"
                onClick={handleMoreTags}
              >
                {t('homepage.viewAll')}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="homepage-page__content" ref={homepageContentRef}>
        {workstations.length > 0 && (
          <div className="homepage-page__workstations-section">
            <div className="homepage-page__workstations-header">
              <button
                type="button"
                className="homepage-page__workstations-more"
                onClick={handleMoreWorkstations}
              >
                {t('homepage.viewAll')}
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M6 12L10 8L6 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
            <div className="homepage-page__workstations-list" ref={workstationsListRef}>
              {workstations.map((workstation) => (
                <HomepageWorkstationCard
                  key={workstation.id}
                  workstation={workstation}
                  bookmarks={bookmarks}
                  onOpenAll={handleOpenAll}
                  onDelete={handleDeleteWorkstation}
                />
              ))}
            </div>
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
    </div>
  );
};
