<script lang="ts">
	import { selectedChord, hoveredChord, tonicPc, modeName, progression } from '$lib/stores/session.js';
	import { variationLabel } from '$lib/theory/chords.js';
	import { VARIATIONS_FOR_QUALITY, type ChordVariation } from '$lib/theory/extensions.js';
	import { playChord } from '$lib/audio/synth.js';

	const focusChord = $derived($selectedChord ?? $hoveredChord);
	const groups = $derived(focusChord ? VARIATIONS_FOR_QUALITY[focusChord.quality] : []);

	function play(variation: ChordVariation) {
		if (!focusChord) return;
		playChord(focusChord.pc, focusChord.quality, $tonicPc, $modeName, '2n', variation);
	}

	function addToProgression(variation: ChordVariation) {
		if (!focusChord) return;
		progression.update(p => [...p, {
			pc: focusChord.pc,
			quality: focusChord.quality,
			variation,
			id: Date.now() + Math.random(),
		}]);
		play(variation);
	}
</script>

{#if focusChord && groups.length > 0}
	<div class="variations">
		<div class="vh-row">
			<span class="vh-label">Variations</span>
			<span class="vh-hint">click = play, double-click = add to progression</span>
		</div>
		{#each groups as group}
			{#if group.variations.length > 0}
				<div class="group">
					<span class="group-label">{group.group}</span>
					<div class="chips">
						{#each group.variations as v}
							<button
								class="var-chip"
								onclick={() => play(v)}
								ondblclick={() => addToProgression(v)}
								title="Click to preview · double-click to add"
							>{variationLabel(focusChord.pc, v)}</button>
						{/each}
					</div>
				</div>
			{/if}
		{/each}
	</div>
{/if}

<style>
	.variations { margin-top: 14px; padding-top: 12px; border-top: 1px solid #2a251f; }
	.vh-row { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 8px; }
	.vh-label {
		font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.15em; color: #9b948a;
	}
	.vh-hint { font-size: 0.65rem; color: #5c5650; font-style: italic; font-family: 'Crimson Pro', serif; }

	.group { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
	.group-label {
		font-size: 0.65rem; color: #7a736a; min-width: 78px;
		font-family: 'Outfit', sans-serif; letter-spacing: 0.05em;
	}
	.chips { display: flex; gap: 4px; flex-wrap: wrap; }
	.var-chip {
		background: #1a1612; border: 1px solid #3a342f; color: #e8e2d5;
		padding: 3px 8px; border-radius: 3px; font-size: 0.78rem;
		font-family: 'Outfit', sans-serif; cursor: pointer;
	}
	.var-chip:hover { background: #2a221a; border-color: #d4a574; color: #f4ead7; }
</style>
