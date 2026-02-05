import { getBookmarksMap, getWorkstationsMap, saveWorkstationsMap } from './storage';
import { openUrlsWithMode } from './chrome';
import { getBrowserTagWorkstationOpenMode } from './storage';
import type { Workstation, WorkstationInput } from './types';

const generateId = (prefix: string) => `${prefix}_${Math.random().toString(36).slice(2, 9)}`;

type WorkstationRaw = Workstation & { color?: string };

function toWorkstation(raw: WorkstationRaw): Workstation {
  const { color: _c, ...rest } = raw;
  return rest as Workstation;
}

export const getAllWorkstations = async (): Promise<Workstation[]> => {
  const workstations = await getWorkstationsMap();
  return Object.values(workstations).map((workstation) => {
    const w = toWorkstation(workstation as WorkstationRaw);
    return {
      ...w,
      pinned: w.pinned ?? false,
      bookmarks: Array.from(new Set(w.bookmarks))
    };
  });
};

export const getWorkstationById = async (id: string): Promise<Workstation | null> => {
  const workstations = await getWorkstationsMap();
  const raw = workstations[id];
  if (!raw) return null;
  return toWorkstation(raw as WorkstationRaw);
};

export const createWorkstation = async (payload: WorkstationInput): Promise<Workstation> => {
  const workstations = await getWorkstationsMap();
  const id = generateId('ws');
  const now = Date.now();
  const workstation: Workstation = {
    id,
    name: payload.name,
    description: payload.description,
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
  const targetRest = toWorkstation(target as WorkstationRaw);
  const updated: Workstation = {
    ...targetRest,
    ...patch,
    updatedAt: Date.now()
  };
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
  if (workstation.bookmarks.includes(bookmarkId)) {
    return toWorkstation(workstation as WorkstationRaw);
  }
  const w = toWorkstation(workstation as WorkstationRaw);
  const updated: Workstation = {
    ...w,
    bookmarks: [...w.bookmarks, bookmarkId],
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
  const w = toWorkstation(workstation as WorkstationRaw);
  const updated: Workstation = {
    ...w,
    bookmarks: w.bookmarks.filter((id) => id !== bookmarkId),
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
