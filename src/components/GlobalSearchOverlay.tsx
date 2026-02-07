import { useEffect, useMemo, useState, useRef, type ReactNode, type KeyboardEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { getAllBookmarks, getAllTags, incrementBookmarkClick } from '../lib/bookmarkService';
import { openUrlWithMode, openUrlsWithMode } from '../lib/chrome';
import { getBrowserDefaultOpenMode, getBrowserTagWorkstationOpenMode, getTagsMap, saveTagsMap } from '../lib/storage';
import type { Tag, BookmarkItem } from '../lib/types';
import { useClickDoubleClick } from '../lib/hooks/useClickDoubleClick';
import { SearchInput } from './SearchInput';
import { TagPill } from './TagPill';
import './globalSearchOverlay.css';

type BookmarkSearchResult = { bookmark: BookmarkItem; matchScore: number; sortScore: number };
type TagSearchResult = { tag: Tag; matchScore: number; sortScore: number };

const normalizeQuery = (q: string) => q.trim().toLowerCase();
const includesCI = (text: string | undefined, q: string) => {
  if (!text) return false;
  return text.toLowerCase().includes(q);
};

const renderHighlighted = (text: string, rawQuery: string, highlightClass: string): ReactNode => {
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
    parts.push(<span key={`${hitIndex}-${i}`} className={highlightClass}>{text.slice(hitIndex, hitIndex + query.length)}</span>);
    i = hitIndex + query.length;
  }
  return <>{parts}</>;
};

interface BookmarkResultItemProps {
  bookmark: BookmarkItem;
  tagById: Map<string, Tag>;
  searchQuery: string;
  onSingleClick: (bookmark: BookmarkItem) => void;
  onDoubleClick: (bookmark: BookmarkItem) => void;
}

const BookmarkResultItem = ({ bookmark, tagById, searchQuery, onSingleClick, onDoubleClick }: BookmarkResultItemProps) => {
  const tags = (bookmark.tags ?? []).map((id) => tagById.get(id)).filter((t): t is Tag => Boolean(t));
  const visibleTags = tags.slice(0, 2);
  const remainingCount = Math.max(0, tags.length - visibleTags.length);
  const { handleClick, handleDoubleClick } = useClickDoubleClick({
    onClick: () => onSingleClick(bookmark),
    onDoubleClick: () => void onDoubleClick(bookmark),
  });
  const hl = (text: string, raw: string) => renderHighlighted(text, raw, 'global-search__highlight');
  return (
    <button type="button" className="global-search__bookmark-item" onClick={handleClick} onDoubleClick={handleDoubleClick}>
      <div className="global-search__bookmark-main">
        <div className="global-search__bookmark-title" title={bookmark.title}>{hl(bookmark.title, searchQuery)}</div>
        <div className="global-search__bookmark-url" title={bookmark.url}>{hl(bookmark.url, searchQuery)}</div>
      </div>
      {(visibleTags.length > 0 || remainingCount > 0) && (
        <div className="global-search__bookmark-tags" aria-label="tags">
          {visibleTags.map((t) => <TagPill key={t.id} label={t.name} color={t.color} size="small" />)}
          {remainingCount > 0 && <span className="global-search__bookmark-tags-more">+{remainingCount}</span>}
        </div>
      )}
    </button>
  );
};

interface TagResultItemProps {
  tag: Tag;
  searchQuery: string;
  onSingleClick: (tagId: string) => void;
  onDoubleClick: (tagId: string) => void;
}

const TagResultItem = ({ tag, searchQuery, onSingleClick, onDoubleClick }: TagResultItemProps) => {
  const { t } = useTranslation();
  const { handleClick, handleDoubleClick } = useClickDoubleClick({
    onClick: () => onSingleClick(tag.id),
    onDoubleClick: () => void onDoubleClick(tag.id),
  });
  const hl = (text: string, raw: string) => renderHighlighted(text, raw, 'global-search__highlight');
  return (
    <button type="button" className="global-search__tag-item" onClick={handleClick} onDoubleClick={handleDoubleClick}>
      <span className="global-search__tag-dot" style={{ backgroundColor: tag.color }} aria-hidden="true" />
      <div className="global-search__tag-main">
        <div className="global-search__tag-title" title={tag.name}>{hl(tag.name, searchQuery)}</div>
        <div className="global-search__tag-desc" title={tag.description ?? ''}>
          {tag.description ? hl(tag.description, searchQuery) : <span className="global-search__tag-desc-empty">{t('tag.noDescription')}</span>}
        </div>
      </div>
    </button>
  );
};

export interface GlobalSearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToBookmarks: (params?: { tag?: string; query?: string }) => void;
}

