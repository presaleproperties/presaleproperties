/**
 * Formats a phone number string into (XXX) XXX-XXXX as the user types.
 * Strips all non-digits, then applies North American formatting.
 */
export function formatPhoneNumber(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 10);
  if (digits.length === 0) return "";
  if (digits.length <= 3) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

/**
 * Strips formatting and returns raw 10-digit string for validation/storage.
 */
export function stripPhoneFormatting(value: string): string {
  return value.replace(/\D/g, "");
}
