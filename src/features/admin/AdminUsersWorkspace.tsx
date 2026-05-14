import { useEffect, useMemo, useState } from "react";
import { Badge, Button, Input, Modal, Select, Table, Toast } from "../../shared/ui";

interface User {
  id: string;
  name: string;
  jobTitle: string | null;
  email: string;
  departmentId: string;
  role: string;
  canManageTimeControlRequests: boolean;
  canManageVacations: boolean;
  canManageProjects: boolean;
}

interface Department {
  id: string;
  name: string;
  coordinatorUserId: string;
}

const ROLE_LABELS: Record<string, string> = {
  worker: "Trabajador",
  coordinator: "Coordinador",
  admin: "Administrador",
};

const ROLE_COLORS: Record<string, string> = {
  worker: "bg-slate-100 text-slate-700",
  coordinator: "bg-blue-100 text-blue-700",
  admin: "bg-purple-100 text-purple-700",
};

const defaultUserForm = () => ({
  name: "",
  jobTitle: "",
  email: "",
  departmentId: "",
  role: "worker",
  canManageTimeControlRequests: false,
  canManageVacations: false,
  canManageProjects: false,
});
const defaultDeptForm = () => ({ name: "", coordinatorUserId: "" });

type UserSortKey = "name" | "jobTitle" | "email";
type SortDirection = "asc" | "desc";

