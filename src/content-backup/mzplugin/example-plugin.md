---
# ──────────────────────────────────────────────────────────────
# 这是一个示例条目，用来演示 frontmatter 的每个字段。
# draft: true 时只在 pnpm dev 里可见，pnpm build 会自动跳过。
# 你正式发布插件后可以直接删掉这个文件。
# ──────────────────────────────────────────────────────────────

# 插件名称（必填）
title: 示例插件

# 首次发布日期（必填）
published: 2026-09-13 20:00:00
# 最后更新日期（可选，填了列表页的「更新于」和默认排序都用它）
updated: 2026-09-20 12:30:00

# 当前版本号（必填），写 1.2.0 或 v1.2.0 都行，页面统一显示成 v1.2.0
version: 1.2.0

# 一句话简介（必填），显示在列表行和详情页标题下方
description: 这是一个示例插件，用来说明 frontmatter 里每个字段该怎么写。

# 列表行左侧的小图标（可选）
# 支持三种写法：astro-icon 图标名 / 远程图片 URL / public 目录路径
# 留空则自动显示插件名的首字母
icon: material-symbols:extension

# 详情页顶部的预览图（可选）
# 支持相对路径（相对于本 md 文件，如 ./cover.png）、public 路径（/downloads/xxx/cover.png）、远程 URL
# 注意：相对路径只能用在详情页预览图，不要写进上面的 icon
image: ""

# 标签（可选），列表页会据此生成筛选按钮
tags: [战斗, 效率]

# 适用引擎（可选，默认 ["MZ"]）与适配版本（可选）
engine: [MZ]
mzVersion: "1.6.0+"

# 前置插件（可选），有 url 就渲染成链接
requires:
  - name: 插件管理器
    url: https://example.com/plugin-manager

# 注意事项 / 已知冲突（可选，自由文本）
notes: 与「某某插件」同时使用时要排在其下方。

# 下载方式（可选，可以写多个，第一个会渲染成主按钮）
downloads:
  # 站内文件：把文件放到 public/downloads/<插件名>/ 下，这里写以 / 开头的路径，
  # 页面会渲染成带 download 属性的按钮，点击直接下载而不是跳转预览
  - label: 站内下载
    url: /downloads/example-plugin/ExamplePlugin_v1.2.0.zip
    icon: material-symbols:download-rounded
    size: 1.2 MB
    file: ExamplePlugin_v1.2.0.zip
  # 外部网盘：写完整 URL，自动新窗口打开；提取码会显示在按钮旁边
  - label: 百度网盘
    url: https://pan.baidu.com/s/xxxxxxxx
    icon: material-symbols:cloud-download
    code: ygcv
    size: 1.2 MB
  # 图标也可以留空，会自动用名称首字母兜底
  - label: GitHub 仓库
    url: https://github.com/azkoree/example-plugin
    icon: fa7-brands:github

# 置顶权重（可选），数字越大越靠前，不写就按更新时间排
order: 0

# 草稿（可选，默认 false）。true 时只在 dev 可见，构建时跳过
draft: true

# 文章语言（可选，留空用站点默认）
lang: ""

# 详情页是否显示评论区（可选，默认 false），需要先在 commentConfig 里启用评论系统
comment: true
---

正文写插件的说明文档，本站支持的所有 Markdown 扩展都能用：代码高亮、行内公式、Mermaid、PlantUML、图片网格、`[[双链]]` 等。

## 功能

- 这里写插件做了什么
- 一条一条列出来

## 使用说明

1. 把插件文件放进游戏工程的 `js/plugins/` 目录
2. 在插件管理器里启用并调整参数

## 参数

| 参数 | 默认值 | 说明 |
| --- | --- | --- |
| `倍率` | 4 | 加速的倍数 |

## 更新日志

### v1.2.0

- 新增倍率配置项

### v1.1.0

- 首次发布
