import { useEffect, useMemo, useState, useRef } from 'react';
import { getPinnedBookmarks, getHotTags, getAllTags, getAllBookmarks, createBookmark, updateBookmark } from '../../../lib/bookmarkService';
import type { BookmarkItem, Tag } from '../../../lib/types';
import { HorizontalScrollList } from '../../../components/HorizontalScrollList';
import { PinnedBookmarkCard } from '../../../components/PinnedBookmarkCard';
import { HotTagCard } from '../../../components/HotTagCard';
import { BookmarkCreateModal } from '../../../components/BookmarkCreateModal';
import { BookmarkSidebar } from '../../../components/BookmarkSidebar';
import { PixelButton } from '../../../components/PixelButton';
import { SearchInput } from '../../../components/SearchInput';
import './homePage.css';

interface HomePageProps {
  onNavigate: (tab: 'bookmarks' | 'tags') => void;
  onRefresh?: () => void;
}

export const HomePage = ({ onNavigate, onRefresh }: HomePageProps) => {
  const [pinnedBookmarks, setPinnedBookmarks] = useState<BookmarkItem[]>([]);
  const [hotTags, setHotTags] = useState<Tag[]>([]);
  const [pinnedTags, setPinnedTags] = useState<Tag[]>([]);
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [allBookmarks, setAllBookmarks] = useState<BookmarkItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isBookmarkSidebarOpen, setIsBookmarkSidebarOpen] = useState(false);
  const [selectedTagId, setSelectedTagId] = useState<string | null>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);

  const loadData = async (showLoading = true) => {
    if (showLoading) {
      setIsLoading(true);
    }
    try {
      const [pinned, hotTagsData, tags, bookmarks] = await Promise.all([
        getPinnedBookmarks(),
        getHotTags(10),
        getAllTags(),
        getAllBookmarks()
      ]);
      setPinnedBookmarks(pinned);
      setHotTags(hotTagsData.map((ht) => ht.tag));
      setAllTags(tags);
      setAllBookmarks(bookmarks);
      // 获取置顶标签，按点击次数倒序
      const pinnedTagsData = tags.filter((tag) => tag.pinned).sort((a, b) => b.clickCount - a.clickCount);
      setPinnedTags(pinnedTagsData);
    } catch (error) {
      console.error('Failed to load home page data:', error);
    } finally {
      if (showLoading) {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const handlePinnedMoreClick = () => {
    onNavigate('bookmarks');
  };

  const handleHotTagsMoreClick = () => {
    onNavigate('tags');
  };

  const handleHotTagClick = (tag: Tag) => {
    if (!isBookmarkSidebarOpen || selectedTagId !== tag.id) {
      setSelectedTagId(tag.id);
      setIsBookmarkSidebarOpen(true);
    } else {
      // 如果已经打开且是同一个标签，刷新数据
      void loadData(false);
    }
  };

  const handleCreateBookmark = async (data: { title: string; url: string; tags: string[]; pinned: boolean }) => {
    await createBookmark(data);
    setIsCreateModalOpen(false);
    // 重新加载数据
    await loadData(false);
    // 触发父组件刷新
    if (onRefresh) {
      onRefresh();
    }
  };

  // 搜索过滤函数
  const filterBySearch = useMemo(() => {
    if (!searchQuery.trim()) {
      return {
        filteredPinnedBookmarks: pinnedBookmarks,
        filteredHotTags: hotTags,
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

    // 过滤置顶标签
    const filteredPinnedTags = pinnedTags.filter((tag) => {
      return tag.name.toLowerCase().includes(query) || 
             (tag.description && tag.description.toLowerCase().includes(query));
    });

    return {
      filteredPinnedBookmarks,
      filteredHotTags,
      filteredPinnedTags
    };
  }, [searchQuery, pinnedBookmarks, hotTags, pinnedTags, allTags]);

  const handlePinnedTagClick = (tag: Tag) => {
    if (!isBookmarkSidebarOpen || selectedTagId !== tag.id) {
      setSelectedTagId(tag.id);
      setIsBookmarkSidebarOpen(true);
    } else {
      // 如果已经打开且是同一个标签，刷新数据
      void loadData(false);
    }
  };

  const handleCloseSidebar = () => {
    setIsBookmarkSidebarOpen(false);
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
    return <div className="home-page" aria-busy="true" />;
  }

  return (
    <div 
      className="home-page"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <div className="home-toolbar-merged">
        <div className="home-filters">
          <SearchInput 
            value={searchQuery} 
            placeholder="搜索书签、标签..." 
            onChange={setSearchQuery} 
          />
        </div>
        <div className="home-actions">
          <PixelButton onClick={() => setIsCreateModalOpen(true)}>
            新建书签
          </PixelButton>
        </div>
      </div>

      <div className="home-content-wrapper">
        <div className="home-content">
          <HorizontalScrollList
            title="置顶书签"
            onMoreClick={pinnedBookmarks.length > 0 ? handlePinnedMoreClick : undefined}
          >
            {filterBySearch.filteredPinnedBookmarks.length > 0 ? (
              filterBySearch.filteredPinnedBookmarks.map((bookmark) => (
                <PinnedBookmarkCard key={bookmark.id} bookmark={bookmark} tags={allTags} />
              ))
            ) : (
              <div className="empty-state">暂无置顶书签</div>
            )}
          </HorizontalScrollList>

          <HorizontalScrollList
            title="置顶标签"
            onMoreClick={pinnedTags.length > 0 ? () => onNavigate('tags') : undefined}
          >
            {filterBySearch.filteredPinnedTags.length > 0 ? (
              filterBySearch.filteredPinnedTags.map((tag) => (
                <HotTagCard key={tag.id} tag={tag} onClick={() => handlePinnedTagClick(tag)} />
              ))
            ) : (
              <div className="empty-state">暂无置顶标签</div>
            )}
          </HorizontalScrollList>

          <HorizontalScrollList
            title="热门标签"
            onMoreClick={filterBySearch.filteredHotTags.length > 0 ? handleHotTagsMoreClick : undefined}
          >
            {filterBySearch.filteredHotTags.length > 0 ? (
              filterBySearch.filteredHotTags.map((tag) => (
                <HotTagCard key={tag.id} tag={tag} onClick={() => handleHotTagClick(tag)} />
              ))
            ) : (
              <div className="empty-state">暂无热门标签</div>
            )}
          </HorizontalScrollList>
        </div>

        {isBookmarkSidebarOpen && (
          <div ref={sidebarRef}>
            <BookmarkSidebar
              tagId={selectedTagId}
              bookmarks={allBookmarks}
              tags={allTags}
              onClose={handleCloseSidebar}
              onRemoveTag={handleRemoveTag}
            />
          </div>
        )}
      </div>

      <BookmarkCreateModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={handleCreateBookmark}
      />
    </div>
  );
};

