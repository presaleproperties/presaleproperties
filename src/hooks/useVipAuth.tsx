import { useState, useEffect, createContext, useContext, ReactNode, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

const VIP_PHONE_KEY = "off_market_vip_phone";
const VIP_VERIFIED_KEY = "off_market_vip_verified";

interface VipAuthContextType {
  vipPhone: string | null;
  isVipLoggedIn: boolean;
  isVipApproved: boolean;
  loading: boolean;
  loginVip: (phone: string) => void;
  logoutVip: () => void;
  checkVipAccessForListing: (listingId: string) => Promise<boolean>;
}

const VipAuthContext = createContext<VipAuthContextType | undefined>(undefined);

function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith("1") && digits.length === 11) return `+${digits}`;
  if (digits.length === 10) return `+1${digits}`;
  return `+${digits}`;
}

export function VipAuthProvider({ children }: { children: ReactNode }) {
  const [vipPhone, setVipPhone] = useState<string | null>(null);
  const [isVipApproved, setIsVipApproved] = useState(false);
  const [loading, setLoading] = useState(true);

  const checkGlobalApproval = useCallback(async (phone: string) => {
    const normalized = normalizePhone(phone);
    const digits = phone.replace(/\D/g, "");
    const d = digits.startsWith("1") && digits.length === 11 ? digits.slice(1) : digits;
    const formatted = d.length === 10 ? `(${d.slice(0,3)}) ${d.slice(3,6)}-${d.slice(6,10)}` : "";
    
    const formats = [normalized, digits, d];
    if (formatted) formats.push(formatted);

    const { data } = await supabase
      .from("off_market_access")
      .select("id")
      .in("phone", formats)
      .eq("status", "approved")
      .limit(1)
      .maybeSingle();
    return !!data;
  }, []);

  useEffect(() => {
    const storedPhone = localStorage.getItem(VIP_PHONE_KEY);
    const verified = localStorage.getItem(VIP_VERIFIED_KEY);
    if (storedPhone && verified === "true") {
      setVipPhone(storedPhone);
      checkGlobalApproval(storedPhone).then((approved) => {
        setIsVipApproved(approved);
        setLoading(false);
      });
    } else {
      // Migrate from old email-based keys
      const oldEmail = localStorage.getItem("off_market_vip_email");
      if (oldEmail) {
        localStorage.removeItem("off_market_vip_email");
        localStorage.removeItem("off_market_vip_verified");
        localStorage.removeItem("off_market_approved_emails");
      }
      setLoading(false);
    }
  }, [checkGlobalApproval]);

  const loginVip = useCallback((phone: string) => {
    const normalized = normalizePhone(phone);
    localStorage.setItem(VIP_PHONE_KEY, normalized);
    localStorage.setItem(VIP_VERIFIED_KEY, "true");
    setVipPhone(normalized);
    checkGlobalApproval(normalized).then(setIsVipApproved);
  }, [checkGlobalApproval]);

  const logoutVip = useCallback(() => {
    localStorage.removeItem(VIP_PHONE_KEY);
    localStorage.removeItem(VIP_VERIFIED_KEY);
    setVipPhone(null);
    setIsVipApproved(false);
  }, []);

  const checkVipAccessForListing = useCallback(async (listingId: string): Promise<boolean> => {
    if (!vipPhone) return false;
    if (isVipApproved) return true;
    return false;
  }, [vipPhone, isVipApproved]);

  return (
    <VipAuthContext.Provider value={{
      vipPhone,
      isVipLoggedIn: !!vipPhone,
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
