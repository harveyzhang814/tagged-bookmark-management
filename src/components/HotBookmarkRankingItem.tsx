import { useRef, useEffect, useState } from 'react';
import type { BookmarkItem, Tag } from '../lib/types';
import { RankingItem } from './RankingItem';
import { incrementBookmarkClick } from '../lib/bookmarkService';
import './hotBookmarkRankingItem.css';

interface HotBookmarkRankingItemProps {
  bookmark: BookmarkItem;
  tags: Tag[];
  rank: number;
}

export const HotBookmarkRankingItem = ({ bookmark, tags, rank }: HotBookmarkRankingItemProps) => {
  const bookmarkTags = bookmark.tags
    .map((tagId) => tags.find((t) => t.id === tagId))
    .filter((t): t is Tag => t !== undefined);

  const containerRef = useRef<HTMLDivElement>(null);
  const tagsRef = useRef<HTMLDivElement>(null);
  const measureTagsRef = useRef<HTMLDivElement>(null);
  const statRef = useRef<HTMLDivElement>(null);
  const [visibleTagCount, setVisibleTagCount] = useState(bookmarkTags.length);

  const handleClick = async () => {
    await incrementBookmarkClick(bookmark.id);
    window.open(bookmark.url, '_blank');
  };

  useEffect(() => {
    const calculateVisibleTags = () => {
      if (!containerRef.current || !measureTagsRef.current || !statRef.current) return;

      // Use requestAnimationFrame to ensure DOM is updated
      requestAnimationFrame(() => {
        if (!containerRef.current || !measureTagsRef.current || !statRef.current) return;

        const containerWidth = containerRef.current.offsetWidth;
        const titleElement = containerRef.current.querySelector('.hot-bookmark-ranking-title') as HTMLElement;
        const titleWidth = titleElement?.offsetWidth || 0;
        const statWidth = statRef.current.offsetWidth;
        const gap = 8; // gap between elements
        const tagsGap = 6; // gap between tags
        const tagMoreWidth = 35; // approximate width of "+N" tag
        const rightSectionGap = 8; // gap in right section
        
        // Available width for tags
        const availableWidth = containerWidth - titleWidth - statWidth - gap - rightSectionGap;
        
        if (availableWidth <= 0) {
          setVisibleTagCount(0);
          return;
        }

        // Measure all tags from the hidden measurement container
        const allTagElements = Array.from(measureTagsRef.current.querySelectorAll('.hot-bookmark-ranking-tag')) as HTMLElement[];
        
        if (allTagElements.length === 0) {
          setVisibleTagCount(0);
          return;
        }

        let totalWidth = 0;
        let count = 0;

        for (let i = 0; i < allTagElements.length; i++) {
          const tagWidth = allTagElements[i].offsetWidth;
          const nextWidth = totalWidth + tagWidth + (count > 0 ? tagsGap : 0);
          
          // If adding this tag would exceed available width, stop
          // Reserve space for "+N" if there are more tags
          const needsMoreTag = bookmarkTags.length > i + 1;
          const reservedWidth = needsMoreTag ? tagMoreWidth + tagsGap : 0;
          
          if (nextWidth + reservedWidth > availableWidth) {
            break;
          }
          
          totalWidth = nextWidth;
          count++;
        }

        setVisibleTagCount(Math.max(0, count));
      });
    };

    // Calculate after a short delay to ensure DOM is ready
    const timeoutId = setTimeout(calculateVisibleTags, 0);
    
    // Also calculate on resize
    const resizeObserver = new ResizeObserver(() => {
      calculateVisibleTags();
    });
    
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }
    
    // Also observe the measurement container to recalculate when tags change
    if (measureTagsRef.current) {
      resizeObserver.observe(measureTagsRef.current);
    }

    return () => {
      clearTimeout(timeoutId);
      resizeObserver.disconnect();
    };
  }, [bookmarkTags.length, bookmarkTags]);

  const visibleTags = bookmarkTags.slice(0, visibleTagCount);
  const hasMoreTags = bookmarkTags.length > visibleTagCount;

  return (
    <RankingItem rank={rank} onClick={handleClick}>
      <div ref={containerRef} className="hot-bookmark-ranking-content-wrapper">
        <h4 className="hot-bookmark-ranking-title" title={bookmark.title}>
          {bookmark.title}
        </h4>
        <div className="hot-bookmark-ranking-right-section">
          {/* Hidden container for measuring tag widths */}
          {bookmarkTags.length > 0 && (
            <div ref={measureTagsRef} className="hot-bookmark-ranking-tags-measure" aria-hidden="true">
              {bookmarkTags.map((tag) => (
                <span
                  key={tag.id}
                  className="hot-bookmark-ranking-tag"
                  style={{ 
                    backgroundColor: tag.color + '20',
                    color: tag.color,
                    borderColor: tag.color + '40'
                  }}
                >
                  {tag.name}
                </span>
              ))}
            </div>
          )}
          {bookmarkTags.length > 0 && (
            <div ref={tagsRef} className="hot-bookmark-ranking-tags">
              {visibleTags.map((tag) => (
                <span
                  key={tag.id}
                  className="hot-bookmark-ranking-tag"
                  style={{ 
                    backgroundColor: tag.color + '20',
                    color: tag.color,
                    borderColor: tag.color + '40'
                  }}
                >
                  {tag.name}
                </span>
              ))}
              {hasMoreTags && (
                <span className="hot-bookmark-ranking-tag-more">+{bookmarkTags.length - visibleTagCount}</span>
              )}
            </div>
          )}
          <div ref={statRef} className="hot-bookmark-ranking-stat-item">
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
      </div>
    </RankingItem>
  );
};
