// Extended chord variations: maj7, m7, 6, sus4, add9, etc.
// Variations decorate a base quality (M/m/d/7) — they don't change harmonic function.
// The graph (relationships, lenses) uses only base quality. Variations affect display, audio and MIDI.

import type { Quality } from './modes.js';

export type ChordVariation =
	| 'M' | 'm' | 'd' | '7'                    // base
	| 'maj7' | 'm7' | '6' | 'm6'               // sevenths
	| 'maj9' | 'm9' | '9' | 'add9' | 'madd9'   // extensions
	| 'sus2' | 'sus4' | '7sus4';                // suspensions

// Intervals (in semitones from root) for each variation.
const VARIATION_INTERVALS: Record<ChordVariation, number[]> = {
	M:        [0, 4, 7],
	m:        [0, 3, 7],
	d:        [0, 3, 6],
	'7':      [0, 4, 7, 10],
	maj7:     [0, 4, 7, 11],
	m7:       [0, 3, 7, 10],
	'6':      [0, 4, 7, 9],
	m6:       [0, 3, 7, 9],
	maj9:     [0, 4, 7, 11, 14],
	m9:       [0, 3, 7, 10, 14],
	'9':      [0, 4, 7, 10, 14],
	add9:     [0, 4, 7, 14],
	madd9:    [0, 3, 7, 14],
	sus2:     [0, 2, 7],
	sus4:     [0, 5, 7],
	'7sus4':  [0, 5, 7, 10],
};

// Suffix shown after the root note (e.g. "C" + "maj7" = "Cmaj7", "A" + "m" = "Am").
const VARIATION_SUFFIX: Record<ChordVariation, string> = {
	M:       '',
	m:       'm',
	d:       '°',
	'7':     '7',
	maj7:    'maj7',
	m7:      'm7',
	'6':     '6',
	m6:      'm6',
	maj9:    'maj9',
	m9:      'm9',
	'9':     '9',
	add9:    'add9',
	madd9:   'm(add9)',
	sus2:    'sus2',
	sus4:    'sus4',
	'7sus4': '7sus4',
};

// Map a variation to its base quality — for use in the harmonic graph.
const VARIATION_BASE: Record<ChordVariation, Quality> = {
	M:       'M',
	m:       'm',
	d:       'd',
	'7':     '7',
	maj7:    'M',
	m7:      'm',
	'6':     'M',
	m6:      'm',
	maj9:    'M',
	m9:      'm',
	'9':     '7',
	add9:    'M',
	madd9:   'm',
	sus2:    'M',  // ambiguous, but most often resolves to major
	sus4:    'M',
	'7sus4': '7',
};

// Variations grouped for the UI palette — order matters (first = most common).
export const VARIATIONS_FOR_QUALITY: Record<Quality, { group: string; variations: ChordVariation[] }[]> = {
	M: [
		{ group: 'Triad',       variations: ['M'] },
		{ group: 'Sevenths',    variations: ['maj7', '6'] },
		{ group: 'Extensions',  variations: ['add9', 'maj9'] },
		{ group: 'Suspensions', variations: ['sus2', 'sus4'] },
	],
	m: [
		{ group: 'Triad',       variations: ['m'] },
		{ group: 'Sevenths',    variations: ['m7', 'm6'] },
		{ group: 'Extensions',  variations: ['madd9', 'm9'] },
	],
	'7': [
		{ group: 'Dom 7',       variations: ['7'] },
		{ group: 'Extensions',  variations: ['9'] },
		{ group: 'Suspensions', variations: ['7sus4'] },
	],
	d: [
		{ group: 'Triad',       variations: ['d'] },
	],
};

export function variationIntervals(v: ChordVariation): number[] {
	return VARIATION_INTERVALS[v];
}

export function variationSuffix(v: ChordVariation): string {
	return VARIATION_SUFFIX[v];
}

export function variationBaseQuality(v: ChordVariation): Quality {
	return VARIATION_BASE[v];
}
