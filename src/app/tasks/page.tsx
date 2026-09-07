"use client";

import Link from "next/link";
import { useAppStore, useCurrentUser, useHydrated } from "@/lib/hooks";
import { TaskCard } from "@/components/task-card";
import { StateBlock } from "@/components/ui/state-block";
import { hasPermission } from "@/lib/permissions";

export default function TasksPage() {
  const hydrated = useHydrated();
  const user = useCurrentUser();
  const store = useAppStore();

  if (!hydrated || !user) return null;

  const tasks =
    user.role === "teacher"
      ? store.tasks
      : store.tasks.filter((t) =>
          (user.linkedStudentIds ?? []).includes(t.studentId)
        );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">错题任务列表</h1>
        <p className="mt-1 text-sm text-text-muted">按当前角色权限展示可访问任务</p>
      </div>
      {tasks.length === 0 ? (
        <StateBlock
          title="尚未上传作业"
          description="当前没有可显示的任务。"
          actionLabel={
            hasPermission(user.role, "uploadWorksheet") ? "去上传" : undefined
          }
          onAction={
            hasPermission(user.role, "uploadWorksheet")
              ? () => {
                  window.location.href = "/parent/upload";
                }
              : undefined
          }
        />
      ) : (
        <div className="grid gap-4">
          {tasks.map((task) => {
            const student = store.students.find((s) => s.id === task.studentId);
            let href = `/tasks/${task.id}`;
            let label = "查看详情";
            if (user.role === "parent" && task.status === "needs_confirmation") {
              href = `/parent/confirm/${task.id}`;
              label = "确认错题";
            } else if (
              user.role === "parent" &&
              (task.status === "ready_for_practice" || task.status === "save_failed")
            ) {
              href = `/parent/practice-setup/${task.id}`;
              label = "生成练习";
            } else if (
              user.role === "teacher" &&
              task.status === "needs_teacher_review"
            ) {
              href = `/teacher/review/${task.id}`;
              label = "去复核";
            }
            return (
              <TaskCard
                key={task.id}
                task={task}
                studentName={student?.name ?? "学生"}
                primaryHref={href}
                primaryLabel={label}
                showInternal={user.role !== "student"}
              />
            );
          })}
        </div>
      )}
      <Link href="/" className="text-sm text-primary hover:underline">
        返回工作台
      </Link>
    </div>
  );
}
