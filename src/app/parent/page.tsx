"use client";

import Link from "next/link";
import { Upload } from "lucide-react";
import { useAppStore, useCurrentUser, useHydrated } from "@/lib/hooks";
import { canSelectForPractice, isParentConfirmableQuestion } from "@/lib/utils";
import { TaskCard } from "@/components/task-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StateBlock } from "@/components/ui/state-block";

export default function ParentHomePage() {
  const hydrated = useHydrated();
  const user = useCurrentUser();
  const store = useAppStore();

  if (!hydrated || !user) return null;

  const childId = user.linkedStudentIds?.[0] ?? "stu_liming";
  const child = store.students.find((s) => s.id === childId);
  const tasks = store.tasks.filter((t) => t.studentId === childId);
  const pendingConfirm = tasks.filter((t) => t.status === "needs_confirmation");
  const weekPractices = store.practiceSets.filter((p) => {
    if (p.studentId !== childId || !p.assignedAt) return false;
    const days =
      (Date.now() - new Date(p.assignedAt).getTime()) / (24 * 60 * 60 * 1000);
    return days <= 7;
  });

  const weakPoints = Array.from(
    new Set(
      tasks
        .flatMap((t) => t.questions)
        .filter(
          (q) =>
            q.selectedForPractice ||
            q.teacherMarkingResult === "incorrect" ||
            q.conflictStatus === "student_error"
        )
        .map((q) => q.knowledgePoint)
        .filter((x): x is string => Boolean(x))
    )
  ).slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-text">家长工作台</h1>
          <p className="mt-1 text-sm text-text-muted">
            上传作业、确认错题，并为{child?.name ?? "孩子"}生成针对性练习
          </p>
        </div>
        <Link href="/parent/upload">
          <Button size="lg">
            <Upload className="h-4 w-4" />
            上传一份新作业
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>待确认任务</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold text-warning">{pendingConfirm.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>本周已生成练习</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold text-primary">{weekPractices.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>近期薄弱知识点</CardTitle>
          </CardHeader>
          <CardContent>
            {weakPoints.length === 0 ? (
              <p className="text-sm text-text-muted">暂无数据</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {weakPoints.map((kp) => (
                  <span
                    key={kp}
                    className="rounded-md bg-primary-soft px-2 py-1 text-xs text-primary"
                  >
                    {kp}
                  </span>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">最近任务</h2>
          <Link href="/tasks" className="text-sm text-primary hover:underline">
            查看全部
          </Link>
        </div>
        {tasks.length === 0 ? (
          <StateBlock
            title="尚未上传作业"
            description="上传孩子的作业图片后，系统会识别错题并引导你确认与生成练习。"
            actionLabel="去上传作业"
            onAction={() => {
              window.location.href = "/parent/upload";
            }}
          />
        ) : (
          <div className="grid gap-4">
            {tasks.map((task) => {
              const confirmable = task.questions.filter(isParentConfirmableQuestion);
              const selectable = confirmable.filter(canSelectForPractice);
              let href = `/tasks/${task.id}`;
              let label = "查看详情";
              if (task.status === "needs_confirmation") {
                href = `/parent/confirm/${task.id}`;
                label = "确认错题";
              } else if (
                task.status === "ready_for_practice" ||
                task.status === "save_failed" ||
                (task.status === "confirmed" && selectable.length > 0)
              ) {
                href = `/parent/practice-setup/${task.id}`;
                label = "生成练习";
              } else if (task.status === "needs_teacher_review") {
                href = `/tasks/${task.id}`;
                label = "等待老师复核";
              }
              return (
                <TaskCard
                  key={task.id}
                  task={task}
                  studentName={child?.name ?? "学生"}
                  primaryHref={href}
                  primaryLabel={label}
                  showInternal
                />
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
