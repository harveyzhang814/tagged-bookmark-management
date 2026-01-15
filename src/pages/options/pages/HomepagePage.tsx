import { useEffect, useState, useRef, useCallback, useMemo, type ReactNode, type KeyboardEvent } from 'react';
import { getHotTags, getAllBookmarks, getAllTags, incrementBookmarkClick } from '../../../lib/bookmarkService';
import { getAllWorkstations } from '../../../lib/workstationService';
import { openUrlWithMode, openUrlsWithMode } from '../../../lib/chrome';
import { getBrowserDefaultOpenMode, getBrowserTagWorkstationOpenMode } from '../../../lib/storage';
import type { Tag, Workstation, BookmarkItem } from '../../../lib/types';
import { SearchInput } from '../../../components/SearchInput';
import { TagPill } from '../../../components/TagPill';
import { HomepageWorkstationCard } from '../../../components/HomepageWorkstationCard';
import { PixelButton } from '../../../components/PixelButton';
import './homepagePage.css';

interface HomepagePageProps {
  onNavigate: (tab: 'bookmarks' | 'tags' | 'workstations') => void;
}

type BookmarkSearchResult = {
  bookmark: BookmarkItem;
  matchScore: number;
  sortScore: number;
};

type TagSearchResult = {
  tag: Tag;
  matchScore: number;
  sortScore: number;
};

const normalizeQuery = (q: string) => q.trim().toLowerCase();

const includesCI = (text: string | undefined, q: string) => {
  if (!text) return false;
  return text.toLowerCase().includes(q);
};

const renderHighlighted = (text: string, rawQuery: string): ReactNode => {
  const query = normalizeQuery(rawQuery);
  if (!query) return text;

  const lowerText = text.toLowerCase();
  const parts: ReactNode[] = [];
  let i = 0;

  while (i < text.length) {
    const hitIndex = lowerText.indexOf(query, i);
    if (hitIndex === -1) {
      parts.push(text.slice(i));
      break;
    }
    if (hitIndex > i) {
      parts.push(text.slice(i, hitIndex));
    }
    parts.push(
      <span key={`${hitIndex}-${i}`} className="homepage-search__highlight">
        {text.slice(hitIndex, hitIndex + query.length)}
      </span>
    );
    i = hitIndex + query.length;
  }

  return <>{parts}</>;
};

