import { useEffect, useState } from 'react';
import { getPinnedBookmarks, getHotTags, getAllTags } from '../../../lib/bookmarkService';
import type { BookmarkItem, Tag } from '../../../lib/types';
import { HorizontalScrollList } from '../../../components/HorizontalScrollList';
import { PinnedBookmarkCard } from '../../../components/PinnedBookmarkCard';
import { HotTagCard } from '../../../components/HotTagCard';
import './homePage.css';

interface HomePageProps {
  onNavigate: (tab: 'bookmarks' | 'tags') => void;
}

export const HomePage = ({ onNavigate }: HomePageProps) => {
  const [pinnedBookmarks, setPinnedBookmarks] = useState<BookmarkItem[]>([]);
  const [hotTags, setHotTags] = useState<Tag[]>([]);
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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

  if (isLoading) {
    return (
      <div className="home-page">
        <div className="home-header">
          <h1 className="home-title">标签书签管家</h1>
          <p className="home-subtitle">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="home-page">
      <div className="home-header">
        <h1 className="home-title">标签书签管家</h1>
        <p className="home-subtitle">快速访问你的收藏和标签</p>
      </div>

      <HorizontalScrollList
        title="置顶收藏"
        onMoreClick={pinnedBookmarks.length > 0 ? handlePinnedMoreClick : undefined}
      >
        {pinnedBookmarks.length > 0 ? (
          pinnedBookmarks.map((bookmark) => (
            <PinnedBookmarkCard key={bookmark.id} bookmark={bookmark} tags={allTags} />
          ))
        ) : (
          <div className="empty-state">暂无置顶收藏</div>
        )}
      </HorizontalScrollList>

      <HorizontalScrollList
        title="热门标签"
        onMoreClick={hotTags.length > 0 ? handleHotTagsMoreClick : undefined}
      >
        {hotTags.length > 0 ? (
          hotTags.map((tag) => (
            <HotTagCard key={tag.id} tag={tag} onClick={() => handleHotTagClick(tag)} />
          ))
        ) : (
          <div className="empty-state">暂无热门标签</div>
        )}
      </HorizontalScrollList>
    </div>
  );
};

