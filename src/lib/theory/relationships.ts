import { diatonicChords, isDiatonic } from './chords.js';
import { MODES } from './modes.js';
import type { Quality, ModeName } from './modes.js';

export type RelType = 'dominant' | 'tritoneSub' | 'diatonic' | 'modalInterchange' | 'chromaticMediant' | 'secondaryDominant';

export interface Relationship {
	from: { pc: number; quality: Quality };
	to:   { pc: number; quality: Quality };
	type: RelType;
	label: string;
}

export interface Lenses {
	diatonic:          boolean;
	dominant:          boolean;
	tritoneSub:        boolean;
	modalInterchange:  boolean;
	chromaticMediant:  boolean;
	secondaryDominant: boolean;
}

// Functional moves within diatonic set (degree → target degrees).
// Ionian-centric — accurate for Ionian/Aeolian, approximate for other modes.
// Ordered roughly by strength/frequency of use.
const FUNCTIONAL_MOVES: Record<number, number[]> = {
	0: [1, 3, 4, 5, 2],    // I   → ii IV V vi iii
	1: [4, 5, 3, 6],       // ii  → V vi IV vii°
	2: [5, 3, 0],          // iii → vi IV I
	3: [4, 1, 0, 5, 2],    // IV  → V ii I vi iii
	4: [0, 5, 1],          // V   → I vi ii (deceptive)
	5: [1, 3, 4, 0, 2],    // vi  → ii IV V I iii
	6: [0, 4],             // vii°→ I V
};

export function outgoingRelationships(
	fromChord: { pc: number; quality: Quality },
	tonicPc: number,
	modeName: ModeName,
	lenses: Lenses,
): Relationship[] {
	const rels: Relationship[] = [];
	const seen = new Set<string>();

	const push = (toPc: number, toQ: Quality, type: RelType, label: string) => {
		if (toPc === fromChord.pc && toQ === fromChord.quality) return;
		const k = `${toPc}-${toQ}-${type}`;
		if (seen.has(k)) return;
		seen.add(k);
		rels.push({ from: fromChord, to: { pc: toPc, quality: toQ }, type, label });
	};

	const set = diatonicChords(tonicPc, modeName);
	const fromIsDiatonic = isDiatonic(fromChord.pc, fromChord.quality, set);

	// 1. DOMINANT RESOLUTION — V7 resolves to tonic (primary dominant only)
	// Secondary dominants (V7/x for other diatonic targets) are handled by lens #6.
	if (lenses.dominant && fromChord.quality === '7') {
		const targetPc = (fromChord.pc + 5) % 12;
		if (targetPc === tonicPc) {
			const match = set.find(d => d.pc === targetPc);
			if (match) {
				push(targetPc, match.quality, 'dominant', `V7 → ${match.roman}`);
			} else {
				push(targetPc, 'M', 'dominant', 'V7 → I');
				push(targetPc, 'm', 'dominant', 'V7 → i');
			}
		}
	}

	// Major V resolving as dominant (when diatonic)
	if (lenses.dominant && fromChord.quality === 'M' && fromIsDiatonic) {
		const fd = set.find(d => d.pc === fromChord.pc && d.quality === fromChord.quality);
		if (fd?.roman === 'V') {
			push(tonicPc, set[0].quality, 'dominant', `V → ${set[0].roman}`);
		}
	}

	// 2. TRITONE SUBSTITUTION — dom7 ↔ dom7 a tritone (6 semitones) away
	if (lenses.tritoneSub && fromChord.quality === '7') {
		const subPc = (fromChord.pc + 6) % 12;
		push(subPc, '7', 'tritoneSub', 'tritone sub');
	}

	// 3. DIATONIC FUNCTIONAL MOTION
	if (lenses.diatonic && fromIsDiatonic) {
		const fd = set.findIndex(d => d.pc === fromChord.pc && d.quality === fromChord.quality);
		if (fd >= 0) {
			(FUNCTIONAL_MOVES[fd] ?? []).forEach(td => {
				const t = set[td];
				if (t) push(t.pc, t.quality, 'diatonic', `${set[fd].roman} → ${t.roman}`);
			});
		}
	}

	// 4. MODAL INTERCHANGE — borrow from the parallel mode (bidirectional)
	if (lenses.modalInterchange) {
		const parallelName = MODES[modeName].parallel;
		const parallelSet = diatonicChords(tonicPc, parallelName);
		const fromIsInParallel = parallelSet.some(p => p.pc === fromChord.pc && p.quality === fromChord.quality);

		if (!fromIsInParallel || fromIsDiatonic) {
			// Source is a home-key chord → show borrowed chords from parallel mode as targets
			parallelSet.forEach(p => {
				if (!isDiatonic(p.pc, p.quality, set)) {
					push(p.pc, p.quality, 'modalInterchange', `borrowed (${MODES[parallelName].label})`);
				}
			});
		}

		if (fromIsInParallel && !fromIsDiatonic) {
			// Source is a borrowed chord → show home-key chords as return paths
			set.forEach(d => {
				if (!parallelSet.some(p => p.pc === d.pc && p.quality === d.quality)) {
					push(d.pc, d.quality, 'modalInterchange', `return (${MODES[modeName].label})`);
				}
			});
		}
	}

	// 5. CHROMATIC MEDIANT — same quality, ±M3 or ±m3
	if (lenses.chromaticMediant && (fromChord.quality === 'M' || fromChord.quality === 'm')) {
		([3, 4, -3, -4] as const).forEach(iv => {
			const pc = ((fromChord.pc + iv) % 12 + 12) % 12;
			const dir = iv > 0 ? '↑' : '↓';
			const interval = Math.abs(iv) === 3 ? 'm3' : 'M3';
			push(pc, fromChord.quality, 'chromaticMediant', `chromatic mediant (${dir}${interval})`);
		});
	}

	// 6. SECONDARY DOMINANTS — bidirectional
	// a) From a diatonic chord: show which dom7 chords can tonicize each diatonic target
	//    e.g. from C major in C major: → D7 (V7/V), A7 (V7/ii), B7 (V7/iii), C7 (V7/IV), E7 (V7/vi)
	// b) From a dom7 chord: show its resolution target (the diatonic chord it tonicizes)
	//    e.g. D7 → G (V7/V→V), A7 → Dm (V7/ii→ii)
	if (lenses.secondaryDominant) {
		if (fromIsDiatonic) {
			// Show available secondary dominant chords as outgoing options
			set.forEach(target => {
				if (target.quality === 'd') return; // no V7/vii°
				const v7Pc = (target.pc + 7) % 12;
				if (v7Pc === fromChord.pc && fromChord.quality === '7') return; // chord is itself the sec.dom.
				// Skip V7→I when dominant lens is on (primary dominant handles it)
				if (target.pc === tonicPc && lenses.dominant) return;
				push(v7Pc, '7', 'secondaryDominant', `V7/${target.roman}`);
			});
		}
		if (fromChord.quality === '7') {
			// Show where this dom7 resolves as a secondary dominant
			const targetPc = (fromChord.pc + 5) % 12;
			const target = set.find(d => d.pc === targetPc);
			if (target && target.quality !== 'd' && targetPc !== tonicPc) {
				push(targetPc, target.quality, 'secondaryDominant', `V7/${target.roman} → ${target.name}`);
			}
		}
	}

	return rels;
}
