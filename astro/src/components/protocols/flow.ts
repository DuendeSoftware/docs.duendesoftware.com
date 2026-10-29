// Progressive enhancement: the server HTML already has every step. No autoplay.
class FlowStepper extends HTMLElement {
	#i = 0;
	#off?: () => void;
	static #vis = new Map<FlowStepper, number>();
	disconnectedCallback() { this.#off?.(); this.#off = undefined; this.removeAttribute('data-ready'); }
	connectedCallback() {
		const $$ = <T extends Element = HTMLElement>(s: string) => [...this.querySelectorAll<T>(s)];
		const rows = $$('.fl-rows > li'), actors = $$('.fl-actor');
		const prev = this.querySelector<HTMLButtonElement>('.prev')!, next = this.querySelector<HTMLButtonElement>('.next')!;
		const live = this.querySelector('.fl-sr')!, count = this.querySelector('.fl-count')!;
		const last = rows.length - 1, embed = this.hasAttribute('data-embed');
		if (last < 1 || this.hasAttribute('data-ready')) return;
		this.setAttribute('data-ready', '');
		const go = (n: number, announce = true) => {
			const i = (this.#i = Math.max(0, Math.min(last, n)));
			rows.forEach((li, k) => {
				li.toggleAttribute('data-active', k === i);
				const b = li.querySelector('.fl-n')!;
				k === i ? b.setAttribute('aria-current', 'step') : b.removeAttribute('aria-current');
			});
			actors.forEach((a, k) => a.classList.toggle('on', k === +rows[i].dataset.from! || k === +rows[i].dataset.to!));
			prev.disabled = i === 0;
			next.disabled = i === last;
			if ((document.activeElement as HTMLButtonElement | null)?.disabled) this.focus();
			count.textContent = `${i + 1} / ${last + 1}`;
			if (announce) {
				rows[i].scrollIntoView({ block: 'nearest', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
				live.textContent = `Step ${i + 1} of ${last + 1}: ${rows[i].querySelector(".fl-title")!.textContent}, ${rows[i].dataset.path}`;
				if (!embed) history.replaceState(null, '', `#step-${i + 1}`);
			}
		};
		this.#bindDetails(rows, go);
		prev.onclick = () => go(this.#i - 1);
		next.onclick = () => go(this.#i + 1);
		this.tabIndex = 0;
		this.setAttribute('aria-label', 'Walkthrough: use the arrow keys to change step');
		rows.forEach((r, k) => r.addEventListener('click', (e) => {
			if ((e.target as HTMLElement).closest('a')) return;
			go(k);
			if (!(e.target as HTMLElement).closest('button')) this.focus();
		}));
		// Page-wide Left/Right for the instance most in view; Up/Down/Home/End only with focus inside (they scroll the page).
		const io = new IntersectionObserver((es) => es.forEach((x) => (x.isIntersecting ? FlowStepper.#vis.set(this, x.intersectionRatio) : FlowStepper.#vis.delete(this))), { threshold: [0, 0.1, 0.25, 0.5, 0.75, 0.9, 1] });
		io.observe(this);
		const doc = (e: KeyboardEvent) => {
			const d = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
			const t = e.target as HTMLElement | null;
			if (!d || e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey || t?.closest('input, textarea, select, [contenteditable]:not([contenteditable=false])') || document.querySelector('dialog[open]')) return;
			if (this.contains(t) || [...FlowStepper.#vis].sort((x, y) => y[1] - x[1])[0]?.[0] !== this) return;
			go(this.#i + d);
			e.preventDefault();
		};
		document.addEventListener('keydown', doc);
		this.#off = () => { document.removeEventListener('keydown', doc); io.disconnect(); FlowStepper.#vis.delete(this); };
		this.addEventListener('keydown', (e) => {
			const d = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
			if ((e.target as HTMLElement).closest('a') || e.altKey || e.ctrlKey || e.metaKey) return;
			if (d) go(this.#i + d);
			else if (e.key === 'Home') go(0);
			else if (e.key === 'End') go(last);
			else return;
			e.preventDefault();
		});
		const h = !embed && /^#step-(\d+)$/.exec(location.hash);
		go(h ? +h[1] - 1 : 0, false);
	}
	// Full protocols pages only: 'Details ↓' links to the k-th "###" heading under the H2 ending in "Step by Step" (matched
	// case-insensitively), and each step section gets a link back to the diagram at that step.
	#bindDetails(rows: HTMLElement[], go: (n: number, announce?: boolean) => void) {
		if (this.hasAttribute('data-embed')) return;
		const heads = [...document.querySelectorAll<HTMLElement>('.sl-markdown-content h2, .sl-markdown-content h3')];
		const from = heads.findIndex((h) => h.tagName === 'H2' && h.textContent?.trim().toLowerCase().endsWith('step by step'));
		if (from < 0) return;
		const rest = heads.slice(from + 1), end = rest.findIndex((h) => h.tagName === 'H2');
		const h3 = (end < 0 ? rest : rest.slice(0, end)).filter((h) => h.tagName === 'H3');
		const isHead = (e: Element) => e.matches('h2, h3, .sl-heading-wrapper');
		rows.forEach((li, k) => {
			const head = h3[k];
			if (!head?.id) return;
			const a = li.querySelector<HTMLAnchorElement>('.fl-more');
			if (a) { a.href = `#${head.id}`; a.hidden = false; }
			let el: Element = head.closest('.sl-heading-wrapper') ?? head;
			while (el.nextElementSibling && !isHead(el.nextElementSibling)) el = el.nextElementSibling;
			const back = (this.querySelector<HTMLTemplateElement>('.fl-back-tpl')!.content.firstElementChild as HTMLElement).cloneNode(true) as HTMLElement;
			back.querySelector('a')!.href = `#step-${k + 1}`;
			back.querySelector('a')!.addEventListener('click', (e) => {
				e.preventDefault();
				go(k, false);
				history.replaceState(null, '', `#step-${k + 1}`);
				this.scrollIntoView({ block: 'start', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
				this.focus({ preventScroll: true });
			});
			el.after(back);
		});
	}
}
if (!customElements.get('flow-stepper')) customElements.define('flow-stepper', FlowStepper);
