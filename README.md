# CrossTag Bookmarks

基于 **Manifest V3 + Vite + React + CRX** 打造的 Chrome 收藏管理扩展。主打复古像素风，可为网页添加多标签、置顶、热门统计与多维筛选。

## 功能特性

- 一键将当前标签页加入收藏，并自动生成缩略图。
- 标签系统支持自定义名称/颜色，统计使用与点击次数。
- Options 页面提供标签管理、网页管理两大面板，可搜索、筛选、批量编辑。
- Popup 首页展示置顶网页及热门标签，按钮与卡片采用像素化 UI。
- 通过 `chrome.storage.sync` 持久化，支持多设备同步。

## 开发调试

```bash
npm install
npm run dev     # 启动 Vite watch，输出 dist
npm run build   # 生成 release 版本
npm run test    # Vitest + jsdom 单元测试
npm run release # 构建并生成可上传压缩包
```

开发时可同时在 `npm run dev` 的输出目录内加载扩展。
如需在本地调试时生成 sourcemap，可在构建命令前设置 `ENABLE_SOURCEMAP=true`。

## 在 Chrome 中加载

1. 执行 `npm run build`，生成 `dist/`。
2. 打开 Chrome 扩展管理 (`chrome://extensions`)，启用“开发者模式”。
3. 点击“加载已解压的扩展程序”，选择 `dist` 目录。
4. 点击工具栏图标即可打开 popup；在扩展详情页打开 options 管理页。

## 打包发布

1. 执行 `npm run release`，脚本会：
   - 以无 sourcemap 模式构建；
   - 清理 `.map`、`.vite` 等调试产物；
   - 将 `dist/` 根目录内容直接压缩到 `release/tagged-bookmark-management.zip`。
2. 在 Chrome Web Store 后台上传上面生成的压缩包即可。

## 隐私政策

本项目会在 `chrome.storage.sync` 中保存您的书签、标签、主题和活动页签信息，并在导入功能中读取本地 Chrome 书签树。数据仅在本地计算及 Chrome 同步服务中使用，从不发送到第三方服务器。详情参见 [`PRIVACY_POLICY.md`](./PRIVACY_POLICY.md)。

## 目录结构

```
src/
  background/        # service worker
  components/        # 像素 UI 组件
  lib/               # storage 封装、业务服务、类型
  pages/
    popup/           # popup 首页
    options/         # options 入口与页面
  styles/            # 全局主题与像素风样式
```

## 测试

- 使用 `vitest` + `@testing-library`。
- `src/lib/__tests__/bookmarkService.test.ts` 覆盖标签/收藏核心逻辑，可按需继续扩展组件测试。

## 许可证

MIT