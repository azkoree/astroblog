import type { MzPluginPageConfig } from "../types/mzpluginConfig";

// MZ 插件板块页面配置
// 页面文案集中放在这里，改文字不需要动其他文件
// 插件数据本身写在 src/content/mzplugin/ 下，一个插件一个 md
export const mzpluginPageConfig: MzPluginPageConfig = {
	// 页面标题
	title: "插件",

	// 页面描述，显示在标题下方，同时用作 SEO description
	description: "自己写的 RPG Maker MZ 插件。",

	// 页面图标，可用 astro-icon 图标名，如 material-symbols:extension
	icon: "material-symbols:extension",

	// 列表页搜索框占位文字
	searchPlaceholder: "搜索插件名称、简介或标签",

	// 一个插件都没有时的空态文案
	emptyText: "还没有发布插件",

	// 排序按钮文案
	sortUpdated: "最近更新",
	sortName: "名称",

	// 标签筛选里「全部标签」按钮的文字
	allTagsText: "全部标签",

	// 目录页说明区块（注意事项、利用规约等）的标题
	noticeTitle: "注意事项与利用规约（请务必阅读）",

	// 说明区块是否默认展开
	// 内容写在 src/content/spec/mzplugin.md，删掉那个文件整块就不显示
	noticeOpen: false,

	// 详情页/列表行的按钮文案
	detailText: "查看详情",
	backText: "返回插件列表",

	// 详情页下载区块
	downloadTitle: "下载",
	downloadCodeLabel: "提取码",

	// 详情页兼容性区块
	compatTitle: "兼容性",
	compatEngineLabel: "适用引擎",
	compatVersionLabel: "适配版本",
	compatRequireLabel: "前置插件",
	compatNotesLabel: "注意事项",

	// 列表行更新时间前缀
	updatedPrefix: "更新于",
};
