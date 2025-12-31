import { useEffect, useMemo, useState } from 'react';
import { PixelButton } from '../../../components/PixelButton';
import { PixelCard } from '../../../components/PixelCard';
import { SearchInput } from '../../../components/SearchInput';
import { TagCard } from '../../../components/TagCard';
import { TagEditModal } from '../../../components/TagEditModal';
import {
  createTag,
  getAllTags,
  updateTag
} from '../../../lib/bookmarkService';
import type { Tag } from '../../../lib/types';
import './tagsPage.css';

export const TagsPage = () => {
  const [tags, setTags] = useState<Tag[]>([]);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ name: '', color: '#ffcc00' });
  const [editingTag, setEditingTag] = useState<Tag | null>(null);

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

  const handleEdit = (tag: Tag) => {
    setEditingTag(tag);
  };

  const handleCloseEditModal = () => {
    setEditingTag(null);
  };

  const handleSaveEdit = async (
    tagId: string,
    data: { name: string; color: string; description?: string; pinned: boolean }
  ) => {
    await updateTag(tagId, data);
    await refresh();
  };

  const handleTogglePin = async (tagId: string) => {
    const tag = tags.find((t) => t.id === tagId);
    if (tag) {
      await updateTag(tagId, { pinned: !tag.pinned });
      await refresh();
    }
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
          <TagCard
            key={tag.id}
            tag={tag}
            onEdit={handleEdit}
            onTogglePin={handleTogglePin}
          />
        ))}
      </div>

      <TagEditModal
        tag={editingTag}
        onClose={handleCloseEditModal}
        onSave={handleSaveEdit}
      />
    </div>
  );
};


