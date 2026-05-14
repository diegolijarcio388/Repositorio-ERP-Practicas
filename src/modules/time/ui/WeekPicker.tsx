import { Button, Input } from "../../../shared/ui";
import {
  getStartOfWeekIso,
  parseIsoDate,
  toIsoDate,
} from "../../../shared/utils/date";

interface WeekPickerProps {
  weekStart: string;
  onChange: (value: string) => void;
}

export function WeekPicker({ weekStart, onChange }: WeekPickerProps) {
  const moveWeek = (offsetDays: number) => {
    const nextDate = parseIsoDate(weekStart);
    nextDate.setDate(nextDate.getDate() + offsetDays);
    onChange(getStartOfWeekIso(nextDate));
  };

  return (
    <div className="flex flex-wrap items-end gap-2">
      <Button variant="secondary" onClick={() => moveWeek(-7)}>
        Semana anterior
      </Button>
      <Button variant="secondary" onClick={() => moveWeek(7)}>
        Semana siguiente
      </Button>
      <div className="w-[170px]">
        <Input
          label="Inicio semana"
          type="date"
          value={weekStart}
          onChange={(event) =>
            onChange(getStartOfWeekIso(parseIsoDate(event.target.value)))
          }
          max={toIsoDate(new Date("2028-12-31"))}
          min={toIsoDate(new Date("2026-01-01"))}
        />
      </div>
    </div>
  );
}
