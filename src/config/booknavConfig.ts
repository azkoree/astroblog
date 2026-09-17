import type { BooknavGroup, BooknavPageConfig } from "../types/booknavConfig";

// 书签导航页面配置
export const booknavPageConfig: BooknavPageConfig = {
	// 页面标题，如果留空则使用 i18n 中的翻译
	title: "",

	// 页面描述文本，如果留空则使用 i18n 中的翻译
	description: "",

	// favicon 自动获取配置
	favicon: {
		// 书签未填写 icon 时，是否自动获取目标站点的 favicon 图标
		enabled: true,

		// favicon 接口地址，{domain} 为占位符，会被替换成目标站点域名
		// 更换接口只需保证地址里含有 {domain}，例如：
		//   https://a.favicon.im/{domain}
		//   https://favicon.im/{domain}
		api: "https://a.favicon.im/{domain}",
	},
};

// 书签导航配置
// 每个数组项是一个分类组，分类组内的 items 是该分类下的书签
export const booknavConfig: BooknavGroup[] = [
	{
		id: "plugins",
		name: "rm插件站点",
		icon: "",
		desc: "一些可以寻找rm插件的网站",
		weight: 100,
		items: [
			{
				title: "fungamemake",
				url: "https://plugin-mz.fungamemake.com/",
				desc: "MV/MZ日语插件集合站点",
				// icon 字段可以使用 astro-icon 图标库的图标名称
				// 也可以使用图片 URL 和本地图片路径
				// 不填则会通过接口自动获取目标站点的 favicon 图标（需要在上面配置）
				icon: "",
				weight: 10,
			},
			{
				title: "Itch",
				url: "https://itch.io/",
				desc: "独立游戏开发者站点",
				// icon 字段可以使用 astro-icon 图标库的图标名称
				// 也可以使用图片 URL 和本地图片路径
				// 不填则会通过接口自动获取目标站点的 favicon 图标（需要在上面配置）
				icon: "",
				weight: 10,
			},
			{
				title: "Plugin Finder",
				url: "https://rpgmakerofficial.com/product/plugin-finder/",
				desc: "GGG官方的插件查找器",
				// icon 字段可以使用 astro-icon 图标库的图标名称
				// 也可以使用图片 URL 和本地图片路径
				// 不填则会通过接口自动获取目标站点的 favicon 图标（需要在上面配置）
				icon: "",
				weight: 10,
			},
			{
				title: "Booth",
				url: "https://booth.pm/zh-cn",
				desc: "有不少日本作者售卖插件，搜索ツクールMV/MZ",
				// icon 字段可以使用 astro-icon 图标库的图标名称
				// 也可以使用图片 URL 和本地图片路径
				// 不填则会通过接口自动获取目标站点的 favicon 图标（需要在上面配置）
				icon: "",
				weight: 10,
			},
			{
				title: "Project1",
				url: "https://rpg.blue/",
				desc: "（应该是）国内最大的rm交流论坛",
				// icon 字段可以使用 astro-icon 图标库的图标名称
				// 也可以使用图片 URL 和本地图片路径
				// 不填则会通过接口自动获取目标站点的 favicon 图标（需要在上面配置）
				icon: "",
				weight: 10,
			},
		],
	},
	{
		id: "plugins",
		name: "rm插件作者",
		icon: "",
		desc: "一些插件作者的个人仓库/网站",
		weight: 100,
		items: [
			{
				title: "Triacontane",
				url: "https://github.com/triacontane/RPGMakerMV",
				desc: "日系作者，有较多实现小功能的各种插件",
				// icon 字段可以使用 astro-icon 图标库的图标名称
				// 也可以使用图片 URL 和本地图片路径
				// 不填则会通过接口自动获取目标站点的 favicon 图标（需要在上面配置）
				icon: "",
				weight: 10,
			},
			{
				title: "NUUN",
				url: "https://github.com/nuun888/MZ",
				desc: "日系作者，插件种类较多，在booth出售插件",
				icon: "",
				weight: 10,
			},
			{
				title: "Unagiootoro",
				url: "https://github.com/unagiootoro/RPGMZ",
				desc: "日系作者，比较出名的是像素移动插件",
				icon: "",
				weight: 10,
			},

		],
	},

];
