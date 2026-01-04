import { useEffect, useMemo, useState } from 'react';
import { PixelButton } from '../../../components/PixelButton';
import { PixelCard } from '../../../components/PixelCard';
import { SearchInput } from '../../../components/SearchInput';
import { TagCard } from '../../../components/TagCard';
import { TagEditModal } from '../../../components/TagEditModal';
import { Pagination } from '../../../components/Pagination';
import { BookmarkSidebar } from '../../../components/BookmarkSidebar';
import {
  createTag,
  deleteTag,
  getAllTags,
  getAllBookmarks,
  updateTag
} from '../../../lib/bookmarkService';
import type { Tag, BookmarkItem } from '../../../lib/types';
import './tagsPage.css';

export const TagsPage = () => {
  const [tags, setTags] = useState<Tag[]>([]);
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);
  const [search, setSearch] = useState('');
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [isBookmarkSidebarOpen, setIsBookmarkSidebarOpen] = useState(false);
  const [selectedTagId, setSelectedTagId] = useState<string | null>(null);
  const ITEMS_PER_PAGE = 40;

  const refresh = async () => {
    const [tagsList, bookmarksList] = await Promise.all([
      getAllTags(),
      getAllBookmarks()
    ]);
    setTags(
      tagsList.sort((a, b) => {
        // 首先按 pinned 排序（置顶在前）
        if (a.pinned !== b.pinned) {
          return a.pinned ? -1 : 1;
        }
        // 然后按原有的逻辑排序（usageCount 降序，相同则按 updatedAt 降序）
        if (b.usageCount === a.usageCount) return b.updatedAt - a.updatedAt;
        return b.usageCount - a.usageCount;
      })
    );
    setBookmarks(bookmarksList);
  };

  useEffect(() => {
    void refresh();
  }, []);

  const filtered = useMemo(() => {
    if (!search) return tags;
    return tags.filter((tag) => tag.name.toLowerCase().includes(search.toLowerCase()));
  }, [tags, search]);

  // 分页计算
  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginatedTags = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return filtered.slice(startIndex, endIndex);
  }, [filtered, currentPage]);

  // 当搜索条件改变时，重置到第一页
  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  // 当总页数变化时，确保当前页不超过总页数
  useEffect(() => {
    if (totalPages > 0 && currentPage > totalPages) {
      setCurrentPage(totalPages);
    } else if (totalPages === 0 && currentPage > 1) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

  const handleCreateTag = async (data: { name: string; color: string; description?: string; pinned: boolean }) => {
    const newTag = await createTag({ 
      name: data.name, 
      color: data.color, 
      description: data.description 
    });
    // 如果设置了置顶，需要更新标签
    if (data.pinned) {
      await updateTag(newTag.id, { pinned: true });
    }
    setIsCreateModalOpen(false);
    await refresh();
  };

  const handleEdit = (tag: Tag) => {
    setEditingTag(tag);
  };

  const handleCloseEditModal = () => {
    setEditingTag(null);
  };

  const handleCloseCreateModal = () => {
    setIsCreateModalOpen(false);
  };

  const handleSaveEdit = async (
    tagId: string,
    data: { name: string; color: string; description?: string; pinned: boolean }
  ) => {
    await updateTag(tagId, data);
    await refresh();
  };

  const handleDeleteTag = async (tagId: string) => {
    await deleteTag(tagId);
    await refresh();
  };

  const handleTogglePin = async (tagId: string) => {
    const tag = tags.find((t) => t.id === tagId);
    if (tag) {
      await updateTag(tagId, { pinned: !tag.pinned });
      await refresh();
    }
  };

  const handleTagClick = (tagId: string) => {
    if (!isBookmarkSidebarOpen || selectedTagId !== tagId) {
      setSelectedTagId(tagId);
      setIsBookmarkSidebarOpen(true);
    } else {
      // 如果已经打开且是同一个标签，刷新数据
      void refresh();
    }
  };

  const handleCloseSidebar = () => {
    setIsBookmarkSidebarOpen(false);
    setSelectedTagId(null);
  };

  return (
    <div className="tags-page">
      <div className="tags-toolbar-merged">
        <div className="tags-filters">
          <SearchInput value={search} placeholder="搜索标签" onChange={setSearch} />
        </div>
        <div className="tags-actions">
          <PixelButton onClick={() => setIsCreateModalOpen(true)}>
            新建标签
          </PixelButton>
        </div>
      </div>

      <div className="tags-content-wrapper">
        <div className="tags-content">
          <div className="tag-grid">
            {paginatedTags.map((tag) => (
              <TagCard
                key={tag.id}
                tag={tag}
                onEdit={handleEdit}
                onTogglePin={handleTogglePin}
                onClick={handleTagClick}
              />
            ))}
          </div>

          {totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          )}
        </div>

        {isBookmarkSidebarOpen && (
          <BookmarkSidebar
            tagId={selectedTagId}
            bookmarks={bookmarks}
            tags={tags}
            onClose={handleCloseSidebar}
          />
        )}
      </div>

      {editingTag && (
        <TagEditModal
          tag={editingTag}
          onClose={handleCloseEditModal}
          onSave={handleSaveEdit}
          onDelete={handleDeleteTag}
        />
      )}

      {isCreateModalOpen && (
        <TagEditModal
          tag={null}
          onClose={handleCloseCreateModal}
          onCreate={handleCreateTag}
        />
      )}
    </div>
  );
};


