"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import {
  Maximize2,
  RotateCw,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { dataService } from "@/lib/data-service";
import { useAppStore, useHydrated } from "@/lib/hooks";
import {
  canSelectForPractice,
  confidenceLabel,
  conflictLabel,
  isParentConfirmableQuestion,
  markingLabel,
  mathVerdictLabel,
} from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StateBlock } from "@/components/ui/state-block";

export default function ParentConfirmPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const hydrated = useHydrated();
  const store = useAppStore();
  const task = store.tasks.find((t) => t.id === params.id);

  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState({
    questionText: "",
    studentWork: "",
    verifiedCorrectAnswer: "",
    knowledgePoint: "",
  });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const questions = useMemo(
    () => (task ? task.questions.filter(isParentConfirmableQuestion) : []),
    [task]
  );

  if (!hydrated) return null;

  if (!task) {
    return (
      <StateBlock
        variant="error"
        title="任务不存在"
        description="该作业任务可能已被删除，或链接已失效。"
        actionLabel="返回家长首页"
        onAction={() => router.push("/parent")}
      />
    );
  }

  if (questions.length === 0) {
    return (
      <StateBlock
        title="没有识别到错题"
        description="本次作业未发现需要确认的错题。你可以返回查看全部题目，或重新上传。"
        actionLabel="查看任务详情"
        onAction={() => router.push(`/tasks/${task.id}`)}
        secondaryLabel="重新上传"
        onSecondary={() => router.push("/parent/upload")}
      />
    );
  }

  const startEdit = (qid: string) => {
    const q = task.questions.find((item) => item.id === qid);
    if (!q) return;
    setEditingId(qid);
    setEditDraft({
      questionText: q.questionText,
      studentWork: q.studentWork,
      verifiedCorrectAnswer: q.verifiedCorrectAnswer ?? "",
      knowledgePoint: q.knowledgePoint ?? "",
    });
  };

  const saveEdit = () => {
    if (!editingId) return;
    dataService.updateQuestion(task.id, editingId, {
      ...editDraft,
      reviewStatus: "parent_confirmed",
    });
    setEditingId(null);
    setMessage("识别内容已修改并确认");
  };

  const confirmAll = async () => {
    setBusy(true);
    try {
      const updated = dataService.confirmQuestions(task.id);
      await dataService.syncToHistory(updated.id, updated.id === "task_save_failed");
      if (updated.status === "needs_teacher_review") {
        setMessage("存在冲突题，已提交老师复核；其余可选题可继续生成练习。");
        router.push(`/parent/practice-setup/${task.id}`);
      } else {
        router.push(`/parent/practice-setup/${task.id}`);
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">确认识别结果</h1>
          <p className="text-sm text-text-muted">{task.sourceFileName}</p>
        </div>
        <Button onClick={confirmAll} loading={busy}>
          确认错题并继续
        </Button>
      </div>

      {message ? (
        <div className="rounded-[10px] border border-primary/20 bg-primary-soft px-4 py-3 text-sm text-primary">
          {message}
        </div>
      ) : null}

      {questions.some((q) => q.recognitionConfidence === "low") ? (
        <div className="rounded-[10px] border border-warning/30 bg-warning-soft px-4 py-3 text-sm text-warning">
          存在低置信度题目，请仔细核对原文后再确认；不确定时可交给老师复核。
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="lg:sticky lg:top-28 lg:self-start">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>原始作业图片</CardTitle>
            <div className="flex gap-1">
              <Button
                size="sm"
                variant="outline"
                aria-label="放大"
                onClick={() => setScale((s) => Math.min(2.5, s + 0.2))}
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                aria-label="缩小"
                onClick={() => setScale((s) => Math.max(0.6, s - 0.2))}
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                aria-label="旋转"
                onClick={() => setRotation((r) => r + 90)}
              >
                <RotateCw className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                aria-label="全屏"
                onClick={() => setFullscreen(true)}
              >
                <Maximize2 className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="relative h-[420px] overflow-auto rounded-[10px] bg-bg">
              <div
                className="relative mx-auto h-full w-full min-h-[420px]"
                style={{
                  transform: `scale(${scale}) rotate(${rotation}deg)`,
                  transformOrigin: "center center",
                }}
              >
                <Image
                  src={task.sourceImageUrl}
                  alt="作业原图"
                  fill
                  className="object-contain"
                  unoptimized
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          {questions.map((q) => {
            const conflict = q.conflictStatus === "teacher_marking_conflict";
            const selectable = canSelectForPractice(q);
            return (
              <Card key={q.id} className={conflict ? "border-warning" : undefined}>
                <CardHeader>
                  <div className="flex flex-wrap items-center gap-2">
                    <CardTitle>第 {q.questionNo} 题</CardTitle>
                    {conflict ? (
                      <Badge tone="warning">
                        教师批改与数学复核结果不一致
                      </Badge>
                    ) : null}
                    {q.recognitionConfidence === "low" ? (
                      <Badge tone="warning">低置信度</Badge>
                    ) : null}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  {editingId === q.id ? (
                    <div className="space-y-2">
                      <label className="block">
                        <span className="text-text-muted">题目内容</span>
                        <textarea
                          className="mt-1 w-full rounded-[10px] border border-border px-3 py-2"
                          rows={2}
                          value={editDraft.questionText}
                          onChange={(e) =>
                            setEditDraft((d) => ({
                              ...d,
                              questionText: e.target.value,
                            }))
                          }
                        />
                      </label>
                      <label className="block">
                        <span className="text-text-muted">学生作答</span>
                        <input
                          className="mt-1 h-11 w-full rounded-[10px] border border-border px-3"
                          value={editDraft.studentWork}
                          onChange={(e) =>
                            setEditDraft((d) => ({
                              ...d,
                              studentWork: e.target.value,
                            }))
                          }
                        />
                      </label>
                      <label className="block">
                        <span className="text-text-muted">正确答案</span>
                        <input
                          className="mt-1 h-11 w-full rounded-[10px] border border-border px-3"
                          value={editDraft.verifiedCorrectAnswer}
                          onChange={(e) =>
                            setEditDraft((d) => ({
                              ...d,
                              verifiedCorrectAnswer: e.target.value,
                            }))
                          }
                        />
                      </label>
                      <label className="block">
                        <span className="text-text-muted">知识点</span>
                        <input
                          className="mt-1 h-11 w-full rounded-[10px] border border-border px-3"
                          value={editDraft.knowledgePoint}
                          onChange={(e) =>
                            setEditDraft((d) => ({
                              ...d,
                              knowledgePoint: e.target.value,
                            }))
                          }
                        />
                      </label>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={saveEdit}>
                          保存修改
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingId(null)}
                        >
                          取消
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p>
                        <span className="text-text-muted">题目：</span>
                        {q.questionText}
                      </p>
                      <p>
                        <span className="text-text-muted">学生作答：</span>
                        {q.studentWork}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <Badge>
                          教师批改：{markingLabel[q.teacherMarkingResult]}
                        </Badge>
                        <Badge>
                          AI复核：{mathVerdictLabel[q.aiMathVerdict]}
                        </Badge>
                        <Badge tone="primary">
                          置信度：{confidenceLabel[q.recognitionConfidence]}
                        </Badge>
                        <Badge
                          tone={
                            q.conflictStatus === "none" ? "neutral" : "warning"
                          }
                        >
                          {conflictLabel[q.conflictStatus]}
                        </Badge>
                      </div>
                      <p>
                        <span className="text-text-muted">AI识别正确答案：</span>
                        {q.verifiedCorrectAnswer ?? "—"}
                      </p>
                      <p>
                        <span className="text-text-muted">知识点：</span>
                        {q.knowledgePoint ?? "—"}
                      </p>
                      <label className="flex min-h-11 items-center gap-2">
                        <input
                          type="checkbox"
                          className="h-4 w-4"
                          checked={q.selectedForPractice}
                          disabled={!selectable}
                          onChange={(e) =>
                            dataService.updateQuestion(task.id, q.id, {
                              selectedForPractice: e.target.checked,
                            })
                          }
                        />
                        <span>
                          选择练习
                          {!selectable
                            ? "（冲突题需老师复核后才可选择）"
                            : ""}
                        </span>
                      </label>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() =>
                            dataService.updateQuestion(task.id, q.id, {
                              reviewStatus: "parent_confirmed",
                            })
                          }
                        >
                          确认无误
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => startEdit(q.id)}
                        >
                          修改识别内容
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            dataService.updateQuestion(task.id, q.id, {
                              isNotWrong: true,
                              selectedForPractice: false,
                              reviewStatus: "parent_confirmed",
                            })
                          }
                        >
                          标记不是错题
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            dataService.submitForTeacherReview(task.id, [q.id]);
                            setMessage("已提交老师复核");
                          }}
                        >
                          交给老师复核
                        </Button>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {fullscreen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          role="dialog"
          aria-modal
        >
          <div className="relative h-full w-full max-w-5xl">
            <Image
              src={task.sourceImageUrl}
              alt="全屏作业"
              fill
              className="object-contain"
              unoptimized
            />
          </div>
          <Button
            className="absolute right-6 top-6"
            variant="secondary"
            onClick={() => setFullscreen(false)}
          >
            关闭
          </Button>
        </div>
      ) : null}
    </div>
  );
}
