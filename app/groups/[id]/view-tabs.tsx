"use client";

import { useState, type ReactNode } from "react";

type Props = {
  today: ReactNode;
  week: ReactNode;
};

// Switches between the Today and Week views. Both are already rendered and
// passed in as props, so switching is instant: nothing new is fetched.
export function ViewTabs({ today, week }: Props) {
  const [tab, setTab] = useState<"today" | "week">("today");

  // Plain text tabs; the active one is blue with a blue underline.
  const tabClass = (active: boolean) =>
    `flex h-11 items-center border-b-2 text-xl ${
      active ? "border-sky text-sky-ink" : "border-transparent text-muted"
    }`;

  return (
    <div className="flex flex-col gap-5">
      <div role="tablist" className="flex gap-8">
        <button
          type="button"
          role="tab"
          aria-selected={tab === "today"}
          onClick={() => setTab("today")}
          className={tabClass(tab === "today")}
        >
          Today
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "week"}
          onClick={() => setTab("week")}
          className={tabClass(tab === "week")}
        >
          Week
        </button>
      </div>
      <div role="tabpanel">{tab === "today" ? today : week}</div>
    </div>
  );
}
