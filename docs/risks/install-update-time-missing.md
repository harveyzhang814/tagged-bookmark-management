# 风险点：设置页“安装/更新时间”可能为空（显示为 `—`）

## 背景

设置页新增“关于”模块，用于展示版本号与安装/更新时间。其中“安装/更新时间”来源于本地存储 key `tbm.installUpdateTime`（毫秒时间戳）。

## 涉及代码

- `src/background/index.ts`：
  - `chrome.runtime.onInstalled` 写入时间戳（L6-L9）
- `src/lib/storage.ts`：
  - `STORAGE_KEYS.INSTALL_UPDATE_TIME`（L4-L14）
  - `getInstallUpdateTime` / `saveInstallUpdateTime`（L184-L188）
- `src/pages/options/pages/SettingsPage.tsx`：
  - 读取并展示 `installUpdateTimeMs`（L51-L71、L193-L206）

## 触发条件

- 用户清空扩展本地数据（例如清除站点数据/扩展数据，或未来若提供“重置数据”且覆盖到该 key）。
- 在某些开发/调试场景下（非扩展运行环境），无法读写 `chrome.storage.local`。
- 升级链路极端情况下未触发 `onInstalled`（例如打包/加载方式异常），导致该 key 未写入。

## 影响与表现

- 设置页“关于”模块中的“安装/更新时间”显示为占位符 `—`，用户无法获知安装/更新日期。

## 规避建议

- **产品侧**：占位符是可接受降级；如需更明确，可将 `—` 改为“未知”并说明原因。
- **研发侧**：
  - 若未来提供“重置数据”，请避免误删 `tbm.installUpdateTime`，或在重置后主动补写当前时间戳。
  - 如需区分安装与更新时间，可在 `onInstalled` 的 `details.reason` 分支分别写入不同 key。

