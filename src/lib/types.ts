export interface Tag {
  id: string;
  name: string;
  color: string;
  description?: string;
  createdAt: number;
  updatedAt: number;
  usageCount: number;
  clickCount: number;
  pinned: boolean;
}

export interface BookmarkItem {
  id: string;
  url: string;
  title: string;
  note?: string;
  tags: string[];
  /**
   * 由“路径转标签”同步逻辑写入的 tag id 列表，用于后续仅替换路径标签并保留用户手动标签
   */
  pathTagIds?: string[];
  thumbnail?: string;
  pinned: boolean;
  clickCount: number;
  clickHistory?: number[];
  createdAt: number;
  updatedAt: number;
}

export interface BookmarkInput {
  url: string;
  title: string;
  note?: string;
  tags: string[];
  thumbnail?: string;
  pinned?: boolean;
}

export interface FilterOptions {
  query?: string;
  tags?: string[];
  onlyPinned?: boolean;
}

export interface Workstation {
  id: string;
  name: string;
  description?: string;
  color: string;
  bookmarks: string[];
  pinned: boolean;
  clickCount: number;
  createdAt: number;
  updatedAt: number;
}

export interface WorkstationInput {
  name: string;
  description?: string;
  color: string;
  pinned?: boolean;
}

export interface StorageShape {
  bookmarks: Record<string, BookmarkItem>;
  tags: Record<string, Tag>;
  workstations: Record<string, Workstation>;
}

export interface HotTag {
  tag: Tag;
  clickCount: number;
}

// 导入导出相关类型
export interface ImportExportMetadata {
  version: string;
  exportedAt: number;
  hasClickHistory: boolean;
  productName: string;
  hash?: string; // 未来扩展：文件完整性校验
}

export interface ImportExportData {
  bookmarks: Record<string, Omit<BookmarkItem, 'clickCount'>>;
  tags: Record<string, Omit<Tag, 'clickCount' | 'usageCount'>>;
  workstations?: Record<string, Omit<Workstation, 'clickCount'>>;
}

export interface ImportExportFile {
  metadata: ImportExportMetadata;
  data: ImportExportData;
}

export interface ImportFileData {
  metadata: ImportExportMetadata;
  data: ImportExportData;
  bookmarksCount: number;
  tagsCount: number;
  workstationsCount: number;
}

export interface ImportResult {
  imported: {
    bookmarks: number;
    tags: number;
    workstations: number;
  };
  skipped: {
    bookmarks: number;
    tags: number;
    workstations: number;
  };
}


