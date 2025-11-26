import { useEffect, useRef, useState } from 'react';
import { PixelButton } from './PixelButton';
import { TagInput } from './TagInput';
import { ToggleSwitch } from './ToggleSwitch';
import type { BookmarkItem } from '../lib/types';
import './bookmarkEditModal.css';

interface BookmarkEditModalProps {
  bookmark: BookmarkItem | null;
  onClose: () => void;
  onSave: (bookmarkId: string, data: { title: string; url: string; tags: string[]; pinned: boolean }) => Promise<void>;
}

export const BookmarkEditModal = ({ bookmark, onClose, onSave }: BookmarkEditModalProps) => {
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [pinned, setPinned] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const titleTextareaRef = useRef<HTMLTextAreaElement>(null);
  const urlTextareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustTextareaHeight = (textarea: HTMLTextAreaElement) => {
    textarea.style.height = 'auto';
    textarea.style.height = `${textarea.scrollHeight}px`;
  };

  useEffect(() => {
    if (bookmark) {
      setTitle(bookmark.title);
      setUrl(bookmark.url);
      setTags(bookmark.tags);
      setPinned(bookmark.pinned);
    }
  }, [bookmark]);

  useEffect(() => {
    if (titleTextareaRef.current) {
      adjustTextareaHeight(titleTextareaRef.current);
    }
    if (urlTextareaRef.current) {
      adjustTextareaHeight(urlTextareaRef.current);
    }
  }, [title, url, bookmark]);

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleSave = async () => {
    if (!bookmark || !title.trim() || !url.trim()) return;
    
    setIsSaving(true);
    try {
      await onSave(bookmark.id, { title: title.trim(), url: url.trim(), tags, pinned });
      onClose();
    } catch (error) {
      console.error('Failed to save bookmark:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!bookmark) return null;

  return (
    <div className="bookmark-edit-modal__backdrop" onClick={handleBackdropClick} onKeyDown={handleKeyDown}>
      <div className="bookmark-edit-modal" onClick={(e) => e.stopPropagation()}>
        <div className="bookmark-edit-modal__header">
          <h2 className="bookmark-edit-modal__title">编辑书签</h2>
          <button
            className="bookmark-edit-modal__close"
            onClick={onClose}
            aria-label="关闭"
            type="button"
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
        <div className="bookmark-edit-modal__content">
          <div className="bookmark-edit-modal__field">
            <label className="bookmark-edit-modal__label">标题</label>
            <textarea
              ref={titleTextareaRef}
              className="bookmark-edit-modal__input bookmark-edit-modal__textarea"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                adjustTextareaHeight(e.target);
              }}
              placeholder="网页标题"
              autoFocus
              rows={1}
            />
          </div>
          <div className="bookmark-edit-modal__field">
            <label className="bookmark-edit-modal__label">URL</label>
            <textarea
              ref={urlTextareaRef}
              className="bookmark-edit-modal__input bookmark-edit-modal__textarea"
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                adjustTextareaHeight(e.target);
              }}
              placeholder="https://example.com"
              rows={1}
            />
          </div>
          <div className="bookmark-edit-modal__field">
            <label className="bookmark-edit-modal__label">标签</label>
            <TagInput value={tags} onChange={setTags} />
          </div>
          <div className="bookmark-edit-modal__field">
            <ToggleSwitch
              checked={pinned}
              onChange={setPinned}
              label="置顶"
            />
          </div>
        </div>
        <div className="bookmark-edit-modal__footer">
          <PixelButton variant="secondary" onClick={onClose} disabled={isSaving}>
            取消
          </PixelButton>
          <PixelButton onClick={handleSave} disabled={isSaving || !title.trim() || !url.trim()}>
            {isSaving ? '保存中...' : '保存'}
          </PixelButton>
        </div>
      </div>
    </div>
  );
};

