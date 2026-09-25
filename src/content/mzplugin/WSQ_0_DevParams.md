---
title: "WSQ_0_DevParams"
published: 2026-09-25 18:09:28
description: '在js文件中设置参数，以进行快速调试的开发辅助型插件'
version: 1.0.0
icon: ''
image: ''
tags: [开发工具]
engine: [MZ]
mzVersion: '版本不限'
requires: []
notes: '为确保兼容性，请放到插件管理器最上面'
downloads: 
    - label: 站内下载
      url: /downloads/WSQ_0_DevParams.js
      size: 16 KB
      file: WSQ_0_DevParams.js
      icon: material-symbols:download-rounded
    - label: github
      url: https://raw.githubusercontent.com/azkoree/57_MZPlugin/refs/heads/main/WSQ_0_DevParams.js
      icon: fa7-brands:github
draft: false
comment: true
---

## 功能

如果使用插件参数来调整界面布局，且参数嵌套了一层又一层，那么每一次测试游戏到调参数都要点一次又一次，特别麻烦。虽然也不是没想过做一个外部的插件管理器，但mz编辑器对`plugin.js`的读取时机很神秘，总之就是不太好搞

所以就整了个这个插件来解燃眉之急。测试时只要在这个插件的js文件中配置好参数，游戏就会优先读取这个js文件中设置的参数，这样只需在这个js文件中修改参数，重启一下游戏测试就能看到修改后的效果，省去了点点点的麻烦

不过在正式介绍用法前需要声明以下两点：

1. 使用本插件前，强烈建议先了解MZ插件的参数注释格式：[アノテーションに関する解説 | プラグインを作ってみる | プラグイン講座 | RPGツクールMZ](https://rpgmakerofficial.com/product/mz/plugin/make/annotation.html)
2. 由于本插件会极大改变游戏开发的习惯，所以个人建议只用本插件进行快速调试，确定没问题后再在插件管理器中填入参数，并关闭本插件。

## 使用说明

在插件管理器中启用本插件，并放到插件列表的**最顶部**

接下来打开本插件的js文件，找到112行之后的配置区，只需在这里进行配置，保存并直接重启游戏测试，就能够看到修改后的效果。插件已经自带了一些样例，不过这里也还是讲一下好了

大体上，格式是这样的：

```javascript
'你的插件名称': {
	ParamName: xxx,
},
```

paramname填的是`@param`的名称，如果有从属的`@parent`，不用管，忽略就行

如果参数是字符串，建议用单引号括上。

这样游戏就会读取你在本插件中设置的参数，其他没有在这里写的，就会默认读取插件管理器（`plugin.js`）的设置。

如果参数是结构体，提供了如下两种编写方式：

**更改整个结构体的方式**：

```javascript
	YourStructName: {
		[
			Param1: aaa, Param2: bbb,
			Param3:ccc, Param4: ddd,
		]
	}
```

**结构体内包括一个列表，需要对其中一个列表项进行修改时：**

```javascript
	YourStructName: {
		3: {Param1: aaa, Param2: bbb},
		5: {Param3: ccc},
	}
```

列表的标号从0开始，比如说列表第一项就为0，列表第二项就为1，以此类推

## 更新日志

### v1.0.0 20260925

- 首次发布
