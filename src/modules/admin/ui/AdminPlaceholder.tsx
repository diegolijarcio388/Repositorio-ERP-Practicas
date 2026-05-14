interface AdminPlaceholderProps {
  title: string;
  description: string;
}

export function AdminPlaceholder({
  title,
  description,
}: AdminPlaceholderProps) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="mt-2 text-sm text-slate-600">{description}</p>
    </section>
  );
}
