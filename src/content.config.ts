import { defineCollection, z } from 'astro:content'
import {docsLoader} from '@astrojs/starlight/loaders';
import {docsSchema} from '@astrojs/starlight/schema';
import {autoSidebarLoader} from 'starlight-auto-sidebar/loader';
import {autoSidebarSchema} from 'starlight-auto-sidebar/schema';

export const collections = {
	docs: defineCollection({
		loader: docsLoader(),
		schema: docsSchema({
			extend: z.object({
				giscus: z.boolean().optional().default(true),
			})
		}),
	}),
	autoSidebar: defineCollection({
		loader: autoSidebarLoader(),
		schema: autoSidebarSchema(),
	})
};
