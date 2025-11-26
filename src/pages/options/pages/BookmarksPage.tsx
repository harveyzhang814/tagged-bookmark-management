import { useEffect, useMemo, useState } from 'react';
import { PixelButton } from '../../../components/PixelButton';
import { PixelCard } from '../../../components/PixelCard';
import { SearchInput } from '../../../components/SearchInput';
import { TagFilter } from '../../../components/TagFilter';
import { TagInput } from '../../../components/TagInput';
import { ToggleSwitch } from '../../../components/ToggleSwitch';
import { BookmarkCard } from '../../../components/BookmarkCard';
import { BookmarkEditModal } from '../../../components/BookmarkEditModal';
import { createBookmark, getAllBookmarks, getAllTags, importChromeBookmarks, updateBookmark } from '../../../lib/bookmarkService';
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
  const [editingBookmark, setEditingBookmark] = useState<BookmarkItem | null>(null);

  const refresh = async () => {
    const [bookmarksList, tagsList] = await Promise.all([getAllBookmarks(), getAllTags()]);
    setBookmarks(bookmarksList);
    setTags(tagsList);
  };

  useEffect(() => {
    void refresh();
  }, []);


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
    // 置顶的书签排在前面，然后按更新时间排序
    return list.sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return b.updatedAt - a.updatedAt;
    });
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

  const handleBookmarkChange = (id: string, patch: Partial<BookmarkItem>) => {
    let updatedBookmark: BookmarkItem | null = null;
    setBookmarks((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        updatedBookmark = { ...item, ...patch };
        return updatedBookmark;
      })
    );
    // 立即保存置顶状态变化
    if (updatedBookmark) {
      void updateBookmark(id, {
        title: updatedBookmark.title,
        url: updatedBookmark.url,
        tags: updatedBookmark.tags,
        pinned: updatedBookmark.pinned
      });
    }
  };

  const handleTogglePin = (bookmarkId: string) => {
    const bookmark = bookmarks.find((b) => b.id === bookmarkId);
    if (bookmark) {
      handleBookmarkChange(bookmarkId, { pinned: !bookmark.pinned });
    }
  };

  const handleEdit = (bookmark: BookmarkItem) => {
    setEditingBookmark(bookmark);
  };

  const handleCloseEditModal = () => {
    setEditingBookmark(null);
  };

  const handleSaveEdit = async (
    bookmarkId: string,
    data: { title: string; url: string; tags: string[]; pinned: boolean }
  ) => {
    await updateBookmark(bookmarkId, data);
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
          <BookmarkCard
            key={bookmark.id}
            bookmark={bookmark}
            tags={tags}
            onEdit={handleEdit}
            onTogglePin={handleTogglePin}
          />
        ))}
      </div>

      <BookmarkEditModal
        bookmark={editingBookmark}
        onClose={handleCloseEditModal}
        onSave={handleSaveEdit}
      />
    </div>
  );
};


