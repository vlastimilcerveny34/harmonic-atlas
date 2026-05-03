import { describe, it, expect } from 'vitest';
import { outgoingRelationships } from '../../src/lib/theory/relationships.js';

const ALL_ON: Parameters<typeof outgoingRelationships>[3] = {
	diatonic: true,
	dominant: true,
	tritoneSub: true,
	modalInterchange: true,
	chromaticMediant: true,
	secondaryDominant: true,
};

const ONLY = (keys: string[]) => ({
	diatonic: keys.includes('diatonic'),
	dominant: keys.includes('dominant'),
	tritoneSub: keys.includes('tritoneSub'),
	modalInterchange: keys.includes('modalInterchange'),
	chromaticMediant: keys.includes('chromaticMediant'),
	secondaryDominant: keys.includes('secondaryDominant'),
});

describe('dominant resolution', () => {
	it('G7 → C (V7 → I v C Ionian)', () => {
		const rels = outgoingRelationships({ pc: 7, quality: '7' }, 0, 'ionian', ONLY(['dominant']));
		expect(rels.some(r => r.to.pc === 0 && r.to.quality === 'M' && r.type === 'dominant')).toBe(true);
	});

	it('D7 → G (V7 → I v G Ionian)', () => {
		const rels = outgoingRelationships({ pc: 2, quality: '7' }, 7, 'ionian', ONLY(['dominant']));
		expect(rels.some(r => r.to.pc === 7 && r.type === 'dominant')).toBe(true);
	});

	it('G dominant (major V) → C v C Ionian', () => {
		const rels = outgoingRelationships({ pc: 7, quality: 'M' }, 0, 'ionian', ONLY(['dominant']));
		expect(rels.some(r => r.to.pc === 0 && r.type === 'dominant')).toBe(true);
	});

	it('non-V major akord nevytváří dominant šipku', () => {
		// F major (IV) v C Ionian není V, nemá dominant šipku
		const rels = outgoingRelationships({ pc: 5, quality: 'M' }, 0, 'ionian', ONLY(['dominant']));
		expect(rels.filter(r => r.type === 'dominant')).toHaveLength(0);
	});
});

describe('tritone substitution', () => {
	it('G7 → Db7 (tritone away = 6 semitones)', () => {
		const rels = outgoingRelationships({ pc: 7, quality: '7' }, 0, 'ionian', ONLY(['tritoneSub']));
		expect(rels.some(r => r.to.pc === 1 && r.to.quality === '7' && r.type === 'tritoneSub')).toBe(true);
	});

	it('minor akord nemá tritone sub', () => {
		const rels = outgoingRelationships({ pc: 9, quality: 'm' }, 0, 'ionian', ONLY(['tritoneSub']));
		expect(rels.filter(r => r.type === 'tritoneSub')).toHaveLength(0);
	});
});

describe('diatonic motion', () => {
	it('I → ii, IV, V, vi v C Ionian', () => {
		const rels = outgoingRelationships({ pc: 0, quality: 'M' }, 0, 'ionian', ONLY(['diatonic']));
		const targets = rels.filter(r => r.type === 'diatonic').map(r => r.to.pc);
		expect(targets).toContain(2);  // ii = Dm
		expect(targets).toContain(5);  // IV = F
		expect(targets).toContain(7);  // V = G
		expect(targets).toContain(9);  // vi = Am
	});

	it('ii → V, vi v C Ionian (základ pro I-ii-vi-IV)', () => {
		const rels = outgoingRelationships({ pc: 2, quality: 'm' }, 0, 'ionian', ONLY(['diatonic']));
		const targets = rels.filter(r => r.type === 'diatonic').map(r => r.to.pc);
		expect(targets).toContain(7);  // V = G
		expect(targets).toContain(9);  // vi = Am
	});

	it('V → I, vi v C Ionian', () => {
		const rels = outgoingRelationships({ pc: 7, quality: 'M' }, 0, 'ionian', ONLY(['diatonic']));
		const targets = rels.filter(r => r.type === 'diatonic').map(r => r.to.pc);
		expect(targets).toContain(0);  // I
		expect(targets).toContain(9);  // vi (deceptive)
	});

	it('vi → ii, IV v C Ionian', () => {
		const rels = outgoingRelationships({ pc: 9, quality: 'm' }, 0, 'ionian', ONLY(['diatonic']));
		const targets = rels.filter(r => r.type === 'diatonic').map(r => r.to.pc);
		expect(targets).toContain(2);  // ii = Dm
		expect(targets).toContain(5);  // IV = F
	});

	it('nediatonický akord nemá diatonic šipky', () => {
		const rels = outgoingRelationships({ pc: 1, quality: 'M' }, 0, 'ionian', ONLY(['diatonic']));
		expect(rels.filter(r => r.type === 'diatonic')).toHaveLength(0);
	});
});

