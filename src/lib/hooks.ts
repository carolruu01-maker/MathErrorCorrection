"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { dataService } from "./data-service";
import type { AppDataStore, User } from "./types";

function getServerSnapshot(): AppDataStore {
  return {
    version: 1,
    currentUserId: "user_parent_li",
    users: [],
    students: [],
    tasks: [],
    practiceSets: [],
    submissions: [],
    notifications: [],
  };
}

export function useAppStore(): AppDataStore {
  return useSyncExternalStore(
    dataService.subscribe,
    dataService.getSnapshot,
    getServerSnapshot
  );
}

export function useCurrentUser(): User | null {
  const store = useAppStore();
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  if (!hydrated) return null;
  return store.users.find((u) => u.id === store.currentUserId) ?? null;
}

export function useHydrated(): boolean {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  return hydrated;
}
