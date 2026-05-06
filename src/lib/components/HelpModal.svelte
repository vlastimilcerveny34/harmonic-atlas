<script lang="ts">
	let { open = $bindable(false) }: { open: boolean } = $props();

	let modalEl: HTMLDivElement | undefined = $state();
	let closeBtn: HTMLButtonElement | undefined = $state();

	$effect(() => {
		if (!open) return;
		// Move focus into modal so screen readers announce it and Escape works
		closeBtn?.focus();

		const onKey = (e: KeyboardEvent) => {
			if (e.key === 'Escape') open = false;
			if (e.key === 'Tab' && modalEl) {
				// Simple focus trap — keep tab within the modal
				const focusables = modalEl.querySelectorAll<HTMLElement>('button, a[href]');
				if (focusables.length === 0) return;
				const first = focusables[0];
				const last  = focusables[focusables.length - 1];
				if (e.shiftKey && document.activeElement === first) {
					e.preventDefault(); last.focus();
				} else if (!e.shiftKey && document.activeElement === last) {
					e.preventDefault(); first.focus();
				}
			}
		};
		window.addEventListener('keydown', onKey);
		return () => window.removeEventListener('keydown', onKey);
	});
</script>

{#if open}
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="overlay" onclick={() => open = false}>
		<div class="modal" bind:this={modalEl} onclick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="How to use Harmony Mapper">
			<button class="close-btn" bind:this={closeBtn} onclick={() => open = false}>✕</button>
			<h2 class="modal-title">How to use Harmony Mapper</h2>

			<div class="sections">
				<section>
					<h3>The Circle</h3>
					<p>The circle of fifths shows 36 chords across three rings — <span class="hl-min">minor</span> (outer), <span class="hl-maj">major</span> (middle), and <span class="hl-dom">dominant 7th</span> (inner). Chords that belong to the current key are shown brighter.</p>
				</section>

				<section>
					<h3>Selecting chords</h3>
					<p><strong>Click</strong> any chord to select it and hear it. Arrows fan out to show all chords you can move to next. <strong>Double-click</strong> to add the chord to your progression.</p>
				</section>

				<section>
					<h3>Lenses</h3>
					<p>Lenses filter which relationships are shown as arrows:</p>
					<ul>
						<li><strong>Diatonic</strong> — standard movement within the key. <em>Mode-aware:</em> moves are tailored per mode (e.g. in Mixolydian, ♭VII→I is preferred; in Phrygian, ♭II→i is the typical resolution).</li>
						<li><strong>Dominant</strong> — V7 resolving to tonic</li>
						<li><strong>Secondary dominant</strong> — V7 of any diatonic chord</li>
						<li><strong>Tritone sub</strong> — dominant substitution a tritone away (♭II7)</li>
						<li><strong>Modal interchange</strong> — chords borrowed from the parallel mode (e.g. ♭III, ♭VI, ♭VII from parallel minor)</li>
						<li><strong>Chromatic mediant</strong> — same-quality chords a third away</li>
						<li><strong>Modal cadence</strong> <span style="color:#c4a04a">●</span> — the <em>defining</em> cadence of the current mode, highlighted as a separate arrow type. Examples: ♭VII→I (Mixolydian), ♭II→i (Phrygian), II→I (Lydian), ♭VII→i + iv→i (Aeolian/Dorian). Use this to learn what makes each mode sound like itself.</li>
					</ul>
				</section>

				<section>
					<h3>Tonic &amp; Mode</h3>
					<p>Use the dropdowns in the top right to set the key and mode. The circle updates instantly — diatonic chords light up for the selected key. The mode controls which 7-chord set counts as diatonic <em>and</em> which functional moves the Diatonic lens highlights (each of the 7 modes has its own move-strength table). Modulation and borrowing are computed against the parallel mode.</p>
					<p class="hint-tip">Tip: in modal keys, the tonic chord may be minor — in C Phrygian for example, the tonic chord is <strong>Cm</strong> (sitting on the outer ring of the E♭ spoke), not C major. Look for the lit minor nodes on the outer ring.</p>
				</section>

				<section>
					<h3>Chord variations</h3>
					<p>When a chord is selected, the <strong>Variations</strong> panel offers extended versions: <em>maj7, m7, 6, add9, sus4</em> and similar. Click to preview the sound, double-click to add that exact variation to the progression.</p>
				</section>

				<section>
					<h3>Progression Builder</h3>
					<p>Double-click chords to build a progression in the bar at the bottom. Click any chord chip to hear it.</p>
					<ul>
						<li><strong>▶ PLAY</strong> — hear the whole sequence</li>
						<li><strong>+ COLOR</strong> — auto-decorate with extended variations (maj7/m7/9 etc.) for a richer voice leading. Click again to revert to plain triads.</li>
						<li><strong>↓ MIDI</strong> — export the progression as a MIDI file</li>
						<li><strong>CLEAR</strong> — empty the progression</li>
					</ul>
				</section>

				<section>
					<h3>Bridge — connect keys or chords</h3>
					<p>The Bridge panel has two modes:</p>
					<ul>
						<li><strong>Between keys</strong> — pick a target key, the algorithm shows pivot chords, direct dominants, secondary dominants, chromatic mediants and multi-step paths via intermediate keys. Pivots are also highlighted on the circle.</li>
						<li><strong>Between chords</strong> — pick a start and end chord, the pathfinder searches the harmonic graph (using current lenses) and ranks the smoothest connections.</li>
					</ul>
					<p>Click any path card to load it into the progression builder. Use <strong>SEARCH</strong> to compute and <strong>CLEAR</strong> to hide results.</p>
				</section>

				<section>
					<h3>Preset Library</h3>
					<p>Browse common chord progressions (pop, rock, J-pop, jazz cadences, cycles, re-harmonisations, modulations). Pick one from the dropdown to preview it and load it into the progression builder.</p>
				</section>

				<section>
					<h3>Voice leading hint</h3>
					<p>In the chord info panel, the small <strong>VL</strong> button toggles voice-leading data for outgoing relationships — common tones (♢) and total half-step movement (½). Lower values mean smoother chord transitions.</p>
				</section>
			</div>

			<div class="modal-footer">
				<a href="mailto:vlastimilcerveny34@gmail.com" class="contact-link">Contact / feedback</a>
				<span class="copy">© 2026 Vlastimil Červený</span>
			</div>
		</div>
	</div>
{/if}

<style>
	.overlay {
		position: fixed; inset: 0; z-index: 200;
		background: rgba(0,0,0,0.7);
		display: flex; align-items: center; justify-content: center;
		padding: 24px;
	}
	.modal {
		background: #16120f; border: 1px solid #3a342f; border-radius: 8px;
		max-width: 600px; width: 100%; max-height: 85vh;
		overflow-y: auto; padding: 32px;
		position: relative;
	}
	.close-btn {
		position: absolute; top: 16px; right: 16px;
		background: transparent; border: none; color: #9b948a;
		font-size: 1rem; cursor: pointer; padding: 4px 8px;
	}
	.close-btn:hover { color: #f4ead7; }

	.modal-title {
		font-family: 'Crimson Pro', serif; font-size: 1.6rem;
		color: #f4ead7; font-weight: 500; margin: 0 0 24px;
	}

	.sections { display: flex; flex-direction: column; gap: 20px; }

	section h3 {
		font-family: 'Outfit', sans-serif; font-size: 0.7rem;
		text-transform: uppercase; letter-spacing: 0.15em;
		color: #d4a574; margin: 0 0 6px;
	}
	section p, section ul {
		font-family: 'Crimson Pro', serif; font-size: 1rem;
		color: #c8c1b5; margin: 0; line-height: 1.6;
	}
	section ul { padding-left: 18px; }
	section li { margin-bottom: 4px; }
	strong { color: #e8e2d5; }

	.hl-maj { color: #e08f9a; }
	.hl-dom { color: #d4a44a; }
	.hl-min { color: #7aa9c9; }

	.hint-tip {
		margin-top: 8px; font-size: 0.85rem; color: #9b948a;
		border-left: 2px solid #c4a04a; padding-left: 10px;
	}

	.modal-footer {
		margin-top: 28px; padding-top: 16px; border-top: 1px solid #2a251f;
		display: flex; justify-content: space-between; align-items: center;
		font-family: 'JetBrains Mono', monospace; font-size: 0.7rem;
	}
	.contact-link { color: #d4a574; text-decoration: none; }
	.contact-link:hover { text-decoration: underline; }
	.copy { color: #5c5650; }
</style>
