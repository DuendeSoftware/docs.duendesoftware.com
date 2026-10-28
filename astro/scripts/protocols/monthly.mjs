// Monthly spec check: node scripts/protocols/monthly.mjs [--dry-run | --local]
// --local: offline registry/page drift check only (unknown keys, unused registry keys, status/url consistency); exits 1 on findings.
// For each spec document cited by a PUBLISHED protocols page (frontmatter `sources:` + <Cite k="..." />): verify registry quotes still appear in the live text,
// check RFC obsoleted/updated/errata and newer I-D revisions, and open one `protocols/re-review` issue per affected page.
// Never edits `draft`. --dry-run only prints.
import fs from 'node:fs';
import { spawnSync } from 'node:child_process';
import matter from 'gray-matter';
import { parse } from 'yaml';

const LOCAL = process.argv.includes('--local');
const DRY = process.argv.includes('--dry-run');
const LABEL = 'protocols/re-review';
const here = new URL('../../src/content/', import.meta.url);
const docs = fs.readdirSync(new URL('specs/', here)).filter((f) => f.endsWith('.yaml')).map((f) => parse(fs.readFileSync(new URL(`specs/${f}`, here), 'utf8')));
const pdir = new URL('docs/protocols/', here);
// Published protocols pages: id = path like security-hardening/dpop, keys = frontmatter sources + <Cite k="..."/>.
const published = fs.readdirSync(pdir, { recursive: true }).map((f) => f.replaceAll('\\', '/')).filter((f) => f.endsWith('.mdx') && f !== 'index.mdx').flatMap((f) => {
	const { data, content } = matter(fs.readFileSync(new URL(f, pdir), 'utf8'));
	return data.draft === true ? [] : [{ id: f.slice(0, -4), keys: [...new Set([...(data.sources ?? []), ...[...content.matchAll(/<Cite\s+k=["']([^"']+)["']/g)].map((m) => m[1])])] }];
});
const norm = (s) => s.replace(/[\u2018\u2019]/g, "'").replace(/[\u201c\u201d]/g, '"').replace(/[\u2010-\u2015]/g, '-').replace(/\s+/g, ' ').trim().toLowerCase();
// Drop RFC/I-D page headers and footers so quotes that span pages still match.
const unpage = (t) => t.split('\n').filter((l) => !/\[Page \d+\]\s*$/.test(l) && !/^(RFC \d+|Internet-Draft)\s{2,}.*\d{4}\s*$/.test(l)).join('\n');

async function get(url, json) {
	const r = await fetch(url, { headers: { 'user-agent': 'duende-docs-protocols-monthly' }, signal: AbortSignal.timeout(30000) });
	if (r.status === 404) return null;
	if (!r.ok) throw new Error(`HTTP ${r.status}`);
	return json ? r.json() : r.text();
}

const sectionDoc = new Map(docs.flatMap((d) => d.sections.map((s) => [s.key, d])));
const findings = []; // { doc, text, action, pages: Set<page id>, keys: string[] }
const errata = [], updated = []; // informational only
const errors = [];
const P = 'astro/src/content/docs/protocols/';
const cited = new Map(); // doc id -> [doc, pages]
for (const e of published)
	for (const k of e.keys) {
		const d = sectionDoc.get(k);
		if (d) (cited.get(d.id) ?? cited.set(d.id, [d, new Set()]).get(d.id))[1].add(e);
	}

