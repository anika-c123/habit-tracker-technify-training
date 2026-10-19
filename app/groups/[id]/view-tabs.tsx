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

  const tabClass = (active: boolean) =>
    `flex h-11 flex-1 items-center justify-center rounded-md text-sm font-medium ${
      active ? "bg-background shadow-sm" : "text-foreground/60"
    }`;

  return (
    <div className="flex flex-col gap-3">
      <div role="tablist" className="flex gap-1 rounded-lg bg-foreground/8 p-1">
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
