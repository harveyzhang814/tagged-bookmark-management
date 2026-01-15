import { useMemo, useState } from 'react';
import type { BookmarkItem, Tag } from '../lib/types';
import { TagPill } from './TagPill';
import { openUrlWithMode } from '../lib/chrome';
import { incrementBookmarkClick } from '../lib/bookmarkService';
import { getBrowserDefaultOpenMode } from '../lib/storage';
import './pinnedBookmarkCard.css';

interface PinnedBookmarkCardProps {
  bookmark: BookmarkItem;
  tags: Tag[];
}

export const PinnedBookmarkCard = ({ bookmark, tags }: PinnedBookmarkCardProps) => {
  const [faviconError, setFaviconError] = useState(false);
  
  const bookmarkTags = useMemo(() => {
    return bookmark.tags
      .map((tagId) => tags.find((t) => t.id === tagId))
      .filter((t): t is Tag => t !== undefined);
  }, [bookmark.tags, tags]);

  const visibleTags = bookmarkTags.slice(0, 2);
  const remainingCount = bookmarkTags.length - 2;

  const handleClick = async () => {
    await incrementBookmarkClick(bookmark.id);
    const mode = await getBrowserDefaultOpenMode();
    await openUrlWithMode(bookmark.url, mode);
  };

  const faviconUrl = `https://www.google.com/s2/favicons?sz=32&domain_url=${encodeURIComponent(bookmark.url)}`;

  return (
    <div className="pinned-bookmark-card" onClick={handleClick}>
      <div className="pinned-bookmark-header">
        {!faviconError ? (
          <img
            className="pinned-bookmark-favicon"
            src={faviconUrl}
            alt=""
            onError={() => setFaviconError(true)}
          />
        ) : (
          <svg
            className="pinned-bookmark-favicon"
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M8 1.33333C4.318 1.33333 1.33333 4.318 1.33333 8C1.33333 11.682 4.318 14.6667 8 14.6667C11.682 14.6667 14.6667 11.682 14.6667 8C14.6667 4.318 11.682 1.33333 8 1.33333Z"
              stroke="currentColor"
              strokeWidth="1.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
            <path
              d="M1.33333 5.33333C2.4 4.26667 4.13333 3.33333 8 3.33333C11.8667 3.33333 13.6 4.26667 14.6667 5.33333"
              stroke="currentColor"
              strokeWidth="1.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
            <path
              d="M1.33333 10.6667C2.4 11.7333 4.13333 12.6667 8 12.6667C11.8667 12.6667 13.6 11.7333 14.6667 10.6667"
              stroke="currentColor"
              strokeWidth="1.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
            <path
              d="M8 1.33333V14.6667"
              stroke="currentColor"
              strokeWidth="1.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </svg>
        )}
        <h4 className="pinned-bookmark-title" title={bookmark.title}>
          {bookmark.title}
        </h4>
      </div>
      {(visibleTags.length > 0 || remainingCount > 0) && (
        <div className="pinned-bookmark-tags">
          {visibleTags.map((tag) => (
            <TagPill key={tag.id} label={tag.name} color={tag.color} size="small" />
          ))}
          {remainingCount > 0 && (
            <span className="pinned-bookmark-tags-more">+{remainingCount}</span>
          )}
        </div>
      )}
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
        <span>{bookmark.clickCount || 0}</span>
      </div>
    </div>
  );
};

