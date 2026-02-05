import { type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import './horizontalScrollList.css';

interface HorizontalScrollListProps {
  children: ReactNode;
  title: string;
  onMoreClick?: () => void;
  moreLabel?: string;
}

export const HorizontalScrollList = ({
  children,
  title,
  onMoreClick,
  moreLabel
}: HorizontalScrollListProps) => {
  const { t } = useTranslation();
  const defaultMoreLabel = moreLabel ?? t('homepage.viewAll');
  return (
    <div className="horizontal-scroll-section">
      <div className="horizontal-scroll-header">
        <h3 className="horizontal-scroll-title">{title}</h3>
        {onMoreClick && (
          <button className="horizontal-scroll-more" onClick={onMoreClick} type="button">
            {defaultMoreLabel}
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M6 12L10 8L6 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        )}
      </div>
      <div className="horizontal-scroll-container">
        <div className="horizontal-scroll-content">
          {children}
        </div>
      </div>
    </div>
  );
};

