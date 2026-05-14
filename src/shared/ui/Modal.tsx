import { useEffect, useState, type ReactNode } from "react";
import { Button } from "./Button";

interface ModalProps {
  open: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
  panelClassName?: string;
  bodyClassName?: string;
}

export function Modal({
  open,
  title,
  children,
  onClose,
  panelClassName,
  bodyClassName,
}: ModalProps) {
  const [isRendered, setIsRendered] = useState(open);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const animationMs = 180;
    if (open) {
      setIsRendered(true);
      const enterTimeout = window.setTimeout(() => setIsVisible(true), 10);
      return () => window.clearTimeout(enterTimeout);
    }
    setIsVisible(false);
    const exitTimeout = window.setTimeout(() => setIsRendered(false), animationMs);
    return () => window.clearTimeout(exitTimeout);
  }, [open]);

  if (!isRendered) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-3 transition-opacity duration-200 ${isVisible ? "opacity-100" : "opacity-0"}`}
    >
      <div
        className={`flex max-h-[90vh] w-full flex-col rounded-xl border border-slate-200 bg-white p-4 shadow-lg transition-all duration-200 ease-out ${isVisible ? "translate-y-0 scale-100 opacity-100" : "translate-y-2 scale-[0.98] opacity-0"} ${panelClassName ?? "max-w-lg"}`}
      >
        <div className="relative mb-4 pt-6">
          <h3 className="px-10 text-center text-xl font-semibold">{title}</h3>
          <Button
            variant="ghost"
            onClick={onClose}
            aria-label="Cerrar modal"
            className="absolute right-0 top-0"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="h-6 w-6"
            >
              <circle cx="12" cy="12" r="9" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.5 9.5l5 5m0-5l-5 5" />
            </svg>
          </Button>
        </div>
        <div className={`min-h-0 overflow-y-auto ${bodyClassName ?? ""}`}>{children}</div>
      </div>
    </div>
  );
}
