"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, ListOrdered, X } from "lucide-react";
import { dataService } from "@/lib/data-service";
import { useAppStore, useCurrentUser, useHydrated } from "@/lib/hooks";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StateBlock } from "@/components/ui/state-block";
import { cn } from "@/lib/utils";

export default function StudentPracticePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const hydrated = useHydrated();
  const user = useCurrentUser();
  const store = useAppStore();
  const practice = store.practiceSets.find((p) => p.id === params.id);
  const existing = store.submissions.find((s) => s.practiceSetId === params.id);

  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [handwriting, setHandwriting] = useState<Record<string, string>>({});
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [submitWarn, setSubmitWarn] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (existing?.answers) setAnswers(existing.answers);
    if (existing?.handwritingUrls) setHandwriting(existing.handwritingUrls);
  }, [existing]);

  const answeredCount = useMemo(
    () =>
      practice
        ? practice.items.filter((i) => (answers[i.id] ?? "").trim().length > 0)
            .length
        : 0,
    [answers, practice]
  );

  if (!hydrated || !user) return null;

  if (!practice) {
    return (
      <StateBlock
        variant="error"
        title="练习不存在"
        description="请返回今日练习重新进入。"
        actionLabel="返回"
        onAction={() => router.push("/student")}
      />
    );
  }

  if (practice.status === "completed" || existing?.submittedAt) {
    router.replace(`/student/result/${practice.id}`);
    return null;
  }

  const item = practice.items[index];
  if (!item) return null;

  const save = (nextAnswers: Record<string, string>, nextHw = handwriting) => {
    setSaving(true);
    dataService.saveDraftAnswers(
      practice.id,
      user.linkedStudentIds?.[0] ?? "stu_liming",
      nextAnswers,
      nextHw
    );
    setTimeout(() => setSaving(false), 300);
  };

  const setAnswer = (value: string) => {
    const next = { ...answers, [item.id]: value };
    setAnswers(next);
    save(next);
  };

  const onHandwriting = (file: File | null) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const next = { ...handwriting, [item.id]: String(reader.result) };
      setHandwriting(next);
      save(answers, next);
    };
    reader.readAsDataURL(file);
  };

  const submit = () => {
    const unanswered = practice.items.filter(
      (i) => !(answers[i.id] ?? "").trim()
    );
    if (unanswered.length > 0) {
      setSubmitWarn(`还有 ${unanswered.length} 道题未作答，确认现在提交吗？`);
      return;
    }
    doSubmit();
  };

  const doSubmit = () => {
    save(answers, handwriting);
    dataService.submitPractice(
      practice.id,
      user.linkedStudentIds?.[0] ?? "stu_liming"
    );
    router.push(`/student/result/${practice.id}`);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold sm:text-2xl">{practice.title}</h1>
          <p className="text-sm text-text-muted">
            进度 {answeredCount}/{practice.items.length}
            {saving ? " · 已自动保存" : ""}
          </p>
        </div>
        <Button
          className="lg:hidden"
          variant="outline"
          onClick={() => setDrawerOpen(true)}
        >
          <ListOrdered className="h-4 w-4" />
          题号
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-[160px_1fr_220px]">
        <Card className="hidden h-fit lg:block">
          <CardHeader>
            <CardTitle>题号</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-4 gap-2">
            {practice.items.map((q, i) => (
              <button
                key={q.id}
                type="button"
                onClick={() => setIndex(i)}
                className={cn(
                  "flex h-11 items-center justify-center rounded-md border text-sm",
                  i === index
                    ? "border-primary bg-primary text-white"
                    : (answers[q.id] ?? "").trim()
                      ? "border-success/40 bg-success-soft text-success"
                      : "border-border bg-white"
                )}
              >
                {q.questionNo}
              </button>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              第 {item.questionNo} 题
              <span className="ml-2 text-sm font-normal text-text-muted">
                {item.questionType === "choice"
                  ? "选择题"
                  : item.questionType === "blank"
                    ? "填空题"
                    : "解答题"}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-base leading-7">{item.questionText}</p>

            {item.questionType === "choice" && item.options ? (
              <div className="space-y-2" role="radiogroup" aria-label="选项">
                {item.options.map((opt) => (
                  <label
                    key={opt}
                    className={cn(
                      "flex min-h-11 cursor-pointer items-center gap-3 rounded-[10px] border px-3 py-2 text-sm",
                      answers[item.id] === opt
                        ? "border-primary bg-primary-soft"
                        : "border-border"
                    )}
                  >
                    <input
                      type="radio"
                      name={`q-${item.id}`}
                      checked={answers[item.id] === opt}
                      onChange={() => setAnswer(opt)}
                    />
                    {opt}
                  </label>
                ))}
              </div>
            ) : null}

            {item.questionType === "blank" ? (
              <input
                className="h-11 w-full rounded-[10px] border border-border px-3"
                value={answers[item.id] ?? ""}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="请输入答案"
              />
            ) : null}

            {item.questionType === "solution" ? (
              <div className="space-y-3">
                <textarea
                  className="min-h-32 w-full rounded-[10px] border border-border px-3 py-2"
                  value={answers[item.id] ?? ""}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder="请写出解题过程与答案"
                />
                <div>
                  <p className="mb-2 text-sm text-text-muted">上传手写解题图片（可选）</p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => onHandwriting(e.target.files?.[0] ?? null)}
                  />
                  {handwriting[item.id] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={handwriting[item.id]}
                      alt="手写解题"
                      className="mt-2 max-h-40 rounded-md border border-border"
                    />
                  ) : null}
                </div>
              </div>
            ) : null}

            {/* Intentionally no answer/explanation before submit */}
          </CardContent>
        </Card>

        <Card className="hidden h-fit lg:block">
          <CardHeader>
            <CardTitle>答题提示</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-text-muted">
            <p>当前知识点：{item.knowledgePoint}</p>
            <p>已答 {answeredCount} / {practice.items.length}</p>
            <p>提交前不会显示正确答案和解析。</p>
            <div className="h-2 overflow-hidden rounded-full bg-border">
              <div
                className="h-full bg-primary transition-all"
                style={{
                  width: `${(answeredCount / practice.items.length) * 100}%`,
                }}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Desktop actions */}
      <div className="hidden items-center justify-between gap-3 lg:flex">
        <Button
          variant="outline"
          disabled={index === 0}
          onClick={() => setIndex((i) => Math.max(0, i - 1))}
        >
          <ChevronLeft className="h-4 w-4" />
          上一题
        </Button>
        <div className="flex gap-2">
          {index < practice.items.length - 1 ? (
            <Button onClick={() => setIndex((i) => i + 1)}>
              下一题
              <ChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={submit}>提交练习</Button>
          )}
        </div>
      </div>

      {/* Mobile fixed bar */}
      <div className="fixed inset-x-0 bottom-14 z-30 border-t border-border bg-white p-3 lg:hidden">
        <div className="mx-auto flex max-w-7xl gap-2">
          <Button
            className="flex-1"
            variant="outline"
            disabled={index === 0}
            onClick={() => setIndex((i) => Math.max(0, i - 1))}
          >
            上一题
          </Button>
          {index < practice.items.length - 1 ? (
            <Button className="flex-1" onClick={() => setIndex((i) => i + 1)}>
              下一题
            </Button>
          ) : (
            <Button className="flex-1" onClick={submit}>
              提交
            </Button>
          )}
        </div>
      </div>

      {drawerOpen ? (
        <div className="fixed inset-0 z-50 bg-black/40 lg:hidden">
          <div className="absolute inset-x-0 bottom-0 rounded-t-[16px] bg-white p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-semibold">题号导航</h3>
              <button type="button" onClick={() => setDrawerOpen(false)} aria-label="关闭">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="grid grid-cols-6 gap-2">
              {practice.items.map((q, i) => (
                <button
                  key={q.id}
                  type="button"
                  className={cn(
                    "flex h-11 items-center justify-center rounded-md border",
                    i === index ? "border-primary bg-primary text-white" : "border-border"
                  )}
                  onClick={() => {
                    setIndex(i);
                    setDrawerOpen(false);
                  }}
                >
                  {q.questionNo}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {submitWarn ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>未答题提醒</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-text-muted">{submitWarn}</p>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setSubmitWarn(null)}>
                  继续作答
                </Button>
                <Button
                  onClick={() => {
                    setSubmitWarn(null);
                    doSubmit();
                  }}
                >
                  确认提交
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
