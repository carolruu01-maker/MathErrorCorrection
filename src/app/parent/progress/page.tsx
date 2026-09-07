"use client";

import { useAppStore, useCurrentUser, useHydrated } from "@/lib/hooks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StateBlock } from "@/components/ui/state-block";

export default function ParentProgressPage() {
  const hydrated = useHydrated();
  const user = useCurrentUser();
  const store = useAppStore();
  if (!hydrated || !user) return null;

  const childId = user.linkedStudentIds?.[0] ?? "stu_liming";
  const practices = store.practiceSets.filter((p) => p.studentId === childId);
  const submissions = store.submissions.filter(
    (s) => s.studentId === childId && s.submittedAt
  );
  const avg =
    submissions.length === 0
      ? null
      : Math.round(
          submissions.reduce((sum, s) => sum + (s.score ?? 0), 0) /
            submissions.length
        );

  const weak = Array.from(
    new Set(
      store.tasks
        .filter((t) => t.studentId === childId)
        .flatMap((t) => t.questions)
        .filter((q) => q.teacherMarkingResult === "incorrect")
        .map((q) => q.knowledgePoint)
        .filter((x): x is string => Boolean(x))
    )
  );

  if (practices.length === 0) {
    return (
      <StateBlock
        title="暂无学习进展"
        description="生成并完成练习后，这里会汇总孩子的正确率与薄弱点。"
      />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">学习进展</h1>
        <p className="mt-1 text-sm text-text-muted">孩子练习完成情况与薄弱知识点</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>练习总数</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">{practices.length}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>已提交</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">
            {submissions.length}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>平均得分</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">
            {avg ?? "—"}
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>薄弱知识点</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {weak.length === 0 ? (
            <p className="text-sm text-text-muted">暂无</p>
          ) : (
            weak.map((kp) => (
              <span
                key={kp}
                className="rounded-md bg-warning-soft px-2 py-1 text-xs text-warning"
              >
                {kp}
              </span>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
