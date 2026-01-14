import { useEffect, useState, useRef, useCallback } from 'react';
import { getHotTags, getAllBookmarks } from '../../../lib/bookmarkService';
import { getAllWorkstations } from '../../../lib/workstationService';
import { openBookmarksInNewWindow } from '../../../lib/chrome';
import type { Tag, Workstation, BookmarkItem } from '../../../lib/types';
import { SearchInput } from '../../../components/SearchInput';
import { TagPill } from '../../../components/TagPill';
import { HomepageWorkstationCard } from '../../../components/HomepageWorkstationCard';
import { PixelButton } from '../../../components/PixelButton';
import './homepagePage.css';

interface HomepagePageProps {
  onNavigate: (tab: 'bookmarks' | 'tags' | 'workstations') => void;
}

export const HomepagePage = ({ onNavigate }: HomepagePageProps) => {
  const [hotTags, setHotTags] = useState<Tag[]>([]);
  const [workstations, setWorkstations] = useState<Workstation[]>([]);
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [visibleTagCount, setVisibleTagCount] = useState<number>(0);
  const tagsListRef = useRef<HTMLDivElement>(null);
  const tagRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [visibleWorkstationCount, setVisibleWorkstationCount] = useState<number>(4);
  const workstationsListRef = useRef<HTMLDivElement>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [hotTagsData, workstationsData, bookmarksData] = await Promise.all([
        getHotTags(10),
        getAllWorkstations(),
        getAllBookmarks(),
      ]);
      setHotTags(hotTagsData.map((ht) => ht.tag));
      setWorkstations(workstationsData);
      setBookmarks(bookmarksData);
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
    const labelWidth = 80; // "choose tags:" 标签的宽度
    const moreButtonWidth = 60; // more+ 按钮的宽度
    const gap = 12; // tag之间的间距
    let availableWidth = containerWidth - labelWidth - gap;
    let totalWidth = 0;
    let count = 0;

    // 先尝试不显示more按钮
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

    // 如果有隐藏的tag，需要为more按钮预留空间
    if (count < hotTags.length) {
      availableWidth -= moreButtonWidth + gap;
      totalWidth = 0;
      count = 0;

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

  // 计算可见的工作区数量
  const calculateVisibleWorkstations = useCallback(() => {
    if (!workstationsListRef.current || workstations.length === 0) {
      setVisibleWorkstationCount(workstations.length);
      return;
    }

    const container = workstationsListRef.current;
    const containerWidth = container.offsetWidth;
    const cardWidth = 200; // card固定宽度
    const gap = 16; // gap大小
    
    // 计算能放多少个card（向下取整）
    const count = Math.floor((containerWidth + gap) / (cardWidth + gap));
    const visibleCount = Math.max(1, count); // 至少显示1个
    
    setVisibleWorkstationCount(visibleCount);
  }, [workstations.length]);

  // 监听工作区列表容器大小变化
  useEffect(() => {
    if (!workstationsListRef.current || workstations.length === 0) {
      setVisibleWorkstationCount(workstations.length);
      return;
    }

    const resizeObserver = new ResizeObserver(() => {
      calculateVisibleWorkstations();
    });

    resizeObserver.observe(workstationsListRef.current);

    // 初始计算
    calculateVisibleWorkstations();

    return () => {
      resizeObserver.disconnect();
    };
  }, [workstations.length, calculateVisibleWorkstations]);

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
      await openBookmarksInNewWindow(bookmarkUrls);
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
    const { deleteWorkstation } = await import('../../../lib/workstationService');
    await deleteWorkstation(workstationId);
    await loadData();
  };

  if (isLoading) {
    return <div className="homepage-page" aria-busy="true" />;
  }

  return (
    <div className="homepage-page">
      <div className="homepage-page__header-section">
        <div className="homepage-page__header">
          <h1 className="homepage-page__title">Crosstag Bookmarks</h1>
          <p className="homepage-page__slogan">Your best bookmark manager with cross tags</p>
        </div>
      </div>

      <div className="homepage-page__search-tags-container">
        <div className="homepage-page__search">
          <SearchInput
            value={searchQuery}
            placeholder="search bookmark, tags"
            onChange={setSearchQuery}
          />
        </div>

        <div className="homepage-page__tags-section">
          <div className="homepage-page__tags-label">choose tags:</div>
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
            {visibleTagCount < hotTags.length && (
              <button
                type="button"
                className="homepage-page__tags-more-button"
                onClick={handleMoreTags}
              >
                more+
              </button>
            )}
          </div>
        </div>
      </div>

      {workstations.length > 0 && (
        <div className="homepage-page__workstations-section">
          {workstations.length > visibleWorkstationCount && (
            <div className="homepage-page__workstations-header">
              <button
                type="button"
                className="homepage-page__workstations-more"
                onClick={handleMoreWorkstations}
              >
                更多
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M6 12L10 8L6 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          )}
          <div className="homepage-page__workstations-list" ref={workstationsListRef}>
            {workstations.slice(0, visibleWorkstationCount).map((workstation) => (
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
  );
};
