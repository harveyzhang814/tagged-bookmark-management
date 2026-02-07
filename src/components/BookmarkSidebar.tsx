import { useCallback, useMemo, useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { ColorPicker } from './ColorPicker';
import { IconButton } from './IconButton';
import { SearchInput } from './SearchInput';
import { SortDropdown, type SortField } from './SortDropdown';
import { TagPill } from './TagPill';
import { incrementBookmarkClick, updateTag } from '../lib/bookmarkService';
import { openUrlWithMode, openUrlsWithMode } from '../lib/chrome';
import type { BookmarkItem, Tag } from '../lib/types';
import { getBrowserDefaultOpenMode, getBrowserTagWorkstationOpenMode } from '../lib/storage';
import './bookmarkSidebar.css';

type SortOption = 'createdAt' | 'clickCount';

interface BookmarkSidebarProps {
  tagId: string | null;
  tag?: Tag | null;
  bookmarks: BookmarkItem[];
  tags: Tag[];
  onClose?: () => void;
  onRemoveTag?: (bookmarkId: string, tagId: string) => Promise<void>;
  onRefresh?: () => Promise<void>;
  onTagUpdated?: () => void;
  onAddBookmarkClick?: () => void;
  onDeleteClick?: (tag: Tag) => void;
}

export const BookmarkSidebar = ({
  tagId,
  tag: tagProp,
  bookmarks,
  tags,
  onClose,
  onRemoveTag,
  onRefresh,
  onTagUpdated,
  onAddBookmarkClick,
  onDeleteClick
}: BookmarkSidebarProps) => {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('createdAt');
  const dragStartTime = useRef<number>(0);

  const selectedTag = useMemo(() => tagProp ?? tags.find((t) => t.id === tagId), [tagProp, tagId, tags]);

  // 主信息区：本地编辑 state，以 tag 为初始值
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('');
  const [pinned, setPinned] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [editingDescription, setEditingDescription] = useState(false);
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const descriptionInputRef = useRef<HTMLTextAreaElement>(null);
  const colorTriggerRef = useRef<HTMLButtonElement>(null);
  const colorPopoverRef = useRef<HTMLDivElement>(null);
  const [colorPopoverPosition, setColorPopoverPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (selectedTag) {
      setName(selectedTag.name);
      setDescription(selectedTag.description ?? '');
      setColor(selectedTag.color);
      setPinned(selectedTag.pinned);
    }
  }, [selectedTag?.id, selectedTag?.name, selectedTag?.description, selectedTag?.color, selectedTag?.pinned]);

  useEffect(() => {
    if (editingTitle) titleInputRef.current?.focus();
  }, [editingTitle]);

  const resizeDescriptionTextarea = useCallback(() => {
    const el = descriptionInputRef.current;
    if (!el) return;
    el.style.height = 'auto';
    const max = 200;
    el.style.height = `${Math.min(el.scrollHeight, max)}px`;
  }, []);

  useEffect(() => {
    if (editingDescription) {
      descriptionInputRef.current?.focus();
      const raf = requestAnimationFrame(() => resizeDescriptionTextarea());
      return () => cancelAnimationFrame(raf);
    }
  }, [editingDescription, resizeDescriptionTextarea]);

  useEffect(() => {
    if (editingDescription) resizeDescriptionTextarea();
  }, [description, editingDescription, resizeDescriptionTextarea]);

  const saveMainInfo = useCallback(
    async (payload: { name?: string; description?: string; color?: string; pinned?: boolean }) => {
      if (!tagId) return;
      const updated = await updateTag(tagId, payload);
      if (updated) void onTagUpdated?.();
    },
    [tagId, onTagUpdated]
  );

  const commitTitle = useCallback(() => {
    if (!tagId || !selectedTag) return;
    const trimmedName = name.trim() || selectedTag.name;
    const nextDesc = description.trim() || undefined;
    const same =
      trimmedName === selectedTag.name &&
      nextDesc === (selectedTag.description ?? '') &&
      pinned === selectedTag.pinned &&
      color === selectedTag.color;
    if (!same) {
      void saveMainInfo({ name: trimmedName, description: nextDesc, pinned, color });
    }
    setEditingTitle(false);
  }, [tagId, selectedTag, name, description, pinned, color, saveMainInfo]);

  const commitDescription = useCallback(() => {
    if (!tagId || !selectedTag) return;
    const trimmedName = name.trim() || selectedTag.name;
    const trimmedDesc = description.trim() || undefined;
    const same =
      trimmedName === selectedTag.name &&
      trimmedDesc === (selectedTag.description ?? '') &&
      pinned === selectedTag.pinned &&
      color === selectedTag.color;
    if (!same) {
      void saveMainInfo({ name: trimmedName, description: trimmedDesc, pinned, color });
    }
    setEditingDescription(false);
  }, [tagId, selectedTag, name, description, pinned, color, saveMainInfo]);

  const handleNameBlur = () => {
    commitTitle();
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      commitTitle();
    }
  };

  const handleDescriptionBlur = () => {
    commitDescription();
  };

  const handlePinnedChange = (next: boolean) => {
    setPinned(next);
    if (tagId) void saveMainInfo({ name: name.trim(), description: description.trim() || undefined, pinned: next, color });
  };

  const handleColorChange = (nextColor: string) => {
    setColor(nextColor);
    if (tagId) void saveMainInfo({ name: name.trim(), description: description.trim() || undefined, pinned, color: nextColor });
  };

  const updateColorPopoverPosition = useCallback(() => {
    if (colorTriggerRef.current) {
      const triggerRect = colorTriggerRef.current.getBoundingClientRect();
      const popoverWidth = 280;
      const popoverHeight = 280;
      const gap = 8;
      // 侧边栏在右侧，popover 优先显示在 trigger 左方
      let left = triggerRect.left - popoverWidth - gap;
      let top = triggerRect.top;
      if (left < 20) {
        left = triggerRect.right - popoverWidth;
        if (left < 20) left = 20;
      }
      if (top + popoverHeight > window.innerHeight - 20) {
        top = window.innerHeight - popoverHeight - 20;
      }
      if (top < 20) top = 20;
      setColorPopoverPosition({ top, left });
    }
  }, []);

  useEffect(() => {
    if (isColorPickerOpen) {
      updateColorPopoverPosition();
    }
  }, [isColorPickerOpen, updateColorPopoverPosition]);

  useEffect(() => {
    if (isColorPickerOpen) {
      const handleResize = () => updateColorPopoverPosition();
      const handleScroll = () => updateColorPopoverPosition();
      window.addEventListener('resize', handleResize);
      window.addEventListener('scroll', handleScroll, true);
      return () => {
        window.removeEventListener('resize', handleResize);
        window.removeEventListener('scroll', handleScroll, true);
      };
    }
  }, [isColorPickerOpen, updateColorPopoverPosition]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        isColorPickerOpen &&
        colorTriggerRef.current &&
        !colorTriggerRef.current.contains(target) &&
        colorPopoverRef.current &&
        !colorPopoverRef.current.contains(target)
      ) {
        setIsColorPickerOpen(false);
      }
    };
    if (isColorPickerOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isColorPickerOpen]);

  // 根据 tagId 过滤书签
  const filteredByTag = useMemo(() => {
    if (!tagId) return [];
    return bookmarks.filter((bookmark) => bookmark.tags.includes(tagId));
  }, [bookmarks, tagId]);

  // 搜索过滤
  const filteredBySearch = useMemo(() => {
    if (!searchQuery.trim()) {
      return filteredByTag;
    }
    const query = searchQuery.toLowerCase();
    return filteredByTag.filter((bookmark) => {
      const text = `${bookmark.title} ${bookmark.url}`.toLowerCase();
      return text.includes(query);
    });
  }, [filteredByTag, searchQuery]);

  // 排序
  const sorted = useMemo(() => {
    const sortedList = [...filteredBySearch];
    if (sortBy === 'createdAt') {
      return sortedList.sort((a, b) => b.createdAt - a.createdAt);
    }
    if (sortBy === 'clickCount') {
      return sortedList.sort((a, b) => b.clickCount - a.clickCount);
    }
    return sortedList;
  }, [filteredBySearch, sortBy]);

  const handleOpenAll = useCallback(async () => {
    const urls = sorted.map((b) => b.url).filter(Boolean);
    if (urls.length === 0) return;
    const mode = await getBrowserTagWorkstationOpenMode();
    await openUrlsWithMode(urls, mode);
  }, [sorted]);

  useEffect(() => {
    setSearchQuery('');
  }, [tagId]);

  const handleBookmarkClick = async (bookmark: BookmarkItem) => {
    await incrementBookmarkClick(bookmark.id);
    const mode = await getBrowserDefaultOpenMode();
    await openUrlWithMode(bookmark.url, mode);
  };

  const handleDragStart = (e: React.DragEvent, bookmarkId: string) => {
    dragStartTime.current = Date.now();
    e.dataTransfer.setData('bookmarkId', bookmarkId);
    e.dataTransfer.setData('source', 'bookmarkSidebar');
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    dragStartTime.current = 0;
  };

  const handleItemClick = async (bookmark: BookmarkItem, e: React.MouseEvent) => {
    const timeSinceDragStart = Date.now() - dragStartTime.current;
    if (timeSinceDragStart < 300 && dragStartTime.current > 0) {
      e.preventDefault();
      e.stopPropagation();
      dragStartTime.current = 0;
      return;
    }
    await handleBookmarkClick(bookmark);
  };

  if (!tagId || !selectedTag) {
    return null;
  }

  const hasEditProps = Boolean(onTagUpdated);

  return (
    <div className="bookmark-sidebar">
      {/* 主信息区：标题、描述、颜色、置顶、关闭、删除 */}
      <div className="bookmark-sidebar__main-info">
        <div className="bookmark-sidebar__title-row">
          {hasEditProps && editingTitle ? (
            <input
              ref={titleInputRef}
              type="text"
              className="bookmark-sidebar__title-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={handleNameBlur}
              onKeyDown={handleTitleKeyDown}
              placeholder={t('tag.namePlaceholder')}
              aria-label={t('tag.nameLabel')}
            />
          ) : (
            <button
              type="button"
              className="bookmark-sidebar__title-display"
              onClick={() => hasEditProps && setEditingTitle(true)}
              aria-label={hasEditProps ? t('common.edit') : undefined}
            >
              <span className="bookmark-sidebar__title-display__text">
                {name.trim() || t('tag.namePlaceholder')}
              </span>
            </button>
          )}
          {onClose && (
            <button
              type="button"
              className="bookmark-sidebar__close"
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
          )}
        </div>
        {hasEditProps ? (
          editingDescription ? (
            <textarea
              ref={descriptionInputRef}
              className="bookmark-sidebar__description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onBlur={handleDescriptionBlur}
              placeholder={t('tag.descriptionPlaceholder')}
              aria-label={t('tag.descriptionLabel')}
              rows={1}
            />
          ) : (
            <button
              type="button"
              className={`bookmark-sidebar__description-display ${!description.trim() ? 'bookmark-sidebar__description-display--placeholder' : ''}`}
              onClick={() => setEditingDescription(true)}
              aria-label={t('common.edit')}
            >
              <span className="bookmark-sidebar__description-display__text">
                {description.trim() ? description : t('tag.descriptionPlaceholder')}
              </span>
            </button>
          )
        ) : (
          description.trim() ? (
            <p className="bookmark-sidebar__description-display__text">{description}</p>
          ) : null
        )}
        {hasEditProps && (
          <div className="bookmark-sidebar__tag-color-row">
            <TagPill label={name.trim() || t('tag.namePlaceholder')} color={color} size="small" />
            <div className="bookmark-sidebar__color-trigger-wrapper">
              <button
                ref={colorTriggerRef}
                type="button"
                className="bookmark-sidebar__color-trigger"
                onClick={() => setIsColorPickerOpen((prev) => !prev)}
                aria-expanded={isColorPickerOpen}
                aria-haspopup="dialog"
                aria-label={t('tag.colorLabel')}
              >
                <span
                  className="bookmark-sidebar__color-trigger-swatch"
                  style={{ backgroundColor: color || '#ccc' }}
                />
                <svg
                  className={`bookmark-sidebar__color-trigger-arrow ${isColorPickerOpen ? 'bookmark-sidebar__color-trigger-arrow--open' : ''}`}
                  width="12"
                  height="12"
                  viewBox="0 0 12 12"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M3 4.5L6 7.5L9 4.5"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
              {isColorPickerOpen && (
                <div
                  ref={colorPopoverRef}
                  className="bookmark-sidebar__color-popover"
                  style={{
                    top: `${colorPopoverPosition.top}px`,
                    left: `${colorPopoverPosition.left}px`
                  }}
                >
                  <ColorPicker value={color} onChange={handleColorChange} />
                </div>
              )}
            </div>
          </div>
        )}
        <div className="bookmark-sidebar__main-actions">
          {hasEditProps && (
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
          )}
          <IconButton
            variant="secondary"
            icon={
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M6 3H3v10h10v-3M13 3l-5 5M13 3v3h-3"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            }
            aria-label={t('workstation.openAll')}
            onClick={() => void handleOpenAll()}
          />
          {onDeleteClick && (
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
              aria-label={t('tag.delete')}
              onClick={() => onDeleteClick(selectedTag)}
            />
          )}
        </div>
      </div>

      {/* 绑定书签区：搜索、排序、添加按钮同一行；列表可滚动不分页 */}
      <div className="bookmark-sidebar__bind-area">
        <div className="bookmark-sidebar__toolbar">
          <div className="bookmark-sidebar__search">
            <SearchInput
              value={searchQuery}
              placeholder={t('bookmark.searchPlaceholder')}
              onChange={setSearchQuery}
            />
          </div>
          <SortDropdown
            sortBy={sortBy as SortField}
            sortOrder="desc"
            onSortByChange={(v) => setSortBy(v as SortOption)}
            onSortOrderToggle={() => {}}
            options={[
              { value: 'createdAt', label: t('sort.byCreatedAt') },
              { value: 'clickCount', label: t('sort.byClickCount') }
            ]}
          />
          {onAddBookmarkClick && (
            <button
              type="button"
              className="bookmark-sidebar__add-bookmark"
              onClick={onAddBookmarkClick}
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
          )}
        </div>

        <div className="bookmark-sidebar__content">
          {sorted.length === 0 ? (
            <div className="bookmark-sidebar__empty">
              {searchQuery ? t('bookmark.noMatch') : t('bookmark.noBookmarksInTag')}
            </div>
          ) : (
            <div className="bookmark-sidebar__list">
              {sorted.map((bookmark) => {
                const bookmarkTags = bookmark.tags
                  .filter((tId) => tId !== tagId)
                  .map((tId) => tags.find((t) => t.id === tId))
                  .filter((t): t is Tag => t !== undefined);

                return (
                  <div
                    key={bookmark.id}
                    className="bookmark-sidebar__item"
                    draggable={true}
                    onDragStart={(e) => handleDragStart(e, bookmark.id)}
                    onDragEnd={handleDragEnd}
                    onClick={(e) => handleItemClick(bookmark, e)}
                  >
                    <div className="bookmark-sidebar__item-header">
                      <h4 className="bookmark-sidebar__item-title">{bookmark.title}</h4>
                    </div>
                    <div className="bookmark-sidebar__item-meta">
                      {bookmarkTags.length > 0 && (
                        <div className="bookmark-sidebar__item-tags">
                          {bookmarkTags.map((tag) => (
                            <TagPill key={tag.id} label={tag.name} color={tag.color} size="small" />
                          ))}
                        </div>
                      )}
                      <div className="bookmark-sidebar__item-click-count">
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
                        <span>{bookmark.clickCount || 0}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
