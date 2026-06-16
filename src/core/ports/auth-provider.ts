import type { UserSession } from "../types";

export interface AuthProvider {
  login(email: string): Promise<UserSession>;
  loginWithTabletCode(code: string): Promise<UserSession>;
  logout(): Promise<void>;
  getSession(): UserSession | null;
  subscribe(cb: (session: UserSession | null) => void): () => void;
}
