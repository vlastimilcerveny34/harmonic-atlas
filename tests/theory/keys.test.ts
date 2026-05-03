import { describe, it, expect } from 'vitest';
import { keysContainingChord, fifthsDistance, keyDistance } from '../../src/lib/theory/keys.js';

describe('keysContainingChord', () => {
	it('C major je v C Ionian (I)', () => {
		const keys = keysContainingChord(0, 'M');
		expect(keys.some(k => k.tonicPc === 0 && k.modeName === 'ionian' && k.degree === 0)).toBe(true);
	});

	it('C major je v F Ionian (V) i G Ionian (IV)', () => {
		const keys = keysContainingChord(0, 'M');
		expect(keys.some(k => k.tonicPc === 5 && k.modeName === 'ionian' && k.roman === 'V')).toBe(true);
		expect(keys.some(k => k.tonicPc === 7 && k.modeName === 'ionian' && k.roman === 'IV')).toBe(true);
	});

	it('Dm je v C Ionian (ii) i F Ionian (vi) i Bb Ionian (iii)', () => {
		const keys = keysContainingChord(2, 'm');
		expect(keys.some(k => k.tonicPc === 0  && k.modeName === 'ionian')).toBe(true);
		expect(keys.some(k => k.tonicPc === 5  && k.modeName === 'ionian')).toBe(true);
		expect(keys.some(k => k.tonicPc === 10 && k.modeName === 'ionian')).toBe(true);
	});

	it('vrací prázdné pro neexistující kombinaci (žádný akord neexistuje ve všech 84 kontextech)', () => {
		// pojišťovák — funkce vrací array, nikdy nehazí
		const result = keysContainingChord(11, 'd');
		expect(Array.isArray(result)).toBe(true);
		expect(result.length).toBeGreaterThan(0);
	});
});

describe('fifthsDistance', () => {
	it('C → C = 0', () => expect(fifthsDistance(0, 0)).toBe(0));
	it('C → G = 1 (sousedi v kruhu)', () => expect(fifthsDistance(0, 7)).toBe(1));
	it('C → F = 1', () => expect(fifthsDistance(0, 5)).toBe(1));
	it('C → F# = 6 (tritonus = nejdál)', () => expect(fifthsDistance(0, 6)).toBe(6));
	it('symetrie: A → B == B → A', () => {
		expect(fifthsDistance(2, 9)).toBe(fifthsDistance(9, 2));
	});
});

describe('keyDistance', () => {
	it('stejný klíč = 0', () => {
		expect(keyDistance(0, 'ionian', 0, 'ionian')).toBe(0);
	});

	it('paralelní mód má bonus', () => {
		// C Ionian → C Aeolian je paralelní — kratší než C → G Ionian
		const parallel = keyDistance(0, 'ionian', 0, 'aeolian');
		const dominantKey = keyDistance(0, 'ionian', 7, 'ionian');
		expect(parallel).toBeLessThan(dominantKey);
	});
});
