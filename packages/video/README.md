# @skyline/video

Remotion + ElevenLabs demo video for the Skyline submission.

## Setup

```bash
pnpm install
```

## Generate the voiceover (once)

Requires an ElevenLabs API key. Voice defaults to `CwhRBWXzGAHq8TQ4Fs17`
("Roger"); override with `VOICE=<voice_id>`.

```bash
XI=your_elevenlabs_key node generate-vo.mjs
```

Writes seven mp3 files to `public/voiceover/1.mp3` … `7.mp3` — one per scene.

## Preview

```bash
pnpm dev              # opens Remotion Studio
```

## Render the final mp4

```bash
pnpm render           # → out/skyline-demo.mp4
```

## Composition

- `id`: `SkylineDemo`
- `1920 × 1080`, `60 fps`
- ~81 seconds finished (Hook 12s → Problem 12s → Architecture 11s → Oracle 12s → Trader 12s → Live 11s → Outro 11s, minus six 24-frame crossfades)

## Files

```
src/
├── index.ts          # registerRoot(RemotionRoot)
├── Root.tsx          # Composition definition
├── Demo.tsx          # scene sequencing, per-scene <Audio>
├── theme.ts          # palette + font loaders (IBM Plex Sans, JetBrains Mono)
├── lib.tsx           # Background, FadeUp, useSceneFade, GradientText, MeridianMark
├── index.css         # `@import "tailwindcss";`
└── scenes/
    ├── Hook.tsx
    ├── Problem.tsx
    ├── Architecture.tsx
    ├── Oracle.tsx
    ├── Trader.tsx
    ├── Live.tsx
    └── Outro.tsx
generate-vo.mjs       # ElevenLabs TTS driver (7 mp3s → public/voiceover/)
```
