export type AuthUser = {
  id: number;
  name: string;
  email: string;
  balance: number;
  defaultOrderType: string;
};

export type AuthSession = {
  token: string;
  user: AuthUser;
};

const SESSION_KEY = "tradepilot-session";

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function getStoredSession(): AuthSession | null {
  if (!canUseStorage()) {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as AuthSession;
    if (!parsed?.token || !parsed?.user?.email) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

export function setStoredSession(session: AuthSession) {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearStoredSession() {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.removeItem(SESSION_KEY);
}

export function getToken() {
  return getStoredSession()?.token ?? null;
}

export function getCurrentUser() {
  return getStoredSession()?.user ?? null;
}

export function isAuthenticated() {
  return Boolean(getToken());
}
