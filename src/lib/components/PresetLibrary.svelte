<script lang="ts">
	import { tonicPc, modeName, progression, selectedModulationPath } from '$lib/stores/session.js';
	import { PRESETS, applyPreset, type PresetCategory } from '$lib/theory/presets.js';
	import { canonicalChordLabel } from '$lib/theory/chords.js';
	import { playChord } from '$lib/audio/synth.js';

	const CATEGORY_LABELS: Record<PresetCategory, string> = {
		pop:        'Pop / Rock / J-pop',
		cadence:    'Cadences',
		cycle:      'Cycles',
		reharm:     'Reharmonization',
		modulation: 'Modulation',
	};

	const CATEGORY_ORDER: PresetCategory[] = ['pop', 'cadence', 'cycle', 'reharm', 'modulation'];

	let selectedId = $state<string>(PRESETS.find(p => p.category === 'pop')?.id ?? PRESETS[0].id);

	const preset = $derived(PRESETS.find(p => p.id === selectedId)!);

	const appliedSteps = $derived.by(() => {
		const steps = applyPreset(preset, $tonicPc);
		return steps.map(s => ({
			pc: s.pc,
			quality: s.quality,
			label: canonicalChordLabel(s.pc, s.quality),
			roman: s.roman,
		}));
	});

	function loadPreset() {
		const steps = appliedSteps;
		progression.set(steps.map(s => ({
			pc: s.pc, quality: s.quality,
			id: Date.now() + Math.random(),
		})));
		selectedModulationPath.set(steps.map(s => ({
			pc: s.pc, quality: s.quality, label: s.label,
		})));
	}
</script>

<div class="panel">
	<h3 class="panel-title">Preset Library</h3>

	<select class="preset-select" bind:value={selectedId}>
		{#each CATEGORY_ORDER as cat}
			{@const list = PRESETS.filter(p => p.category === cat)}
			{#if list.length > 0}
				<optgroup label={CATEGORY_LABELS[cat]}>
					{#each list as p}
						<option value={p.id}>{p.name}</option>
					{/each}
				</optgroup>
			{/if}
		{/each}
	</select>

	<div class="path-card" role="button" tabindex="0"
		onclick={loadPreset}
		onkeydown={(e) => e.key === 'Enter' && loadPreset()}
		title="Click to load into progression builder and highlight in graph"
	>
		<div class="preset-desc">{preset.description}</div>
		<div class="example">
			{#each appliedSteps as step, i}
				<button
					class="chord-chip"
					onclick={(e) => { e.stopPropagation(); playChord(step.pc, step.quality, $tonicPc, $modeName); }}
				>{step.label}</button>
				{#if i < appliedSteps.length - 1}
					<span class="example-arr">→</span>
				{/if}
			{/each}
		</div>
		{#if preset.hint}
			<p class="hint">{preset.hint}</p>
		{/if}
	</div>
</div>

<style>
	.panel {
		background: linear-gradient(180deg, #16120f 0%, #13100e 100%);
		border: 1px solid #2a251f; border-radius: 6px; padding: 16px 18px;
	}
	.panel-title {
		font-family: 'Crimson Pro', serif; font-size: 0.7rem;
		text-transform: uppercase; letter-spacing: 0.2em;
		color: #d4a574; margin: 0 0 10px; font-weight: 500;
	}

	.preset-select {
		width: 100%; background: #13100e; border: 1px solid #3a342f;
		color: #e8e2d5; padding: 5px 8px; border-radius: 3px;
		font-size: 0.85rem; font-family: inherit; margin-bottom: 10px; cursor: pointer;
	}
	.preset-select:focus { outline: 1px solid #d4a574; }

	.path-card {
		background: #0f0d0b; border: 1px solid #26211c; border-radius: 4px;
		padding: 10px 12px; cursor: pointer;
	}
	.path-card:hover { background: #161210; border-color: #3a342f; }

	.preset-desc {
		font-family: 'Crimson Pro', serif; font-style: italic;
		font-size: 0.8rem; color: #9b948a; margin-bottom: 8px;
	}
	.example { display: flex; align-items: center; gap: 4px; flex-wrap: wrap; }
	.chord-chip {
		background: #1a1612; border: 1px solid #3a342f; color: #e8e2d5;
		padding: 3px 8px; border-radius: 3px; cursor: pointer; font-size: 0.8rem;
		font-family: 'Outfit', sans-serif;
	}
	.chord-chip:hover { background: #2a221a; }
	.example-arr { color: #5c5650; }
	.hint {
		font-size: 0.75rem; color: #7a736a; font-style: italic;
		font-family: 'Crimson Pro', serif; margin: 8px 0 0; line-height: 1.4;
	}
</style>
