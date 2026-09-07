"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { MoreHorizontal } from "lucide-react";
import { TaskStatusTimeline } from "@/components/task-status-timeline";
import { useAppStore, useCurrentUser, useHydrated } from "@/lib/hooks";
import {
  confidenceLabel,
  conflictLabel,
  formatDateTime,
  markingLabel,
  mathVerdictLabel,
  reviewStatusLabel,
  taskStatusLabel,
} from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StateBlock } from "@/components/ui/state-block";
import { hasPermission } from "@/lib/permissions";

export default function TaskDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const hydrated = useHydrated();
  const user = useCurrentUser();
  const store = useAppStore();
  const task = store.tasks.find((t) => t.id === params.id);
  const [menuOpen, setMenuOpen] = useState(false);
  const [stepNote, setStepNote] = useState<string | null>(null);

  if (!hydrated || !user) return null;

  if (!task) {
    return (
      <StateBlock
        variant="error"
        title="任务不存在"
        description="链接可能已失效。"
        actionLabel="返回列表"
        onAction={() => router.push("/tasks")}
      />
    );
  }

  const student = store.students.find((s) => s.id === task.studentId);
  const isStudent = user.role === "student";

  let primaryHref = `/tasks/${task.id}`;
  let primaryLabel = "查看详情";
  if (user.role === "parent" && task.status === "needs_confirmation") {
    primaryHref = `/parent/confirm/${task.id}`;
    primaryLabel = "确认错题";
  } else if (
    user.role === "parent" &&
    (task.status === "ready_for_practice" ||
      task.status === "save_failed" ||
      task.status === "confirmed")
  ) {
    primaryHref = `/parent/practice-setup/${task.id}`;
    primaryLabel = "生成练习";
  } else if (user.role === "teacher" && task.status === "needs_teacher_review") {
    primaryHref = `/teacher/review/${task.id}`;
    primaryLabel = "完成复核";
  } else if (user.role === "student" && task.practiceSetIds[0]) {
    const practice = store.practiceSets.find((p) => p.id === task.practiceSetIds[0]);
    if (practice?.status === "completed") {
      primaryHref = `/student/result/${practice.id}`;
      primaryLabel = "查看结果";
    } else if (practice) {
      primaryHref = `/student/practice/${practice.id}`;
      primaryLabel = practice.status === "in_progress" ? "继续练习" : "开始练习";
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{task.sourceFileName}</h1>
          <p className="mt-1 text-sm text-text-muted">
            {student?.name} · {formatDateTime(task.uploadedAt)} ·{" "}
            {taskStatusLabel[task.status]}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={primaryHref}>
            <Button>{primaryLabel}</Button>
          </Link>
          {!isStudent ? (
            <div className="relative">
              <Button variant="outline" onClick={() => setMenuOpen((v) => !v)}>
                <MoreHorizontal className="h-4 w-4" />
                更多操作
              </Button>
              {menuOpen ? (
                <div className="absolute right-0 z-10 mt-2 w-52 rounded-[10px] border border-border bg-white p-2 shadow-[var(--shadow)]">
                  <button
                    className="flex h-11 w-full items-center rounded-md px-2 text-left text-sm hover:bg-bg"
                    onClick={() => alert("演示：导出学生练习卷")}
                  >
                    导出学生练习卷
                  </button>
                  <button
                    className="flex h-11 w-full items-center rounded-md px-2 text-left text-sm hover:bg-bg"
                    onClick={() => alert("演示：导出教师答案与解析")}
                  >
                    导出教师答案与解析
                  </button>
                  <button
                    className="flex h-11 w-full items-center rounded-md px-2 text-left text-sm hover:bg-bg"
                    onClick={() => window.print()}
                  >
                    打印练习
                  </button>
                  <button
                    className="flex h-11 w-full items-center rounded-md px-2 text-left text-sm hover:bg-bg"
                    onClick={async () => {
                      await navigator.clipboard.writeText(window.location.href);
                      alert("链接已复制");
                    }}
                  >
                    复制分享链接
                  </button>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>任务进度</CardTitle>
        </CardHeader>
        <CardContent>
          <TaskStatusTimeline
            status={task.status}
            saveFailed={task.saveStatus === "failed"}
            onStepClick={(step) =>
              setStepNote(`已查看步骤「${taskStatusLabel[step]}」对应结果（演示）。`)
            }
          />
          {stepNote ? (
            <p className="mt-3 text-sm text-text-muted">{stepNote}</p>
          ) : null}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>作业原图</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative h-64 overflow-hidden rounded-[10px] bg-bg">
              <Image
                src={task.sourceImageUrl}
                alt="作业"
                fill
                className="object-contain"
                unoptimized
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>题目列表</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {task.questions.length === 0 ? (
              <StateBlock
                title="没有识别到题目"
                description="可重新上传或发起识别。"
              />
            ) : (
              task.questions.map((q) => (
                <div
                  key={q.id}
                  className="rounded-[10px] border border-border px-4 py-3 text-sm"
                >
                  <div className="mb-2 flex flex-wrap gap-2">
                    <span className="font-medium">第 {q.questionNo} 题</span>
                    {!isStudent ? (
                      <>
                        <Badge>教师：{markingLabel[q.teacherMarkingResult]}</Badge>
                        <Badge>AI：{mathVerdictLabel[q.aiMathVerdict]}</Badge>
                        <Badge
                          tone={
                            q.conflictStatus === "teacher_marking_conflict"
                              ? "warning"
                              : "neutral"
                          }
                        >
                          {conflictLabel[q.conflictStatus]}
                        </Badge>
                        <Badge>
                          置信度 {confidenceLabel[q.recognitionConfidence]}
                        </Badge>
                        <Badge>{reviewStatusLabel[q.reviewStatus]}</Badge>
                      </>
                    ) : (
                      <Badge tone="primary">{q.knowledgePoint ?? "知识点"}</Badge>
                    )}
                  </div>
                  <p>{q.questionText}</p>
                  <p className="mt-1 text-text-muted">学生作答：{q.studentWork}</p>
                  {!isStudent && q.verifiedCorrectAnswer ? (
                    <p className="mt-1 text-text-muted">
                      正确答案：{q.verifiedCorrectAnswer}
                    </p>
                  ) : null}
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {hasPermission(user.role, "viewClassAnalytics") ? (
        <Link href="/teacher/analytics" className="text-sm text-primary hover:underline">
          查看班级诊断
        </Link>
      ) : null}
    </div>
  );
}
