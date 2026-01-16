import { useEffect, useMemo, useState, useRef } from 'react';
import { PixelButton } from '../../../components/PixelButton';
import { PixelCard } from '../../../components/PixelCard';
import { SearchInput } from '../../../components/SearchInput';
import { SortDropdown, type SortField } from '../../../components/SortDropdown';
import { TagCard } from '../../../components/TagCard';
import { TagEditModal } from '../../../components/TagEditModal';
import { Pagination } from '../../../components/Pagination';
import { BookmarkSidebar } from '../../../components/BookmarkSidebar';
import {
  createTag,
  deleteTag,
  getAllTags,
  getAllBookmarks,
  updateTag,
  updateBookmark
} from '../../../lib/bookmarkService';
import { openUrlsWithMode } from '../../../lib/chrome';
import { getBrowserTagWorkstationOpenMode, getTagsMap, saveTagsMap } from '../../../lib/storage';
import type { Tag, BookmarkItem } from '../../../lib/types';
import './tagsPage.css';

export const TagsPage = () => {
  const [tags, setTags] = useState<Tag[]>([]);
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortField>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [isBookmarkSidebarOpen, setIsBookmarkSidebarOpen] = useState(false);
  const [selectedTagId, setSelectedTagId] = useState<string | null>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const ITEMS_PER_PAGE = 40;

  const refresh = async () => {
    const [tagsList, bookmarksList] = await Promise.all([
      getAllTags(),
      getAllBookmarks()
    ]);
    setTags(tagsList);
    setBookmarks(bookmarksList);
  };

  useEffect(() => {
    void refresh();
  }, []);

  const filtered = useMemo(() => {
    let list = tags;
    // 搜索过滤
    if (search) {
      list = list.filter((tag) => tag.name.toLowerCase().includes(search.toLowerCase()));
    }
    // 排序
    const sortedList = [...list];
    sortedList.sort((a, b) => {
      // 首先按 pinned 排序（置顶在前）
      if (a.pinned !== b.pinned) {
        return a.pinned ? -1 : 1;
      }
      // 然后根据选择的排序字段和排序方向进行排序
      let diff = 0;
      if (sortBy === 'createdAt') {
        diff = sortOrder === 'desc' ? b.createdAt - a.createdAt : a.createdAt - b.createdAt;
      } else if (sortBy === 'usageCount') {
        diff = sortOrder === 'desc' ? b.usageCount - a.usageCount : a.usageCount - b.usageCount;
      } else if (sortBy === 'clickCount') {
        diff = sortOrder === 'desc' ? b.clickCount - a.clickCount : a.clickCount - b.clickCount;
      }
      return diff;
    });
    return sortedList;
  }, [tags, search, sortBy, sortOrder]);

  // 分页计算
  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginatedTags = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return filtered.slice(startIndex, endIndex);
  }, [filtered, currentPage]);

  // 当搜索条件或排序改变时，重置到第一页
  useEffect(() => {
    setCurrentPage(1);
  }, [search, sortBy, sortOrder]);

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
    // 不立即关闭弹窗，让成功提示先显示，弹窗会在1.5秒后自动关闭
    // 延迟刷新数据，让成功提示先显示
    setTimeout(async () => {
      await refresh();
    }, 1600);
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
    // 单点击打开编辑窗口
    const tag = tags.find((t) => t.id === tagId);
    if (tag) {
      handleEdit(tag);
    }
  };

  const handleTagDoubleClick = async (tagId: string) => {
    // 双击打开标签下的所有书签
    const tagBookmarks = bookmarks.filter((bookmark) => bookmark.tags.includes(tagId));
    if (tagBookmarks.length === 0) return;

    // 获取所有书签的URL
    const urls = tagBookmarks.map((bookmark) => bookmark.url).filter(Boolean);
    if (urls.length > 0) {
      const mode = await getBrowserTagWorkstationOpenMode();
      await openUrlsWithMode(urls, mode);
      
      // 更新标签的点击计数
      const tag = tags.find((t) => t.id === tagId);
      if (tag) {
        const tagsMap = await getTagsMap();
        const targetTag = tagsMap[tagId];
        if (targetTag) {
          targetTag.clickCount += 1;
          targetTag.updatedAt = Date.now();
          await saveTagsMap(tagsMap);
          await refresh();
        }
      }
    }
  };

  const handleCloseSidebar = () => {
    setIsBookmarkSidebarOpen(false);
    setSelectedTagId(null);
  };

  const handleRemoveTag = async (bookmarkId: string, tagId: string) => {
    const bookmark = bookmarks.find((b) => b.id === bookmarkId);
    if (!bookmark) return;
    
    // 移除标签关系
    const updatedTags = bookmark.tags.filter((id) => id !== tagId);
    await updateBookmark(bookmarkId, {
      title: bookmark.title,
      url: bookmark.url,
      tags: updatedTags,
      pinned: bookmark.pinned
    });
    
    // 刷新数据
    await refresh();
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    
    const bookmarkId = e.dataTransfer.getData('bookmarkId');
    const source = e.dataTransfer.getData('source');
    
    // 只处理来自侧边栏的拖拽
    if (source !== 'bookmarkSidebar' || !bookmarkId || !selectedTagId) return;
    
    // 检查是否拖拽到侧边栏外
    const sidebarElement = sidebarRef.current;
    if (!sidebarElement) return;
    
    // 使用鼠标位置来判断是否在侧边栏内
    const x = e.clientX;
    const y = e.clientY;
    const rect = sidebarElement.getBoundingClientRect();
    const isInsideSidebar = 
      x >= rect.left && 
      x <= rect.right && 
      y >= rect.top && 
      y <= rect.bottom;
    
    // 如果拖拽到侧边栏外，移除标签关系
    if (!isInsideSidebar) {
      await handleRemoveTag(bookmarkId, selectedTagId);
    }
  };

  return (
    <div 
      className="tags-page"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <div className="tags-toolbar-merged">
        <div className="tags-filters">
          <SearchInput value={search} placeholder="搜索标签" onChange={setSearch} />
          <SortDropdown
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSortByChange={setSortBy}
            onSortOrderToggle={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
            options={[
              { value: 'createdAt', label: '创建日期' },
              { value: 'usageCount', label: '书签数量' },
              { value: 'clickCount', label: '点击数量' }
            ]}
          />
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
                onTogglePin={handleTogglePin}
                onClick={handleTagClick}
                onDoubleClick={handleTagDoubleClick}
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
          <div ref={sidebarRef}>
            <BookmarkSidebar
              tagId={selectedTagId}
              bookmarks={bookmarks}
              tags={tags}
              onClose={handleCloseSidebar}
              onRemoveTag={handleRemoveTag}
            />
          </div>
        )}
      </div>

      {editingTag && (
        <TagEditModal
          mode="edit"
          tag={editingTag}
          onClose={handleCloseEditModal}
          onSave={handleSaveEdit}
          onDelete={handleDeleteTag}
        />
      )}

      {isCreateModalOpen && (
        <TagEditModal
          mode="create"
          onClose={handleCloseCreateModal}
          onCreate={handleCreateTag}
        />
      )}
    </div>
  );
};


