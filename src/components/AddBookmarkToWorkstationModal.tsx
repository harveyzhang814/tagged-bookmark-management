import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { SearchInput } from './SearchInput';
import { TagPill } from './TagPill';
import { addBookmarkToWorkstation, removeBookmarkFromWorkstation } from '../lib/workstationService';
import type { BookmarkItem, Tag, Workstation } from '../lib/types';
import './addBookmarkToWorkstationModal.css';

const normalizeQuery = (q: string) => q.trim().toLowerCase();

function renderHighlighted(text: string, rawQuery: string): ReactNode {
  const query = normalizeQuery(rawQuery);
  if (!query) return text;
  const lowerText = text.toLowerCase();
  const parts: ReactNode[] = [];
  let i = 0;
  while (i < text.length) {
    const hitIndex = lowerText.indexOf(query, i);
    if (hitIndex === -1) {
      parts.push(text.slice(i));
      break;
    }
    if (hitIndex > i) parts.push(text.slice(i, hitIndex));
    parts.push(
      <span key={`${hitIndex}-${i}`} className="add-bookmark-modal__highlight">
        {text.slice(hitIndex, hitIndex + query.length)}
      </span>
    );
    i = hitIndex + query.length;
  }
  return <>{parts}</>;
}

function matchBookmark(bookmark: BookmarkItem, query: string, tagById: Map<string, Tag>): boolean {
  if (!query) return true;
  const titleHit = bookmark.title.toLowerCase().includes(query);
  const urlHit = bookmark.url.toLowerCase().includes(query);
  const tagNames = (bookmark.tags ?? [])
    .map((id) => tagById.get(id)?.name)
    .filter(Boolean) as string[];
  const tagHit = tagNames.some((name) => name.toLowerCase().includes(query));
  return titleHit || urlHit || tagHit;
}

interface AddBookmarkToWorkstationModalProps {
  isOpen: boolean;
  onClose: () => void;
  workstationId: string;
  workstation: Workstation;
  bookmarks: BookmarkItem[];
  tags: Tag[];
}

