import { describe, it, expect } from 'vitest';
import { voiceLeading } from '../../src/lib/theory/voiceLeading.js';

describe('voiceLeading', () => {
	it('C major → C major (stejný akord) má 3 společné tóny, žádný pohyb', () => {
		const vl = voiceLeading(0, 'M', 0, 'M');
		expect(vl.commonTones.sort()).toEqual([0, 4, 7]);
		expect(vl.totalDistance).toBe(0);
	});

	it('C major → F major má 1 společný tón (C) a 2 půltónové pohyby', () => {
		// C E G → F A C, common = C
		const vl = voiceLeading(0, 'M', 5, 'M');
		expect(vl.commonTones).toContain(0);  // C drží
		// E (4) → F (5) = +1, G (7) → A (9) = +2 → total 3
		expect(vl.totalDistance).toBe(3);
	});

	it('C major → G major má 1 společný tón (G)', () => {
		// C E G → G B D, common = G (pc 7)
		const vl = voiceLeading(0, 'M', 7, 'M');
		expect(vl.commonTones).toContain(7);
	});

	it('C major → Am má 2 společné tóny (C, E)', () => {
		// C E G → A C E, common = C, E
		const vl = voiceLeading(0, 'M', 9, 'm');
		expect(vl.commonTones.sort()).toEqual([0, 4]);
		// G (7) → A (9) = +2
		expect(vl.totalDistance).toBe(2);
	});

	it('C → Em má 2 společné tóny (E, G), velmi hladký přechod', () => {
		// C E G → E G B, common = E, G
		const vl = voiceLeading(0, 'M', 4, 'm');
		expect(vl.commonTones.sort()).toEqual([4, 7]);
		// C (0) → B (11) = -1
		expect(vl.totalDistance).toBe(1);
	});

	it('C → F# (tritonus) — žádný společný tón, větší vzdálenost', () => {
		const vl = voiceLeading(0, 'M', 6, 'M');
		expect(vl.commonTones).toEqual([]);
		expect(vl.totalDistance).toBeGreaterThan(0);
	});

	it('symetrické: C → Ab a C → E mají stejnou vzdálenost (oba chromatické medianty)', () => {
		// Chromatic mediants by měly mít podobnou voice leading
		const vl1 = voiceLeading(0, 'M', 8, 'M'); // C → Ab
		const vl2 = voiceLeading(0, 'M', 4, 'M'); // C → E
		expect(vl1.totalDistance).toBe(vl2.totalDistance);
	});
});
