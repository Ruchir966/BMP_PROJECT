import { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import { signInWithEmail, signUpWithEmail, signOut } from "@/lib/supabaseAuth";
import { supabase } from "@/integrations/supabase/client";

export type FarmerProfile = {
  farmerName: string;
  username: string;
  farmLocation: string;
};

type AuthContextType = {
  user: any | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (data: { email: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const session = supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setLoading(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { error, data } = await signInWithEmail(email, password);
    if (error) throw new Error(error.message);
    setUser(data.user);
  }, []);

  const signup = useCallback(async ({ email, password }: { email: string; password: string }) => {
    const { error, data } = await signUpWithEmail(email, password);
    if (error) throw new Error(error.message);
    setUser(data.user);
  }, []);

  const logout = useCallback(async () => {
    await signOut();
    setUser(null);
  }, []);

  const value = useMemo(() => ({ user, loading, login, signup, logout }), [user, loading, login, signup, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
