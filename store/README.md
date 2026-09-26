# Chrome Web Store 上架指南

照着本文件在 [Chrome Web Store 开发者后台](https://chrome.google.com/webstore/devconsole) 逐项填写。所有文案可直接复制；图片在 [`images/`](images/)。

> 依据：Chrome 官方文档（素材尺寸、隐私页 5 项、manifest 必须在 zip 根目录、多语言文案需扩展本身支持 `_locales`）。后台界面可能调整，字段名以后台为准。

## 0. 注册开发者账号（cc 本人）

- 用 Google 账号登录开发者后台，同意开发者协议，支付一次性注册费（目前为 5 美元，以后台显示为准）。
- 开发者邮箱创建后不能修改。

## 1. 上传包

- 「新建内容 / New item」→ 上传 `releases/one-site-one-bookmark-v1.1.zip`（`manifest.json` 在 zip 根目录）。
- 名称与简短说明来自 `manifest.json`（`_locales` 中的 `ext_name` / `ext_description`），无需另填。

## 2. 商品详情 / Store listing

扩展支持 `en`（默认）与 `zh_CN`，页面顶部的语言下拉框中分别填写两种语言。截图分「全球通用」与「以当地语言显示」两类：全球通用只放英文，中文截图放在「中文（简体）」语言下，不要把中英文一起放进全球通用（上限 5 张）。

| 字段 | 填写 |
| --- | --- |
| 类别 / Category | 推荐「工具 / Tools」（若列表中有「工作流程与规划 / Workflow & Planning」也可），以后台选项为准 |
| 语言 / Language | English（默认），另加 中文（简体） |
| 商店图标 | `images/store-icon-128.png`（128×128，96×96 图形 + 16px 透明留边） |
| 全球通用的屏幕截图（最多 5 张） | **只放英文 3 张**：`images/screenshot-1-en.png`、`screenshot-2-en.png`、`screenshot-3-en.png`（1280×800）。所有语言的用户都会看到这组 |
| 以当地语言显示的屏幕截图 | 顶部语言下拉框切到「中文（简体）」后上传 `images/screenshot-1-zh_CN.png`、`screenshot-2-zh_CN.png`、`screenshot-3-zh_CN.png`。官方展示顺序为「当地语言截图 → 全球通用截图」：中文用户先看到这 3 张中文图，之后仍会看到英文 3 张 |
| 小型宣传图块（440×280） | **只能传一张，不能按语言区分**（官方："The small tile and Marquee promo tile cannot be localized"）。用 `images/promo-small-en.png`；`promo-small-zh_CN.png` 备用 |
| 首页网址 / Homepage URL | `https://github.com/CccccJJ/One-Site-One-Bookmark` |
| 支持网址 / Support URL | `https://github.com/CccccJJ/One-Site-One-Bookmark/issues` |

### 详细说明（English）

```
One Site One Bookmark keeps only the newest bookmark on each site you choose — perfect for tracking your reading position on novel sites, docs, or long series, without a pile of outdated bookmarks.

HOW IT WORKS
• Click the toolbar icon on a site and turn the switch ON. It only applies to that site.
• From then on, when you bookmark a page on that site, the older bookmarks on the same site are removed automatically. Your newest bookmark is always your reading position.

BUILT-IN SAFETY
• Confirm before it takes over: the popup shows how many bookmarks the site already has, and asks before turning on if there is more than one.
• Recently deleted: removed bookmarks are kept for 7 days (up to 50) and can be restored to their original folder and position with one click. You can also remove single records or clear the list.
• Bookmark imports are never touched.

PRIVACY
Everything runs locally in your browser. No data is collected or sent anywhere, and no network requests are made. The extension only reads the current tab's address when you click its icon (activeTab).

NOTES
• A "site" means an exact hostname: www.example.com and example.com are different sites, and different books on the same site count as one site.
• Removing a bookmark is permanent in Chrome; "Recently deleted" is the only way to restore, and it is stored on this device only. With Chrome Sync on, removals sync to your other devices.

Open source: https://github.com/CccccJJ/One-Site-One-Bookmark
```

### 详细说明（中文）

```
One Site One Bookmark 让你开启的网站只保留最新的一个书签，适合在小说站、文档站、连载内容上记录阅读进度，不再积攒一串过期书签。

使用方式
• 在网站上点击工具栏图标，把开关拨到 ON，只对这个网站生效。
• 之后在这个网站收藏页面时，同一网站的旧书签会被自动删除，最新的书签就是你的阅读进度。

安全保护
• 开启前确认：popup 显示本站已有多少个收藏，多于 1 个时会先提示再开启。
• 最近删除：被删除的书签保留 7 天（最多 50 条），一键恢复到原文件夹、原位置；也可以删除单条记录或清空。
• 导入书签期间不做任何删除。

隐私
完全在浏览器本地运行，不收集、不上传任何数据，不发出任何网络请求。只在你点击扩展图标时读取当前标签页的网址（activeTab）。

注意
• 「同一网站」按域名精确判断：www.example.com 与 example.com 视为不同网站；同一域名下的不同书视为同一网站。
• Chrome 删除书签不可撤销，「最近删除」是唯一的恢复途径，只保存在本机；开启 Chrome 同步时，删除会同步到其他设备。

开源地址：https://github.com/CccccJJ/One-Site-One-Bookmark
```

## 3. 隐私权 / Privacy practices

### 单一用途 / Single purpose

```
Keep only the newest bookmark on each website the user turns on, so the user's reading position is always the latest bookmark, with a local "Recently deleted" list to restore removed bookmarks.
```

### 权限理由 / Permission justification

| 权限 | 填写 |
| --- | --- |
| `bookmarks` | `Core function: count the bookmarks on the current site, remove the older bookmarks on sites the user turned on when a new bookmark is created, and restore removed bookmarks when the user asks.` |
| `storage` | `Stores, on the user's device only, the list of sites the user turned on and the "Recently deleted" records (max 50, auto-removed after 7 days) used for restoring.` |
| `activeTab` | `When the user clicks the toolbar icon, reads the current tab's URL to know which site the on/off switch applies to. No page content is read.` |

### 远程代码 / Remote code

选择 **No, I am not using remote code**（所有代码都在扩展包内，无 `eval`、无外部脚本）。

### 数据使用 / Data usage

- 需勾选扩展处理的用户数据类型。本扩展读取书签与当前标签页网址，最接近 **「网络记录 / Web history」**，建议如实勾选；若后台对各类别的说明与此不符，以后台说明为准。
- 下方三项声明全部勾选（均属实）：
  - 不将用户数据出售或转让给第三方；
  - 不将用户数据用于与单一用途无关的目的；
  - 不将用户数据用于判断信用或放贷。

### 隐私政策网址 / Privacy policy URL

```
https://github.com/CccccJJ/One-Site-One-Bookmark/blob/main/PRIVACY.md
```

## 4. 分发 / Distribution

- 付款：免费 / Free
- 公开范围：公开 / Public
- 地区：所有地区

## 5. 测试说明 / Test instructions（可选，帮助审核）

```
1. Open any http(s) site that has 2+ bookmarks, click the toolbar icon: the popup shows the site and its bookmark count.
2. Turn the switch ON and confirm. Bookmark the current page (Ctrl/Cmd+D): the older bookmarks of that site are removed.
3. Open the popup, expand "Recently deleted", click "Restore": the bookmark returns to its original folder.
No account or login is needed.
```

## 6. 提交之后

- 点击「提交审核 / Submit for review」。审核时长取决于扩展情况，官方未给固定时间；审核通过后需在 30 天内发布。
- 上架后：把商店链接补到根目录 `README.md` 的「安装」一节，并在 `DEVLOG.md` 记录。
