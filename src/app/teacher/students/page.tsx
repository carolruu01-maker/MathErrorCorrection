"use client";

import Link from "next/link";
import { useAppStore, useHydrated } from "@/lib/hooks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StateBlock } from "@/components/ui/state-block";

export default function TeacherStudentsPage() {
  const hydrated = useHydrated();
  const store = useAppStore();

  if (!hydrated) return null;

  if (store.students.length === 0) {
    return (
      <StateBlock
        title="暂无学生"
        description="班级学生同步后将显示在这里。"
      />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">学生管理</h1>
        <p className="mt-1 text-sm text-text-muted">查看班级学生错题与练习概况</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {store.students.map((stu) => {
          const tasks = store.tasks.filter((t) => t.studentId === stu.id);
          const practices = store.practiceSets.filter((p) => p.studentId === stu.id);
          const wrong = tasks.flatMap((t) => t.questions).filter(
            (q) =>
              q.teacherMarkingResult === "incorrect" ||
              q.conflictStatus === "student_error" ||
              q.conflictStatus === "teacher_marking_conflict"
          ).length;
          return (
            <Card key={stu.id}>
              <CardHeader>
                <CardTitle>
                  {stu.name}
                  <span className="ml-2 text-sm font-normal text-text-muted">
                    {stu.className}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <p>作业任务：{tasks.length}</p>
                <p>错题数：{wrong}</p>
                <p>练习数：{practices.length}</p>
                <Link href="/tasks">
                  <Button size="sm" variant="outline">
                    查看相关任务
                  </Button>
                </Link>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
