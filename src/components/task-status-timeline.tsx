"use client";

import { TaskStatus } from "@/lib/types";
import {
  TIMELINE_STEPS,
  cn,
  getTimelineIndex,
  taskStatusLabel,
} from "@/lib/utils";

interface TaskStatusTimelineProps {
  status: TaskStatus;
  saveFailed?: boolean;
  onStepClick?: (step: TaskStatus) => void;
}

function stepTone(
  index: number,
  current: number,
  status: TaskStatus
): "done" | "current" | "pending" | "failed" {
  if (status === "save_failed" && index === current) return "done";
  if (index < current) return "done";
  if (index === current) {
    if (status === "needs_confirmation" || status === "needs_teacher_review") {
      return "pending";
    }
    return "current";
  }
  return "pending";
}

export function TaskStatusTimeline({
  status,
  saveFailed,
  onStepClick,
}: TaskStatusTimelineProps) {
  const current = getTimelineIndex(status);
  const visibleSteps = TIMELINE_STEPS.filter((step) => {
    if (step === "needs_teacher_review" && status !== "needs_teacher_review") {
      // still show if current or past review path; keep for clarity
      return true;
    }
    return true;
  });

  return (
    <div className="w-full">
      {saveFailed ? (
        <div className="mb-4 rounded-[10px] border border-warning/30 bg-warning-soft px-4 py-3 text-sm text-warning">
          错题暂未同步到历史记录，但仍可基于本次识别结果生成练习。
        </div>
      ) : null}

      {/* Desktop horizontal */}
      <ol className="hidden md:flex md:items-start md:gap-0">
        {visibleSteps.map((step, index) => {
          const tone = stepTone(index, current, status);
          const clickable = tone === "done" && onStepClick;
          return (
            <li key={step} className="relative flex flex-1 flex-col items-center">
              {index < visibleSteps.length - 1 ? (
                <div
                  className={cn(
                    "absolute left-1/2 top-3 h-0.5 w-full",
                    index < current ? "bg-success" : "bg-border"
                  )}
                />
              ) : null}
              <button
                type="button"
                disabled={!clickable}
                onClick={() => onStepClick?.(step)}
                className={cn(
                  "relative z-10 flex h-6 w-6 items-center justify-center rounded-full border-2 text-[10px] font-semibold",
                  tone === "done" && "border-success bg-success text-white",
                  tone === "current" && "border-primary bg-primary text-white scale-110",
                  tone === "pending" &&
                    index === current &&
                    "border-warning bg-warning text-white scale-110",
                  tone === "pending" &&
                    index !== current &&
                    "border-border bg-white text-text-muted",
                  clickable && "cursor-pointer hover:ring-2 hover:ring-success/30"
                )}
                aria-current={index === current ? "step" : undefined}
              >
                {index + 1}
              </button>
              <span
                className={cn(
                  "mt-2 px-1 text-center text-xs",
                  index === current ? "font-semibold text-text" : "text-text-muted"
                )}
              >
                {taskStatusLabel[step]}
              </span>
            </li>
          );
        })}
      </ol>

      {/* Mobile vertical */}
      <ol className="flex flex-col gap-0 md:hidden">
        {visibleSteps.map((step, index) => {
          const tone = stepTone(index, current, status);
          const clickable = tone === "done" && onStepClick;
          return (
            <li key={step} className="relative flex gap-3 pb-4 last:pb-0">
              {index < visibleSteps.length - 1 ? (
                <div
                  className={cn(
                    "absolute left-[11px] top-6 h-full w-0.5",
                    index < current ? "bg-success" : "bg-border"
                  )}
                />
              ) : null}
              <button
                type="button"
                disabled={!clickable}
                onClick={() => onStepClick?.(step)}
                className={cn(
                  "relative z-10 mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 text-[10px] font-semibold",
                  tone === "done" && "border-success bg-success text-white",
                  tone === "current" && "border-primary bg-primary text-white",
                  tone === "pending" &&
                    index === current &&
                    "border-warning bg-warning text-white",
                  tone === "pending" &&
                    index !== current &&
                    "border-border bg-white text-text-muted"
                )}
              >
                {index + 1}
              </button>
              <div>
                <p
                  className={cn(
                    "text-sm",
                    index === current ? "font-semibold text-text" : "text-text-muted"
                  )}
                >
                  {taskStatusLabel[step]}
                </p>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
