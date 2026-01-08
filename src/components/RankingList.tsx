import { type ReactNode } from 'react';
import './rankingList.css';

interface RankingListProps {
  children: ReactNode;
  title: string;
  onMoreClick?: () => void;
  moreLabel?: string;
}

export const RankingList = ({
  children,
  title,
  onMoreClick,
  moreLabel = '更多'
}: RankingListProps) => {
  return (
    <div className="ranking-list-section">
      <div className="ranking-list-header">
        <h3 className="ranking-list-title">{title}</h3>
        {onMoreClick && (
          <button className="ranking-list-more" onClick={onMoreClick} type="button">
            {moreLabel}
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M6 12L10 8L6 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        )}
      </div>
      <div className="ranking-list-content">
        {children}
      </div>
    </div>
  );
};
