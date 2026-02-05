# 风险点：虚拟化网格在动态高度/快速变更下可能出现滚动跳动

## 背景

Options 管理页的 Bookmarks/Tags 列表已引入虚拟化网格（按行虚拟化），以提升大数据量场景性能。虚拟化组件会基于渲染结果测量/缓存 item 高度，并在数据或布局变化时进行校正。

当列表项高度变化频繁或容器尺寸快速变化时，可能产生“滚动位置轻微跳动”的体感。

## 涉及代码

- `src/pages/options/pages/BookmarksPage.tsx`
  - `ResizeObserver` 计算列数与卡片宽度策略
  - `react-virtuoso` + `customScrollParent`
- `src/pages/options/pages/TagsPage.tsx`
  - 固定卡片宽度推导列数（200px）
  - `react-virtuoso` + `customScrollParent`
- `src/pages/options/pages/bookmarksPage.css` / `src/pages/options/pages/tagsPage.css`
  - 虚拟行 grid 布局与 gap/底部 padding

## 触发条件

- 列表项高度不稳定（例如描述字段出现/消失、字体大小变化、翻译文本长度变化导致换行）
- 窗口/容器尺寸快速变化（用户频繁拖拽窗口宽度、侧边栏开合导致容器宽度变化）
- 数据集很大且同时发生过滤/排序切换（导致大量虚拟项重排）

## 影响与表现

- 滚动过程中出现轻微“跳动/回弹”，尤其在列数切换（列数变化导致 rows 重新 chunk）时更明显
- 在极端情况下可能出现短暂的空白区域（虚拟化重新测量期间）

## 规避建议

- **保持卡片高度稳定**：对标题/描述/标签等做 clamp，避免高度频繁变化（已在 Bookmarks 卡片做了标题/标签约束；Tags 卡片建议对 description 做可选 clamp 若后续出现跳动）。
- **控制列数变更频率**：列数推导逻辑避免在临界值附近频繁抖动（必要时可引入 hysteresis/阈值缓冲）。
- **交互侧约束**：在大列表场景切换筛选/排序后可主动回顶或提示（避免用户在中段位置感知到跳动）。

