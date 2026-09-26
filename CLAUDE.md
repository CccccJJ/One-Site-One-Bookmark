# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

One Site One Bookmark：Chrome 扩展（Manifest V3），按网站开关；某网站开关打开时，在该网站新建书签会自动删除同一 hostname 下的其他旧书签，使每个网站只保留最新一个书签（用于记录阅读进度）。

纯原生 HTML/CSS/JS（ES modules），无 `package.json`、无构建步骤、无 lint、无测试框架（验证脚本见 `tools/`）。

开发历史、各次决策的原因与待办 / 遗留见 `DEVLOG.md`。

## 目录结构

```
extension/     扩展本体：Chrome 加载此目录，也是打包上架的全部内容；只放运行需要的文件
  manifest.json
  _locales/    en（默认）/ zh_CN 的 messages.json
  icons/       扩展图标 16 / 32 / 64 / 128
  popup/       popup.html / popup.css / popup.js
  background/  service-worker.js
  utils/       popup 与 service worker 共用的模块
assets/        不进扩展包的图片：图标设计原图、README 用截图
store/         Chrome Web Store 上架材料：README.md 为后台填写指南，images/ 为商店图标、截图、宣传图（文件名带 -en / -zh_CN）
releases/      各版本归档：release-notes-vX.Y.md + one-site-one-bookmark-vX.Y.zip
tools/         本地验证与素材生成脚本（不进扩展包）
PRIVACY.md     隐私政策（商店填写的隐私网址指向它，不要移动或改名）
README.md / DEVLOG.md / CLAUDE.md
```

- 新文件先按上表判断归属；**任何不参与扩展运行的文件都不要放进 `extension/`**。
- 需要新的顶层目录时，先在本节补充约定再创建。

## 开发与验证

- 加载：`chrome://extensions` → 开启「开发者模式」→「加载已解压的扩展程序」→ 选择 **`extension/`** 目录。未打包扩展的身份与目录路径绑定，换目录加载相当于新扩展（本地开关与「最近删除」不会带过去）。
- 修改后：在扩展卡片上点刷新；popup 改动重新打开 popup 即可生效。
- 调试 service worker：扩展卡片上的「Service Worker」链接打开 DevTools 看 console。
- 本机的后台会话直接在主目录修改（`.claude/settings.json` 设置了 `{"worktree": {"bgIsolation": "none"}}`，该文件被 git 忽略）。若没有此设置，后台会话只能在 `.claude/worktrees/` 下的 worktree 里编辑，改完需 `git merge --ff-only` 回主目录的 `main`，Chrome 才加载得到。
- 验证脚本（在仓库根目录运行）：
  - `node tools/test-service-worker.mjs`：用模拟的 `chrome` API 测 service worker（删除、trash、恢复、导入保护、并发等）。
  - `node tools/check-i18n.mjs`：两种语言 key 一致、代码用到的 key 都存在、描述 ≤ 132 字、界面代码无写死中文、manifest 权限。
  - `for f in extension/**/*.js; do node --check "$f"; done`（zsh）：语法检查。
  - `bash tools/render-store-images.sh`：用 headless Chrome 重新生成 `store/images/` 全部素材（依赖 macOS 上的 Google Chrome）。
- 手动验证流程：网站 X 打开开关、网站 Y 保持关闭 → 两边各新建两个书签 → X 只剩最新一个，Y 两个都保留；被删的书签出现在 popup「最近删除」中，点恢复后回到原文件夹，且不会触发再次删除。

## 架构

两个运行上下文，通过 `chrome.storage.local` 共享状态：`enabled_sites`（`{ [hostname]: 开启时间 }`）记录各网站开关，`trash`（最近删除的书签，最多 50 条，新的在前，超过 7 天的记录读取时过滤、下次写入时清除）用于恢复。以下路径均相对 `extension/`。

