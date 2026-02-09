import { useEffect, useMemo, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { getPinnedBookmarks, getHotTags, getHotBookmarks, getAllTags, getAllBookmarks, createBookmark, updateBookmark } from '../../../lib/bookmarkService';
import type { BookmarkItem, Tag } from '../../../lib/types';
import { HorizontalScrollList } from '../../../components/HorizontalScrollList';
import { PinnedBookmarkCard } from '../../../components/PinnedBookmarkCard';
import { HotTagCard } from '../../../components/HotTagCard';
import { RankingList } from '../../../components/RankingList';
import { HotTagRankingItem } from '../../../components/HotTagRankingItem';
import { HotBookmarkRankingItem } from '../../../components/HotBookmarkRankingItem';
import { BookmarkEditModal } from '../../../components/BookmarkEditModal';
import { BookmarkSidebar } from '../../../components/BookmarkSidebar';
import { PixelButton } from '../../../components/PixelButton';
import { SearchInput } from '../../../components/SearchInput';
import './rankingPage.css';

interface RankingPageProps {
  onNavigate: (tab: 'bookmarks' | 'tags') => void;
  onRefresh?: () => void;
}

/** 内容区侧边栏类型（与左侧全局导航无关）；新增侧栏时在此扩展 */
type RankingSidebarKind = 'tag-bookmark';

export const RankingPage = ({ onNavigate, onRefresh }: RankingPageProps) => {
  const { t } = useTranslation();
  const [pinnedBookmarks, setPinnedBookmarks] = useState<BookmarkItem[]>([]);
  const [hotTags, setHotTags] = useState<Tag[]>([]);
  const [hotBookmarks, setHotBookmarks] = useState<BookmarkItem[]>([]);
  const [pinnedTags, setPinnedTags] = useState<Tag[]>([]);
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [allBookmarks, setAllBookmarks] = useState<BookmarkItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [openSidebar, setOpenSidebar] = useState<RankingSidebarKind | null>(null);
  const [selectedTagId, setSelectedTagId] = useState<string | null>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);

  const loadData = async (showLoading = true) => {
    if (showLoading) {
      setIsLoading(true);
    }
    try {
      const [pinned, hotTagsData, hotBookmarksData, tags, bookmarks] = await Promise.all([
        getPinnedBookmarks(),
        getHotTags(10),
        getHotBookmarks(10),
        getAllTags(),
        getAllBookmarks()
      ]);
      setPinnedBookmarks(pinned);
      setHotTags(hotTagsData.map((ht) => ht.tag));
      setHotBookmarks(hotBookmarksData);
      setAllTags(tags);
      setAllBookmarks(bookmarks);
      // 获取置顶标签，按点击次数倒序
      const pinnedTagsData = tags.filter((tag) => tag.pinned).sort((a, b) => b.clickCount - a.clickCount);
      setPinnedTags(pinnedTagsData);
    } catch (error) {
      console.error('Failed to load ranking page data:', error);
    } finally {
      if (showLoading) {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

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

  const handlePinnedMoreClick = () => {
    onNavigate('bookmarks');
  };

  const handleHotTagsMoreClick = () => {
    onNavigate('tags');
  };

  const handleHotTagClick = (tag: Tag) => {
    if (openSidebar !== 'tag-bookmark' || selectedTagId !== tag.id) {
      setSelectedTagId(tag.id);
      setOpenSidebar('tag-bookmark');
    } else {
      // 如果已经打开且是同一个标签，刷新数据
      void loadData(false);
    }
  };

  const handleCreateBookmark = async (data: { title: string; url: string; tags: string[]; pinned: boolean }) => {
    await createBookmark(data);
    // 不立即关闭弹窗，让成功提示先显示，弹窗会在1.5秒后自动关闭
    // 延迟刷新数据，让成功提示先显示
    setTimeout(async () => {
      // 重新加载数据
      await loadData(false);
      // 触发父组件刷新
      if (onRefresh) {
        onRefresh();
      }
    }, 1600);
  };

  // 搜索过滤函数
  const filterBySearch = useMemo(() => {
    if (!searchQuery.trim()) {
      return {
        filteredPinnedBookmarks: pinnedBookmarks,
        filteredHotTags: hotTags,
        filteredHotBookmarks: hotBookmarks,
        filteredPinnedTags: pinnedTags
      };
    }

    const query = searchQuery.toLowerCase().trim();

    // 过滤置顶书签
    const filteredPinnedBookmarks = pinnedBookmarks.filter((bookmark) => {
      const titleMatch = bookmark.title.toLowerCase().includes(query);
      const urlMatch = bookmark.url.toLowerCase().includes(query);
      const tagMatch = bookmark.tags.some((tagId) => {
        const tag = allTags.find((t) => t.id === tagId);
        return tag?.name.toLowerCase().includes(query);
      });
      return titleMatch || urlMatch || tagMatch;
    });

    // 过滤热门标签
    const filteredHotTags = hotTags.filter((tag) => {
      return tag.name.toLowerCase().includes(query) || 
             (tag.description && tag.description.toLowerCase().includes(query));
    });

    // 过滤热门书签
    const filteredHotBookmarks = hotBookmarks.filter((bookmark) => {
      const titleMatch = bookmark.title.toLowerCase().includes(query);
      const urlMatch = bookmark.url.toLowerCase().includes(query);
      const tagMatch = bookmark.tags.some((tagId) => {
        const tag = allTags.find((t) => t.id === tagId);
        return tag?.name.toLowerCase().includes(query);
      });
      return titleMatch || urlMatch || tagMatch;
    });

    // 过滤置顶标签
    const filteredPinnedTags = pinnedTags.filter((tag) => {
      return tag.name.toLowerCase().includes(query) || 
             (tag.description && tag.description.toLowerCase().includes(query));
    });

    return {
      filteredPinnedBookmarks,
      filteredHotTags,
      filteredHotBookmarks,
      filteredPinnedTags
    };
  }, [searchQuery, pinnedBookmarks, hotTags, hotBookmarks, pinnedTags, allTags]);

  const handlePinnedTagClick = (tag: Tag) => {
    if (openSidebar !== 'tag-bookmark' || selectedTagId !== tag.id) {
      setSelectedTagId(tag.id);
      setOpenSidebar('tag-bookmark');
    } else {
      // 如果已经打开且是同一个标签，刷新数据
      void loadData(false);
    }
  };

  const handleCloseSidebar = () => {
    setOpenSidebar(null);
    setSelectedTagId(null);
  };

  const handleRemoveTag = async (bookmarkId: string, tagId: string) => {
    const bookmark = allBookmarks.find((b) => b.id === bookmarkId);
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
    await loadData(false);
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

  if (isLoading) {
    return <div className="ranking-page" aria-busy="true" />;
  }

  return (
    <div 
      className="ranking-page"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <div className="ranking-toolbar-merged">
        <div className="ranking-filters">
          <SearchInput 
            value={searchQuery} 
            placeholder={t('ranking.searchPlaceholder')} 
            onChange={setSearchQuery} 
          />
        </div>
        <div className="ranking-actions">
          <PixelButton onClick={() => setIsCreateModalOpen(true)}>
            {t('bookmark.new')}
          </PixelButton>
        </div>
      </div>

      <div className="ranking-content-wrapper">
        <div className="ranking-content">
          <HorizontalScrollList
            title={t('homepage.pinnedBookmarks')}
            onMoreClick={pinnedBookmarks.length > 0 ? handlePinnedMoreClick : undefined}
          >
            {filterBySearch.filteredPinnedBookmarks.length > 0 ? (
              filterBySearch.filteredPinnedBookmarks.map((bookmark) => (
                <PinnedBookmarkCard key={bookmark.id} bookmark={bookmark} tags={allTags} />
              ))
            ) : (
              <div className="empty-state">{t('homepage.noPinnedBookmarks')}</div>
            )}
          </HorizontalScrollList>

          <HorizontalScrollList
            title={t('homepage.pinnedTags')}
            onMoreClick={pinnedTags.length > 0 ? () => onNavigate('tags') : undefined}
          >
            {filterBySearch.filteredPinnedTags.length > 0 ? (
              filterBySearch.filteredPinnedTags.map((tag) => (
                <HotTagCard key={tag.id} tag={tag} onClick={() => handlePinnedTagClick(tag)} />
              ))
            ) : (
              <div className="empty-state">{t('homepage.noPinnedTags')}</div>
            )}
          </HorizontalScrollList>

          <div className="ranking-rankings-container">
            <RankingList
              title={t('ranking.hotTags')}
              onMoreClick={filterBySearch.filteredHotTags.length > 0 ? handleHotTagsMoreClick : undefined}
            >
              {filterBySearch.filteredHotTags.length > 0 ? (
                filterBySearch.filteredHotTags.map((tag, index) => (
                  <HotTagRankingItem
                    key={tag.id}
                    tag={tag}
                    rank={index + 1}
                    onClick={() => handleHotTagClick(tag)}
                  />
                ))
              ) : (
                <div className="empty-state">{t('ranking.noHotTags')}</div>
              )}
            </RankingList>

            <RankingList
              title={t('ranking.hotBookmarks')}
              onMoreClick={filterBySearch.filteredHotBookmarks.length > 0 ? handlePinnedMoreClick : undefined}
            >
              {filterBySearch.filteredHotBookmarks.length > 0 ? (
                filterBySearch.filteredHotBookmarks.map((bookmark, index) => (
                  <HotBookmarkRankingItem
                    key={bookmark.id}
                    bookmark={bookmark}
                    tags={allTags}
                    rank={index + 1}
                  />
                ))
              ) : (
                <div className="empty-state">{t('ranking.noHotBookmarks')}</div>
              )}
            </RankingList>
          </div>
        </div>

        {openSidebar === 'tag-bookmark' && selectedTagId && (
          <div ref={sidebarRef} className="tags-sidebar-wrapper">
            <BookmarkSidebar
              tagId={selectedTagId}
              tag={allTags.find((t) => t.id === selectedTagId) ?? null}
              bookmarks={allBookmarks}
              tags={allTags}
              onClose={handleCloseSidebar}
              onRemoveTag={handleRemoveTag}
              onTagUpdated={() => void loadData(false)}
            />
          </div>
        )}
      </div>

      {isCreateModalOpen && (
        <BookmarkEditModal
          mode="create"
          onClose={() => setIsCreateModalOpen(false)}
          onCreate={handleCreateBookmark}
        />
      )}
    </div>
  );
};
