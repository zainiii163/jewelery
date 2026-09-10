export function normalizePhone(phone: string | null | undefined): string | null {
  if (!phone) return null;
  const digits = phone.replace(/[^\d]/g, "");
  if (!digits) return null;
  if (digits.startsWith("00")) return digits.slice(2);
  if (digits.startsWith("0")) return "92" + digits.slice(1);
  if (digits.startsWith("92")) return digits;
  return digits;
}

export function waUrl(phone: string | null | undefined, text: string): string {
  const num = normalizePhone(phone);
  if (!num) return "";
  return `https://wa.me/${num}?text=${encodeURIComponent(text)}`;
}