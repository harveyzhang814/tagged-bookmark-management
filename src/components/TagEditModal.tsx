import { useEffect, useRef, useState } from 'react';
import { PixelButton } from './PixelButton';
import { TagPill } from './TagPill';
import { ToggleSwitch } from './ToggleSwitch';
import { ColorPicker } from './ColorPicker';
import { TAG_COLOR_PALETTE_24 } from '../lib/bookmarkService';
import { getAllTags } from '../lib/bookmarkService';
import type { Tag } from '../lib/types';
import './tagEditModal.css';

interface TagEditModalProps {
  tag: Tag | null;
  onClose: () => void;
  onSave?: (tagId: string, data: { name: string; color: string; description?: string; pinned: boolean }) => Promise<void>;
  onCreate?: (data: { name: string; color: string; description?: string; pinned: boolean }) => Promise<void>;
  onDelete?: (tagId: string) => Promise<void>;
}

/**
 * 获取智能分配的默认颜色（基于现有标签使用情况）
 */
const getDefaultTagColor = async (): Promise<string> => {
  const tags = await getAllTags();
  
  // 统计每种预设颜色的使用次数
  const colorUsage = new Map<string, number>();
  TAG_COLOR_PALETTE_24.forEach(color => {
    colorUsage.set(color.toLowerCase(), 0);
  });
  
  // 统计现有标签使用的颜色
  tags.forEach(tag => {
    const normalizedColor = tag.color.toLowerCase();
    if (colorUsage.has(normalizedColor)) {
      const count = colorUsage.get(normalizedColor) ?? 0;
      colorUsage.set(normalizedColor, count + 1);
    }
  });
  
  // 找到使用次数最少的颜色
  let minCount = Infinity;
  let selectedColor = TAG_COLOR_PALETTE_24[0];
  
  for (const color of TAG_COLOR_PALETTE_24) {
    const normalizedColor = color.toLowerCase();
    const count = colorUsage.get(normalizedColor) ?? 0;
    if (count < minCount) {
      minCount = count;
      selectedColor = color;
    }
  }
  
  return selectedColor;
};

export const TagEditModal = ({ tag, onClose, onSave, onCreate, onDelete }: TagEditModalProps) => {
  const [name, setName] = useState('');
  const [color, setColor] = useState(TAG_COLOR_PALETTE_24[0]);
  const [description, setDescription] = useState('');
  const [pinned, setPinned] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingDefaultColor, setIsLoadingDefaultColor] = useState(false);
  const descriptionTextareaRef = useRef<HTMLTextAreaElement>(null);
  const isCreateMode = !tag;

  const adjustTextareaHeight = (textarea: HTMLTextAreaElement) => {
    textarea.style.height = 'auto';
    textarea.style.height = `${textarea.scrollHeight}px`;
  };

  useEffect(() => {
    if (tag) {
      setName(tag.name);
      setColor(tag.color);
      setDescription(tag.description || '');
      setPinned(tag.pinned);
    } else {
      // 创建模式：重置表单并获取智能分配的默认颜色
      setName('');
      setDescription('');
      setPinned(false);
      setIsLoadingDefaultColor(true);
      getDefaultTagColor().then((defaultColor) => {
        setColor(defaultColor);
        setIsLoadingDefaultColor(false);
      }).catch(() => {
        setColor(TAG_COLOR_PALETTE_24[0]);
        setIsLoadingDefaultColor(false);
      });
    }
  }, [tag]);

  useEffect(() => {
    if (descriptionTextareaRef.current) {
      adjustTextareaHeight(descriptionTextareaRef.current);
    }
  }, [description, tag]);

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    
    setIsSaving(true);
    try {
      if (isCreateMode && onCreate) {
        await onCreate({ 
          name: name.trim(), 
          color: color.trim(), 
          description: description.trim() || undefined,
          pinned 
        });
      } else if (tag && onSave) {
        await onSave(tag.id, { 
          name: name.trim(), 
          color: color.trim(), 
          description: description.trim() || undefined,
          pinned 
        });
      }
      onClose();
    } catch (error) {
      console.error('Failed to save tag:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  const handleDelete = async () => {
    if (!tag || !onDelete) return;
    
    const confirmed = window.confirm('确定要删除这个标签吗？此操作将从所有书签中移除该标签，且无法撤销。');
    if (!confirmed) return;
    
    try {
      await onDelete(tag.id);
      onClose();
    } catch (error) {
      console.error('Failed to delete tag:', error);
    }
  };

  // 如果没有 tag 且没有 onCreate，则不显示弹窗
  if (!tag && !onCreate) return null;

  return (
    <div className="tag-edit-modal__backdrop" onClick={handleBackdropClick} onKeyDown={handleKeyDown}>
      <div className="tag-edit-modal" onClick={(e) => e.stopPropagation()}>
        <div className="tag-edit-modal__header">
          <h2 className="tag-edit-modal__title">{isCreateMode ? '创建标签' : '编辑标签'}</h2>
          <button
            className="tag-edit-modal__close"
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
        <div className="tag-edit-modal__content">
          <div className="tag-edit-modal__field">
            <label className="tag-edit-modal__label">名称</label>
            <input
              className="tag-edit-modal__input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="标签名称"
              autoFocus
            />
          </div>
          <div className="tag-edit-modal__field">
            <label className="tag-edit-modal__label">描述</label>
            <textarea
              ref={descriptionTextareaRef}
              className="tag-edit-modal__input tag-edit-modal__textarea"
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                adjustTextareaHeight(e.target);
              }}
              placeholder="标签描述（可选）"
              rows={1}
            />
          </div>
          <div className="tag-edit-modal__field">
            <label className="tag-edit-modal__label">颜色</label>
            <ColorPicker
              value={color}
              onChange={setColor}
              disabled={isLoadingDefaultColor}
            />
          </div>
          <div className="tag-edit-modal__field">
            <ToggleSwitch
              checked={pinned}
              onChange={setPinned}
              label="置顶"
            />
          </div>
          <div className="tag-edit-modal__preview">
            <div className="tag-edit-modal__preview-label">预览效果</div>
            <div className="tag-edit-modal__preview-content">
              <TagPill label={name || '标签名称'} color={color} size="large" />
            </div>
          </div>
        </div>
        <div className="tag-edit-modal__footer">
          {!isCreateMode && onDelete && (
            <PixelButton variant="danger" onClick={handleDelete} disabled={isSaving}>
              删除
            </PixelButton>
          )}
          <div className="tag-edit-modal__footer-actions">
            <PixelButton variant="secondary" onClick={onClose} disabled={isSaving}>
              取消
            </PixelButton>
            <PixelButton onClick={handleSave} disabled={isSaving || !name.trim()}>
              {isSaving ? (isCreateMode ? '创建中...' : '保存中...') : (isCreateMode ? '创建' : '保存')}
            </PixelButton>
          </div>
        </div>
      </div>
    </div>
  );
};
