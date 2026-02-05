import { useCallback, useMemo, useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { SearchInput } from './SearchInput';
import { SortDropdown, type SortField } from './SortDropdown';
import { TagPill } from './TagPill';
import { ToggleSwitch } from './ToggleSwitch';
import { incrementBookmarkClick } from '../lib/bookmarkService';
import { updateWorkstation } from '../lib/workstationService';
import { openUrlWithMode } from '../lib/chrome';
import type { BookmarkItem, Tag, Workstation } from '../lib/types';
import { getBrowserDefaultOpenMode } from '../lib/storage';
import './bookmarkSidebar.css';

type SortOption = 'createdAt' | 'clickCount';

interface WorkstationBookmarkSidebarProps {
  workstationId: string | null;
  workstation: Workstation | null;
  bookmarks: BookmarkItem[];
  tags: Tag[];
  onClose?: () => void;
  onRemoveBookmark?: (bookmarkId: string) => Promise<void>;
  onRefresh?: () => Promise<void>;
  onAddBookmarkClick?: () => void;
  onWorkstationUpdated?: () => void;
  onDeleteClick?: (workstation: Workstation) => void;
}

export const WorkstationBookmarkSidebar = ({ 
  workstationId, 
  workstation,
  bookmarks, 
  tags, 
  onClose, 
  onRemoveBookmark,
  onRefresh,
  onAddBookmarkClick,
  onWorkstationUpdated,
  onDeleteClick
}: WorkstationBookmarkSidebarProps) => {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('createdAt');
  const dragStartTime = useRef<number>(0);

  // 主信息区：本地编辑 state，以 workstation 为初始值
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [pinned, setPinned] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [editingDescription, setEditingDescription] = useState(false);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const descriptionInputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (workstation) {
      setName(workstation.name);
      setDescription(workstation.description ?? '');
      setPinned(workstation.pinned);
    }
  }, [workstation?.id, workstation?.name, workstation?.description, workstation?.pinned]);

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
      const t = requestAnimationFrame(() => resizeDescriptionTextarea());
      return () => cancelAnimationFrame(t);
    }
  }, [editingDescription, resizeDescriptionTextarea]);

  useEffect(() => {
    if (editingDescription) resizeDescriptionTextarea();
  }, [description, editingDescription, resizeDescriptionTextarea]);

  const saveMainInfo = useCallback(
    async (payload: { name: string; description?: string; pinned: boolean }) => {
      if (!workstationId) return;
      const updated = await updateWorkstation(workstationId, payload);
      if (updated) void onWorkstationUpdated?.();
    },
    [workstationId, onWorkstationUpdated]
  );

  const commitTitle = useCallback(() => {
    if (!workstationId || !workstation) return;
    const trimmedName = name.trim() || workstation.name;
    const nextDesc = description.trim() || undefined;
    const same = trimmedName === workstation.name && nextDesc === (workstation.description ?? '') && pinned === workstation.pinned;
    if (!same) {
      void saveMainInfo({ name: trimmedName, description: nextDesc, pinned });
    }
    setEditingTitle(false);
  }, [workstationId, workstation, name, description, pinned, saveMainInfo]);

  const commitDescription = useCallback(() => {
    if (!workstationId || !workstation) return;
    const trimmedName = name.trim() || workstation.name;
    const trimmedDesc = description.trim() || undefined;
    const same = trimmedName === workstation.name && trimmedDesc === (workstation.description ?? '') && pinned === workstation.pinned;
    if (!same) {
      void saveMainInfo({ name: trimmedName, description: trimmedDesc, pinned });
    }
    setEditingDescription(false);
  }, [workstationId, workstation, name, description, pinned, saveMainInfo]);

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
    if (workstationId) void saveMainInfo({ name: name.trim(), description: description.trim() || undefined, pinned: next });
  };

  // 根据工作区的bookmarks数组过滤书签
  const filteredByWorkstation = useMemo(() => {
    if (!workstationId || !workstation) return [];
    const workstationBookmarkIds = new Set(workstation.bookmarks);
    return bookmarks.filter((bookmark) => workstationBookmarkIds.has(bookmark.id));
  }, [bookmarks, workstationId, workstation]);

  // 搜索过滤
  const filteredBySearch = useMemo(() => {
    if (!searchQuery.trim()) {
      return filteredByWorkstation;
    }
    const query = searchQuery.toLowerCase();
    return filteredByWorkstation.filter((bookmark) => {
      const text = `${bookmark.title} ${bookmark.url}`.toLowerCase();
      return text.includes(query);
    });
  }, [filteredByWorkstation, searchQuery]);

  // 排序
  const sorted = useMemo(() => {
    const sortedList = [...filteredBySearch];
    if (sortBy === 'createdAt') {
      return sortedList.sort((a, b) => b.createdAt - a.createdAt);
    } else if (sortBy === 'clickCount') {
      return sortedList.sort((a, b) => b.clickCount - a.clickCount);
    }
    return sortedList;
  }, [filteredBySearch, sortBy]);

  // 当 workstationId 改变时重置搜索
  useEffect(() => {
    setSearchQuery('');
  }, [workstationId]);

  const handleBookmarkClick = async (bookmark: BookmarkItem) => {
    await incrementBookmarkClick(bookmark.id);
    const mode = await getBrowserDefaultOpenMode();
    await openUrlWithMode(bookmark.url, mode);
  };

  const handleDragStart = (e: React.DragEvent, bookmarkId: string) => {
    dragStartTime.current = Date.now();
    e.dataTransfer.setData('bookmarkId', bookmarkId);
    e.dataTransfer.setData('source', 'workstationBookmarkSidebar');
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

  if (!workstationId || !workstation) {
    return null;
  }

  return (
    <div className="bookmark-sidebar">
      {/* 主信息区：标题、描述、置顶、关闭、删除 */}
      <div className="bookmark-sidebar__main-info">
        <div className="bookmark-sidebar__title-row">
          {editingTitle ? (
            <input
              ref={titleInputRef}
              type="text"
              className="bookmark-sidebar__title-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={handleNameBlur}
              onKeyDown={handleTitleKeyDown}
              placeholder={t('workstation.namePlaceholder')}
              aria-label={t('workstation.nameLabel')}
            />
          ) : (
            <button
              type="button"
              className="bookmark-sidebar__title-display"
              onClick={() => setEditingTitle(true)}
              aria-label={t('workstation.edit')}
            >
              <span className="bookmark-sidebar__title-display__text">
                {name.trim() || t('workstation.namePlaceholder')}
              </span>
            </button>
          )}
          {onClose && (
            <button
              type="button"
              className="bookmark-sidebar__close"
              onClick={onClose}
              aria-label={t('workstation.closeSidebar')}
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
        {editingDescription ? (
          <textarea
            ref={descriptionInputRef}
            className="bookmark-sidebar__description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onBlur={handleDescriptionBlur}
            placeholder={t('workstation.descriptionPlaceholder')}
            aria-label={t('workstation.descriptionLabel')}
            rows={1}
          />
        ) : (
          <button
            type="button"
            className={`bookmark-sidebar__description-display ${!description.trim() ? 'bookmark-sidebar__description-display--placeholder' : ''}`}
            onClick={() => setEditingDescription(true)}
            aria-label={t('workstation.edit')}
          >
            <span className="bookmark-sidebar__description-display__text">
              {description.trim() ? description : t('workstation.descriptionPlaceholder')}
            </span>
          </button>
        )}
        <div className="bookmark-sidebar__pinned-row">
          <ToggleSwitch
            checked={pinned}
            onChange={handlePinnedChange}
            label={t('workstation.pinnedLabel')}
          />
        </div>
        {onDeleteClick && (
          <button
            type="button"
            className="bookmark-sidebar__delete"
            onClick={() => onDeleteClick(workstation)}
          >
            {t('workstation.delete')}
          </button>
        )}
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
        )}
      </div>

      <div className="bookmark-sidebar__content">
        {sorted.length === 0 ? (
          <div className="bookmark-sidebar__empty">
            {searchQuery ? t('bookmark.noMatch') : t('workstation.noBookmarksInWorkstation')}
          </div>
        ) : (
          <div className="bookmark-sidebar__list">
            {sorted.map((bookmark) => {
              // 获取书签的所有标签
              const bookmarkTags = bookmark.tags
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
                  {bookmarkTags.length > 0 && (
                    <div className="bookmark-sidebar__item-tags">
                      {bookmarkTags.map((tag) => (
                        <TagPill key={tag.id} label={tag.name} color={tag.color} size="small" />
                      ))}
                    </div>
                  )}
                  <div className="bookmark-sidebar__item-footer">
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
