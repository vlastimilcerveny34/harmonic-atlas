import type { Quality } from './modes.js';

export interface PresetStep {
	interval: number;   // semitones from tonic (0–11)
	quality: Quality;
	roman: string;      // descriptive label (not strict roman)
}

export type PresetCategory = 'cycle' | 'cadence' | 'modulation' | 'reharm' | 'pop';

export interface Preset {
	id: string;
	name: string;
	description: string;
	category: PresetCategory;
	steps: PresetStep[];
	hint?: string;  // optional usage tip
}

export const PRESETS: Preset[] = [
	{
		id: 'coltrane',
		name: 'Coltrane Changes',
		description: 'Major-thirds cycle — Giant Steps',
		category: 'cycle',
		steps: [
			{ interval: 0,  quality: 'M', roman: 'I' },
			{ interval: 7,  quality: '7', roman: 'V7' },
			{ interval: 4,  quality: 'M', roman: 'III' },
			{ interval: 11, quality: '7', roman: 'V7/♭VI' },
			{ interval: 8,  quality: 'M', roman: '♭VI' },
			{ interval: 3,  quality: '7', roman: 'V7/I' },
			{ interval: 0,  quality: 'M', roman: 'I' },
		],
		hint: 'Three tonics symmetrically a M3 apart — covers the octave in 3 jumps.',
	},
	{
		id: 'minor-thirds-cycle',
		name: 'Minor-Thirds Cycle',
		description: 'Symmetric cycle through minor thirds',
		category: 'cycle',
		steps: [
			{ interval: 0, quality: 'M', roman: 'I' },
			{ interval: 3, quality: 'M', roman: '♭III' },
			{ interval: 6, quality: 'M', roman: '♭V' },
			{ interval: 9, quality: 'M', roman: 'VI' },
			{ interval: 0, quality: 'M', roman: 'I' },
		],
		hint: 'Diminished symmetry — closes the circle through 4 evenly spaced major chords.',
	},
	{
		id: 'circle-of-fifths',
		name: 'Circle of Fifths Descending',
		description: 'iii → vi → ii → V → I — classic fifth sequence',
		category: 'cadence',
		steps: [
			{ interval: 4, quality: 'm', roman: 'iii' },
			{ interval: 9, quality: 'm', roman: 'vi' },
			{ interval: 2, quality: 'm', roman: 'ii' },
			{ interval: 7, quality: '7', roman: 'V7' },
			{ interval: 0, quality: 'M', roman: 'I' },
		],
	},
	{
		id: 'backdoor',
		name: 'Backdoor Cadence',
		description: 'iv → ♭VII7 → I — jazzy "back door"',
		category: 'cadence',
		steps: [
			{ interval: 5,  quality: 'm', roman: 'iv' },
			{ interval: 10, quality: '7', roman: '♭VII7' },
			{ interval: 0,  quality: 'M', roman: 'I' },
		],
		hint: '♭VII7 acts as a V7 substitute via a shared tone.',
	},
	{
		id: 'lydian-ii-v-i',
		name: 'Lydian II — V — I',
		description: 'Major II instead of minor ii — Lydian flavor',
		category: 'cadence',
		steps: [
			{ interval: 2, quality: 'M', roman: 'II' },
			{ interval: 7, quality: '7', roman: 'V7' },
			{ interval: 0, quality: 'M', roman: 'I' },
		],
	},
	{
		id: 'andalusian',
		name: 'Andalusian Cadence',
		description: 'i → ♭VII → ♭VI → V — flamenco / dramatic',
		category: 'cadence',
		steps: [
			{ interval: 0,  quality: 'm', roman: 'i' },
			{ interval: 10, quality: 'M', roman: '♭VII' },
			{ interval: 8,  quality: 'M', roman: '♭VI' },
			{ interval: 7,  quality: 'M', roman: 'V' },
		],
		hint: 'Phrygian sound — descending bass line by half-steps.',
	},
	{
		id: 'mixolydian-vamp',
		name: 'Mixolydian Vamp',
		description: 'I → ♭VII → IV → I — rock Mixolydian',
		category: 'cadence',
		steps: [
			{ interval: 0,  quality: 'M', roman: 'I' },
			{ interval: 10, quality: 'M', roman: '♭VII' },
			{ interval: 5,  quality: 'M', roman: 'IV' },
			{ interval: 0,  quality: 'M', roman: 'I' },
		],
	},
	{
		id: 'plagal-extended',
		name: 'Extended Plagal',
		description: 'IV → iv → I — borrowed minor subdominant',
		category: 'cadence',
		steps: [
			{ interval: 5, quality: 'M', roman: 'IV' },
			{ interval: 5, quality: 'm', roman: 'iv' },
			{ interval: 0, quality: 'M', roman: 'I' },
		],
		hint: 'Classic Beatles trick — adds emotional depth.',
	},
	{
		id: 'tritone-251',
		name: 'Tritone Sub II — V — I',
		description: 'ii → ♭II7 → I — tritone substitution of the dominant',
		category: 'reharm',
		steps: [
			{ interval: 2, quality: 'm', roman: 'ii' },
			{ interval: 1, quality: '7', roman: '♭II7' },
			{ interval: 0, quality: 'M', roman: 'I' },
		],
		hint: '♭II7 is the tritone sub of V7 — chromatic descending bass.',
	},
	{
		id: 'royal-road',
		name: 'Royal Road (王道)',
		description: 'IV → V7 → iii → vi — Japanese pop classic',
		category: 'pop',
		steps: [
			{ interval: 5, quality: 'M', roman: 'IV' },
			{ interval: 7, quality: '7', roman: 'V7' },
			{ interval: 4, quality: 'm', roman: 'iii' },
			{ interval: 9, quality: 'm', roman: 'vi' },
		],
		hint: 'Deceptive cadence — V → vi instead of V → I, keeps going.',
	},
	{
		id: 'axis',
		name: 'Axis Progression',
		description: 'I → V → vi → IV — most popular pop progression',
		category: 'pop',
		steps: [
			{ interval: 0, quality: 'M', roman: 'I' },
			{ interval: 7, quality: 'M', roman: 'V' },
			{ interval: 9, quality: 'm', roman: 'vi' },
			{ interval: 5, quality: 'M', roman: 'IV' },
		],
		hint: "Let It Be, Don't Stop Believin', With or Without You — thousands of songs.",
	},
	{
		id: 'doowop',
		name: '50s / Doo-wop',
		description: 'I → vi → IV → V — Stand By Me, Earth Angel',
		category: 'pop',
		steps: [
			{ interval: 0, quality: 'M', roman: 'I' },
			{ interval: 9, quality: 'm', roman: 'vi' },
			{ interval: 5, quality: 'M', roman: 'IV' },
			{ interval: 7, quality: 'M', roman: 'V' },
		],
		hint: 'Classic 50s — dance pop, early rock\'n\'roll.',
	},
	{
		id: 'poppunk',
		name: 'Pop-punk Turnaround',
		description: 'vi → IV → I → V — emo / pop-punk',
		category: 'pop',
		steps: [
			{ interval: 9, quality: 'm', roman: 'vi' },
			{ interval: 5, quality: 'M', roman: 'IV' },
			{ interval: 0, quality: 'M', roman: 'I' },
			{ interval: 7, quality: 'M', roman: 'V' },
		],
		hint: 'Starts on minor = melancholic flavor. Bring Me to Life, Numb, Boulevard of Broken Dreams.',
	},
	{
		id: 'pachelbel',
		name: 'Pachelbel / Kanon',
		description: 'I → V → vi → iii → IV → I → IV → V',
		category: 'pop',
		steps: [
			{ interval: 0, quality: 'M', roman: 'I' },
			{ interval: 7, quality: 'M', roman: 'V' },
			{ interval: 9, quality: 'm', roman: 'vi' },
			{ interval: 4, quality: 'm', roman: 'iii' },
			{ interval: 5, quality: 'M', roman: 'IV' },
			{ interval: 0, quality: 'M', roman: 'I' },
			{ interval: 5, quality: 'M', roman: 'IV' },
			{ interval: 7, quality: 'M', roman: 'V' },
		],
		hint: "Don't Look Back in Anger, Basket Case — known in J-pop as \"Kanon shinkou\".",
	},
	{
		id: 'aeolian-rock',
		name: 'Aeolian Rock',
		description: 'i → ♭VII → ♭VI → ♭VII — rock minor vamp',
		category: 'pop',
		steps: [
			{ interval: 0,  quality: 'm', roman: 'i' },
			{ interval: 10, quality: 'M', roman: '♭VII' },
			{ interval: 8,  quality: 'M', roman: '♭VI' },
			{ interval: 10, quality: 'M', roman: '♭VII' },
		],
		hint: 'All Along the Watchtower, Stairway sections. Dark minor without the harmonic V.',
	},
	{
		id: 'power-vamp',
		name: 'Power Vamp',
		description: 'i → ♭VII → i — power chord rock',
		category: 'pop',
		steps: [
			{ interval: 0,  quality: 'm', roman: 'i' },
			{ interval: 10, quality: 'M', roman: '♭VII' },
			{ interval: 0,  quality: 'm', roman: 'i' },
		],
		hint: 'Smoke on the Water vamp, Sunshine of Your Love — minimalist rock skeleton.',
	},
	{
		id: 'anime-ballad',
		name: 'J-pop Anime Ballad',
		description: 'vi → V → IV → V — sad J-pop',
		category: 'pop',
		steps: [
			{ interval: 9, quality: 'm', roman: 'vi' },
			{ interval: 7, quality: 'M', roman: 'V' },
			{ interval: 5, quality: 'M', roman: 'IV' },
			{ interval: 7, quality: 'M', roman: 'V' },
		],
		hint: 'Descending-then-rising shape — emotional J-pop ballads and anime openings/endings.',
	},
	{
		id: 'twelve-bar-blues',
		name: '12-Bar Blues',
		description: 'I7 → IV7 → V7 — classic blues / rock\'n\'roll',
		category: 'pop',
		steps: [
			{ interval: 0, quality: '7', roman: 'I7' },
			{ interval: 5, quality: '7', roman: 'IV7' },
			{ interval: 0, quality: '7', roman: 'I7' },
			{ interval: 7, quality: '7', roman: 'V7' },
			{ interval: 5, quality: '7', roman: 'IV7' },
			{ interval: 0, quality: '7', roman: 'I7' },
		],
		hint: 'Shortened 12-bar form. Foundation of blues, early rock\'n\'roll, country.',
	},
];

export function applyPreset(
	preset: Preset, tonicPc: number,
): { pc: number; quality: Quality; roman: string }[] {
	return preset.steps.map(step => ({
		pc: ((tonicPc + step.interval) % 12 + 12) % 12,
		quality: step.quality,
		roman: step.roman,
	}));
}
