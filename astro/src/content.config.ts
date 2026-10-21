import { defineCollection } from 'astro:content'
import { z } from 'astro/zod'
import {docsLoader} from '@astrojs/starlight/loaders';
import {docsSchema} from '@astrojs/starlight/schema';
import {autoSidebarLoader} from 'starlight-auto-sidebar/loader';
import {MetadataSchema} from 'starlight-auto-sidebar/schema';

const ver = z.string().regex(/^\d+\.\d+$/, {
	error: (i) => `versions value must be "major.minor" (e.g. "8.0"), got "${i.input}"`,
});
const versions = z.object({since: ver.optional(), until: ver.optional()}).optional();

export const collections = {
	docs: defineCollection({
		loader: docsLoader(),
		schema: docsSchema({
			extend: z.object({
				versions,
				preview: z.boolean().optional(),
				giscus: z.boolean().optional().default(true),
				redirect_from: z.array(z.string()).optional().default([]).or(z.string()),
			})
		}),
	}),
	autoSidebar: defineCollection({
		loader: autoSidebarLoader(),
		schema: MetadataSchema.extend({versions}),
	})
};
