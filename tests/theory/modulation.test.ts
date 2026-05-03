import { describe, it, expect } from 'vitest';
import { findModulationPaths } from '../../src/lib/theory/modulation.js';

describe('findModulationPaths', () => {
	it('C → C (stejný klíč) vrátí prázdné pole', () => {
		expect(findModulationPaths(0, 'ionian', 0, 'ionian')).toEqual([]);
	});

	it('C Ionian → F Ionian najde pivotní akordy (Dm, F, Am, C)', () => {
		const paths = findModulationPaths(0, 'ionian', 5, 'ionian');
		const pivots = paths.filter(p => p.bridge.type === 'pivot').map(p => p.bridge.chord.label);
		expect(pivots).toContain('Dm');
		expect(pivots).toContain('F');
		expect(pivots).toContain('Am');
		expect(pivots).toContain('C');
	});

	it('C → F obsahuje sekundární dominantu cílové tóniky (C7)', () => {
		const paths = findModulationPaths(0, 'ionian', 5, 'ionian');
		const sd = paths.find(p => p.bridge.type === 'secondaryDominant');
		expect(sd).toBeDefined();
		expect(sd!.bridge.chord.pc).toBe(0);
		expect(sd!.bridge.chord.quality).toBe('7');
	});

	it('C → E (chromatická medianta) vrací chromaticMediant bridge', () => {
		const paths = findModulationPaths(0, 'ionian', 4, 'ionian');
		expect(paths.some(p => p.bridge.type === 'chromaticMediant')).toBe(true);
	});

	it('C → G nemá chromaticMediant (P5 není terciový vztah)', () => {
		const paths = findModulationPaths(0, 'ionian', 7, 'ionian');
		expect(paths.some(p => p.bridge.type === 'chromaticMediant')).toBe(false);
	});

	it('každá cesta má příklad o nejméně 2 akordech', () => {
		const paths = findModulationPaths(0, 'ionian', 5, 'ionian');
		paths.forEach(p => {
			expect(p.example.length).toBeGreaterThanOrEqual(2);
		});
	});
});
