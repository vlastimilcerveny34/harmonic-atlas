import type { Quality, ModeName } from '$lib/theory/modes.js';
import { chordPitches } from '$lib/theory/chords.js';
import { writable } from 'svelte/store';

let sampler: import('tone').Sampler | null = null;

export const audioReady   = writable(false);
export const audioLoading = writable(false);

let ready = false;
let loading = false;

export function isAudioReady(): boolean { return ready; }
export function isAudioLoading(): boolean { return loading; }

// Preload sampler buffers on page load — no user gesture needed for HTTP fetches.
// AudioContext (Tone.start) is deferred to first user interaction in playChord.
if (typeof window !== 'undefined') {
	preloadSampler();
}

async function preloadSampler(): Promise<void> {
	if (loading || ready) return;
	loading = true;
	audioLoading.set(true);
	const Tone = await import('tone');
	await new Promise<void>((resolve) => {
		sampler = new Tone.Sampler({
			urls: {
				A0:  'A0.mp3',  C1:  'C1.mp3',  'D#1': 'Ds1.mp3', 'F#1': 'Fs1.mp3',
				A1:  'A1.mp3',  C2:  'C2.mp3',  'D#2': 'Ds2.mp3', 'F#2': 'Fs2.mp3',
				A2:  'A2.mp3',  C3:  'C3.mp3',  'D#3': 'Ds3.mp3', 'F#3': 'Fs3.mp3',
				A3:  'A3.mp3',  C4:  'C4.mp3',  'D#4': 'Ds4.mp3', 'F#4': 'Fs4.mp3',
				A4:  'A4.mp3',  C5:  'C5.mp3',  'D#5': 'Ds5.mp3', 'F#5': 'Fs5.mp3',
				A5:  'A5.mp3',  C6:  'C6.mp3',  'D#6': 'Ds6.mp3', 'F#6': 'Fs6.mp3',
				A6:  'A6.mp3',  C7:  'C7.mp3',  'D#7': 'Ds7.mp3', 'F#7': 'Fs7.mp3',
				A7:  'A7.mp3',  C8:  'C8.mp3',
			},
			baseUrl: 'https://tonejs.github.io/audio/salamander/',
			onload: () => {
				ready = true;
				loading = false;
				audioReady.set(true);
				audioLoading.set(false);
				resolve();
			},
		}).toDestination();
	});
}

async function ensureContextRunning(): Promise<void> {
	const Tone = await import('tone');
	await Tone.start();
	if (Tone.getContext().state !== 'running') {
		await Tone.getContext().resume();
	}
}

export async function initAudio(): Promise<void> {
	// Sampler already loaded — just resume AudioContext (may be suspended after inactivity)
	if (ready) {
		await ensureContextRunning();
		return;
	}
	// Still loading in background — wait for it, then resume context
	if (loading) {
		await new Promise<void>((resolve) => {
			const interval = setInterval(() => {
				if (ready) { clearInterval(interval); resolve(); }
			}, 50);
		});
		await ensureContextRunning();
		return;
	}
	// Fallback: sampler not started yet (e.g. SSR or preload failed)
	await preloadSampler();
	await ensureContextRunning();
}

export async function playChord(
	pc: number,
	quality: Quality,
	tonicPc: number,
	mode: ModeName,
	duration = '2n',
): Promise<void> {
	await initAudio();
	if (!sampler) return;
	const pitches = chordPitches(pc, quality, tonicPc, mode, 4);
	sampler.triggerAttackRelease(pitches, duration);
}

export async function playProgression(
	chords: { pc: number; quality: Quality }[],
	tonicPc: number,
	mode: ModeName,
): Promise<void> {
	await initAudio();
	if (!sampler) return;
	const Tone = await import('tone');
	const now = Tone.now();
	chords.forEach((c, i) => {
		const pitches = chordPitches(c.pc, c.quality, tonicPc, mode, 4);
		sampler!.triggerAttackRelease(pitches, '2n', now + i * 1.1);
	});
}
