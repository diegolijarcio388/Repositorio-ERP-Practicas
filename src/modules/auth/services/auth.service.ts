import {
  SESSION_CHANGE_EVENT,
  SESSION_COOKIE_KEY,
} from "../../../core/config/keys";
import type { AuthProvider } from "../../../core/ports";
import type { Role, UserSession } from "../../../core/types";
import { storage } from "../../../core/storage/storage";

const AUTH_STORAGE_KEY = "auth_session";

const lookupUser = async (
  email: string,
): Promise<{
  role: Role;
  displayName: string;
  canManageTimeControlRequests: boolean;
  timeControlDevicePolicy: "TABLET_ONLY" | "MOBILE_ONLY" | "TABLET_OR_MOBILE";
  canManageVacations: boolean;
  canManageProjects: boolean;
}> => {
  try {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    if (res.ok) {
      const data = await res.json();
      return {
        role: data.role as Role,
        displayName: data.displayName,
        canManageTimeControlRequests: Boolean(
          data.canManageTimeControlRequests,
        ),
        timeControlDevicePolicy:
          data.timeControlDevicePolicy === "MOBILE_ONLY" ||
          data.timeControlDevicePolicy === "TABLET_OR_MOBILE"
            ? data.timeControlDevicePolicy
            : "TABLET_ONLY",
        canManageVacations: Boolean(data.canManageVacations),
        canManageProjects: Boolean(data.canManageProjects),
      };
    }
  } catch {
    // fallback si el endpoint no responde
  }
  const [leftSide] = email.split("@");
  return {
    role: "Empleado",
    displayName: leftSide.charAt(0).toUpperCase() + leftSide.slice(1),
    canManageTimeControlRequests: false,
    timeControlDevicePolicy: "TABLET_ONLY",
    canManageVacations: false,
    canManageProjects: false,
  };
};

const notifySessionChange = (session: UserSession | null): void => {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent<UserSession | null>(SESSION_CHANGE_EVENT, {
      detail: session,
    }),
  );
};

const writeSessionCookie = (session: UserSession | null): void => {
  if (typeof document === "undefined") return;
  if (!session) {
    document.cookie = `${SESSION_COOKIE_KEY}=; Path=/; Max-Age=0; SameSite=Lax`;
    return;
  }
  const payload = encodeURIComponent(JSON.stringify(session));
  document.cookie = `${SESSION_COOKIE_KEY}=${payload}; Path=/; Max-Age=2592000; SameSite=Lax`;
};

class LocalAuthService implements AuthProvider {
  async login(email: string): Promise<UserSession> {
    const normalizedEmail = email.trim().toLowerCase();
    const {
      role,
      displayName,
      canManageTimeControlRequests,
      timeControlDevicePolicy,
      canManageVacations,
      canManageProjects,
    } = await lookupUser(normalizedEmail);
    const session: UserSession = {
      email: normalizedEmail,
      role,
      displayName,
      canManageTimeControlRequests,
      timeControlDevicePolicy,
      canManageVacations,
      canManageProjects,
    };
    storage.set(AUTH_STORAGE_KEY, session);
    writeSessionCookie(session);
    notifySessionChange(session);
    return session;
  }

  async logout(): Promise<void> {
    storage.remove(AUTH_STORAGE_KEY);
    writeSessionCookie(null);
    notifySessionChange(null);
  }

  getSession(): UserSession | null {
    return storage.get<UserSession | null>(AUTH_STORAGE_KEY, null);
  }

  subscribe(cb: (session: UserSession | null) => void): () => void {
    if (typeof window === "undefined") return () => {};
    const listener = (event: Event) => {
      const customEvent = event as CustomEvent<UserSession | null>;
      cb(customEvent.detail);
    };
    window.addEventListener(SESSION_CHANGE_EVENT, listener);
    return () => window.removeEventListener(SESSION_CHANGE_EVENT, listener);
  }
}

export const createAuthService = (): AuthProvider => new LocalAuthService();
