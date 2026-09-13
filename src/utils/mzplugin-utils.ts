import { resolveLinkIcon } from "./projects-utils";
import { url } from "./url-utils";

// ============================================================================
// 版本与引擎
// ============================================================================

/** 版本号统一显示成 v1.2.0（frontmatter 里写 "1.2.0" 或 "v1.2.0" 都行） */
export function formatVersion(version: string): string {
	const value = (version || "").trim();
	if (!value) return "";
	return /^v/i.test(value) ? value : `v${value}`;
}

/** 引擎与版本拼成一行，如 "MZ 1.6.0+"、"MZ / MV" */
export function formatEngineLabel(engine: string[], mzVersion: string): string {
	const list = engine && engine.length > 0 ? engine : ["MZ"];
	const base = list.join(" / ");
	const version = (mzVersion || "").trim();
	return version ? `${base} ${version}` : base;
}

/** 插件的最后更新时间：有 updated 用 updated，否则用 published */
export function getMzPluginUpdatedAt(data: {
	published: Date;
	updated?: Date;
}): Date {
	return data.updated ?? data.published;
}

// ============================================================================
// 下载链接
// ============================================================================

export type ResolvedDownloadTarget = {
	href: string;
	external: boolean;
	/** 站内文件：加 download 属性让浏览器直接下载，而不是跳转预览 */
	download: boolean;
};

/**
 * 解析下载项地址：
 * - 外链（http(s)://、//、data:）原样返回，新窗口打开；
 * - 站内路径（以 / 开头，如 /downloads/xxx/xxx.zip）补上 BASE_URL，并标记直接下载；
 * - 其他相对路径按站内路径处理。
 */
export function resolveDownloadTarget(rawUrl: string): ResolvedDownloadTarget {
	const value = (rawUrl || "").trim();
	if (!value) return { href: "", external: false, download: false };

	if (
		/^https?:\/\//i.test(value) ||
		value.startsWith("//") ||
		value.startsWith("data:")
	) {
		return { href: value, external: true, download: false };
	}

	if (value.startsWith("/")) {
		return { href: url(value), external: false, download: true };
	}

	return { href: url(`/${value}`), external: false, download: true };
}

/** 下载按钮上的一行提示：文件名 / 文件大小，用作 title 提示 */
export function formatDownloadHint(download: {
	size: string;
	file: string;
}): string {
	return [download.file, download.size].filter(Boolean).join(" · ");
}

// ============================================================================
// 列表行图标
// ============================================================================

/**
 * 解析列表行的插件图标：astro-icon 名 / 远程图片 / public 路径 → 首字母兜底。
 * 相对路径（如 ./cover.png）不能直接当 img 的 src 用，一律退回首字母。
 */
export function resolvePluginIcon(
	icon: string,
	title: string,
): { kind: "icon" | "image" | "letter"; value: string } {
	const resolved = resolveLinkIcon(icon, title);
	if (
		resolved.kind === "image" &&
		!/^(?:https?:)?\/\//i.test(resolved.value) &&
		!resolved.value.startsWith("/")
	) {
		return { kind: "letter", value: getTitleLetter(title) };
	}
	return resolved;
}

/** 标题首字母，用作图标缺失时的兜底 */
export function getTitleLetter(title: string): string {
	return (title || "?").trim().charAt(0).toUpperCase() || "?";
}
