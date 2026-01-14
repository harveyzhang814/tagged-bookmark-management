import { getAllData } from './bookmarkService';
import { getBookmarksMap, getTagsMap, getWorkstationsMap, saveBookmarksMap, saveTagsMap, saveWorkstationsMap } from './storage';
import type {
  BookmarkItem,
  ImportExportFile,
  ImportExportMetadata,
  ImportFileData,
  ImportResult,
  Tag,
  Workstation
} from './types';

const PRODUCT_NAME = 'CrossTag Bookmarks';
const VERSION = '1.0';

/**
 * 重新计算累计数据（内部函数，与bookmarkService中的逻辑一致）
 */
const recalcTagUsage = (bookmarks: Record<string, BookmarkItem>, tags: Record<string, Tag>) => {
  const usage = new Map<string, number>();
  Object.values(bookmarks).forEach((bookmark) => {
    bookmark.tags.forEach((tagId) => {
      usage.set(tagId, (usage.get(tagId) ?? 0) + 1);
    });
  });

  Object.entries(tags).forEach(([tagId, tag]) => {
    tags[tagId] = { ...tag, usageCount: usage.get(tagId) ?? 0 };
  });
};

/**
 * 重新计算标签的点击次数：该标签下所有书签的点击次数之和
 */
const recalcTagClickCounts = (bookmarks: Record<string, BookmarkItem>, tags: Record<string, Tag>) => {
  const clickCounts = new Map<string, number>();
  
  Object.values(bookmarks).forEach((bookmark) => {
    bookmark.tags.forEach((tagId) => {
      const currentCount = clickCounts.get(tagId) ?? 0;
      clickCounts.set(tagId, currentCount + (bookmark.clickCount || 0));
    });
  });

  Object.entries(tags).forEach(([tagId, tag]) => {
    tags[tagId] = { ...tag, clickCount: clickCounts.get(tagId) ?? 0 };
  });
};

/**
 * 生成新的ID（如果需要）
 */
const generateId = (prefix: string) => `${prefix}_${Math.random().toString(36).slice(2, 9)}`;

/**
 * 导出数据为JSON字符串
 * @param includeHistory 是否包含点击历史记录
 */
export const exportData = async (includeHistory: boolean): Promise<string> => {
  const { bookmarks, tags } = await getAllData();
  const workstations = await getWorkstationsMap();

  // 准备导出数据，移除累计字段
  const exportBookmarks: Record<string, Omit<BookmarkItem, 'clickCount'>> = {};
  const exportTags: Record<string, Omit<Tag, 'clickCount' | 'usageCount'>> = {};
  const exportWorkstations: Record<string, Omit<Workstation, 'clickCount'>> = {};

  // 处理书签：移除clickCount，根据includeHistory决定是否保留clickHistory
  Object.entries(bookmarks).forEach(([id, bookmark]) => {
    const { clickCount, ...rest } = bookmark;
    if (includeHistory && bookmark.clickHistory && bookmark.clickHistory.length > 0) {
      exportBookmarks[id] = { ...rest, clickHistory: bookmark.clickHistory };
    } else {
      // 如果不需要历史记录，移除clickHistory字段
      const { clickHistory, ...bookmarkWithoutHistory } = rest;
      exportBookmarks[id] = bookmarkWithoutHistory;
    }
  });

  // 处理标签：移除clickCount和usageCount
  Object.entries(tags).forEach(([id, tag]) => {
    const { clickCount, usageCount, ...rest } = tag;
    exportTags[id] = rest;
  });

  // 处理工作区：移除clickCount
  Object.entries(workstations).forEach(([id, workstation]) => {
    const { clickCount, ...rest } = workstation;
    exportWorkstations[id] = rest;
  });

  // 检查是否有历史记录
  const hasClickHistory = Object.values(bookmarks).some(
    (bm) => bm.clickHistory && bm.clickHistory.length > 0
  );

  const metadata: ImportExportMetadata = {
    version: VERSION,
    exportedAt: Date.now(),
    hasClickHistory: includeHistory && hasClickHistory,
    productName: PRODUCT_NAME
  };

  const exportFile: ImportExportFile = {
    metadata,
    data: {
      bookmarks: exportBookmarks,
      tags: exportTags,
      workstations: exportWorkstations
    }
  };

  return JSON.stringify(exportFile, null, 2);
};

/**
 * 解析导入文件
 * @param file 导入的文件
 */
