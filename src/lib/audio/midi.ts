// Minimal MIDI file writer — no dependencies. Generates a single-track MIDI file
// with chords played in sequence (one chord per beat, quarter notes).

import { chordIntervals } from '$lib/theory/chords.js';
import { variationIntervals, type ChordVariation } from '$lib/theory/extensions.js';
import type { Quality } from '$lib/theory/modes.js';

interface ChordRef { pc: number; quality: Quality; variation?: ChordVariation; }

const PPQ = 480; // pulses per quarter note

function variableLength(value: number): number[] {
	const bytes: number[] = [];
	let buf = value & 0x7f;
	while ((value >>= 7) > 0) {
		buf <<= 8;
		buf |= ((value & 0x7f) | 0x80);
	}
	while (true) {
		bytes.push(buf & 0xff);
		if (buf & 0x80) buf >>= 8;
		else break;
	}
	return bytes;
}

function chordMidiNotes(pc: number, quality: Quality, baseOct = 4, variation?: ChordVariation): number[] {
	// MIDI note number: C4 = 60. pitch class 0 (C) at octave N = 12*(N+1)
	const intervals = variation ? variationIntervals(variation) : chordIntervals(quality);
	return intervals.map(iv => 12 * (baseOct + 1) + pc + iv);
}

export function progressionToMidi(
	progression: ChordRef[],
	bpm = 100,
): Uint8Array {
	const events: number[] = [];

	// Tempo meta event (FF 51 03 tt tt tt) — microseconds per quarter
	const microsPerQuarter = Math.round(60000000 / bpm);
	events.push(0); // delta
	events.push(0xff, 0x51, 0x03);
	events.push((microsPerQuarter >> 16) & 0xff, (microsPerQuarter >> 8) & 0xff, microsPerQuarter & 0xff);

	// Time signature 4/4 (FF 58 04 nn dd cc bb)
	events.push(0); events.push(0xff, 0x58, 0x04, 0x04, 0x02, 0x18, 0x08);

	// Program change to acoustic grand piano (channel 0, program 0)
	events.push(0); events.push(0xc0, 0x00);

	const duration = PPQ; // quarter note per chord
	const velocity = 90;

	progression.forEach((chord) => {
		const notes = chordMidiNotes(chord.pc, chord.quality, 4, chord.variation);
		// All note-ons start simultaneously (delta=0 between them)
		notes.forEach((n) => {
			events.push(...variableLength(0));
			events.push(0x90, n, velocity); // note on, channel 0
		});
		// First note-off comes after `duration`, rest are simultaneous (delta=0)
		notes.forEach((n, j) => {
			events.push(...variableLength(j === 0 ? duration : 0));
			events.push(0x80, n, 0x40);
		});
	});

	// End of track (FF 2F 00)
	events.push(0); events.push(0xff, 0x2f, 0x00);

	// Track chunk
	const trackData = new Uint8Array(events);
	const trackLen = trackData.length;

	// Header chunk: "MThd" + length(6) + format(0) + ntrks(1) + division(PPQ)
	const header = new Uint8Array([
		0x4d, 0x54, 0x68, 0x64, // "MThd"
		0x00, 0x00, 0x00, 0x06,
		0x00, 0x00,             // format 0
		0x00, 0x01,             // 1 track
		(PPQ >> 8) & 0xff, PPQ & 0xff,
	]);

	const trackHeader = new Uint8Array([
		0x4d, 0x54, 0x72, 0x6b, // "MTrk"
		(trackLen >> 24) & 0xff, (trackLen >> 16) & 0xff, (trackLen >> 8) & 0xff, trackLen & 0xff,
	]);

	const result = new Uint8Array(header.length + trackHeader.length + trackData.length);
	result.set(header, 0);
	result.set(trackHeader, header.length);
	result.set(trackData, header.length + trackHeader.length);
	return result;
}

export function downloadMidi(progression: ChordRef[], filename = 'progression.mid', bpm = 100) {
	const data = progressionToMidi(progression, bpm);
	const blob = new Blob([data as BlobPart], { type: 'audio/midi' });
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = filename;
	document.body.appendChild(a);
	a.click();
	document.body.removeChild(a);
	URL.revokeObjectURL(url);
}
