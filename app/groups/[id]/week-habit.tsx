"use client";

import { dayLabel, lastSevenDays } from "@/lib/dates";
import { useToday } from "@/lib/use-today";
import { memberColor } from "./member-colors";
import type { Completion, Member } from "./today-habit";

type Props = {
  name: string;
  members: Member[];
  myUserId: string;
  // Everyone's check-offs for this habit over the past week or so.
  completions: Completion[];
};

// A members × 7-days grid for one habit. Read-only: past days can't be edited.
export function WeekHabit({ name, members, myUserId, completions }: Props) {
  const today = useToday();
  // The columns depend on the user's local "today", so wait for the browser.
  if (today === null) return null;

  const days = lastSevenDays(today);
  const isDone = (userId: string, date: string) =>
    completions.some((c) => c.userId === userId && c.date === date);

  return (
    // Tables don't round their corners well, so a rounded white box wraps it.
    <div className="rounded-2xl bg-white pb-4">
      <table className="w-full table-fixed">
        <caption className="px-5 pt-5 pb-3 text-left font-heading text-xl">{name}</caption>
        <thead>
          <tr>
            {/* Wider first column for names; the 7 day columns share the rest. */}
            <th scope="col" className="w-24 pl-5">
              <span className="sr-only">Member</span>
            </th>
            {days.map((date) => {
              const { weekday, day } = dayLabel(date);
              return (
                <th
                  key={date}
                  scope="col"
                  className={`pb-1 text-center text-sm font-normal ${
                    date === today ? "font-semibold text-sky-ink" : "text-muted"
                  }`}
                >
                  <span className="block">{weekday}</span>
                  <span className="block">{day}</span>
                </th>
              );
            })}
            <th scope="col" className="w-3" aria-hidden />
          </tr>
        </thead>
        <tbody>
          {members.map((member, index) => (
            <tr key={member.userId}>
              <th scope="row" className="truncate py-1 pl-5 text-left font-normal">
                <span
                  aria-hidden
                  className={`mr-1.5 inline-block size-2.5 rounded-full ${memberColor(index).dot}`}
                />
                {member.userId === myUserId ? "You" : member.name}
              </th>
              {days.map((date) => {
                const done = isDone(member.userId, date);
                return (
                  <td key={date} className="py-1">
                    <span
                      className={`mx-auto flex size-6 items-center justify-center rounded-full text-xs ${
                        done ? "bg-green text-white" : "bg-sky-pale"
                      }`}
                    >
                      <span aria-hidden>{done ? "✓" : ""}</span>
                      <span className="sr-only">{done ? "done" : "not done"}</span>
                    </span>
                  </td>
                );
              })}
              <td aria-hidden />
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