export const parseImportFile = async (file: File): Promise<ImportFileData> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const parsed: ImportExportFile = JSON.parse(content);

        // 验证文件格式
        if (!parsed.metadata || !parsed.data) {
          reject(new Error('无效的导入文件格式：缺少必需的字段'));
          return;
        }

        if (!parsed.data.bookmarks || !parsed.data.tags) {
          reject(new Error('无效的导入文件格式：缺少数据字段'));
          return;
        }

        // 统计数量
        const bookmarksCount = Object.keys(parsed.data.bookmarks).length;
        const tagsCount = Object.keys(parsed.data.tags).length;
        const workstationsCount = parsed.data.workstations ? Object.keys(parsed.data.workstations).length : 0;

        resolve({
          metadata: parsed.metadata,
          data: parsed.data,
          bookmarksCount,
          tagsCount,
          workstationsCount
        });
      } catch (error) {
        if (error instanceof SyntaxError) {
          reject(new Error('无效的JSON文件格式'));
        } else {
          reject(error);
        }
      }
    };

    reader.onerror = () => {
      reject(new Error('文件读取失败'));
    };

    reader.readAsText(file);
  });
};

/**
 * 导入数据
 * @param mode 导入模式：覆盖或增量
 * @param includeHistory 是否导入历史点击记录
 * @param fileData 导入文件数据
 */
