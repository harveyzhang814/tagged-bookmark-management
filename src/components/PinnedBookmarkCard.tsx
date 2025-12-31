import { useMemo } from 'react';
import type { BookmarkItem, Tag } from '../lib/types';
import { TagPill } from './TagPill';
import { openBookmark } from '../lib/chrome';
import { incrementBookmarkClick } from '../lib/bookmarkService';
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

  const handleClick = async () => {
    await incrementBookmarkClick(bookmark.id);
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
      <div className="pinned-bookmark-click-count">
        <svg width="12" height="12" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M2.66667 2.66667L6.66667 2.66667L13.3333 9.33333L13.3333 13.3333L9.33333 13.3333L2.66667 6.66667L2.66667 2.66667Z"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          <path
            d="M6.66667 2.66667L2.66667 6.66667"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span>{bookmark.clickCount || 0}</span>
      </div>
    </div>
  );
};

