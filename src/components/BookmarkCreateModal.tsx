import { useEffect, useRef, useState } from 'react';
import { PixelButton } from './PixelButton';
import { TagInput } from './TagInput';
import { ToggleSwitch } from './ToggleSwitch';
import './bookmarkCreateModal.css';

interface BookmarkCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (data: { title: string; url: string; tags: string[]; pinned: boolean }) => Promise<void>;
}

export const BookmarkCreateModal = ({ isOpen, onClose, onCreate }: BookmarkCreateModalProps) => {
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [pinned, setPinned] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const titleTextareaRef = useRef<HTMLTextAreaElement>(null);
  const urlTextareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustTextareaHeight = (textarea: HTMLTextAreaElement) => {
    textarea.style.height = 'auto';
    textarea.style.height = `${textarea.scrollHeight}px`;
  };

  // 当弹窗打开时，重置表单
  useEffect(() => {
    if (isOpen) {
      setTitle('');
      setUrl('');
      setTags([]);
      setPinned(false);
      setIsCreating(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      if (titleTextareaRef.current) {
        adjustTextareaHeight(titleTextareaRef.current);
      }
      if (urlTextareaRef.current) {
        adjustTextareaHeight(urlTextareaRef.current);
      }
    }
  }, [title, url, isOpen]);

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleCreate = async () => {
    if (!title.trim() || !url.trim()) return;
    
    setIsCreating(true);
    try {
      await onCreate({ title: title.trim(), url: url.trim(), tags, pinned });
      onClose();
    } catch (error) {
      console.error('Failed to create bookmark:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="bookmark-create-modal__backdrop" onClick={handleBackdropClick} onKeyDown={handleKeyDown}>
      <div className="bookmark-create-modal" onClick={(e) => e.stopPropagation()}>
        <div className="bookmark-create-modal__header">
          <h2 className="bookmark-create-modal__title">新建收藏</h2>
          <button
            className="bookmark-create-modal__close"
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
        <div className="bookmark-create-modal__content">
          <div className="bookmark-create-modal__field">
            <label className="bookmark-create-modal__label">标题</label>
            <textarea
              ref={titleTextareaRef}
              className="bookmark-create-modal__input bookmark-create-modal__textarea"
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
          <div className="bookmark-create-modal__field">
            <label className="bookmark-create-modal__label">URL</label>
            <textarea
              ref={urlTextareaRef}
              className="bookmark-create-modal__input bookmark-create-modal__textarea"
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                adjustTextareaHeight(e.target);
              }}
              placeholder="https://example.com"
              rows={1}
            />
          </div>
          <div className="bookmark-create-modal__field">
            <label className="bookmark-create-modal__label">标签</label>
            <TagInput value={tags} onChange={setTags} />
          </div>
          <div className="bookmark-create-modal__field">
            <ToggleSwitch
              checked={pinned}
              onChange={setPinned}
              label="置顶"
            />
          </div>
        </div>
        <div className="bookmark-create-modal__footer">
          <PixelButton variant="secondary" onClick={onClose} disabled={isCreating}>
            取消
          </PixelButton>
          <PixelButton onClick={handleCreate} disabled={isCreating || !title.trim() || !url.trim()}>
            {isCreating ? '创建中...' : '创建'}
          </PixelButton>
        </div>
      </div>
    </div>
  );
};
