import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: any | null;
  isAdmin: boolean;
  loading: boolean;
  signUp: (email: string, password: string, displayName: string, role?: 'user' | 'admin') => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (!error && data) {
        setProfile(data);
      }
    } catch (err) {
      console.error("Error fetching profile:", err);
    }
  };

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (mounted) {
          setSession(session);
          setUser(session?.user ?? null);
          if (session?.user) {
            await fetchProfile(session.user.id);
          }
        }
      } catch (err) {
        console.error("Auth initialization error:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log(`🔔 Auth State Change: ${event}`, session ? "User Found" : "No User");
      if (!mounted) return;

      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        // Fetch profile in the background without blocking the loading state
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
      }

      // Release the loading lock immediately so UI can render
      setLoading(false);
    });

    initializeAuth();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const isAdmin = profile?.role === "admin";

  const signUp = async (email: string, password: string, displayName: string, role: 'user' | 'admin' = 'user') => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: {
          display_name: displayName,
          role: role
        },
      },
    });
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signOut = async () => {
    console.log("🚀 EXPLOSIVE SIGN OUT INITIATED");

    // 1. Attempt Supabase signout (non-blocking)
    supabase.auth.signOut().catch(err => console.error("Supabase signOut error:", err));

    // 2. Clear ALL local storage related to the app
    localStorage.clear();
    console.log("🧹 LocalStorage wiped clean.");

    // 3. Clear query cache
    try {
      queryClient.clear();
      console.log("✨ Query cache cleared.");
    } catch (e) {
      console.error("QueryClient clear error:", e);
    }

    // 4. Reset all reactive states
    setUser(null);
    setSession(null);
    setProfile(null);
    setLoading(false);
    console.log("👤 All reactive states reset.");

    // 5. Nuclear option: hard redirect to home
    console.log("☢️ Executing hard reload to home...");
    window.location.href = window.location.origin;
  };

  return (
    <AuthContext.Provider value={{ user, session, profile, isAdmin, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
