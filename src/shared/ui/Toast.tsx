import { useEffect, useState } from "react";

interface ToastProps {
  message: string;
  tone?: "success" | "error";
  onDone?: () => void;
}

export function Toast({ message, tone = "success", onDone }: ToastProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setVisible(false);
      onDone?.();
    }, 2400);
    return () => window.clearTimeout(timeout);
  }, [onDone]);

  if (!visible) return null;
  const toneClass = tone === "success" ? "bg-emerald-600" : "bg-rose-600";
  return (
    <div
      className={`fixed bottom-4 right-4 z-50 rounded-md px-4 py-2 text-sm text-white shadow ${toneClass}`}
    >
      {message}
    </div>
  );
}
