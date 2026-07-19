import React from "react";
import {
  AbsoluteFill,
  Audio,
  Sequence,
  staticFile,
} from "remotion";
import {
  TransitionSeries,
  linearTiming,
} from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { Background } from "./lib";

import { Hook } from "./scenes/Hook";
import { Problem } from "./scenes/Problem";
import { Architecture } from "./scenes/Architecture";
import { Oracle } from "./scenes/Oracle";
import { Trader } from "./scenes/Trader";
import { Live } from "./scenes/Live";
import { Outro } from "./scenes/Outro";

// Per-scene frame budget — sized to fit each vo mp3 with ~40-frame tail.
// At 60 fps: hook 12s, problem 12s, arch 11s, oracle 12s, trader 12s,
// live 11s, outro 11s → ~81 seconds finished.
export const D = {
  hook: 720,
  problem: 720,
  architecture: 660,
  oracle: 720,
  trader: 720,
  live: 660,
  outro: 660,
};

const T = 24; // crossfade length
const timing = linearTiming({ durationInFrames: T });

export const TOTAL =
  D.hook + D.problem + D.architecture + D.oracle + D.trader + D.live + D.outro
  - 6 * T;

const SceneVO: React.FC<{
  children: React.ReactNode;
  vo: string;
  lead?: number;
}> = ({ children, vo, lead = 22 }) => (
  <AbsoluteFill>
    {children}
    <Sequence from={lead}>
      <Audio src={staticFile(vo)} />
    </Sequence>
  </AbsoluteFill>
);

export const SkylineDemo: React.FC = () => (
  <AbsoluteFill>
    <Background />
    <TransitionSeries>
      <TransitionSeries.Sequence durationInFrames={D.hook}>
        <SceneVO vo="voiceover/1.mp3">
          <Hook dur={D.hook} />
        </SceneVO>
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={fade()} timing={timing} />

      <TransitionSeries.Sequence durationInFrames={D.problem}>
        <SceneVO vo="voiceover/2.mp3">
          <Problem dur={D.problem} />
        </SceneVO>
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={fade()} timing={timing} />

      <TransitionSeries.Sequence durationInFrames={D.architecture}>
        <SceneVO vo="voiceover/3.mp3">
          <Architecture dur={D.architecture} />
        </SceneVO>
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={fade()} timing={timing} />

      <TransitionSeries.Sequence durationInFrames={D.oracle}>
        <SceneVO vo="voiceover/4.mp3">
          <Oracle dur={D.oracle} />
        </SceneVO>
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={fade()} timing={timing} />

      <TransitionSeries.Sequence durationInFrames={D.trader}>
        <SceneVO vo="voiceover/5.mp3">
          <Trader dur={D.trader} />
        </SceneVO>
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={fade()} timing={timing} />

      <TransitionSeries.Sequence durationInFrames={D.live}>
        <SceneVO vo="voiceover/6.mp3">
          <Live dur={D.live} />
        </SceneVO>
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={fade()} timing={timing} />

      <TransitionSeries.Sequence durationInFrames={D.outro}>
        <SceneVO vo="voiceover/7.mp3" lead={26}>
          <Outro dur={D.outro} />
        </SceneVO>
      </TransitionSeries.Sequence>
    </TransitionSeries>
  </AbsoluteFill>
);
