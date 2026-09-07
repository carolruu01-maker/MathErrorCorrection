"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Download, Link2, MoreHorizontal, Printer } from "lucide-react";
import { useAppStore, useHydrated } from "@/lib/hooks";
import { difficultyLabel, formatDateTime } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StateBlock } from "@/components/ui/state-block";
import { useState } from "react";

export default function PracticeDonePage() {
  const params = useParams<{ id: string }>();
  const hydrated = useHydrated();
  const store = useAppStore();
  const practice = store.practiceSets.find((p) => p.id === params.id);
  const [menuOpen, setMenuOpen] = useState(false);
  const [exportMsg, setExportMsg] = useState<string | null>(null);

  if (!hydrated) return null;
  if (!practice) {
    return (
      <StateBlock
        variant="error"
        title="练习不存在"
        description="生成结果可能尚未同步。"
      />
    );
  }

  const exportAction = (label: string, shouldFail = false) => {
    if (shouldFail) {
      setExportMsg("文档导出失败：浏览器拦截或服务暂不可用，请重试或改用打印。");
      return;
    }
    setExportMsg(`已触发「${label}」（演示环境生成本地文本摘要）。`);
    const blob = new Blob(
      [
        `${practice.title}\n题量：${practice.totalQuestions}\n知识点：${practice.knowledgePoints.join("、")}\n`,
        ...practice.items.map(
          (i) =>
            `\n${i.questionNo}. ${i.questionText}\n答案：${i.correctAnswer}\n解析：${i.explanation}\n`
        ),
      ],
      { type: "text/plain;charset=utf-8" }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${practice.title}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">练习已生成</h1>
          <p className="mt-1 text-sm text-text-muted">
            {practice.title} · {formatDateTime(practice.assignedAt ?? "")}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={`/student/practice/${practice.id}`}>
            <Button>查看学生练习入口</Button>
          </Link>
          <div className="relative">
            <Button variant="outline" onClick={() => setMenuOpen((v) => !v)}>
              <MoreHorizontal className="h-4 w-4" />
              更多操作
            </Button>
            {menuOpen ? (
              <div className="absolute right-0 z-20 mt-2 w-56 rounded-[10px] border border-border bg-white p-2 shadow-[var(--shadow)]">
                <button
                  className="flex h-11 w-full items-center gap-2 rounded-md px-2 text-left text-sm hover:bg-bg"
                  onClick={() => exportAction("导出学生练习卷")}
                >
                  <Download className="h-4 w-4" />
                  导出学生练习卷
                </button>
                <button
                  className="flex h-11 w-full items-center gap-2 rounded-md px-2 text-left text-sm hover:bg-bg"
                  onClick={() => exportAction("导出教师答案与解析")}
                >
                  <Download className="h-4 w-4" />
                  导出教师答案与解析
                </button>
                <button
                  className="flex h-11 w-full items-center gap-2 rounded-md px-2 text-left text-sm hover:bg-bg"
                  onClick={() => window.print()}
                >
                  <Printer className="h-4 w-4" />
                  打印练习
                </button>
                <button
                  className="flex h-11 w-full items-center gap-2 rounded-md px-2 text-left text-sm hover:bg-bg"
                  onClick={async () => {
                    const url = `${window.location.origin}/student/practice/${practice.id}`;
                    await navigator.clipboard.writeText(url);
                    setExportMsg("分享链接已复制");
                  }}
                >
                  <Link2 className="h-4 w-4" />
                  复制分享链接
                </button>
                <button
                  className="flex h-11 w-full items-center gap-2 rounded-md px-2 text-left text-sm text-danger hover:bg-danger-soft"
                  onClick={() => exportAction("Word导出", true)}
                >
                  模拟导出失败
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {exportMsg ? (
        <div className="rounded-[10px] border border-border bg-white px-4 py-3 text-sm">
          {exportMsg}
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>题量</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">
            {practice.totalQuestions}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>难度</CardTitle>
          </CardHeader>
          <CardContent className="text-xl font-semibold">
            {difficultyLabel[practice.difficulty]}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>预计用时</CardTitle>
          </CardHeader>
          <CardContent className="text-xl font-semibold">
            {practice.estimatedMinutes ?? "—"} 分钟
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>题目预览</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {practice.items.map((item) => (
            <div
              key={item.id}
              className="rounded-[10px] border border-border px-4 py-3 text-sm"
            >
              <p className="font-medium">
                {item.questionNo}. {item.questionText}
              </p>
              <p className="mt-1 text-text-muted">
                知识点：{item.knowledgePoint} · 题型：
                {item.questionType === "choice"
                  ? "选择"
                  : item.questionType === "blank"
                    ? "填空"
                    : "解答"}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
