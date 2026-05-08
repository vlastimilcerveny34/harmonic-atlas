<script lang="ts">
	import { selectedChord, hoveredChord, diatonicSet, tonicPc, modeName, pulseId, progression, lenses, modulationTarget, targetDiatonicSet, selectedModulationPath } from '$lib/stores/session.js';
	import { isDiatonic, getRoman, canonicalChordLabel } from '$lib/theory/chords.js';
	import { outgoingRelationships } from '$lib/theory/relationships.js';
	import { playChord } from '$lib/audio/synth.js';
	import { buildCircleNodes, curvedPath, VIEW, CENTER, R_DOM, R_MAJ, R_MIN, type ChordNode } from '$lib/layouts/circleOfFifths.js';
	import { FIFTHS_PCS } from '$lib/theory/chords.js';

	const QUALITY_COLOR: Record<string, string> = {
		M: '#e08f9a', m: '#7aa9c9', d: '#b888c4', '7': '#d4a44a',
	};
	const REL_TYPES: Record<string, { color: string; dash: string }> = {
		dominant:          { color: '#d4a574', dash: '0' },
		tritoneSub:        { color: '#d97a8e', dash: '0' },
		diatonic:          { color: '#7aa9c9', dash: '0' },
		modalInterchange:  { color: '#8eaf6e', dash: '4 3' },
		chromaticMediant:  { color: '#b888c4', dash: '4 3' },
		secondaryDominant: { color: '#e8956d', dash: '2 2' },
		modalCadence:      { color: '#c4a04a', dash: '0' },
	};

	const chordNodes = buildCircleNodes();

	const focusChord = $derived($selectedChord ?? $hoveredChord);

	const arrows = $derived(() => {
		if (!focusChord) return [];
		const rels = outgoingRelationships(focusChord, $tonicPc, $modeName, $lenses);
		return rels.map(r => {
			const fromNode = chordNodes.find(n => n.pc === r.from.pc && n.quality === r.from.quality);
			const toNode   = chordNodes.find(n => n.pc === r.to.pc   && n.quality === r.to.quality);
			if (!fromNode || !toNode) return null;
			return { ...r, fromNode, toNode };
		}).filter(Boolean) as (typeof rels[0] & { fromNode: ChordNode; toNode: ChordNode })[];
	});

	export { arrows };

	const targetSet = $derived(() => {
		const m = new Map<string, string[]>();
		arrows().forEach(a => {
			const k = `${a.toNode.pc}-${a.toNode.quality}`;
			if (!m.has(k)) m.set(k, []);
			m.get(k)!.push(a.type);
		});
		return m;
	});

	function darken(hex: string, amount: number): string {
		const h = hex.replace('#', '');
		const r = parseInt(h.substring(0, 2), 16);
		const g = parseInt(h.substring(2, 4), 16);
		const b = parseInt(h.substring(4, 6), 16);
		const f = 1 - amount;
		return `rgb(${Math.round(r*f)},${Math.round(g*f)},${Math.round(b*f)})`;
	}

	function handleClick(node: ChordNode) {
		selectedChord.set({ pc: node.pc, quality: node.quality });
		pulseId.update(p => p + 1);
		playChord(node.pc, node.quality, $tonicPc, $modeName);
	}

	function handleDoubleClick(node: ChordNode) {
		progression.update(p => [...p, { pc: node.pc, quality: node.quality, id: Date.now() + Math.random() }]);
		handleClick(node);
	}

	// Tonic chord position depends on tonic chord quality:
	// minor tonics (Aeolian/Dorian/Phrygian) sit on the relative-major spoke,
	// not on the tonic-pitch spoke. M and d tonics sit on their own pitch spoke.
	const tonicSpokeIdx = $derived(
		$diatonicSet[0]?.quality === 'm'
			? FIFTHS_PCS.indexOf(($tonicPc + 3) % 12)
			: FIFTHS_PCS.indexOf($tonicPc)
	);

	// Pivot detection: a chord that is diatonic in BOTH current key and target key
	// Used to render a golden ring around bridge chord nodes when modulation explorer is active.
	const pivotKeys = $derived(() => {
		const set = new Set<string>();
		const t = $targetDiatonicSet;
		if (!t) return set;
		$diatonicSet.forEach(d => {
			if (t.some(td => td.pc === d.pc && td.quality === d.quality)) {
				set.add(`${d.pc}-${d.quality}`);
			}
		});
		return set;
	});

	// Target tonic spoke index (for visual marker) — same minor-tonic logic as tonicSpokeIdx
	const targetTonicSpokeIdx = $derived.by(() => {
		if (!$modulationTarget) return -1;
		const targetTonic = $targetDiatonicSet?.[0];
		const targetPc = $modulationTarget.tonicPc;
		return targetTonic?.quality === 'm'
			? FIFTHS_PCS.indexOf((targetPc + 3) % 12)
			: FIFTHS_PCS.indexOf(targetPc);
	});

	// Selected modulation path: map each step to its step index (1-based) keyed by "pc-quality"
	const pathStepMap = $derived(() => {
		const m = new Map<string, number>();
		if (!$selectedModulationPath) return m;
		$selectedModulationPath.forEach((c, i) => m.set(`${c.pc}-${c.quality}`, i + 1));
		return m;
	});

	// Ordered list of node positions for the selected path (for drawing arrows)
	const pathArrows = $derived(() => {
		if (!$selectedModulationPath || $selectedModulationPath.length < 2) return [];
		const result: { fromNode: ChordNode; toNode: ChordNode }[] = [];
		for (let i = 0; i < $selectedModulationPath.length - 1; i++) {
			const a = $selectedModulationPath[i];
			const b = $selectedModulationPath[i + 1];
			const fromNode = chordNodes.find(n => n.pc === a.pc && n.quality === a.quality);
			const toNode   = chordNodes.find(n => n.pc === b.pc && n.quality === b.quality);
			if (fromNode && toNode) result.push({ fromNode, toNode });
		}
		return result;
	});
