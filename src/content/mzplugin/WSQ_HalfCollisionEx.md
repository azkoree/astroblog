---
title: "WSQ_HalfCollisionEx"
published: 2026-09-14 11:25:13
description: '从图片检测HalfMove的碰撞判定，不占用区域id'
version: 1.0.12
icon: ''
image: ''
tags: [地图, 效率]
engine: [MZ]
mzVersion: '版本不限'
requires: 
    - name: HalfMove
      url: https://github.com/triacontane/RPGMakerMV/tree/mz_master/HalfMove.js
notes: '放在HalfMove下方加载'
downloads: 
    - label: 站内下载
      url: /downloads/WSQ_HalfCollisionEx.js
      size: 29 KB
      file: WSQ_HalfCollisionEx.js
      icon: material-symbols:download-rounded
    - label: github
      url: https://raw.githubusercontent.com/azkoree/57_MZPlugin/refs/heads/main/WSQ_HalfCollisionEx.js
      size: 29 KB
      icon: fa7-brands:github

draft: false
comment: true
---

## 功能

使用远景图做地图图像且搭配halfmove时，若使用插件自带的区域半格碰撞设置，则不是特别方便，一是可视化程度差，二是占用了大量区域id。

本插件将halfmove的半格碰撞设置从区域中解放出来，改为为每张地图各自匹配一张碰撞图——用于设置碰撞，只需在这张碰撞图上绘制碰撞的区域，引擎就能够从中读取碰撞数据，并在游戏中实现碰撞。

![](https://img.57hmpg.top/file/1789369350003_image-20260914150214722.png)

![支持半格/四分之一格判定](https://img.57hmpg.top/file/1789369158349_image-20260914145903585.png)

## 兼容性

本插件兼容ULDS、GALV_LayerGraphicsMZ、ParallaxLayerMap、Hendrix_Realtime_Parallax_Map_Builder等主流远景图地图插件。

## 规格要求

- 碰撞图尺寸要和地图尺寸匹配，可自己调整碰撞图中单个图块的尺寸，但还是建议和引擎内设置统一。
- 支持halfmove的半格和四分之一格碰撞设置，将一格不可通行的部分涂上颜色即可。虽然本插件做了一些兜底措施，但建议不要使用模糊软边等功能，以**实色填充**，尽可能不出现半透明色，且与网格严格对应。
- 绘制非整格碰撞时，请严格按照**图块尺寸的二分之一或四分之一**进行绘制。
- 图片放在`img/parallaxes/collision`中，命名为`map{id}.png`。id为地图id，无需补零，例如`map4.png`

## 使用说明

制作碰撞图的方法有很多，只要对着地图图片，新建图层在上面绘制碰撞，然后把碰撞层导出就可以了。可以使用aseprite、photoshop等自带网格吸附功能的绘画软件，也可以使用[tiled](https://www.mapeditor.org/)来导出碰撞层图像。

这里用tiled来进行演示。

首先准备好作为绘制参考的远景图，用tiled新建地图，地图的尺寸和你的画好的地图大小一样。

然后需要新建图块集，来用于绘制碰撞。可以直接保存这个作为图块集图像，颜色已经是默认的红色

![collision](https://img.57hmpg.top/file/1789358565824_collision.png)

在工程目录随便找个文件夹（其实不放在工程目录也可以，主要是减少来回切文件夹的麻烦），把这张图扔进去，然后**新建图块集**，选择这张图作为图像，就可以用这个图块在地图中进行回执了。

回到创建的地图中，新建一个**图像层**，在属性窗口中选择image source，选择你的地图图像，就能看到地图在编辑器中显示了

在图像层之上新建**图块层**，现在编辑器的状态大概是这样的：

![](https://img.57hmpg.top/file/1789360041424_image-20260914122706667.png)

然后就可以在碰撞层愉快的画图块了！！！

![](https://img.57hmpg.top/file/1789360369625_image-20260914123123589.png)

如果觉得红色看不清，可以调整图层透明度，在导出时记得调回100就行。

绘制结束后，可以先将地图的原文件保存（tmx），以免后面还需要调整碰撞。

然后隐藏图像层，选择文件 - **导出为图片**。

![](https://img.57hmpg.top/file/1789360469778_image-20260914123420269.png)

- 图片名：取名为**map{id}.png**，比如你的地图id为4，就取名为map4，不用补零
- 路径：放在默认路径中：**img/parallax/collision**

**注意，如果进入地图时没有检测到对应id的碰撞图，就会报错，所以在测试时，最好是先放一个透明图在里面**

若顺利的话，进入地图测试，碰撞已经应用上了

## 插件参数

| 参数名         | 说明                                                         |
| -------------- | ------------------------------------------------------------ |
| 启用           | 是否启用本插件                                               |
| 图片目录       | 存放碰撞图的图片目录。默认为img/parallaxes/collision         |
| 文件名前缀     | 碰撞图的文件名前缀，文件名由前缀+地图id组成。默认为map       |
| 每格像素尺寸   | 碰撞图中，对应每一格图块的尺寸，必须为偶数。默认为48         |
| 判定颜色       | 用于判定为碰撞/无法通行的颜色。默认为红色（#FF0000）         |
| 颜色容差       | 允许在色相上进行一些容差。                                   |
| 红色覆盖率阈值 | 防止图片缩放、软边笔刷等情况设置的兜底参数，颜色不透明度较低时也可以读取。正常情况下保持为1即可。 |
| 调试输出       | 测试游戏时，会在控制台显示调试信息。                         |



## 更新日志

### v1.0.12 20260914

- 首次发布