export function AdminUsersWorkspace() {
  const [activeTab, setActiveTab] = useState<"users" | "departments">("users");

  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ tone: "success" | "error"; message: string } | null>(null);

  // User form
  const [userFormOpen, setUserFormOpen] = useState(false);
  const [editUserId, setEditUserId] = useState<string | null>(null);
  const [userForm, setUserForm] = useState(defaultUserForm());

  // Dept form
  const [deptFormOpen, setDeptFormOpen] = useState(false);
  const [editDeptId, setEditDeptId] = useState<string | null>(null);
  const [deptForm, setDeptForm] = useState(defaultDeptForm());

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);

  // Filter
  const [filterDeptId, setFilterDeptId] = useState("");
  const [filterRole, setFilterRole] = useState("");
  const [openHeaderFilter, setOpenHeaderFilter] = useState<"department" | "role" | null>(null);
  const [userSort, setUserSort] = useState<{ key: UserSortKey; direction: SortDirection }>({
    key: "name",
    direction: "asc",
  });

  const load = async () => {
    setLoading(true);
    try {
      const [usersRes, deptsRes] = await Promise.all([
        fetch("/api/directory/users").then((r) => r.json()),
        fetch("/api/directory/departments").then((r) => r.json()),
      ]);
      setUsers(usersRes.items ?? []);
      setDepartments(deptsRes.items ?? []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (!openHeaderFilter) return;
    const handleDocumentMouseDown = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target?.closest("[data-header-filter-root='true']")) {
        setOpenHeaderFilter(null);
      }
    };
    document.addEventListener("mousedown", handleDocumentMouseDown);
    return () => {
      document.removeEventListener("mousedown", handleDocumentMouseDown);
    };
  }, [openHeaderFilter]);

  // ── Users ───────────────────────────────────────────────────────────────────

  const openCreateUser = () => {
    setEditUserId(null);
    setUserForm(defaultUserForm());
    setUserFormOpen(true);
  };

  const openEditUser = (u: User) => {
    setEditUserId(u.id);
    setUserForm({
      name: u.name,
      jobTitle: u.jobTitle ?? "",
      email: u.email,
      departmentId: u.departmentId,
      role: u.role,
      canManageTimeControlRequests: u.canManageTimeControlRequests,
      canManageVacations: u.canManageVacations,
      canManageProjects: u.canManageProjects,
    });
    setUserFormOpen(true);
  };

  const handleSaveUser = async () => {
    if (!userForm.name.trim()) { setToast({ tone: "error", message: "El nombre es obligatorio." }); return; }
    if (!userForm.email.trim()) { setToast({ tone: "error", message: "El email es obligatorio." }); return; }
    if (!userForm.departmentId) { setToast({ tone: "error", message: "Selecciona un departamento." }); return; }
    try {
      if (editUserId) {
        await fetch(`/api/directory/users/${editUserId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(userForm),
        }).then(async (r) => { if (!r.ok) { const d = await r.json(); throw new Error(d.message ?? "Error"); } });
        setToast({ tone: "success", message: "Trabajador actualizado." });
      } else {
        await fetch("/api/directory/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(userForm),
        }).then(async (r) => { if (!r.ok) { const d = await r.json(); throw new Error(d.message ?? "Error"); } });
        setToast({ tone: "success", message: "Trabajador añadido." });
      }
      setUserFormOpen(false);
      await load();
    } catch (e) {
      setToast({ tone: "error", message: e instanceof Error ? e.message : "Error al guardar." });
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteTarget) return;
    try {
      await fetch(`/api/directory/users/${deleteTarget.id}`, { method: "DELETE" })
        .then(async (r) => { if (!r.ok) { const d = await r.json(); throw new Error(d.message ?? "Error"); } });
      setToast({ tone: "success", message: `${deleteTarget.name} eliminado.` });
      setDeleteTarget(null);
      await load();
    } catch (e) {
      setToast({ tone: "error", message: e instanceof Error ? e.message : "Error al eliminar." });
      setDeleteTarget(null);
    }
  };

  // ── Departments ──────────────────────────────────────────────────────────────

  const openCreateDept = () => {
    setEditDeptId(null);
    setDeptForm(defaultDeptForm());
    setDeptFormOpen(true);
  };

  const openEditDept = (d: Department) => {
    setEditDeptId(d.id);
    setDeptForm({ name: d.name, coordinatorUserId: d.coordinatorUserId });
    setDeptFormOpen(true);
  };

  const handleSaveDept = async () => {
    if (!deptForm.name.trim()) { setToast({ tone: "error", message: "El nombre es obligatorio." }); return; }
    try {
      if (editDeptId) {
        await fetch(`/api/directory/departments/${editDeptId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(deptForm),
        }).then(async (r) => { if (!r.ok) { const d = await r.json(); throw new Error(d.message ?? "Error"); } });
        setToast({ tone: "success", message: "Departamento actualizado." });
      } else {
        await fetch("/api/directory/departments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(deptForm),
        }).then(async (r) => { if (!r.ok) { const d = await r.json(); throw new Error(d.message ?? "Error"); } });
        setToast({ tone: "success", message: "Departamento creado." });
      }
      setDeptFormOpen(false);
      await load();
    } catch (e) {
      setToast({ tone: "error", message: e instanceof Error ? e.message : "Error al guardar." });
    }
  };

  const deptName = (id: string) => departments.find((d) => d.id === id)?.name ?? "—";
  const coordinators = users.filter((u) => u.role === "coordinator" || u.role === "admin");
  const filteredUsers = users.filter((u) => {
    if (filterDeptId && u.departmentId !== filterDeptId) return false;
    if (filterRole && u.role !== filterRole) return false;
    return true;
  });
  const sortedUsers = useMemo(() => {
    const normalized = (value: string | null | undefined) => (value ?? "").trim().toLocaleLowerCase("es");
    const valueByKey = (user: User, key: UserSortKey) => {
      if (key === "name") return normalized(user.name);
      if (key === "jobTitle") return normalized(user.jobTitle);
      return normalized(user.email);
    };

    const sorted = [...filteredUsers].sort((a, b) =>
      valueByKey(a, userSort.key).localeCompare(valueByKey(b, userSort.key), "es", { sensitivity: "base" }),
    );
    return userSort.direction === "asc" ? sorted : sorted.reverse();
  }, [filteredUsers, userSort, departments]);

  const toggleUserSort = (key: UserSortKey) => {
    setUserSort((current) => {
      if (current.key !== key) return { key, direction: "asc" };
      return { key, direction: current.direction === "asc" ? "desc" : "asc" };
    });
  };

  const sortIndicator = (key: UserSortKey) => {
    if (userSort.key !== key) return "↕";
    return userSort.direction === "asc" ? "↑" : "↓";
  };

  const sortableUserHeader = (label: string, key: UserSortKey) => (
    <button
      type="button"
      className="inline-flex items-center gap-1 text-slate-600 hover:text-slate-900"
      onClick={() => toggleUserSort(key)}
    >
      <span>{label}</span>
      <span className="text-xs">{sortIndicator(key)}</span>
    </button>
  );

  const filterHeader = (
    label: string,
    filterKey: "department" | "role",
    value: string,
    onChange: (value: string) => void,
    options: Array<{ label: string; value: string }>,
  ) => (
    <div className="relative" data-header-filter-root="true">
      <button
        type="button"
        className="inline-flex items-center gap-1 text-slate-600 hover:text-slate-900"
        onClick={() => setOpenHeaderFilter((current) => (current === filterKey ? null : filterKey))}
      >
        <span>{label}</span>
        <span className="text-xs">{value ? "●" : "▾"}</span>
      </button>
      {openHeaderFilter === filterKey && (
        <div className="absolute left-0 top-full z-20 mt-1 min-w-[190px] rounded-md border border-slate-200 bg-white p-2 shadow-lg">
          <select
            className="w-full rounded border border-slate-300 px-2 py-1 text-sm font-normal text-slate-700"
            value={value}
            onChange={(e) => onChange(e.target.value)}
          >
            <option value="">Todos</option>
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );

  const departmentOptions = departments.map((d) => ({ label: d.name, value: d.id }));
  const roleOptions = Object.entries(ROLE_LABELS).map(([value, label]) => ({ label, value }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div>
          <h2 className="text-lg font-semibold">Administración de usuarios</h2>
          <p className="mt-0.5 text-sm text-slate-500">{users.length} trabajadores · {departments.length} departamentos</p>
        </div>
        <Button onClick={activeTab === "users" ? openCreateUser : openCreateDept}>
          {activeTab === "users" ? "+ Nuevo trabajador" : "+ Nuevo departamento"}
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg border border-slate-200 bg-white p-1 shadow-sm">
        {(["users", "departments"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${activeTab === tab ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-50"}`}
          >
            {tab === "users" ? `Trabajadores (${users.length})` : `Departamentos (${departments.length})`}
          </button>
        ))}
      </div>

      {/* Tab: users */}
      {activeTab === "users" && (
        <div className="space-y-3">
          {(filterDeptId || filterRole) && (
            <div className="flex flex-wrap items-center gap-2 px-1">
              {filterDeptId && (
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100"
                  onClick={() => setFilterDeptId("")}
                >
                  <span>Departamento: {deptName(filterDeptId)}</span>
                  <span className="text-sm leading-none">×</span>
                </button>
              )}
              {filterRole && (
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100"
                  onClick={() => setFilterRole("")}
                >
                  <span>Rol: {ROLE_LABELS[filterRole] ?? filterRole}</span>
                  <span className="text-sm leading-none">×</span>
                </button>
              )}
            </div>
          )}
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
            {loading ? (
              <p className="p-5 text-sm text-slate-500">Cargando...</p>
            ) : (
              <Table
                headers={[
                  sortableUserHeader("Nombre", "name"),
                  sortableUserHeader("Puesto", "jobTitle"),
                  sortableUserHeader("Email", "email"),
                  filterHeader("Departamento", "department", filterDeptId, setFilterDeptId, departmentOptions),
                  filterHeader("Rol", "role", filterRole, setFilterRole, roleOptions),
                  "Permisos",
                  "",
                ]}
              >
                {sortedUsers.map((u) => (
                  <tr key={u.id} className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium">{u.name}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{u.jobTitle ?? <span className="text-slate-400">—</span>}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{u.email}</td>
                    <td className="px-4 py-3 text-sm">{deptName(u.departmentId)}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded px-2 py-0.5 text-xs font-medium ${ROLE_COLORS[u.role] ?? "bg-slate-100 text-slate-700"}`}>
                        {ROLE_LABELS[u.role] ?? u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex flex-wrap gap-1">
                        {u.canManageTimeControlRequests && (
                          <span className="rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-800">
                            Fichajes
                          </span>
                        )}
                        {u.canManageVacations && (
                          <span className="rounded bg-blue-100 px-2 py-0.5 text-[10px] font-medium text-blue-800">
                            Vacaciones
                          </span>
                        )}
                        {u.canManageProjects && (
                          <span className="rounded bg-purple-100 px-2 py-0.5 text-[10px] font-medium text-purple-800">
                            Proyectos
                          </span>
                        )}
                        {!u.canManageTimeControlRequests && !u.canManageVacations && !u.canManageProjects && (
                          <span className="text-slate-400">—</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => openEditUser(u)}
                          className="rounded p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                          title="Editar"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                          </svg>
                        </button>
                        <button
                          onClick={() => setDeleteTarget(u)}
                          className="rounded p-1.5 text-red-500 hover:bg-red-50 hover:text-red-700"
                          title="Eliminar"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6"/>
                            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                            <path d="M10 11v6"/>
                            <path d="M14 11v6"/>
                            <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {sortedUsers.length === 0 && (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                    {filterDeptId || filterRole ? "No hay trabajadores con los filtros seleccionados." : "No hay trabajadores."}
                  </td></tr>
                )}
              </Table>
            )}
          </div>
        </div>
      )}

      {/* Tab: departments */}
      {activeTab === "departments" && (
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          {loading ? (
            <p className="p-5 text-sm text-slate-500">Cargando...</p>
          ) : (
            <Table headers={["Nombre", "Coordinador", "Trabajadores", ""]}>
              {departments.map((d) => {
                const coordinator = users.find((u) => u.id === d.coordinatorUserId);
                const memberCount = users.filter((u) => u.departmentId === d.id).length;
                return (
                  <tr key={d.id} className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium">{d.name}</td>
                    <td className="px-4 py-3 text-sm">{coordinator?.name ?? <span className="text-slate-400">—</span>}</td>
                    <td className="px-4 py-3">
                      <Badge>{memberCount}</Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => openEditDept(d)}
                        className="rounded p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                        title="Editar"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                      </button>
                    </td>
                  </tr>
                );
              })}
              {departments.length === 0 && (
                <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-500">No hay departamentos.</td></tr>
              )}
            </Table>
          )}
        </div>
      )}

      {/* User form modal */}
      <Modal
        open={userFormOpen}
        title={editUserId ? "Editar trabajador" : "Nuevo trabajador"}
        onClose={() => setUserFormOpen(false)}
      >
        <div className="space-y-3 pb-2">
          <Input
            label="Nombre completo"
            value={userForm.name}
            onChange={(e) => setUserForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="Nombre Apellido"
          />
          <Input
            label="Puesto (opcional)"
            value={userForm.jobTitle}
            onChange={(e) => setUserForm((f) => ({ ...f, jobTitle: e.target.value }))}
            placeholder="Ej: Técnico I+D, Investigador, Gestor..."
          />
          <Input
            label="Email"
            type="email"
            value={userForm.email}
            onChange={(e) => setUserForm((f) => ({ ...f, email: e.target.value }))}
            placeholder="nombre@example.com"
          />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Departamento</label>
              <select
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                value={userForm.departmentId}
                onChange={(e) => setUserForm((f) => ({ ...f, departmentId: e.target.value }))}
              >
                <option value="">Selecciona…</option>
                {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <Select
              label="Rol"
              value={userForm.role}
              onChange={(e) => setUserForm((f) => ({ ...f, role: e.target.value }))}
              options={[
                { label: "Trabajador", value: "worker" },
                { label: "Coordinador", value: "coordinator" },
                { label: "Administrador", value: "admin" },
              ]}
            />
          </div>
          <div className="space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Permisos transversales</p>
            <div className="grid grid-cols-1 gap-2">
              <label className="flex items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-slate-900"
                  checked={userForm.canManageTimeControlRequests}
                  onChange={(e) =>
                    setUserForm((f) => ({
                      ...f,
                      canManageTimeControlRequests: e.target.checked,
                    }))
                  }
                />
                <span>
                  <span className="block font-medium text-slate-900">Gestionar fichajes</span>
                  <span className="block text-[10px] text-slate-500">Revisar solicitudes de tiempo.</span>
                </span>
              </label>

              <label className="flex items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-slate-900"
                  checked={userForm.canManageVacations}
                  onChange={(e) =>
                    setUserForm((f) => ({
                      ...f,
                      canManageVacations: e.target.checked,
                    }))
                  }
                />
                <span>
                  <span className="block font-medium text-slate-900">Gestionar vacaciones</span>
                  <span className="block text-[10px] text-slate-500">Aprobar o denegar ausencias.</span>
                </span>
              </label>

              <label className="flex items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-slate-900"
                  checked={userForm.canManageProjects}
                  onChange={(e) =>
                    setUserForm((f) => ({
                      ...f,
                      canManageProjects: e.target.checked,
                    }))
                  }
                />
                <span>
                  <span className="block font-medium text-slate-900">Gestionar proyectos</span>
                  <span className="block text-[10px] text-slate-500">Administrar tareas y equipos.</span>
                </span>
              </label>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setUserFormOpen(false)}>Cancelar</Button>
            <Button onClick={handleSaveUser}>{editUserId ? "Guardar cambios" : "Añadir trabajador"}</Button>
          </div>
        </div>
      </Modal>

      {/* Department form modal */}
      <Modal
        open={deptFormOpen}
        title={editDeptId ? "Editar departamento" : "Nuevo departamento"}
        onClose={() => setDeptFormOpen(false)}
      >
        <div className="space-y-3 pb-2">
          <Input
            label="Nombre del departamento"
            value={deptForm.name}
            onChange={(e) => setDeptForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="Ej: I+D+i"
          />
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Coordinador responsable</label>
            <select
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              value={deptForm.coordinatorUserId}
              onChange={(e) => setDeptForm((f) => ({ ...f, coordinatorUserId: e.target.value }))}
            >
              <option value="">Selecciona…</option>
              {coordinators.map((u) => (
                <option key={u.id} value={u.id}>{u.name} ({ROLE_LABELS[u.role]})</option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setDeptFormOpen(false)}>Cancelar</Button>
            <Button onClick={handleSaveDept}>{editDeptId ? "Guardar cambios" : "Crear departamento"}</Button>
          </div>
        </div>
      </Modal>

      {/* Delete confirmation modal */}
      <Modal open={!!deleteTarget} title="Eliminar trabajador" onClose={() => setDeleteTarget(null)}>
        {deleteTarget && (
          <div className="space-y-4 pb-2">
            <p className="text-sm text-slate-700">
              ¿Seguro que quieres eliminar a <strong>{deleteTarget.name}</strong>?
              Esta acción no se puede deshacer.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setDeleteTarget(null)}>Cancelar</Button>
              <button
                onClick={handleDeleteUser}
                className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
              >
                Eliminar
              </button>
            </div>
          </div>
        )}
      </Modal>

      {toast && <Toast message={toast.message} tone={toast.tone} onDone={() => setToast(null)} />}
    </div>
  );
}
