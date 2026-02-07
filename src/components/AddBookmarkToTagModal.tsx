import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { SearchInput } from './SearchInput';
import { TagPill } from './TagPill';
import { updateBookmark } from '../lib/bookmarkService';
import type { BookmarkItem, Tag } from '../lib/types';
import './addBookmarkToTagModal.css';

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
      <span key={`${hitIndex}-${i}`} className="add-bookmark-tag-modal__highlight">
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

interface AddBookmarkToTagModalProps {
  isOpen: boolean;
  onClose: () => void;
  tagId: string;
  tag: Tag;
  bookmarks: BookmarkItem[];
  tags: Tag[];
}

export const AddBookmarkToTagModal = ({
  isOpen,
  onClose,
  tagId,
  tag,
  bookmarks,
  tags
}: AddBookmarkToTagModalProps) => {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const initialBookmarkIdsRef = useRef<string[]>([]);
  const [currentBookmarkIds, setCurrentBookmarkIds] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen && tagId) {
      const ids = bookmarks.filter((b) => (b.tags ?? []).includes(tagId)).map((b) => b.id);
      initialBookmarkIdsRef.current = ids;
      setCurrentBookmarkIds(ids);
      setSearchQuery('');
    }
  }, [isOpen, tagId, bookmarks]);

  const tagById = useMemo(() => {
    const map = new Map<string, Tag>();
    tags.forEach((tagItem) => map.set(tagItem.id, tagItem));
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

  const removedThisSessionIds = useMemo(() => {
    const current = new Set(currentBookmarkIds);
    return initialBookmarkIdsRef.current.filter((id) => !current.has(id));
  }, [currentBookmarkIds]);

  const selectedBookmarks = useMemo(() => {
    const idSet = new Set(selectedThisSessionIds);
    return bookmarks.filter((b) => idSet.has(b.id));
  }, [bookmarks, selectedThisSessionIds]);

  const handleAdd = async (bookmarkId: string) => {
    const bookmark = bookmarks.find((b) => b.id === bookmarkId);
    if (!bookmark) return;
    const newTags = [...(bookmark.tags ?? []), tagId];
    await updateBookmark(bookmarkId, {
      title: bookmark.title,
      url: bookmark.url,
      tags: newTags,
      pinned: bookmark.pinned
    });
    setCurrentBookmarkIds((prev) => [...prev, bookmarkId]);
  };

  const handleRemove = async (bookmarkId: string) => {
    const bookmark = bookmarks.find((b) => b.id === bookmarkId);
    if (!bookmark) return;
    const newTags = (bookmark.tags ?? []).filter((id) => id !== tagId);
    await updateBookmark(bookmarkId, {
      title: bookmark.title,
      url: bookmark.url,
      tags: newTags,
      pinned: bookmark.pinned
    });
    setCurrentBookmarkIds((prev) => prev.filter((id) => id !== bookmarkId));
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
      className="add-bookmark-tag-modal__backdrop"
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-bookmark-tag-modal-title"
    >
      <div className="add-bookmark-tag-modal" onClick={(e) => e.stopPropagation()}>
        <div className="add-bookmark-tag-modal__header">
          <h2 id="add-bookmark-tag-modal-title" className="add-bookmark-tag-modal__title">
            {t('tag.addBookmark')}: {tag.name}
          </h2>
          <button
            type="button"
            className="add-bookmark-tag-modal__close"
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

        <div className="add-bookmark-tag-modal__content">
          <div className="add-bookmark-tag-modal__search">
            <SearchInput
              value={searchQuery}
              placeholder={t('bookmark.searchPlaceholder')}
              onChange={setSearchQuery}
            />
          </div>

          {selectedBookmarks.length > 0 && (
            <div className="add-bookmark-tag-modal__section">
              <div className="add-bookmark-tag-modal__section-title">
                {t('workstation.selectedThisSession')}
              </div>
              <div className="add-bookmark-tag-modal__list">
                {selectedBookmarks.map((bookmark) => {
                  const bookmarkTags = (bookmark.tags ?? [])
                    .map((id) => tagById.get(id))
                    .filter((t): t is Tag => Boolean(t));
                  return (
                    <div key={bookmark.id} className="add-bookmark-tag-modal__item">
                      <div className="add-bookmark-tag-modal__item-main">
                        <div className="add-bookmark-tag-modal__item-title" title={bookmark.title}>
                          {renderHighlighted(bookmark.title, searchQuery)}
                        </div>
                        <div className="add-bookmark-tag-modal__item-url" title={bookmark.url}>
                          {renderHighlighted(bookmark.url, searchQuery)}
                        </div>
                        {bookmarkTags.length > 0 && (
                          <div className="add-bookmark-tag-modal__item-tags">
                            {bookmarkTags.slice(0, 2).map((tagItem) => (
                              <TagPill key={tagItem.id} label={tagItem.name} color={tagItem.color} size="small" />
                            ))}
                            {bookmarkTags.length > 2 && (
                              <span className="add-bookmark-tag-modal__item-tags-more">
                                +{bookmarkTags.length - 2}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="add-bookmark-tag-modal__item-action">
                        <button
                          type="button"
                          className="add-bookmark-tag-modal__btn-add selected"
                          onClick={() => void handleRemove(bookmark.id)}
                          aria-label={t('tag.addBookmark')}
                          title={t('tag.addBookmark')}
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

          <div className="add-bookmark-tag-modal__section">
            <div className="add-bookmark-tag-modal__section-title">
              {searchQueryNorm ? t('bookmark.title') : t('bookmark.pinnedBookmarks')}
            </div>
            <div className="add-bookmark-tag-modal__list">
              {resultBookmarks.length === 0 ? (
                <div className="add-bookmark-tag-modal__empty">{t('bookmark.noMatch')}</div>
              ) : (
                resultBookmarks.map((bookmark) => {
                  const hasTag = currentSet.has(bookmark.id);
                  const hadTagInitially = initialSet.has(bookmark.id);
                  const isDisabled = hadTagInitially && !removedThisSessionIds.includes(bookmark.id);
                  const isSelected = hasTag && !hadTagInitially;
                  const bookmarkTags = (bookmark.tags ?? [])
                    .map((id) => tagById.get(id))
                    .filter((t): t is Tag => Boolean(t));

                  return (
                    <div key={bookmark.id} className="add-bookmark-tag-modal__item">
                      <div className="add-bookmark-tag-modal__item-main">
                        <div className="add-bookmark-tag-modal__item-title" title={bookmark.title}>
                          {renderHighlighted(bookmark.title, searchQuery)}
                        </div>
                        <div className="add-bookmark-tag-modal__item-url" title={bookmark.url}>
                          {renderHighlighted(bookmark.url, searchQuery)}
                        </div>
                        {bookmarkTags.length > 0 && (
                          <div className="add-bookmark-tag-modal__item-tags">
                            {bookmarkTags.slice(0, 2).map((tagItem) => (
                              <TagPill key={tagItem.id} label={tagItem.name} color={tagItem.color} size="small" />
                            ))}
                            {bookmarkTags.length > 2 && (
                              <span className="add-bookmark-tag-modal__item-tags-more">
                                +{bookmarkTags.length - 2}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="add-bookmark-tag-modal__item-action">
                        {isDisabled ? (
                          <span className="add-bookmark-tag-modal__status-added">
                            {t('workstation.alreadyAdded')}
                          </span>
                        ) : (
                          <button
                            type="button"
                            className={`add-bookmark-tag-modal__btn-add ${hasTag ? 'selected' : ''}`}
                            onClick={() => (hasTag ? void handleRemove(bookmark.id) : void handleAdd(bookmark.id))}
                            aria-label={hasTag ? t('common.delete') : t('tag.addBookmark')}
                            title={hasTag ? t('common.delete') : t('tag.addBookmark')}
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
