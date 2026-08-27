# Kat-home

A minimal, frosted-glass style new tab homepage extension for Microsoft Edge.

[中文说明](#中文说明)

---

## ✨ Features

- **Clock** — Large "It's HH:mm" time display in the top-left corner.
- **Search Box** — Frosted-glass search bar with rounded corners.
  - Switch between Bing, Google, and Baidu.
  - Live search suggestions powered by Baidu.
- **Custom Navigation** — One-column quick-link panel; add, edit, or remove sites in settings.
- **Settings** — Bottom-left settings button lets you customize:
  - Default search engine
  - Wallpaper (local image or image URL)
  - Custom navigation links
- **Flat & Glassmorphism Design** — Unified rounded corners, translucent backgrounds, and subtle shadows.

## 📸 Preview

> Replace `screenshot.png` with your own screenshot.

![Kat-home Preview](./screenshot.png)

## 🚀 Installation

### Method 1: Load Unpacked (Recommended for testing)

1. Open Microsoft Edge and go to `edge://extensions/`.
2. Turn on **Developer mode** in the bottom-left corner.
3. Click **Load unpacked**.
4. Select the project folder, e.g. `D:\aiwork\harness\home-index`.
5. Open a new tab to see Kat-home.

### Method 2: Install from `.crx`

1. Go to `edge://extensions/`.
2. Turn on **Developer mode**.
3. Drag and drop the `Kat-home.crx` file into the page.
4. Confirm the installation.

> To build a `.crx` yourself, see [Build](#-build).

## 🛠️ Build

To package the extension into a `.crx` install file:

1. Open Edge and go to `edge://extensions/`.
2. Turn on **Developer mode**.
3. Click **Pack extension**.
4. Select the extension root folder.
5. Leave the private key field empty for the first build.
6. Edge will generate two files:
   - `Kat-home.crx` — the install package
   - `Kat-home.pem` — the private key (keep this safe for future updates)

## 📁 File Structure

```
Kat-home/
├── manifest.json      # Extension manifest
├── newtab.html        # New tab page markup
├── styles.css         # Frosted-glass styles and layout
├── script.js          # Clock, search, suggestions, settings logic
├── icon128.png        # Extension icon
└── README.md          # This file
```

## 🔐 Permissions

| Permission | Purpose |
|------------|---------|
| `storage` | Save your settings, wallpaper, navigation links, and recent searches locally. |
| `host_permissions` for `*.baidu.com` | Fetch live search suggestions from Baidu. |

No data is sent anywhere except search queries to the selected search engine and Baidu's suggestion API.

## 🎨 Customization

Click the green settings button in the bottom-left corner to:

- Change the default search engine (Bing / Google / Baidu)
- Set a custom wallpaper from your local disk or an image URL
- Add, edit, or remove navigation links

## 🧑‍💻 Development

Kat-home is built with plain HTML, CSS, and JavaScript — no build step required. Just edit the files and reload the extension in `edge://extensions/`.

## 📄 License

MIT License — feel free to use, modify, and share.

---

## 中文说明

**Kat-home** 是一个适用于 Microsoft Edge 的磨砂玻璃风格新标签页扩展。

### 主要功能

- 左上角大字体时间显示 `It's HH:mm`
- 磨砂玻璃搜索框，支持必应 / 谷歌 / 百度切换
- 百度搜索联想词
- 自定义网址导航
- 自定义壁纸与默认搜索引擎

### 安装方法

1. 打开 Edge，访问 `edge://extensions/`
2. 开启左下角「开发人员模式」
3. 点击「加载解压缩的扩展」
4. 选择本项目文件夹
5. 打开新标签页即可使用

### 打包

在 `edge://extensions/` 页面点击「打包扩展」，选择项目文件夹即可生成 `.crx` 安装包和 `.pem` 私钥文件。
