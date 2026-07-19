import type { SVGProps } from "react";

export type MarkProps = SVGProps<SVGSVGElement> & { size?: number };

// A — Meridian: a horizontal baseline with a small rising vector.
// Reads as "the line between markets." Skyline as the horizon.
export function MarkMeridian({ size = 24, ...rest }: MarkProps): React.ReactElement {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      stroke="currentColor"
      aria-hidden
      {...rest}
    >
      <path d="M3 21 H29" strokeWidth="1.4" opacity="0.5" strokeLinecap="round" />
      <path d="M8 26 H24" strokeWidth="1.2" opacity="0.3" strokeLinecap="round" />
      <path
        d="M9 21 L14 15 L19 18 L26 8"
        strokeWidth="2.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="26" cy="8" r="1.8" fill="currentColor" stroke="none" />
    </svg>
  );
}

// B — Consensus Ring: an assay-office ring of book ticks converging on a single dot.
// Many quotes, one truth.
export function MarkConsensus({ size = 24, ...rest }: MarkProps): React.ReactElement {
  const ticks = Array.from({ length: 16 }, (_, i) => (i * 360) / 16);
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      stroke="currentColor"
      aria-hidden
      {...rest}
    >
      <circle cx="16" cy="16" r="13" strokeWidth="0.9" opacity="0.35" />
      {ticks.map((deg, i) => (
        <line
          key={i}
          x1="16"
          y1="1.6"
          x2="16"
          y2={i % 2 === 0 ? 4.4 : 3.6}
          strokeWidth={i % 4 === 0 ? 1.4 : 0.9}
          opacity={i % 4 === 0 ? 0.9 : 0.5}
          strokeLinecap="round"
          transform={`rotate(${deg} 16 16)`}
        />
      ))}
      <circle cx="16" cy="16" r="3" fill="currentColor" stroke="none" />
    </svg>
  );
}

// C — Chevron S: an "S" carved as two chevrons — up-line and down-line —
// reads as both letter and trading vector.
export function MarkChevronS({ size = 24, ...rest }: MarkProps): React.ReactElement {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      stroke="currentColor"
      aria-hidden
      {...rest}
    >
      <path
        d="M25 8 H14 A5 5 0 0 0 14 18 H18 A5 5 0 0 1 18 28 H7"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M23 4 L27 4 L27 8"
        strokeWidth="1.4"
        opacity="0.55"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9 28 L5 28 L5 24"
        strokeWidth="1.4"
        opacity="0.55"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// D — Prism: a monoline triangle emitting a single beam. Light through the prism,
// one direction out. Abstract Skyline as the "point of resolution."
export function MarkPrism({ size = 24, ...rest }: MarkProps): React.ReactElement {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      stroke="currentColor"
      aria-hidden
      {...rest}
    >
      <path
        d="M16 3.5 L28 23.5 L4 23.5 Z"
        strokeWidth="1.9"
        strokeLinejoin="round"
        opacity="0.85"
      />
      <path
        d="M16 3.5 L16 23.5"
        strokeWidth="0.8"
        opacity="0.4"
      />
      <path
        d="M22 23.5 L27 30"
        strokeWidth="1.8"
        strokeLinecap="round"
        opacity="0.85"
      />
      <circle cx="27" cy="30" r="1.8" fill="currentColor" stroke="none" />
    </svg>
  );
}

export const MARKS = [
  {
    id: "meridian",
    label: "Meridian",
    sub: "A horizon line with a rising vector and a fixed point. Reads as 'the line between markets' — Skyline as the horizon.",
    Mark: MarkMeridian,
  },
  {
    id: "consensus",
    label: "Consensus Ring",
    sub: "An assay-ring of book ticks converging on a single dot. Many quotes, one truth. Closest to the oracle's spirit.",
    Mark: MarkConsensus,
  },
  {
    id: "chevron-s",
    label: "Chevron S",
    sub: "The S carved as two chevrons — up-line and down-line. Reads as both letter and trading vector.",
    Mark: MarkChevronS,
  },
  {
    id: "prism",
    label: "Prism",
    sub: "A monoline prism emitting a single beam. Light from many sources, one direction out. Abstract, no letter.",
    Mark: MarkPrism,
  },
] as const;

export type MarkId = (typeof MARKS)[number]["id"];
