import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import './floatingActionButton.css';

interface FloatingActionButtonProps {
  onBookmarkClick: () => void;
  onTagClick: () => void;
  onWorkstationClick: () => void;
}

export const FloatingActionButton = ({ onBookmarkClick, onTagClick, onWorkstationClick }: FloatingActionButtonProps) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const fabRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (fabRef.current && !fabRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isOpen]);

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  const handleBookmarkClick = () => {
    setIsOpen(false);
    onBookmarkClick();
  };

  const handleTagClick = () => {
    setIsOpen(false);
    onTagClick();
  };

  const handleWorkstationClick = () => {
    setIsOpen(false);
    onWorkstationClick();
  };

  return (
    <div className="fab-container" ref={fabRef}>
      <div className={`fab-menu ${isOpen ? 'fab-menu--open' : ''}`}>
        <button
          type="button"
          className="fab-option fab-option--bookmark"
          onClick={handleBookmarkClick}
          aria-label={t('homepage.newBookmark')}
        >
          <div className="fab-option__icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <span className="fab-option__label">{t('homepage.newBookmark')}</span>
        </button>

        <button
          type="button"
          className="fab-option fab-option--tag"
          onClick={handleTagClick}
          aria-label={t('homepage.newTag')}
        >
          <div className="fab-option__icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <line x1="7" y1="7" x2="7.01" y2="7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <span className="fab-option__label">{t('homepage.newTag')}</span>
        </button>

        <button
          type="button"
          className="fab-option fab-option--workstation"
          onClick={handleWorkstationClick}
          aria-label={t('homepage.newWorkstation')}
        >
          <div className="fab-option__icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <span className="fab-option__label">{t('homepage.newWorkstation')}</span>
        </button>
      </div>

      <button
        type="button"
        className={`fab-button ${isOpen ? 'fab-button--open' : ''}`}
        onClick={handleToggle}
        aria-label={isOpen ? t('common.close') : t('common.open')}
        aria-expanded={isOpen}
      >
        <svg
          className="fab-button__icon"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {isOpen ? (
            <path
              d="M18 6L6 18M6 6l12 12"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ) : (
            <path
              d="M12 5v14M5 12h14"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}
        </svg>
      </button>
    </div>
  );
};
