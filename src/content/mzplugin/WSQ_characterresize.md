---
title: "WSQ_CharacterResize"
published: 2026-09-17 22:06:24
description: '直接在游戏中读取并显示邻近放大的行走图，可通过前缀控制放缩，与 Hendrix_AnimationSolution 和默认前缀 !$ 兼容。'
version: 1.0.2
icon: ''
image: ''
tags: [事件, 行走图, 效率]
engine: [MZ]
mzVersion: '版本不限'
requires: []
notes: '无前置需求'
downloads: 
    - label: 站内下载
      url: /downloads/WSQ_CharacterResize.js
      size: 26 KB
      file: WSQ_CharacterResize.js
      icon: material-symbols:download-rounded
    - label: github
      url: https://raw.githubusercontent.com/azkoree/57_MZPlugin/refs/heads/main/WSQ_CharacterResize.js
      size: 26 KB
      icon: fa7-brands:github
draft: false
comment: true
---

## 功能

如果想用 RMMZ 做复古低分辨率像素游戏，使用 16x 单位绘制再放大，这样来回修改查看效果就需要重复缩放，有了这个插件可以直接将行走图按一定倍率放大，允许快速查看修改，或者直接用也可以的

是直接按照新的倍率缩放并读取，无法在游戏中更改缩放倍率，请注意

## 使用说明

本插件引入了一个新的前缀 `^` ，你可以用这个前缀来指定进行缩放的行走图，也可以用于排除，可以自行在插件参数中选择

如果你想和默认的 `!$` 混用，或者需要用 `Hendrix_AnimationSolution` 的命名格式，需要注意：将 `^` 放在 `!$` 的后面，Hendrix格式照常使用即可。例如，你可以这样取名：

- `^chara.png`
- `!$^chara.png`
- `$^chara.Idle_8dir_f6`

不可让 ^ 夹在 !$ 中间，也不可放在前面，必须在它们后面，否则无法正确读取

## 插件参数

**启用**

是否启用本插件

**放大倍率**

要进行放大的倍率，只能为整数倍

**生效方式**

标记的生效方式。

- 标记放大：有该标记的图片才会放大
- 未标记放大：所有图片放大，排除有该标记的图片

**标记字符**

用于判定的标记字符，默认为`^`

**图片目录列表**

能够被本插件进行放大操作的图片目录，默认值包括`img/characters`，无需另外配置子目录

**原图边长上限**

尺寸超过该数字则默认不放大，无视标记

**调试输出**

是否在控制台输出每张图的放大/跳过结果

## 更新日志

### 20260919

- 加入了新的参数：图片目录列表，现在可以在characters之外的文件夹应用放大效果

### 20260917

- 首次发布
