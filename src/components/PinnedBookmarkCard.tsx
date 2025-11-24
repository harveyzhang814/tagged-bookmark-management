import { useMemo } from 'react';
import type { BookmarkItem, Tag } from '../lib/types';
import { TagPill } from './TagPill';
import { openBookmark } from '../lib/chrome';
import './pinnedBookmarkCard.css';

interface PinnedBookmarkCardProps {
  bookmark: BookmarkItem;
  tags: Tag[];
}

export const PinnedBookmarkCard = ({ bookmark, tags }: PinnedBookmarkCardProps) => {
  const bookmarkTags = useMemo(() => {
    return bookmark.tags
      .map((tagId) => tags.find((t) => t.id === tagId))
      .filter((t): t is Tag => t !== undefined);
  }, [bookmark.tags, tags]);

  const visibleTags = bookmarkTags.slice(0, 2);
  const remainingCount = bookmarkTags.length - 2;

  const handleClick = () => {
    void openBookmark(bookmark.url);
  };

  return (
    <div className="pinned-bookmark-card" onClick={handleClick}>
      <h4 className="pinned-bookmark-title" title={bookmark.title}>
        {bookmark.title}
      </h4>
      <div className="pinned-bookmark-tags">
        {visibleTags.map((tag) => (
          <TagPill key={tag.id} label={tag.name} color={tag.color} size="small" />
        ))}
        {remainingCount > 0 && (
          <span className="pinned-bookmark-tags-more">+{remainingCount}</span>
        )}
      </div>
    </div>
  );
};

