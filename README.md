# CrossTag Bookmarks

基于 **Manifest V3 + Vite + React + TypeScript** 打造的 Chrome 书签管理扩展。采用现代简洁设计，提供强大的标签系统、智能统计和多维度管理功能。

## ✨ 核心功能

### 📚 书签管理
- **快速收藏**：一键保存当前标签页，自动获取网站图标和标题
- **编辑与删除**：支持修改标题、URL、备注，可随时删除不需要的书签
- **置顶功能**：重要书签可置顶显示，优先展示在首页
- **点击统计**：自动记录每次点击，支持查看详细点击历史（精确到日期）
- **智能缩略图**：自动获取网站 favicon，美观展示

### 🏷️ 标签系统
- **自定义标签**：创建个性化标签，支持自定义名称和描述
- **16色预设模板**：提供精心设计的16种颜色预设，基于 OKLCH 色彩空间
- **智能选色**：自动分配使用次数最少的颜色，保持视觉平衡
- **颜色主题适配**：标签颜色支持明暗模式自动调节，边框和背景智能适配
- **标签统计**：
  - 使用次数：统计标签被多少书签使用
  - 点击次数：自动累加该标签下所有书签的点击次数
- **置顶标签**：重要标签可置顶，优先展示
- **自定义排序**：支持拖拽调整标签顺序，个性化管理

### 📊 数据统计与榜单
- **热门标签榜单**：按点击次数排序，快速发现常用标签
- **热门书签榜单**：按点击次数排序，快速访问常用网站
- **置顶展示**：置顶书签和置顶标签在首页优先展示
- **实时更新**：统计数据实时计算，无需手动刷新

### 🔍 搜索与筛选
- **全文搜索**：支持按标题、URL、标签名称搜索
- **标签筛选**：可按一个或多个标签筛选书签
- **置顶筛选**：快速查看所有置顶内容
- **组合筛选**：支持搜索与标签筛选组合使用

### 🔄 导入导出
- **数据导出**：导出所有书签和标签数据为 JSON 格式
  - 可选择是否包含点击历史记录
  - 自动生成带时间戳的文件名
- **数据导入**：支持两种导入模式
  - **增量模式**：只导入新数据，跳过已存在的书签和标签
  - **覆盖模式**：完全替换现有数据
  - 支持导入点击历史记录
- **Chrome 书签导入**：一键导入 Chrome 原生书签，自动去重

### 🎨 用户界面
- **现代简洁设计**：采用卡片式布局和圆角设计，界面优雅现代，交互流畅自然
- **明暗主题切换**：支持亮色和暗色主题，自动适配系统偏好，护眼舒适
- **响应式布局**：适配不同屏幕尺寸，流畅体验
- **侧边栏管理**：点击标签可打开侧边栏，查看该标签下的所有书签
- **拖拽操作**：
  - 快速拖拽标签到书签，快速分配标签
  - 从侧边栏拖出书签，快速移除标签绑定
- **上下文菜单**：右键菜单快速添加书签

## 🚀 快速开始

### 安装方式

#### 从源码构建
```bash
# 克隆仓库
git clone <repository-url>
cd tagged-bookmark-management

# 安装依赖
npm install

# 开发模式（监听文件变化）
npm run dev

# 生产构建
npm run build

# 运行测试
npm test

# 打包发布版本
npm run release
```

#### 在 Chrome 中加载扩展

1. 执行 `npm run build`，生成 `dist/` 目录
2. 打开 Chrome 扩展管理页面（`chrome://extensions`）
3. 启用右上角的"开发者模式"
4. 点击"加载已解压的扩展程序"
5. 选择项目的 `dist` 目录
6. 扩展加载完成后，点击工具栏图标即可使用

### 使用指南

#### Popup 弹窗（快速操作）
- 点击扩展图标打开弹窗
- 自动检测当前标签页，支持快速保存或编辑
- 如果当前页面已收藏，自动进入编辑模式
- 支持添加标签、设置置顶

#### Options 管理页面（完整功能）
- 在扩展详情页点击"选项"，或从 popup 点击设置图标
- **首页**：查看置顶书签、置顶标签、热门标签和热门书签榜单
- **书签页**：管理所有书签，支持搜索、筛选、排序、批量操作
- **标签页**：管理所有标签，支持自定义颜色、排序、统计查看

#### 上下文菜单
- 在任意网页右键，选择"加入 CrossTag Bookmarks"
- 快速将当前页面添加到书签

