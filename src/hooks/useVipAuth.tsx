import { useState, useEffect, createContext, useContext, ReactNode, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

const VIP_EMAIL_KEY = "off_market_vip_email";
const VIP_VERIFIED_KEY = "off_market_vip_verified";

interface VipAuthContextType {
  vipEmail: string | null;
  isVipLoggedIn: boolean;
  isVipApproved: boolean;
  loading: boolean;
  loginVip: (email: string) => void;
  logoutVip: () => void;
  checkVipAccessForListing: (listingId: string) => Promise<boolean>;
}

const VipAuthContext = createContext<VipAuthContextType | undefined>(undefined);

export function VipAuthProvider({ children }: { children: ReactNode }) {
  const [vipEmail, setVipEmail] = useState<string | null>(null);
  const [isVipApproved, setIsVipApproved] = useState(false);
  const [loading, setLoading] = useState(true);

  // Check if user has any approved access
  const checkGlobalApproval = useCallback(async (email: string) => {
    const { data } = await supabase
      .from("off_market_access")
      .select("id")
      .eq("email", email)
      .eq("status", "approved")
      .limit(1)
      .maybeSingle();
    return !!data;
  }, []);

  useEffect(() => {
    const storedEmail = localStorage.getItem(VIP_EMAIL_KEY);
    const verified = localStorage.getItem(VIP_VERIFIED_KEY);
    if (storedEmail && verified === "true") {
      setVipEmail(storedEmail);
      checkGlobalApproval(storedEmail).then((approved) => {
        setIsVipApproved(approved);
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, [checkGlobalApproval]);

  const loginVip = useCallback((email: string) => {
    localStorage.setItem(VIP_EMAIL_KEY, email);
    localStorage.setItem(VIP_VERIFIED_KEY, "true");
    // Also set the legacy key for backward compat
    localStorage.setItem("off_market_approved_emails", email);
    setVipEmail(email);
    checkGlobalApproval(email).then(setIsVipApproved);
  }, [checkGlobalApproval]);

  const logoutVip = useCallback(() => {
    localStorage.removeItem(VIP_EMAIL_KEY);
    localStorage.removeItem(VIP_VERIFIED_KEY);
    localStorage.removeItem("off_market_approved_emails");
    setVipEmail(null);
    setIsVipApproved(false);
  }, []);

  const checkVipAccessForListing = useCallback(async (listingId: string): Promise<boolean> => {
    if (!vipEmail) return false;
    // If globally approved, grant access to all listings
    if (isVipApproved) return true;
    // Otherwise check specific listing
    const { data } = await supabase
      .from("off_market_access")
      .select("id")
      .eq("email", vipEmail)
      .eq("listing_id", listingId)
      .eq("status", "approved")
      .maybeSingle();
    return !!data;
  }, [vipEmail, isVipApproved]);

  return (
    <VipAuthContext.Provider value={{
      vipEmail,
      isVipLoggedIn: !!vipEmail,
      isVipApproved,
      loading,
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
