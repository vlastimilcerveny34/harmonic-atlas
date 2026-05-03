import { describe, it, expect } from 'vitest';
import { MODES, romanFor, MODE_NAMES } from '../../src/lib/theory/modes.js';

describe('MODES', () => {
	it('každý mód má 7 intervalů a 7 kvalit', () => {
		for (const name of MODE_NAMES) {
			const m = MODES[name];
			expect(m.intervals).toHaveLength(7);
			expect(m.qualities).toHaveLength(7);
		}
	});

	it('každý mód začíná na 0', () => {
		for (const name of MODE_NAMES) {
			expect(MODES[name].intervals[0]).toBe(0);
		}
	});

	it('iónský mód má správné intervaly', () => {
		expect(MODES.ionian.intervals).toEqual([0, 2, 4, 5, 7, 9, 11]);
	});

	it('dórský mód má správné kvality', () => {
		// m m M M m d M
		expect(MODES.dorian.qualities).toEqual(['m','m','M','M','m','d','M']);
	});
});

describe('romanFor', () => {
	it('major = velká písmena', () => {
		expect(romanFor(0, 'M')).toBe('I');
		expect(romanFor(4, 'M')).toBe('V');
	});

	it('minor = malá písmena', () => {
		expect(romanFor(1, 'm')).toBe('ii');
		expect(romanFor(5, 'm')).toBe('vi');
	});

	it('diminished = malá + °', () => {
		expect(romanFor(6, 'd')).toBe('vii°');
		expect(romanFor(1, 'd')).toBe('ii°');
	});
});
