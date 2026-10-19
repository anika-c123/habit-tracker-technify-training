"use client";

import { dayLabel, lastSevenDays } from "@/lib/dates";
import { useToday } from "@/lib/use-today";
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
    <table className="w-full table-fixed text-sm">
      <caption className="px-4 pt-3 pb-2 text-left font-medium">{name}</caption>
      <thead>
        <tr>
          {/* Wider first column for names; the 7 day columns share the rest. */}
          <th scope="col" className="w-24 pl-4">
            <span className="sr-only">Member</span>
          </th>
          {days.map((date) => {
            const { weekday, day } = dayLabel(date);
            return (
              <th
                key={date}
                scope="col"
                className={`pb-1 text-center text-xs font-normal ${
                  date === today ? "font-semibold text-foreground" : "text-foreground/60"
                }`}
              >
                <span className="block">{weekday}</span>
                <span className="block">{day}</span>
              </th>
            );
          })}
          <th scope="col" className="w-2" aria-hidden />
        </tr>
      </thead>
      <tbody>
        {members.map((member) => (
          <tr key={member.userId}>
            <th scope="row" className="truncate py-1 pl-4 text-left font-normal">
              {member.userId === myUserId ? "You" : member.name}
            </th>
            {days.map((date) => {
              const done = isDone(member.userId, date);
              return (
                <td key={date} className="py-1">
                  <span
                    className={`mx-auto flex size-6 items-center justify-center rounded-md text-xs font-bold ${
                      done ? "bg-green-600 text-white" : "bg-foreground/8"
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
  );
}
