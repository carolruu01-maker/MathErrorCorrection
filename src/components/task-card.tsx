import Image from "next/image";
import Link from "next/link";
import type { WorksheetTask } from "@/lib/types";
import {
  formatDateTime,
  isParentConfirmableQuestion,
  taskStatusLabel,
} from "@/lib/utils";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

function statusTone(status: WorksheetTask["status"]) {
  if (status === "completed" || status === "confirmed" || status === "ready_for_practice")
    return "success" as const;
  if (
    status === "needs_confirmation" ||
    status === "needs_teacher_review" ||
    status === "generating" ||
    status === "recognizing"
  )
    return "warning" as const;
  if (status === "save_failed") return "danger" as const;
  return "primary" as const;
}

interface TaskCardProps {
  task: WorksheetTask;
  studentName: string;
  primaryHref: string;
  primaryLabel: string;
  showInternal?: boolean;
}

export function TaskCard({
  task,
  studentName,
  primaryHref,
  primaryLabel,
  showInternal = false,
}: TaskCardProps) {
  const confirmable = task.questions.filter(isParentConfirmableQuestion);
  const wrongCount = task.questions.filter(
    (q) =>
      q.teacherMarkingResult === "incorrect" ||
      q.conflictStatus === "student_error" ||
      q.conflictStatus === "teacher_marking_conflict"
  ).length;
  const pendingConfirm = confirmable.filter((q) => q.reviewStatus === "pending").length;

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-3">
        <div>
          <CardTitle className="line-clamp-1">{task.sourceFileName}</CardTitle>
          <p className="mt-1 text-sm text-text-muted">
            {studentName} · {formatDateTime(task.uploadedAt)}
          </p>
        </div>
        <Badge tone={statusTone(task.status)}>{taskStatusLabel[task.status]}</Badge>
      </CardHeader>
      <CardContent>
        <div className="flex gap-4">
          <div className="relative h-20 w-16 shrink-0 overflow-hidden rounded-md border border-border bg-bg">
            <Image
              src={task.sourceImageUrl}
              alt="作业缩略图"
              fill
              className="object-cover"
              unoptimized
            />
          </div>
          <div className="min-w-0 flex-1 space-y-2 text-sm">
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-text-muted">
              <span>识别题目 {task.questions.length}</span>
              <span>错题 {wrongCount}</span>
              <span>待确认 {pendingConfirm}</span>
            </div>
            {showInternal && task.saveStatus === "failed" ? (
              <p className="text-xs text-warning">
                同步失败：{task.saveErrorMessage ?? "历史记录未写入"}
              </p>
            ) : null}
            <div className="flex flex-wrap gap-2 pt-1">
              <Link href={primaryHref}>
                <Button size="sm">{primaryLabel}</Button>
              </Link>
              <Link href={`/tasks/${task.id}`}>
                <Button size="sm" variant="outline">
                  查看详情
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
