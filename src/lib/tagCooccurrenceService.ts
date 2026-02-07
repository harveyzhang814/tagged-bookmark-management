import { getBookmarksMap, getTagCooccurrenceMap, saveTagCooccurrenceMap } from './storage';
import type { BookmarkItem } from './types';

/**
 * 生成共现对的 key：两 tagId 按字符串排序后用 | 连接，保证同一对只有一条记录。
 */
const pairKey = (id1: string, id2: string): string =>
  id1 < id2 ? `${id1}|${id2}` : `${id2}|${id1}`;

/**
 * 根据当前所有书签，重新计算两两 tag 的共现次数。
 * 仅当共现次数 ≥ 1 时写入 key（稀疏存储）。
 */
export const recalcTagCooccurrence = (
  bookmarks: Record<string, BookmarkItem>
): Record<string, number> => {
  const count = new Map<string, number>();

  for (const bookmark of Object.values(bookmarks)) {
    const tagIds = bookmark.tags ?? [];
    for (let i = 0; i < tagIds.length; i++) {
      for (let j = i + 1; j < tagIds.length; j++) {
        const key = pairKey(tagIds[i], tagIds[j]);
        count.set(key, (count.get(key) ?? 0) + 1);
      }
    }
  }

  const result: Record<string, number> = {};
  count.forEach((value, key) => {
    result[key] = value;
  });
  return result;
};

/**
 * 从存储读取书签，重算共现并写回存储。
 * 在 bookmark 新增/更新/删除后调用，或由关系图内“刷新关系数据”手动触发。
 */
export const syncTagCooccurrence = async (): Promise<void> => {
  const bookmarks = await getBookmarksMap();
  const cooccur = recalcTagCooccurrence(bookmarks);
  await saveTagCooccurrenceMap(cooccur);
};
