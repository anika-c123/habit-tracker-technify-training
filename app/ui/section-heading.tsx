import type { ReactNode } from "react";

// The four accent colors a heading's wavy underline can use. Tailwind only
// generates classes it can see written out in full, so they're listed here.
const waveColors = {
  sky: "text-sky",
  lavender: "text-lavender",
  coral: "text-coral",
  green: "text-green",
};

type Props = {
  children: ReactNode;
  color: keyof typeof waveColors;
};

// A big serif section heading with a short wavy line underneath.
export function SectionHeading({ children, color }: Props) {
  return (
    <div className="flex flex-col gap-1">
      <h2 className="text-3xl font-medium tracking-tight">{children}</h2>
      <svg
        aria-hidden
        viewBox="0 0 72 8"
        className={`h-2 w-[72px] ${waveColors[color]}`}
        fill="none"
      >
        <path
          d="M1 5 C 7 1, 11 1, 17 5 S 29 9, 35 5 S 47 1, 53 5 S 65 9, 71 5"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}
