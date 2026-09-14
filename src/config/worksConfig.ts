import type { WorksConfig, WorksPageConfig } from "../types/worksConfig";

// 创作板块页面配置
// 页面文案集中放在这里，改文字不需要动其他文件
// 创作内容写在 src/content/works/ 下：目录结构即分类，见 docs/works-guide.md
export const worksPageConfig: WorksPageConfig = {
	// 板块标题，同时用作导航栏菜单名
	title: "创作",

	// 板块描述，显示在标题下方，同时用作 SEO description
	description: "世界观、人物设定与故事正文。",

	// 板块图标，可用 astro-icon 图标名
	icon: "material-symbols:auto-stories",

	// ── 三个分区 ────────────────────────────────────────
	// 名称对应 src/content/works/<作品>/ 下的三个目录名：
	// world | characters | stories（目录名固定，显示名在这里改）

	sectionWorld: "世界观",
	sectionWorldDescription: "地理、势力、历史与规则设定。",
	sectionWorldIcon: "material-symbols:public",

	sectionCharacters: "人物",
	sectionCharactersDescription: "登场人物的设定与关系。",
	sectionCharactersIcon: "material-symbols:group",

	sectionStories: "正文",
	sectionStoriesDescription: "按顺序阅读的故事章节。",
	sectionStoriesIcon: "material-symbols:menu-book",

	// ── 量词 ────────────────────────────────────────────
	unitWorld: "条",
	unitCharacters: "位",
	unitStories: "章",

	// ── 列表与导航文案 ──────────────────────────────────

	worksEmptyText: "还没有发布作品",
	workDetailText: "查看详情",
	worksBackText: "返回作品列表",
	workBackText: "返回作品",
	sectionViewAllText: "查看全部",
	sectionEmptyText: "这一部分还没有内容",

	// ── 分类分组（世界观 / 人物）─────────────────────────
	// 条目在 frontmatter 里写 category 就会归到同名分组，不写进这一组
	uncategorizedText: "未分类",
	categoryLabelText: "分类",

	// ── 标签筛选 ────────────────────────────────────────
	filterAllText: "全部",
	filterNoResultsText: "没有符合该标签的条目",

	chapterPrevText: "上一章",
	chapterNextText: "下一章",
	entryPrevText: "上一条",
	entryNextText: "下一条",
};

export const worksConfig: WorksConfig = {
	// 只有一部作品时，/works/ 直接显示该作品主页
	singleWorkMode: false,

	// 作品主页每个分区展示的条数上限（分区列表页不受限制）
	previewCount: 6,

	// 作品主页的三个分区默认是否折叠
	sectionsCollapsedByDefault: false,

	// 分类分组默认是否折叠
	// 设为 true 时作品主页会变成「分区 → 分类名 + 条数」的两级索引，比较紧凑
	categoriesCollapsedByDefault: false,
};
