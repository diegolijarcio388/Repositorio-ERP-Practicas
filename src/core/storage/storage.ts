import { STORAGE_NAMESPACE } from "../config/keys";

const buildKey = (key: string) => `${STORAGE_NAMESPACE}:${key}`;

const canUseStorage = () =>
  typeof window !== "undefined" && typeof window.localStorage !== "undefined";

export const storage = {
  get<T>(key: string, fallback: T): T {
    if (!canUseStorage()) return fallback;
    const rawValue = window.localStorage.getItem(buildKey(key));
    if (!rawValue) return fallback;
    try {
      return JSON.parse(rawValue) as T;
    } catch {
      return fallback;
    }
  },
  set<T>(key: string, value: T): void {
    if (!canUseStorage()) return;
    window.localStorage.setItem(buildKey(key), JSON.stringify(value));
  },
  remove(key: string): void {
    if (!canUseStorage()) return;
    window.localStorage.removeItem(buildKey(key));
  },
};
