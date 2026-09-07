"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useAppStore, useHydrated } from "@/lib/hooks";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StateBlock } from "@/components/ui/state-block";

export default function StudentResultPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const hydrated = useHydrated();
  const store = useAppStore();
  const practice = store.practiceSets.find((p) => p.id === params.id);
  const submission = store.submissions.find(
    (s) => s.practiceSetId === params.id && s.submittedAt
  );

  if (!hydrated) return null;

  if (!practice) {
    return (
      <StateBlock
        variant="error"
        title="练习不存在"
        description="无法查看结果。"
        actionLabel="返回"
        onAction={() => router.push("/student")}
      />
    );
  }

  if (!submission?.results) {
    return (
      <StateBlock
        title="学生尚未提交"
        description="提交练习后才能查看得分、正确答案与解析。"
        actionLabel="去完成练习"
        onAction={() => router.push(`/student/practice/${practice.id}`)}
      />
    );
  }

  const correct = submission.results.filter((r) => r.isCorrect).length;
  const wrong = submission.results.length - correct;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">练习结果</h1>
          <p className="text-sm text-text-muted">{practice.title}</p>
        </div>
        <Link href="/student">
          <Button>再练一组</Button>
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>总分</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold text-primary">
            {submission.score}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>正确</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold text-success">
            {correct}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>错误</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold text-danger">
            {wrong}
          </CardContent>
        </Card>
      </div>

      <div className="space-y-3">
        {practice.items.map((item) => {
          const result = submission.results?.find(
            (r) => r.practiceItemId === item.id
          );
          if (!result) return null;
          return (
            <Card key={item.id}>
              <CardHeader className="flex flex-row items-start justify-between gap-3">
                <CardTitle>
                  第 {item.questionNo} 题 · {item.questionText}
                </CardTitle>
                <Badge tone={result.isCorrect ? "success" : "danger"}>
                  {result.isCorrect ? "正确" : "错误"}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p>
                  <span className="text-text-muted">你的答案：</span>
                  {result.studentAnswer}
                </p>
                <p>
                  <span className="text-text-muted">正确答案：</span>
                  {result.correctAnswer}
                </p>
                <div className="rounded-[10px] bg-bg px-3 py-2">
                  <p className="font-medium">分步解析</p>
                  <p className="mt-1 text-text-muted">{result.explanation}</p>
                </div>
                <p>
                  <span className="text-text-muted">知识点：</span>
                  {item.knowledgePoint}
                </p>
                {!result.isCorrect ? (
                  <p className="text-warning">
                    易错提醒：核对移项变号、符号运算与条件是否完整。
                  </p>
                ) : null}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
