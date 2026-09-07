"use client";

import Link from "next/link";
import { useAppStore, useCurrentUser, useHydrated } from "@/lib/hooks";
import { difficultyLabel, formatDateTime, practiceStatusLabel } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StateBlock } from "@/components/ui/state-block";

export default function StudentHomePage() {
  const hydrated = useHydrated();
  const user = useCurrentUser();
  const store = useAppStore();

  if (!hydrated || !user) return null;

  const studentId = user.linkedStudentIds?.[0] ?? "stu_liming";
  const practices = store.practiceSets.filter((p) => p.studentId === studentId);
  const pending = practices.filter(
    (p) => p.status === "assigned" || p.status === "in_progress"
  );
  const done = practices.filter(
    (p) => p.status === "completed" || p.status === "submitted"
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">今日练习</h1>
        <p className="mt-1 text-sm text-text-muted">专注完成练习，提交后可查看解析</p>
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">待完成</h2>
        {pending.length === 0 ? (
          <StateBlock
            title="暂无待完成练习"
            description="家长或老师布置练习后会显示在这里。"
          />
        ) : (
          <div className="grid gap-4">
            {pending.map((p) => (
              <Card key={p.id}>
                <CardHeader className="flex flex-row items-start justify-between gap-3">
                  <div>
                    <CardTitle>{p.title}</CardTitle>
                    <p className="mt-1 text-sm text-text-muted">
                      截止：{p.dueAt ? formatDateTime(p.dueAt) : "未设置"} · 预计{" "}
                      {p.estimatedMinutes ?? "—"} 分钟
                    </p>
                  </div>
                  <Badge tone="warning">{practiceStatusLabel[p.status]}</Badge>
                </CardHeader>
                <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-wrap gap-2">
                    {p.knowledgePoints.map((kp) => (
                      <span
                        key={kp}
                        className="rounded-md bg-primary-soft px-2 py-1 text-xs text-primary"
                      >
                        {kp}
                      </span>
                    ))}
                  </div>
                  <Link href={`/student/practice/${p.id}`}>
                    <Button>
                      {p.status === "in_progress" ? "继续练习" : "开始练习"}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">已完成</h2>
        {done.length === 0 ? (
          <StateBlock title="还没有已完成练习" description="提交后的练习会出现在这里。" />
        ) : (
          <div className="grid gap-3">
            {done.map((p) => {
              const sub = store.submissions.find(
                (s) => s.practiceSetId === p.id && s.submittedAt
              );
              return (
                <Card key={p.id}>
                  <CardContent className="flex flex-col gap-3 py-5 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-medium">{p.title}</p>
                      <p className="text-sm text-text-muted">
                        {difficultyLabel[p.difficulty]} · 得分{" "}
                        {sub?.score ?? "—"}
                      </p>
                    </div>
                    <Link href={`/student/result/${p.id}`}>
                      <Button variant="outline">查看结果</Button>
                    </Link>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
