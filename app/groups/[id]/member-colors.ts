// Each member gets one of the accent colors, by their position in the member
// list, so the same person has the same color in every view on the page.
// Class names are written out in full so Tailwind can find them.
const palette = [
  // dot = filled (done), ring = outline only (not done yet)
  { dot: "bg-sky", ring: "border-sky", avatar: "bg-sky/15 text-sky-ink" },
  { dot: "bg-lavender", ring: "border-lavender", avatar: "bg-lavender/20 text-lavender-ink" },
  { dot: "bg-coral", ring: "border-coral", avatar: "bg-coral/15 text-coral-ink" },
  { dot: "bg-green", ring: "border-green", avatar: "bg-green/15 text-green-ink" },
];

export function memberColor(index: number) {
  return palette[index % palette.length];
}
