"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { dataService } from "@/lib/data-service";
import { useAppStore, useCurrentUser, useHydrated } from "@/lib/hooks";
import type { PracticeDifficulty, QuestionType } from "@/lib/types";
import { difficultyLabel } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StateBlock } from "@/components/ui/state-block";

export default function TeacherAssignPage() {
  const hydrated = useHydrated();
  const user = useCurrentUser();
  const store = useAppStore();
  const router = useRouter();

  const [scope, setScope] = useState<"class" | "student">("class");
  const [studentIds, setStudentIds] = useState<string[]>(["stu_liming"]);
  const [knowledgePoints, setKnowledgePoints] = useState<string[]>([
    "一元一次方程",
    "绝对值",
  ]);
  const [sourceIds, setSourceIds] = useState<string[]>([]);
  const [count, setCount] = useState(6);
  const [difficulty, setDifficulty] = useState<PracticeDifficulty>("standard");
  const [types, setTypes] = useState<QuestionType[]>(["choice", "blank"]);
  const [dueAt, setDueAt] = useState(
    new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16)
  );
  const [preview, setPreview] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const allKnowledge = useMemo(() => {
    const set = new Set<string>();
    store.tasks.forEach((t) =>
      t.questions.forEach((q) => {
        if (q.knowledgePoint) set.add(q.knowledgePoint);
      })
    );
    return Array.from(set);
  }, [store.tasks]);

  const sourceQuestions = useMemo(
    () =>
      store.tasks.flatMap((t) =>
        t.questions
          .filter(
            (q) =>
              q.teacherMarkingResult === "incorrect" ||
              q.conflictStatus === "student_error"
          )
          .map((q) => ({
            id: q.id,
            label: `第${q.questionNo}题 · ${q.knowledgePoint ?? "未分类"} · ${q.questionText}`,
          }))
      ),
    [store.tasks]
  );

  if (!hydrated || !user) return null;

  const publish = async () => {
    setLoading(true);
    setError(null);
    try {
      const ids =
        scope === "class"
          ? store.students.map((s) => s.id)
          : studentIds;
      if (ids.length === 0) throw new Error("请选择学生");
      if (knowledgePoints.length === 0) throw new Error("请选择知识点");
      const created = await dataService.assignPracticeByTeacher({
        studentIds: ids,
        knowledgePoints,
        difficulty,
        questionCount: count,
        questionTypes: types,
        dueAt: new Date(dueAt).toISOString(),
        assignedBy: user.id,
        sourceQuestionIds: sourceIds,
      });
      router.push(`/teacher/assign/done?count=${created.length}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "发布失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">练习布置</h1>
        <p className="mt-1 text-sm text-text-muted">
          按班级或学生、知识点与来源错题布置练习
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle>布置配置</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={scope === "class" ? "primary" : "outline"}
                onClick={() => setScope("class")}
              >
                选择班级
              </Button>
              <Button
                size="sm"
                variant={scope === "student" ? "primary" : "outline"}
                onClick={() => setScope("student")}
              >
                选择学生
              </Button>
            </div>

            {scope === "class" ? (
              <p className="text-sm text-text-muted">将布置给初一（3）班全部学生</p>
            ) : (
              <div className="space-y-2">
                {store.students.map((s) => (
                  <label key={s.id} className="flex min-h-11 items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      className="h-4 w-4"
                      checked={studentIds.includes(s.id)}
                      onChange={(e) => {
                        setStudentIds((prev) =>
                          e.target.checked
                            ? [...prev, s.id]
                            : prev.filter((id) => id !== s.id)
                        );
                      }}
                    />
                    {s.name}（{s.className}）
                  </label>
                ))}
              </div>
            )}

            <div>
              <p className="mb-2 text-sm font-medium">选择知识点</p>
              <div className="flex flex-wrap gap-2">
                {allKnowledge.map((kp) => (
                  <Button
                    key={kp}
                    size="sm"
                    variant={knowledgePoints.includes(kp) ? "primary" : "outline"}
                    onClick={() =>
                      setKnowledgePoints((prev) =>
                        prev.includes(kp)
                          ? prev.filter((x) => x !== kp)
                          : [...prev, kp]
                      )
                    }
                  >
                    {kp}
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-2 text-sm font-medium">选择来源错题（可选）</p>
              <div className="max-h-40 space-y-2 overflow-auto">
                {sourceQuestions.map((q) => (
                  <label key={q.id} className="flex min-h-11 items-start gap-2 text-sm">
                    <input
                      type="checkbox"
                      className="mt-1 h-4 w-4"
                      checked={sourceIds.includes(q.id)}
                      onChange={(e) =>
                        setSourceIds((prev) =>
                          e.target.checked
                            ? [...prev, q.id]
                            : prev.filter((id) => id !== q.id)
                        )
                      }
                    />
                    <span>{q.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <label className="block text-sm">
              <span className="text-text-muted">题量</span>
              <input
                type="number"
                min={1}
                max={20}
                className="mt-1 h-11 w-full rounded-[10px] border border-border px-3"
                value={count}
                onChange={(e) => setCount(Number(e.target.value))}
              />
            </label>

            <div>
              <p className="mb-2 text-sm font-medium">难度</p>
              <div className="flex flex-wrap gap-2">
                {(["basic", "standard", "advanced"] as PracticeDifficulty[]).map(
                  (d) => (
                    <Button
                      key={d}
                      size="sm"
                      variant={difficulty === d ? "primary" : "outline"}
                      onClick={() => setDifficulty(d)}
                    >
                      {difficultyLabel[d]}
                    </Button>
                  )
                )}
              </div>
            </div>

            <div>
              <p className="mb-2 text-sm font-medium">题型</p>
              <div className="flex flex-wrap gap-2">
                {(
                  [
                    ["choice", "选择题"],
                    ["blank", "填空题"],
                    ["solution", "解答题"],
                  ] as const
                ).map(([value, label]) => (
                  <Button
                    key={value}
                    size="sm"
                    variant={types.includes(value) ? "primary" : "outline"}
                    onClick={() =>
                      setTypes((prev) =>
                        prev.includes(value)
                          ? prev.length === 1
                            ? prev
                            : prev.filter((t) => t !== value)
                          : [...prev, value]
                      )
                    }
                  >
                    {label}
                  </Button>
                ))}
              </div>
            </div>

            <label className="block text-sm">
              <span className="text-text-muted">截止时间</span>
              <input
                type="datetime-local"
                className="mt-1 h-11 w-full rounded-[10px] border border-border px-3"
                value={dueAt}
                onChange={(e) => setDueAt(e.target.value)}
              />
            </label>

            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => setPreview(true)}>
                预览练习
              </Button>
              <Button onClick={publish} loading={loading}>
                发布练习
              </Button>
            </div>

            {error ? (
              <StateBlock
                variant="error"
                title="发布失败"
                description={error}
                actionLabel="重试"
                onAction={() => void publish()}
              />
            ) : null}
          </CardContent>
        </Card>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle>布置摘要</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              对象：
              {scope === "class"
                ? `初一（3）班（${store.students.length}人）`
                : `${studentIds.length} 名学生`}
            </p>
            <p>题量：{count}</p>
            <p>难度：{difficultyLabel[difficulty]}</p>
            <p>知识点：{knowledgePoints.join("、") || "—"}</p>
            <p>截止：{dueAt.replace("T", " ")}</p>
          </CardContent>
        </Card>
      </div>

      {preview ? (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>练习预览（示意）</CardTitle>
            <Button size="sm" variant="outline" onClick={() => setPreview(false)}>
              关闭
            </Button>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {Array.from({ length: count }).map((_, i) => (
              <div key={i} className="rounded-[10px] border border-border px-3 py-2">
                {i + 1}. 关于「
                {knowledgePoints[i % knowledgePoints.length] ?? "综合"}
                」的练习题
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