export const HomepagePage = ({ onNavigate }: HomepagePageProps) => {
  const [hotTags, setHotTags] = useState<Tag[]>([]);
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [workstations, setWorkstations] = useState<Workstation[]>([]);
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchMode, setIsSearchMode] = useState(false);
  const pageRef = useRef<HTMLDivElement>(null);
  const [visibleTagCount, setVisibleTagCount] = useState<number>(0);
  const tagsListRef = useRef<HTMLDivElement>(null);
  const tagRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [visibleWorkstationCount, setVisibleWorkstationCount] = useState<number>(4);
  const workstationsListRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    if (!isSearchMode) return;
    pageRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, [isSearchMode]);

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

  const handleEnterSearchMode = () => {
    if (isSearchMode) return;
    setIsSearchMode(true);
  };

  const handleCancelSearch = () => {
    setSearchQuery('');
    setIsSearchMode(false);
  };

  const handleSearchKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'Escape') return;
    event.preventDefault();
    handleCancelSearch();
    // 避免退出后仍保持焦点，触发 onFocus 又进入搜索模式
    (event.currentTarget as HTMLInputElement).blur();
  };

  const handleBookmarkResultClick = async (bookmark: BookmarkItem) => {
    await incrementBookmarkClick(bookmark.id);
    setBookmarks((prev) =>
      prev.map((b) => (b.id === bookmark.id ? { ...b, clickCount: (b.clickCount ?? 0) + 1 } : b))
    );
    const mode = await getBrowserDefaultOpenMode();
    await openUrlWithMode(bookmark.url, mode);
  };

  const handleTagResultClick = (tagId: string) => {
    setIsSearchMode(false);
    handleTagClick(tagId);
  };

  const tagById = useMemo(() => {
    const map = new Map<string, Tag>();
    allTags.forEach((t) => map.set(t.id, t));
    return map;
  }, [allTags]);

  const { bookmarkResults, tagResults } = useMemo(() => {
    const q = normalizeQuery(searchQuery);
    if (!q) {
      return { bookmarkResults: [] as BookmarkSearchResult[], tagResults: [] as TagSearchResult[] };
    }

    const scoredBookmarks: BookmarkSearchResult[] = [];
    for (const bookmark of bookmarks) {
      const titleHit = includesCI(bookmark.title, q);
      const urlHit = includesCI(bookmark.url, q);
      const matchScore = (titleHit ? 1.2 : 0) + (urlHit ? 1.0 : 0);
      if (matchScore <= 0) continue;
      const frequencyScore = (bookmark.clickCount ?? 0) / 100;
      const sortScore = 0.75 * matchScore + 0.25 * frequencyScore;
      scoredBookmarks.push({ bookmark, matchScore, sortScore });
    }
    scoredBookmarks.sort((a, b) => {
      const scoreDiff = b.sortScore - a.sortScore;
      if (scoreDiff !== 0) return scoreDiff;
      return b.bookmark.createdAt - a.bookmark.createdAt;
    });

    const scoredTags: TagSearchResult[] = [];
    for (const tag of allTags) {
      const nameHit = includesCI(tag.name, q);
      const descHit = includesCI(tag.description ?? '', q);
      const matchScore = (nameHit ? 1.5 : 0) + (descHit ? 1.0 : 0);
      if (matchScore <= 0) continue;
      const sortScore = matchScore; // alpha=1, frequency=0
      scoredTags.push({ tag, matchScore, sortScore });
    }
    scoredTags.sort((a, b) => {
      const scoreDiff = b.sortScore - a.sortScore;
      if (scoreDiff !== 0) return scoreDiff;
      return b.tag.createdAt - a.tag.createdAt;
    });

    return { bookmarkResults: scoredBookmarks, tagResults: scoredTags };
  }, [searchQuery, bookmarks, allTags]);

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
    <div className={`homepage-page ${isSearchMode ? 'homepage-page--search-mode' : ''}`} ref={pageRef}>
      {isSearchMode ? (
        <div className="homepage-search__topbar">
          <div className="homepage-search__input">
            <SearchInput
              value={searchQuery}
              placeholder="search bookmark, tags"
              onChange={setSearchQuery}
              onFocus={handleEnterSearchMode}
              onKeyDown={handleSearchKeyDown}
              autoFocus
            />
          </div>
          <button type="button" className="homepage-search__cancel" onClick={handleCancelSearch}>
            取消
          </button>
        </div>
      ) : (
        <>
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
                onFocus={handleEnterSearchMode}
                onKeyDown={handleSearchKeyDown}
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
                      <path d="M6 12L10 8L6 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
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
        </>
      )}

      {isSearchMode && (
        <div className="homepage-search__results">
          <div className="homepage-search__section">
            <div className="homepage-search__section-title">书签</div>
            <div className="homepage-search__list">
              {bookmarkResults.length === 0 ? (
                <div className="homepage-search__empty">暂无书签结果</div>
              ) : (
                bookmarkResults.map(({ bookmark }) => {
                  const tags = (bookmark.tags ?? []).map((id) => tagById.get(id)).filter((t): t is Tag => Boolean(t));
                  const visibleTags = tags.slice(0, 2);
                  const remainingCount = Math.max(0, tags.length - visibleTags.length);

                  return (
                    <button
                      key={bookmark.id}
                      type="button"
                      className="homepage-search__bookmark-item"
                      onClick={() => void handleBookmarkResultClick(bookmark)}
                    >
                      <div className="homepage-search__bookmark-main">
                        <div className="homepage-search__bookmark-title" title={bookmark.title}>
                          {renderHighlighted(bookmark.title, searchQuery)}
                        </div>
                        <div className="homepage-search__bookmark-url" title={bookmark.url}>
                          {renderHighlighted(bookmark.url, searchQuery)}
                        </div>
                      </div>
                      {(visibleTags.length > 0 || remainingCount > 0) && (
                        <div className="homepage-search__bookmark-tags" aria-label="tags">
                          {visibleTags.map((t) => (
                            <TagPill key={t.id} label={t.name} color={t.color} size="small" />
                          ))}
                          {remainingCount > 0 && <span className="homepage-search__bookmark-tags-more">+{remainingCount}</span>}
                        </div>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>

          <div className="homepage-search__section">
            <div className="homepage-search__section-title">标签</div>
            <div className="homepage-search__list">
              {tagResults.length === 0 ? (
                <div className="homepage-search__empty">暂无标签结果</div>
              ) : (
                tagResults.map(({ tag }) => (
                  <button
                    key={tag.id}
                    type="button"
                    className="homepage-search__tag-item"
                    onClick={() => handleTagResultClick(tag.id)}
                  >
                    <span className="homepage-search__tag-dot" style={{ backgroundColor: tag.color }} aria-hidden="true" />
                    <div className="homepage-search__tag-main">
                      <div className="homepage-search__tag-title" title={tag.name}>
                        {renderHighlighted(tag.name, searchQuery)}
                      </div>
                      <div className="homepage-search__tag-desc" title={tag.description ?? ''}>
                        {tag.description ? renderHighlighted(tag.description, searchQuery) : <span className="homepage-search__tag-desc-empty">无备注</span>}
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
