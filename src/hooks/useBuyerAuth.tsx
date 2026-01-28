import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export interface BuyerProfile {
  id: string;
  user_id: string;
  email: string;
  phone: string | null;
  phone_verified: boolean;
  full_name: string | null;
  buyer_type: "first_time" | "investor" | "upgrader" | "downsizer" | null;
  budget_min: number | null;
  budget_max: number | null;
  preferred_cities: string[];
  preferred_bedrooms: number[] | null;
  timeline: "0-3" | "3-6" | "6-12" | "12+" | null;
  is_vip: boolean;
  vip_joined_at: string | null;
  alerts_enabled: boolean;
  alert_frequency: "instant" | "daily" | "weekly";
  created_at: string;
}

interface BuyerAuthContextType {
  user: User | null;
  session: Session | null;
  buyerProfile: BuyerProfile | null;
  loading: boolean;
  isVIP: boolean;
  signUpWithPhone: (phone: string, email: string, fullName: string, buyerType: string) => Promise<{ error: Error | null }>;
  verifyOTP: (phone: string, token: string) => Promise<{ error: Error | null }>;
  signInWithPhone: (phone: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<BuyerProfile>) => Promise<{ error: Error | null }>;
  refetchProfile: () => Promise<void>;
}

const BuyerAuthContext = createContext<BuyerAuthContextType | undefined>(undefined);

export function BuyerAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [buyerProfile, setBuyerProfile] = useState<BuyerProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchBuyerProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from("buyer_profiles")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();
    
    if (!error && data) {
      setBuyerProfile(data as BuyerProfile);
    }
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        
        // Fetch buyer profile with setTimeout to avoid deadlock
        if (session?.user) {
          setTimeout(() => fetchBuyerProfile(session.user.id), 0);
        } else {
          setBuyerProfile(null);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      
      if (session?.user) {
        fetchBuyerProfile(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUpWithPhone = async (phone: string, email: string, fullName: string, buyerType: string) => {
    try {
      // First, sign up with phone OTP
      const { error } = await supabase.auth.signInWithOtp({
        phone,
        options: {
          data: {
            full_name: fullName,
            email,
            buyer_type: buyerType,
          },
        },
      });

      if (error) {
        return { error: error as Error };
      }

      // Store signup data in session storage for profile creation after OTP verification
      sessionStorage.setItem("pendingBuyerSignup", JSON.stringify({
        phone,
        email,
        fullName,
        buyerType,
      }));

      return { error: null };
    } catch (err) {
      return { error: err as Error };
    }
  };

  const verifyOTP = async (phone: string, token: string) => {
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        phone,
        token,
        type: "sms",
      });

      if (error) {
        return { error: error as Error };
      }

      // Create buyer profile after successful verification
      if (data.user) {
        const pendingSignup = sessionStorage.getItem("pendingBuyerSignup");
        
        if (pendingSignup) {
          const { email, fullName, buyerType } = JSON.parse(pendingSignup);
          
          // Create buyer profile
          const { error: profileError } = await supabase
            .from("buyer_profiles")
            .insert({
              user_id: data.user.id,
              email,
              phone,
              phone_verified: true,
              full_name: fullName,
              buyer_type: buyerType,
              is_vip: true,
              vip_joined_at: new Date().toISOString(),
            });

          if (profileError) {
            console.error("Error creating buyer profile:", profileError);
          }

          // Add user role
          await supabase.from("user_roles").insert({
            user_id: data.user.id,
            role: "user",
          });

          // Trigger welcome email
          await supabase.functions.invoke("send-buyer-welcome", {
            body: {
              userId: data.user.id,
              email,
              fullName,
              buyerType,
            },
          });

          sessionStorage.removeItem("pendingBuyerSignup");
          
          // Fetch the newly created profile
          await fetchBuyerProfile(data.user.id);
        }
      }

      return { error: null };
    } catch (err) {
      return { error: err as Error };
    }
  };

  const signInWithPhone = async (phone: string) => {
    try {
      const { error } = await supabase.auth.signInWithOtp({ phone });
      return { error: error as Error | null };
    } catch (err) {
      return { error: err as Error };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setBuyerProfile(null);
  };

  const updateProfile = async (updates: Partial<BuyerProfile>) => {
    if (!buyerProfile) {
      return { error: new Error("No buyer profile found") };
    }

    const { error } = await supabase
      .from("buyer_profiles")
      .update(updates)
      .eq("id", buyerProfile.id);

    if (!error) {
      setBuyerProfile({ ...buyerProfile, ...updates } as BuyerProfile);
    }

    return { error: error as Error | null };
  };

  const refetchProfile = async () => {
    if (user) {
      await fetchBuyerProfile(user.id);
    }
  };

  return (
    <BuyerAuthContext.Provider
      value={{
        user,
        session,
        buyerProfile,
        loading,
        isVIP: buyerProfile?.is_vip ?? false,
        signUpWithPhone,
        verifyOTP,
        signInWithPhone,
        signOut,
        updateProfile,
        refetchProfile,
      }}
    >
      {children}
    </BuyerAuthContext.Provider>
  );
}

export function useBuyerAuth() {
  const context = useContext(BuyerAuthContext);
  if (context === undefined) {
    throw new Error("useBuyerAuth must be used within a BuyerAuthProvider");
  }
  return context;
}
