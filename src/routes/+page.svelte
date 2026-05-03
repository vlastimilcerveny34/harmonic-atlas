<script lang="ts">
	import CircleGraph from '$lib/components/CircleGraph.svelte';
	import LensControls from '$lib/components/LensControls.svelte';
	import ChordInfo from '$lib/components/ChordInfo.svelte';
	import ProgressionBuilder from '$lib/components/ProgressionBuilder.svelte';
	import ModulationExplorer from '$lib/components/ModulationExplorer.svelte';
	import PresetLibrary from '$lib/components/PresetLibrary.svelte';
	import { tonicPc, modeName, diatonicSet, selectedChord, hoveredChord } from '$lib/stores/session.js';
	import { canonicalChordLabel } from '$lib/theory/chords.js';
	import { MODES, MODE_NAMES } from '$lib/theory/modes.js';
	import { audioReady, audioLoading } from '$lib/audio/synth.js';

	const NOTE_NAMES = ['C','C#/Db','D','D#/Eb','E','F','F#/Gb','G','G#/Ab','A','A#/Bb','B'];

	let circleGraph: { arrows: () => ReturnType<typeof import('$lib/theory/relationships.js').outgoingRelationships> } | undefined;

	const arrows = $derived(circleGraph?.arrows() ?? []);
	const focusChord = $derived($selectedChord ?? $hoveredChord);
</script>

<div class="page">
	<div class="content">

		<header class="header">
			<div>
				<h1 class="title">
					Harmonic Atlas
					<span class="version">v1.0 · beta</span>
				</h1>
				<p class="subtitle">Click any chord to see where it can lead</p>
			</div>
			<div class="controls">
				<label class="control-group">
					<span class="control-label">Tonic</span>
					<select value={$tonicPc} onchange={(e) => tonicPc.set(parseInt((e.target as HTMLSelectElement).value))}>
						{#each Array.from({ length: 12 }, (_, i) => i) as pc}
							<option value={pc}>{NOTE_NAMES[pc]}</option>
						{/each}
					</select>
				</label>
				<label class="control-group">
					<span class="control-label">Mode</span>
					<select value={$modeName} onchange={(e) => modeName.set((e.target as HTMLSelectElement).value as typeof $modeName)}>
						{#each MODE_NAMES as key}
							<option value={key}>{MODES[key].label}</option>
						{/each}
					</select>
				</label>
			</div>
		</header>

		<div class="main-grid">
			<div class="graph-col">
				<CircleGraph bind:this={circleGraph} />
			</div>

			<aside class="sidebar">
				<LensControls />

				<div class="panel">
					<ChordInfo {arrows} />
				</div>

				<ModulationExplorer />

				<PresetLibrary />
			</aside>
		</div>

		<footer class="footer">
			<span>
				{#if $audioLoading}
					◌ loading piano samples…
				{:else if $audioReady}
					◉ audio ready
				{:else}
					◌ click any chord to enable audio
				{/if}
			</span>
			<span class="footer-key">
				{canonicalChordLabel($diatonicSet[0].pc, $diatonicSet[0].quality)}
				{MODES[$modeName].label}
				· diatonic: {$diatonicSet.map(d => canonicalChordLabel(d.pc, d.quality)).join(' — ')}
			</span>
		</footer>
	</div>
</div>

<ProgressionBuilder />

<style>
	.page { width: 100%; min-height: 100vh; }
	.content { max-width: 1280px; margin: 0 auto; padding: 32px 24px 96px; }

	.header {
		display: flex; align-items: baseline; justify-content: space-between;
		margin-bottom: 24px; padding-bottom: 20px; border-bottom: 1px solid #2a251f;
	}
	.title {
		font-family: 'Crimson Pro', serif; font-weight: 500;
		font-size: 2.4rem; letter-spacing: -0.01em; line-height: 1; color: #f4ead7;
	}
	.version {
		font-size: 0.7rem; margin-left: 12px; color: #9b948a;
		letter-spacing: 0.15em; text-transform: uppercase; vertical-align: middle;
	}
	.subtitle {
		font-family: 'Crimson Pro', serif; font-style: italic;
		color: #9b948a; font-size: 1rem; margin-top: 4px;
	}
	.controls { display: flex; align-items: center; gap: 16px; }
	.control-group { display: flex; align-items: center; gap: 8px; }
	.control-label {
		color: #9b948a; letter-spacing: 0.1em; text-transform: uppercase; font-size: 0.7rem;
	}

	.main-grid {
		display: grid; grid-template-columns: 1fr 340px; gap: 24px; align-items: start;
	}
	.graph-col { display: flex; justify-content: center; }
	.sidebar { display: flex; flex-direction: column; gap: 20px; }

	.panel {
		background: linear-gradient(180deg, #16120f 0%, #13100e 100%);
		border: 1px solid #2a251f; border-radius: 6px; padding: 16px 18px;
	}
	.footer {
		margin-top: 32px; padding-top: 16px; border-top: 1px solid #2a251f;
		font-family: 'JetBrains Mono', monospace; font-size: 0.75rem; color: #5c5650;
		display: flex; gap: 16px; flex-wrap: wrap;
	}
	.footer-key { color: #7a736a; }

	@media (max-width: 900px) {
		.main-grid { grid-template-columns: 1fr; }
		.header { flex-direction: column; gap: 16px; align-items: flex-start; }
	}
</style>
