// 创作板块的路径与 URL 计算。
//
// 这里刻意只做纯字符串运算、不 import 任何 astro 模块：remark-wiki-link 插件在
// Markdown 编译期运行，拿不到 astro:content，但它的 [[双链]] 必须算出和路由完全一致的
// URL。页面侧（utils/works-utils.ts）与插件侧都 import 本模块，URL 由构造保证一致。

/** 合法的分区目录名。URL 用英文，显示名在 config/worksConfig.ts */
export const WORK_SECTIONS = ["world", "characters", "stories"] as const;

export type WorkSection = (typeof WORK_SECTIONS)[number];

export function isWorkSection(value: string): value is WorkSection {
	return (WORK_SECTIONS as readonly string[]).includes(value);
}

const MARKDOWN_EXTENSION = /\.(?:md|mdx|markdown)$/i;

/** src/content/works/ 之后的部分，用于从 entry.filePath 反推内容路径 */
const WORKS_MARKER = "/content/works/";

/**
 * 把 entry.filePath（如 src/content/works/塔/world/地理志.md）转成内容 key
 * （如 塔/world/地理志）。
 *
 * 刻意从 filePath 而不是 entry.id 推导：Astro 的 glob loader 会让 frontmatter 里的
 * `slug` 覆盖 entry.id，那样 URL 就会和目录结构脱节。从 filePath 推导可以保证
 * 「目录即 URL」永远成立（创作板块不支持 slug 字段）。
 *
 * 末尾的 /index 会去掉，所以 <作品>/index.md 的 key 就是 <作品>，
 * 与 Astro 自己的 id 生成规则一致。也因此分区目录下不要用 index.md 当条目文件名。
 */
export function toWorkKey(filePath: string): string {
	const normalized = (filePath || "").replaceAll("\\", "/");
	const markerIndex = normalized.lastIndexOf(WORKS_MARKER);
	const relative =
		markerIndex === -1
			? normalized
			: normalized.slice(markerIndex + WORKS_MARKER.length);

	return relative
		.replace(MARKDOWN_EXTENSION, "")
		.replace(/\/+$/, "")
		.replace(/\/index$/i, "");
}

export type WorkKeyParts = {
	/** 作品目录名，如 塔 */
	workId: string;
	/** 分区目录名；作品根条目为空串 */
	section: string;
	/** 分区内的条目路径，可含 /（支持子目录）；作品根条目为空串 */
	slug: string;
	/** 拆出来的全部片段 */
	segments: string[];
};

export function splitWorkKey(key: string): WorkKeyParts {
	const segments = (key || "").split("/").filter(Boolean);
	const [workId = "", section = "", ...rest] = segments;
	return { workId, section, slug: rest.join("/"), segments };
}

function encodePathSegment(segment: string): string {
	return encodeURIComponent(segment);
}

/** /works/<作品>/ */
export function workUrl(workId: string): string {
	return `/works/${encodePathSegment(workId)}/`;
}

/** /works/<作品>/<分区>/ */
export function workSectionUrl(workId: string, section: string): string {
	return `/works/${encodePathSegment(workId)}/${encodePathSegment(section)}/`;
}

/**
 * 内容 key → 详情页 URL。
 * 作品根条目（一段）指向作品主页；分区条目指向 /works/<作品>/<分区>/<条目>/。
 */
export function workEntryUrl(key: string): string {
	const { workId, section, slug } = splitWorkKey(key);
	if (!workId) return "/works/";
	if (!section) return workUrl(workId);
	const slugPath = slug
		.split("/")
		.filter(Boolean)
		.map(encodePathSegment)
		.join("/");
	return `${workSectionUrl(workId, section)}${slugPath}/`;
}
