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
  // "h1" for a page title (bigger), "h2" for a section (the default).
  as?: "h1" | "h2";
};

// A big serif heading with a short wavy line underneath.
export function SectionHeading({ children, color, as: Tag = "h2" }: Props) {
  return (
    // Page titles get more room so the wave clears letters like g and p.
    <div className={`flex flex-col ${Tag === "h1" ? "gap-3" : "gap-1"}`}>
      <Tag
        className={`font-medium tracking-tight ${Tag === "h1" ? "text-5xl" : "text-3xl"}`}
      >
        {children}
      </Tag>
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
