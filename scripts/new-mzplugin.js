/* Create a new MZ plugin markdown file with front-matter */

import fs from "node:fs";
import path from "node:path";
import { pinyin } from "pinyin-pro";
import { siteConfig } from "../src/config/siteConfig.ts";

const args = process.argv.slice(2);

if (args.length === 0) {
	console.error(`Error: No plugin title provided
Usage: pnpm new-mzplugin <标题> [文件名]
Example:
  pnpm new-mzplugin 战斗加速
  pnpm new-mzplugin 战斗加速 BattleSpeed`);
	process.exit(1);
}

const title = args[0];
// 第二个参数用来手动指定文件名（也就是 URL）；不传则由标题转拼音
const rawFileName = args[1] || title;

// 中文逐字转拼音，其余字符原样保留，最后拼成 kebab-case 的 slug
function toSlug(input) {
	const parts = [];
	let buffer = "";
	for (const char of [...input]) {
		if (/[\u4e00-\u9fff]/.test(char)) {
			if (buffer) {
				parts.push(buffer);
				buffer = "";
			}
			parts.push(pinyin(char, { toneType: "none", type: "array" })[0]);
		} else {
			buffer += char;
		}
	}
	if (buffer) parts.push(buffer);
	return parts
		.join("-")
		.toLowerCase()
		.replace(/[^a-z0-9-]/g, "")
		.replace(/-+/g, "-")
		.replace(/^-|-$/g, "");
}

// 站点时区下的当前时间戳，格式与现有文章/动态保持一致
function getTimestamp() {
	const timezone = siteConfig.timezone || "Asia/Shanghai";
	const parts = new Intl.DateTimeFormat("en-CA", {
		timeZone: timezone,
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
		hour: "2-digit",
		minute: "2-digit",
		second: "2-digit",
		hourCycle: "h23",
	})
		.formatToParts(new Date())
		.reduce((acc, part) => {
			if (part.type !== "literal") acc[part.type] = part.value;
			return acc;
		}, {});

	return `${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute}:${parts.second}`;
}

const slug = toSlug(rawFileName.replace(/\.(md|mdx)$/i, "")) || "plugin";
const fileName = `${slug}.md`;
const targetDir = "./src/content/mzplugin";
const fullPath = path.join(targetDir, fileName);

if (fs.existsSync(fullPath)) {
	console.error(`Error: File ${fullPath} already exists`);
	process.exit(1);
}

fs.mkdirSync(targetDir, { recursive: true });

// 标题加引号，避免标题里的冒号等字符破坏 YAML
const safeTitle = `"${title.replace(/"/g, '\\"')}"`;

const content = `---
title: ${safeTitle}
published: ${getTimestamp()}
description: ''
version: 1.0.0
icon: ''
image: ''
tags: []
engine: [MZ]
mzVersion: ''
requires: []
notes: ''
downloads: []
draft: true
comment: false
---

## 功能

## 使用说明

## 更新日志

### v1.0.0

- 首次发布
`;

fs.writeFileSync(fullPath, content);

console.log(`Plugin ${fullPath} created`);
console.log("  · 内容写完后把 frontmatter 里的 draft 改成 false 才会发布");
console.log(`  · 站内托管文件放在 public/downloads/${slug}/ 下`);
console.log("  · 字段说明可参考 src/content/mzplugin/example-plugin.md");
