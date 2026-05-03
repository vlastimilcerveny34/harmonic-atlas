import { chordIntervals } from './chords.js';
import type { Quality } from './modes.js';

export interface VoiceMove {
	fromPc: number;
	toPc: number;
	semitones: number;  // signed, smallest absolute value (-6..6)
}

export interface VoiceLeading {
	commonTones: number[];
	moves: VoiceMove[];
	totalDistance: number;  // smoothness metric: sum of |semitones|
}

function chordPcs(pc: number, quality: Quality): number[] {
	return chordIntervals(quality).map(i => (pc + i) % 12);
}

// Smallest signed half-step distance between two pitch classes (-6..6).
function pcDistance(from: number, to: number): number {
	const d = ((to - from) % 12 + 12) % 12;
	return d > 6 ? d - 12 : d;
}

// Compute optimal voice leading from chord A to chord B.
// For each non-common tone in A, finds the closest unused tone in B (greedy).
// Works well for triads/sevenths in practice.
export function voiceLeading(
	fromPc: number, fromQuality: Quality,
	toPc: number, toQuality: Quality,
): VoiceLeading {
	const fromPcs = chordPcs(fromPc, fromQuality);
	const toPcs = chordPcs(toPc, toQuality);

	const commonTones = fromPcs.filter(p => toPcs.includes(p));
	const fromUnique = fromPcs.filter(p => !commonTones.includes(p));
	const toUnique = [...toPcs.filter(p => !commonTones.includes(p))];

	const moves: VoiceMove[] = [];

	// Sort fromUnique by best-match tightness so close moves get priority
	const candidates = fromUnique.map(fp => ({
		fp,
		options: toUnique.map(tp => ({ tp, dist: Math.abs(pcDistance(fp, tp)) }))
			.sort((a, b) => a.dist - b.dist),
	}));
	candidates.sort((a, b) => (a.options[0]?.dist ?? 99) - (b.options[0]?.dist ?? 99));

	const used = new Set<number>();
	candidates.forEach(({ fp, options }) => {
		const pick = options.find(o => !used.has(o.tp));
		if (pick) {
			used.add(pick.tp);
			moves.push({ fromPc: fp, toPc: pick.tp, semitones: pcDistance(fp, pick.tp) });
		}
	});

	// Any leftover toUnique pitches (e.g. triad → 7th adds a 4th note) become "added"
	toUnique.forEach(tp => {
		if (!used.has(tp)) {
			// Pick the closest fromPc as the source (allows duplicate movement)
			const closest = fromPcs
				.map(fp => ({ fp, dist: Math.abs(pcDistance(fp, tp)) }))
				.sort((a, b) => a.dist - b.dist)[0];
			if (closest) {
				moves.push({ fromPc: closest.fp, toPc: tp, semitones: pcDistance(closest.fp, tp) });
			}
		}
	});

	const totalDistance = moves.reduce((s, m) => s + Math.abs(m.semitones), 0);

	return { commonTones, moves, totalDistance };
}
