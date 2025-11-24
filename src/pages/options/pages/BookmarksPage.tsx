import { useEffect, useMemo, useRef, useState } from 'react';
import { PixelButton } from '../../../components/PixelButton';
import { PixelCard } from '../../../components/PixelCard';
import { SearchInput } from '../../../components/SearchInput';
import { TagFilter } from '../../../components/TagFilter';
import { TagInput } from '../../../components/TagInput';
import { IconButton } from '../../../components/IconButton';
import { ToggleSwitch } from '../../../components/ToggleSwitch';
import { createBookmark, deleteBookmark, getAllBookmarks, getAllTags, importChromeBookmarks, updateBookmark } from '../../../lib/bookmarkService';
import type { BookmarkItem, Tag } from '../../../lib/types';
import './bookmarksPage.css';

const emptyForm = {
  title: '',
  url: '',
  tags: [] as string[],
  pinned: false
};

export const BookmarksPage = () => {
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [query, setQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [importStatus, setImportStatus] = useState<{
    isImporting: boolean;
    message: string | null;
    type: 'success' | 'error' | null;
  }>({
    isImporting: false,
    message: null,
    type: null
  });
  const saveTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const refresh = async () => {
    const [bookmarksList, tagsList] = await Promise.all([getAllBookmarks(), getAllTags()]);
    setBookmarks(bookmarksList);
    setTags(tagsList);
  };

  useEffect(() => {
    void refresh();
  }, []);

  useEffect(
    () => () => {
      Object.values(saveTimers.current).forEach((timer) => clearTimeout(timer));
    },
    []
  );

  const filtered = useMemo(() => {
    let list = bookmarks;
    if (query || selectedTags.length) {
      list = list.filter((bookmark) => {
        const q = query.toLowerCase();
        const text = `${bookmark.title} ${bookmark.url}`.toLowerCase();
        const matchQuery = query ? text.includes(q) : true;
        const matchTags = selectedTags.every((tagId) => bookmark.tags.includes(tagId));
        return matchQuery && matchTags;
      });
    }
    return list.sort((a, b) => b.updatedAt - a.updatedAt);
  }, [bookmarks, query, selectedTags]);

  const handleTagToggle = (tagId: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    );
  };

  const handleCreate = async () => {
    if (!form.title || !form.url) return;
    await createBookmark(form);
    setForm(emptyForm);
    await refresh();
  };

  const clearSaveTimer = (bookmarkId: string) => {
    const timer = saveTimers.current[bookmarkId];
    if (timer) {
      clearTimeout(timer);
      delete saveTimers.current[bookmarkId];
    }
  };

  const persistBookmark = async (bookmark: BookmarkItem) => {
    clearSaveTimer(bookmark.id);
    await updateBookmark(bookmark.id, {
      title: bookmark.title,
      url: bookmark.url,
      tags: bookmark.tags,
      pinned: bookmark.pinned
    });
  };

  const scheduleSave = (bookmark: BookmarkItem) => {
    clearSaveTimer(bookmark.id);
    saveTimers.current[bookmark.id] = setTimeout(() => {
      void persistBookmark(bookmark);
    }, 800);
  };

  const flushBookmarkChanges = (bookmarkId: string) => {
    const snapshot = bookmarks.find((item) => item.id === bookmarkId);
    if (snapshot) {
      void persistBookmark(snapshot);
    }
  };

  const handleBookmarkChange = (id: string, patch: Partial<BookmarkItem>) => {
    let updatedBookmark: BookmarkItem | null = null;
    setBookmarks((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        updatedBookmark = { ...item, ...patch };
        return updatedBookmark;
      })
    );
    if (updatedBookmark) {
      scheduleSave(updatedBookmark);
    }
  };

  const handleDelete = async (bookmarkId: string) => {
    clearSaveTimer(bookmarkId);
    await deleteBookmark(bookmarkId);
    await refresh();
  };

  const handleImport = async () => {
    setImportStatus({ isImporting: true, message: null, type: null });
    
    try {
      const result = await importChromeBookmarks();
      setImportStatus({
        isImporting: false,
        message: `导入完成！成功导入 ${result.imported} 个书签，跳过 ${result.skipped} 个已存在的书签。`,
        type: 'success'
      });
      await refresh();
      
      // 3秒后清除提示
      setTimeout(() => {
        setImportStatus((prev) => ({ ...prev, message: null, type: null }));
      }, 3000);
    } catch (error) {
      setImportStatus({
        isImporting: false,
        message: error instanceof Error ? error.message : '导入失败，请重试',
        type: 'error'
      });
      
      // 5秒后清除错误提示
      setTimeout(() => {
        setImportStatus((prev) => ({ ...prev, message: null, type: null }));
      }, 5000);
    }
  };


  return (
    <div className="bookmarks-page">
      <PixelCard title="新增收藏">
        <div className="bookmark-form">
          <input
            value={form.title}
            onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
            placeholder="网页标题"
          />
          <input
            value={form.url}
            onChange={(e) => setForm((prev) => ({ ...prev, url: e.target.value }))}
            placeholder="https://example.com"
          />
          <div className="form-field">
            <label>标签</label>
            <TagInput value={form.tags} onChange={(tagIds) => setForm((prev) => ({ ...prev, tags: tagIds }))} />
          </div>
          <ToggleSwitch
            checked={form.pinned}
            onChange={(checked) => setForm((prev) => ({ ...prev, pinned: checked }))}
            label="置顶"
          />
          <PixelButton onClick={handleCreate}>保存</PixelButton>
        </div>
      </PixelCard>

      <PixelCard title="功能">
        <div className="functions-panel">
          <div className="function-item">
            <div className="function-description">
              <h3>导入 Chrome 书签</h3>
              <p>一键导入 Chrome 收藏夹中的所有书签，已存在的书签会自动跳过</p>
            </div>
            <PixelButton 
              onClick={handleImport} 
              disabled={importStatus.isImporting}
            >
              {importStatus.isImporting ? '导入中...' : '一键导入'}
            </PixelButton>
          </div>
          {importStatus.message && (
            <div className={`import-message import-message--${importStatus.type}`}>
              {importStatus.message}
            </div>
          )}
        </div>
      </PixelCard>

      <PixelCard title="筛选">
        <div className="filter-panel">
          <SearchInput value={query} placeholder="搜索标题/url" onChange={setQuery} />
          <TagFilter tags={tags} selected={selectedTags} onToggle={handleTagToggle} />
        </div>
      </PixelCard>

      <div className="bookmark-list">
        {filtered.map((bookmark) => (
          <div key={bookmark.id} className="bookmark-row">
            <div className="bookmark-info">
              <input
                className="bookmark-title"
                value={bookmark.title}
                onChange={(e) => handleBookmarkChange(bookmark.id, { title: e.target.value })}
                onBlur={() => flushBookmarkChanges(bookmark.id)}
              />
              <div className="form-field">
                <label>URL</label>
                <input
                  className="bookmark-url-input"
                  value={bookmark.url}
                  onChange={(e) => handleBookmarkChange(bookmark.id, { url: e.target.value })}
                  onBlur={() => flushBookmarkChanges(bookmark.id)}
                />
              </div>
              <div className="form-field">
                <label>标签</label>
                <TagInput
                  value={bookmark.tags}
                  onChange={(tagIds) => handleBookmarkChange(bookmark.id, { tags: tagIds })}
                  onBlur={() => flushBookmarkChanges(bookmark.id)}
                />
              </div>
              <div className="bookmark-row-footer">
                <ToggleSwitch
                  checked={bookmark.pinned}
                  onChange={(checked) => handleBookmarkChange(bookmark.id, { pinned: checked })}
                  label="置顶"
                />
                <IconButton
                  variant="danger"
                  icon="×"
                  aria-label="删除收藏"
                  onClick={() => handleDelete(bookmark.id)}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};


