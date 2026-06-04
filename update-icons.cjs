const fs = require('fs');
const file = 'src/modules/time-control/ui/TimeControlFeature.tsx';
let content = fs.readFileSync(file, 'utf8');

// Update POPUP classes to be flex and centered
content = content.replace(
  /const POPUP_NEUTRAL_BUTTON_CLASS =\s+\"rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm transition-all hover:bg-slate-50 hover:text-slate-900\";/,
  'const POPUP_NEUTRAL_BUTTON_CLASS =\n  \"flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm transition-all hover:bg-slate-50 hover:text-slate-900\";'
);
content = content.replace(
  /const POPUP_PRIMARY_BUTTON_CLASS =\s+\"rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:bg-slate-800\";/,
  'const POPUP_PRIMARY_BUTTON_CLASS =\n  \"flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:bg-slate-800\";'
);
content = content.replace(
  /const POPUP_DANGER_BUTTON_CLASS =\s+\"rounded-xl bg-rose-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:bg-rose-700\";/,
  'const POPUP_DANGER_BUTTON_CLASS =\n  \"flex items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:bg-rose-700\";'
);

// We need a helper to safely replace text inside buttons.
const replacements = [
  { from: />\\s*Limpiar\\s*<\/Button>/g, to: '><i className=\"ti ti-eraser text-lg\" aria-hidden=\"true\" /> Limpiar</Button>' },
  { from: />\\s*Aprobar\\s*<\/Button>/g, to: '><i className=\"ti ti-check text-lg\" aria-hidden=\"true\" /> Aprobar</Button>' },
  { from: />\\s*Rechazar\\s*<\/Button>/g, to: '><i className=\"ti ti-x text-lg\" aria-hidden=\"true\" /> Rechazar</Button>' },
  { from: />\\s*Validar\\s*<\/button>/g, to: '><i className=\"ti ti-check text-lg\" aria-hidden=\"true\" /> Validar</button>' },
  { from: />\\s*Rechazar\\s*<\/button>/g, to: '><i className=\"ti ti-x text-lg\" aria-hidden=\"true\" /> Rechazar</button>' },
  { from: />\\s*Eliminar\\s*<\/Button>/g, to: '><i className=\"ti ti-trash text-lg\" aria-hidden=\"true\" /> Eliminar</Button>' },
  { from: />\\s*Ocultar\\s*<\/Button>/g, to: '><i className=\"ti ti-eye-off text-lg\" aria-hidden=\"true\" /> Ocultar</Button>' },
  { from: />\\s*Enviar justificación\\s*<\/Button>/g, to: '><i className=\"ti ti-send text-lg\" aria-hidden=\"true\" /> Enviar justificación</Button>' },
  { from: />\\s*Enviar solicitud\\s*<\/Button>/g, to: '><i className=\"ti ti-send text-lg\" aria-hidden=\"true\" /> Enviar solicitud</Button>' },
  { from: />\\s*Solicitar fichaje\\s*<\/Button>/g, to: '><i className=\"ti ti-edit text-lg\" aria-hidden=\"true\" /> Solicitar fichaje</Button>' },
  { from: />\\s*Solicitar fichaje anterior\\s*<\/Button>/g, to: '><i className=\"ti ti-history text-lg\" aria-hidden=\"true\" /> Solicitar fichaje anterior</Button>' },
  { from: />\\s*Cerrar jornada\\s*<\/Button>/g, to: '><i className=\"ti ti-door-exit text-lg\" aria-hidden=\"true\" /> Cerrar jornada</Button>' },
  { from: />\\s*Cancelar\\s*<\/Button>/g, to: '><i className=\"ti ti-arrow-back-up text-lg\" aria-hidden=\"true\" /> Cancelar</Button>' },
  { from: />\\s*Cerrar\\s*<\/Button>/g, to: '><i className=\"ti ti-x text-lg\" aria-hidden=\"true\" /> Cerrar</Button>' },
  { from: />\\s*Aceptar\\s*<\/Button>/g, to: '><i className=\"ti ti-check text-lg\" aria-hidden=\"true\" /> Aceptar</Button>' }
];

replacements.forEach(r => {
  content = content.replace(r.from, r.to);
});

// Also fix the missing TS errors if they are not already fixed.
if (!content.includes('incidentRangeFilter')) {
  const tsTarget = `  const [incidentUserFilter, setIncidentUserFilter] = useState("");
  const [incidentUserSearch, setIncidentUserSearch] = useState("");`;
  
  const tsReplacement = `  const [incidentUserFilter, setIncidentUserFilter] = useState("");
  const [incidentUserSearch, setIncidentUserSearch] = useState("");
  const [incidentRangeFilter, setIncidentRangeFilter] = useState<"day" | "week">("day");

  const incidentWeekRange = useMemo(() => {
    const baseDate = trackerDate ? new Date(trackerDate) : new Date();
    const dayOfWeek = baseDate.getDay() || 7;
    const startOfWeek = new Date(baseDate);
    startOfWeek.setDate(baseDate.getDate() - dayOfWeek + 1);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    
    return {
      from: startOfWeek.toISOString().split("T")[0],
      to: endOfWeek.toISOString().split("T")[0],
    };
  }, [trackerDate]);`;

  content = content.replace(tsTarget, tsReplacement);
}

fs.writeFileSync(file, content);
console.log('Edits completed successfully.');
