import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { IconButton } from './IconButton';
import { TagInput } from './TagInput';
import { WorkstationInput } from './WorkstationInput';
import { updateBookmark } from '../lib/bookmarkService';
import { addBookmarkToWorkstation, removeBookmarkFromWorkstation } from '../lib/workstationService';
import type { BookmarkItem, Tag, Workstation } from '../lib/types';
import './bookmarkEditSidebar.css';

interface BookmarkEditSidebarProps {
  bookmark: BookmarkItem;
  workstations: Workstation[];
  tags: Tag[];
  onClose: () => void;
  onBookmarkUpdated: () => void;
  onDelete: (bookmarkId: string) => Promise<void>;
}

export const BookmarkEditSidebar = ({
  bookmark,
  workstations,
  tags,
  onClose,
  onBookmarkUpdated,
  onDelete
}: BookmarkEditSidebarProps) => {
  const { t } = useTranslation();
  const [title, setTitle] = useState(bookmark.title);
  const [url, setUrl] = useState(bookmark.url);
  const [tagIds, setTagIds] = useState<string[]>(bookmark.tags);
  const [pinned, setPinned] = useState(bookmark.pinned);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const urlInputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setTitle(bookmark.title);
    setUrl(bookmark.url);
    setTagIds(bookmark.tags);
    setPinned(bookmark.pinned);
  }, [bookmark.id, bookmark.title, bookmark.url, bookmark.tags, bookmark.pinned]);

  const includedWorkstationIds = useMemo(
    () => workstations.filter((w) => w.bookmarks.includes(bookmark.id)).map((w) => w.id),
    [workstations, bookmark.id]
  );

  const saveBookmark = useCallback(
    async (payload: { title?: string; url?: string; tags?: string[]; pinned?: boolean }) => {
      const updated = await updateBookmark(bookmark.id, {
        title: payload.title ?? title,
        url: payload.url ?? url,
        tags: payload.tags ?? tagIds,
        pinned: payload.pinned ?? pinned
      });
      if (updated) void onBookmarkUpdated();
    },
    [bookmark.id, title, url, tagIds, pinned, onBookmarkUpdated]
  );

  const handleTitleBlur = useCallback(() => {
    const trimmed = title.trim() || bookmark.title;
    if (trimmed !== bookmark.title || url !== bookmark.url || tagIds !== bookmark.tags || pinned !== bookmark.pinned) {
      void saveBookmark({ title: trimmed, url, tags: tagIds, pinned });
    }
  }, [title, url, tagIds, pinned, bookmark.title, bookmark.url, bookmark.tags, bookmark.pinned, saveBookmark]);

  const handleUrlBlur = useCallback(() => {
    const trimmed = url.trim() || bookmark.url;
    if (title !== bookmark.title || trimmed !== bookmark.url || tagIds !== bookmark.tags || pinned !== bookmark.pinned) {
      void saveBookmark({ title, url: trimmed, tags: tagIds, pinned });
    }
  }, [title, url, tagIds, pinned, bookmark.title, bookmark.url, bookmark.tags, bookmark.pinned, saveBookmark]);

  const handleTagsChange = useCallback(
    (next: string[]) => {
      setTagIds(next);
      void saveBookmark({ tags: next });
    },
    [saveBookmark]
  );

  const handlePinnedChange = useCallback(
    (next: boolean) => {
      setPinned(next);
      void saveBookmark({ pinned: next });
    },
    [saveBookmark]
  );

  const handleWorkstationIdsChange = useCallback(
    async (nextIds: string[]) => {
      const toRemove = includedWorkstationIds.filter((id) => !nextIds.includes(id));
      const toAdd = nextIds.filter((id) => !includedWorkstationIds.includes(id));
      for (const id of toRemove) {
        await removeBookmarkFromWorkstation(id, bookmark.id);
      }
      for (const id of toAdd) {
        await addBookmarkToWorkstation(id, bookmark.id);
      }
      void onBookmarkUpdated();
    },
    [bookmark.id, includedWorkstationIds, onBookmarkUpdated]
  );

  const handleDelete = useCallback(async () => {
    const confirmed = window.confirm(t('bookmark.deleteConfirm'));
    if (!confirmed) return;
    await onDelete(bookmark.id);
    onClose();
  }, [bookmark.id, onDelete, onClose, t]);

  const resizeUrlTextarea = useCallback(() => {
    const el = urlInputRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, []);

  useEffect(() => {
    resizeUrlTextarea();
  }, [url, resizeUrlTextarea]);

  return (
    <div className="bookmark-edit-sidebar">
      <div className="bookmark-edit-sidebar__main-info">
        <div className="bookmark-edit-sidebar__title-row">
          <input
            ref={titleInputRef}
            type="text"
            className="bookmark-edit-sidebar__title-input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleTitleBlur}
            placeholder={t('bookmark.titlePlaceholder')}
            aria-label={t('bookmark.titleLabel')}
          />
          <button
            type="button"
            className="bookmark-edit-sidebar__close"
            onClick={onClose}
            aria-label={t('bookmark.closeSidebar')}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M12 4L4 12M4 4L12 12"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>

        <div className="bookmark-edit-sidebar__field">
          <label className="bookmark-edit-sidebar__label">{t('bookmark.urlLabel')}</label>
          <textarea
            ref={urlInputRef}
            className="bookmark-edit-sidebar__url-input"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onBlur={handleUrlBlur}
            placeholder={t('bookmark.urlPlaceholder')}
            aria-label={t('bookmark.urlLabel')}
            rows={2}
          />
        </div>

        <div className="bookmark-edit-sidebar__field">
          <label className="bookmark-edit-sidebar__label">{t('bookmark.tagsLabel')}</label>
          <TagInput value={tagIds} onChange={handleTagsChange} />
        </div>

        <div className="bookmark-edit-sidebar__field">
          <label className="bookmark-edit-sidebar__label">{t('workstation.workstationIncluded')}</label>
          <WorkstationInput
            value={includedWorkstationIds}
            workstations={workstations}
            onChange={handleWorkstationIdsChange}
          />
        </div>

        <div className="bookmark-edit-sidebar__main-actions">
          <IconButton
            variant={pinned ? 'primary' : 'secondary'}
            icon={
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M3.33333 13.3334L8 8.66671L12.6667 13.3334V3.33337C12.6667 2.89135 12.4911 2.46742 12.1785 2.15486C11.866 1.8423 11.442 1.66671 11 1.66671H5C4.55797 1.66671 4.13405 1.8423 3.82149 2.15486C3.50893 2.46742 3.33333 2.89135 3.33333 3.33337V13.3334Z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill={pinned ? 'currentColor' : 'none'}
                />
              </svg>
            }
            aria-label={pinned ? t('common.unpin') : t('common.pin')}
            onClick={() => handlePinnedChange(!pinned)}
          />
          <IconButton
            variant="danger"
            icon={
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M2 4H14M5 4V3C5 2.44772 5.44772 2 6 2H10C10.5523 2 11 2.44772 11 3V4M13 4V13C13 13.5523 12.5523 14 12 14H4C3.44772 14 3 13.5523 3 13V4H13Z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            }
            aria-label={t('bookmark.delete')}
            onClick={() => void handleDelete()}
          />
        </div>
      </div>
    </div>
  );
};
