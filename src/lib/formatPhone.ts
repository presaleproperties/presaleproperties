/**
 * Formats a phone number string into (XXX) XXX-XXXX as the user types.
 * Handles +1 / 1 country code prefix so 11-digit numbers are not cut off.
 */
export function formatPhoneNumber(value: string): string {
  let digits = value.replace(/\D/g, "");
  // Strip leading country code "1" if we have 11 digits starting with 1
  if (digits.length === 11 && digits.startsWith("1")) {
    digits = digits.slice(1);
  }
  // Cap at 10 digits
  digits = digits.slice(0, 10);
  if (digits.length === 0) return "";
  if (digits.length <= 3) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

/**
 * Strips formatting and returns raw 10-digit string for validation/storage.
 */
export function stripPhoneFormatting(value: string): string {
  let digits = value.replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("1")) digits = digits.slice(1);
  return digits;
}
