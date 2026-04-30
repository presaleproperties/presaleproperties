import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type AppRole = "admin" | "moderator" | "user" | "developer" | "agent" | "team_member";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  role: AppRole;
  isAdmin: boolean;
  isAgent: boolean;
  isTeamMember: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, metadata: SignUpMetadata) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

interface SignUpMetadata {
  full_name: string;
  phone?: string;
  license_number: string;
  brokerage_name: string;
  brokerage_address?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [roleReady, setRoleReady] = useState(false);
  const [role, setRole] = useState<AppRole>("user");

  const isAdmin = role === "admin";
  const isAgent = role === "agent" || role === "admin";
  const isTeamMember = role === "team_member" || role === "admin";

  // `loading` stays true until BOTH the session AND the role have been resolved.
  // This prevents ProtectedRoute from redirecting before roles load.
  const loading = !authReady || (!!user && !roleReady);

  const fetchRole = async (userId: string) => {
    setRoleReady(false);
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .order("role");

    if (data && data.length > 0) {
      const roles = data.map((r) => r.role as AppRole);
      if (roles.includes("admin")) setRole("admin");
      else if (roles.includes("agent")) setRole("agent");
      else if (roles.includes("team_member")) setRole("team_member");
      else if (roles.includes("developer")) setRole("developer");
      else if (roles.includes("moderator")) setRole("moderator");
      else setRole("user");
    } else {
      setRole("user");
    }
    setRoleReady(true);
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setAuthReady(true);

        if (session?.user) {
          setRoleReady(false);
          setTimeout(() => fetchRole(session.user.id), 0);
        } else {
          setRole("user");
          setRoleReady(true);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setAuthReady(true);

      if (session?.user) {
        fetchRole(session.user.id);
      } else {
        setRoleReady(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error: error as Error | null };
  };

  const signUp = async (email: string, password: string, metadata: SignUpMetadata) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: metadata.full_name,
          license_number: metadata.license_number,
          brokerage_name: metadata.brokerage_name,
          brokerage_address: metadata.brokerage_address || null,
        },
      },
    });

    if (error) {
      return { error: error as Error };
    }

    // After successful signup, update profile with phone if provided
    if (data.user && metadata.phone) {
      await (supabase as any)
        .from("profiles")
        .update({ phone: metadata.phone })
        .eq("user_id", data.user.id);
    }

    return { error: null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, role, isAdmin, isAgent, isTeamMember, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
