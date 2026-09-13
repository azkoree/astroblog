import { defineCollection } from "astro:content";
import type { CollectionConfig } from "astro/content/config";
import { glob } from "astro/loaders";
import { type ZodType, z } from "astro/zod";

type PostData = {
	title: string;
	published: Date;
	updated?: Date;
	draft: boolean;
	description: string;
	image: string;
	tags: string[];
	category: string | null;
	lang: string;
	pinned: boolean;
	author: string;
	sourceLink: string;
	licenseName: string;
	licenseUrl: string;
	comment: boolean;
	password: string;
	passwordHint: string;
	series: string;
	seriesOrder?: number;
	prevTitle: string;
	prevSlug: string;
	nextTitle: string;
	nextSlug: string;
};

type DynamicData = {
	published: Date;
	pinned: boolean;
	location: string;
};

type ProjectLink = {
	label: string;
	icon: string;
	value: string;
};

type ProjectData = {
	title: string;
	published: Date;
	draft: boolean;
	order?: number;
	description: string;
	image: string;
	tags: string[];
	link: ProjectLink[];
	status: string;
	lang: string;
};

type MzPluginDownload = {
	label: string;
	url: string;
	icon: string;
	code: string;
	size: string;
	file: string;
};

type MzPluginRequire = {
	name: string;
	url: string;
};

type MzPluginData = {
	title: string;
	published: Date;
	updated?: Date;
	version: string;
	description: string;
	draft: boolean;
	order?: number;
	image: string;
	icon: string;
	tags: string[];
	engine: string[];
	mzVersion: string;
	requires: MzPluginRequire[];
	notes: string;
	downloads: MzPluginDownload[];
	lang: string;
	comment: boolean;
};

type ContentCollection<T> = CollectionConfig<
	ZodType<T>,
	ReturnType<typeof glob>
>;

const postsCollection: ContentCollection<PostData> = defineCollection({
	loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/posts" }),
	schema: z.object({
		title: z.string(),
		published: z.date(),
		updated: z.date().optional(),
		draft: z.boolean().optional().default(false),
		description: z.string().optional().default(""),
		image: z.string().optional().default(""),
		tags: z.array(z.string()).optional().default([]),
		category: z.string().optional().nullable().default(""),
		lang: z.string().optional().default(""),
		pinned: z.boolean().optional().default(false),
		author: z.string().optional().default(""),
		sourceLink: z.string().optional().default(""),
		licenseName: z.string().optional().default(""),
		licenseUrl: z.string().optional().default(""),
		comment: z.boolean().optional().default(true),
		password: z.string().optional().default(""),
		passwordHint: z.string().optional().default(""),
		series: z.string().optional().default(""),
		seriesOrder: z.number().optional(),

		/* For internal use */
		prevTitle: z.string().default(""),
		prevSlug: z.string().default(""),
		nextTitle: z.string().default(""),
		nextSlug: z.string().default(""),
	}),
});

const specCollection: ContentCollection<Record<string, never>> =
	defineCollection({
		loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/spec" }),
		schema: z.object({}),
	});

const dynamicCollection: ContentCollection<DynamicData> = defineCollection({
	loader: glob({ pattern: "**/*.md", base: "./src/content/dynamic" }),
	schema: z.object({
		published: z.date(),
		pinned: z.boolean().optional().default(false),
		location: z.string().optional().default(""),
	}),
});

const projectsCollection: ContentCollection<ProjectData> = defineCollection({
	loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/projects" }),
	schema: z.object({
		title: z.string(),
		published: z.date(),
		draft: z.boolean().optional().default(false),
		order: z.number().optional(),
		description: z.string().optional().default(""),
		image: z.string().optional().default(""),
		tags: z.array(z.string()).optional().default([]),
		link: z
			.array(
				z.object({
					label: z.string(),
					icon: z.string().optional().default(""),
					value: z.string(),
				}),
			)
			.optional()
			.default([]),
		status: z.string().optional().default(""),
		lang: z.string().optional().default(""),
	}),
});

const mzpluginCollection: ContentCollection<MzPluginData> = defineCollection({
	loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/mzplugin" }),
	schema: z.object({
		title: z.string(),
		published: z.date(),
		updated: z.date().optional(),
		version: z.string().optional().default(""),
		description: z.string().optional().default(""),
		draft: z.boolean().optional().default(false),
		order: z.number().optional(),
		image: z.string().optional().default(""),
		icon: z.string().optional().default(""),
		tags: z.array(z.string()).optional().default([]),
		engine: z.array(z.string()).optional().default(["MZ"]),
		mzVersion: z.string().optional().default(""),
		requires: z
			.array(
				z.object({
					name: z.string(),
					url: z.string().optional().default(""),
				}),
			)
			.optional()
			.default([]),
		notes: z.string().optional().default(""),
		downloads: z
			.array(
				z.object({
					label: z.string(),
					url: z.string(),
					icon: z.string().optional().default(""),
					code: z.string().optional().default(""),
					size: z.string().optional().default(""),
					file: z.string().optional().default(""),
				}),
			)
			.optional()
			.default([]),
		lang: z.string().optional().default(""),
		comment: z.boolean().optional().default(false),
	}),
});

export const collections: {
	dynamic: typeof dynamicCollection;
	posts: typeof postsCollection;
	spec: typeof specCollection;
	projects: typeof projectsCollection;
	mzplugin: typeof mzpluginCollection;
} = {
	dynamic: dynamicCollection,
	posts: postsCollection,
	spec: specCollection,
	projects: projectsCollection,
	mzplugin: mzpluginCollection,
};
