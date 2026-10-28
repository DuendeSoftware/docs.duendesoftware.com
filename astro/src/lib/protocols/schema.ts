import { z } from 'astro/zod';

const words = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;

const channel = z.enum(['front', 'back', 'internal']);

const specSectionSchema = z.object({
	key: z.string(),
	section: z.string().optional(), // absent where no section number applies (label falls back to title)
	anchor: z.string(),
	title: z.string(),
	quote: z.string().optional(),
});

export const specDocSchema = z.object({
	id: z.string(),
	title: z.string(),
	url: z.string(),
	status: z.string().regex(/^(RFC|I-D .+|OpenID Final|W3C (Rec|CR)|OASIS|HL7 STU .+)$/),
	quoteCheck: z.enum(['auto', 'manual']).default('auto'),
	sections: z.array(specSectionSchema),
});
export type SpecDoc = z.infer<typeof specDocSchema>;

// Page-level flow data (frontmatter `flow:` of a protocols MDX page).
const flowStepSchema = z.object({
	from: z.string(),
	to: z.string(),
	channel,
	title: z.string().refine((t) => words(t) <= 8, { error: 'step title has more than 8 words' }),
	summary: z.string().refine((t) => words(t) <= 35, { error: 'step summary has more than 35 words' }),
});

export const flowSchema = z
	.object({
		actors: z
			.array(z.union([z.string(), z.object({ name: z.string(), role: z.string().optional() })]).transform((a) => (typeof a === 'string' ? { name: a } : a)))
			.min(2)
			.max(3),
		steps: z.array(flowStepSchema).min(1).max(7),
	})
	.superRefine((f, ctx) => {
		f.steps.forEach((s, i) => {
			for (const k of ['from', 'to'] as const)
				if (!f.actors.some((a) => a.name === s[k])) ctx.addIssue({ code: 'custom', message: `step ${i + 1} ${k} "${s[k]}" is not in actors`, path: ['steps', i, k] });
		});
	});
export type Flow = z.infer<typeof flowSchema>;