export const GlobalSearchOverlay = ({ isOpen, onClose, onNavigateToBookmarks }: GlobalSearchOverlayProps) => {
  const { t } = useTranslation();
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const resultsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const load = async () => {
      try {
        const [bookmarksData, tagsData] = await Promise.all([getAllBookmarks(), getAllTags()]);
        setBookmarks(bookmarksData);
        setAllTags(tagsData);
      } catch (error) {
        console.error('Failed to load global search data:', error);
      }
    };
    void load();
    setSearchQuery('');
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  const tagById = useMemo(() => {
    const map = new Map<string, Tag>();
    allTags.forEach((tag) => map.set(tag.id, tag));
    return map;
  }, [allTags]);

  const { bookmarkResults, tagResults } = useMemo(() => {
    const q = normalizeQuery(searchQuery);
    if (!q) return { bookmarkResults: [] as BookmarkSearchResult[], tagResults: [] as TagSearchResult[] };
    const scoredBookmarks: BookmarkSearchResult[] = [];
    for (const bookmark of bookmarks) {
      const titleHit = includesCI(bookmark.title, q);
      const urlHit = includesCI(bookmark.url, q);
      const matchScore = (titleHit ? 1.2 : 0) + (urlHit ? 1.0 : 0);
      if (matchScore <= 0) continue;
      const sortScore = 0.75 * matchScore + 0.25 * (bookmark.clickCount ?? 0) / 100;
      scoredBookmarks.push({ bookmark, matchScore, sortScore });
    }
    scoredBookmarks.sort((a, b) => (b.sortScore - a.sortScore) || (b.bookmark.createdAt - a.bookmark.createdAt));
    const scoredTags: TagSearchResult[] = [];
    for (const tag of allTags) {
      const nameHit = includesCI(tag.name, q);
      const descHit = includesCI(tag.description ?? '', q);
      const matchScore = (nameHit ? 1.5 : 0) + (descHit ? 1.0 : 0);
      if (matchScore <= 0) continue;
      scoredTags.push({ tag, matchScore, sortScore: matchScore });
    }
    scoredTags.sort((a, b) => (b.sortScore - a.sortScore) || (b.tag.createdAt - a.tag.createdAt));
    return { bookmarkResults: scoredBookmarks, tagResults: scoredTags };
  }, [searchQuery, bookmarks, allTags]);

  const handleBookmarkSingle = (bookmark: BookmarkItem) => {
    onNavigateToBookmarks({ query: bookmark.title });
  };

  const handleBookmarkDouble = async (bookmark: BookmarkItem) => {
    await incrementBookmarkClick(bookmark.id);
    setBookmarks((prev) => prev.map((b) => (b.id === bookmark.id ? { ...b, clickCount: (b.clickCount ?? 0) + 1 } : b)));
    const mode = await getBrowserDefaultOpenMode();
    await openUrlWithMode(bookmark.url, mode);
  };

  const handleTagSingle = (tagId: string) => {
    onNavigateToBookmarks({ tag: tagId });
  };

  const handleTagDouble = async (tagId: string) => {
    const tagBookmarks = bookmarks.filter((b) => b.tags.includes(tagId));
    if (tagBookmarks.length === 0) return;
    const urls = tagBookmarks.map((b) => b.url).filter(Boolean);
    if (urls.length > 0) {
      const mode = await getBrowserTagWorkstationOpenMode();
      await openUrlsWithMode(urls, mode);
      const tagsMap = await getTagsMap();
      const targetTag = tagsMap[tagId];
      if (targetTag) {
        targetTag.clickCount += 1;
        targetTag.updatedAt = Date.now();
        await saveTagsMap(tagsMap);
      }
    }
  };

  const handleInputKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
      (e.currentTarget as HTMLInputElement).blur();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="global-search__backdrop" role="dialog" aria-modal="true" aria-label={t('common.search')}>
      <div className="global-search__panel" ref={resultsRef} tabIndex={-1}>
        <div className="global-search__topbar">
          <div className="global-search__input">
            <SearchInput
              value={searchQuery}
              placeholder={t('globalSearch.placeholder')}
              onChange={setSearchQuery}
              onKeyDown={handleInputKeyDown}
              autoFocus
            />
          </div>
          <button type="button" className="global-search__cancel" onClick={onClose}>
            {t('common.cancel')}
          </button>
        </div>
        <div className="global-search__results">
          {bookmarkResults.length > 0 && (
            <div className="global-search__section">
              <div className="global-search__section-title">{t('bookmark.title')}</div>
              <div className="global-search__list">
                {bookmarkResults.map(({ bookmark }) => (
                  <BookmarkResultItem
                    key={bookmark.id}
                    bookmark={bookmark}
                    tagById={tagById}
                    searchQuery={searchQuery}
                    onSingleClick={handleBookmarkSingle}
                    onDoubleClick={handleBookmarkDouble}
                  />
                ))}
              </div>
            </div>
          )}
          {tagResults.length > 0 && (
            <div className="global-search__section">
              <div className="global-search__section-title">{t('tag.title')}</div>
              <div className="global-search__list">
                {tagResults.map(({ tag }) => (
                  <TagResultItem
                    key={tag.id}
                    tag={tag}
                    searchQuery={searchQuery}
                    onSingleClick={handleTagSingle}
                    onDoubleClick={handleTagDouble}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
