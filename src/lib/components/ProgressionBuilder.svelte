<script lang="ts">
	import { progression, diatonicSet, tonicPc, modeName, selectedModulationPath } from '$lib/stores/session.js';
	import { canonicalChordLabel, getRoman, variationLabel } from '$lib/theory/chords.js';
	import { playChord, playProgression } from '$lib/audio/synth.js';
	import { downloadMidi } from '$lib/audio/midi.js';
	import { autoDecorate, stripDecorations, isDecorated } from '$lib/theory/autoDecorate.js';

	const QUALITY_COLOR: Record<string, string> = {
		M: '#e08f9a', m: '#7aa9c9', d: '#b888c4', '7': '#d4a44a',
	};

	function exportMidi() {
		downloadMidi($progression, 'progression.mid', 100);
	}

	function toggleColor() {
		progression.update(p =>
			isDecorated(p) ? stripDecorations(p) : autoDecorate(p)
		);
	}
</script>

<div class="prog-section">
	<div class="prog-row">
		<span class="prog-label">Progression</span>
		<span class="hint">double-click any chord to add</span>

		<div class="prog-strip">
			{#if $progression.length === 0}
				<span class="empty">Empty — start clicking chords on the circle.</span>
			{:else}
				{#each $progression as chord, i (chord.id)}
					{@const roman = getRoman(chord.pc, chord.quality, $diatonicSet)}
					<div class="prog-item" style:animation="fadeIn 0.3s ease-out">
						<button
							class="chord-chip"
							style:background={QUALITY_COLOR[chord.quality]}
							onclick={() => playChord(chord.pc, chord.quality, $tonicPc, $modeName, '2n', chord.variation)}
						>
							<span class="chip-name">{chord.variation ? variationLabel(chord.pc, chord.variation) : canonicalChordLabel(chord.pc, chord.quality)}</span>
							{#if roman}<span class="chip-roman">{roman}</span>{/if}
						</button>
						{#if i < $progression.length - 1}
							<span class="arrow">→</span>
						{/if}
					</div>
				{/each}
			{/if}
		</div>

		<div class="prog-actions">
			<button
				class="btn-play"
				disabled={$progression.length === 0}
				onclick={() => playProgression($progression, $tonicPc, $modeName)}
			>▶ PLAY</button>
			<button
				class="btn-color"
				disabled={$progression.length === 0}
				onclick={toggleColor}
				class:active={isDecorated($progression)}
				title="Auto-decorate with extended chords (maj7, m7, etc.) for richer sound"
			>+ COLOR</button>
			<button
				class="btn-export"
				disabled={$progression.length === 0}
				onclick={exportMidi}
				title="Export progression as MIDI file"
			>↓ MIDI</button>
			<button
				class="btn-clear"
				disabled={$progression.length === 0}
				onclick={() => { progression.set([]); selectedModulationPath.set(null); }}
			>CLEAR</button>
		</div>
	</div>
</div>

<style>
	@keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }

	.prog-section {
		position: fixed; bottom: 0; left: 0; right: 0; z-index: 100;
		background: var(--surface-1);
		border-top: 1px solid var(--border-1);
		padding: 10px 24px;
	}
	.prog-row {
		display: flex; align-items: center; gap: 12px; flex-wrap: wrap;
	}
	.prog-label {
		font-family: 'Crimson Pro', serif; font-size: 1.1rem;
		color: var(--text-0); font-weight: 500;
	}
	.hint {
		font-size: 0.7rem; color: var(--text-4); font-family: 'Outfit', sans-serif;
		text-transform: uppercase; letter-spacing: 0.1em;
	}
	.prog-strip {
		flex: 1 1 auto; min-width: 240px;
		display: flex; flex-wrap: wrap; gap: 6px;
		padding: 6px 10px; min-height: 40px;
		border-radius: 4px; background: var(--surface-2); border: 1px solid var(--border-1);
		align-items: center;
	}
	.empty { color: var(--text-5); font-style: italic; font-family: 'Crimson Pro', serif; font-size: 0.85rem; }
	.prog-item { display: flex; align-items: center; gap: 4px; }
	.chord-chip {
		background: transparent; border: none; cursor: pointer;
		display: flex; flex-direction: column; align-items: center;
		padding: 4px 10px; border-radius: 3px; min-width: 44px;
		transition: filter 0.15s;
	}
	.chord-chip:hover { filter: brightness(1.15); }
	.chip-name { font-weight: 500; font-size: 0.9rem; color: var(--on-chip); }
	.chip-roman { font-size: 0.6rem; opacity: 0.7; font-family: 'Crimson Pro', serif; font-style: italic; color: var(--on-chip); }
	.arrow { color: var(--text-5); font-size: 0.75rem; }

	.prog-actions { display: flex; gap: 6px; }
	.btn-play, .btn-export, .btn-clear {
		border: 1px solid var(--border-3); padding: 5px 12px; border-radius: 3px;
		font-size: 0.75rem; letter-spacing: 0.05em; cursor: pointer;
		font-family: 'Outfit', sans-serif;
	}
	.btn-play { border: none; font-weight: 500; background: var(--accent); color: var(--on-accent); }
	.btn-play:disabled { background: var(--border-3); color: var(--text-4); opacity: 1; cursor: not-allowed; }
	.btn-export { background: transparent; color: var(--accent); }
	.btn-export:hover:not(:disabled) { background: var(--surface-5); }
	.btn-color { background: transparent; color: var(--btn-color-text); border-color: var(--btn-color-border); }
	.btn-color:hover:not(:disabled) { background: var(--surface-green-1); }
	.btn-color.active { background: var(--btn-color-bg-active); color: var(--btn-color-text-active); border-color: var(--btn-color-border-active); }
	.btn-clear { background: transparent; color: var(--text-3); }
	.btn-clear:hover:not(:disabled) { background: var(--surface-4); }
	.btn-export:disabled, .btn-clear:disabled { opacity: 0.4; cursor: not-allowed; }
</style>
