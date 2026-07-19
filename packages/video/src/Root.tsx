import { Composition } from "remotion";
import { SkylineDemo, TOTAL } from "./Demo";
import "./index.css";

export const RemotionRoot: React.FC = () => (
  <Composition
    id="SkylineDemo"
    component={SkylineDemo}
    durationInFrames={TOTAL}
    fps={60}
    width={1920}
    height={1080}
  />
);
