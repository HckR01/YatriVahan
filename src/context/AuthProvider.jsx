import { useEffect, useMemo, useState } from "react";
import { AuthContext } from "./auth-context";
import { isSupabaseConfigured, supabase } from "../lib/supabase";

const DEMO_USER_KEY = "yatrivahan-demo-user";
const DEMO_ACCOUNTS_KEY = "yatrivahan-demo-accounts";

const readJson = (key, fallback) => {
  try {
    return JSON.parse(localStorage.getItem(key)) || fallback;
  } catch {
    return fallback;
  }
};

const toDemoUser = (account) => ({
  id: account.id,
  email: account.email,
  phone: account.phone || "",
  user_metadata: {
    full_name: account.fullName,
    role: account.role || "traveller",
  },
  app_metadata: { provider: "demo" },
});

const hashPassword = async (password) => {
  const data = new TextEncoder().encode(password);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
};

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(() =>
    isSupabaseConfigured ? null : readJson(DEMO_USER_KEY, null),
  );
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(isSupabaseConfigured);

  useEffect(() => {
    if (!supabase) return undefined;
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session);
      setUser(data.session?.user || null);
      setLoading(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setUser(nextSession?.user || null);
      setLoading(false);
    });
    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const actions = useMemo(
    () => ({
      async signIn(email, password) {
        if (supabase) {
          const { data, error } = await supabase.auth.signInWithPassword({ email, password });
          if (error) throw error;
          return data.user;
        }
        const accounts = readJson(DEMO_ACCOUNTS_KEY, []);
        const passwordHash = await hashPassword(password);
        const account = accounts.find(
          (item) => item.email === email.trim().toLowerCase() && item.passwordHash === passwordHash,
        );
        if (!account) throw new Error("Email or password is incorrect. Create a demo account first.");
        const nextUser = toDemoUser(account);
        localStorage.setItem(DEMO_USER_KEY, JSON.stringify(nextUser));
        setUser(nextUser);
        return nextUser;
      },
      async signUp({ email, password, fullName, phone, role }) {
        if (supabase) {
          const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: { data: { full_name: fullName, phone, role } },
          });
          if (error) throw error;
          return data.user;
        }
        const accounts = readJson(DEMO_ACCOUNTS_KEY, []);
        const normalizedEmail = email.trim().toLowerCase();
        if (accounts.some((item) => item.email === normalizedEmail)) {
          throw new Error("An account with this email already exists.");
        }
        const account = {
          id: `demo-user-${Date.now()}`,
          email: normalizedEmail,
          fullName,
          phone,
          role,
          passwordHash: await hashPassword(password),
        };
        localStorage.setItem(DEMO_ACCOUNTS_KEY, JSON.stringify([...accounts, account]));
        const nextUser = toDemoUser(account);
        localStorage.setItem(DEMO_USER_KEY, JSON.stringify(nextUser));
        setUser(nextUser);
        return nextUser;
      },
      async signOut() {
        if (supabase) await supabase.auth.signOut();
        localStorage.removeItem(DEMO_USER_KEY);
        setUser(null);
        setSession(null);
      },
      async updateLocalUser(updates) {
        if (supabase) {
          const { data, error } = await supabase.auth.updateUser({ data: updates });
          if (error) throw error;
          return data.user;
        }
        const next = {
          ...user,
          phone: updates.phone ?? user?.phone,
          user_metadata: { ...user?.user_metadata, ...updates },
        };
        localStorage.setItem(DEMO_USER_KEY, JSON.stringify(next));
        setUser(next);
        return next;
      },
    }),
    [user],
  );

  const value = useMemo(
    () => ({ user, session, loading, isDemoMode: !isSupabaseConfigured, ...actions }),
    [actions, loading, session, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
