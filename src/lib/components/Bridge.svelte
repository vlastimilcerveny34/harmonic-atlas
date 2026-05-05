<script lang="ts">
	import { tonicPc, modeName, lenses, modulationTarget, progression, selectedModulationPath } from '$lib/stores/session.js';
	import { findModulationPaths, findMultiStepPaths, type BridgeType } from '$lib/theory/modulation.js';
	import { findChordPaths, type ChordPath } from '$lib/theory/pathfinding.js';
	import { MODES, MODE_NAMES } from '$lib/theory/modes.js';
	import { playChord } from '$lib/audio/synth.js';
	import { NOTE_NAMES_DISPLAY } from '$lib/theory/noteNames.js';
	import type { Quality, ModeName } from '$lib/theory/modes.js';

	type Mode = 'keys' | 'chords';
	let mode: Mode = $state('keys');

	// ─── Between keys (modulation) ────────────────────────────────────────────
	const BRIDGE_COLORS: Record<BridgeType, string> = {
		pivot:             '#d4a574',
		secondaryDominant: '#e8956d',
		directDominant:    '#d4a574',
		chromaticMediant:  '#b888c4',
	};
	const BRIDGE_LABELS: Record<BridgeType, string> = {
		pivot:             'Pivot chord',
		secondaryDominant: 'V7 of new tonic',
		directDominant:    'Direct dominant',
		chromaticMediant:  'Chromatic mediant',
	};

	let targetPc = $state(7);
	let targetModeName: ModeName = $state('ionian');

	const keysActive = $derived($modulationTarget !== null);

	// Auto-update modulationTarget when inputs change AND results are showing
	$effect(() => {
		if (keysActive) {
			const cur = $modulationTarget!;
			if (cur.tonicPc !== targetPc || cur.modeName !== targetModeName) {
				modulationTarget.set({ tonicPc: targetPc, modeName: targetModeName });
			}
		}
	});

	const keyPaths = $derived(
		$modulationTarget
			? findModulationPaths($tonicPc, $modeName, $modulationTarget.tonicPc, $modulationTarget.modeName)
			: []
	);
	const multiStepPaths = $derived(
		$modulationTarget
			? findMultiStepPaths($tonicPc, $modeName, $modulationTarget.tonicPc, $modulationTarget.modeName)
			: []
	);
	const grouped = $derived(() => {
		const m: Record<BridgeType, typeof keyPaths> = {
			pivot: [], secondaryDominant: [], directDominant: [], chromaticMediant: [],
		};
		keyPaths.forEach(p => m[p.bridge.type].push(p));
		return m;
	});

	function searchKeys() { modulationTarget.set({ tonicPc: targetPc, modeName: targetModeName }); }
	function clearKeys()  { modulationTarget.set(null); }

	function loadKeyPath(example: { pc: number; quality: string; label: string }[]) {
		const q = (s: string) => s as 'M' | 'm' | 'd' | '7';
		progression.set(example.map(c => ({
			pc: c.pc, quality: q(c.quality),
			id: Date.now() + Math.random(),
		})));
		selectedModulationPath.set(example.map(c => ({ pc: c.pc, quality: q(c.quality), label: c.label })));
	}

	// ─── Between chords (pathfinder) ──────────────────────────────────────────
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
	let chordPaths: ChordPath[] = $state([]);
	let chordsActive = $state(false);

	function runChordSearch() {
		chordPaths = findChordPaths(
			{ pc: fromPc, quality: fromQ },
			{ pc: toPc,   quality: toQ },
			$tonicPc, $modeName, $lenses,
			{ maxLength: 5, k: 5 },
		);
	}

	function searchChords() { chordsActive = true; runChordSearch(); }
	function clearChords()  { chordsActive = false; chordPaths = []; }

	// Auto-update results when inputs change AND results are showing
	$effect(() => {
		// Track all inputs
		void [fromPc, fromQ, toPc, toQ, $tonicPc, $modeName, $lenses];
		if (chordsActive) runChordSearch();
	});

	function loadChordPath(path: ChordPath) {
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
	<div class="panel-header">
		<h3 class="panel-title">Bridge</h3>
		<div class="mode-switch">
			<button class:active={mode === 'keys'}   onclick={() => mode = 'keys'}>Between keys</button>
			<button class:active={mode === 'chords'} onclick={() => mode = 'chords'}>Between chords</button>
		</div>
	</div>

	{#if mode === 'keys'}
		<!-- ─── KEYS MODE ────────────────────────────────────────────────────── -->
		<div class="inputs-row">
			<label class="control-group">
				<span class="control-label">Target tonic</span>
				<select bind:value={targetPc}>
					{#each Array.from({ length: 12 }, (_, i) => i) as pc}
						<option value={pc}>{NOTE_NAMES_DISPLAY[pc]}</option>
					{/each}
				</select>
			</label>
			<label class="control-group">
				<span class="control-label">Mode</span>
				<select bind:value={targetModeName}>
					{#each MODE_NAMES as key}
						<option value={key}>{MODES[key].label}</option>
					{/each}
				</select>
			</label>
		</div>

		<div class="action-row">
			<button class="btn-search" onclick={searchKeys}>▶ SEARCH</button>
			<button class="btn-clear" onclick={clearKeys} disabled={!keysActive}>✕ CLEAR</button>
		</div>

		<div class="results-area">
			{#if keysActive}
				{#if keyPaths.length === 0 && multiStepPaths.length === 0}
					<p class="empty">No paths (target key is identical to current).</p>
				{:else}
					{#each Object.entries(grouped()) as [type, list]}
						{#if list.length > 0}
							<div class="bridge-group">
								<div class="bridge-type-label" style:color={BRIDGE_COLORS[type as BridgeType]}>
									{BRIDGE_LABELS[type as BridgeType]} ({list.length})
								</div>
								{#each list as path}
									<div class="path-card" role="button" tabindex="0"
										onclick={() => loadKeyPath(path.example)}
										onkeydown={(e) => e.key === 'Enter' && loadKeyPath(path.example)}
									>
										<div class="bridge-header">
											<span class="bridge-chord">{path.bridge.chord.label}</span>
											<span class="bridge-roles">
												{#if path.bridge.fromRole}
													<span class="role">{path.bridge.fromRole}</span>
													<span class="arr">→</span>
												{/if}
												<span class="role">{path.bridge.toRole}</span>
											</span>
										</div>
										<div class="example">
											{#each path.example as step, i}
												<button class="chord-chip"
													onclick={(e) => { e.stopPropagation(); playChord(step.pc, step.quality as Quality, $tonicPc, $modeName); }}
												>{step.label}</button>
												{#if i < path.example.length - 1}<span class="example-arr">→</span>{/if}
											{/each}
										</div>
									</div>
								{/each}
							</div>
						{/if}
					{/each}
					{#if multiStepPaths.length > 0}
						<div class="bridge-group">
							<div class="bridge-type-label" style:color="#a8c07a">
								Via intermediate key ({multiStepPaths.length})
							</div>
							{#each multiStepPaths as path}
								<div class="path-card multistep-card" role="button" tabindex="0"
									onclick={() => loadKeyPath(path.example)}
									onkeydown={(e) => e.key === 'Enter' && loadKeyPath(path.example)}
								>
									<div class="bridge-header">
										<span class="bridge-chord multistep-via">via {path.via.label}</span>
									</div>
									<div class="example">
										{#each path.example as step, i}
											<span class="ms-chord">{step.label}</span>
											{#if i < path.example.length - 1}<span class="ms-arr">→</span>{/if}
										{/each}
									</div>
								</div>
							{/each}
						</div>
					{/if}
				{/if}
			{:else}
				<p class="empty">Pick a target key and click <strong>SEARCH</strong>. Pivot chords will be highlighted in the circle.</p>
			{/if}
		</div>
	{:else}
		<!-- ─── CHORDS MODE ──────────────────────────────────────────────────── -->
		<div class="inputs-row">
			<div class="endpoint">
				<span class="control-label">From</span>
				<div class="endpoint-fields">
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
			</div>
			<span class="arr-big">→</span>
			<div class="endpoint">
				<span class="control-label">To</span>
				<div class="endpoint-fields">
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
		</div>

		<div class="action-row">
			<button class="btn-search" onclick={searchChords}>▶ SEARCH</button>
			<button class="btn-clear" onclick={clearChords} disabled={!chordsActive}>✕ CLEAR</button>
		</div>

		<div class="results-area">
			{#if chordsActive}
				{#if chordPaths.length === 0}
					<p class="empty">No paths found. Try enabling more lenses or different endpoints.</p>
				{:else}
					<div class="results">
						{#each chordPaths as path}
							<div class="path-card" role="button" tabindex="0"
								onclick={() => loadChordPath(path)}
								onkeydown={(e) => e.key === 'Enter' && loadChordPath(path)}
							>
								<div class="path-header">
									<span class="character" style:color={CHARACTER_COLORS[path.character] ?? '#9b948a'}>
										{path.character}
									</span>
									<span class="meta">{path.steps.length - 1} steps · cost {path.totalCost.toFixed(1)}</span>
								</div>
								<div class="example">
									{#each path.steps as step, i}
										<button class="chord-chip"
											onclick={(e) => { e.stopPropagation(); playChord(step.pc, step.quality, $tonicPc, $modeName); }}
										>{step.label}</button>
										{#if i < path.steps.length - 1}<span class="example-arr">→</span>{/if}
									{/each}
								</div>
							</div>
						{/each}
					</div>
				{/if}
			{:else}
				<p class="empty">Pick a start and end chord, then click <strong>SEARCH</strong>. Algorithm uses current lenses.</p>
			{/if}
		</div>
	{/if}
</div>

<style>
	.panel {
		background: linear-gradient(180deg, #16120f 0%, #13100e 100%);
		border: 1px solid #2a251f; border-radius: 6px; padding: 16px 18px;
	}
	.panel-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; gap: 10px; flex-wrap: wrap; }
	.panel-title {
		font-family: 'Crimson Pro', serif; font-size: 0.7rem;
		text-transform: uppercase; letter-spacing: 0.2em;
		color: #d4a574; margin: 0; font-weight: 500;
	}

	.mode-switch { display: flex; gap: 0; border: 1px solid #3a342f; border-radius: 4px; overflow: hidden; }
	.mode-switch button {
		background: transparent; border: none; padding: 4px 10px; font-size: 0.7rem;
		color: #9b948a; cursor: pointer; font-family: 'Outfit', sans-serif;
		letter-spacing: 0.05em;
	}
	.mode-switch button.active { background: #2a221a; color: #d4a574; }
	.mode-switch button:hover:not(.active) { background: #1a1612; color: #c8c1b5; }

	.inputs-row { display: flex; align-items: end; gap: 10px; margin-bottom: 12px; flex-wrap: wrap; }
	.control-group, .endpoint { display: flex; flex-direction: column; gap: 4px; }
	.endpoint-fields { display: flex; gap: 4px; }
	.control-label { color: #9b948a; letter-spacing: 0.1em; text-transform: uppercase; font-size: 0.65rem; }
	.arr-big { color: #7a736a; font-size: 1.2rem; padding-bottom: 4px; }

	select {
		background: #13100e; border: 1px solid #3a342f; color: #e8e2d5;
		padding: 4px 6px; border-radius: 3px; font-size: 0.85rem; font-family: inherit;
	}

	.action-row { display: flex; gap: 8px; margin-bottom: 14px; }
	.btn-search, .btn-clear {
		padding: 5px 14px; border-radius: 3px; font-size: 0.7rem;
		font-family: 'Outfit', sans-serif; letter-spacing: 0.05em;
		cursor: pointer; border: 1px solid #3a342f;
	}
	.btn-search { background: #2a221a; border-color: #5a4f3f; color: #d4a574; }
	.btn-search:hover { background: #3a2e22; }
	.btn-clear { background: transparent; color: #9b948a; }
	.btn-clear:hover:not(:disabled) { background: #1a1612; color: #c8c1b5; }
	.btn-clear:disabled { opacity: 0.35; cursor: not-allowed; }

	.results-area { min-height: 30px; }
	.empty { font-size: 0.8rem; color: #7a736a; font-style: italic; font-family: 'Crimson Pro', serif; margin: 4px 0; }

	.results { display: flex; flex-direction: column; gap: 6px; max-height: 320px; overflow-y: auto; padding-right: 4px; }

	.bridge-group { margin-bottom: 12px; }
	.bridge-type-label { font-size: 0.7rem; letter-spacing: 0.05em; margin-bottom: 6px; }

	.path-card {
		background: #0f0d0b; border: 1px solid #26211c; border-radius: 4px;
		padding: 8px 10px; margin-bottom: 6px; cursor: pointer;
	}
	.path-card:hover { background: #161210; border-color: #3a342f; }
	.multistep-card { border-color: #2a4a2a; }
	.multistep-card:hover { background: #101510; border-color: #3a6a3a; }

	.bridge-header { display: flex; align-items: baseline; gap: 10px; margin-bottom: 4px; flex-wrap: wrap; }
	.bridge-chord { font-size: 0.95rem; color: #f4ead7; font-weight: 500; }
	.bridge-roles { font-family: 'Crimson Pro', serif; font-style: italic; font-size: 0.75rem; color: #9b948a; }
	.bridge-roles .role { color: #c8c1b5; }
	.arr, .example-arr { color: #5c5650; margin: 0 2px; }

	.path-header { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 6px; }
	.character {
		font-size: 0.7rem; letter-spacing: 0.05em; text-transform: uppercase;
		font-family: 'Outfit', sans-serif;
	}
	.meta { font-size: 0.7rem; color: #5c5650; font-family: 'JetBrains Mono', monospace; }

	.example { display: flex; align-items: center; gap: 4px; flex-wrap: wrap; margin-top: 4px; }
	.chord-chip {
		background: #1a1612; border: 1px solid #3a342f; color: #e8e2d5;
		padding: 3px 8px; border-radius: 3px; cursor: pointer; font-size: 0.8rem;
		font-family: 'Outfit', sans-serif;
	}
	.chord-chip:hover { background: #2a221a; }
	.multistep-via { font-size: 0.8rem; color: #a8c07a; font-weight: 500; }
	.ms-chord { font-size: 0.85rem; color: #e8e2d5; font-weight: 500; font-family: 'Outfit', sans-serif; }
	.ms-arr { color: #5c5650; font-size: 0.75rem; }
</style>
