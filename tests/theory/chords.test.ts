import { describe, it, expect } from 'vitest';
import { diatonicChords, isDiatonic, getRoman, chordLabel, pcToNoteName } from '../../src/lib/theory/chords.js';
import { MODE_NAMES } from '../../src/lib/theory/modes.js';

// C = pc 0, G = pc 7, D = pc 2, F = pc 5, Bb = pc 10, Eb = pc 3

describe('diatonicChords', () => {
	it('vrátí 7 akordů', () => {
		for (const mode of MODE_NAMES) {
			expect(diatonicChords(0, mode)).toHaveLength(7);
		}
	});

	it('C Ionian: C Dm Em F G Am B°', () => {
		const chords = diatonicChords(0, 'ionian');
		expect(chords[0]).toMatchObject({ name: 'C',  quality: 'M', roman: 'I'    });
		expect(chords[1]).toMatchObject({ name: 'Dm', quality: 'm', roman: 'ii'   });
		expect(chords[2]).toMatchObject({ name: 'Em', quality: 'm', roman: 'iii'  });
		expect(chords[3]).toMatchObject({ name: 'F',  quality: 'M', roman: 'IV'   });
		expect(chords[4]).toMatchObject({ name: 'G',  quality: 'M', roman: 'V'    });
		expect(chords[5]).toMatchObject({ name: 'Am', quality: 'm', roman: 'vi'   });
		expect(chords[6]).toMatchObject({ name: 'B°', quality: 'd', roman: 'vii°' });
	});

	it('G Ionian: G Am Bm C D Em F#°', () => {
		const chords = diatonicChords(7, 'ionian');
		expect(chords[0].name).toBe('G');
		expect(chords[3].name).toBe('C');
		expect(chords[4].name).toBe('D');
		expect(chords[6].name).toBe('F#°');
	});

	it('Bb Ionian: Bb Cm Dm Eb F Gm A°', () => {
		const chords = diatonicChords(10, 'ionian');
		expect(chords[0].name).toBe('Bb');
		expect(chords[3].name).toBe('Eb');
		expect(chords[4].name).toBe('F');
	});

	it('A Aeolian: Am B° C Dm Em F G', () => {
		const chords = diatonicChords(9, 'aeolian');
		expect(chords[0]).toMatchObject({ name: 'Am', quality: 'm', roman: 'i'   });
		expect(chords[1]).toMatchObject({ name: 'B°', quality: 'd', roman: 'ii°' });
		expect(chords[2]).toMatchObject({ name: 'C',  quality: 'M', roman: 'III' });
		expect(chords[4]).toMatchObject({ name: 'Em', quality: 'm', roman: 'v'   });
	});

	it('D Dorian: Dm Em F G Am B° C', () => {
		const chords = diatonicChords(2, 'dorian');
		expect(chords[0]).toMatchObject({ name: 'Dm', roman: 'i'   });
		expect(chords[3]).toMatchObject({ name: 'G',  roman: 'IV'  });
		expect(chords[6]).toMatchObject({ name: 'C',  roman: 'VII' });
	});

	it('F# Ionian používá kříže, ne béčka', () => {
		const chords = diatonicChords(6, 'ionian');
		// F# major scale: F# G# A# B C# D# E#
		expect(chords[0].name).toBe('F#');
		expect(chords[1].name).toBe('G#m');
	});

	it('Eb Ionian používá béčka', () => {
		const chords = diatonicChords(3, 'ionian');
		expect(chords[0].name).toBe('Eb');
		expect(chords[3].name).toBe('Ab');
	});

	it('všechny combinace 12 tónin × 7 módů vrátí 7 akordů bez chyby', () => {
		for (let pc = 0; pc < 12; pc++) {
			for (const mode of MODE_NAMES) {
				const chords = diatonicChords(pc, mode);
				expect(chords).toHaveLength(7);
				chords.forEach(c => {
					expect(c.pc).toBeGreaterThanOrEqual(0);
					expect(c.pc).toBeLessThan(12);
					expect(['M','m','d','7']).toContain(c.quality);
				});
			}
		}
	});
});

describe('isDiatonic', () => {
	it('C major je diatonické v C Ionian', () => {
		const set = diatonicChords(0, 'ionian');
		expect(isDiatonic(0, 'M', set)).toBe(true);
	});

	it('C# major není diatonické v C Ionian', () => {
		const set = diatonicChords(0, 'ionian');
		expect(isDiatonic(1, 'M', set)).toBe(false);
	});
});

describe('getRoman', () => {
	it('G major v C Ionian = V', () => {
		const set = diatonicChords(0, 'ionian');
		expect(getRoman(7, 'M', set)).toBe('V');
	});

	it('nediatonický akord vrátí null', () => {
		const set = diatonicChords(0, 'ionian');
		expect(getRoman(1, 'M', set)).toBeNull();
	});
});
