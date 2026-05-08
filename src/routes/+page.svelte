<script lang="ts">
	import CircleGraph from '$lib/components/CircleGraph.svelte';
	import LensControls from '$lib/components/LensControls.svelte';
	import ChordInfo from '$lib/components/ChordInfo.svelte';
	import ProgressionBuilder from '$lib/components/ProgressionBuilder.svelte';
	import Bridge from '$lib/components/Bridge.svelte';
	import PresetLibrary from '$lib/components/PresetLibrary.svelte';
	import { tonicPc, modeName, diatonicSet, selectedChord, hoveredChord } from '$lib/stores/session.js';
	import { canonicalChordLabel } from '$lib/theory/chords.js';
	import { MODES, MODE_NAMES } from '$lib/theory/modes.js';
	import { audioReady, audioLoading } from '$lib/audio/synth.js';
	import HelpModal from '$lib/components/HelpModal.svelte';
	import { NOTE_NAMES_DISPLAY as NOTE_NAMES } from '$lib/theory/noteNames.js';
	import { theme } from '$lib/stores/session.js';

	let showHelp = $state(false);

	let circleGraph: { arrows: () => ReturnType<typeof import('$lib/theory/relationships.js').outgoingRelationships> } | undefined;

	const arrows = $derived(circleGraph?.arrows() ?? []);
	const focusChord = $derived($selectedChord ?? $hoveredChord);
</script>

<div class="page">
	<div class="content">

		<header class="header">
			<div class="header-top">
				<img src="/logo.png" alt="Harmony Mapper" class="logo" />
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
					<span class="version">v1.3 · beta</span>
				</div>
			</div>
			<p class="subtitle">Click any chord to see where it can lead &nbsp;&nbsp;&nbsp;<button class="btn-help" onclick={() => showHelp = true} title="How to use">?</button> <button class="btn-help btn-theme" onclick={() => theme.toggle()} title="{$theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}">{$theme === 'dark' ? '☀' : '◑'}</button></p>
		</header>

		<div class="main-grid">
			<div class="graph-col">
				<CircleGraph bind:this={circleGraph} />
			</div>

			<aside class="sidebar">
				<LensControls />

				<ChordInfo {arrows} />

				<Bridge />

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
				<span class="footer-copy">
					© 2026 <a href="mailto:vlastimilcerveny34@gmail.com" class="footer-link">Vlastimil Červený</a>
				</span>
			</footer>
	</div>
</div>

<ProgressionBuilder />
<HelpModal bind:open={showHelp} />

<style>
	.page { width: 100%; min-height: 100vh; }
	.content { max-width: 1280px; margin: 0 auto; padding: 0 24px 96px; }

	.header {
		display: flex; flex-direction: column; gap: 0;
		margin-bottom: 4px; padding-bottom: 0;
	}
	.header-top { display: flex; align-items: center; justify-content: space-between; }
	.logo { height: 102px; width: auto; display: block; margin-left: 3px; margin-bottom: -5px; }
	:global([data-theme="dark"]) .logo { filter: brightness(0) invert(1); }
	.version {
		font-size: 0.75rem; color: var(--text-3);
		letter-spacing: 0.12em; text-transform: uppercase;
	}
	.subtitle {
		font-family: 'Crimson Pro', serif; font-style: italic;
		color: var(--text-3); font-size: 1rem;
	}
	.controls { display: flex; align-items: center; gap: 16px; margin-left: auto; padding-left: 24px; }
	.control-group { display: flex; align-items: center; gap: 8px; }
	.control-label {
		color: var(--text-3); letter-spacing: 0.1em; text-transform: uppercase; font-size: 0.7rem;
	}

	.main-grid {
		display: grid; grid-template-columns: 1fr 340px; gap: 24px; align-items: start;
	}
	.graph-col { display: flex; justify-content: center; }
	.sidebar { display: flex; flex-direction: column; gap: 20px; }

	.panel {
		background: linear-gradient(180deg, var(--surface-3) 0%, var(--surface-2) 100%);
		border: 1px solid var(--border-1); border-radius: 6px; padding: 16px 18px;
	}
	.footer {
		margin-top: 32px; padding-top: 16px; border-top: 1px solid var(--border-1);
		font-family: 'JetBrains Mono', monospace; font-size: 0.75rem; color: var(--text-5);
		display: flex; gap: 16px; flex-wrap: wrap;
	}
	.footer-key { color: var(--text-4); }
	.footer-copy { margin-left: auto; color: var(--text-5); }
	.footer-link { color: var(--text-4); text-decoration: none; }
	.footer-link:hover { color: var(--accent); }
	.btn-help {
		width: 28px; height: 28px; border-radius: 50%;
		background: transparent; border: 1px solid var(--border-3);
		color: var(--text-3); font-size: 0.85rem; cursor: pointer;
		font-family: 'Outfit', sans-serif; line-height: 1;
	}
	.btn-help:hover { border-color: var(--accent); color: var(--accent); }
	.btn-theme { font-size: 1rem; }

	@media (max-width: 900px) {
		.main-grid { grid-template-columns: 1fr; }
	}

	@media (max-width: 600px) {
		.header { margin-top: -12px; }
		.header-top { align-items: flex-start; }
		.logo { height: 70px; margin-left: 3px; margin-bottom: -4px; }
		.controls { gap: 10px; flex-wrap: wrap; padding-left: 53px; }
		.content { padding: 0 8px 96px; }
		.graph-col { margin: 0 -8px; }
	}
</style>
