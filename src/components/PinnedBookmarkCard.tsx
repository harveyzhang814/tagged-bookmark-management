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
            d="M8 2.66667C4.66667 2.66667 2.07333 5.04 1.33333 8C2.07333 10.96 4.66667 13.3333 8 13.3333C11.3333 13.3333 13.9267 10.96 14.6667 8C13.9267 5.04 11.3333 2.66667 8 2.66667Z"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          <path
            d="M8 10.6667C9.47276 10.6667 10.6667 9.47276 10.6667 8C10.6667 6.52724 9.47276 5.33333 8 5.33333C6.52724 5.33333 5.33333 6.52724 5.33333 8C5.33333 9.47276 6.52724 10.6667 8 10.6667Z"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </svg>
        <span>x{bookmark.clickCount || 0}</span>
      </div>
    </div>
  );
};