// Drift check: registry vs pages (offline).
function drift() {
	const out = [];
	const all = fs.readdirSync(pdir, { recursive: true }).map((f) => f.replaceAll('\\', '/')).filter((f) => f.endsWith('.mdx') && f !== 'index.mdx').map((f) => {
		const { data, content } = matter(fs.readFileSync(new URL(f, pdir), 'utf8'));
		return { id: f, draft: data.draft === true, keys: [...(data.sources ?? []), ...[...content.matchAll(/<Cite\s+k=["']([^"']+)["']/g)].map((m) => m[1])] };
	});
	for (const p of all) for (const k of new Set(p.keys)) if (!sectionDoc.has(k)) out.push(`unknown key "${k}" in ${P}${p.id}: add it to its astro/src/content/specs/*.yaml or fix the key`);
	const used = new Set(published.flatMap((e) => e.keys)), usedAny = new Set(all.flatMap((e) => e.keys));
	for (const d of docs) for (const s of d.sections) {
		if (!usedAny.has(s.key)) out.push(`unused key "${s.key}" in astro/src/content/specs/${d.id}.yaml: no page cites it; delete the section`);
		else if (!used.has(s.key)) out.push(`key "${s.key}" is only cited by draft pages (astro/src/content/specs/${d.id}.yaml); fine until release, delete if the page goes away`);
	}
	for (const d of docs) {
		const f = `astro/src/content/specs/${d.id}.yaml`;
		if (!d.sections.length) out.push(`${f}: no sections; delete the file`);
		if (/^rfc\d+$/.test(d.id) && (d.status !== 'RFC' || d.url !== `https://www.rfc-editor.org/rfc/${d.id}`)) out.push(`${f}: RFC id must have status "RFC" and url https://www.rfc-editor.org/rfc/${d.id} (got "${d.status}", ${d.url})`);
		if (d.id.startsWith('draft-') && (!d.status.startsWith('I-D') || !d.url.includes(d.id))) out.push(`${f}: draft must have status "I-D ..." and a url containing "${d.id}" (got "${d.status}", ${d.url})`);
		if (!d.id.startsWith('draft-') && !/^rfc\d+$/.test(d.id) && d.status === 'RFC') out.push(`${f}: non-RFC id with status "RFC"`);
		if (fs.existsSync(new URL(`specs/${d.id}.yaml`, here)) === false) out.push(`${f}: file name must equal id`);
	}
	return out.filter(Boolean);
}
const driftFindings = drift();
if (LOCAL) {
	console.log(`protocols registry check: ${docs.length} docs, ${docs.reduce((n, d) => n + d.sections.length, 0)} keys, ${published.length} published pages, ${driftFindings.length} finding(s)`);
	driftFindings.forEach((f) => console.log(`  - ${f}`));
	process.exit(driftFindings.some((f) => !f.includes('only cited by draft')) ? 1 : 0);
}
const short = (q) => (q.length > 90 ? `${q.slice(0, 87)}...` : q);

for (const [id, [d, users]] of cited) {
	const rfc = /^rfc\d+$/.test(id), draft = id.match(/^(draft-.+)-(\d{2})$/);
	const file = `astro/src/content/specs/${id}.yaml`;
	const add = (text, action, pages = users, keys = []) => findings.push({ doc: id, text, action, pages: new Set([...pages].map((e) => e.id)), keys });
	try {
		if (d.quoteCheck !== 'manual' && (rfc || draft)) {
			const text = await get(rfc ? `https://www.rfc-editor.org/rfc/${id}.txt` : `https://www.ietf.org/archive/id/${id}.txt`);
			if (text == null) errors.push(`${id}: live text not found`);
			else {
				const live = norm(unpage(text));
				for (const s of d.sections.filter((s) => s.quote && sectionDoc.get(s.key) === d)) {
					const pages = [...users].filter((e) => e.keys.includes(s.key));
					if (pages.length && !live.includes(norm(s.quote)))
						add(`quote of key "${s.key}" (section ${s.section}) not found in live text: "${short(s.quote)}"`, `Check ${d.url}#${s.anchor}; update the quote for key "${s.key}" in ${file}, then re-read the page text that cites it`, pages, [s.key]);
				}
			}
		}
		if (rfc) {
			const j = await get(`https://www.rfc-editor.org/rfc/${id}.json`, true);
			const link = (n) => `https://www.rfc-editor.org/info/rfc${String(n).replace(/\D/g, '')}`;
			if (j?.obsoleted_by?.length) add(`obsoleted by ${j.obsoleted_by.join(', ')} (${j.obsoleted_by.map(link).join(' ')})`, `Re-read each citing page against the replacing RFC; update \`status\` and the cited sections/quotes in ${file} (or cite the new RFC)`);
			if (j?.updated_by?.length) updated.push(`${id}: updated by ${j.updated_by.join(', ')} (${j.updated_by.map(link).join(' ')})`);
			const n = +((await get(`https://www.rfc-editor.org/errata/${id}`))?.match(/Verified \((\d+)\)/)?.[1] ?? 0);
			if (n) errata.push(`${id}: ${n} verified (https://www.rfc-editor.org/errata/${id})`);
		} else if (draft) {
			const j = await get(`https://datatracker.ietf.org/api/v1/doc/document/${draft[1]}/`, true);
			if (j?.rfc_number || j?.rfc) add(`now published as RFC ${j.rfc_number ?? j.rfc}`, `Replace the draft with the RFC: add astro/src/content/specs/rfc${j.rfc_number ?? j.rfc}.yaml, re-point keys on the citing pages, set \`status\` in ${file}`);
			else if (j && j.rev > draft[2]) add(`newer I-D revision: -${draft[2]} -> -${j.rev}; diff: https://author-tools.ietf.org/iddiff?url1=${draft[1]}-${draft[2]}&url2=${draft[1]}-${j.rev}`, `Read the diff, re-read the citing pages against -${j.rev}, update the id/url/quotes/\`status\` in ${file} (or add a new registry file for -${j.rev})`);
		}
	} catch (e) { errors.push(`${id}: ${e.message}`); }
}

