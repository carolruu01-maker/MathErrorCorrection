import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type {
  ConflictStatus,
  MarkingResult,
  MathVerdict,
  PracticeDifficulty,
  PracticeStatus,
  RecognitionConfidence,
  ReviewStatus,
  TaskStatus,
} from "./types";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function uid(prefix = "id"): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}_${Date.now().toString(36)}`;
}

export function formatDateTime(iso: string): string {
  const date = new Date(iso);
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function formatDate(iso: string): string {
  const date = new Date(iso);
  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export const taskStatusLabel: Record<TaskStatus, string> = {
  uploaded: "已上传",
  recognizing: "AI识别中",
  needs_confirmation: "等待确认",
  needs_teacher_review: "数学冲突复核",
  confirmed: "已确认",
  save_failed: "已确认",
  ready_for_practice: "可生成练习",
  generating: "练习生成中",
  assigned: "已布置",
  in_progress: "学生作答中",
  submitted: "已提交",
  completed: "已完成",
};

export const markingLabel: Record<MarkingResult, string> = {
  correct: "正确",
  incorrect: "错误",
  unclear: "不清晰",
};

export const mathVerdictLabel: Record<MathVerdict, string> = {
  correct: "正确",
  incorrect: "错误",
  insufficient_information: "条件不足",
};

export const conflictLabel: Record<ConflictStatus, string> = {
  none: "无冲突",
  student_error: "学生错误",
  teacher_marking_conflict: "教师批改冲突",
  needs_review: "需复核",
};

export const reviewStatusLabel: Record<ReviewStatus, string> = {
  pending: "待确认",
  parent_confirmed: "家长已确认",
  teacher_confirmed: "老师已确认",
  teacher_corrected: "老师已修正",
};

export const confidenceLabel: Record<RecognitionConfidence, string> = {
  high: "高",
  medium: "中",
  low: "低",
};

export const difficultyLabel: Record<PracticeDifficulty, string> = {
  basic: "基础",
  standard: "标准",
  advanced: "提高",
};

export const practiceStatusLabel: Record<PracticeStatus, string> = {
  draft: "草稿",
  assigned: "已布置",
  in_progress: "进行中",
  submitted: "已提交",
  completed: "已完成",
};

export const TIMELINE_STEPS: TaskStatus[] = [
  "uploaded",
  "recognizing",
  "needs_confirmation",
  "needs_teacher_review",
  "confirmed",
  "generating",
  "assigned",
  "in_progress",
  "submitted",
  "completed",
];

export function getTimelineIndex(status: TaskStatus): number {
  if (status === "save_failed" || status === "ready_for_practice") {
    return TIMELINE_STEPS.indexOf("confirmed");
  }
  const idx = TIMELINE_STEPS.indexOf(status);
  return idx >= 0 ? idx : 0;
}

export function estimateMinutes(
  questionCount: number,
  difficulty: PracticeDifficulty
): number {
  const perQuestion = difficulty === "basic" ? 2 : difficulty === "standard" ? 3 : 4;
  return Math.max(5, questionCount * perQuestion);
}

export function isParentConfirmableQuestion(q: {
  teacherMarkingResult: MarkingResult;
  conflictStatus: ConflictStatus;
  isNotWrong?: boolean;
}): boolean {
  if (q.isNotWrong) return false;
  return (
    q.teacherMarkingResult === "incorrect" ||
    q.teacherMarkingResult === "unclear" ||
    q.conflictStatus === "teacher_marking_conflict" ||
    q.conflictStatus === "needs_review"
  );
}

export function canSelectForPractice(q: {
  conflictStatus: ConflictStatus;
  isNotWrong?: boolean;
  reviewStatus: ReviewStatus;
}): boolean {
  if (q.isNotWrong) return false;
  if (
    q.conflictStatus === "teacher_marking_conflict" ||
    q.conflictStatus === "needs_review"
  ) {
    return (
      q.reviewStatus === "teacher_confirmed" ||
      q.reviewStatus === "teacher_corrected"
    );
  }
  return true;
}
