import { useState, useEffect, createContext, useContext, ReactNode, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

interface VipSignupProfile {
  firstName: string;
  lastName: string;
  phone: string;
  hasAgent: boolean;
  budgetRange?: string | null;
  timeline?: string | null;
}

interface VipAuthContextType {
  vipUser: User | null;
  vipEmail: string | null;
  isVipLoggedIn: boolean;
  isVipApproved: boolean;
  loading: boolean;
  signUpVip: (email: string, password: string, profile?: VipSignupProfile) => Promise<{ error?: string }>;
  loginVip: (emailOrPhone: string, password: string) => Promise<{ error?: string }>;
  logoutVip: () => void;
  checkVipAccessForListing: (listingId: string) => Promise<boolean>;
}

const VipAuthContext = createContext<VipAuthContextType | undefined>(undefined);

async function lookupApprovedAccess(email?: string, phone?: string) {
  const { data, error } = await supabase.functions.invoke("check-vip-access", {
    body: { email, phone },
  });

  if (error) {
    throw new Error(error.message || "Unable to verify VIP access");
  }

  return {
    approved: !!data?.approved,
    email: data?.email as string | null,
  };
}

async function hasApprovedAccess(email?: string, phone?: string): Promise<boolean> {
  const result = await lookupApprovedAccess(email, phone);
  return result.approved;
}

/** Parse budget range string to a max number */
function parseBudgetMax(range: string): number | null {
  if (range.includes("1.5M+")) return 2000000;
  const match = range.match(/\$?([\d.]+)([KMk])?/g);
  if (!match) return null;
  const last = match[match.length - 1];
  const num = parseFloat(last.replace(/[$,]/g, ""));
  if (last.includes("M") || last.includes("m")) return num * 1000000;
  if (last.includes("K") || last.includes("k")) return num * 1000;
  return num;
}

export function VipAuthProvider({ children }: { children: ReactNode }) {
  const [vipUser, setVipUser] = useState<User | null>(null);
  const [isVipApproved, setIsVipApproved] = useState(false);
  const [loading, setLoading] = useState(true);

  const checkApprovalForUser = useCallback(async (user: User) => {
    const email = user.email;
    const phone = user.phone || user.user_metadata?.phone;
    return hasApprovedAccess(email, phone);
  }, []);

  useEffect(() => {
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        const user = session?.user ?? null;
        setVipUser(user);
        if (user) {
          const approved = await checkApprovalForUser(user);
          setIsVipApproved(approved);
        } else {
          setIsVipApproved(false);
        }
        setLoading(false);
      }
    );

    // Check initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      const user = session?.user ?? null;
      setVipUser(user);
      if (user) {
        const approved = await checkApprovalForUser(user);
        setIsVipApproved(approved);
      }
      setLoading(false);
    });

    // Clean up old localStorage keys
    localStorage.removeItem("off_market_vip_phone");
    localStorage.removeItem("off_market_vip_verified");

    return () => subscription.unsubscribe();
  }, [checkApprovalForUser]);

  const signUpVip = useCallback(async (email: string, password: string, profile?: VipSignupProfile): Promise<{ error?: string }> => {
    // First check if email matches an approved access record
    const approved = await hasApprovedAccess(email);
    if (!approved) {
      return { error: "No approved VIP access found for this email. Please request access first." };
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: profile ? {
          first_name: profile.firstName,
          last_name: profile.lastName,
          phone: profile.phone,
          has_agent: profile.hasAgent,
          budget_range: profile.budgetRange,
          timeline: profile.timeline,
        } : undefined,
      },
    });

    if (error) return { error: error.message };

    // Create buyer profile if we have profile data and a user
    if (profile && data.user) {
      await supabase.from("buyer_profiles").upsert({
        user_id: data.user.id,
        email,
        full_name: `${profile.firstName} ${profile.lastName}`,
        phone: profile.phone,
        buyer_type: profile.hasAgent ? "has_agent" : "no_agent",
        budget_max: profile.budgetRange ? parseBudgetMax(profile.budgetRange) : null,
        timeline: profile.timeline || null,
        is_vip: true,
        vip_joined_at: new Date().toISOString(),
      } as any, { onConflict: "user_id" });
    }

    return {};
  }, []);

  const loginVip = useCallback(async (emailOrPhone: string, password: string): Promise<{ error?: string }> => {
    // Determine if input is email or phone
    const isEmail = emailOrPhone.includes("@");

    if (isEmail) {
      const { error } = await supabase.auth.signInWithPassword({
        email: emailOrPhone,
        password,
      });
      if (error) return { error: error.message };
      return {};
    } else {
      // Phone login — look up user email from off_market_access by phone
      const formats = phoneFormats(emailOrPhone);
      const { data } = await supabase
        .from("off_market_access")
        .select("email")
        .eq("status", "approved")
        .in("phone", formats)
        .limit(1);

      if (!data?.length || !data[0].email) {
        return { error: "No approved VIP access found for this phone number." };
      }

      const { error } = await supabase.auth.signInWithPassword({
        email: data[0].email,
        password,
      });
      if (error) return { error: error.message };
      return {};
    }
  }, []);

  const logoutVip = useCallback(() => {
    supabase.auth.signOut();
  }, []);

  const checkVipAccessForListing = useCallback(async (listingId: string): Promise<boolean> => {
    if (!vipUser) return false;
    if (isVipApproved) return true;
    return false;
  }, [vipUser, isVipApproved]);

  const vipEmail = useMemo(() => vipUser?.email ?? null, [vipUser]);

  return (
    <VipAuthContext.Provider value={{
      vipUser,
      vipEmail,
      isVipLoggedIn: !!vipUser,
      isVipApproved,
      loading,
      signUpVip,
      loginVip,
      logoutVip,
      checkVipAccessForListing,
    }}>
      {children}
    </VipAuthContext.Provider>
  );
}

export function useVipAuth() {
  const context = useContext(VipAuthContext);
  if (!context) {
    throw new Error("useVipAuth must be used within VipAuthProvider");
  }
  return context;
}
