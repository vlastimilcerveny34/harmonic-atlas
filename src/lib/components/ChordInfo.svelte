<script lang="ts">
	import { selectedChord, hoveredChord, diatonicSet, showVoiceLeading } from '$lib/stores/session.js';
	import { canonicalChordLabel, isDiatonic, getRoman, chordPitches } from '$lib/theory/chords.js';
	import { tonicPc, modeName } from '$lib/stores/session.js'; // needed for chordPitches (audio)
	import { voiceLeading } from '$lib/theory/voiceLeading.js';
	import type { Relationship } from '$lib/theory/relationships.js';

	const QUALITY_COLOR: Record<string, string> = {
		M: '#e08f9a', m: '#7aa9c9', d: '#b888c4', '7': '#d4a44a',
	};
	const QUALITY_LABEL: Record<string, string> = {
		M: 'major', m: 'minor', d: 'diminished', '7': 'dominant 7',
	};
	const REL_LABELS: Record<string, { color: string; label: string }> = {
		dominant:          { color: '#d4a574', label: 'Dominant resolution' },
		tritoneSub:        { color: '#d97a8e', label: 'Tritone substitution' },
		diatonic:          { color: '#7aa9c9', label: 'Diatonic motion' },
		modalInterchange:  { color: '#8eaf6e', label: 'Modal interchange' },
		chromaticMediant:  { color: '#b888c4', label: 'Chromatic mediant' },
		secondaryDominant: { color: '#e8956d', label: 'Secondary dominant' },
	};

	let { arrows }: { arrows: Relationship[] } = $props();

	const focusChord = $derived($selectedChord ?? $hoveredChord);
	const hasSelection = $derived(!!$selectedChord);

	const label    = $derived(focusChord ? canonicalChordLabel(focusChord.pc, focusChord.quality) : '');
	const roman    = $derived(focusChord ? getRoman(focusChord.pc, focusChord.quality, $diatonicSet) : null);
	const inKey    = $derived(focusChord ? isDiatonic(focusChord.pc, focusChord.quality, $diatonicSet) : false);
	const notes    = $derived(focusChord
		? chordPitches(focusChord.pc, focusChord.quality, $tonicPc, $modeName, 4)
			.map(n => n.replace(/\d/, '')).join(' · ')
		: '');

	const grouped = $derived(() => {
		const m: Record<string, Relationship[]> = {};
		arrows.forEach(a => {
			if (!m[a.type]) m[a.type] = [];
			m[a.type].push(a);
		});
		return m;
	});
</script>

{#if focusChord}
	<div class="chord-info">
		<div class="header">
			<div class="name-row">
				<span class="chord-name" style:color={QUALITY_COLOR[focusChord.quality]}>{label}</span>
				{#if roman}<span class="roman">{roman}</span>{/if}
			</div>
			{#if hasSelection}
				<button class="clear-btn" onclick={() => selectedChord.set(null)}>CLEAR</button>
			{/if}
		</div>

		<div class="quality-line">
			{QUALITY_LABEL[focusChord.quality]}
			{inKey ? '· diatonic' : '· non-diatonic'}
		</div>

		<div class="notes">{notes}</div>

		{#if arrows.length > 0}
			<div class="outgoing-header">
				Outgoing ({arrows.length})
				<button
					class="vl-toggle"
					title="Toggle voice leading info"
					onclick={() => showVoiceLeading.update(v => !v)}
					style:color={$showVoiceLeading ? '#d4a574' : '#7a736a'}
				>VL</button>
			</div>
			<div class="outgoing-list">
				{#each Object.entries(grouped()) as [type, list]}
					<div class="rel-group">
						<div class="rel-type-label" style:color={REL_LABELS[type]?.color}>
							{REL_LABELS[type]?.label}
						</div>
						{#each list as arrow}
							{@const vl = $showVoiceLeading
								? voiceLeading(arrow.from.pc, arrow.from.quality, arrow.to.pc, arrow.to.quality)
								: null}
							<div class="rel-row">
								<span class="rel-chord">{canonicalChordLabel(arrow.to.pc, arrow.to.quality)}</span>
								<span class="rel-label">{arrow.label}</span>
								{#if vl}
									<span class="vl-info" title="Common tones · total half-step movement">
										<span class="vl-common">{vl.commonTones.length}♢</span>
										<span class="vl-dist">{vl.totalDistance}½</span>
									</span>
								{/if}
							</div>
						{/each}
					</div>
				{/each}
			</div>
		{:else}
			<p class="no-rels">No outgoing relationships under current lenses. Try enabling more lenses.</p>
		{/if}
	</div>
{:else}
	<p class="empty">Click any chord to fix it as the source. Outgoing arrows will fan out to all reachable next chords.</p>
{/if}

<style>
	.chord-info { animation: fadeIn 0.3s ease-out; }
	@keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }

	.header { display: flex; align-items: baseline; justify-content: space-between; margin-bottom: 6px; }
	.name-row { display: flex; align-items: baseline; gap: 10px; }
	.chord-name { font-family: 'Crimson Pro', serif; font-size: 2rem; font-weight: 500; line-height: 1; }
	.roman { font-family: 'Crimson Pro', serif; font-style: italic; font-size: 1.3rem; color: #d4a574; }
	.clear-btn {
		background: transparent; border: 1px solid #3a342f; color: #9b948a;
		padding: 3px 8px; border-radius: 3px; font-size: 0.7rem; cursor: pointer;
		font-family: 'Outfit', sans-serif;
	}
	.quality-line { font-size: 0.8rem; color: #9b948a; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 8px; }
	.notes { font-family: 'JetBrains Mono', monospace; font-size: 0.85rem; color: #c8c1b5; margin-bottom: 12px; }
	.outgoing-header {
		font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.15em;
		color: #9b948a; margin-bottom: 8px; display: flex; justify-content: space-between; align-items: center;
	}
	.vl-toggle {
		background: transparent; border: 1px solid #3a342f; padding: 2px 6px;
		border-radius: 3px; font-size: 0.65rem; cursor: pointer;
		font-family: 'Outfit', sans-serif; letter-spacing: 0.1em;
	}
	.vl-info { margin-left: auto; display: flex; gap: 6px; font-family: 'JetBrains Mono', monospace; font-size: 0.7rem; }
	.vl-common { color: #8eaf6e; }
	.vl-dist { color: #d4a574; }
	.outgoing-list { max-height: 220px; overflow-y: auto; padding-right: 4px; }
	.rel-group { margin-bottom: 8px; }
	.rel-type-label { font-size: 0.7rem; letter-spacing: 0.05em; margin-bottom: 3px; }
	.rel-row { display: flex; align-items: center; gap: 8px; padding: 2px 0 2px 8px; }
	.rel-chord { font-size: 0.85rem; color: #e8e2d5; font-weight: 500; min-width: 44px; }
	.rel-label { font-family: 'Crimson Pro', serif; font-style: italic; font-size: 0.78rem; color: #9b948a; }
	.no-rels { font-size: 0.8rem; color: #7a736a; font-style: italic; font-family: 'Crimson Pro', serif; margin-top: 8px; }
	.empty { color: #7a736a; font-style: italic; font-family: 'Crimson Pro', serif; font-size: 0.9rem; margin: 0; }
</style>
