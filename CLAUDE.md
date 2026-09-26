# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

One Site One Bookmark：Chrome 扩展（Manifest V3），按网站开关；某网站开关打开时，在该网站新建书签会自动删除同一 hostname 下的其他旧书签，使每个网站只保留最新一个书签（用于记录阅读进度）。

纯原生 HTML/CSS/JS（ES modules），无 `package.json`、无构建步骤、无 lint、无测试框架。

开发历史、各次决策的原因与待办 / 遗留见 `DEVLOG.md`。

## 开发与验证

- 加载：`chrome://extensions` → 开启「开发者模式」→「加载已解压的扩展程序」→ 选择仓库根目录。
- **改动必须落到主目录的 `main` 才能被 Chrome 加载**：从 `claude agents` 启动的后台会话默认只能在 `.claude/worktrees/` 下的 worktree 里编辑，改完需提交并 `git merge --ff-only` 回主目录的 `main`，再刷新扩展。若 `.claude/settings.json` 设置了 `{"worktree": {"bgIsolation": "none"}}`，则直接在主目录修改，不使用 worktree。
- 修改后：在扩展卡片上点刷新；popup 改动重新打开 popup 即可生效。
- 调试 service worker：扩展卡片上的「Service Worker」链接打开 DevTools 看 console。
- 验证流程：网站 X 打开开关、网站 Y 保持关闭 → 两边各新建两个书签 → X 只剩最新一个，Y 两个都保留；被删的书签出现在 popup「最近删除」中，点恢复后回到原文件夹，且不会触发再次删除。

## 架构

两个运行上下文，通过 `chrome.storage.local` 共享状态：`enabled_sites`（`{ [hostname]: 开启时间 }`）记录各网站开关，`trash`（最近删除的书签，最多 50 条，新的在前，超过 7 天的记录读取时过滤、下次写入时清除）用于恢复。

- `page/hello.html` + `script/hello.js`：popup UI，显示当前 tab 的 hostname 与本站收藏数；开启时若本站已有多于 1 个收藏，先在 popup 内确认再开启；「最近删除」默认折叠，展开后可恢复、删除单条（丢弃记录）、两步确认清空全部。非 http(s) 页面开关置灰不可点。
- `script/service-worker.js`：后台监听 `chrome.bookmarks.onCreated`，以**新书签自身的 hostname** 判断是否开启（不看当前 tab），开启时删除除新书签以外的同域书签，删除前写入 `trash`。书签导入期间（`onImportBegan` ~ `onImportEnded`）不处理。`onInstalled` 时清除旧版全局开关 key `recorded_datetime`。
- **`trash` 的所有写操作只在 service worker 内、经 `with_trash_lock` 串行执行**：popup 只读 `trash`，写操作通过 `chrome.runtime.sendMessage` 发 `{type: "restore" | "discard", id}` 或 `{type: "clear"}`。否则 popup 与 service worker 并发「读-改-写」会互相覆盖、丢记录。
- **恢复**：service worker 先记下待恢复的 URL 再 `chrome.bookmarks.create`，对应的 `onCreated` 据此跳过；否则恢复出的书签会被当成最新书签，反而删掉当前书签。同一条目正在恢复时重复请求直接忽略。
- `script/utils/site.js`：`is_site_enabled` / `enable_site` / `disable_site`。
- `script/utils/bookmark.js`：`find_bookmarks_by_domain`（按 hostname 遍历书签树）与 `trash` 的读写。
- **多语言**：`_locales/en`（`default_locale`）与 `_locales/zh_CN` 两套 `messages.json`，按浏览器语言自动选择。manifest 的 `name` / `description` 用 `__MSG_*__`；popup 静态文字写在 HTML 的 `data-i18n="key"` 上，由 `hello.js` 的 `localize_page()` 填充；动态文字用 `chrome.i18n.getMessage(key, [替换值])`。

需要注意的现状：
- 读取当前 tab 的 `tab.url` 依赖 `activeTab`（用户点击扩展图标打开 popup 时临时授予），没有 `host_permissions`，安装时无网站权限警告。service worker 处理书签不需要网站权限。
- hostname 精确匹配，`www.example.com` 与 `example.com` 视为不同网站。
- popup 开/关样式通过切换 `css/hello.css` 中成对的 `btn-on*` / `btn-off*` class 实现。

## 约定

- 函数与变量用 `snake_case`，popup 中的 DOM 常量用 `_UPPER` 前缀（如 `_BTN`）。
- 新增文件需保持 ES module 形式（manifest 中 service worker 为 `"type": "module"`，popup 脚本用 `type="module"`）。
- 修改 `manifest.json` 的 `permissions` / `host_permissions` 前先确认必要性。
- 每完成一项功能或修复，在 `DEVLOG.md`「开发记录」最上方追加一节（背景、决策、改动、验证、对应提交），并同步更新「当前状态」与「待办 / 遗留」。
- 新增或修改界面文字时，`_locales/en` 与 `_locales/zh_CN` 必须同时加同名 key，不在 HTML / JS 里写死文字。
- 发版：tag 名为 `vX.Y`，与 `manifest.json` 的 `version` 一致（每次上传商店的版本号必须比上次大）。每个版本在 `releases/` 下归档两个文件：`release-notes-vX.Y.md`（即 GitHub release 的说明）与 `one-site-one-bookmark-vX.Y.zip`（GitHub release 附件，也是上传 Chrome Web Store 的包）。zip 从 tag 打包，只含扩展运行所需文件，**`manifest.json` 必须在 zip 根目录**（商店要求，不加 `--prefix`）：
  ```
  git archive --format=zip -o releases/one-site-one-bookmark-vX.Y.zip vX.Y manifest.json _locales css page script images/icon_16.png images/icon_32.png images/icon_64.png images/icon_128.png
  ```
  （`v1.0` 的 zip 带 `one-site-one-bookmark/` 外层目录，是改约定前的产物。）
- 商店上架材料放在 `store/`：`store/README.md` 为后台填写指南（双语文案、隐私页答案、操作步骤），`store/images/` 为商店图标、截图、宣传图（文件名带语言后缀 `-en` / `-zh_CN`）。隐私政策为仓库根目录的 `PRIVACY.md`。