// Pages -> checklist lines (one checkbox per finding).
const byPage = new Map();
for (const f of findings) for (const p of f.pages) (byPage.get(p) ?? byPage.set(p, []).get(p)).push(f);
const withFindings = new Set(findings.map((f) => f.doc));

console.log(`protocols monthly${DRY ? ' (dry run)' : ''}`);
console.log(`  ${cited.size} spec docs checked, ${withFindings.size} with findings, ${byPage.size} of ${published.length} published pages affected, ${errors.length} fetch errors`);
console.log(`  informational only (noise, no per-page action): ${updated.length} cited RFCs have 'updated by' notes (long-standing; only 'obsoleted by' is actionable), ${errata.length} RFCs have verified errata (see below); errata data has no per-section detail, so check those by hand when touching a cited section`);
errors.forEach((e) => console.log(`  error: ${e}`));
for (const doc of withFindings) {
	console.log(`\n${doc}  (${cited.get(doc)[0].url})  registry: astro/src/content/specs/${doc}.yaml`);
	for (const f of findings.filter((f) => f.doc === doc)) {
		console.log(`  - ${f.text}`);
		console.log(`    pages: ${[...f.pages].map((p) => `${P}${p}.mdx`).join(', ')}`);
		console.log(`    action: ${f.action}`);
	}
}
if (driftFindings.length) console.log(`\nregistry drift (run npm run protocols:check):\n${driftFindings.map((f) => `  - ${f}`).join('\n')}`);
if (updated.length + errata.length) console.log(`\ninformational:\n${[...updated, ...errata.map((e) => `${e.split(':')[0]}: verified errata${e.slice(e.indexOf(':') + 1)}`)].map((e) => `  ${e}`).join('\n')}`);
const bodyOf = (id, fs_) => `Monthly protocols spec check found changes affecting **${id}** (\`${P}${id}.mdx\`):\n\n${fs_.map((f) => `- [ ] **${f.doc}**: ${f.text}\\n  Edit: \`${P}${id}.mdx\`${f.keys.length ? `, \`astro/src/content/specs/${f.doc}.yaml\`` : ''}. ${f.action}`.replace('\\n', '\n')).join('\n')}\n\nRe-review against the current spec text. \`draft\` is never changed automatically.\n`;
const gh = (a) => spawnSync('gh', a, { encoding: 'utf8' });
if (!DRY && byPage.size) gh(['label', 'create', LABEL, '--color', 'B60205', '--description', 'Spec changed under a published protocols page']);
const open = DRY || !byPage.size ? [] : JSON.parse(gh(['issue', 'list', '--label', LABEL, '--state', 'open', '--limit', '200', '--json', 'title']).stdout || '[]').map((i) => i.title);
let code = 0;
if (DRY) console.log(`\nwould open ${byPage.size} issue(s) (label ${LABEL}):`);
for (const [id, fs_] of byPage) {
	const title = `Re-review protocols page: ${id}`, body = bodyOf(id, fs_);
	if (DRY) console.log(`\n=== ${title}\n${body.replace(/^/gm, '    ')}`);
	else if (open.includes(title)) console.log(`exists, skipped: ${title}`);
	else if (gh(['issue', 'create', '--title', title, '--body', body, '--label', LABEL]).status === 0) console.log(`opened: ${title}`);
	else { console.log(`failed: ${title}`); code = 1; }
}
if (!byPage.size) console.log('\nno page affected');
process.exit(code);
