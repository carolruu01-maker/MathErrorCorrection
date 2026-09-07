"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { dataService } from "@/lib/data-service";
import { useAppStore, useCurrentUser, useHydrated } from "@/lib/hooks";
import type { PracticeDifficulty, QuestionType } from "@/lib/types";
import {
  canSelectForPractice,
  difficultyLabel,
  estimateMinutes,
} from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StateBlock } from "@/components/ui/state-block";

export default function PracticeSetupPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const hydrated = useHydrated();
  const user = useCurrentUser();
  const store = useAppStore();
  const task = store.tasks.find((t) => t.id === params.id);

  const [perWrong, setPerWrong] = useState<1 | 2 | 3 | 5>(2);
  const [difficulty, setDifficulty] = useState<PracticeDifficulty>("standard");
  const [types, setTypes] = useState<QuestionType[]>(["choice", "blank", "solution"]);
  const [includeWeak, setIncludeWeak] = useState(true);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectable = useMemo(
    () =>
      task
        ? task.questions.filter(
            (q) => q.selectedForPractice && canSelectForPractice(q) && !q.isNotWrong
          )
        : [],
    [task]
  );

  const blockedConflicts = useMemo(
    () =>
      task
        ? task.questions.filter(
            (q) =>
              q.selectedForPractice &&
              !canSelectForPractice(q) &&
              !q.isNotWrong
          )
        : [],
    [task]
  );

  if (!hydrated || !user) return null;
  if (!task) {
    return (
      <StateBlock
        variant="error"
        title="任务不存在"
        description="无法加载练习设置。"
        actionLabel="返回"
        onAction={() => router.push("/parent")}
      />
    );
  }

  const estimatedCount =
    selectable.length * perWrong + (includeWeak ? 1 : 0);
  const minutes = estimateMinutes(estimatedCount || 1, difficulty);
  const knowledgePoints = Array.from(
    new Set(selectable.map((q) => q.knowledgePoint).filter((x): x is string => Boolean(x)))
  );

  const toggleType = (t: QuestionType) => {
    setTypes((prev) => {
      if (prev.includes(t)) {
        if (prev.length === 1) return prev;
        return prev.filter((x) => x !== t);
      }
      return [...prev, t];
    });
  };

  const generate = async () => {
    setLoading(true);
    setError(null);
    try {
      if (blockedConflicts.length > 0) {
        setError("存在未复核的冲突题，不能直接进入练习生成。请先取消选择或等待老师复核。");
        return;
      }
      const practice = await dataService.generatePractice(
        task.id,
        {
          questionsPerWrong: perWrong,
          difficulty,
          questionTypes: types,
          includeHistoricalWeakPoints: includeWeak,
        },
        user.id
      );
      router.push(`/parent/practice-done/${practice.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "练习生成失败");
    } finally {
      setLoading(false);
    }
  };

  const retrySync = async () => {
    setSyncing(true);
    try {
      await dataService.retrySync(task.id);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">练习设置</h1>
        <p className="mt-1 text-sm text-text-muted">
          基于已确认错题生成针对性练习
        </p>
      </div>

      {task.saveStatus === "failed" ? (
        <div className="flex flex-col gap-3 rounded-[10px] border border-warning/30 bg-warning-soft px-4 py-3 text-sm text-warning sm:flex-row sm:items-center sm:justify-between">
          <p>
            错题暂未同步到历史记录，但仍可基于本次识别结果生成练习。
            {task.saveErrorMessage ? `（${task.saveErrorMessage}）` : ""}
          </p>
          <Button size="sm" variant="outline" loading={syncing} onClick={retrySync}>
            重新同步
          </Button>
        </div>
      ) : null}

      {blockedConflicts.length > 0 ? (
        <div className="rounded-[10px] border border-danger/20 bg-danger-soft px-4 py-3 text-sm text-danger">
          存在教师批改冲突题尚未复核，默认不能直接用于生成练习。请取消勾选或等待老师处理。
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle>配置项</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div>
              <p className="mb-2 text-sm font-medium">选择需要练习的错题</p>
              <div className="space-y-2">
                {task.questions
                  .filter((q) => !q.isNotWrong && (q.teacherMarkingResult !== "correct" || q.conflictStatus !== "none"))
                  .map((q) => {
                    const ok = canSelectForPractice(q);
                    return (
                      <label
                        key={q.id}
                        className="flex min-h-11 items-start gap-2 rounded-[10px] border border-border px-3 py-2 text-sm"
                      >
                        <input
                          type="checkbox"
                          className="mt-1 h-4 w-4"
                          checked={q.selectedForPractice}
                          disabled={!ok}
                          onChange={(e) =>
                            dataService.updateQuestion(task.id, q.id, {
                              selectedForPractice: e.target.checked,
                            })
                          }
                        />
                        <span>
                          第{q.questionNo}题 · {q.knowledgePoint ?? "未标注"}
                          {!ok ? "（待老师复核）" : ""}
                          <span className="mt-0.5 block text-text-muted">
                            {q.questionText}
                          </span>
                        </span>
                      </label>
                    );
                  })}
              </div>
            </div>

            <div>
              <p className="mb-2 text-sm font-medium">每道错题生成题数</p>
              <div className="flex flex-wrap gap-2">
                {([1, 2, 3, 5] as const).map((n) => (
                  <Button
                    key={n}
                    size="sm"
                    variant={perWrong === n ? "primary" : "outline"}
                    onClick={() => setPerWrong(n)}
                  >
                    {n} 道
                  </Button>
                ))}
              </div>
            </div>

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
                    onClick={() => toggleType(value)}
                  >
                    {label}
                  </Button>
                ))}
              </div>
            </div>

            <label className="flex min-h-11 items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="h-4 w-4"
                checked={includeWeak}
                onChange={(e) => setIncludeWeak(e.target.checked)}
              />
              混入历史薄弱知识点
            </label>

            <Button onClick={generate} loading={loading} disabled={selectable.length === 0}>
              生成针对性练习
            </Button>

            {error ? (
              <StateBlock
                variant="error"
                title="练习生成失败"
                description={error}
                actionLabel="重试"
                onAction={() => void generate()}
                secondaryLabel="联系老师"
                onSecondary={() => router.push("/notifications")}
              />
            ) : null}
          </CardContent>
        </Card>

        <Card className="h-fit lg:sticky lg:top-28">
          <CardHeader>
            <CardTitle>实时预览</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p>
              已选择错题数量：
              <strong className="ml-1 text-primary">{selectable.length}</strong>
            </p>
            <p>
              预计生成题数：
              <strong className="ml-1 text-primary">{estimatedCount}</strong>
            </p>
            <p>
              预计完成时间：
              <strong className="ml-1">{minutes} 分钟</strong>
            </p>
            <div>
              <p className="text-text-muted">涉及知识点</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {knowledgePoints.length === 0 ? (
                  <span className="text-text-muted">暂无</span>
                ) : (
                  knowledgePoints.map((kp) => (
                    <span
                      key={kp}
                      className="rounded-md bg-primary-soft px-2 py-1 text-xs text-primary"
                    >
                      {kp}
                    </span>
                  ))
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
