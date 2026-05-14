const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const asDate = (value: string): Date => {
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Fecha invalida: ${value}`);
  }
  return date;
};

export const isIsoDay = (value: string): boolean => ISO_DATE_RE.test(value);

export const normalizeDays = (days: string[]): string[] => {
  if (!Array.isArray(days) || days.length === 0) {
    throw new Error("days no puede estar vacio.");
  }
  const unique = new Set<string>();
  for (const day of days) {
    if (!isIsoDay(day)) throw new Error(`Formato de fecha invalido: ${day}`);
    asDate(day);
    unique.add(day);
  }
  return [...unique].sort();
};

export const expandDateRangeToDays = (
  startDate: string,
  endDate: string,
): string[] => {
  if (!isIsoDay(startDate) || !isIsoDay(endDate)) {
    throw new Error("Rango de fechas invalido.");
  }
  const start = asDate(startDate);
  const end = asDate(endDate);
  if (end.getTime() < start.getTime()) {
    throw new Error("endDate debe ser mayor o igual a startDate.");
  }
  const result: string[] = [];
  const cursor = new Date(start);
  while (cursor.getTime() <= end.getTime()) {
    result.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return result;
};

export const getDateBounds = (days: string[]): { from: string; to: string } => {
  const normalized = normalizeDays(days);
  return { from: normalized[0], to: normalized[normalized.length - 1] };
};