</script>

<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<div class="graph-wrap"
	role="presentation"
	onclick={(e) => { if ((e.target as Element).tagName === 'svg') selectedChord.set(null); }}
	onkeydown={(e) => { if (e.key === 'Escape') { selectedChord.set(null); selectedModulationPath.set(null); } }}
>
	{#if $selectedModulationPath}
		<button class="clear-path-btn" onclick={() => selectedModulationPath.set(null)} title="Clear displayed path">
			✕ clear path
		</button>
	{/if}
	<svg viewBox="0 0 {VIEW} {VIEW}" class="graph-svg">

		<defs>
			{#each Object.entries(REL_TYPES) as [key, t]}
				<marker id="arrow-{key}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5.5" markerHeight="5.5" orient="auto">
					<path d="M 0 0 L 10 5 L 0 10 z" fill={t.color} />
				</marker>
			{/each}
			<marker id="arrow-path" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">
				<path d="M 0 0 L 10 5 L 0 10 z" fill="#d4a574" />
			</marker>
			<radialGradient id="centerGlow" cx="50%" cy="50%" r="50%">
				<stop offset="0%"  stop-color="#d4a574" stop-opacity="0.06" />
				<stop offset="70%" stop-color="#d4a574" stop-opacity="0" />
			</radialGradient>
		</defs>

		<circle cx={CENTER.x} cy={CENTER.y} r="200" fill="url(#centerGlow)" />

		{#each [R_DOM, R_MAJ, R_MIN] as r}
			<circle cx={CENTER.x} cy={CENTER.y} {r} fill="none" style="stroke: var(--border-2)" stroke-width="0.5" stroke-dasharray="2 6" />
		{/each}

		{#each FIFTHS_PCS as _, i}
			{@const angle = (i / 12) * Math.PI * 2 - Math.PI / 2}
			<line
				x1={CENTER.x + Math.cos(angle) * 145} y1={CENTER.y + Math.sin(angle) * 145}
				x2={CENTER.x + Math.cos(angle) * 358} y2={CENTER.y + Math.sin(angle) * 358}
				style="stroke: var(--border-2)" stroke-width="0.5"
			/>
		{/each}

		{#if tonicSpokeIdx >= 0}
			{@const angle = (tonicSpokeIdx / 12) * Math.PI * 2 - Math.PI / 2}
			<text
				x={CENTER.x + Math.cos(angle) * 376}
				y={CENTER.y + Math.sin(angle) * 376}
				text-anchor="middle" dominant-baseline="middle"
				style="font-family:'Crimson Pro',serif; font-size:14px; font-style:italic; fill: var(--accent);"
			>tonic</text>
		{/if}

		{#if targetTonicSpokeIdx >= 0}
			{@const angle = (targetTonicSpokeIdx / 12) * Math.PI * 2 - Math.PI / 2}
			<text
				x={CENTER.x + Math.cos(angle) * 390}
				y={CENTER.y + Math.sin(angle) * 390}
				text-anchor="middle" dominant-baseline="middle" fill="#8eaf6e"
				style="font-family:'Crimson Pro',serif; font-size:12px; font-style:italic;"
			>→ target</text>
		{/if}

		<!-- Arrows — keyed on pulseId so animation re-triggers on same-chord re-click -->
		{#key $pulseId}
			{#each arrows() as a, idx}
				{@const t = REL_TYPES[a.type]}
				{@const from = a.fromNode}
				{@const to = a.toNode}
				{@const dx = to.x - from.x}
				{@const dy = to.y - from.y}
				{@const dist = Math.sqrt(dx*dx + dy*dy) || 1}
				{@const fx = from.x + (dx/dist) * (from.r + 2)}
				{@const fy = from.y + (dy/dist) * (from.r + 2)}
				{@const tx = to.x   - (dx/dist) * (to.r + 4)}
				{@const ty = to.y   - (dy/dist) * (to.r + 4)}
				<path
					class="arrow-path {t.dash !== '0' ? 'arrow-dashed' : 'arrow-solid'}"
					d={curvedPath({ x: fx, y: fy }, { x: tx, y: ty })}
					fill="none"
					stroke={t.color}
					stroke-width="1.6"
					stroke-dasharray={t.dash !== '0' ? t.dash : undefined}
					marker-end="url(#arrow-{a.type})"
					style="filter: drop-shadow(0 0 3px {t.color}40)"
				/>
			{/each}
		{/key}

		<!-- Modulation path arrows -->
		{#each pathArrows() as { fromNode, toNode }}
			{@const dx = toNode.x - fromNode.x}
			{@const dy = toNode.y - fromNode.y}
			{@const dist = Math.sqrt(dx*dx + dy*dy) || 1}
			{@const fx = fromNode.x + (dx/dist) * (fromNode.r + 10)}
			{@const fy = fromNode.y + (dy/dist) * (fromNode.r + 10)}
			{@const tx = toNode.x   - (dx/dist) * (toNode.r  + 12)}
			{@const ty = toNode.y   - (dy/dist) * (toNode.r  + 12)}
			<path
				d={curvedPath({ x: fx, y: fy }, { x: tx, y: ty })}
				fill="none"
				stroke="#d4a574"
				stroke-width="2"
				opacity="0.85"
				marker-end="url(#arrow-path)"
				style="filter: drop-shadow(0 0 4px #d4a57460)"
			/>
		{/each}

		<!-- Chord nodes -->
		{#each chordNodes as node (`${node.pc}-${node.quality}-${node.spoke}`)}
			{@const inKey = isDiatonic(node.pc, node.quality, $diatonicSet)}
			{@const roman = getRoman(node.pc, node.quality, $diatonicSet)}
			{@const color = QUALITY_COLOR[node.quality]}
			{@const isFocus = !!focusChord && focusChord.pc === node.pc && focusChord.quality === node.quality}
			{@const isSelected = !!$selectedChord && $selectedChord.pc === node.pc && $selectedChord.quality === node.quality}
			{@const targetTypes = targetSet().get(`${node.pc}-${node.quality}`) ?? []}
			{@const isTarget = targetTypes.length > 0}
			{@const pathStep = pathStepMap().get(`${node.pc}-${node.quality}`) ?? 0}
			{@const opacity = inKey ? 1 : (isTarget || isFocus || pathStep > 0 ? 1 : 0.7)}
			{@const fill = inKey ? color : darken(color, 0.5)}
			{@const stroke = isFocus ? '#f4ead7' : (inKey ? color : darken(color, 0.15))}
			{@const strokeWidth = isFocus ? 2.5 : (isTarget ? 1.5 : 0.8)}
			{@const textColor = inKey ? '#1a1210' : '#f0e8d8'}

			<g class="chord-node"
				onmouseenter={() => hoveredChord.set({ pc: node.pc, quality: node.quality })}
				onmouseleave={() => hoveredChord.set(null)}
				onclick={(e) => { e.stopPropagation(); handleClick(node); }}
				ondblclick={(e) => { e.stopPropagation(); handleDoubleClick(node); }}
				role="button"
				tabindex="0"
				aria-label={canonicalChordLabel(node.pc, node.quality)}
				onkeydown={(e) => e.key === 'Enter' && handleClick(node)}
			>
				{#if isSelected}
					{#key $pulseId}
						<circle cx={node.x} cy={node.y} r={node.r}
							class="pulse-ring" fill="none" stroke={color} stroke-width="2" />
					{/key}
				{/if}

				{#if pivotKeys().has(`${node.pc}-${node.quality}`)}
					<circle cx={node.x} cy={node.y} r={node.r + 6}
						fill="none" stroke="#8eaf6e" stroke-width="2" opacity="0.85"
						stroke-dasharray="3 2"
					/>
				{/if}

				{#if pathStep > 0}
					<circle cx={node.x} cy={node.y} r={node.r + 8}
						fill="none" stroke="#d4a574" stroke-width="2" opacity="0.9"
					/>
					<circle cx={node.x} cy={node.y + node.r + 8} r="8"
						style="fill: var(--badge-bg); stroke: var(--accent)" stroke-width="1.5"
					/>
					<text x={node.x} y={node.y + node.r + 8}
						text-anchor="middle" dominant-baseline="central"
						style="font-family:'Outfit',sans-serif; font-size:9px; font-weight:700; pointer-events:none; fill: var(--accent);"
					>{pathStep}</text>
				{/if}

				{#each targetTypes as type, i}
					<circle cx={node.x} cy={node.y} r={node.r + 4 + i * 3.5}
						fill="none" stroke={REL_TYPES[type].color} stroke-width="1.5" opacity="0.75"
						stroke-dasharray={REL_TYPES[type].dash !== '0' ? REL_TYPES[type].dash : undefined}
					/>
				{/each}

				<circle class="bg" cx={node.x} cy={node.y} r={node.r}
					{fill} stroke={stroke} stroke-width={strokeWidth} {opacity} />

				<text x={node.x} y={node.y} text-anchor="middle" dominant-baseline="central"
					fill={textColor}
					style="font-family:'Outfit',sans-serif; font-weight:500; font-size:{node.r < 24 ? 12 : 14}px; pointer-events:none; user-select:none;"
				>{canonicalChordLabel(node.pc, node.quality)}</text>

				{#if isFocus && roman}
					<text x={node.x} y={node.y - node.r - 8}
						text-anchor="middle" fill="#d4a574"
						style="font-family:'Crimson Pro',serif; font-style:italic; font-size:18px; pointer-events:none;"
					>{roman}</text>
				{/if}
			</g>
		{/each}

		<g opacity="0.2">
			<line x1={CENTER.x - 10} y1={CENTER.y} x2={CENTER.x + 10} y2={CENTER.y} style="stroke: var(--text-3)" stroke-width="0.5" />
			<line x1={CENTER.x} y1={CENTER.y - 10} x2={CENTER.x} y2={CENTER.y + 10} style="stroke: var(--text-3)" stroke-width="0.5" />
		</g>
	</svg>
</div>

<style>
	.graph-wrap { position: relative; width: 100%; max-width: 800px; cursor: default; }
	@media (max-width: 900px) { .graph-wrap { max-width: 100%; } }
	.clear-path-btn {
		position: absolute; top: 10px; right: 10px; z-index: 10;
		background: var(--badge-bg); border: 1px solid var(--accent); color: var(--accent);
		padding: 5px 12px; border-radius: 4px; cursor: pointer;
		font-family: 'Outfit', sans-serif; font-size: 0.75rem; letter-spacing: 0.05em;
	}
	.clear-path-btn:hover { background: var(--surface-5); }
	.graph-svg { width: 100%; height: auto; display: block; }
	.chord-node { cursor: pointer; }
	.chord-node:hover .bg { filter: brightness(1.4); }
	@keyframes pulseRing {
		0%   { r: 24; opacity: 0.7; }
		100% { r: 60; opacity: 0; }
	}
	.pulse-ring { animation: pulseRing 0.8s ease-out forwards; }
	@keyframes drawArrow {
		from { stroke-dashoffset: 1200; opacity: 0; }
		to   { stroke-dashoffset: 0;    opacity: 0.85; }
	}
	@keyframes fadeArrow {
		from { opacity: 0; }
		to   { opacity: 0.85; }
	}
	.arrow-solid { stroke-dasharray: 1200; animation: drawArrow 0.45s cubic-bezier(0.4,0,0.2,1) forwards; }
	.arrow-dashed { animation: fadeArrow 0.45s ease-out forwards; }
</style>
