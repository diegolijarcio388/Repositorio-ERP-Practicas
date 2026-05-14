import type { InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export function Input({ label, className = "", id, ...props }: InputProps) {
  return (
    <label className="block">
      {label ? (
        <span className="mb-1 block text-sm text-slate-700">{label}</span>
      ) : null}
      <input
        id={id}
        className={`w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none ring-slate-300 focus:ring ${className}`}
        {...props}
      />
    </label>
  );
}
