---
name: merge-code-workflow
description: 将目标分支合并（merge）到当前分支（输入：目标分支），以两分支“最近一次分叉点”（merge-base）为边界定位本次需要纳入的 commits（仅覆盖最近分叉后的历史，不追溯更早多次 merge），以 commit message 为主并验证 docs/ 变更，必要时最小化查看代码 diff，生成 Conventional Commits 风格的 merge commit message，并自动执行 git merge + git commit（默认不 push）。适用于 merge/合并分支/同步 main(staging)/生成 merge commit message/解决冲突后提交 等场景。
---

# 合并分支工作流（merge-code-workflow）

## 触发时机

- 用户提到：**merge / 合并分支 / 同步 main(staging) / 把 A 合到当前分支 / 生成 merge commit message / 解决冲突后提交**

## 目标与输出

- **输入**：需要 merge 到当前分支的目标分支（例如 `main`、`staging`、`origin/main`、`feature/foo`）。
- **目标**：把 `<target>` 合并进当前分支，并生成**高信号**、**Conventional Commits** 风格的 merge commit message。
- **产出**：
  - 1) “本次 merge 会引入哪些 commits”的清单与摘要
  - 2) merge commit message（`chore(merge): ...`）
  - 3) 自动执行 `git merge` + `git commit`（默认不 push）

## 工作流步骤

### 0) 前置检查（必须）

- 确认工作区干净（避免把未提交改动混进 merge commit）：`git status --porcelain`
  - 若不干净：停止本流程，先处理（提交/暂存/stash）再继续。
- 若目标分支是远端分支或可能落后：先拉取引用（按需）：`git fetch --all --prune`

### 1) 确定对比边界与“本次会引入的 commits”（关键）

- 计算两分支**最近一次分叉点**（作为边界）：`git merge-base HEAD <target>`
- 定义对比范围：`RANGE = <merge-base>.."<target>"`
  - 解释：只覆盖“最近分叉点之后，目标分支新增的提交历史”；**不追溯**两分支更早的多次 merge 历史。

推荐命令：

- 列出本次需要纳入的 commits（倒序：从 `<target>` 最新开始）：
  - `git log --date=short --pretty=format:"%h %ad %s" <merge-base>.."<target>"`
- 若 `<merge-base>.."<target>"` 为空：
  - 结论：最近分叉点之后目标分支无新增 commits；停止后续步骤（无需 merge）。

### 2) 收集变更素材（message 优先，docs 验证，必要时查代码）

对 `<merge-base>.."<target>"` 中的每个 commit（建议从最新开始倒查）：

1. 提取 commit message（含 body）：
   - `git show -s --format="%H%n%an <%ae>%n%ad%n%s%n%n%b" <sha>`
2. 判断是否触及文档（只关注 `docs/`）：
   - `git diff --name-status <sha>^! -- docs/`
3. 若触及 `docs/`，做“文档变更验证”（默认只看 docs diff）：
   - `git show <sha> -- docs/`
   - 校验点：标题/结论/约束/风险/迁移说明是否与 commit message 对齐
4. 仅当语义不清或 docs 与 message 对不上时，才最小化查看代码 diff：
   - `git show <sha> --name-status`
   - `git show <sha> -- <suspect_paths...>`

### 3) 汇总与筛选“高信号变更”

把所有 commits 信息合并去重，优先输出：

- 功能变更（用户可感知）
- 修复（影响数据/稳定性/关键路径）
- 非功能变更（构建/发布/性能/安全/隐私，且确实影响交付）
- 破坏性/迁移：必须显式标注

### 4) 生成 Conventional Commits 风格的 merge commit message

- **标题（必须）**：使用 Conventional Commits 常见前缀体系
  - 推荐：`chore(merge): merge <target> into <current>`
- **正文（建议）**：3–8 条 bullets，按用户感知优先排序，并附关键 refs

模板：

```text
chore(merge): merge <target> into <current>

Summary:
- <重要功能/修复/非功能变更 1> (refs: <sha1>, <sha2>)
- <重要功能/修复/非功能变更 2> (refs: <sha3>)

Docs:
- <docs 关键结论或约束变化> (refs: <shaX>)

Notes:
- merge-base: <merge-base-sha>
```

### 5) 自动执行 merge + commit（默认不 push）

建议采用“先 merge 不提交，再用生成的 message 提交”，以便统一 commit 文案并可处理冲突：

1. 执行 merge（生成索引变更但不自动提交）：
   - `git merge --no-ff --no-commit "<target>"`
2. 若出现冲突：
   - 解决冲突后：`git add <resolved_files...>`
3. 进行提交（必须使用上一步生成的 Conventional message，HEREDOC 传参）：
   - `git commit -m "$(cat <<'EOF'\n<commit message>\nEOF\n)"`
4. 提交后校验：
   - `git status`
   - `git log -1 --oneline`

## 输出要求（在 chat 中交付）

- 必须给出：
  - `<target>` 与当前分支名
  - `merge-base`（sha）
  - `<merge-base>.."<target>"` 的 commits 列表（或数量）与高信号摘要
  - 最终 merge commit message（完整可复制）
  - 执行的关键 git 命令与最终 merge commit sha
  - 若有冲突：冲突文件列表与解决状态

## 执行边界（必须遵守）

- **默认会执行 `git merge` + `git commit`**；若工作区不干净则停止并提示先处理。
- **默认不 push**：除非用户明确要求 push；且不允许 force push。
- **不做 rebase / 不跳过 hooks**：不使用 `--no-verify`、不做破坏性历史改写（除非用户明确要求并确认风险）。
- **代码阅读最小化**：以 commit message 为主；仅在语义不清/对不齐时最小化查看代码 diff。

