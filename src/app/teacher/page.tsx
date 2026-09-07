"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useAppStore, useHydrated } from "@/lib/hooks";
import {
  confidenceLabel,
  conflictLabel,
  formatDateTime,
  isParentConfirmableQuestion,
} from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { StateBlock } from "@/components/ui/state-block";

export default function TeacherReviewListPage() {
  const hydrated = useHydrated();
  const store = useAppStore();
  const [classFilter, setClassFilter] = useState("全部");
  const [studentFilter, setStudentFilter] = useState("全部");
  const [conflictFilter, setConflictFilter] = useState("全部");
  const [confidenceFilter, setConfidenceFilter] = useState("全部");
  const [kpFilter, setKpFilter] = useState("全部");
  const [loading] = useState(false);
  const [error] = useState<string | null>(null);

  const reviewItems = useMemo(() => {
    const rows: {
      taskId: string;
      questionId: string;
      studentName: string;
      className: string;
      fileName: string;
      questionNo: string;
      knowledgePoint: string;
      conflictStatus: string;
      confidence: string;
      uploadedAt: string;
      priority: number;
      reason: string;
    }[] = [];

    store.tasks.forEach((task) => {
      const student = store.students.find((s) => s.id === task.studentId);
      task.questions.forEach((q) => {
        const needs =
          q.conflictStatus === "teacher_marking_conflict" ||
          q.conflictStatus === "needs_review" ||
          q.recognitionConfidence === "low" ||
          q.aiMathVerdict === "insufficient_information" ||
          (q.reviewStatus === "pending" &&
            task.status === "needs_teacher_review" &&
            isParentConfirmableQuestion(q));
        if (!needs || q.reviewStatus === "teacher_confirmed" || q.reviewStatus === "teacher_corrected") {
          return;
        }
        let priority = 5;
        let reason = "待复核";
        if (q.conflictStatus === "teacher_marking_conflict") {
          priority = 1;
          reason = "教师批改与AI数学复核冲突";
        } else if (q.recognitionConfidence === "low") {
          priority = 2;
          reason = "低置信度识别";
        } else if (q.conflictStatus === "needs_review") {
          priority = 3;
          reason = "家长提交复核";
        } else if (q.aiMathVerdict === "insufficient_information") {
          priority = 4;
          reason = "题目条件不足 / AI无法判断";
        }
        rows.push({
          taskId: task.id,
          questionId: q.id,
          studentName: student?.name ?? "未知",
          className: student?.className ?? "—",
          fileName: task.sourceFileName,
          questionNo: q.questionNo,
          knowledgePoint: q.knowledgePoint ?? "未分类",
          conflictStatus: q.conflictStatus,
          confidence: q.recognitionConfidence,
          uploadedAt: task.uploadedAt,
          priority,
          reason,
        });
      });
    });
    return rows.sort((a, b) => a.priority - b.priority);
  }, [store]);

  const filtered = reviewItems.filter((row) => {
    if (classFilter !== "全部" && row.className !== classFilter) return false;
    if (studentFilter !== "全部" && row.studentName !== studentFilter) return false;
    if (conflictFilter !== "全部" && row.conflictStatus !== conflictFilter) return false;
    if (confidenceFilter !== "全部" && row.confidence !== confidenceFilter) return false;
    if (kpFilter !== "全部" && row.knowledgePoint !== kpFilter) return false;
    return true;
  });

  if (!hydrated) return null;

  if (error) {
    return (
      <StateBlock
        variant="error"
        title="待复核列表加载失败"
        description={error}
        actionLabel="重试"
        onAction={() => window.location.reload()}
      />
    );
  }

  if (loading) {
    return (
      <StateBlock
        variant="loading"
        title="加载中"
        description="正在获取待复核题目…"
      />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">待复核</h1>
        <p className="mt-1 text-sm text-text-muted">
          优先处理批改冲突、低置信度与家长提交的复核请求
        </p>
      </div>

      <Card>
        <CardContent className="grid gap-3 py-5 sm:grid-cols-2 lg:grid-cols-3">
          <label className="text-sm">
            <span className="mb-1 block text-text-muted">班级</span>
            <select
              className="h-11 w-full rounded-[10px] border border-border px-3"
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
            >
              <option>全部</option>
              <option>初一（3）班</option>
            </select>
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-text-muted">学生</span>
            <select
              className="h-11 w-full rounded-[10px] border border-border px-3"
              value={studentFilter}
              onChange={(e) => setStudentFilter(e.target.value)}
            >
              <option>全部</option>
              {store.students.map((s) => (
                <option key={s.id}>{s.name}</option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-text-muted">冲突类型</span>
            <select
              className="h-11 w-full rounded-[10px] border border-border px-3"
              value={conflictFilter}
              onChange={(e) => setConflictFilter(e.target.value)}
            >
              <option>全部</option>
              <option value="teacher_marking_conflict">teacher_marking_conflict</option>
              <option value="needs_review">needs_review</option>
              <option value="student_error">student_error</option>
            </select>
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-text-muted">识别置信度</span>
            <select
              className="h-11 w-full rounded-[10px] border border-border px-3"
              value={confidenceFilter}
              onChange={(e) => setConfidenceFilter(e.target.value)}
            >
              <option>全部</option>
              <option value="high">high</option>
              <option value="medium">medium</option>
              <option value="low">low</option>
            </select>
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-text-muted">知识点</span>
            <select
              className="h-11 w-full rounded-[10px] border border-border px-3"
              value={kpFilter}
              onChange={(e) => setKpFilter(e.target.value)}
            >
              <option>全部</option>
              {Array.from(new Set(reviewItems.map((r) => r.knowledgePoint))).map(
                (kp) => (
                  <option key={kp}>{kp}</option>
                )
              )}
            </select>
          </label>
        </CardContent>
      </Card>

      {filtered.length === 0 ? (
        <StateBlock
          title="暂无待复核题目"
          description="冲突题与低置信度题目处理完成后会出现在这里的空状态。"
        />
      ) : (
        <div className="overflow-x-auto rounded-[10px] border border-border bg-white">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-border bg-bg text-text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">优先级原因</th>
                <th className="px-4 py-3 font-medium">学生</th>
                <th className="px-4 py-3 font-medium">题目</th>
                <th className="px-4 py-3 font-medium">知识点</th>
                <th className="px-4 py-3 font-medium">冲突</th>
                <th className="px-4 py-3 font-medium">置信度</th>
                <th className="px-4 py-3 font-medium">提交时间</th>
                <th className="px-4 py-3 font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => (
                <tr key={`${row.taskId}-${row.questionId}`} className="border-b border-border">
                  <td className="px-4 py-3">
                    <Badge tone="warning">{row.reason}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    {row.studentName}
                    <div className="text-xs text-text-muted">{row.className}</div>
                  </td>
                  <td className="px-4 py-3">
                    第{row.questionNo}题
                    <div className="text-xs text-text-muted line-clamp-1">
                      {row.fileName}
                    </div>
                  </td>
                  <td className="px-4 py-3">{row.knowledgePoint}</td>
                  <td className="px-4 py-3">
                    {conflictLabel[row.conflictStatus as keyof typeof conflictLabel]}
                  </td>
                  <td className="px-4 py-3">
                    {confidenceLabel[row.confidence as keyof typeof confidenceLabel]}
                  </td>
                  <td className="px-4 py-3">{formatDateTime(row.uploadedAt)}</td>
                  <td className="px-4 py-3">
                    <Link href={`/teacher/review/${row.taskId}?q=${row.questionId}`}>
                      <Button size="sm">复核</Button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
