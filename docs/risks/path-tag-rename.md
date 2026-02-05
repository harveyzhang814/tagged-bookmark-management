# 风险点：修改“路径 Tag”名称可能导致同步产生新 Tag / 替换路径标签

## 背景

项目提供“一键同步”能力，可把 Chrome 原生书签导入到本扩展的数据模型中，并支持将书签所在文件夹路径**映射为 Tag**（下称“路径 Tag”）。

该能力的核心价值是：在不改变 Chrome 原生书签结构的前提下，用 Tag 体系复用/表达书签路径信息，方便筛选与组织。

## 相关实现（机制概览）

### 1) 路径 Tag 如何生成

在同步时，系统会从 `chrome.bookmarks.getTree()` 中提取所有包含 URL 的书签节点，并携带其文件夹路径分段 `pathSegments`（排除“书签栏/其他书签/移动设备书签”等顶层根分组）。

随后按用户选择的模式生成“路径 Tag 名称”：

- **hierarchical（层次）**：把整条路径拼成一个 Tag，例如 `project/alpha`
- **independent（独立）**：每一级文件夹各自一个 Tag，例如 `project`、`alpha`

实现位置：

- `src/lib/bookmarkService.ts`：`extractBookmarkNodesWithPath()`、`importChromeBookmarks()`

### 2) 路径 Tag 的“命中/复用”规则

路径 Tag 是先由**名称字符串**生成，再映射到 Tag **id**：

- 以 `tag.name.trim().toLowerCase()` 作为 key，建立 `tagNameToId` 映射
- 同步时对每个路径 Tag 名称调用 `ensureTagIdByName(name)`
  - 若 key 已存在：复用已有 tag.id
  - 若 key 不存在：创建新 Tag（生成新的 tag.id）

实现位置：

- `src/lib/bookmarkService.ts`：`tagNameToId`、`ensureTagIdByName()`

### 3) 路径 Tag 如何存储到书签上

每条书签保存两份 Tag id 列表：

- `BookmarkItem.tags: string[]`：书签当前拥有的所有 Tag id（包含用户手动标签 + 路径 Tag）
- `BookmarkItem.pathTagIds?: string[]`：仅由“路径转标签”逻辑写入的 Tag id 列表，用于后续“只替换路径标签、保留用户手动标签”

类型定义位置：

- `src/lib/types.ts`：`BookmarkItem.pathTagIds`

## 风险描述

**如果你修改了某个“路径 Tag”的名称（tag.name），下一次同步时可能会发生：**

- 同一路径生成的“路径 Tag 名称”无法再命中原来的 tag.id（因为命中依据是 `name.trim().toLowerCase()`）
- 系统会创建一个新的 Tag（名字为“原路径字符串”），导致“路径 Tag 发生分裂（旧的改名 Tag + 新建的原名 Tag 并存）”
- 若开启“转化已同步数据”（即对已存在书签执行路径 tag 更新），书签的路径 Tag 可能被替换为新建 Tag，旧的改名 Tag 会从书签上被移除（因为它仍然被视作旧路径标签的一部分）

## 触发条件

满足以下条件时风险更容易出现：

- 你手动修改了某个路径 Tag 的名称（`Tag.name`）
- 后续再次执行“一键同步”
  - 特别是开启了“转化已同步数据 / convertExisting”
- Chrome 原生书签中仍然存在会生成该路径字符串的书签路径（即 `pathSegments` 组合后仍会产生原始路径 Tag 名称）

## 影响与表现

- **Tag 列表出现重复/相近 Tag**：例如你把 `project/alpha` 改成 `project-alpha`，后续同步又会新建一个 `project/alpha`
- **已同步书签的 Tag 发生变化**：
  - 开启“转化已同步数据”时：书签会移除旧的 `pathTagIds` 对应 id，再写入新计算出的 `pathTagIds`
  - 结果可能是：你改名后的路径 Tag 不再绑定在这些书签上（被新的“原路径名 Tag”替换）
- **筛选结果变化**：按你改名后的 Tag 筛选，可能突然筛不到原本的书签（因为这些书签在同步更新后绑定的是新 Tag id）

## 复现步骤（建议用于验证）

1. 执行“一键同步”，开启“转化路径为标签”，选择任一模式（层次/独立均可）。
2. 找到一个由路径产生的 Tag（例如 `project/alpha`），将其重命名为 `project-alpha`。
3. 再次执行“一键同步”，并开启“转化已同步数据”。
4. 观察：
   - Tag 列表中可能出现新的 `project/alpha`
   - 原本绑定 `project-alpha` 的书签，其 Tag 可能被替换为新的 `project/alpha`

## 规避建议（使用层面）

- **尽量不要直接重命名路径 Tag**。如果需要一个“更友好”的名字：
  - 更推荐创建一个新的“手动 Tag”（非路径 Tag），用于业务语义命名；路径 Tag 继续保持与 Chrome 路径一致。
- **如果必须重命名路径 Tag**：
  - 后续执行“一键同步”时，避免开启“转化已同步数据”（`convertExisting=false`），否则更容易触发替换/分裂
  - 或者同步前先在 Chrome 原生书签中同步修改对应文件夹路径，使新路径字符串与改名后的 Tag 语义一致（注意：当前实现的匹配规则仍是按名称字符串，不是按历史映射）

## 研发侧建议（长期修复方向）

如果希望产品允许“路径 Tag 可重命名且不影响同步”，可以考虑以下方向（按侵入性从低到高）：

- **为 Tag 增加来源/类型元数据**：例如 `tag.source = 'path' | 'manual'`，或 `tag.pathKey`（稳定 key）用于路径命中，而不依赖 `name` 文本。
- **为路径 Tag 增加稳定的 key**：
  - hierarchical：`pathKey = pathSegments.join('/')`（或更稳定的编码形式）
  - independent：`pathKey = segmentName`（并考虑层级冲突）
  - 同步时使用 `pathKey -> tag.id` 映射，而不是 `name -> id`
- **改造书签上的路径关联**：在 `BookmarkItem` 上持久化 `pathKey(s)`（而不仅是 `pathTagIds`），使更新逻辑能够可靠定位并更新对应的路径 Tag。

## 参考实现入口

- `src/lib/bookmarkService.ts`
  - `extractBookmarkNodesWithPath()`
  - `importChromeBookmarks()`
  - `tagNameToId` / `ensureTagIdByName()`
- `src/lib/types.ts`
  - `BookmarkItem.pathTagIds`

