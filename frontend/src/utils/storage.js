const SESSION_KEY = "education.session";

export function getSession() {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setSession(session) {
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearSession() {
  window.localStorage.removeItem(SESSION_KEY);
}

export function getAccessToken() {
  return getSession()?.access || "";
}

export const AUTH_EVENTS = {
  UNAUTHORIZED: "education:auth-unauthorized",
};
