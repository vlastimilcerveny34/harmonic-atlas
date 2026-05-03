<script lang="ts">
	import { lenses } from '$lib/stores/session.js';

	const REL_COLORS = {
		diatonic:          '#7aa9c9',
		dominant:          '#d4a574',
		tritoneSub:        '#d97a8e',
		modalInterchange:  '#8eaf6e',
		chromaticMediant:  '#b888c4',
		secondaryDominant: '#e8956d',
	};

	const LENS_DEFS = [
		{ key: 'diatonic',          label: 'Diatonic motion',         desc: 'Functional moves within the key' },
		{ key: 'dominant',          label: 'Dominant resolution',     desc: 'V7 → I (and V → i)' },
		{ key: 'secondaryDominant', label: 'Secondary dominants',     desc: 'V7/ii, V7/iii, V7/IV… → diatonic chord' },
		{ key: 'tritoneSub',        label: 'Tritone substitution',    desc: 'Dom7 ↔ dom7 a tritone away' },
		{ key: 'modalInterchange',  label: 'Modal interchange',       desc: 'Borrowed from parallel mode' },
		{ key: 'chromaticMediant',  label: 'Chromatic mediant',       desc: 'Same-quality chords ±M3/±m3' },
	] as const;
</script>

<div class="panel">
	<h3 class="panel-title">Lenses</h3>
	<div class="lens-list">
		{#each LENS_DEFS as def}
			{@const color = REL_COLORS[def.key]}
			{@const checked = $lenses[def.key]}
			<button
				class="toggle-row"
				onclick={() => lenses.update(s => ({ ...s, [def.key]: !s[def.key] }))}
			>
				<div class="toggle-track" style:background={checked ? color : '#3a342f'}>
					<div class="toggle-thumb" style:left={checked ? '16px' : '2px'}></div>
				</div>
				<div class="toggle-label">
					<span class="dot" style:background={color}></span>
					<span class="label-text">{def.label}</span>
					<span class="desc">{def.desc}</span>
				</div>
			</button>
		{/each}
	</div>
</div>

<style>
	.panel {
		background: linear-gradient(180deg, #16120f 0%, #13100e 100%);
		border: 1px solid #2a251f;
		border-radius: 6px;
		padding: 16px 18px;
	}
	.panel-title {
		font-family: 'Crimson Pro', serif;
		font-size: 0.7rem;
		text-transform: uppercase;
		letter-spacing: 0.2em;
		color: #d4a574;
		margin: 0 0 12px;
		font-weight: 500;
	}
	.lens-list { display: flex; flex-direction: column; gap: 12px; }
	.toggle-row {
		display: flex; align-items: flex-start; gap: 10px;
		background: none; border: none; cursor: pointer; padding: 0; text-align: left;
	}
	.toggle-track {
		width: 32px; height: 18px; border-radius: 9px;
		position: relative; flex-shrink: 0; margin-top: 2px;
		transition: background 0.2s;
	}
	.toggle-thumb {
		width: 14px; height: 14px; border-radius: 50%;
		background: #0a0807; position: absolute; top: 2px;
		transition: left 0.2s;
	}
	.toggle-label { display: flex; flex-direction: column; gap: 2px; }
	.dot {
		display: inline-block; width: 8px; height: 8px;
		border-radius: 50%; margin-right: 6px; vertical-align: middle;
	}
	.label-text { font-size: 0.9rem; color: #e8e2d5; }
	.desc {
		font-size: 0.75rem; color: #7a736a;
		font-family: 'Crimson Pro', serif; font-style: italic;
	}
</style>