export const importData = async (
  mode: 'overwrite' | 'incremental',
  includeHistory: boolean,
  fileData: ImportFileData
): Promise<ImportResult> => {
  const result: ImportResult = {
    imported: { bookmarks: 0, tags: 0, workstations: 0 },
    skipped: { bookmarks: 0, tags: 0, workstations: 0 }
  };

  if (mode === 'overwrite') {
    // 覆盖模式：直接使用导入的数据
    const bookmarks: Record<string, BookmarkItem> = {};
    const tags: Record<string, Tag> = {};
    const workstations: Record<string, Workstation> = {};

    // 转换书签数据，添加clickCount（根据clickHistory计算）
    Object.entries(fileData.data.bookmarks).forEach(([id, bookmark]) => {
      const clickHistory = includeHistory && bookmark.clickHistory ? bookmark.clickHistory : [];
      bookmarks[id] = {
        ...bookmark,
        id,
        clickCount: clickHistory.length,
        clickHistory: clickHistory.length > 0 ? clickHistory : [],
        // 确保必需字段存在
        pinned: bookmark.pinned ?? false,
        tags: bookmark.tags ?? [],
        createdAt: bookmark.createdAt ?? Date.now(),
        updatedAt: bookmark.updatedAt ?? Date.now()
      };
    });

    // 转换标签数据，添加累计字段（初始值，后续会重新计算）
    Object.entries(fileData.data.tags).forEach(([id, tag]) => {
      tags[id] = {
        ...tag,
        id,
        clickCount: 0,
        usageCount: 0,
        pinned: tag.pinned ?? false,
        createdAt: tag.createdAt ?? Date.now(),
        updatedAt: tag.updatedAt ?? Date.now()
      };
    });

    // 转换工作区数据，添加clickCount
    if (fileData.data.workstations) {
      Object.entries(fileData.data.workstations).forEach(([id, workstation]) => {
        workstations[id] = {
          ...workstation,
          id,
          clickCount: 0,
          pinned: workstation.pinned ?? false,
          bookmarks: workstation.bookmarks ?? [],
          createdAt: workstation.createdAt ?? Date.now(),
          updatedAt: workstation.updatedAt ?? Date.now()
        };
      });
    }

    // 保存数据
    await saveBookmarksMap(bookmarks);
    await saveTagsMap(tags);
    await saveWorkstationsMap(workstations);

    result.imported.bookmarks = Object.keys(bookmarks).length;
    result.imported.tags = Object.keys(tags).length;
    result.imported.workstations = Object.keys(workstations).length;
  } else {
    // 增量模式：只导入不存在的数据
    // 按照依赖关系顺序导入：标签 -> 书签 -> 工作区
    const existingBookmarks = await getBookmarksMap();
    const existingTags = await getTagsMap();
    const existingWorkstations = await getWorkstationsMap();

    // 构建现有数据的索引
    const existingBookmarkUrls = new Set(
      Object.values(existingBookmarks).map((bm) => bm.url.toLowerCase())
    );
    const existingTagNames = new Set(
      Object.values(existingTags).map((tag) => tag.name)
    );
    const existingWorkstationNames = new Set(
      Object.values(existingWorkstations).map((ws) => ws.name)
    );

    const newBookmarks: Record<string, BookmarkItem> = { ...existingBookmarks };
    const newTags: Record<string, Tag> = { ...existingTags };
    const newWorkstations: Record<string, Workstation> = { ...existingWorkstations };

    // ID映射表：旧ID -> 新ID
    const tagIdMap = new Map<string, string>();
    const bookmarkIdMap = new Map<string, string>();
    const workstationIdMap = new Map<string, string>();

    // 第一步：导入标签，建立标签ID映射
    Object.entries(fileData.data.tags).forEach(([oldTagId, tag]) => {
      if (existingTagNames.has(tag.name)) {
        result.skipped.tags++;
        // 找到现有的标签ID用于映射
        const existingTag = Object.values(existingTags).find((t) => t.name === tag.name);
        if (existingTag) {
          tagIdMap.set(oldTagId, existingTag.id);
        }
        return;
      }

      // 如果ID已存在，生成新ID
      let newTagId = oldTagId;
      if (newTags[oldTagId]) {
        newTagId = generateId('tag');
      }

      newTags[newTagId] = {
        ...tag,
        id: newTagId,
        clickCount: 0,
        usageCount: 0,
        pinned: tag.pinned ?? false,
        createdAt: tag.createdAt ?? Date.now(),
        updatedAt: tag.updatedAt ?? Date.now()
      };
      tagIdMap.set(oldTagId, newTagId);
      existingTagNames.add(tag.name); // 避免同批次重复
      result.imported.tags++;
    });

    // 第二步：导入书签，使用标签ID映射更新书签中的标签引用，建立书签ID映射
    Object.entries(fileData.data.bookmarks).forEach(([oldBookmarkId, bookmark]) => {
      const normalizedUrl = bookmark.url.toLowerCase();
      if (existingBookmarkUrls.has(normalizedUrl)) {
        result.skipped.bookmarks++;
        // 找到现有的书签ID用于映射
        const existingBookmark = Object.values(existingBookmarks).find(
          (b) => b.url.toLowerCase() === normalizedUrl
        );
        if (existingBookmark) {
          bookmarkIdMap.set(oldBookmarkId, existingBookmark.id);
        }
        return;
      }

      // 如果ID已存在，生成新ID
      let newBookmarkId = oldBookmarkId;
      if (newBookmarks[oldBookmarkId]) {
        newBookmarkId = generateId('bm');
      }

      // 更新书签中的标签ID引用（使用新的标签ID）
      const mappedTagIds = bookmark.tags.map((oldTagId) => tagIdMap.get(oldTagId) ?? oldTagId);

      const clickHistory = includeHistory && bookmark.clickHistory ? bookmark.clickHistory : [];
      newBookmarks[newBookmarkId] = {
        ...bookmark,
        id: newBookmarkId,
        tags: mappedTagIds,
        clickCount: clickHistory.length,
        clickHistory: clickHistory.length > 0 ? clickHistory : [],
        pinned: bookmark.pinned ?? false,
        createdAt: bookmark.createdAt ?? Date.now(),
        updatedAt: bookmark.updatedAt ?? Date.now()
      };
      bookmarkIdMap.set(oldBookmarkId, newBookmarkId);
      existingBookmarkUrls.add(normalizedUrl); // 避免同批次重复
      result.imported.bookmarks++;
    });

    // 第三步：导入工作区，使用书签ID映射更新工作区中的书签引用
    if (fileData.data.workstations) {
      Object.entries(fileData.data.workstations).forEach(([oldWorkstationId, workstation]) => {
        if (existingWorkstationNames.has(workstation.name)) {
          result.skipped.workstations++;
          return;
        }

        // 如果ID已存在，生成新ID
        let newWorkstationId = oldWorkstationId;
        if (newWorkstations[oldWorkstationId]) {
          newWorkstationId = generateId('ws');
        }

        // 更新工作区中的书签ID引用（使用新的书签ID）
        const mappedBookmarkIds = workstation.bookmarks
          .map((oldBookmarkId) => bookmarkIdMap.get(oldBookmarkId))
          .filter((id): id is string => id !== undefined); // 过滤掉未映射的ID（被跳过的书签）

        newWorkstations[newWorkstationId] = {
          ...workstation,
          id: newWorkstationId,
          bookmarks: mappedBookmarkIds,
          clickCount: 0,
          pinned: workstation.pinned ?? false,
          createdAt: workstation.createdAt ?? Date.now(),
          updatedAt: workstation.updatedAt ?? Date.now()
        };
        workstationIdMap.set(oldWorkstationId, newWorkstationId);
        existingWorkstationNames.add(workstation.name); // 避免同批次重复
        result.imported.workstations++;
      });
    }

    // 保存数据
    await saveBookmarksMap(newBookmarks);
    await saveTagsMap(newTags);
    await saveWorkstationsMap(newWorkstations);
  }

  // 重新计算累计数据
  const finalBookmarks = await getBookmarksMap();
  const finalTags = await getTagsMap();
  recalcTagUsage(finalBookmarks, finalTags);
  
  // 重新计算标签点击次数（基于书签的clickCount）
  recalcTagClickCounts(finalBookmarks, finalTags);
  
  await saveTagsMap(finalTags);

  return result;
};

/**
 * 下载文件
 * @param content 文件内容（JSON字符串）
 * @param filename 文件名
 */
export const downloadFile = (content: string, filename: string) => {
  const blob = new Blob([content], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

/**
 * 生成导出文件名
 * @param productName 产品名称
 */
export const generateExportFilename = (productName: string = PRODUCT_NAME): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  
  return `${productName}_${year}${month}${day}_${hours}${minutes}${seconds}.json`;
};
