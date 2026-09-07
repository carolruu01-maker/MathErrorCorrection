"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCurrentUser, useHydrated } from "@/lib/hooks";

export default function HomePage() {
  const user = useCurrentUser();
  const hydrated = useHydrated();
  const router = useRouter();

  useEffect(() => {
    if (!hydrated || !user) return;
    if (user.role === "student") router.replace("/student");
    else if (user.role === "parent") router.replace("/parent");
    else router.replace("/teacher");
  }, [hydrated, user, router]);

  return (
    <div className="rounded-[10px] border border-border bg-white p-8 text-sm text-text-muted">
      正在进入角色工作台…
    </div>
  );
}