export const AddBookmarkToWorkstationModal = ({
  isOpen,
  onClose,
  workstationId,
  workstation,
  bookmarks,
  tags
}: AddBookmarkToWorkstationModalProps) => {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const initialBookmarkIdsRef = useRef<string[]>([]);
  const [currentBookmarkIds, setCurrentBookmarkIds] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen && workstation) {
      const ids = [...workstation.bookmarks];
      initialBookmarkIdsRef.current = ids;
      setCurrentBookmarkIds(ids);
      setSearchQuery('');
    }
  }, [isOpen, workstation]);

  const tagById = useMemo(() => {
    const map = new Map<string, Tag>();
    tags.forEach((tag) => map.set(tag.id, tag));
    return map;
  }, [tags]);

  const pinnedBookmarks = useMemo(() => {
    return bookmarks
      .filter((b) => b.pinned)
      .sort((a, b) => b.updatedAt - a.updatedAt);
  }, [bookmarks]);

  const searchQueryNorm = normalizeQuery(searchQuery);
  const searchResultBookmarks = useMemo(() => {
    if (!searchQueryNorm) return [];
    return bookmarks.filter((b) => matchBookmark(b, searchQueryNorm, tagById));
  }, [bookmarks, searchQueryNorm, tagById]);

  const resultBookmarks = searchQueryNorm ? searchResultBookmarks : pinnedBookmarks;

  const selectedThisSessionIds = useMemo(() => {
    const initial = new Set(initialBookmarkIdsRef.current);
    return currentBookmarkIds.filter((id) => !initial.has(id));
  }, [currentBookmarkIds]);

  const selectedBookmarks = useMemo(() => {
    const idSet = new Set(selectedThisSessionIds);
    return bookmarks.filter((b) => idSet.has(b.id));
  }, [bookmarks, selectedThisSessionIds]);

  const handleAdd = async (bookmarkId: string) => {
    const updated = await addBookmarkToWorkstation(workstationId, bookmarkId);
    if (updated) setCurrentBookmarkIds([...updated.bookmarks]);
  };

  const handleRemove = async (bookmarkId: string) => {
    const updated = await removeBookmarkFromWorkstation(workstationId, bookmarkId);
    if (updated) setCurrentBookmarkIds([...updated.bookmarks]);
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  };

  if (!isOpen) return null;

  const currentSet = new Set(currentBookmarkIds);
  const initialSet = new Set(initialBookmarkIdsRef.current);

  return (
    <div
      className="add-bookmark-modal__backdrop"
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-bookmark-modal-title"
    >
      <div className="add-bookmark-modal" onClick={(e) => e.stopPropagation()}>
        <div className="add-bookmark-modal__header">
          <h2 id="add-bookmark-modal-title" className="add-bookmark-modal__title">
            {t('workstation.selectBookmark')}
          </h2>
          <button
            type="button"
            className="add-bookmark-modal__close"
            onClick={onClose}
            aria-label={t('common.close')}
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

        <div className="add-bookmark-modal__content">
          <div className="add-bookmark-modal__search">
            <SearchInput
              value={searchQuery}
              placeholder={t('bookmark.searchPlaceholder')}
              onChange={setSearchQuery}
            />
          </div>

          {selectedBookmarks.length > 0 && (
            <div className="add-bookmark-modal__section">
              <div className="add-bookmark-modal__section-title">
                {t('workstation.selectedThisSession')}
              </div>
              <div className="add-bookmark-modal__list">
                {selectedBookmarks.map((bookmark) => {
                  const bookmarkTags = (bookmark.tags ?? [])
                    .map((id) => tagById.get(id))
                    .filter((t): t is Tag => Boolean(t));
                  return (
                    <div key={bookmark.id} className="add-bookmark-modal__item">
                      <div className="add-bookmark-modal__item-main">
                        <div className="add-bookmark-modal__item-title" title={bookmark.title}>
                          {renderHighlighted(bookmark.title, searchQuery)}
                        </div>
                        <div className="add-bookmark-modal__item-url" title={bookmark.url}>
                          {renderHighlighted(bookmark.url, searchQuery)}
                        </div>
                        {bookmarkTags.length > 0 && (
                          <div className="add-bookmark-modal__item-tags">
                            {bookmarkTags.slice(0, 2).map((tag) => (
                              <TagPill key={tag.id} label={tag.name} color={tag.color} size="small" />
                            ))}
                            {bookmarkTags.length > 2 && (
                              <span className="add-bookmark-modal__item-tags-more">
                                +{bookmarkTags.length - 2}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="add-bookmark-modal__item-action">
                        <button
                          type="button"
                          className="add-bookmark-modal__btn-add selected"
                          onClick={() => void handleRemove(bookmark.id)}
                          aria-label={t('workstation.addBookmark')}
                          title={t('workstation.addBookmark')}
                        >
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path
                              d="M8 3.33333V12.6667M3.33333 8H12.6667"
                              stroke="currentColor"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="add-bookmark-modal__section">
            <div className="add-bookmark-modal__section-title">
              {searchQueryNorm ? t('bookmark.title') : t('bookmark.pinnedBookmarks')}
            </div>
            <div className="add-bookmark-modal__list">
              {resultBookmarks.length === 0 ? (
                <div className="add-bookmark-modal__empty">{t('bookmark.noMatch')}</div>
              ) : (
                resultBookmarks.map((bookmark) => {
                  const inCurrent = currentSet.has(bookmark.id);
                  const inInitial = initialSet.has(bookmark.id);
                  const isDisabled = inInitial && !selectedThisSessionIds.includes(bookmark.id);
                  const isSelected = inCurrent && !inInitial;
                  const bookmarkTags = (bookmark.tags ?? [])
                    .map((id) => tagById.get(id))
                    .filter((t): t is Tag => Boolean(t));

                  return (
                    <div key={bookmark.id} className="add-bookmark-modal__item">
                      <div className="add-bookmark-modal__item-main">
                        <div className="add-bookmark-modal__item-title" title={bookmark.title}>
                          {renderHighlighted(bookmark.title, searchQuery)}
                        </div>
                        <div className="add-bookmark-modal__item-url" title={bookmark.url}>
                          {renderHighlighted(bookmark.url, searchQuery)}
                        </div>
                        {bookmarkTags.length > 0 && (
                          <div className="add-bookmark-modal__item-tags">
                            {bookmarkTags.slice(0, 2).map((tag) => (
                              <TagPill key={tag.id} label={tag.name} color={tag.color} size="small" />
                            ))}
                            {bookmarkTags.length > 2 && (
                              <span className="add-bookmark-modal__item-tags-more">
                                +{bookmarkTags.length - 2}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="add-bookmark-modal__item-action">
                        {isDisabled ? (
                          <span className="add-bookmark-modal__status-added">
                            {t('workstation.alreadyAdded')}
                          </span>
                        ) : (
                          <button
                            type="button"
                            className={`add-bookmark-modal__btn-add ${isSelected ? 'selected' : ''}`}
                            onClick={() => (isSelected ? void handleRemove(bookmark.id) : void handleAdd(bookmark.id))}
                            aria-label={isSelected ? t('common.delete') : t('workstation.addBookmark')}
                            title={isSelected ? t('common.delete') : t('workstation.addBookmark')}
                          >
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path
                                d="M8 3.33333V12.6667M3.33333 8H12.6667"
                                stroke="currentColor"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
