import { useEffect, useMemo, useState } from 'react';
import { getPinnedBookmarks, getHotTags, getAllTags, createBookmark } from '../../../lib/bookmarkService';
import type { BookmarkItem, Tag } from '../../../lib/types';
import { HorizontalScrollList } from '../../../components/HorizontalScrollList';
import { PinnedBookmarkCard } from '../../../components/PinnedBookmarkCard';
import { HotTagCard } from '../../../components/HotTagCard';
import { BookmarkCreateModal } from '../../../components/BookmarkCreateModal';
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
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const [pinned, hotTagsData, tags] = await Promise.all([
          getPinnedBookmarks(),
          getHotTags(10),
          getAllTags()
        ]);
        setPinnedBookmarks(pinned);
        setHotTags(hotTagsData.map((ht) => ht.tag));
        setAllTags(tags);
        // 获取置顶标签，按点击次数倒序
        const pinnedTagsData = tags.filter((tag) => tag.pinned).sort((a, b) => b.clickCount - a.clickCount);
        setPinnedTags(pinnedTagsData);
      } catch (error) {
        console.error('Failed to load home page data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    void loadData();
  }, []);

  const handlePinnedMoreClick = () => {
    onNavigate('bookmarks');
  };

  const handleHotTagsMoreClick = () => {
    onNavigate('tags');
  };

  const handleHotTagClick = (tag: Tag) => {
    onNavigate('tags');
    // Note: 这里可以添加选中tag的逻辑，但需要TagsPage支持
  };

  const handleCreateBookmark = async (data: { title: string; url: string; tags: string[]; pinned: boolean }) => {
    await createBookmark(data);
    setIsCreateModalOpen(false);
    // 重新加载数据
    const [pinned, hotTagsData, tags] = await Promise.all([
      getPinnedBookmarks(),
      getHotTags(10),
      getAllTags()
    ]);
    setPinnedBookmarks(pinned);
    setHotTags(hotTagsData.map((ht) => ht.tag));
    setAllTags(tags);
    // 更新置顶标签
    const pinnedTagsData = tags.filter((tag) => tag.pinned).sort((a, b) => b.clickCount - a.clickCount);
    setPinnedTags(pinnedTagsData);
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

    // 过滤置顶收藏
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
    onNavigate('tags');
    // Note: 这里可以添加选中tag的逻辑，但需要TagsPage支持
  };

  if (isLoading) {
    return <div className="home-page" aria-busy="true" />;
  }

  return (
    <div className="home-page">
      <div className="home-toolbar-merged">
        <div className="home-filters">
          <SearchInput 
            value={searchQuery} 
            placeholder="搜索收藏、标签..." 
            onChange={setSearchQuery} 
          />
        </div>
        <div className="home-actions">
          <PixelButton onClick={() => setIsCreateModalOpen(true)}>
            新建收藏
          </PixelButton>
        </div>
      </div>

      <HorizontalScrollList
        title="置顶收藏"
        onMoreClick={filterBySearch.filteredPinnedBookmarks.length > 0 ? handlePinnedMoreClick : undefined}
      >
        {filterBySearch.filteredPinnedBookmarks.length > 0 ? (
          filterBySearch.filteredPinnedBookmarks.map((bookmark) => (
            <PinnedBookmarkCard key={bookmark.id} bookmark={bookmark} tags={allTags} />
          ))
        ) : (
          <div className="empty-state">暂无置顶收藏</div>
        )}
      </HorizontalScrollList>

      <HorizontalScrollList
        title="置顶标签"
        onMoreClick={filterBySearch.filteredPinnedTags.length > 0 ? () => onNavigate('tags') : undefined}
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

      <BookmarkCreateModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={handleCreateBookmark}
      />
    </div>
  );
};

