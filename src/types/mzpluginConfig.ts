// MZ 插件板块配置

// MZ 插件板块页面配置
export type MzPluginPageConfig = {
	title: string; // 页面标题
	description: string; // 页面描述，显示在标题下方，同时用作 SEO description
	icon: string; // 页面标题旁的 astro-icon 图标名
	searchPlaceholder: string; // 列表页搜索框占位文字
	emptyText: string; // 一个插件都没有时的空态文案
	sortUpdated: string; // 排序按钮：最近更新
	sortName: string; // 排序按钮：名称
	allTagsText: string; // 标签筛选里「全部标签」按钮的文字
	noticeTitle: string; // 目录页说明区块的标题
	noticeOpen: boolean; // 说明区块是否默认展开（内容来自 src/content/spec/mzplugin.md）
	detailText: string; // 列表行的「查看详情」文字
	backText: string; // 详情页返回列表的文字
	downloadTitle: string; // 详情页下载区块标题
	downloadCodeLabel: string; // 提取码前缀，如「提取码」
	compatTitle: string; // 详情页兼容性区块标题
	compatEngineLabel: string; // 兼容性行：适用引擎
	compatVersionLabel: string; // 兼容性行：适配版本
	compatRequireLabel: string; // 兼容性行：前置插件
	compatNotesLabel: string; // 兼容性行：注意事项
	updatedPrefix: string; // 列表行更新时间前缀，如「更新于」
};
