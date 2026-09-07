"use client";

import { useAppStore, useCurrentUser, useHydrated } from "@/lib/hooks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StateBlock } from "@/components/ui/state-block";

export default function StudentWrongQuestionsPage() {
  const hydrated = useHydrated();
  const user = useCurrentUser();
  const store = useAppStore();
  if (!hydrated || !user) return null;

  const studentId = user.linkedStudentIds?.[0] ?? "stu_liming";
  const wrongs = store.tasks
    .filter((t) => t.studentId === studentId)
    .flatMap((t) =>
      t.questions
        .filter(
          (q) =>
            q.teacherMarkingResult === "incorrect" ||
            q.conflictStatus === "student_error"
        )
        .map((q) => ({
          ...q,
          fileName: t.sourceFileName,
        }))
    );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">我的错题</h1>
        <p className="mt-1 text-sm text-text-muted">
          只展示题目与知识点，不含内部复核信息
        </p>
      </div>
      {wrongs.length === 0 ? (
        <StateBlock title="暂无错题" description="完成作业识别后，错题会出现在这里。" />
      ) : (
        <div className="grid gap-3">
          {wrongs.map((q) => (
            <Card key={q.id}>
              <CardHeader>
                <CardTitle>
                  第{q.questionNo}题 · {q.knowledgePoint ?? "知识点"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 text-sm">
                <p>{q.questionText}</p>
                <p className="text-text-muted">我的作答：{q.studentWork}</p>
                <p className="text-text-muted">来源：{q.fileName}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
