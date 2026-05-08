import { FIFTHS_PCS } from '$lib/theory/chords.js';
import type { Quality } from '$lib/theory/modes.js';

export interface ChordNode {
	pc: number;
	quality: Quality;
	x: number;
	y: number;
	r: number;
	spoke: number;
}

export const VIEW = 800;
export const CENTER = { x: VIEW / 2, y: VIEW / 2 };

export const R_MAJ = 258;
export const R_DOM = 179;
export const R_MIN = 330;

export function buildCircleNodes(): ChordNode[] {
	const nodes: ChordNode[] = [];
	FIFTHS_PCS.forEach((pc, i) => {
		const angle = (i / 12) * Math.PI * 2 - Math.PI / 2;
		const cx = Math.cos(angle);
		const sx = Math.sin(angle);
		nodes.push({ pc, quality: 'M',  x: CENTER.x + cx * R_MAJ, y: CENTER.y + sx * R_MAJ, r: 29, spoke: i });
		nodes.push({ pc, quality: '7',  x: CENTER.x + cx * R_DOM, y: CENTER.y + sx * R_DOM, r: 21, spoke: i });
		const minPc = (pc + 9) % 12;
		nodes.push({ pc: minPc, quality: 'm', x: CENTER.x + cx * R_MIN, y: CENTER.y + sx * R_MIN, r: 25, spoke: i });
	});
	return nodes;
}

export function curvedPath(
	from: { x: number; y: number },
	to:   { x: number; y: number },
	bowAmount = 0.15,
): string {
	const dx = to.x - from.x;
	const dy = to.y - from.y;
	const dist = Math.sqrt(dx * dx + dy * dy);
	const mx = (from.x + to.x) / 2;
	const my = (from.y + to.y) / 2;
	const cdx = mx - CENTER.x;
	const cdy = my - CENTER.y;
	const cdist = Math.sqrt(cdx * cdx + cdy * cdy) || 1;
	const push = Math.min(dist * bowAmount, 80);
	const cpx = mx + (cdx / cdist) * push;
	const cpy = my + (cdy / cdist) * push;
	return `M ${from.x} ${from.y} Q ${cpx} ${cpy} ${to.x} ${to.y}`;
}
