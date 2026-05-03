import { describe, it, expect } from 'vitest';
import { PRESETS, applyPreset } from '../../src/lib/theory/presets.js';

describe('presets', () => {
	it('všechny presety mají unikátní id', () => {
		const ids = PRESETS.map(p => p.id);
		expect(new Set(ids).size).toBe(ids.length);
	});

	it('každý preset má alespoň 2 kroky', () => {
		PRESETS.forEach(p => {
			expect(p.steps.length).toBeGreaterThanOrEqual(2);
		});
	});

	it('intervaly v presetech jsou v rozsahu 0–11', () => {
		PRESETS.forEach(p => {
			p.steps.forEach(s => {
				expect(s.interval).toBeGreaterThanOrEqual(0);
				expect(s.interval).toBeLessThan(12);
			});
		});
	});
});

describe('applyPreset', () => {
	it('aplikace na C dur (tonic=0) zachová interval', () => {
		const coltrane = PRESETS.find(p => p.id === 'coltrane')!;
		const result = applyPreset(coltrane, 0);
		expect(result[0].pc).toBe(0);   // I = C
		expect(result[1].pc).toBe(7);   // V7 = G7
		expect(result[2].pc).toBe(4);   // III = E
	});

	it('aplikace na G dur (tonic=7) transponuje', () => {
		const mixo = PRESETS.find(p => p.id === 'mixolydian-vamp')!;
		const result = applyPreset(mixo, 7);
		expect(result[0].pc).toBe(7);                // I = G
		expect(result[1].pc).toBe((7 + 10) % 12);    // bVII = F
		expect(result[2].pc).toBe(0);                // IV = C
		expect(result[3].pc).toBe(7);                // I = G
	});

	it('zachová kvalitu akordu', () => {
		const backdoor = PRESETS.find(p => p.id === 'backdoor')!;
		const result = applyPreset(backdoor, 0);
		expect(result[0].quality).toBe('m');  // iv = Fm
		expect(result[1].quality).toBe('7');  // bVII7 = Bb7
		expect(result[2].quality).toBe('M');  // I = C
	});
});
