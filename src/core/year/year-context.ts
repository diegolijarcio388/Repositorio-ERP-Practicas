import { YEAR_CHANGE_EVENT, YEAR_STORAGE_KEY } from "../config/keys";
import type { Year } from "../types";
import { SUPPORTED_YEARS } from "../types";
import { storage } from "../storage/storage";

const DEFAULT_YEAR: Year = 2026;

const toSafeYear = (value: number): Year => {
  if (SUPPORTED_YEARS.includes(value as Year)) return value as Year;
  return DEFAULT_YEAR;
};

export const getYear = (): Year => {
  const saved = storage.get<number>(YEAR_STORAGE_KEY, DEFAULT_YEAR);
  return toSafeYear(saved);
};

export const setYear = (year: number): void => {
  const safeYear = toSafeYear(year);
  storage.set(YEAR_STORAGE_KEY, safeYear);
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent<Year>(YEAR_CHANGE_EVENT, { detail: safeYear }),
    );
  }
};

export const subscribeYearChange = (cb: (year: Year) => void): (() => void) => {
  if (typeof window === "undefined") return () => {};
  const listener = (event: Event) => {
    const customEvent = event as CustomEvent<Year>;
    cb(customEvent.detail);
  };
  window.addEventListener(YEAR_CHANGE_EVENT, listener);
  return () => window.removeEventListener(YEAR_CHANGE_EVENT, listener);
};
