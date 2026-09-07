"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function DoneInner() {
  const search = useSearchParams();
  const count = search.get("count") ?? "0";
  return (
    <Card>
      <CardHeader>
        <CardTitle>练习已发布</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-text-muted">
          已成功为 {count} 名学生发布练习。学生端「今日练习」将显示新任务。
        </p>
        <div className="flex gap-2">
          <Link href="/teacher/assign">
            <Button variant="outline">继续布置</Button>
          </Link>
          <Link href="/teacher">
            <Button>返回待复核</Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AssignDonePage() {
  return (
    <Suspense fallback={<div className="text-sm text-text-muted">加载中…</div>}>
      <DoneInner />
    </Suspense>
  );
}