- `popup/`：popup UI，显示当前 tab 的 hostname 与本站收藏数；开启时若本站已有多于 1 个收藏，先在 popup 内确认再开启；「最近删除」默认折叠，展开后可恢复、删除单条（丢弃记录）、两步确认清空全部。非 http(s) 页面开关置灰不可点。
- `background/service-worker.js`：后台监听 `chrome.bookmarks.onCreated`，以**新书签自身的 hostname** 判断是否开启（不看当前 tab），开启时删除除新书签以外的同域书签，删除前写入 `trash`。书签导入期间（`onImportBegan` ~ `onImportEnded`）不处理。`onInstalled` 时清除旧版全局开关 key `recorded_datetime`。
- **`trash` 的所有写操作只在 service worker 内、经 `with_trash_lock` 串行执行**：popup 只读 `trash`，写操作通过 `chrome.runtime.sendMessage` 发 `{type: "restore" | "discard", id}` 或 `{type: "clear"}`。否则 popup 与 service worker 并发「读-改-写」会互相覆盖、丢记录。
- **恢复**：service worker 先记下待恢复的 URL 再 `chrome.bookmarks.create`，对应的 `onCreated` 据此跳过；否则恢复出的书签会被当成最新书签，反而删掉当前书签。同一条目正在恢复时重复请求直接忽略。
- `utils/site.js`：`is_site_enabled` / `enable_site` / `disable_site`。
- `utils/bookmark.js`：`find_bookmarks_by_domain`（按 hostname 遍历书签树）与 `trash` 的读写。
- **多语言**：`_locales/en`（`default_locale`）与 `_locales/zh_CN` 两套 `messages.json`，按浏览器语言自动选择。manifest 的 `name` / `description` 用 `__MSG_*__`；popup 静态文字写在 HTML 的 `data-i18n="key"` 上，由 `popup.js` 的 `localize_page()` 填充；动态文字用 `chrome.i18n.getMessage(key, [替换值])`。

需要注意的现状：
- 读取当前 tab 的 `tab.url` 依赖 `activeTab`（用户点击扩展图标打开 popup 时临时授予），没有 `host_permissions`，安装时无网站权限警告。service worker 处理书签不需要网站权限。
- hostname 精确匹配，`www.example.com` 与 `example.com` 视为不同网站。
- popup 开/关样式通过切换 `popup/popup.css` 中成对的 `btn-on*` / `btn-off*` class 实现。
- `tools/preview/` 通过模拟 `chrome` API 在普通网页里渲染真实的 popup 代码（`stub.js`），商店截图与 README 截图都由它生成；改了 popup 的界面后可重新生成截图。

## 约定

- 函数与变量用 `snake_case`，popup 中的 DOM 常量用 `_UPPER` 前缀（如 `_BTN`）。
- 新增文件需保持 ES module 形式（manifest 中 service worker 为 `"type": "module"`，popup 脚本用 `type="module"`）。
- 修改 `manifest.json` 的 `permissions` / `host_permissions` 前先确认必要性。
- 每完成一项功能或修复，在 `DEVLOG.md`「开发记录」最上方追加一节（背景、决策、改动、验证、对应提交），并同步更新「当前状态」与「待办 / 遗留」。DEVLOG 与 `releases/` 中的历史记录保留当时的路径与说法，不回改。
- 新增或修改界面文字时，`extension/_locales/en` 与 `extension/_locales/zh_CN` 必须同时加同名 key，不在 HTML / JS 里写死文字；改完跑 `node tools/check-i18n.mjs`。
- 发版：tag 名为 `vX.Y`，与 `extension/manifest.json` 的 `version` 一致（每次上传商店的版本号必须比上次大）。每个版本在 `releases/` 下归档两个文件：`release-notes-vX.Y.md`（即 GitHub release 的说明）与 `one-site-one-bookmark-vX.Y.zip`（GitHub release 附件，也是上传 Chrome Web Store 的包）。zip 从 tag 打包 `extension/` 目录，**`manifest.json` 必须在 zip 根目录**（商店要求）：
  ```
  git archive --format=zip -o releases/one-site-one-bookmark-vX.Y.zip vX.Y:extension
  ```
  （`v1.0` 的 zip 带 `one-site-one-bookmark/` 外层目录；`v1.0` / `v1.1` 是目录整理前的产物，当时扩展文件在仓库根目录。）
