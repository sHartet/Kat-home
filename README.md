# Kat-home

一个适用于 Microsoft Edge 的磨砂玻璃风格新标签页扩展。

<img width="1914" height="987" alt="Snipaste_2026-08-27_21-39-15" src="https://github.com/user-attachments/assets/96293a19-cf57-4cc6-bc65-93b8b0cbb663" />

## ✨ 功能特性

- **时间** — 左上角大号显示 `It's HH:mm`。
- **搜索框** — 磨砂玻璃质感、圆角搜索条。
  - 支持必应、谷歌、百度三种搜索引擎切换。
  - 百度搜索联想词与历史搜索记录。
  - 搜索结果在新标签页打开。
- **网址导航** — 单列快捷导航卡片，支持拖动排序。
  - 可在设置中增删改导航项。
  - 仅显示文字 + 右侧低透明度箭头。
- **设置按钮** — 左下角半透明设置按钮，可自定义：
  - 默认搜索引擎
  - 壁纸（本地图片 / 图片 URL）
  - 网址导航
- **扁平化 + 磨砂玻璃设计** — 统一圆角、半透明背景、柔和阴影。

## 📸 预览

> 将 `screenshot.png` 替换为你自己的截图。

![Kat-home Preview](./screenshot.png)

## 🚀 安装

1. 打开 Microsoft Edge，地址栏输入 `edge://extensions/` 并回车。
2. 开启左下角「**开发人员模式**」。
3. 点击「**加载解压缩的扩展**」。
4. 选择本项目文件夹，例如 `D:\aiwork\harness\home-index`。
5. 打开新标签页即可使用 Kat-home。


## 📁 文件结构

```
Kat-home/
├── manifest.json      # 扩展清单
├── newtab.html        # 新标签页 HTML
├── styles.css         # 磨砂玻璃样式与布局
├── script.js          # 时间、搜索、联想词、设置逻辑
├── icon128.png        # 扩展图标
├── favicon.png        # 标签页图标
├── README.md          # 本文件
└── RELEASE_NOTES.md   # 版本说明
```

## 🔐 权限说明

| 权限 | 用途 |
|------|------|
| `storage` | 本地保存设置、壁纸、网址导航、历史搜索记录。 |
| `host_permissions` for `*.baidu.com` | 从百度获取搜索联想词。 |

除了搜索关键词会发送给所选搜索引擎和百度联想词接口外，不会上传任何其他数据。

## 🎨 自定义

点击左下角设置按钮，可以：

- 切换默认搜索引擎（必应 / 谷歌 / 百度）
- 设置本地图片或图片 URL 作为壁纸
- 添加、编辑、删除网址导航

## 🧑‍💻 开发

Kat-home 使用原生 HTML、CSS、JavaScript 编写，无需构建步骤。直接修改文件后，在 `edge://extensions/` 中重新加载扩展即可看到效果。

## 📝 更新日志

详见 [RELEASE_NOTES.md](./RELEASE_NOTES.md)。

## 📄 许可证

MIT License — 可自由使用、修改和分享。
