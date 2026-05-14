import { TIME_ENTRIES_CHANGE_EVENT } from "../config/keys";
import type { Year } from "../types";

export const notifyTimeEntriesChange = (year: Year): void => {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent<Year>(TIME_ENTRIES_CHANGE_EVENT, { detail: year }),
  );
};

export const subscribeTimeEntriesChange = (
  cb: (year: Year) => void,
): (() => void) => {
  if (typeof window === "undefined") return () => {};
  const listener = (event: Event) => {
    const customEvent = event as CustomEvent<Year>;
    cb(customEvent.detail);
  };
  window.addEventListener(TIME_ENTRIES_CHANGE_EVENT, listener);
  return () => window.removeEventListener(TIME_ENTRIES_CHANGE_EVENT, listener);
};
