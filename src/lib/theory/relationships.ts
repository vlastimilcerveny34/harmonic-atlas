import { diatonicChords, isDiatonic, type DiatonicChord } from './chords.js';
import { MODES } from './modes.js';
import type { Quality, ModeName } from './modes.js';

// Compute roman label for a borrowed chord, with ♭/♯ prefix when its root
// differs from the home key's chord at the same degree (e.g. ♭III, ♭VI, ♭VII).
function borrowedRoman(chord: DiatonicChord, homeSet: DiatonicChord[]): string {
	const home = homeSet[chord.degree];
	if (!home) return chord.roman;
	const diff = ((chord.pc - home.pc) % 12 + 12) % 12;
	let prefix = '';
	if (diff === 11) prefix = '♭';
	else if (diff === 1) prefix = '♯';
	return prefix + chord.roman;
}

export type RelType = 'dominant' | 'tritoneSub' | 'diatonic' | 'modalInterchange' | 'chromaticMediant' | 'secondaryDominant' | 'modalCadence';

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
	modalCadence:      boolean;
}

// Per-mode functional moves (degree → target degrees), ordered by strength/frequency.
// Each mode has its own logic — Ionian's V→I doesn't apply to Mixolydian (where v is minor).
const FUNCTIONAL_MOVES_BY_MODE: Record<ModeName, Record<number, number[]>> = {
	// Ionian: I ii iii IV V vi vii° — classic functional harmony
	ionian: {
		0: [1, 3, 4, 5, 2],    // I    → ii IV V vi iii
		1: [4, 5, 3, 6],       // ii   → V vi IV vii°
		2: [5, 3, 0],          // iii  → vi IV I
		3: [4, 1, 0, 5, 2],    // IV   → V ii I vi iii
		4: [0, 5, 1, 3],       // V    → I vi ii (deceptive) IV (rock retrograde)
		5: [1, 3, 4, 0, 2],    // vi   → ii IV V I iii
		6: [0, 4],             // vii° → I V
	},
	// Dorian: i ii ♭III IV v vi° ♭VII — IV is the signature, ♭VII→i is the modal cadence
	dorian: {
		0: [3, 6, 4, 2, 1],    // i    → IV ♭VII v ♭III ii
		1: [4, 6, 3, 0],       // ii   → v ♭VII IV i
		2: [3, 6, 5, 0],       // ♭III → IV ♭VII vi° i
		3: [0, 6, 4, 1],       // IV   → i ♭VII v ii (signature)
		4: [0, 6, 3, 1],       // v    → i ♭VII IV ii (weak v, no leading tone)
		5: [6, 0, 4],          // vi°  → ♭VII i v
		6: [0, 3, 4],          // ♭VII → i IV v (PRIMARY cadence)
	},
	// Phrygian: i ♭II ♭III iv v° ♭VI ♭vii — ♭II→i is the iconic Phrygian cadence
	phrygian: {
		0: [1, 6, 3, 2, 5],    // i    → ♭II ♭vii iv ♭III ♭VI
		1: [0, 2, 3],          // ♭II  → i ♭III iv (Phrygian cadence)
		2: [3, 6, 5, 0],       // ♭III → iv ♭vii ♭VI i
		3: [2, 1, 0, 6],       // iv   → ♭III ♭II i ♭vii
		4: [0, 5, 6],          // v°   → i ♭VI ♭vii (rare)
		5: [6, 0, 1],          // ♭VI  → ♭vii i ♭II
		6: [0, 2, 5],          // ♭vii → i ♭III ♭VI
	},
	// Lydian: I II iii ♯iv° V vi vii — II is the Lydian signature, V→I still works
	lydian: {
		0: [1, 4, 5, 2, 6],    // I    → II V vi iii vii (II is signature)
		1: [4, 0, 2],          // II   → V I iii (acts like V/V)
		2: [5, 1, 0],          // iii  → vi II I
		3: [4, 0],             // ♯iv° → V I
		4: [0, 5, 1, 2],       // V    → I vi II iii
		5: [1, 4, 0, 2],       // vi   → II V I iii
		6: [0, 2, 5],          // vii  → I iii vi (subtonic)
	},
	// Mixolydian: I ii iii° IV v vi ♭VII — ♭VII→I is primary (no leading tone)
	mixolydian: {
		0: [6, 3, 4, 5, 1],    // I    → ♭VII IV v vi ii (♭VII first as signature)
		1: [4, 6, 3, 0],       // ii   → v ♭VII IV I
		2: [3, 6],             // iii° → IV ♭VII (rare)
		3: [0, 6, 4, 1],       // IV   → I ♭VII v ii (strong cadential)
		4: [3, 6, 0, 1],       // v    → IV ♭VII I ii (v→I weak)
		5: [1, 3, 6, 0],       // vi   → ii IV ♭VII I
		6: [0, 3, 4],          // ♭VII → I IV v (PRIMARY cadence)
	},
	// Aeolian: i ii° ♭III iv v ♭VI ♭VII — ♭VII→i and iv→i carry the modal weight
	aeolian: {
		0: [3, 6, 5, 4, 2, 1], // i    → iv ♭VII ♭VI v ♭III ii°
		1: [4, 0],             // ii°  → v i (rare)
		2: [5, 6, 3, 0],       // ♭III → ♭VI ♭VII iv i
		3: [6, 4, 0, 2],       // iv   → ♭VII v i ♭III (strong subdominant)
		4: [0, 5, 6, 3],       // v    → i ♭VI ♭VII iv (weak in pure Aeolian)
		5: [6, 3, 2, 1],       // ♭VI  → ♭VII iv ♭III ii°
		6: [0, 3, 5, 2],       // ♭VII → i iv ♭VI ♭III (PRIMARY modal cadence)
	},
	// Locrian: i° ♭II ♭iii iv ♭V ♭VI ♭vii — unstable mode, moves are exploratory
	locrian: {
		0: [1, 5, 6, 3, 2],    // i°   → ♭II ♭VI ♭vii iv ♭iii
		1: [0, 2, 3],          // ♭II  → i° ♭iii iv
		2: [3, 5, 0],          // ♭iii → iv ♭VI i°
		3: [4, 2, 0],          // iv   → ♭V ♭iii i°
		4: [3, 5, 0],          // ♭V   → iv ♭VI i°
		5: [6, 1, 0],          // ♭VI  → ♭vii ♭II i°
		6: [0, 2],             // ♭vii → i° ♭iii
	},
};

