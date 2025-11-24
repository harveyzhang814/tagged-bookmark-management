import { useEffect, useState, useRef, type KeyboardEvent, type FocusEvent } from 'react';
import { TagPill } from './TagPill';
import { getAllTags, createTag } from '../lib/bookmarkService';
import type { Tag } from '../lib/types';
import './tagInput.css';

interface TagInputProps {
  value: string[];
  onChange: (tagIds: string[]) => void;
  placeholder?: string;
  className?: string;
  onBlur?: () => void;
}

export const TagInput = ({
  value,
  onChange,
  placeholder = '输入标签，回车创建',
  className = '',
  onBlur
}: TagInputProps) => {
  const [tagInput, setTagInput] = useState('');
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [suggestions, setSuggestions] = useState<Tag[]>([]);
  const tagInputRef = useRef<HTMLInputElement>(null);

  const refreshTags = async () => {
    const tags = await getAllTags();
    setAllTags(tags);
  };

  useEffect(() => {
    void refreshTags();
  }, []);

  useEffect(() => {
    if (!tagInput.trim()) {
      setSuggestions([]);
      return;
    }
    const query = tagInput.trim().toLowerCase();
    const matched = allTags.filter(
      (tag) => tag.name.toLowerCase().includes(query) && !value.includes(tag.id)
    );
    setSuggestions(matched.slice(0, 5));
  }, [tagInput, allTags, value]);

  const handleAddTag = async (tagId: string) => {
    if (!value.includes(tagId)) {
      onChange([...value, tagId]);
      setTagInput('');
      tagInputRef.current?.focus();
    }
  };

  const handleRemoveTag = (tagId: string) => {
    onChange(value.filter((id) => id !== tagId));
  };

  const handleTagInputKeyDown = async (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      const query = tagInput.trim();
      const existing = allTags.find((tag) => tag.name.toLowerCase() === query.toLowerCase());
      if (existing) {
        await handleAddTag(existing.id);
      } else {
        // 创建新 tag
        const newTag = await createTag({ name: query, color: '' });
        await refreshTags();
        await handleAddTag(newTag.id);
      }
    } else if (e.key === 'Backspace' && !tagInput && value.length > 0) {
      handleRemoveTag(value[value.length - 1]);
    }
  };

  const selectedTags = value
    .map((id) => allTags.find((t) => t.id === id))
    .filter((t): t is Tag => t !== undefined);

  const handleWrapperBlur = (event: FocusEvent<HTMLDivElement>) => {
    const nextTarget = event.relatedTarget as Node | null;
    if (!nextTarget || !event.currentTarget.contains(nextTarget)) {
      onBlur?.();
    }
  };

  return (
    <div className={`tag-input-wrapper ${className}`} onBlur={handleWrapperBlur}>
      <div className="tag-chips">
        {selectedTags.map((tag) => (
          <div key={tag.id} className="tag-chip">
            <TagPill label={tag.name} color={tag.color} />
            <button
              type="button"
              className="tag-chip-remove"
              onClick={() => handleRemoveTag(tag.id)}
              aria-label="移除标签"
            >
              ×
            </button>
          </div>
        ))}
        <input
          ref={tagInputRef}
          type="text"
          className="tag-input"
          placeholder={value.length === 0 ? placeholder : ''}
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          onKeyDown={handleTagInputKeyDown}
        />
      </div>
      {suggestions.length > 0 && (
        <div className="tag-suggestions">
          {suggestions.map((tag) => (
            <button
              key={tag.id}
              type="button"
              className="tag-suggestion-item"
              onClick={() => handleAddTag(tag.id)}
            >
              <TagPill label={tag.name} color={tag.color} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

