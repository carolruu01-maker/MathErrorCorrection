"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  BookOpen,
  ChartColumn,
  CheckSquare,
  ClipboardList,
  Home,
  LayoutDashboard,
  Upload,
  UserRound,
  Users,
} from "lucide-react";
import { DEMO_ROLE_NOTICE } from "@/lib/permissions";
import { dataService } from "@/lib/data-service";
import { useAppStore, useCurrentUser, useHydrated } from "@/lib/hooks";
import type { UserRole } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";

const studentNav = [
  { href: "/student", label: "今日练习", icon: Home },
  { href: "/student/wrong-questions", label: "我的错题", icon: BookOpen },
  { href: "/student/progress", label: "学习进展", icon: ChartColumn },
];

const parentNav = [
  { href: "/parent/upload", label: "上传作业", icon: Upload },
  { href: "/parent", label: "待确认", icon: CheckSquare },
  { href: "/parent/practice", label: "练习管理", icon: ClipboardList },
  { href: "/parent/progress", label: "学习进展", icon: ChartColumn },
];

const teacherNav = [
  { href: "/teacher", label: "待复核", icon: CheckSquare },
  { href: "/teacher/students", label: "学生管理", icon: Users },
  { href: "/teacher/analytics", label: "班级诊断", icon: ChartColumn },
  { href: "/teacher/assign", label: "练习布置", icon: ClipboardList },
];

function navForRole(role: UserRole) {
  if (role === "student") return studentNav;
  if (role === "parent") return parentNav;
  return teacherNav;
}

function homeForRole(role: UserRole) {
  if (role === "student") return "/student";
  if (role === "parent") return "/parent";
  return "/teacher";
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const user = useCurrentUser();
  const hydrated = useHydrated();
  const store = useAppStore();
  const pathname = usePathname();
  const router = useRouter();

  if (!hydrated || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-text-muted">
        正在加载演示数据…
      </div>
    );
  }

  const nav = navForRole(user.role);
  const unread = store.notifications.filter(
    (n) => n.userId === user.id && !n.read
  ).length;

  const switchRole = (role: UserRole) => {
    dataService.switchRole(role);
    router.push(homeForRole(role));
  };

  return (
    <div className="min-h-screen bg-bg">
      <header className="sticky top-0 z-40 border-b border-border bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-4 px-4">
          <div className="flex items-center gap-3">
            <Link
              href={homeForRole(user.role)}
              className="flex items-center gap-2 font-semibold text-primary"
            >
              <LayoutDashboard className="h-5 w-5" />
              <span>错题任务中心</span>
            </Link>
            <Badge tone="primary">
              {user.role === "student"
                ? "学生端"
                : user.role === "parent"
                  ? "家长端"
                  : "老师端"}
            </Badge>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/notifications"
              className="relative inline-flex h-11 w-11 items-center justify-center rounded-[10px] hover:bg-bg"
              aria-label="通知中心"
            >
              <Bell className="h-5 w-5" />
              {unread > 0 ? (
                <span className="absolute right-2 top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] text-white">
                  {unread}
                </span>
              ) : null}
            </Link>
            <Link
              href="/account"
              className="inline-flex h-11 items-center gap-2 rounded-[10px] px-2 hover:bg-bg"
            >
              <UserRound className="h-5 w-5 text-primary" />
              <span className="hidden text-sm sm:inline">{user.name}</span>
            </Link>
          </div>
        </div>
      </header>

      <div className="border-b border-warning/20 bg-warning-soft">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-warning sm:text-sm">{DEMO_ROLE_NOTICE}</p>
          <div className="flex flex-wrap gap-2">
            {(["student", "parent", "teacher"] as UserRole[]).map((role) => (
              <Button
                key={role}
                size="sm"
                variant={user.role === role ? "primary" : "outline"}
                onClick={() => switchRole(role)}
              >
                {role === "student"
                  ? "学生：李明"
                  : role === "parent"
                    ? "家长：李明妈妈"
                    : "老师：王老师"}
              </Button>
            ))}
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                dataService.resetDemo();
                router.refresh();
              }}
            >
              重置演示数据
            </Button>
          </div>
        </div>
      </div>

      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:grid-cols-[220px_1fr]">
        <aside className="hidden lg:block">
          <nav className="sticky top-28 space-y-1 rounded-[10px] border border-border bg-white p-3 shadow-[var(--shadow)]">
            {nav.map((item) => {
              const active =
                pathname === item.href ||
                (item.href !== homeForRole(user.role) &&
                  pathname.startsWith(item.href));
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex h-11 items-center gap-2 rounded-[10px] px-3 text-sm transition-colors",
                    active
                      ? "bg-primary text-white"
                      : "text-text hover:bg-primary-soft hover:text-primary"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
            <div className="my-2 border-t border-border" />
            <Link
              href="/tasks"
              className={cn(
                "flex h-11 items-center gap-2 rounded-[10px] px-3 text-sm",
                pathname.startsWith("/tasks")
                  ? "bg-primary text-white"
                  : "text-text hover:bg-primary-soft"
              )}
            >
              <ClipboardList className="h-4 w-4" />
              任务列表
            </Link>
          </nav>
        </aside>

        <main className="min-w-0 pb-24 lg:pb-6">{children}</main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-white lg:hidden">
        <ul className="mx-auto flex max-w-7xl">
          {nav.map((item) => {
            const active =
              pathname === item.href ||
              (item.href !== homeForRole(user.role) &&
                pathname.startsWith(item.href));
            const Icon = item.icon;
            return (
              <li key={item.href} className="flex-1">
                <Link
                  href={item.href}
                  className={cn(
                    "flex h-14 flex-col items-center justify-center gap-1 text-[11px]",
                    active ? "text-primary" : "text-text-muted"
                  )}
                >
                  <Icon className="h-5 w-5" />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
