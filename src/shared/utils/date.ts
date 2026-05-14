const MS_PER_DAY = 24 * 60 * 60 * 1000;

export const toIsoDate = (value: Date): string => {
  return new Date(value.getTime() - value.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 10);
};

export const parseIsoDate = (value: string): Date => {
  return new Date(`${value}T00:00:00`);
};

export const getStartOfWeekIso = (value: Date): string => {
  const date = new Date(value);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  return toIsoDate(date);
};

export const getWeekDays = (weekStartIso: string): string[] => {
  const weekStartDate = parseIsoDate(weekStartIso);
  return Array.from({ length: 7 }, (_, index) =>
    toIsoDate(new Date(weekStartDate.getTime() + index * MS_PER_DAY)),
  );
};

export const formatShortDate = (isoDate: string): string => {
  return parseIsoDate(isoDate).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "2-digit",
  });
};

export const formatDate = (isoDate?: string | null): string => {
  if (!isoDate) return "—";
  return parseIsoDate(isoDate.slice(0, 10)).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};
