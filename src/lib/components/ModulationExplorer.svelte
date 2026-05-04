<script lang="ts">
	import { tonicPc, modeName, modulationTarget, progression, selectedModulationPath } from '$lib/stores/session.js';
	import { findModulationPaths, findMultiStepPaths, type BridgeType, type MultiStepPath } from '$lib/theory/modulation.js';
	import { MODES, MODE_NAMES } from '$lib/theory/modes.js';
	import { canonicalChordLabel } from '$lib/theory/chords.js';
	import { playChord } from '$lib/audio/synth.js';
	import { NOTE_NAMES_DISPLAY as NOTE_NAMES } from '$lib/theory/noteNames.js';

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

	const targetTonic = $derived($modulationTarget?.tonicPc ?? 7);
	const targetMode  = $derived($modulationTarget?.modeName ?? 'ionian');

	const paths = $derived(
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
		const m: Record<BridgeType, typeof paths> = {
			pivot: [], secondaryDominant: [], directDominant: [], chromaticMediant: [],
		};
		paths.forEach(p => m[p.bridge.type].push(p));
		return m;
	});

	function activate() {
		modulationTarget.set({ tonicPc: targetTonic, modeName: targetMode });
	}

	function deactivate() {
		modulationTarget.set(null);
	}

	function loadPath(example: { pc: number; quality: string; label: string }[]) {
		const q = (s: string) => s as 'M' | 'm' | 'd' | '7';
		progression.set(example.map(c => ({
			pc: c.pc, quality: q(c.quality),
			id: Date.now() + Math.random(),
		})));
		selectedModulationPath.set(example.map(c => ({ pc: c.pc, quality: q(c.quality), label: c.label })));
	}
</script>

<div class="panel">
	<div class="panel-header">
		<h3 class="panel-title">Modulation Explorer</h3>
		{#if $modulationTarget}
			<button class="btn-clear" onclick={deactivate}>OFF</button>
		{/if}
	</div>

	<div class="target-row">
		<label class="control-group">
			<span class="control-label">Target tonic</span>
			<select
				value={targetTonic}
				onchange={(e) => {
					const pc = parseInt((e.target as HTMLSelectElement).value);
					modulationTarget.set({ tonicPc: pc, modeName: targetMode });
				}}
			>
				{#each Array.from({ length: 12 }, (_, i) => i) as pc}
					<option value={pc}>{NOTE_NAMES[pc]}</option>
				{/each}
			</select>
		</label>
		<label class="control-group">
			<span class="control-label">Mode</span>
			<select
				value={targetMode}
				onchange={(e) => {
					const m = (e.target as HTMLSelectElement).value as typeof targetMode;
					modulationTarget.set({ tonicPc: targetTonic, modeName: m });
				}}
			>
				{#each MODE_NAMES as key}
					<option value={key}>{MODES[key].label}</option>
				{/each}
			</select>
		</label>
		{#if !$modulationTarget}
			<button class="btn-activate" onclick={activate}>SHOW</button>
		{/if}
	</div>

	{#if $modulationTarget}
		{#if paths.length === 0}
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
								onclick={() => loadPath(path.example)}
								onkeydown={(e) => e.key === 'Enter' && loadPath(path.example)}
								title="Click to load into progression builder and highlight in graph"
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
										<button
											class="chord-chip"
											onclick={(e) => { e.stopPropagation(); playChord(step.pc, step.quality, $tonicPc, $modeName); }}
										>{step.label}</button>
										{#if i < path.example.length - 1}
											<span class="example-arr">→</span>
										{/if}
									{/each}
								</div>
							</div>
						{/each}
					</div>
				{/if}
			{/each}
		{/if}
		{#if multiStepPaths.length > 0}
			<div class="bridge-group">
				<div class="bridge-type-label" style:color="#a8c07a">
					Via intermediate key ({multiStepPaths.length})
				</div>
				{#each multiStepPaths as path}
					<div class="path-card multistep-card" role="button" tabindex="0"
						onclick={() => loadPath(path.example)}
						onkeydown={(e) => e.key === 'Enter' && loadPath(path.example)}
						title="Click to load into progression builder and highlight in graph"
					>
						<div class="bridge-header">
							<span class="bridge-chord multistep-via">via {path.via.label}</span>
						</div>
						<div class="example">
							{#each path.example as step, i}
								<span class="ms-chord">{step.label}</span>
								{#if i < path.example.length - 1}
									<span class="ms-arr">→</span>
								{/if}
							{/each}
						</div>
					</div>
				{/each}
			</div>
		{/if}
	{:else}
		<p class="empty">Pick a target key and click SHOW. Pivot chords will be highlighted in the circle.</p>
	{/if}
</div>

<style>
	.panel {
		background: linear-gradient(180deg, #16120f 0%, #13100e 100%);
		border: 1px solid #2a251f; border-radius: 6px; padding: 16px 18px;
	}
	.panel-header { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 12px; }
	.panel-title {
		font-family: 'Crimson Pro', serif; font-size: 0.7rem;
		text-transform: uppercase; letter-spacing: 0.2em;
		color: #d4a574; margin: 0; font-weight: 500;
	}
	.btn-clear, .btn-activate {
		background: transparent; border: 1px solid #3a342f; color: #9b948a;
		padding: 3px 10px; border-radius: 3px; font-size: 0.7rem; cursor: pointer;
		font-family: 'Outfit', sans-serif; letter-spacing: 0.05em;
	}
	.btn-activate { color: #d4a574; border-color: #5a4f3f; }
	.btn-activate:hover { background: #2a221a; }

	.target-row { display: flex; align-items: end; gap: 10px; margin-bottom: 14px; flex-wrap: wrap; }
	.control-group { display: flex; flex-direction: column; gap: 4px; }
	.control-label { color: #9b948a; letter-spacing: 0.1em; text-transform: uppercase; font-size: 0.65rem; }
	select {
		background: #13100e; border: 1px solid #3a342f; color: #e8e2d5;
		padding: 4px 6px; border-radius: 3px; font-size: 0.85rem; font-family: inherit;
	}

	.empty { font-size: 0.8rem; color: #7a736a; font-style: italic; font-family: 'Crimson Pro', serif; margin: 4px 0; }

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
