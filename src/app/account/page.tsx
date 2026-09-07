"use client";

import { dataService } from "@/lib/data-service";
import { DEMO_ROLE_NOTICE } from "@/lib/permissions";
import { useCurrentUser, useHydrated } from "@/lib/hooks";
import type { UserRole } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRouter } from "next/navigation";

export default function AccountPage() {
  const hydrated = useHydrated();
  const user = useCurrentUser();
  const router = useRouter();

  if (!hydrated || !user) return null;

  const switchRole = (role: UserRole) => {
    dataService.switchRole(role);
    router.push(
      role === "student" ? "/student" : role === "parent" ? "/parent" : "/teacher"
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">个人账户</h1>
        <p className="mt-1 text-sm text-text-muted">演示账号信息与角色切换</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{user.name}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <p>
            当前角色：
            {user.role === "student"
              ? "学生"
              : user.role === "parent"
                ? "家长"
                : "老师"}
          </p>
          <p className="text-warning">{DEMO_ROLE_NOTICE}</p>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={() => switchRole("student")}>
              切换为学生
            </Button>
            <Button size="sm" onClick={() => switchRole("parent")}>
              切换为家长
            </Button>
            <Button size="sm" onClick={() => switchRole("teacher")}>
              切换为老师
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                dataService.resetDemo();
                router.refresh();
              }}
            >
              重置演示数据
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
