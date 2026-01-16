import { useEffect, useRef, useState } from 'react';
import { PixelButton } from './PixelButton';
import { TagPill } from './TagPill';
import { ToggleSwitch } from './ToggleSwitch';
import { ColorPicker } from './ColorPicker';
import { TAG_COLOR_PALETTE_24 } from '../lib/bookmarkService';
import { getAllWorkstations } from '../lib/workstationService';
import type { Workstation } from '../lib/types';
import './workstationEditModal.css';

interface WorkstationEditModalProps {
  mode: 'create' | 'edit';
  workstation?: Workstation | null;
  onClose: () => void;
  onSave?: (workstationId: string, data: { name: string; color: string; description?: string; pinned: boolean }) => Promise<void>;
  onCreate?: (data: { name: string; color: string; description?: string; pinned: boolean }) => Promise<void>;
  onDelete?: (workstationId: string) => Promise<void>;
}

/**
 * 获取智能分配的默认颜色（基于现有工作区使用情况）
 */
const getDefaultWorkstationColor = async (): Promise<string> => {
  const workstations = await getAllWorkstations();
  
  // 统计每种预设颜色的使用次数
  const colorUsage = new Map<string, number>();
  TAG_COLOR_PALETTE_24.forEach(color => {
    colorUsage.set(color.toLowerCase(), 0);
  });
  
  // 统计现有工作区使用的颜色
  workstations.forEach(workstation => {
    const normalizedColor = workstation.color.toLowerCase();
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

export const WorkstationEditModal = ({ mode, workstation, onClose, onSave, onCreate, onDelete }: WorkstationEditModalProps) => {
  const [name, setName] = useState('');
  const [color, setColor] = useState(TAG_COLOR_PALETTE_24[0]);
  const [description, setDescription] = useState('');
  const [pinned, setPinned] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingDefaultColor, setIsLoadingDefaultColor] = useState(false);
  const descriptionTextareaRef = useRef<HTMLTextAreaElement>(null);
  const isCreateMode = mode === 'create';

  const adjustTextareaHeight = (textarea: HTMLTextAreaElement) => {
    textarea.style.height = 'auto';
    textarea.style.height = `${textarea.scrollHeight}px`;
  };

  useEffect(() => {
    if (isCreateMode) {
      // 创建模式：重置表单并获取智能分配的默认颜色
      setName('');
      setDescription('');
      setPinned(false);
      setIsLoadingDefaultColor(true);
      getDefaultWorkstationColor().then((defaultColor) => {
        setColor(defaultColor);
        setIsLoadingDefaultColor(false);
      }).catch(() => {
        setColor(TAG_COLOR_PALETTE_24[0]);
        setIsLoadingDefaultColor(false);
      });
    } else if (workstation) {
      // 编辑模式：加载现有工作区信息
      setName(workstation.name);
      setColor(workstation.color);
      setDescription(workstation.description || '');
      setPinned(workstation.pinned);
    }
  }, [workstation, isCreateMode]);

  useEffect(() => {
    if (descriptionTextareaRef.current) {
      adjustTextareaHeight(descriptionTextareaRef.current);
    }
  }, [description, workstation]);

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
      } else if (workstation && onSave) {
        await onSave(workstation.id, { 
          name: name.trim(), 
          color: color.trim(), 
          description: description.trim() || undefined,
          pinned 
        });
      }
      onClose();
    } catch (error) {
      console.error('Failed to save workstation:', error);
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
    if (!workstation || !onDelete) return;
    
    const confirmed = window.confirm('确定要删除这个工作区吗？此操作无法撤销。');
    if (!confirmed) return;
    
    try {
      await onDelete(workstation.id);
      onClose();
    } catch (error) {
      console.error('Failed to delete workstation:', error);
    }
  };

  // 创建模式需要onCreate，编辑模式需要onSave和workstation
  if (isCreateMode && !onCreate) return null;
  if (!isCreateMode && (!workstation || !onSave)) return null;

  return (
    <div className="workstation-edit-modal__backdrop" onClick={handleBackdropClick} onKeyDown={handleKeyDown}>
      <div className="workstation-edit-modal" onClick={(e) => e.stopPropagation()}>
        <div className="workstation-edit-modal__header">
          <h2 className="workstation-edit-modal__title">{isCreateMode ? '新建工作区' : '编辑工作区'}</h2>
          <button
            className="workstation-edit-modal__close"
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
        <div className="workstation-edit-modal__content">
          <div className="workstation-edit-modal__field">
            <label className="workstation-edit-modal__label">名称</label>
            <input
              className="workstation-edit-modal__input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="工作区名称"
              autoFocus
            />
          </div>
          <div className="workstation-edit-modal__field">
            <label className="workstation-edit-modal__label">描述</label>
            <textarea
              ref={descriptionTextareaRef}
              className="workstation-edit-modal__input workstation-edit-modal__textarea"
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                adjustTextareaHeight(e.target);
              }}
              placeholder="工作区描述（可选）"
              rows={1}
            />
          </div>
          <div className="workstation-edit-modal__field">
            <label className="workstation-edit-modal__label">颜色</label>
            <ColorPicker
              value={color}
              onChange={setColor}
              disabled={isLoadingDefaultColor}
            />
          </div>
          <div className="workstation-edit-modal__field">
            <ToggleSwitch
              checked={pinned}
              onChange={setPinned}
              label="置顶"
            />
          </div>
          <div className="workstation-edit-modal__preview">
            <div className="workstation-edit-modal__preview-label">预览效果</div>
            <div className="workstation-edit-modal__preview-content">
              <TagPill label={name || '工作区名称'} color={color} size="large" />
            </div>
          </div>
        </div>
        <div className="workstation-edit-modal__footer">
          {!isCreateMode && onDelete && (
            <PixelButton variant="danger" onClick={handleDelete} disabled={isSaving}>
              删除
            </PixelButton>
          )}
          <div className="workstation-edit-modal__footer-actions">
            <PixelButton variant="secondary" onClick={onClose} disabled={isSaving}>
              取消
            </PixelButton>
            <PixelButton onClick={handleSave} disabled={isSaving || !name.trim()}>
              {isSaving ? (isCreateMode ? '新建中...' : '保存中...') : (isCreateMode ? '新建' : '保存')}
            </PixelButton>
          </div>
        </div>
      </div>
    </div>
  );
};
