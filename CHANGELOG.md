# Changelog

## v1.3 — 2026-05-06

### Mode-aware functional harmony

The diatonic-motion lens now uses a **per-mode** functional-moves table.
Previously a single Ionian-centric table was applied to all 7 modes, which produced
misleading arrows in modes like Mixolydian (where V is minor, no leading tone, and
the true cadence is ♭VII → I).

Each mode now has its own set of degree-to-degree moves ordered by characteristic
strength:

- **Ionian** — classic functional harmony (V→I, IV→V, ii→V…)
- **Dorian** — IV→i signature, ♭VII→i cadence
- **Phrygian** — ♭II→i Phrygian cadence
- **Lydian** — II is the signature chord, V→I still works
- **Mixolydian** — ♭VII→I and IV→I primary; v→I weakened
- **Aeolian** — ♭VII→i and iv→i carry the cadential weight
- **Locrian** — exploratory moves for an unstable mode

### New lens: Modal cadence

A new toggle highlights the **defining cadence** of the current mode as a
distinct arrow type (saffron color `#c4a04a`). Examples:

- Mixolydian: `♭VII → I`, `IV → I`
- Phrygian: `♭II → i`
- Dorian: `♭VII → i`, `IV → i`
- Aeolian: `♭VII → i`, `iv → i`

Default OFF — toggle in the *Lenses* panel.

### Smaller fixes

- **Diatonic motion** now includes `V → IV` (rock retrograde). Classical theory
  rejects this move; rock and pop use it constantly (Sweet Home Alabama,
  Country Roads, etc.). Added to all modes where it makes sense.
- **Secondary dominants lens**: removed an incorrect skip that suppressed
  arrows like `F → G7` (V7/I) when the *Dominant resolution* lens was also
  active. The two lenses draw different directions and don't duplicate.
- **HelpModal**: corrected the description of the circle of fifths layout
  (rings are minor / major / dom7 from outer to inner — earlier text had
  them reversed). Bridge and Preset Library sections updated to mention
  *direct dominants* and the *modulation* preset category.

---

## v1.2 (and earlier)

Pre-changelog development. See git history once the repo is initialized.
