import { getBookmarksMap, getWorkstationsMap, saveWorkstationsMap } from './storage';
import { openUrlsWithMode } from './chrome';
import { getBrowserTagWorkstationOpenMode } from './storage';
import { TAG_COLOR_PALETTE_24 } from './bookmarkService';
import type { Workstation, WorkstationInput } from './types';

const generateId = (prefix: string) => `${prefix}_${Math.random().toString(36).slice(2, 9)}`;

/**
 * 获取默认工作区颜色（智能分配：优先使用最少被使用的颜色）
 * @returns 返回预设颜色中使用次数最少的颜色
 */
const getDefaultWorkstationColor = async (): Promise<string> => {
  const workstations = await getWorkstationsMap();
  const workstationList = Object.values(workstations);
  
  // 统计每种预设颜色的使用次数
  const colorUsage = new Map<string, number>();
  TAG_COLOR_PALETTE_24.forEach(color => {
    colorUsage.set(color.toLowerCase(), 0);
  });
  
  // 统计现有工作区使用的颜色（忽略非预设颜色）
  workstationList.forEach(workstation => {
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

export const getAllWorkstations = async (): Promise<Workstation[]> => {
  const workstations = await getWorkstationsMap();
  return Object.values(workstations).map((workstation) => ({
    ...workstation,
    pinned: workstation.pinned ?? false,
    bookmarks: Array.from(new Set(workstation.bookmarks)) // 确保唯一性
  }));
};

export const getWorkstationById = async (id: string): Promise<Workstation | null> => {
  const workstations = await getWorkstationsMap();
  const workstation = workstations[id];
  return workstation || null;
};

export const createWorkstation = async (payload: WorkstationInput): Promise<Workstation> => {
  const workstations = await getWorkstationsMap();
  const id = generateId('ws');
  const now = Date.now();
  
  // 如果用户未提供颜色或颜色为空，使用智能分配获取默认颜色
  let workstationColor: string;
  if (payload.color && payload.color.trim()) {
    workstationColor = payload.color.trim();
  } else {
    workstationColor = await getDefaultWorkstationColor();
  }
  
  const workstation: Workstation = {
    id,
    name: payload.name,
    description: payload.description,
    color: workstationColor,
    bookmarks: [],
    pinned: Boolean(payload.pinned),
    clickCount: 0,
    createdAt: now,
    updatedAt: now
  };
  workstations[id] = workstation;
  await saveWorkstationsMap(workstations);
  return workstation;
};

export const updateWorkstation = async (
  workstationId: string,
  patch: Partial<WorkstationInput & { pinned: boolean }>
): Promise<Workstation | null> => {
  const workstations = await getWorkstationsMap();
  const target = workstations[workstationId];
  if (!target) return null;
  
  const updated: Workstation = {
    ...target,
    ...patch,
    updatedAt: Date.now()
  };
  
  // 如果更新了颜色，直接使用用户提供的颜色（去除首尾空格）
  if (patch.color !== undefined) {
    updated.color = patch.color.trim();
  }
  
  workstations[workstationId] = updated;
  await saveWorkstationsMap(workstations);
  return updated;
};

export const deleteWorkstation = async (workstationId: string): Promise<void> => {
  const workstations = await getWorkstationsMap();
  if (!workstations[workstationId]) return;
  delete workstations[workstationId];
  await saveWorkstationsMap(workstations);
};

export const addBookmarkToWorkstation = async (
  workstationId: string,
  bookmarkId: string
): Promise<Workstation | null> => {
  const workstations = await getWorkstationsMap();
  const workstation = workstations[workstationId];
  if (!workstation) return null;
  
  // 如果书签已存在，不重复添加
  if (workstation.bookmarks.includes(bookmarkId)) {
    return workstation;
  }
  
  const updated: Workstation = {
    ...workstation,
    bookmarks: [...workstation.bookmarks, bookmarkId],
    updatedAt: Date.now()
  };
  
  workstations[workstationId] = updated;
  await saveWorkstationsMap(workstations);
  return updated;
};

export const removeBookmarkFromWorkstation = async (
  workstationId: string,
  bookmarkId: string
): Promise<Workstation | null> => {
  const workstations = await getWorkstationsMap();
  const workstation = workstations[workstationId];
  if (!workstation) return null;
  
  const updated: Workstation = {
    ...workstation,
    bookmarks: workstation.bookmarks.filter(id => id !== bookmarkId),
    updatedAt: Date.now()
  };
  
  workstations[workstationId] = updated;
  await saveWorkstationsMap(workstations);
  return updated;
};

/**
 * 一键打开工作区中的所有书签
 */
export const openWorkstation = async (workstationId: string): Promise<void> => {
  const workstations = await getWorkstationsMap();
  const workstation = workstations[workstationId];
  if (!workstation) return;
  
  // 获取所有书签
  const bookmarks = await getBookmarksMap();
  
  // 打开工作区中的所有书签（按“标签/工作区书签打开方式”）
  const urls: string[] = [];
  for (const bookmarkId of workstation.bookmarks) {
    const bookmark = bookmarks[bookmarkId];
    if (bookmark?.url) {
      urls.push(bookmark.url);
    }
  }
  if (urls.length > 0) {
    const mode = await getBrowserTagWorkstationOpenMode();
    await openUrlsWithMode(urls, mode);
  }
  
  // 更新打开次数
  workstation.clickCount += 1;
  workstation.updatedAt = Date.now();
  await saveWorkstationsMap(workstations);
};
