为上架 Chrome Web Store 做准备的版本。功能与 v1.0 相同，权限更少，界面支持中英双语。

## 变化

- **权限更少**：不再申请「所有网站」权限，改用 `activeTab`——只在你点击扩展图标时读取当前标签页的网址。安装时不再提示「读取和更改您在所有网站上的所有数据」。
- **中英双语**：界面按浏览器语言自动显示中文或英文（其他语言显示英文）。
- 新增[隐私政策](https://github.com/CccccJJ/One-Site-One-Bookmark/blob/main/PRIVACY.md)：所有数据只在本机处理，不收集、不上传。
- 安装包内 `manifest.json` 位于 zip 根目录（Chrome Web Store 要求）。

## 安装

1. 下载下方的 `one-site-one-bookmark-v1.1.zip` 并解压到一个文件夹。
2. 打开 `chrome://extensions`，开启「开发者模式」。
3. 点击「加载已解压的扩展程序」，选择解压出的文件夹。

从 v1.0 升级：把新文件解压覆盖到原来加载的文件夹，再在 `chrome://extensions` 点击扩展卡片上的刷新，已开启的网站和「最近删除」记录都会保留。如果改从另一个文件夹加载，Chrome 会把它当成新扩展，旧的设置不会带过来。

详见 [README](https://github.com/CccccJJ/One-Site-One-Bookmark#readme)。