describe('modal interchange', () => {
	it('C Ionian → Eb major (borrowed z C Aeolian = bIII)', () => {
		const rels = outgoingRelationships({ pc: 0, quality: 'M' }, 0, 'ionian', ONLY(['modalInterchange']));
		const types = rels.filter(r => r.type === 'modalInterchange').map(r => r.to.pc);
		expect(types).toContain(3);   // Eb = pc 3 (bIII z Aeolian)
	});

	it('diatonické akordy nejsou v modalInterchange výstupu', () => {
		// G major (V) je diatonické v C Ionian → nemá být jako borrowed
		const rels = outgoingRelationships({ pc: 0, quality: 'M' }, 0, 'ionian', ONLY(['modalInterchange']));
		const borrowed = rels.filter(r => r.type === 'modalInterchange');
		expect(borrowed.some(r => r.to.pc === 7 && r.to.quality === 'M')).toBe(false);
	});

	it('Gm (borrowed) → C major jako return path do C Ionian', () => {
		// Gm je borrowed z C Aeolian (v), z Gm musí být cesta zpět do C Ionian
		const rels = outgoingRelationships({ pc: 7, quality: 'm' }, 0, 'ionian', ONLY(['modalInterchange']));
		const targets = rels.filter(r => r.type === 'modalInterchange').map(r => r.to.pc);
		expect(targets).toContain(0);  // C major (tónika)
		expect(targets).toContain(7);  // G major (V)
	});

	it('Gm (borrowed) neukazuje na borrowed akordy (žádné Cm, Eb atd.)', () => {
		const rels = outgoingRelationships({ pc: 7, quality: 'm' }, 0, 'ionian', ONLY(['modalInterchange']));
		const targets = rels.filter(r => r.type === 'modalInterchange');
		// Eb (pc=3) a Ab (pc=8) jsou v C Aeolian, ale ne v C Ionian → nemají být return targets
		expect(targets.some(r => r.to.pc === 3)).toBe(false);  // Eb
		expect(targets.some(r => r.to.pc === 8)).toBe(false);  // Ab
	});
});

describe('chromatic mediant', () => {
	it('C major → E major (+M3) a Ab major (-M3) a Eb major (+m3) a A major (-m3)', () => {
		const rels = outgoingRelationships({ pc: 0, quality: 'M' }, 0, 'ionian', ONLY(['chromaticMediant']));
		const targets = rels.filter(r => r.type === 'chromaticMediant').map(r => r.to.pc);
		expect(targets).toContain(4);   // E (+M3)
		expect(targets).toContain(8);   // Ab (-M3)
		expect(targets).toContain(3);   // Eb (+m3)
		expect(targets).toContain(9);   // A (-m3)
	});

	it('zachovává kvalitu akordu', () => {
		const rels = outgoingRelationships({ pc: 0, quality: 'M' }, 0, 'ionian', ONLY(['chromaticMediant']));
		rels.filter(r => r.type === 'chromaticMediant').forEach(r => {
			expect(r.to.quality).toBe('M');
		});
	});

	it('dom7 akord nemá chromatic mediant', () => {
		const rels = outgoingRelationships({ pc: 7, quality: '7' }, 0, 'ionian', ONLY(['chromaticMediant']));
		expect(rels.filter(r => r.type === 'chromaticMediant')).toHaveLength(0);
	});
});