// Characteristic cadence(s) of each mode — the moves that DEFINE the mode's sound.
// Pairs of [fromDegree, toDegree]. Highlighted as a separate arrow type.
const MODAL_CADENCES: Record<ModeName, Array<[number, number]>> = {
	ionian:     [[4, 0]],            // V → I (authentic)
	dorian:     [[6, 0], [3, 0]],    // ♭VII → i, IV → i
	phrygian:   [[1, 0]],            // ♭II → i (Phrygian cadence)
	lydian:     [[1, 0]],            // II → I (Lydian)
	mixolydian: [[6, 0], [3, 0]],    // ♭VII → I, IV → I
	aeolian:    [[6, 0], [3, 0]],    // ♭VII → i, iv → i
	locrian:    [[1, 0]],            // ♭II → i°
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
			// Tonic is always set[0] — guaranteed to exist
			const tonic = set[0];
			push(targetPc, tonic.quality, 'dominant', `V7 → ${tonic.roman}`);
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
		push(subPc, '7', 'tritoneSub', '');
	}

	// 3. DIATONIC FUNCTIONAL MOTION (mode-aware)
	if (lenses.diatonic && fromIsDiatonic) {
		const fd = set.findIndex(d => d.pc === fromChord.pc && d.quality === fromChord.quality);
		if (fd >= 0) {
			const moves = FUNCTIONAL_MOVES_BY_MODE[modeName] ?? FUNCTIONAL_MOVES_BY_MODE.ionian;
			(moves[fd] ?? []).forEach(td => {
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
					push(p.pc, p.quality, 'modalInterchange', borrowedRoman(p, set));
				}
			});
		}

		if (fromIsInParallel && !fromIsDiatonic) {
			// Source is a borrowed chord → show home-key chords as return paths
			set.forEach(d => {
				if (!parallelSet.some(p => p.pc === d.pc && p.quality === d.quality)) {
					push(d.pc, d.quality, 'modalInterchange', `return → ${d.roman}`);
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
			push(pc, fromChord.quality, 'chromaticMediant', `${dir}${interval}`);
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

	// 7. MODAL CADENCE — characteristic cadential motion of the current mode.
	// Highlights what makes each mode sound like itself (e.g. ♭VII→I in Mixolydian).
	if (lenses.modalCadence && fromIsDiatonic) {
		const fd = set.findIndex(d => d.pc === fromChord.pc && d.quality === fromChord.quality);
		if (fd >= 0) {
			(MODAL_CADENCES[modeName] ?? []).forEach(([fromDeg, toDeg]) => {
				if (fd !== fromDeg) return;
				const t = set[toDeg];
				if (t) push(t.pc, t.quality, 'modalCadence', `${set[fd].roman} → ${t.roman}`);
			});
		}
	}

	return rels;
}
