# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

One Site One Bookmark：Chrome 扩展（Manifest V3），开关打开时，新建书签会自动删除同一 hostname 下的其他旧书签，使每个网站只保留最新一个书签（用于记录阅读进度）。

纯原生 HTML/CSS/JS（ES modules），无 `package.json`、无构建步骤、无 lint、无测试框架。

## 开发与验证

- 加载：`chrome://extensions` → 开启「开发者模式」→「加载已解压的扩展程序」→ 选择仓库根目录。
- 修改后：在扩展卡片上点刷新；popup 改动重新打开 popup 即可生效。
- 调试 service worker：扩展卡片上的「Service Worker」链接打开 DevTools 看 console。
- 验证流程：打开开关 → 对同一网站新建书签 → 确认旧书签被删除；关闭开关后不应删除。

## 架构

两个运行上下文，通过 `chrome.storage.local` 共享一个开关状态：

- `page/hello.html` + `script/hello.js`：popup UI，切换开关。开启时写入 key `recorded_datetime`，关闭时删除该 key。
- `script/service-worker.js`：后台监听 `chrome.bookmarks.onCreated`，开关开启时遍历整棵书签树，按 `URL.hostname` 精确匹配，删除除新书签以外的同域书签。
- `script/utils/tab.js`：`curr_tab_site_is_recorded()` 判断 `recorded_datetime` 是否存在，两端共用。

需要注意的现状：
- 尽管函数名含 "curr_tab_site"，开关是**全局**的，不区分站点，也不读取当前 tab。
- hostname 精确匹配，`www.example.com` 与 `example.com` 视为不同网站。
- popup 开/关样式通过切换 `css/hello.css` 中成对的 `btn-on*` / `btn-off*` class 实现。

## 约定

- 函数与变量用 `snake_case`，popup 中的 DOM 常量用 `_UPPER` 前缀（如 `_BTN`）。
- 新增文件需保持 ES module 形式（manifest 中 service worker 为 `"type": "module"`，popup 脚本用 `type="module"`）。
- 修改 `manifest.json` 的 `permissions` / `host_permissions` 前先确认必要性。
