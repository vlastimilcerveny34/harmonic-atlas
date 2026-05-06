# Harmony Mapper 🎵

A visual, interactive tool for exploring music harmony, chord progressions, and modulations.

## 🚀 Live Demo
Try the app directly in your browser: **[harmonymapper.com](https://harmonymapper.com)**

## 🤖 The Story: Built 100% with AI
I am not a programmer and I don't know how to write code. However, I really wanted a visual aid for exploring music theory. So, I decided to use AI (like ChatGPT/Claude) to build this entire project from scratch.

This repository is proof of what a non-coder can create over a weekend with a good idea and AI assistance. Feel free to explore the code, fork it, or use it for your own learning!

## ✨ Features
* **Interactive Chord Circle:** Visualize chords based on your chosen Tonic and Mode (Ionian, Dorian, Phrygian, Lydian, Mixolydian, Aeolian, Locrian). Diatonic motion is **mode-aware** — each mode has its own functional-move logic.
* **Harmonic Lenses:** Toggle different relationship types as colored arrows on the circle:
  * *Diatonic motion* — functional moves within the key
  * *Dominant resolution* — V7 → I (and V → i)
  * *Secondary dominants* — V7/ii, V7/iii, V7/IV…
  * *Tritone substitution* — dom7 ↔ dom7 a tritone away
  * *Modal interchange* — chords borrowed from the parallel mode
  * *Chromatic mediant* — same-quality chords ±M3/±m3
  * *Modal cadence* — the defining cadence of the current mode (e.g. ♭VII→I in Mixolydian, ♭II→i in Phrygian)
* **Chord Variations:** Extend any chord with maj7, m7, 6, add9, sus4, 9th, etc., and add the exact variation to your progression.
* **Bridge Function:**
  * *Between keys* — pivot chords, direct dominants, secondary dominants, chromatic mediants, and multi-step paths via intermediate keys
  * *Between chords* — ranked harmonic paths using the active lenses with voice-leading scoring
* **Preset Library:** Load classic progressions across Pop/Rock/J-pop, Cadences, Cycles, Reharmonizations, and Modulations — including *12-Bar Blues*, *Coltrane Changes*, *Royal Road (王道)*, *Axis Progression*, *Andalusian Cadence*, *Pachelbel / Kanon*, and more.
* **Progression Builder:** Click chords to build your progression, listen to it in the browser (Salamander Grand Piano samples), auto-decorate with extended chords (`+ COLOR`), and export as a MIDI file.
* **Voice-leading hint:** Toggle voice-leading data on outgoing relationships — common tones (♢) and total half-step movement (½) — to find the smoothest chord transitions.

## 🛠️ How to run locally
If you want to run this project on your own computer:
1. Clone the repository: `git clone https://github.com/vlastimilcerveny34/harmony-mapper.git`
2. Install dependencies: `npm install` *(or `yarn install`)*
3. Start the local server: `npm run dev` *(or `npm start`)*

## 🤝 Contributing
Since I am not a developer, the code might not be perfectly optimized. If you are a developer and see room for improvement (refactoring, performance, new features), feel free to open an Issue or submit a Pull Request!

## 📄 License
This project is open-source and available under the **MIT License**.
