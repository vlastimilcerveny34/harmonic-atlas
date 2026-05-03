import { diatonicChords, canonicalChordLabel } from './chords.js';
import { keyDistance, fifthsDistance } from './keys.js';
import { MODES } from './modes.js';
import type { ModeName, Quality } from './modes.js';

export type BridgeType = 'pivot' | 'secondaryDominant' | 'directDominant' | 'chromaticMediant';

export interface BridgeChord {
	pc: number;
	quality: Quality;
	label: string;
}

export interface ModulationBridge {
	type: BridgeType;
	chord: BridgeChord;
	fromRole: string;   // role in source key, or "" for non-pivot
	toRole: string;     // role in target key
	description: string;
}

export interface ModulationPath {
	bridge: ModulationBridge;
	example: BridgeChord[];  // 3-4 chord progression demonstrating the modulation
}

export function findModulationPaths(
	fromTonic: number, fromMode: ModeName,
	toTonic: number, toMode: ModeName,
): ModulationPath[] {
	if (fromTonic === toTonic && fromMode === toMode) return [];

	const fromSet = diatonicChords(fromTonic, fromMode);
	const toSet = diatonicChords(toTonic, toMode);
	const paths: ModulationPath[] = [];

	const fromI = fromSet[0];
	const toI = toSet[0];
	const toV = toSet.find(d => d.degree === 4);

	// 1. PIVOT CHORDS — diatonic in both keys
	fromSet.forEach(fromChord => {
		const inTo = toSet.find(d => d.pc === fromChord.pc && d.quality === fromChord.quality);
		if (!inTo) return;
		// Skip the new tonic itself as a "pivot" — that's just landing
		if (inTo.degree === 0 && fromChord.degree !== 0) {
			// from chord = some role in source, to role = I in target — still useful!
		}
		paths.push({
			bridge: {
				type: 'pivot',
				chord: { pc: fromChord.pc, quality: fromChord.quality, label: fromChord.name },
				fromRole: fromChord.roman,
				toRole: inTo.roman,
				description: 'Sdílený diatonický akord — most',
			},
			example: [
				{ pc: fromI.pc, quality: fromI.quality, label: fromI.name },
				{ pc: fromChord.pc, quality: fromChord.quality, label: fromChord.name },
				...(toV ? [{ pc: toV.pc, quality: toV.quality === 'M' ? '7' as Quality : toV.quality, label: canonicalChordLabel(toV.pc, toV.quality === 'M' ? '7' : toV.quality) }] : []),
				{ pc: toI.pc, quality: toI.quality, label: toI.name },
			],
		});
	});

	// 2. SECONDARY DOMINANT OF NEW TONIC — V7 of toTonic
	const v7Pc = (toTonic + 7) % 12;
	paths.push({
		bridge: {
			type: 'secondaryDominant',
			chord: { pc: v7Pc, quality: '7', label: canonicalChordLabel(v7Pc, '7') },
			fromRole: '',
			toRole: 'V7 → I',
			description: 'Tonicizace cílové tóniky přes její dominantu',
		},
		example: [
			{ pc: fromI.pc, quality: fromI.quality, label: fromI.name },
			{ pc: v7Pc, quality: '7', label: canonicalChordLabel(v7Pc, '7') },
			{ pc: toI.pc, quality: toI.quality, label: toI.name },
		],
	});

	// 3. DIRECT DOMINANT — major V (without 7th) of new tonic
	if (v7Pc !== fromI.pc) {
		paths.push({
			bridge: {
				type: 'directDominant',
				chord: { pc: v7Pc, quality: 'M', label: canonicalChordLabel(v7Pc, 'M') },
				fromRole: '',
				toRole: 'V → I',
				description: 'Přímá dominanta cílové tóniky (jednodušší než V7)',
			},
			example: [
				{ pc: fromI.pc, quality: fromI.quality, label: fromI.name },
				{ pc: v7Pc, quality: 'M', label: canonicalChordLabel(v7Pc, 'M') },
				{ pc: toI.pc, quality: toI.quality, label: toI.name },
			],
		});
	}

	// 4. CHROMATIC MEDIANT — when new tonic is M3 or m3 from old tonic
	const intervalToTarget = ((toTonic - fromTonic) % 12 + 12) % 12;
	if ([3, 4, 8, 9].includes(intervalToTarget)) {
		const intLabel = intervalToTarget === 3 ? '+m3' : intervalToTarget === 4 ? '+M3' : intervalToTarget === 8 ? '−M3' : '−m3';
		paths.push({
			bridge: {
				type: 'chromaticMediant',
				chord: { pc: toI.pc, quality: toI.quality, label: toI.name },
				fromRole: '',
				toRole: `přímá mediantní mod. (${intLabel})`,
				description: 'Cílová tónika v chromatickém terciovém vztahu — překvapivý posun',
			},
			example: [
				{ pc: fromI.pc, quality: fromI.quality, label: fromI.name },
				{ pc: toI.pc, quality: toI.quality, label: toI.name },
			],
		});
	}

	return paths;
}

