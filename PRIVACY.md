# Privacy Policy / 隐私政策

**One Site One Bookmark** — Last updated / 最后更新：2026-09-26

[English](#english) · [中文](#中文)

---

## English

One Site One Bookmark ("the extension") runs entirely inside your browser. **It does not collect, transmit, sell, or share any of your data. It has no server and makes no network requests.**

### What the extension accesses, and why

| Data | Why | Where it stays |
| --- | --- | --- |
| Your bookmarks (title, URL, folder, position) | To count bookmarks on the current site, remove older bookmarks on sites you turned on, and restore them on request | Read and modified only through Chrome's bookmarks API on your device |
| The URL of the current tab, **only when you click the extension icon** (`activeTab`) | To know which site the on/off switch applies to | Used in memory only; never stored or sent anywhere |
| The list of sites you turned on | To remember your switch settings | `chrome.storage.local` on your device |
| Recently removed bookmarks (title, URL, folder, position, removal time) | So you can restore them | `chrome.storage.local` on your device; at most 50 entries, each deleted automatically after 7 days, and you can remove them anytime in the popup |

The extension does not read the content of any web page and does not use analytics, ads, or third-party services.

### Chrome Sync

If you have Chrome bookmark sync turned on, bookmarks removed by the extension are removed from your other devices by Chrome itself. The extension's own settings and "Recently deleted" list are stored locally and are not synced.

### Removing your data

Uninstalling the extension deletes all data it stored. Your bookmarks remain as they are in Chrome.

### Contact

Questions or concerns: open an issue at <https://github.com/CccccJJ/One-Site-One-Bookmark/issues>.

---

## 中文

One Site One Bookmark（以下简称"本扩展"）完全在你的浏览器内运行。**本扩展不收集、不传输、不出售、不分享你的任何数据；没有服务器，也不发出任何网络请求。**

### 本扩展访问哪些数据，以及用途

| 数据 | 用途 | 存放位置 |
| --- | --- | --- |
| 你的书签（标题、网址、所在文件夹、位置） | 统计当前网站的收藏数；在你开启的网站上删除旧书签；按你的要求恢复书签 | 只通过 Chrome 书签接口在本机读取和修改 |
| 当前标签页的网址，**仅在你点击扩展图标时**（`activeTab`） | 判断开关作用于哪个网站 | 只在内存中使用，不保存、不发送 |
| 你开启了开关的网站列表 | 记住你的开关设置 | 本机的 `chrome.storage.local` |
| 最近被删除的书签（标题、网址、所在文件夹、位置、删除时间） | 供你恢复 | 本机的 `chrome.storage.local`；最多 50 条，每条 7 天后自动删除，你也可以随时在 popup 中删除 |

本扩展不读取任何网页内容，不使用统计分析、广告或任何第三方服务。

### Chrome 同步

如果你开启了 Chrome 书签同步，本扩展删除的书签会由 Chrome 同步删除到你的其他设备。本扩展自己的设置和「最近删除」列表只保存在本机，不会同步。

### 删除你的数据

卸载本扩展会删除它保存的所有数据，你的书签保持在 Chrome 中的现状。

### 联系方式

如有疑问，请在 <https://github.com/CccccJJ/One-Site-One-Bookmark/issues> 提交 issue。
