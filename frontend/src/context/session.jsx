// The SPA has no server-rendered layout to read the session cookie for it, so
// the whole app boots by asking the API "who am I?" once, up front, and hangs
// that answer off context. Every place that used to receive `user` as a
// server-component prop (AppShell, AuthLayout's redirect, etc.) reads it from
// here instead.
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { api } from "../api/client.js";

const SessionContext = createContext(null);

export function SessionProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      setUser(await api.get("/api/v1/auth/me"));
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const me = await api.get("/api/v1/auth/me");
        if (alive) setUser(me);
      } catch {
        if (alive) setUser(null);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const logout = useCallback(async () => {
    await api.post("/api/v1/auth/logout");
    setUser(null);
  }, []);

  return (
    <SessionContext.Provider value={{ user, loading, refresh, logout, setUser }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used within <SessionProvider>");
  return ctx;
}
