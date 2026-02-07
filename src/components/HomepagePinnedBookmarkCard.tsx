import { type MouseEvent, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { IconButton } from './IconButton';
import type { BookmarkItem } from '../lib/types';
import './homepagePinnedBookmarkCard.css';

interface HomepagePinnedBookmarkCardProps {
  bookmark: BookmarkItem;
  onClick?: (bookmark: BookmarkItem) => void;
  onDoubleClick?: (bookmark: BookmarkItem) => void;
  onTogglePin: (bookmarkId: string) => void;
}

export const HomepagePinnedBookmarkCard = ({
  bookmark,
  onClick,
  onDoubleClick,
  onTogglePin,
}: HomepagePinnedBookmarkCardProps) => {
  const { t } = useTranslation();
  const [faviconError, setFaviconError] = useState(false);
  const clickTimer = useRef<NodeJS.Timeout | null>(null);

  const handleCardClick = () => {
    // 使用延迟来区分单点击和双击
    if (clickTimer.current) {
      clearTimeout(clickTimer.current);
    }
    
    clickTimer.current = setTimeout(() => {
      if (onClick) {
        onClick(bookmark);
      }
      clickTimer.current = null;
    }, 300); // 300ms延迟，如果在这期间检测到双击则取消
  };

  const handleCardDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    // 清除单点击的延迟执行
    if (clickTimer.current) {
      clearTimeout(clickTimer.current);
      clickTimer.current = null;
    }
    if (onDoubleClick) {
      onDoubleClick(bookmark);
    }
  };

  const handlePinClick = (e: MouseEvent) => {
    e.stopPropagation();
    onTogglePin(bookmark.id);
  };

  const faviconUrl = `https://www.google.com/s2/favicons?sz=32&domain_url=${encodeURIComponent(bookmark.url)}`;

  return (
    <div
      className="homepage-pinned-bookmark-card"
      onClick={handleCardClick}
      onDoubleClick={handleCardDoubleClick}
    >
      <div className="homepage-pinned-bookmark-card__header">
        <div className="homepage-pinned-bookmark-card__title-wrapper">
          {!faviconError ? (
            <img
              className="homepage-pinned-bookmark-card__favicon"
              src={faviconUrl}
              alt=""
              onError={() => setFaviconError(true)}
            />
          ) : (
            <svg
              className="homepage-pinned-bookmark-card__favicon"
              width="14"
              height="14"
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
          <h3 className="homepage-pinned-bookmark-card__title">{bookmark.title}</h3>
        </div>
        <IconButton
          variant={bookmark.pinned ? 'primary' : 'secondary'}
          icon={
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M3.33333 13.3334L8 8.66671L12.6667 13.3334V3.33337C12.6667 2.89135 12.4911 2.46742 12.1785 2.15486C11.866 1.8423 11.442 1.66671 11 1.66671H5C4.55797 1.66671 4.13405 1.8423 3.82149 2.15486C3.50893 2.46742 3.33333 2.89135 3.33333 3.33337V13.3334Z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill={bookmark.pinned ? 'currentColor' : 'none'}
              />
            </svg>
          }
          aria-label={bookmark.pinned ? t('bookmark.unpin') : t('bookmark.pin')}
          onClick={handlePinClick}
        />
      </div>

      <div className="homepage-pinned-bookmark-card__url">{bookmark.url}</div>

      <div className="homepage-pinned-bookmark-card__meta">
        <div className="homepage-pinned-bookmark-card__click-count">
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
  );
};
