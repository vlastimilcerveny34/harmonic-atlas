<script lang="ts">
	import { tonicPc, modeName, lenses, progression, selectedModulationPath } from '$lib/stores/session.js';
	import { findChordPaths, type ChordPath } from '$lib/theory/pathfinding.js';
	import { canonicalChordLabel } from '$lib/theory/chords.js';
	import { playChord } from '$lib/audio/synth.js';
	import { NOTE_NAMES_DISPLAY } from '$lib/theory/noteNames.js';
	import type { Quality } from '$lib/theory/modes.js';

	const QUALITIES: { value: Quality; label: string }[] = [
		{ value: 'M', label: 'major' },
		{ value: 'm', label: 'minor' },
		{ value: '7', label: 'dom7' },
		{ value: 'd', label: 'dim' },
	];

	const CHARACTER_COLORS: Record<string, string> = {
		smooth:    '#7aa9c9',
		classical: '#d4a574',
		jazzy:     '#e8956d',
		borrowed:  '#8eaf6e',
		chromatic: '#b888c4',
	};

	let fromPc = $state(0);
	let fromQ:  Quality = $state('M');
	let toPc   = $state(7);
	let toQ:   Quality = $state('m');

	let paths: ChordPath[] = $state([]);
	let searched = $state(false);

	function search() {
		paths = findChordPaths(
			{ pc: fromPc, quality: fromQ },
			{ pc: toPc,   quality: toQ },
			$tonicPc,
			$modeName,
			$lenses,
			{ maxLength: 5, k: 5 },
		);
		searched = true;
	}

	function loadPath(path: ChordPath) {
		progression.set(path.steps.map(s => ({
			pc: s.pc, quality: s.quality,
			id: Date.now() + Math.random(),
		})));
		selectedModulationPath.set(path.steps.map(s => ({
			pc: s.pc, quality: s.quality, label: s.label,
		})));
	}
</script>

<div class="panel">
	<h3 class="panel-title">Find a Path</h3>

	<div class="endpoint-row">
		<div class="endpoint">
			<span class="endpoint-label">From</span>
			<select bind:value={fromPc}>
				{#each Array.from({ length: 12 }, (_, i) => i) as pc}
					<option value={pc}>{NOTE_NAMES_DISPLAY[pc]}</option>
				{/each}
			</select>
			<select bind:value={fromQ}>
				{#each QUALITIES as q}
					<option value={q.value}>{q.label}</option>
				{/each}
			</select>
		</div>
		<span class="arr-big">→</span>
		<div class="endpoint">
			<span class="endpoint-label">To</span>
			<select bind:value={toPc}>
				{#each Array.from({ length: 12 }, (_, i) => i) as pc}
					<option value={pc}>{NOTE_NAMES_DISPLAY[pc]}</option>
				{/each}
			</select>
			<select bind:value={toQ}>
				{#each QUALITIES as q}
					<option value={q.value}>{q.label}</option>
				{/each}
			</select>
		</div>
	</div>

	<button class="btn-search" onclick={search}>Find paths</button>

	{#if searched}
		{#if paths.length === 0}
			<p class="empty">No paths found. Try enabling more lenses or different endpoints.</p>
		{:else}
			<div class="results">
				{#each paths as path}
					<div class="path-card" role="button" tabindex="0"
						onclick={() => loadPath(path)}
						onkeydown={(e) => e.key === 'Enter' && loadPath(path)}
						title="Click to load into progression builder"
					>
						<div class="path-header">
							<span class="character" style:color={CHARACTER_COLORS[path.character] ?? '#9b948a'}>
								{path.character}
							</span>
							<span class="meta">{path.steps.length - 1} steps · cost {path.totalCost.toFixed(1)}</span>
						</div>
						<div class="example">
							{#each path.steps as step, i}
								<button
									class="chord-chip"
									onclick={(e) => { e.stopPropagation(); playChord(step.pc, step.quality, $tonicPc, $modeName); }}
								>{step.label}</button>
								{#if i < path.steps.length - 1}
									<span class="example-arr">→</span>
								{/if}
							{/each}
						</div>
					</div>
				{/each}
			</div>
		{/if}
	{:else}
		<p class="empty">Pick a start and end chord, then click <strong>Find paths</strong>. Algorithm searches the harmonic graph using current lenses.</p>
	{/if}
</div>

<style>
	.panel {
		background: linear-gradient(180deg, #16120f 0%, #13100e 100%);
		border: 1px solid #2a251f; border-radius: 6px; padding: 16px 18px;
	}
	.panel-title {
		font-family: 'Crimson Pro', serif; font-size: 0.7rem;
		text-transform: uppercase; letter-spacing: 0.2em;
		color: #d4a574; margin: 0 0 12px; font-weight: 500;
	}

	.endpoint-row { display: flex; align-items: end; gap: 8px; margin-bottom: 10px; flex-wrap: wrap; }
	.endpoint { display: flex; flex-direction: column; gap: 4px; }
	.endpoint-label { color: #9b948a; letter-spacing: 0.1em; text-transform: uppercase; font-size: 0.65rem; }
	.endpoint select {
		background: #13100e; border: 1px solid #3a342f; color: #e8e2d5;
		padding: 4px 6px; border-radius: 3px; font-size: 0.8rem; font-family: inherit;
	}
	.arr-big { color: #7a736a; font-size: 1.2rem; padding-bottom: 4px; }

	.btn-search {
		background: #2a221a; border: 1px solid #5a4f3f; color: #d4a574;
		padding: 5px 14px; border-radius: 3px; font-size: 0.75rem;
		font-family: 'Outfit', sans-serif; letter-spacing: 0.05em;
		cursor: pointer; margin-bottom: 12px;
	}
	.btn-search:hover { background: #3a2e22; }

	.empty { font-size: 0.8rem; color: #7a736a; font-style: italic; font-family: 'Crimson Pro', serif; margin: 4px 0; }

	.results { display: flex; flex-direction: column; gap: 6px; max-height: 320px; overflow-y: auto; padding-right: 4px; }
	.path-card {
		background: #0f0d0b; border: 1px solid #26211c; border-radius: 4px;
		padding: 8px 10px; cursor: pointer;
	}
	.path-card:hover { background: #161210; border-color: #3a342f; }

	.path-header { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 6px; }
	.character {
		font-size: 0.7rem; letter-spacing: 0.05em; text-transform: uppercase;
		font-family: 'Outfit', sans-serif;
	}
	.meta { font-size: 0.7rem; color: #5c5650; font-family: 'JetBrains Mono', monospace; }

	.example { display: flex; align-items: center; gap: 4px; flex-wrap: wrap; }
	.chord-chip {
		background: #1a1612; border: 1px solid #3a342f; color: #e8e2d5;
		padding: 3px 8px; border-radius: 3px; cursor: pointer; font-size: 0.8rem;
		font-family: 'Outfit', sans-serif;
	}
	.chord-chip:hover { background: #2a221a; }
	.example-arr { color: #5c5650; font-size: 0.75rem; }
</style>
