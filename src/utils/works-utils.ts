import { type CollectionEntry, getCollection } from "astro:content";
import { removeFileExtension, url } from "./url-utils";
import {
	isWorkSection,
	splitWorkKey,
	toWorkKey,
	WORK_SECTIONS,
	type WorkSection,
	workUrl as workPath,
	workSectionUrl as workSectionPath,
} from "./works-paths";

// 创作板块的数据访问层。
//
// 页面侧只用这里导出的函数；纯路径计算在 works-paths.ts（插件的 [[双链]] 也要用，
// 所以那边不能 import astro:content）。
//
// 约定：分区来自目录（world | characters | stories），不写进 frontmatter；
// 作品 = 内容 key 的第一段，作品主页由该目录下的 index.md 提供（可以没有，会退化用目录名）。

export type WorkEntry = CollectionEntry<"works">;

/** 提交给组件的条目视图，省得每个页面都自己拆 key、拼 URL */
export type WorkEntryView = {
	entry: WorkEntry;
	/** 内容 key，如 塔/world/地理志 */
	key: string;
	workId: string;
	section: WorkSection;
	/** 分区内的条目路径，可含 / */
	slug: string;
	href: string;
	data: WorkEntry["data"];
};

export type WorkSummary = {
	workId: string;
	title: string;
	description: string;
	image: string;
	status: string;
	tags: string[];
	published?: Date;
	href: string;
	/** 各分区条目数 */
	counts: Record<WorkSection, number>;
	/** 作品根条目（index.md），没有则为 undefined */
	entry?: WorkEntry;
};

/** 草稿只在开发环境可见，与 posts / projects / mzplugin 保持一致 */
async function getVisibleWorkEntries(): Promise<WorkEntry[]> {
	return getCollection("works", ({ data }) => {
		return import.meta.env.PROD ? data.draft !== true : true;
	});
}

/**
 * 内容 key。优先从 filePath 推导（目录即 URL）；filePath 缺失时退回 entry.id。
 * 注意：entry.id 可能被 frontmatter 的 slug 覆盖，只是作为兜底。
 */
export function getEntryKey(entry: WorkEntry): string {
	return toWorkKey(entry.filePath || "") || removeFileExtension(entry.id);
}

function toView(entry: WorkEntry): WorkEntryView | null {
	const key = getEntryKey(entry);
	const { workId, section, slug } = splitWorkKey(key);
	// slug 必须存在：塔/world.md 这种缺条目名的写法会让详情页 URL 和分区列表页撞车，
	// 这类条目由 getMisplacedWorkEntries() 报出来
	if (!workId || !slug || !isWorkSection(section)) return null;

	return {
		entry,
		key,
		workId,
		section,
		slug,
		href: url(workEntryHref(key)),
		data: entry.data,
	};
}

/** 内容 key → 带 BASE_URL 的 URL（works-paths 里那份不含 BASE_URL） */
function workEntryHref(key: string): string {
	const { workId, section, slug } = splitWorkKey(key);
	if (!workId) return "/works/";
	if (!section) return workPath(workId);
	const slugPath = slug
		.split("/")
		.filter(Boolean)
		.map((segment) => encodeURIComponent(segment))
		.join("/");
	return `${workSectionPath(workId, section)}${slugPath}/`;
}

/** /works/ */
export function getWorksIndexHref(): string {
	return url("/works/");
}

/** /works/<作品>/ */
export function getWorkHref(workId: string): string {
	return url(workPath(workId));
}

/** /works/<作品>/<分区>/ */
export function getWorkSectionHref(
	workId: string,
	section: WorkSection,
): string {
	return url(workSectionPath(workId, section));
}

/**
 * 目录里放进了非法分区（既不叫 world/characters/stories，也不是作品根条目）的条目。
 * 这些条目不会生成页面，构建时会打警告提醒。
 */
export async function getMisplacedWorkEntries(): Promise<WorkEntry[]> {
	const entries = await getVisibleWorkEntries();
	return entries.filter((entry) => {
		const { segments, section } = splitWorkKey(getEntryKey(entry));
		// 一段：作品根条目（<作品>/index.md），合法
		if (segments.length < 2) return false;
		// 两段：缺条目名，如 塔/world.md —— 多半是想写 塔/world/xxx.md
		if (segments.length === 2) return true;
		// 三段以上：分区名必须是 world | characters | stories
		return !isWorkSection(section);
	});
}

/** 全部作品 id（从内容里推导，不要求必须有 index.md） */
export async function getWorkIds(): Promise<string[]> {
	const entries = await getVisibleWorkEntries();
	const ids = new Set<string>();
	for (const entry of entries) {
		const { workId } = splitWorkKey(getEntryKey(entry));
		if (workId) ids.add(workId);
	}
	return [...ids];
}

/**
 * 作品列表。
 * 排序：作品根条目设置了 order 的按 order 降序排前面 → 发布日期降序 → 标题。
 * （与项目页一致：order 越大越靠前；判断是否设置必须用 !== undefined，否则 0 会被当成未设置）
 */
