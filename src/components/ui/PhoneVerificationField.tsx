import { useState, useEffect, useRef } from "react";
import { CheckCircle2, Loader2, Phone, ShieldCheck, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { cn } from "@/lib/utils";
import { usePhoneVerification } from "@/hooks/usePhoneVerification";

interface PhoneVerificationFieldProps {
  /** Called when phone is verified — receives the normalized phone string */
  onVerified: (phone: string) => void;
  /** Optional pre-filled phone value */
  defaultPhone?: string;
  /** Optional label override */
  label?: string;
  className?: string;
  /**
   * When true, the component skips the "Send Code" button entirely.
   * Instead, call `triggerSend()` externally (via ref) to kick off sending.
   * The phone input is hidden; only the OTP step and verified state are shown.
   * Use this for the "submit-then-verify" UX pattern.
   */
  autoTrigger?: boolean;
  /** Ref callback to expose the triggerSend function to the parent */
  onReady?: (helpers: { triggerSend: (phone: string) => Promise<void> }) => void;
}

export function PhoneVerificationField({
  onVerified,
  defaultPhone = "",
  label = "Phone Number",
  className,
  autoTrigger = false,
  onReady,
}: PhoneVerificationFieldProps) {
  const {
    state,
    error,
    sendCode,
    verifyCode,
    currentPhone,
    setCurrentPhone,
    reset,
  } = usePhoneVerification();

  const [otp, setOtp] = useState("");
  const [phoneError, setPhoneError] = useState<string | null>(null);

  // Seed default phone once
  useEffect(() => {
    if (defaultPhone && !currentPhone) setCurrentPhone(defaultPhone);
  }, [defaultPhone]);

  // Expose triggerSend to parent when in autoTrigger mode
  useEffect(() => {
    if (autoTrigger && onReady) {
      onReady({
        triggerSend: async (phone: string) => {
          setCurrentPhone(phone);
          setPhoneError(null);
          const digits = phone.replace(/\D/g, "");
          if (digits.length < 10) {
            setPhoneError("Please enter a valid 10-digit phone number");
            return;
          }
          await sendCode(phone);
        },
      });
    }
  }, [autoTrigger, onReady]);

  const handleSend = async () => {
    setPhoneError(null);
    const digits = currentPhone.replace(/\D/g, "");
    if (digits.length < 10) {
      setPhoneError("Please enter a valid 10-digit phone number");
      return;
    }
    await sendCode(currentPhone);
  };

  const handleVerify = async () => {
    if (otp.length !== 6) return;
    const ok = await verifyCode(otp);
    if (ok) {
      const digits = currentPhone.replace(/\D/g, "");
      const normalized = digits.length === 10 ? `+1${digits}` : `+${digits}`;
      onVerified(normalized);
    } else {
      setOtp("");
    }
  };

  const handleResend = async () => {
    setOtp("");
    await sendCode(currentPhone);
  };

  // ── VERIFIED ─────────────────────────────────────────────────────────────────
  if (state === "verified") {
    return (
      <div className={cn(
        "flex items-center gap-2 h-11 px-3 rounded-xl border border-green-600/40 bg-green-600/5",
        className
      )}>
        <ShieldCheck className="h-4 w-4 text-green-600 shrink-0" />
        <span className="text-sm text-green-700 dark:text-green-400 font-medium flex-1 truncate">
          {currentPhone} — verified ✓
        </span>
        {!autoTrigger && (
          <button
            type="button"
            onClick={reset}
            className="text-xs text-muted-foreground hover:text-foreground underline shrink-0"
          >
            Change
          </button>
        )}
      </div>
    );
  }

  const isOtpStep = state === "awaiting_code" || state === "verifying";
  const isSendingStep = state === "sending";

  // ── OTP ENTRY (auto-trigger: shown after parent calls triggerSend) ─────────────
  if (isOtpStep || isSendingStep) {
    return (
      <div className={cn("space-y-3", className)}>
        <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
            <p className="text-xs text-muted-foreground flex-1">
              {isSendingStep ? (
                <span className="flex items-center gap-1.5">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Sending code to <span className="font-medium text-foreground">{currentPhone}</span>…
                </span>
              ) : (
                <>Code sent to{" "}<span className="font-medium text-foreground">{currentPhone}</span></>
              )}
            </p>
            {!autoTrigger && (
              <button
                type="button"
                onClick={() => { reset(); setOtp(""); }}
                className="text-xs text-muted-foreground hover:text-foreground underline"
              >
                Change
              </button>
            )}
          </div>

          {isOtpStep && (
            <div className="flex flex-col items-center gap-3">
              <p className="text-xs font-medium text-foreground">Enter your 6-digit verification code</p>
              <InputOTP
                maxLength={6}
                value={otp}
                onChange={setOtp}
                onComplete={handleVerify}
                disabled={state === "verifying"}
                autoFocus
              >
                <InputOTPGroup>
                  {[0, 1, 2, 3, 4, 5].map((i) => (
                    <InputOTPSlot
                      key={i}
                      index={i}
                      className="h-11 w-10 text-base font-bold"
                    />
                  ))}
                </InputOTPGroup>
              </InputOTP>

              {error && (
                <p className="text-xs text-destructive text-center">{error}</p>
              )}

              <div className="flex items-center gap-3 w-full">
                <Button
                  type="button"
                  size="sm"
                  className="flex-1 h-9"
                  onClick={handleVerify}
                  disabled={otp.length !== 6 || state === "verifying"}
                >
                  {state === "verifying" ? (
                    <><Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> Verifying…</>
                  ) : (
                    <><CheckCircle2 className="h-3.5 w-3.5 mr-1.5" /> Confirm Code</>
                  )}
                </Button>
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={state === "verifying"}
                  className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 disabled:opacity-50"
                >
                  <RefreshCw className="h-3 w-3" /> Resend
                </button>
              </div>
            </div>
          )}
        </div>
        {phoneError && (
          <p className="text-xs text-destructive">{phoneError}</p>
        )}
      </div>
    );
  }

  // ── IDLE / ERROR — only shown in manual mode (autoTrigger=false) ──────────────
  if (autoTrigger) {
    // In autoTrigger mode, show error if SMS send failed; otherwise nothing (phone input lives in parent)
    if (state === "error" && error) {
      return (
        <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-3">
          <p className="text-sm text-destructive text-center">{error}</p>
          <p className="text-xs text-muted-foreground text-center mt-1">Please go back and try again.</p>
        </div>
      );
    }
    return null;
  }

  return (
    <div className={cn("space-y-1.5", className)}>
      {label && (
        <label className="text-xs sm:text-sm font-medium block">
          {label} <span className="text-destructive">*</span>
          {" "}<span className="text-muted-foreground font-normal text-[11px]">(verification required)</span>
        </label>
      )}
      <div className="flex gap-2">
        <Input
          type="tel"
          inputMode="tel"
          placeholder="604-555-0123"
          autoComplete="tel"
          value={currentPhone}
          onChange={(e) => { setCurrentPhone(e.target.value); setPhoneError(null); }}
          className="h-11 flex-1 text-[16px]"
        />
        <Button
          type="button"
          variant="outline"
          className="h-11 px-3 shrink-0 text-xs font-semibold border-primary text-primary hover:bg-primary hover:text-primary-foreground"
          onClick={handleSend}
        >
          Send Code
        </Button>
      </div>
      {(phoneError || error) && (
        <p className="text-xs text-destructive">{phoneError || error}</p>
      )}
    </div>
  );
}
