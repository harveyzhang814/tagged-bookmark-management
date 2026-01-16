import { useEffect, useRef, useState } from 'react';
import { PixelButton } from './PixelButton';
import { TagInput } from './TagInput';
import { ToggleSwitch } from './ToggleSwitch';
import type { BookmarkItem } from '../lib/types';
import './bookmarkEditModal.css';

interface BookmarkEditModalProps {
  mode: 'create' | 'edit';
  bookmark?: BookmarkItem | null;
  onClose: () => void;
  onSave?: (bookmarkId: string, data: { title: string; url: string; tags: string[]; pinned: boolean }) => Promise<void>;
  onCreate?: (data: { title: string; url: string; tags: string[]; pinned: boolean }) => Promise<void>;
  onDelete?: (bookmarkId: string) => Promise<void>;
}

export const BookmarkEditModal = ({ mode, bookmark, onClose, onSave, onCreate, onDelete }: BookmarkEditModalProps) => {
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [pinned, setPinned] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const titleTextareaRef = useRef<HTMLTextAreaElement>(null);
  const urlTextareaRef = useRef<HTMLTextAreaElement>(null);
  const isCreateMode = mode === 'create';

  const adjustTextareaHeight = (textarea: HTMLTextAreaElement) => {
    textarea.style.height = 'auto';
    textarea.style.height = `${textarea.scrollHeight}px`;
  };

  useEffect(() => {
    if (isCreateMode) {
      // 创建模式：重置表单
      setTitle('');
      setUrl('');
      setTags([]);
      setPinned(false);
      setShowSuccess(false);
    } else if (bookmark) {
      // 编辑模式：加载现有书签信息
      setTitle(bookmark.title);
      setUrl(bookmark.url);
      setTags(bookmark.tags);
      setPinned(bookmark.pinned);
      setShowSuccess(false);
    }
  }, [bookmark, isCreateMode]);

  useEffect(() => {
    if (titleTextareaRef.current) {
      adjustTextareaHeight(titleTextareaRef.current);
    }
    if (urlTextareaRef.current) {
      adjustTextareaHeight(urlTextareaRef.current);
    }
  }, [title, url, bookmark]);

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // 成功提示显示时，不允许点击背景关闭
    if (showSuccess) return;
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleSave = async () => {
    if (!title.trim() || !url.trim()) return;
    
    setIsSaving(true);
    try {
      if (isCreateMode && onCreate) {
        await onCreate({ title: title.trim(), url: url.trim(), tags, pinned });
      } else if (!isCreateMode && bookmark && onSave) {
        await onSave(bookmark.id, { title: title.trim(), url: url.trim(), tags, pinned });
      }
      // 先停止保存状态
      setIsSaving(false);
      // 显示成功提示
      setShowSuccess(true);
      // 延迟后关闭弹窗
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (error) {
      console.error(`Failed to ${isCreateMode ? 'create' : 'save'} bookmark:`, error);
      setIsSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // 成功提示显示时，不允许按 ESC 关闭
    if (showSuccess) return;
    if (e.key === 'Escape') {
      onClose();
    }
  };

  const handleDelete = async () => {
    if (isCreateMode || !bookmark || !onDelete) return;
    
    const confirmed = window.confirm('确定要删除这个书签吗？此操作无法撤销。');
    if (!confirmed) return;
    
    try {
      await onDelete(bookmark.id);
      onClose();
    } catch (error) {
      console.error('Failed to delete bookmark:', error);
    }
  };

  // 创建模式需要onCreate，编辑模式需要onSave和bookmark
  if (isCreateMode && !onCreate) return null;
  if (!isCreateMode && (!bookmark || !onSave)) return null;

  return (
    <div className="bookmark-edit-modal__backdrop" onClick={handleBackdropClick} onKeyDown={handleKeyDown}>
      <div className="bookmark-edit-modal" onClick={(e) => e.stopPropagation()}>
        <div className="bookmark-edit-modal__header">
          <h2 className="bookmark-edit-modal__title">{isCreateMode ? '新建书签' : '编辑书签'}</h2>
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
          {showSuccess ? (
            <div className="bookmark-edit-modal__success">
              <div className="bookmark-edit-modal__success-icon">
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
              <p className="bookmark-edit-modal__success-text">
                {isCreateMode ? '新建成功' : '保存成功'}
              </p>
            </div>
          ) : (
            <>
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
              placeholder="书签标题"
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
            </>
          )}
        </div>
        {!showSuccess && (
          <div className="bookmark-edit-modal__footer">
          {!isCreateMode && onDelete && (
            <PixelButton variant="danger" onClick={handleDelete} disabled={isSaving}>
              删除
            </PixelButton>
          )}
          <div className="bookmark-edit-modal__footer-actions">
            <PixelButton variant="secondary" onClick={onClose} disabled={isSaving}>
              取消
            </PixelButton>
            <PixelButton onClick={handleSave} disabled={isSaving || !title.trim() || !url.trim()}>
              {isSaving ? (isCreateMode ? '新建中...' : '保存中...') : (isCreateMode ? '新建' : '保存')}
            </PixelButton>
          </div>
        </div>
        )}
      </div>
    </div>
  );
};

