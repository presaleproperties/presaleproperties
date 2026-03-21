import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type VerificationState = "idle" | "sending" | "awaiting_code" | "verifying" | "verified" | "error";

interface UsePhoneVerificationReturn {
  state: VerificationState;
  error: string | null;
  verifiedPhone: string | null;
  sendCode: (phone: string) => Promise<void>;
  verifyCode: (code: string) => Promise<boolean>;
  reset: () => void;
  currentPhone: string;
  setCurrentPhone: (phone: string) => void;
}

export function usePhoneVerification(): UsePhoneVerificationReturn {
  const [state, setState] = useState<VerificationState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [verifiedPhone, setVerifiedPhone] = useState<string | null>(null);
  const [currentPhone, setCurrentPhone] = useState("");

  const sendCode = async (phone: string) => {
    setState("sending");
    setError(null);
    try {
      const { data, error: fnError } = await supabase.functions.invoke("send-sms-otp", {
        body: { phone },
      });
      if (fnError || data?.error) {
        throw new Error(data?.error || fnError?.message || "Failed to send code");
      }
      setState("awaiting_code");
    } catch (err: any) {
      setError(err.message || "Failed to send verification code");
      setState("error");
    }
  };

  const verifyCode = async (code: string): Promise<boolean> => {
    setState("verifying");
    setError(null);
    try {
      const { data, error: fnError } = await supabase.functions.invoke("verify-sms-otp", {
        body: { phone: currentPhone, code },
      });
      if (fnError || data?.error) {
        throw new Error(data?.error || fnError?.message || "Invalid code");
      }
      setVerifiedPhone(data.phone || currentPhone);
      setState("verified");
      return true;
    } catch (err: any) {
      setError(err.message || "Incorrect code. Please try again.");
      setState("awaiting_code");
      return false;
    }
  };

  const reset = () => {
    setState("idle");
    setError(null);
    setVerifiedPhone(null);
    setCurrentPhone("");
  };

  return { state, error, verifiedPhone, sendCode, verifyCode, reset, currentPhone, setCurrentPhone };
}
