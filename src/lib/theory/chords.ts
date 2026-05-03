import { Key, Note } from '@tonaljs/tonal';
import { MODES, romanFor } from './modes.js';
import type { Quality, ModeName } from './modes.js';

// Canonical note names for display — fixed, independent of tonic context.
// Major: prefer flats for enharmonic pairs except F# (more common than Gb in practice).
// Minor: prefer sharps for enharmonic pairs (C#m, G#m, F#m) since minor keys lean sharp.
const CANONICAL_MAJOR = ['C','Db','D','Eb','E','F','F#','G','Ab','A','Bb','B'] as const;
const CANONICAL_MINOR = ['C','C#','D','Eb','E','F','F#','G','G#','A','Bb','B'] as const;

export function canonicalChordLabel(pc: number, quality: Quality): string {
	if (quality === 'M') return CANONICAL_MAJOR[pc];
	if (quality === 'm') return CANONICAL_MINOR[pc] + 'm';
	if (quality === 'd') return CANONICAL_MAJOR[pc] + '°';
	if (quality === '7') return CANONICAL_MAJOR[pc] + '7';
	return CANONICAL_MAJOR[pc];
}

export interface DiatonicChord {
	pc: number;         // pitch class 0–11
	quality: Quality;
	degree: number;     // 0–6
	roman: string;
	name: string;       // e.g. "Cm", "G7", "F#°"
}

// Circle of fifths order (spoke indices)
export const FIFTHS_PCS = [0, 7, 2, 9, 4, 11, 6, 1, 8, 3, 10, 5];

// Maps pitch class → note name, context-aware via Tonal.js Key
export function pcToNoteName(pc: number, tonicPc: number, modeName: ModeName): string {
	const useSharp = isSharpKey(tonicPc, modeName);
	const tonicNote = pcToNoteNameRaw(tonicPc, useSharp);
	const keyType = ['ionian', 'lydian', 'mixolydian'].includes(modeName) ? 'major' :
	                ['aeolian', 'dorian', 'phrygian', 'locrian'].includes(modeName) ? 'minor' : 'major';

	const keyData = keyType === 'major' ? Key.majorKey(tonicNote) : Key.minorKey(tonicNote);
	const scale = keyType === 'major'
		? (keyData as ReturnType<typeof Key.majorKey>).scale
		: (keyData as ReturnType<typeof Key.minorKey>).natural.scale;

	// Find the note in the key's scale that matches our pitch class
	for (const noteName of scale) {
		const midi = Note.midi(noteName + '4');
		if (midi !== null && midi % 12 === pc) return noteName;
	}

	// Fallback: pick the enharmonic name that matches the key's accidental direction
	return pcToNoteNameRaw(pc, isSharpKey(tonicPc, modeName));
}

function isSharpKey(tonicPc: number, modeName: ModeName): boolean {
	// Sharp major keys: G D A E B F# (not C# — Db is the standard spelling for pc=1)
	const sharpMajorPcs = [7, 2, 9, 4, 11, 6];
	if (['ionian', 'lydian', 'mixolydian'].includes(modeName)) {
		return sharpMajorPcs.includes(tonicPc);
	}
	// For minor-flavoured modes use the relative major's accidental direction
	const relMajPc = (tonicPc + 3) % 12;
	return sharpMajorPcs.includes(relMajPc);
}

function pcToNoteNameRaw(pc: number, preferSharp = false): string {
	const sharps = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
	const flats  = ['C','Db','D','Eb','E','F','Gb','G','Ab','A','Bb','B'];
	return preferSharp ? sharps[pc] : flats[pc];
}

export function chordLabel(pc: number, quality: Quality, tonicPc: number, modeName: ModeName): string {
	const n = pcToNoteName(pc, tonicPc, modeName);
	if (quality === 'M') return n;
	if (quality === 'm') return n + 'm';
	if (quality === 'd') return n + '°';
	if (quality === '7') return n + '7';
	return n;
}

export function chordIntervals(quality: Quality): number[] {
	if (quality === 'M') return [0, 4, 7];
	if (quality === 'm') return [0, 3, 7];
	if (quality === 'd') return [0, 3, 6];
	if (quality === '7') return [0, 4, 7, 10];
	return [0, 4, 7];
}

export function chordPitches(pc: number, quality: Quality, tonicPc: number, modeName: ModeName, baseOct = 4): string[] {
	const root = pcToNoteName(pc, tonicPc, modeName);
	return chordIntervals(quality).map(i => {
		const notePc = (pc + i) % 12;
		const oct = baseOct + Math.floor((pc + i) / 12);
		const noteName = pcToNoteName(notePc, tonicPc, modeName);
		return `${noteName}${oct}`;
	});
}

export function diatonicChords(tonicPc: number, modeName: ModeName): DiatonicChord[] {
	const m = MODES[modeName];
	return m.intervals.map((iv, idx) => {
		const pc = (tonicPc + iv) % 12;
		const quality = m.qualities[idx];
		return {
			pc,
			quality,
			degree: idx,
			roman: romanFor(idx, quality),
			name: canonicalChordLabel(pc, quality),
		};
	});
}

export function isDiatonic(pc: number, quality: Quality, set: DiatonicChord[]): boolean {
	return set.some(d => d.pc === pc && d.quality === quality);
}

export function getRoman(pc: number, quality: Quality, set: DiatonicChord[]): string | null {
	return set.find(d => d.pc === pc && d.quality === quality)?.roman ?? null;
}
