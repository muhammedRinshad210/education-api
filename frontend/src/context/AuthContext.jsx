import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { clearSession, getSession, setSession, AUTH_EVENTS } from "../utils/storage";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSessionState] = useState(getSession());

  useEffect(() => {
    const handleUnauthorized = () => {
      clearSession();
      setSessionState(null);
    };

    window.addEventListener(AUTH_EVENTS.UNAUTHORIZED, handleUnauthorized);
    return () => window.removeEventListener(AUTH_EVENTS.UNAUTHORIZED, handleUnauthorized);
  }, []);

  const value = useMemo(
    () => ({
      session,
      user: session?.user || null,
      role: session?.role || null,
      isAuthenticated: Boolean(session?.access),
      login(nextSession) {
        setSession(nextSession);
        setSessionState(nextSession);
      },
      logout() {
        clearSession();
        setSessionState(null);
      },
    }),
    [session],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
