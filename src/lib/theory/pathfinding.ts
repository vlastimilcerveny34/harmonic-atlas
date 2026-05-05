// Graph-based "Find a path" — finds K best chord progressions between two chords.
//
// Strategy:
//   1. Use outgoingRelationships() as the edge generator (graph is implicit)
//   2. Enumerate all simple paths up to maxLength via DFS
//   3. Score each path by harmonic cost + voice leading
//   4. Apply diversity filter so the K returned paths differ in character

import { outgoingRelationships } from './relationships.js';
import type { Lenses, RelType } from './relationships.js';
import { voiceLeading } from './voiceLeading.js';
import { canonicalChordLabel } from './chords.js';
import type { Quality, ModeName } from './modes.js';

export interface ChordRef {
	pc: number;
	quality: Quality;
}

export interface PathStep extends ChordRef {
	label: string;
	relType: RelType | 'start';   // how we arrived at this chord
	relLabel: string;
}

export interface ChordPath {
	steps: PathStep[];
	harmonicCost: number;
	voiceCost: number;
	totalCost: number;
	character: string;             // human-readable summary: "smooth", "jazzy", "chromatic"
}

// Cost per relationship type — lower = more natural / smoother
const REL_COST: Record<RelType, number> = {
	diatonic:          1.0,
	dominant:          1.0,
	secondaryDominant: 1.5,
	tritoneSub:        2.0,
	modalInterchange:  2.0,
	chromaticMediant:  2.5,
};

const VOICE_LEADING_FACTOR = 0.08;  // semitones contribute small fraction to total cost

function chordKey(c: ChordRef): string {
	return `${c.pc}-${c.quality}`;
}

function isSameChord(a: ChordRef, b: ChordRef): boolean {
	return a.pc === b.pc && a.quality === b.quality;
}

function characteriseChars(types: RelType[]): string {
	const counts: Partial<Record<RelType, number>> = {};
	types.forEach(t => { counts[t] = (counts[t] ?? 0) + 1; });

	if ((counts.chromaticMediant ?? 0) > 0)        return 'chromatic';
	if ((counts.tritoneSub ?? 0) > 0)              return 'jazzy';
	if ((counts.secondaryDominant ?? 0) >= 2)      return 'jazzy';
	if ((counts.modalInterchange ?? 0) > 0)        return 'borrowed';
	if ((counts.secondaryDominant ?? 0) === 1)     return 'classical';
	return 'smooth';
}

export function findChordPaths(
	from: ChordRef,
	to: ChordRef,
	tonicPc: number,
	modeName: ModeName,
	lenses: Lenses,
	options: { maxLength?: number; k?: number } = {},
): ChordPath[] {
	const maxLength = options.maxLength ?? 5;
	const k = options.k ?? 5;

	if (isSameChord(from, to)) return [];

	// Build neighbor function on demand using outgoingRelationships
	const getNeighbors = (chord: ChordRef): { to: ChordRef; type: RelType; label: string }[] => {
		const rels = outgoingRelationships(chord, tonicPc, modeName, lenses);
		return rels.map(r => ({ to: r.to, type: r.type, label: r.label }));
	};

	// DFS enumeration of all simple paths up to maxLength
	const allPaths: ChordPath[] = [];
	const visited = new Set<string>([chordKey(from)]);
	const startStep: PathStep = {
		...from,
		label: canonicalChordLabel(from.pc, from.quality),
		relType: 'start',
		relLabel: '',
	};

	function dfs(current: ChordRef, pathSoFar: PathStep[], harmonicCost: number, voiceCost: number) {
		if (pathSoFar.length > maxLength) return;
		if (allPaths.length > 200) return; // safety cap

		const neighbors = getNeighbors(current);
		for (const { to: next, type, label } of neighbors) {
			const key = chordKey(next);

			// Avoid revisiting chords (simple paths only)
			if (visited.has(key)) continue;

			const vl = voiceLeading(current.pc, current.quality, next.pc, next.quality);
			const stepHarmonic = REL_COST[type];
			const stepVoice = vl.totalDistance * VOICE_LEADING_FACTOR;

			const newStep: PathStep = {
				...next,
				label: canonicalChordLabel(next.pc, next.quality),
				relType: type,
				relLabel: label,
			};

			// Reached the target — record path
			if (isSameChord(next, to) && pathSoFar.length >= 2) {
				const finalSteps = [...pathSoFar, newStep];
				const totalH = harmonicCost + stepHarmonic;
				const totalV = voiceCost + stepVoice;
				allPaths.push({
					steps: finalSteps,
					harmonicCost: totalH,
					voiceCost: totalV,
					totalCost: totalH + totalV,
					character: characteriseChars(finalSteps.slice(1).map(s => s.relType as RelType)),
				});
				continue;
			}

			// Continue DFS
			visited.add(key);
			dfs(next, [...pathSoFar, newStep], harmonicCost + stepHarmonic, voiceCost + stepVoice);
			visited.delete(key);
		}
	}

	dfs(from, [startStep], 0, 0);

	// Sort by total cost ascending
	allPaths.sort((a, b) => a.totalCost - b.totalCost);

	// Diversity filter: pick K paths with different characters / shapes when possible
	const picked: ChordPath[] = [];
	const seenSignatures = new Set<string>();

	for (const path of allPaths) {
		// Signature = sequence of relation types, encodes the "shape" of the path
		const sig = path.steps.slice(1).map(s => s.relType).join('|');
		if (seenSignatures.has(sig)) continue;
		seenSignatures.add(sig);
		picked.push(path);
		if (picked.length >= k) break;
	}

	// If not enough diverse paths, fill from remaining best
	if (picked.length < k) {
		for (const path of allPaths) {
			if (picked.includes(path)) continue;
			picked.push(path);
			if (picked.length >= k) break;
		}
	}

	return picked;
}
