"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { dataService } from "@/lib/data-service";
import { useAppStore, useHydrated } from "@/lib/hooks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StateBlock } from "@/components/ui/state-block";
import { Button } from "@/components/ui/button";

const COLORS = ["#1e3a5f", "#c2410c", "#15803d", "#b91c1c", "#6b7280", "#2563eb"];

export default function TeacherAnalyticsPage() {
  const hydrated = useHydrated();
  const store = useAppStore();
  const [range, setRange] = useState<"7d" | "30d">("7d");
  const [drillTitle, setDrillTitle] = useState<string | null>(null);
  const [drillQuestions, setDrillQuestions] = useState<
    { id: string; text: string; student: string; taskId: string }[]
  >([]);

  const analytics = useMemo(() => {
    void store.tasks;
    void store.practiceSets;
    void store.submissions;
    return dataService.getClassAnalytics();
  }, [store]);

  if (!hydrated) return null;

  if (!analytics || analytics.totalWrongQuestions === 0) {
    return (
      <StateBlock
        title="班级暂无诊断数据"
        description="当班级出现错题与练习记录后，这里会展示知识点与趋势分析。"
      />
    );
  }

  const trend = range === "7d" ? analytics.trend7d : analytics.trend30d;

  const openDrill = (label: string) => {
    const rows = store.tasks.flatMap((task) => {
      const student = store.students.find((s) => s.id === task.studentId);
      return task.questions
        .filter(
          (q) =>
            q.knowledgePoint === label ||
            q.errorType === label ||
            q.teacherMarkingResult === "incorrect"
        )
        .map((q) => ({
          id: q.id,
          text: `第${q.questionNo}题 ${q.questionText}`,
          student: student?.name ?? "—",
          taskId: task.id,
        }));
    });
    setDrillTitle(label);
    setDrillQuestions(rows.slice(0, 20));
  };

  const knowledgeKeys = Array.from(
    new Set(analytics.studentKnowledgeMatrix.map((m) => m.knowledgePoint))
  );
  const students = Array.from(
    new Set(analytics.studentKnowledgeMatrix.map((m) => m.studentName))
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">班级诊断</h1>
        <p className="mt-1 text-sm text-text-muted">{analytics.className}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle>班级错题总数</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">
            {analytics.totalWrongQuestions}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>学生覆盖人数</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">
            {analytics.studentCoverage}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>待复核数量</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold text-warning">
            {analytics.pendingReviewCount}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>练习完成率 / 正确率变化</CardTitle>
          </CardHeader>
          <CardContent className="text-lg font-semibold">
            {analytics.practiceCompletionRate}% / +{analytics.accuracyChange}%
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>高频知识点排行</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.knowledgeRanking} layout="vertical" margin={{ left: 24 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis type="category" dataKey="name" width={90} />
                <Tooltip />
                <Bar
                  dataKey="count"
                  fill="#1e3a5f"
                  radius={[0, 4, 4, 0]}
                  cursor="pointer"
                  onClick={(data) => {
                    const name = (data as { name?: string }).name;
                    if (name) openDrill(name);
                  }}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>错误类型分布</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={analytics.errorTypeDistribution}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={55}
                  outerRadius={90}
                  onClick={(data) => {
                    const name = (data as { name?: string }).name;
                    if (name) openDrill(name);
                  }}
                >
                  {analytics.errorTypeDistribution.map((entry, index) => (
                    <Cell key={entry.name} fill={COLORS[index % COLORS.length]} cursor="pointer" />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>时间趋势</CardTitle>
          <div className="flex gap-2">
            <Button size="sm" variant={range === "7d" ? "primary" : "outline"} onClick={() => setRange("7d")}>
              近7天
            </Button>
            <Button size="sm" variant={range === "30d" ? "primary" : "outline"} onClick={() => setRange("30d")}>
              近30天
            </Button>
          </div>
        </CardHeader>
        <CardContent className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="wrongCount" name="错题数" stroke="#c2410c" strokeWidth={2} />
              <Line type="monotone" dataKey="accuracy" name="正确率" stroke="#15803d" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>学生知识点矩阵（热力表格）</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr>
                <th className="px-3 py-2 text-left">学生</th>
                {knowledgeKeys.map((kp) => (
                  <th key={kp} className="px-3 py-2 text-left">
                    {kp}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {students.map((stu) => (
                <tr key={stu} className="border-t border-border">
                  <td className="px-3 py-2 font-medium">{stu}</td>
                  {knowledgeKeys.map((kp) => {
                    const cell = analytics.studentKnowledgeMatrix.find(
                      (m) => m.studentName === stu && m.knowledgePoint === kp
                    );
                    const count = cell?.wrongCount ?? 0;
                    const bg =
                      count === 0 ? "#f9fafb" : count < 2 ? "#e8eef5" : count < 4 ? "#fdba74" : "#fecaca";
                    return (
                      <td key={kp} className="px-3 py-2">
                        <button
                          type="button"
                          className="flex h-11 min-w-11 items-center justify-center rounded-md"
                          style={{ background: bg }}
                          onClick={() => openDrill(kp)}
                        >
                          {count}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {drillTitle ? (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>下钻：{drillTitle}</CardTitle>
            <Button size="sm" variant="outline" onClick={() => setDrillTitle(null)}>
              关闭
            </Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {drillQuestions.length === 0 ? (
              <p className="text-sm text-text-muted">该维度下暂无题目。</p>
            ) : (
              drillQuestions.map((q) => (
                <div
                  key={q.id}
                  className="flex flex-col gap-2 rounded-[10px] border border-border px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="text-sm">
                    <p className="font-medium">{q.student}</p>
                    <p className="text-text-muted">{q.text}</p>
                  </div>
                  <Link href={`/tasks/${q.taskId}`}>
                    <Button size="sm" variant="outline">
                      查看题目
                    </Button>
                  </Link>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
