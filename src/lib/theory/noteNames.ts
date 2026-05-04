// Single source of truth for note name arrays.
// Used across UI components and theory modules to avoid duplication.

// Display in dropdowns: shows enharmonic pairs explicitly (e.g. "C#/Db").
export const NOTE_NAMES_DISPLAY = [
	'C', 'C#/Db', 'D', 'D#/Eb', 'E', 'F',
	'F#/Gb', 'G', 'G#/Ab', 'A', 'A#/Bb', 'B',
] as const;

// Compact label (single name, prefers flats for minor-leaning, sharps for sharp keys).
// Matches the canonical labels in chords.ts CANONICAL_MAJOR.
export const NOTE_NAMES_COMPACT = [
	'C', 'Db', 'D', 'Eb', 'E', 'F',
	'F#', 'G', 'Ab', 'A', 'Bb', 'B',
] as const;
