"use client";

import { useAppStore, useCurrentUser, useHydrated } from "@/lib/hooks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StateBlock } from "@/components/ui/state-block";

export default function StudentProgressPage() {
  const hydrated = useHydrated();
  const user = useCurrentUser();
  const store = useAppStore();
  if (!hydrated || !user) return null;

  const studentId = user.linkedStudentIds?.[0] ?? "stu_liming";
  const practices = store.practiceSets.filter((p) => p.studentId === studentId);
  const submissions = store.submissions.filter(
    (s) => s.studentId === studentId && s.submittedAt
  );

  if (practices.length === 0) {
    return (
      <StateBlock
        title="暂无学习进展"
        description="完成练习后可在这里查看得分变化。"
      />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">学习进展</h1>
        <p className="mt-1 text-sm text-text-muted">了解需要继续练习的知识点</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>已完成练习</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">
            {submissions.length}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>待完成练习</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">
            {
              practices.filter(
                (p) => p.status === "assigned" || p.status === "in_progress"
              ).length
            }
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>近期得分</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {submissions.length === 0 ? (
            <p className="text-sm text-text-muted">提交后显示得分。</p>
          ) : (
            submissions.map((s) => {
              const p = practices.find((x) => x.id === s.practiceSetId);
              return (
                <div
                  key={s.id}
                  className="flex items-center justify-between rounded-[10px] border border-border px-3 py-2 text-sm"
                >
                  <span>{p?.title ?? "练习"}</span>
                  <span className="font-semibold text-primary">{s.score} 分</span>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}
