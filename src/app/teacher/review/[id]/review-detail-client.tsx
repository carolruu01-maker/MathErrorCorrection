"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { RotateCw, ZoomIn, ZoomOut } from "lucide-react";
import { dataService } from "@/lib/data-service";
import { useAppStore, useHydrated } from "@/lib/hooks";
import {
  confidenceLabel,
  markingLabel,
  mathVerdictLabel,
} from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StateBlock } from "@/components/ui/state-block";

export default function TeacherReviewDetailPage() {
  const params = useParams<{ id: string }>();
  const search = useSearchParams();
  const router = useRouter();
  const hydrated = useHydrated();
  const store = useAppStore();
  const task = store.tasks.find((t) => t.id === params.id);

  const initialQ = search.get("q");
  const [questionId, setQuestionId] = useState<string | undefined>(
    initialQ ?? undefined
  );
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [draft, setDraft] = useState({
    questionText: "",
    verifiedCorrectAnswer: "",
    knowledgePoint: "",
    errorType: "",
  });
  const [savedMsg, setSavedMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!task) return;
    const qid = initialQ ?? task.questions[0]?.id;
    if (!qid) return;
    const q = task.questions.find((item) => item.id === qid);
    if (!q) return;
    setQuestionId(qid);
    setDraft({
      questionText: q.questionText,
      verifiedCorrectAnswer: q.verifiedCorrectAnswer ?? "",
      knowledgePoint: q.knowledgePoint ?? "",
      errorType: q.errorType ?? "",
    });
  }, [task, initialQ]);

  const question = useMemo(
    () => task?.questions.find((q) => q.id === questionId),
    [task, questionId]
  );

  if (!hydrated) return null;
  if (!task) {
    return (
      <StateBlock
        variant="error"
        title="任务不存在"
        description="无法打开复核详情。"
        actionLabel="返回待复核"
        onAction={() => router.push("/teacher")}
      />
    );
  }

  if (!question) {
    return (
      <StateBlock
        title="没有识别到题目"
        description="该任务暂无题目可复核。"
        actionLabel="返回"
        onAction={() => router.push("/teacher")}
      />
    );
  }

  const loadDraft = (qid: string) => {
    const q = task.questions.find((item) => item.id === qid);
    if (!q) return;
    setQuestionId(qid);
    setDraft({
      questionText: q.questionText,
      verifiedCorrectAnswer: q.verifiedCorrectAnswer ?? "",
      knowledgePoint: q.knowledgePoint ?? "",
      errorType: q.errorType ?? "",
    });
    setSavedMsg(null);
  };

  const save = (mode: "confirm" | "correct" | "mark_teacher_wrong") => {
    dataService.teacherReviewQuestion(task.id, question.id, {
      questionText: draft.questionText,
      verifiedCorrectAnswer: draft.verifiedCorrectAnswer,
      knowledgePoint: draft.knowledgePoint,
      errorType: draft.errorType,
      teacherMarkingResult:
        mode === "mark_teacher_wrong" ? "incorrect" : question.teacherMarkingResult,
      reviewStatus: mode === "confirm" ? "teacher_confirmed" : "teacher_corrected",
      selectedForPractice: true,
      conflictStatus: "student_error",
    });
    setSavedMsg("复核结果已保存");
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">复核详情</h1>
          <p className="text-sm text-text-muted">{task.sourceFileName}</p>
        </div>
        <Button onClick={() => save("confirm")}>完成复核</Button>
      </div>

      {savedMsg ? (
        <div className="rounded-[10px] border border-success/30 bg-success-soft px-4 py-3 text-sm text-success">
          {savedMsg}
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {task.questions.map((q) => (
          <Button
            key={q.id}
            size="sm"
            variant={q.id === question.id ? "primary" : "outline"}
            onClick={() => loadDraft(q.id)}
          >
            第{q.questionNo}题
          </Button>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>原始作业</CardTitle>
            <div className="flex gap-1">
              <Button size="sm" variant="outline" onClick={() => setScale((s) => s + 0.2)}>
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setScale((s) => Math.max(0.5, s - 0.2))}
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="outline" onClick={() => setRotation((r) => r + 90)}>
                <RotateCw className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="relative h-[360px] overflow-auto rounded-[10px] bg-bg">
              <div
                className="relative h-full min-h-[360px] w-full"
                style={{ transform: `scale(${scale}) rotate(${rotation}deg)` }}
              >
                <Image
                  src={task.sourceImageUrl}
                  alt="作业"
                  fill
                  className="object-contain"
                  unoptimized
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>识别与判断</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p>
              <span className="text-text-muted">识别题目：</span>
              {question.questionText}
            </p>
            <p>
              <span className="text-text-muted">学生作答：</span>
              {question.studentWork}
            </p>
            <div className="flex flex-wrap gap-2">
              <Badge>教师原批改：{markingLabel[question.teacherMarkingResult]}</Badge>
              <Badge>AI数学复核：{mathVerdictLabel[question.aiMathVerdict]}</Badge>
              <Badge tone="primary">
                置信度：{confidenceLabel[question.recognitionConfidence]}
              </Badge>
            </div>
            {question.conflictStatus === "teacher_marking_conflict" ? (
              <Badge tone="warning">教师批改与数学复核结果不一致</Badge>
            ) : null}
            <p>
              <span className="text-text-muted">正确答案：</span>
              {question.verifiedCorrectAnswer ?? "—"}
            </p>
            <p>
              <span className="text-text-muted">错误类型：</span>
              {question.errorType ?? "—"}
            </p>
            <p>
              <span className="text-text-muted">知识点：</span>
              {question.knowledgePoint ?? "—"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>复核操作</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <label className="block text-sm">
              <span className="text-text-muted">修改题目</span>
              <textarea
                className="mt-1 w-full rounded-[10px] border border-border px-3 py-2"
                rows={3}
                value={draft.questionText}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, questionText: e.target.value }))
                }
              />
            </label>
            <label className="block text-sm">
              <span className="text-text-muted">修改正确答案</span>
              <input
                className="mt-1 h-11 w-full rounded-[10px] border border-border px-3"
                value={draft.verifiedCorrectAnswer}
                onChange={(e) =>
                  setDraft((d) => ({
                    ...d,
                    verifiedCorrectAnswer: e.target.value,
                  }))
                }
              />
            </label>
            <label className="block text-sm">
              <span className="text-text-muted">修改知识点</span>
              <input
                className="mt-1 h-11 w-full rounded-[10px] border border-border px-3"
                value={draft.knowledgePoint}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, knowledgePoint: e.target.value }))
                }
              />
            </label>
            <label className="block text-sm">
              <span className="text-text-muted">错误类型</span>
              <input
                className="mt-1 h-11 w-full rounded-[10px] border border-border px-3"
                value={draft.errorType}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, errorType: e.target.value }))
                }
              />
            </label>
            <div className="flex flex-col gap-2">
              <Button onClick={() => save("confirm")}>确认AI判断</Button>
              <Button variant="secondary" onClick={() => save("correct")}>
                保存复核结果（含修正）
              </Button>
              <Button variant="outline" onClick={() => save("mark_teacher_wrong")}>
                标记教师批改错误
              </Button>
              <Button
                variant="danger"
                onClick={() => {
                  dataService.rejectRecognition(task.id, question.id);
                  setSavedMsg("已驳回该题识别，请安排重新识别");
                  const next = task.questions.find((q) => q.id !== question.id);
                  if (next) loadDraft(next.id);
                  else router.push("/teacher");
                }}
              >
                驳回重新识别
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
