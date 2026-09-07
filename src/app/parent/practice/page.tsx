"use client";

import Link from "next/link";
import { useAppStore, useCurrentUser, useHydrated } from "@/lib/hooks";
import { difficultyLabel, formatDateTime, practiceStatusLabel } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StateBlock } from "@/components/ui/state-block";

export default function ParentPracticePage() {
  const hydrated = useHydrated();
  const user = useCurrentUser();
  const store = useAppStore();
  if (!hydrated || !user) return null;
  const childId = user.linkedStudentIds?.[0] ?? "stu_liming";
  const practices = store.practiceSets.filter((p) => p.studentId === childId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">练习管理</h1>
        <p className="mt-1 text-sm text-text-muted">查看已生成与已布置的练习</p>
      </div>
      {practices.length === 0 ? (
        <StateBlock
          title="暂无练习"
          description="确认错题并生成练习后，会出现在这里。"
          actionLabel="去确认任务"
          onAction={() => {
            window.location.href = "/parent";
          }}
        />
      ) : (
        <div className="grid gap-3">
          {practices.map((p) => (
            <Card key={p.id}>
              <CardHeader className="flex flex-row items-start justify-between">
                <div>
                  <CardTitle>{p.title}</CardTitle>
                  <p className="mt-1 text-sm text-text-muted">
                    {difficultyLabel[p.difficulty]} · {p.totalQuestions} 题 ·{" "}
                    {p.assignedAt ? formatDateTime(p.assignedAt) : "—"}
                  </p>
                </div>
                <Badge>{practiceStatusLabel[p.status]}</Badge>
              </CardHeader>
              <CardContent>
                <Link href={`/parent/practice-done/${p.id}`}>
                  <Button size="sm" variant="outline">
                    查看生成结果
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
