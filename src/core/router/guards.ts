import type { APIContext } from "astro";
import { SESSION_COOKIE_KEY } from "../config/keys";
import type { UserSession } from "../types";

const parseSessionFromCookie = (
  rawCookie: string | undefined,
): UserSession | null => {
  if (!rawCookie) return null;
  try {
    const parsed = JSON.parse(decodeURIComponent(rawCookie)) as UserSession;
    if (!parsed.email || !parsed.role) return null;
    return parsed;
  } catch {
    return null;
  }
};

export const getOptionalSession = (context: APIContext): UserSession | null => {
  const rawCookie = context.cookies.get(SESSION_COOKIE_KEY)?.value;
  return parseSessionFromCookie(rawCookie);
};

export const requireAuth = (context: APIContext): UserSession | Response => {
  const session = getOptionalSession(context);
  if (!session) return context.redirect("/login");
  return session;
};

export const requireAdmin = (context: APIContext): UserSession | Response => {
  const auth = requireAuth(context);
  if (auth instanceof Response) return auth;
  if (auth.role !== "Admin") return context.redirect("/dashboard");
  return auth;
};
