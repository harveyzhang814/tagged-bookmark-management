import { type MouseEvent, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import type { Workstation, BookmarkItem } from '../lib/types';
import { IconButton } from './IconButton';
import './homepagePinnedWorkstationCard.css';

interface HomepagePinnedWorkstationCardProps {
  workstation: Workstation;
  bookmarks: BookmarkItem[];
  onClick?: (workstationId: string) => void;
  onDoubleClick?: (workstationId: string) => void;
  onTogglePin: (workstationId: string) => void;
}

export const HomepagePinnedWorkstationCard = ({
  workstation,
  bookmarks,
  onClick,
  onDoubleClick,
  onTogglePin,
}: HomepagePinnedWorkstationCardProps) => {
  const { t } = useTranslation();
  const clickTimer = useRef<NodeJS.Timeout | null>(null);

  // 获取工作区绑定的书签
  const workstationBookmarks = bookmarks.filter((bookmark) =>
    workstation.bookmarks.includes(bookmark.id)
  );

  // 显示最多4个bookmark缩略图
  const displayedBookmarks = workstationBookmarks.slice(0, 4);

  const handleCardClick = () => {
    // 使用延迟来区分单点击和双击
    if (clickTimer.current) {
      clearTimeout(clickTimer.current);
    }
    
    clickTimer.current = setTimeout(() => {
      if (onClick) {
        onClick(workstation.id);
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
      onDoubleClick(workstation.id);
    }
  };

  const handlePinClick = (e: MouseEvent) => {
    e.stopPropagation();
    onTogglePin(workstation.id);
  };

  const faviconUrl = (url: string) =>
    `https://www.google.com/s2/favicons?sz=32&domain_url=${encodeURIComponent(url)}`;

  return (
    <div
      className="homepage-pinned-workstation-card"
      onClick={handleCardClick}
      onDoubleClick={handleCardDoubleClick}
    >
      <div className="homepage-pinned-workstation-card__header">
        <h3 className="homepage-pinned-workstation-card__title">{workstation.name}</h3>
        <IconButton
          variant={workstation.pinned ? 'primary' : 'secondary'}
          icon={
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M3.33333 13.3334L8 8.66671L12.6667 13.3334V3.33337C12.6667 2.89135 12.4911 2.46742 12.1785 2.15486C11.866 1.8423 11.442 1.66671 11 1.66671H5C4.55797 1.66671 4.13405 1.8423 3.82149 2.15486C3.50893 2.46742 3.33333 2.89135 3.33333 3.33337V13.3334Z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill={workstation.pinned ? 'currentColor' : 'none'}
              />
            </svg>
          }
          aria-label={workstation.pinned ? t('workstation.unpin') : t('workstation.pin')}
          onClick={handlePinClick}
        />
      </div>

      {workstation.description && (
        <div className="homepage-pinned-workstation-card__description">{workstation.description}</div>
      )}

      <div className="homepage-pinned-workstation-card__bookmarks">
        {displayedBookmarks.length > 0 ? (
          displayedBookmarks.map((bookmark) => (
            <img
              key={bookmark.id}
              className="homepage-pinned-workstation-card__bookmark-icon"
              src={faviconUrl(bookmark.url)}
              alt={bookmark.title}
              title={bookmark.title}
            />
          ))
        ) : (
          <div className="homepage-pinned-workstation-card__empty">{t('workstation.noBookmarksInWorkstation')}</div>
        )}
      </div>
    </div>
  );
};
