"use client";

import Link from "next/link";
import { dataService } from "@/lib/data-service";
import { useAppStore, useCurrentUser, useHydrated } from "@/lib/hooks";
import { formatDateTime } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { StateBlock } from "@/components/ui/state-block";

export default function NotificationsPage() {
  const hydrated = useHydrated();
  const user = useCurrentUser();
  const store = useAppStore();

  if (!hydrated || !user) return null;

  const items = store.notifications.filter((n) => n.userId === user.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">通知中心</h1>
        <p className="mt-1 text-sm text-text-muted">与当前角色相关的任务提醒</p>
      </div>
      {items.length === 0 ? (
        <StateBlock title="暂无通知" description="有新任务时会在这里提醒你。" />
      ) : (
        <div className="space-y-3">
          {items.map((n) => (
            <Card key={n.id} className={n.read ? "opacity-70" : undefined}>
              <CardContent className="flex flex-col gap-3 py-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-medium">{n.title}</p>
                  <p className="mt-1 text-sm text-text-muted">{n.body}</p>
                  <p className="mt-1 text-xs text-text-muted">
                    {formatDateTime(n.createdAt)}
                  </p>
                </div>
                <div className="flex gap-2">
                  {!n.read ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => dataService.markNotificationRead(n.id)}
                    >
                      标为已读
                    </Button>
                  ) : null}
                  {n.href ? (
                    <Link href={n.href}>
                      <Button
                        size="sm"
                        onClick={() => dataService.markNotificationRead(n.id)}
                      >
                        查看
                      </Button>
                    </Link>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
