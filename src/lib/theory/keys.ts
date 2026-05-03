import { diatonicChords } from './chords.js';
import { MODE_NAMES, MODES } from './modes.js';
import type { ModeName, Quality } from './modes.js';

export interface KeyMembership {
	tonicPc: number;
	modeName: ModeName;
	roman: string;
	degree: number;
}

// All keys (tonic × mode) where this chord is diatonic.
// 12 tonics × 7 modes = up to 84 entries; typically ~10-20 per common chord.
export function keysContainingChord(pc: number, quality: Quality): KeyMembership[] {
	const result: KeyMembership[] = [];
	for (let tonic = 0; tonic < 12; tonic++) {
		for (const mode of MODE_NAMES) {
			const set = diatonicChords(tonic, mode);
			const match = set.find(d => d.pc === pc && d.quality === quality);
			if (match) {
				result.push({
					tonicPc: tonic,
					modeName: mode,
					roman: match.roman,
					degree: match.degree,
				});
			}
		}
	}
	return result;
}

// Distance between two tonics on the circle of fifths (0 = same, 6 = tritone away).
const FIFTHS_ORDER = [0, 7, 2, 9, 4, 11, 6, 1, 8, 3, 10, 5];
export function fifthsDistance(tonicA: number, tonicB: number): number {
	const a = FIFTHS_ORDER.indexOf(tonicA);
	const b = FIFTHS_ORDER.indexOf(tonicB);
	const diff = Math.abs(a - b);
	return Math.min(diff, 12 - diff);
}

// Score how "close" a target key is to the source key (lower = closer).
// Used to rank pivot suggestions.
export function keyDistance(
	fromTonic: number, fromMode: ModeName,
	toTonic: number, toMode: ModeName,
): number {
	if (fromTonic === toTonic && fromMode === toMode) return 0;
	const fifthDist = fifthsDistance(fromTonic, toTonic);
	const sameMode = fromMode === toMode ? 0 : 1;
	const isParallel = fromTonic === toTonic && MODES[fromMode].parallel === toMode ? -0.5 : 0;
	return fifthDist + sameMode + isParallel;
}
