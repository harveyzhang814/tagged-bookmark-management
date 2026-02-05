import { type MouseEvent, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { IconButton } from './IconButton';
import { TagPill } from './TagPill';
import type { Tag } from '../lib/types';
import './tagCard.css';

interface TagCardProps {
  tag: Tag;
  onTogglePin: (tagId: string) => void;
  onClick?: (tagId: string) => void;
  onDoubleClick?: (tagId: string) => void;
}

export const TagCard = ({ tag, onTogglePin, onClick, onDoubleClick }: TagCardProps) => {
  const { t } = useTranslation();
  const clickTimer = useRef<NodeJS.Timeout | null>(null);

  const handlePinClick = (e: MouseEvent) => {
    e.stopPropagation();
    onTogglePin(tag.id);
  };

  const handleCardClick = () => {
    // 使用延迟来区分单点击和双击
    if (clickTimer.current) {
      clearTimeout(clickTimer.current);
    }
    
    clickTimer.current = setTimeout(() => {
      if (onClick) {
        onClick(tag.id);
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
      onDoubleClick(tag.id);
    }
  };

  return (
    <div 
      className={`tag-card ${tag.pinned ? 'tag-card--pinned' : ''}`}
      onClick={handleCardClick}
      onDoubleClick={handleCardDoubleClick}
    >
      <div className="tag-card__header">
        <TagPill label={tag.name} color={tag.color} size="large" />
        <div className="tag-card__actions">
          <IconButton
            variant={tag.pinned ? 'primary' : 'secondary'}
            icon={
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M3.33333 13.3334L8 8.66671L12.6667 13.3334V3.33337C12.6667 2.89135 12.4911 2.46742 12.1785 2.15486C11.866 1.8423 11.442 1.66671 11 1.66671H5C4.55797 1.66671 4.13405 1.8423 3.82149 2.15486C3.50893 2.46742 3.33333 2.89135 3.33333 3.33337V13.3334Z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill={tag.pinned ? 'currentColor' : 'none'}
                />
              </svg>
            }
            aria-label={tag.pinned ? t('tag.unpin') : t('tag.pin')}
            onClick={handlePinClick}
          />
        </div>
      </div>
      <div className="tag-card__footer">
        {tag.description && (
          <div className="tag-card__description">{tag.description}</div>
        )}
        <div className="tag-card__stats">
          <div className="tag-card__stat-item">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M2.66667 3.33333H13.3333"
                stroke="currentColor"
                strokeWidth="1.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M2.66667 8H13.3333"
                stroke="currentColor"
                strokeWidth="1.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M2.66667 12.6667H13.3333"
                stroke="currentColor"
                strokeWidth="1.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span>{tag.usageCount || 0}</span>
          </div>
          <div className="tag-card__stat-item">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
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
            <span>{tag.clickCount || 0}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
