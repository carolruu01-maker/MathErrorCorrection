"use client";

import { Suspense } from "react";
import TeacherReviewDetailPage from "./review-detail-client";

export default function Page() {
  return (
    <Suspense fallback={<div className="text-sm text-text-muted">加载复核详情…</div>}>
      <TeacherReviewDetailPage />
    </Suspense>
  );
}
