import { worksPageConfig } from "@/config";
import { WORK_SECTIONS, type WorkSection } from "./works-paths";

// 分区的显示信息（名称 / 描述 / 图标 / 量词）。
// 目录名固定为 world | characters | stories，显示名在 config/worksConfig.ts 里改。

export type WorkSectionMeta = {
	key: WorkSection;
	name: string;
	description: string;
	icon: string;
	/** 量词，如「条」「位」「章」 */
	unit: string;
};

export const WORK_SECTION_METAS: Record<WorkSection, WorkSectionMeta> = {
	world: {
		key: "world",
		name: worksPageConfig.sectionWorld,
		description: worksPageConfig.sectionWorldDescription,
		icon: worksPageConfig.sectionWorldIcon,
		unit: worksPageConfig.unitWorld,
	},
	characters: {
		key: "characters",
		name: worksPageConfig.sectionCharacters,
		description: worksPageConfig.sectionCharactersDescription,
		icon: worksPageConfig.sectionCharactersIcon,
		unit: worksPageConfig.unitCharacters,
	},
	stories: {
		key: "stories",
		name: worksPageConfig.sectionStories,
		description: worksPageConfig.sectionStoriesDescription,
		icon: worksPageConfig.sectionStoriesIcon,
		unit: worksPageConfig.unitStories,
	},
};

/** 按固定顺序（世界观 → 人物 → 正文）列出，用于作品主页与列表 */
export const WORK_SECTION_LIST: WorkSectionMeta[] = WORK_SECTIONS.map(
	(section) => WORK_SECTION_METAS[section],
);

export function getWorkSectionMeta(section: WorkSection): WorkSectionMeta {
	return WORK_SECTION_METAS[section];
}
