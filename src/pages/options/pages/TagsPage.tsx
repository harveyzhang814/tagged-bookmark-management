import { useEffect, useMemo, useState } from 'react';
import { PixelButton } from '../../../components/PixelButton';
import { PixelCard } from '../../../components/PixelCard';
import { SearchInput } from '../../../components/SearchInput';
import { TagPill } from '../../../components/TagPill';
import { IconButton } from '../../../components/IconButton';
import { ToggleSwitch } from '../../../components/ToggleSwitch';
import {
  createTag,
  deleteTag,
  getAllTags,
  updateTag
} from '../../../lib/bookmarkService';
import type { Tag } from '../../../lib/types';
import './tagsPage.css';

export const TagsPage = () => {
  const [tags, setTags] = useState<Tag[]>([]);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ name: '', color: '#ffcc00' });

  const refresh = async () => {
    const list = await getAllTags();
    setTags(
      list.sort((a, b) => {
        // 首先按 pinned 排序（置顶在前）
        if (a.pinned !== b.pinned) {
          return a.pinned ? -1 : 1;
        }
        // 然后按原有的逻辑排序（usageCount 降序，相同则按 updatedAt 降序）
        if (b.usageCount === a.usageCount) return b.updatedAt - a.updatedAt;
        return b.usageCount - a.usageCount;
      })
    );
  };

  useEffect(() => {
    void refresh();
  }, []);

  const filtered = useMemo(() => {
    if (!search) return tags;
    return tags.filter((tag) => tag.name.toLowerCase().includes(search.toLowerCase()));
  }, [tags, search]);

  const handleCreate = async () => {
    if (!form.name.trim()) return;
    await createTag({ name: form.name.trim(), color: form.color });
    setForm({ name: '', color: '#ffcc00' });
    await refresh();
  };

  const updateLocalTag = (tagId: string, patch: Partial<Tag>) => {
    setTags((current) =>
      current.map((tag) => (tag.id === tagId ? { ...tag, ...patch, updatedAt: Date.now() } : tag))
    );
  };

  const handleRename = async (tagId: string, value: string) => {
    updateLocalTag(tagId, { name: value });
    await updateTag(tagId, { name: value });
    await refresh();
  };

  const handleColorChange = async (tagId: string, color: string) => {
    updateLocalTag(tagId, { color });
    await updateTag(tagId, { color });
    await refresh();
  };

  const handlePinnedToggle = async (tagId: string, pinned: boolean) => {
    updateLocalTag(tagId, { pinned });
    await updateTag(tagId, { pinned });
    await refresh();
  };

  const handleDelete = async (tagId: string) => {
    await deleteTag(tagId);
    await refresh();
  };

  return (
    <div className="tags-page">
      <PixelCard title="创建新标签">
        <div className="tag-form">
          <input
            value={form.name}
            placeholder="标签名称"
            onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
          />
          <input
            type="color"
            value={form.color}
            onChange={(e) => setForm((prev) => ({ ...prev, color: e.target.value }))}
          />
          <PixelButton onClick={handleCreate}>添加</PixelButton>
        </div>
      </PixelCard>

      <PixelCard title="搜索标签">
        <SearchInput value={search} placeholder="输入名称..." onChange={setSearch} />
      </PixelCard>

      <div className="tag-grid">
        {filtered.map((tag) => (
          <div key={tag.id} className="tag-card">
            <div className="tag-card__header">
              <TagPill label={tag.name} color={tag.color} />
              <IconButton
                variant="danger"
                icon="×"
                aria-label="删除标签"
                onClick={() => handleDelete(tag.id)}
              />
            </div>
            <label>
              名称
              <input
                value={tag.name}
                onChange={(e) => updateLocalTag(tag.id, { name: e.target.value })}
                onBlur={(e) => handleRename(tag.id, e.target.value)}
              />
            </label>
            <label>
              颜色
              <input
                type="color"
                value={tag.color}
                onChange={(e) => updateLocalTag(tag.id, { color: e.target.value })}
                onBlur={(e) => handleColorChange(tag.id, e.target.value)}
              />
            </label>
            <label>
              置顶
              <ToggleSwitch
                checked={tag.pinned ?? false}
                onChange={(checked) => handlePinnedToggle(tag.id, checked)}
              />
            </label>
            <p>使用 {tag.usageCount} 次 · 点击 {tag.clickCount} 次</p>
          </div>
        ))}
      </div>
    </div>
  );
};


