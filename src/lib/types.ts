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

export interface StorageShape {
  bookmarks: Record<string, BookmarkItem>;
  tags: Record<string, Tag>;
}

export interface HotTag {
  tag: Tag;
  clickCount: number;
}


