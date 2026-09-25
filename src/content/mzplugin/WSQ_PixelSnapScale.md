---
title: "WSQ_PixelSnapScale"
published: 2026-09-19 18:29:09
description: '让显示比例吸附到像素单位，舍去引擎自带画面拉伸的完美像素插件'
version: 1.0.0
icon: ''
image: ''
tags: [视觉]
engine: [MZ]
mzVersion: '版本不限'
requires: []
notes: '无前置需求'
downloads: 
    - label: 站内下载
      url: /downloads/WSQ_PixelSnapScale.js
      size: 29 KB
      file: WSQ_PixelSnapScale.js
      icon: material-symbols:download-rounded
    - label: github
      url: https://raw.githubusercontent.com/azkoree/57_MZPlugin/refs/heads/main/WSQ_PixelSnapScale.js
      icon: fa7-brands:github

draft: false
comment: true
---

## 功能

个人最近改为使用24 x 24然后进行2倍放大的类似于像素风，但是mz引擎自带抗锯齿，就算使用了某完美像素插件（为防止不必要的麻烦隐去该插件的名字），由于游戏的实际画面会相对于数据库设置的尺寸再进行一次拉伸，所以也会有一些非整数倍扩大带来的问题。

本插件现在直接舍去了这一个拉伸，让每个像素块的宽度严格相同，可以看如下对比图：

![](https://img.57hmpg.top/file/1789814524399_image-20260919184149738.png)

但代价上面也说了，由于舍去了拉伸而窗口尺寸没有改变，所以实际画面看起来会更小（但这也是按实际尺寸显示的），且画面周围会有一圈黑边。可以尝试进一步加大游戏的分辨率来减小黑边的影响，但如果还是用不了大分辨率，那还是用完美像素插件并增大放大倍率吧（三倍就不会有如上的麻烦）

## 使用说明

启用后，在插件参数设置**像素单位**即可使用。一般扩大几倍像素单位就填几。

**设置核心关键字**是给 GF 设置核心准备的，可以在设置中加入一个用于启用该效果的选项，在设置核心中填对应关键字并设置为布尔值类型即可

其他的参数基本可以不用管，不影响

## 更新日志

### v1.0.0 20260919

- 首次发布