export async function getWorkList(): Promise<WorkSummary[]> {
	const entries = await getVisibleWorkEntries();

	const roots = new Map<string, WorkEntry>();
	const counts = new Map<string, Record<WorkSection, number>>();

	for (const entry of entries) {
		const { workId, section, segments } = splitWorkKey(getEntryKey(entry));
		if (!workId) continue;

		if (segments.length === 1) {
			roots.set(workId, entry);
			continue;
		}
		if (!isWorkSection(section)) continue;

		const current =
			counts.get(workId) ??
			({ world: 0, characters: 0, stories: 0 } as Record<WorkSection, number>);
		current[section] += 1;
		counts.set(workId, current);
	}

	const summaries = [...new Set([...roots.keys(), ...counts.keys()])].map(
		(workId) => toSummary(workId, roots.get(workId), counts.get(workId)),
	);

	return summaries.sort((a, b) => {
		const ao = a.entry?.data.order;
		const bo = b.entry?.data.order;
		if (ao !== undefined && bo !== undefined && ao !== bo) return bo - ao;
		if (ao !== undefined && bo === undefined) return -1;
		if (ao === undefined && bo !== undefined) return 1;

		const at = a.published?.getTime();
		const bt = b.published?.getTime();
		if (at !== undefined && bt !== undefined && at !== bt) return bt - at;
		if (at !== undefined && bt === undefined) return -1;
		if (at === undefined && bt !== undefined) return 1;

		return a.title.localeCompare(b.title, "zh-Hans-CN");
	});
}

function toSummary(
	workId: string,
	entry: WorkEntry | undefined,
	counts: Record<WorkSection, number> | undefined,
): WorkSummary {
	return {
		workId,
		// 没有 index.md 时用目录名兜底，页面不至于空白
		title: entry?.data.title || workId,
		description: entry?.data.description || "",
		image: entry?.data.image || "",
		status: entry?.data.status || "",
		tags: entry?.data.tags || [],
		published: entry?.data.published,
		href: getWorkHref(workId),
		counts: counts ?? { world: 0, characters: 0, stories: 0 },
		entry,
	};
}

export async function getWorkSummary(
	workId: string,
): Promise<WorkSummary | null> {
	const list = await getWorkList();
	return list.find((item) => item.workId === workId) ?? null;
}

/**
 * 某部作品某个分区的条目。
 * 排序：order 升序（正文即章节号）→ 发布日期升序 → 标题。
 * 与作品列表相反，这里用升序：章节 1 要排在章节 2 前面。
 */
export async function getWorkSectionEntries(
	workId: string,
	section: WorkSection,
): Promise<WorkEntryView[]> {
	const entries = await getVisibleWorkEntries();
	const views: WorkEntryView[] = [];

	for (const entry of entries) {
		const view = toView(entry);
		if (view && view.workId === workId && view.section === section) {
			views.push(view);
		}
	}

	return views.sort((a, b) => {
		const ao = a.data.order;
		const bo = b.data.order;
		if (ao !== undefined && bo !== undefined && ao !== bo) return ao - bo;
		if (ao !== undefined && bo === undefined) return -1;
		if (ao === undefined && bo !== undefined) return 1;

		const at = a.data.published?.getTime();
		const bt = b.data.published?.getTime();
		if (at !== undefined && bt !== undefined && at !== bt) return at - bt;
		if (at !== undefined && bt === undefined) return -1;
		if (at === undefined && bt !== undefined) return 1;

		return a.data.title.localeCompare(b.data.title, "zh-Hans-CN");
	});
}

/** 三个分区一次性取回，作品主页用 */
export async function getWorkSections(
	workId: string,
): Promise<Record<WorkSection, WorkEntryView[]>> {
	const result = {} as Record<WorkSection, WorkEntryView[]>;
	for (const section of WORK_SECTIONS) {
		result[section] = await getWorkSectionEntries(workId, section);
	}
	return result;
}

/**
 * 上一条 / 下一条。传入已排好序的同一分区列表，按 key 定位。
 * 正文章节的「上一章 / 下一章」用的就是这个。
 */
export function getWorkNeighbors(
	views: WorkEntryView[],
	key: string,
): { prev?: WorkEntryView; next?: WorkEntryView } {
	const index = views.findIndex((view) => view.key === key);
	if (index === -1) return {};
	return { prev: views[index - 1], next: views[index + 1] };
}

export type WorkCategoryGroup = {
	/** 分组名（未分类时为 uncategorizedName） */
	name: string;
	/** 是否是「没写 category」的兜底分组 */
	uncategorized: boolean;
	views: WorkEntryView[];
};

/**
 * 按 category 分组，保持传入 views 的顺序：
 * 分组顺序 = 各组第一条在列表里出现的顺序，所以 frontmatter 的 order 依然说了算
 * （order 小的条目排前面，它所在的分类就排前面）。
 * 没写 category 的条目统一落到 uncategorizedName 这一组，始终排在最后。
 */
export function groupByCategory(
	views: WorkEntryView[],
	uncategorizedName: string,
): WorkCategoryGroup[] {
	const named = new Map<string, WorkCategoryGroup>();
	let uncategorized: WorkCategoryGroup | null = null;

	for (const view of views) {
		const name = (view.data.category || "").trim();
		if (!name) {
			if (!uncategorized) {
				uncategorized = {
					name: uncategorizedName,
					uncategorized: true,
					views: [],
				};
			}
			uncategorized.views.push(view);
			continue;
		}

		const group = named.get(name);
		if (group) {
			group.views.push(view);
		} else {
			named.set(name, { name, uncategorized: false, views: [view] });
		}
	}

	return uncategorized
		? [...named.values(), uncategorized]
		: [...named.values()];
}

/** 列表里出现过的标签及其条目数，按出现次数降序（标签筛选按钮用） */
export function collectWorkTags(
	views: WorkEntryView[],
): { name: string; count: number }[] {
	const counts = new Map<string, number>();
	for (const view of views) {
		for (const tag of view.data.tags) {
			const name = tag.trim();
			if (!name) continue;
			counts.set(name, (counts.get(name) ?? 0) + 1);
		}
	}

	return [...counts.entries()]
		.sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "zh-Hans-CN"))
		.map(([name, count]) => ({ name, count }));
}