describe('secondary dominants', () => {
	// V C Ionian: diatonické akordy jsou C M, D m, E m, F M, G M, A m, B d
	// Secondary dominants (V7/x) = akord 7 půltónů nad každým cílem
	// A7  (pc=9)  → V7/ii  → Dm
	// B7  (pc=11) → V7/iii → Em
	// C7  (pc=0)  → V7/IV  → F
	// D7  (pc=2)  → V7/V   → G
	// E7  (pc=4)  → V7/vi  → Am

	it('A7 (V7/ii) z C Ionian se sekundárním dominantovým pohledem', () => {
		const rels = outgoingRelationships({ pc: 9, quality: '7' }, 0, 'ionian', ONLY(['secondaryDominant']));
		expect(rels.some(r => r.to.pc === 2 && r.to.quality === 'm' && r.type === 'secondaryDominant')).toBe(true);
	});

	it('B7 (V7/iii) se sekundárním dominantovým pohledem', () => {
		const rels = outgoingRelationships({ pc: 11, quality: '7' }, 0, 'ionian', ONLY(['secondaryDominant']));
		expect(rels.some(r => r.to.pc === 4 && r.to.quality === 'm' && r.type === 'secondaryDominant')).toBe(true);
	});

	it('C7 (V7/IV) se sekundárním dominantovým pohledem', () => {
		const rels = outgoingRelationships({ pc: 0, quality: '7' }, 0, 'ionian', ONLY(['secondaryDominant']));
		expect(rels.some(r => r.to.pc === 5 && r.to.quality === 'M' && r.type === 'secondaryDominant')).toBe(true);
	});

	it('D7 (V7/V) se sekundárním dominantovým pohledem', () => {
		const rels = outgoingRelationships({ pc: 2, quality: '7' }, 0, 'ionian', ONLY(['secondaryDominant']));
		expect(rels.some(r => r.to.pc === 7 && r.to.quality === 'M' && r.type === 'secondaryDominant')).toBe(true);
	});

	it('E7 (V7/vi) se sekundárním dominantovým pohledem', () => {
		const rels = outgoingRelationships({ pc: 4, quality: '7' }, 0, 'ionian', ONLY(['secondaryDominant']));
		expect(rels.some(r => r.to.pc === 9 && r.to.quality === 'm' && r.type === 'secondaryDominant')).toBe(true);
	});

	it('G7 (diatonické V7) s dominant+secondaryDominant nezduplikuje G7 → C', () => {
		const rels = outgoingRelationships({ pc: 7, quality: '7' }, 0, 'ionian', ONLY(['dominant', 'secondaryDominant']));
		const domRels = rels.filter(r => r.to.pc === 0 && r.to.quality === 'M');
		// Může být nejvýše jednou (přes dominant lens, ne secondary dominant)
		expect(domRels.length).toBeLessThanOrEqual(1);
	});

	it('žádný secondary dominant nesměřuje na vii° (B°)', () => {
		// V7/vii° se v praxi nepoužívá, tedy F#7 by neměl být secondary dominant v C Ionian
		const rels = outgoingRelationships({ pc: 6, quality: '7' }, 0, 'ionian', ONLY(['secondaryDominant']));
		// F#7 → B° by bylo V7/vii°, to nechceme
		expect(rels.some(r => r.to.pc === 11 && r.to.quality === 'd')).toBe(false);
	});
});

describe('žádné duplicity a žádná self-reference', () => {
	it('výstup neobsahuje zdrojový akord', () => {
		const rels = outgoingRelationships({ pc: 0, quality: 'M' }, 0, 'ionian', ALL_ON);
		expect(rels.some(r => r.to.pc === 0 && r.to.quality === 'M')).toBe(false);
	});

	it('kombinace (pc, quality, type) jsou unikátní', () => {
		const rels = outgoingRelationships({ pc: 0, quality: 'M' }, 0, 'ionian', ALL_ON);
		const keys = rels.map(r => `${r.to.pc}-${r.to.quality}-${r.type}`);
		const unique = new Set(keys);
		expect(unique.size).toBe(keys.length);
	});
});
