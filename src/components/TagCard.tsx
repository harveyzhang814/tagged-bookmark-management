import { type MouseEvent } from 'react';
import { IconButton } from './IconButton';
import { TagPill } from './TagPill';
import type { Tag } from '../lib/types';
import './tagCard.css';

interface TagCardProps {
  tag: Tag;
  onEdit: (tag: Tag) => void;
  onTogglePin: (tagId: string) => void;
}

export const TagCard = ({ tag, onEdit, onTogglePin }: TagCardProps) => {
  const handleEditClick = (e: MouseEvent) => {
    e.stopPropagation();
    onEdit(tag);
  };

  const handlePinClick = (e: MouseEvent) => {
    e.stopPropagation();
    onTogglePin(tag.id);
  };

  return (
    <div className={`tag-card ${tag.pinned ? 'tag-card--pinned' : ''}`}>
      <div className="tag-card__header">
        <TagPill label={tag.name} color={tag.color} size="large" />
        <div className="tag-card__actions">
          <IconButton
            variant="secondary"
            icon={
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M11.333 2.00004C11.5084 1.82464 11.7163 1.68576 11.9447 1.59203C12.1731 1.4983 12.4173 1.45166 12.6637 1.45504C12.91 1.45842 13.1527 1.51174 13.3777 1.61182C13.6027 1.7119 13.8055 1.85664 13.974 2.03771C14.1425 2.21878 14.2732 2.43249 14.3586 2.66604C14.444 2.89959 14.4822 3.14819 14.471 3.39671C14.4598 3.64523 14.3994 3.88888 14.2933 4.11338C14.1872 4.33788 14.0377 4.53875 13.8533 4.70404L6.18 12.3774L2.66667 13.3334L3.62267 9.82004L11.333 2.00004Z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            }
            aria-label="编辑标签"
            onClick={handleEditClick}
          />
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
            aria-label={tag.pinned ? '取消置顶' : '置顶'}
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