## 📁 项目结构

```
src/
  background/          # Service Worker（后台脚本）
    index.ts          # 上下文菜单注册
  components/         # React 组件库
    BookmarkCard.tsx  # 书签卡片
    TagCard.tsx       # 标签卡片
    BookmarkSidebar.tsx  # 书签侧边栏
    ImportExportModal.tsx  # 导入导出弹窗
    ...               # 其他 UI 组件
  lib/                # 核心业务逻辑
    bookmarkService.ts    # 书签和标签服务
    importExportService.ts # 导入导出服务
    storage.ts            # 存储封装
    types.ts              # TypeScript 类型定义
    theme.ts              # 主题管理
    chrome.ts             # Chrome API 封装
    colorUtils.ts         # 颜色工具函数
  pages/
    popup/            # Popup 弹窗页面
      BookmarkPopup.tsx
      Home.tsx
    options/          # Options 管理页面
      OptionsApp.tsx
      pages/
        HomePage.tsx      # 首页
        BookmarksPage.tsx # 书签管理页
        TagsPage.tsx      # 标签管理页
  styles/             # 全局样式
    global.css       # 全局样式与主题
  manifest.ts        # Manifest V3 配置
```

## 🛠️ 技术栈

- **框架**：React 18 + TypeScript
- **构建工具**：Vite 5
- **扩展框架**：@crxjs/vite-plugin（Manifest V3）
- **测试框架**：Vitest + @testing-library
- **样式**：CSS Modules + PostCSS
- **存储**：chrome.storage.local（本地存储）

## 📝 开发说明

### 开发模式
```bash
npm run dev
```
启动 Vite 开发服务器，监听文件变化并自动构建到 `dist/` 目录。可在 Chrome 中加载 `dist` 目录进行实时调试。

### 启用 Sourcemap
如需在开发时生成 sourcemap，可在构建前设置环境变量：
```bash
ENABLE_SOURCEMAP=true npm run build
```

### 测试
```bash
npm test
```
使用 Vitest 运行单元测试。测试文件位于 `src/lib/__tests__/`。

### 打包发布
```bash
npm run release
```
执行发布脚本，会：
- 以无 sourcemap 模式构建生产版本
- 清理调试文件（`.map`、`.vite` 等）
- 将 `dist/` 目录压缩为 `release/tagged-bookmark-management.zip`
- 可在 Chrome Web Store 后台上传该压缩包

## 🔒 隐私政策

本项目严格遵循隐私保护原则：

- **本地存储**：所有数据存储在 `chrome.storage.local`，仅保存在本地浏览器，不会上传到任何服务器
- **无服务器**：不向任何第三方服务器发送数据
- **最小权限**：仅请求必要的 Chrome API 权限
- **透明操作**：所有数据操作均在本地完成，用户可随时通过导入导出功能备份数据

详细隐私政策请参见 [PRIVACY_POLICY.md](./PRIVACY_POLICY.md)。

## 📋 权限说明

- `storage`：保存书签和标签数据到 `chrome.storage.local`（本地存储）
- `tabs`：获取当前标签页信息，用于快速收藏
- `bookmarks`：读取 Chrome 原生书签树，用于导入功能
- `contextMenus`：在右键菜单中添加"加入 CrossTag Bookmarks"选项

## 🎯 版本历史

### v0.3.1（当前版本）
- ✨ 标签颜色增加 16 色预设模板与智能选色
- ✨ 标签颜色改造，支持自定义 baseColor，边框主题色载体，背景色弱 tint
- ✨ 支持明暗模式自动调节标签颜色

### v0.3.0
- ✨ 首页增加热门标签和热门书签榜单
- ✨ 整体数据导入与导出同步功能
- 🎨 产品重命名为 CrossTag Bookmarks

### v0.2.0
- ✨ 标签列表和书签列表添加自定义排序
- ✨ 标签侧边栏支持拖拽移除绑定书签
- ✨ 首页标签点击打开绑定书签侧边栏
- ✨ 增加每次点击的详细日期记录
- ✨ 快捷弹窗支持已收藏网页的编辑模式

### v0.1.0
- 🎉 初始版本发布
- ✨ 基础书签和标签管理功能
- ✨ 现代简洁的 UI 设计
- ✨ 明暗主题切换

## 📄 许可证

MIT License

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

---

**CrossTag Bookmarks** - 让书签管理更简单、更优雅 🚀
