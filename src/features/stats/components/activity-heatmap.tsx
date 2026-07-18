"use client";

import { useMemo } from "react";

import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const WEEKS = 53;
const DAY_MS = 24 * 60 * 60 * 1000;

function isoDay(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function intensityClass(count: number, max: number): string {
  if (count === 0) return "bg-muted";
  const ratio = count / max;
  if (ratio > 0.75) return "bg-primary";
  if (ratio > 0.5) return "bg-primary/70";
  if (ratio > 0.25) return "bg-primary/45";
  return "bg-primary/25";
}

/**
 * GitHub-style contribution grid over the last ~53 weeks, driven by the day →
 * count activity map from the stats aggregation.
 */
export function ActivityHeatmap({ activity }: { activity: Map<string, number> }) {
  const { columns, max } = useMemo(() => {
    const today = new Date();
    // Start on the Sunday of the earliest visible week.
    const start = new Date(today.getTime() - (WEEKS * 7 - 1) * DAY_MS);
    start.setDate(start.getDate() - start.getDay());

    let peak = 1;
    const grid: { day: string; count: number }[][] = [];
    for (let week = 0; week < WEEKS; week += 1) {
      const column: { day: string; count: number }[] = [];
      for (let weekday = 0; weekday < 7; weekday += 1) {
        const date = new Date(start.getTime() + (week * 7 + weekday) * DAY_MS);
        if (date > today) continue;
        const day = isoDay(date);
        const count = activity.get(day) ?? 0;
        peak = Math.max(peak, count);
        column.push({ day, count });
      }
      grid.push(column);
    }
    return { columns: grid, max: peak };
  }, [activity]);

  return (
    <div className="overflow-x-auto">
      <div className="flex gap-1">
        {columns.map((column, weekIndex) => (
          <div key={weekIndex} className="flex flex-col gap-1">
            {column.map((cell) => (
              <Tooltip key={cell.day}>
                <TooltipTrigger
                  render={
                    <div
                      className={cn(
                        "size-2.5 rounded-[3px]",
                        intensityClass(cell.count, max),
                      )}
                    />
                  }
                />
                <TooltipContent>
                  {cell.count} agregados · {cell.day}
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
