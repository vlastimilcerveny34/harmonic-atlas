// Auto-decorate: assign optimal extended variations to a progression
// based on voice leading (shared tones between adjacent chords) plus mild
// preference for richer voicings (7ths/extensions over plain triads).

import { variationIntervals, VARIATIONS_FOR_QUALITY, type ChordVariation } from './extensions.js';
import type { Quality } from './modes.js';
import type { ChordRef } from '$lib/stores/session.js';

function pcSet(pc: number, variation: ChordVariation): number[] {
	return variationIntervals(variation).map(i => (pc + i) % 12);
}

function commonTones(a: number[], b: number[]): number {
	return a.filter(p => b.includes(p)).length;
}

// Lightweight scoring: shared tones with neighbors + mild preference for richer voicings.
function scoreVariation(
	v: ChordVariation,
	chordPc: number,
	prev: ChordRef | null,
	next: ChordRef | null,
): number {
	const myPcs = pcSet(chordPc, v);
	let score = 0;

	if (prev) {
		const prevV = (prev.variation ?? prev.quality) as ChordVariation;
		score += commonTones(pcSet(prev.pc, prevV), myPcs);
	}
	if (next) {
		const nextV = (next.variation ?? next.quality) as ChordVariation;
		score += commonTones(myPcs, pcSet(next.pc, nextV));
	}

	// Mild taste preferences — prefer 7ths over plain triads, avoid sus by default.
	if (v === 'maj7' || v === 'm7') score += 0.6;
	if (v === '6' || v === 'm6')   score += 0.3;
	if (v === '9' || v === 'maj9' || v === 'm9') score += 0.2;
	if (v === 'add9' || v === 'madd9') score += 0.4;
	if (v.includes('sus')) score -= 0.7;

	return score;
}

function pickBestVariation(
	chord: { pc: number; quality: Quality },
	prev: ChordRef | null,
	next: ChordRef | null,
): ChordVariation {
	const groups = VARIATIONS_FOR_QUALITY[chord.quality];
	const candidates = groups.flatMap(g => g.variations);
	if (candidates.length === 0) return chord.quality as ChordVariation;

	let best: ChordVariation = candidates[0];
	let bestScore = -Infinity;

	for (const v of candidates) {
		const score = scoreVariation(v, chord.pc, prev, next);
		if (score > bestScore) { bestScore = score; best = v; }
	}
	return best;
}

export function autoDecorate<T extends ChordRef>(progression: T[]): T[] {
	if (progression.length === 0) return progression;

	// Two-pass for stability: 1st pass uses base qualities for neighbours;
	// 2nd pass uses 1st-pass variations so we converge on a coherent set.
	const pass1: T[] = progression.map((chord, i) => ({
		...chord,
		variation: pickBestVariation(chord, progression[i - 1] ?? null, progression[i + 1] ?? null),
	}));

	const pass2: T[] = pass1.map((chord, i) => ({
		...chord,
		variation: pickBestVariation(chord, pass1[i - 1] ?? null, pass1[i + 1] ?? null),
	}));

	return pass2;
}

export function stripDecorations<T extends ChordRef>(progression: T[]): T[] {
	return progression.map(c => {
		const copy = { ...c };
		delete copy.variation;
		return copy;
	});
}

export function isDecorated(progression: ChordRef[]): boolean {
	return progression.some(c => c.variation !== undefined);
}
