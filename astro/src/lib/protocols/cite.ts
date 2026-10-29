import { getCollection } from 'astro:content';

export interface SpecRef { key: string; doc: { id: string; title: string; url: string; status: string }; section?: string; title: string; href: string; label: string }

/** Resolves a spec registry key. Throws for an unknown key. */
export async function resolveSpec(key: string, where = ''): Promise<SpecRef> {
	const cache = new Map<string, SpecRef>();
	for (const { data: doc } of await getCollection('specs'))
		for (const s of doc.sections)
			cache.set(s.key, {
				key: s.key, doc, section: s.section, title: s.title,
				href: doc.url + (s.anchor ? `#${s.anchor}` : ''),
				label: `${doc.title}, ${s.section ? `section ${s.section}` : s.title}`,
			});
	const r = cache.get(key);
	if (!r) throw new Error(`[protocols] unknown spec key "${key}"${where ? ` in ${where}` : ''}`);
	return r;
}
