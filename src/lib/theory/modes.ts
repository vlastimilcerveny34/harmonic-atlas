export type Quality = 'M' | 'm' | 'd' | '7';
export type ModeName = 'ionian' | 'dorian' | 'phrygian' | 'lydian' | 'mixolydian' | 'aeolian' | 'locrian';

export interface ModeDefinition {
	intervals: number[];
	qualities: Quality[];
	label: string;
	parallel: ModeName;
}

export const MODES: Record<ModeName, ModeDefinition> = {
	ionian:     { intervals: [0, 2, 4, 5, 7, 9, 11], qualities: ['M','m','m','M','M','m','d'], label: 'Ionian (major)',  parallel: 'aeolian' },
	dorian:     { intervals: [0, 2, 3, 5, 7, 9, 10], qualities: ['m','m','M','M','m','d','M'], label: 'Dorian',          parallel: 'mixolydian' },
	phrygian:   { intervals: [0, 1, 3, 5, 7, 8, 10], qualities: ['m','M','M','m','d','M','m'], label: 'Phrygian',        parallel: 'locrian' },
	lydian:     { intervals: [0, 2, 4, 6, 7, 9, 11], qualities: ['M','M','m','d','M','m','m'], label: 'Lydian',          parallel: 'ionian' },
	mixolydian: { intervals: [0, 2, 4, 5, 7, 9, 10], qualities: ['M','m','d','M','m','m','M'], label: 'Mixolydian',      parallel: 'dorian' },
	aeolian:    { intervals: [0, 2, 3, 5, 7, 8, 10], qualities: ['m','d','M','m','m','M','M'], label: 'Aeolian (minor)', parallel: 'ionian' },
	locrian:    { intervals: [0, 1, 3, 5, 6, 8, 10], qualities: ['d','M','m','m','M','M','m'], label: 'Locrian',         parallel: 'phrygian' },
};

export const MODE_NAMES = Object.keys(MODES) as ModeName[];

const ROMAN_BASE = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];

export function romanFor(degree: number, quality: Quality): string {
	const r = ROMAN_BASE[degree];
	if (quality === 'M') return r;
	if (quality === 'm') return r.toLowerCase();
	if (quality === 'd') return r.toLowerCase() + '°';
	return r;
}
