// 创作板块配置

// 创作板块页面配置
// 页面文案集中放在这里，改文字不需要动其他文件（与 mzpluginConfig 同一套做法）
// 内容本身写在 src/content/works/ 下，目录结构即分类，见 docs/works-guide.md
export type WorksPageConfig = {
	title: string; // 板块标题，同时用于导航栏与页面标题
	description: string; // 板块描述，显示在标题下方，同时用作 SEO description
	icon: string; // 板块图标，astro-icon 图标名

	// 分区名称与描述：world / characters / stories 三个目录的显示名
	sectionWorld: string; // 「世界观」
	sectionWorldDescription: string;
	sectionWorldIcon: string;
	sectionCharacters: string; // 「人物」
	sectionCharactersDescription: string;
	sectionCharactersIcon: string;
	sectionStories: string; // 「正文」
	sectionStoriesDescription: string;
	sectionStoriesIcon: string;

	// 量词：如「12 条世界观」「8 位人物」「30 章正文」
	unitWorld: string;
	unitCharacters: string;
	unitStories: string;

	// 作品列表页
	worksEmptyText: string; // 一个作品都没有时的空态
	workDetailText: string; // 作品卡片右下角的「查看详情」
	worksBackText: string; // 返回作品列表
	workBackText: string; // 条目页返回作品主页
	sectionViewAllText: string; // 分区概览里的「查看全部」
	sectionEmptyText: string; // 分区里还没有条目时的提示

	// 分类分组（世界观 / 人物）
	uncategorizedText: string; // 条目没写 category 时归到哪一组
	categoryLabelText: string; // 详情页上「分类」的标签文字

	// 标签筛选（只在完整列表页出现，作品主页是节选不提供筛选）
	filterAllText: string; // 「全部」按钮
	filterNoResultsText: string; // 筛选后没有匹配项

	// 条目页
	chapterPrevText: string; // 上一章
	chapterNextText: string; // 下一章
	entryPrevText: string; // 上一条（非正文分区用）
	entryNextText: string; // 下一条
};

// 创作板块行为配置
export type WorksConfig = {
	// 只有一部作品时，/works/ 直接渲染该作品主页，省掉一层点击
	// （仍然保留 /works/<作品>/ 这个 URL，不做跳转）
	singleWorkMode: boolean;

	// 作品主页里每个分区展示多少条；超出部分通过「查看全部」进分区列表页
	// （分区列表页不受此限制，永远显示完整列表）
	previewCount: number;

	// 作品主页的三个分区默认是否折叠
	sectionsCollapsedByDefault: boolean;

	// 分类分组默认是否折叠
	categoriesCollapsedByDefault: boolean;
};
