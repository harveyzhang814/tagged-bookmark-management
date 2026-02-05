import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { PixelButton } from './PixelButton';
import './confirmDeleteAllDataModal.css';

interface ConfirmDeleteAllDataModalProps {
  isOpen: boolean;
  isBusy?: boolean;
  isSuccess?: boolean;
  error?: string | null;
  onClose: () => void;
  onConfirm: () => void;
}

export const ConfirmDeleteAllDataModal = ({
  isOpen,
  isBusy = false,
  isSuccess = false,
  error,
  onClose,
  onConfirm,
}: ConfirmDeleteAllDataModalProps) => {
  const { t } = useTranslation();

  useEffect(() => {
    if (!isOpen) return;

    const handler = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (isBusy || isSuccess) return;
      e.preventDefault();
      onClose();
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, isBusy, isSuccess, onClose]);

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isBusy || isSuccess) return;
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="confirm-delete-modal__backdrop" onClick={handleBackdropClick} aria-hidden={false}>
      <div className="confirm-delete-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="confirm-delete-modal__header">
          <h2 className="confirm-delete-modal__title">{t('settings.dataManagement.deleteAll.modalTitle')}</h2>
          <button
            className="confirm-delete-modal__close"
            onClick={onClose}
            aria-label={t('common.close')}
            type="button"
            disabled={isBusy || isSuccess}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M15 5L5 15M5 5L15 15"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>

        <div className="confirm-delete-modal__content">
          {isBusy ? (
            <div className="confirm-delete-modal__status" aria-busy="true">
              <div className="confirm-delete-modal__spinner" aria-hidden="true">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeDasharray="47"
                    strokeDashoffset="47"
                    opacity="0.3"
                  />
                  <circle
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeDasharray="47"
                    strokeDashoffset="11.75"
                    className="confirm-delete-modal__spinner-circle"
                  />
                </svg>
              </div>
              <p className="confirm-delete-modal__status-text">{t('settings.dataManagement.deleteAll.deleting')}</p>
            </div>
          ) : isSuccess ? (
            <div className="confirm-delete-modal__status">
              <div className="confirm-delete-modal__success-icon" aria-hidden="true">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M20 6L9 17l-5-5"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <p className="confirm-delete-modal__status-text">{t('settings.dataManagement.deleteAll.success')}</p>
            </div>
          ) : (
            <>
              <p className="confirm-delete-modal__body">{t('settings.dataManagement.deleteAll.modalBody')}</p>

              {error && <div className="confirm-delete-modal__error">{error}</div>}

              <div className="confirm-delete-modal__actions">
                <PixelButton variant="secondary" onClick={onClose}>
                  {t('common.cancel')}
                </PixelButton>
                <PixelButton variant="danger" onClick={onConfirm}>
                  {t('settings.dataManagement.deleteAll.confirm')}
                </PixelButton>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

