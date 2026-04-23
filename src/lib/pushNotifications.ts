/**
 * Web Push helpers for the admin lead-approval flow.
 * Registers the SW at /sw-push.js and (un)subscribes via edge functions.
 */
import { supabase } from "@/integrations/supabase/client";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

export function pushSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

export async function getCurrentSubscription(): Promise<PushSubscription | null> {
  if (!pushSupported()) return null;
  const reg = await navigator.serviceWorker.getRegistration("/sw-push.js");
  if (!reg) return null;
  return await reg.pushManager.getSubscription();
}

export async function enablePushNotifications(): Promise<{
  ok: boolean;
  error?: string;
}> {
  if (!pushSupported()) {
    return { ok: false, error: "Push not supported in this browser." };
  }

  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    return { ok: false, error: "Notification permission denied." };
  }

  const reg = await navigator.serviceWorker.register("/sw-push.js", {
    scope: "/",
  });
  await navigator.serviceWorker.ready;

  // Get VAPID public key
  const { data: keyData, error: keyErr } = await supabase.functions.invoke(
    "push-vapid-key",
    { method: "GET" },
  );
  if (keyErr || !keyData?.publicKey) {
    return { ok: false, error: "VAPID key not configured on server." };
  }

  let sub = await reg.pushManager.getSubscription();
  if (!sub) {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(keyData.publicKey).buffer as ArrayBuffer,
    });
  }

  const { error } = await supabase.functions.invoke("push-subscribe", {
    method: "POST",
    body: { subscription: sub.toJSON(), userAgent: navigator.userAgent },
  });
  if (error) return { ok: false, error: error.message };

  return { ok: true };
}

export async function disablePushNotifications(): Promise<{ ok: boolean; error?: string }> {
  try {
    const sub = await getCurrentSubscription();
    if (sub) {
      await supabase.functions.invoke("push-subscribe", {
        method: "DELETE",
        body: { endpoint: sub.endpoint },
      });
      await sub.unsubscribe();
    }
    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err?.message ?? "error" };
  }
}