export { keyDistance };

// ─── Multi-step modulation paths (for distant keys, ≥4 fifths apart) ──────────

export interface MultiStepPath {
	via: { tonicPc: number; modeName: ModeName; label: string };
	example: BridgeChord[];
}

const NOTE_NAMES_MULTI = ['C','C#','D','Eb','E','F','F#','G','Ab','A','Bb','B'];

function getBestLegExample(
	fromTonic: number, fromMode: ModeName,
	toTonic: number, toMode: ModeName,
): BridgeChord[] | null {
	const paths = findModulationPaths(fromTonic, fromMode, toTonic, toMode);
	const best = paths.find(p => p.bridge.type === 'pivot')
		?? paths.find(p => p.bridge.type === 'secondaryDominant')
		?? paths[0];
	return best?.example ?? null;
}

export function findMultiStepPaths(
	fromTonic: number, fromMode: ModeName,
	toTonic: number, toMode: ModeName,
): MultiStepPath[] {
	const dist = fifthsDistance(fromTonic, toTonic);
	if (dist < 4 || fromTonic === toTonic) return [];

	const results: MultiStepPath[] = [];

	for (let midTonic = 0; midTonic < 12; midTonic++) {
		if (midTonic === fromTonic || midTonic === toTonic) continue;
		const d1 = fifthsDistance(fromTonic, midTonic);
		const d2 = fifthsDistance(midTonic, toTonic);
		if (d1 > 3 || d2 > 3) continue;

		const midMode = fromMode;
		const leg1 = getBestLegExample(fromTonic, fromMode, midTonic, midMode);
		const leg2 = getBestLegExample(midTonic, midMode, toTonic, toMode);
		if (!leg1 || !leg2) continue;

		// Merge: skip duplicate junction chord
		const combined: BridgeChord[] = [...leg1];
		for (let i = 0; i < leg2.length; i++) {
			const c = leg2[i];
			const last = combined[combined.length - 1];
			if (i === 0 && c.pc === last.pc && c.quality === last.quality) continue;
			combined.push(c);
		}

		results.push({
			via: {
				tonicPc: midTonic,
				modeName: midMode,
				label: NOTE_NAMES_MULTI[midTonic] + ' ' + MODES[midMode].label,
			},
			example: combined,
		});
	}

	// Sort: prefer balanced paths (d1 close to d2), then by total fifths
	results.sort((a, b) => {
		const da1 = fifthsDistance(fromTonic, a.via.tonicPc);
		const da2 = fifthsDistance(a.via.tonicPc, toTonic);
		const db1 = fifthsDistance(fromTonic, b.via.tonicPc);
		const db2 = fifthsDistance(b.via.tonicPc, toTonic);
		const balanceA = Math.abs(da1 - da2);
		const balanceB = Math.abs(db1 - db2);
		return balanceA - balanceB || (da1 + da2) - (db1 + db2);
	});

	return results;
}
