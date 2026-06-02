// Input sanitization helpers to prevent XSS and injection attacks.

/** Strip HTML tags and dangerous characters from user-supplied strings. */
export function sanitizeString(input: unknown): string {
  if (typeof input !== "string") return "";
  return input
    .replace(/<[^>]*>/g, "") // strip HTML tags
    .replace(/[<>"'`]/g, (c) => ({ "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;", "`": "&#96;" }[c] ?? c))
    .trim()
    .slice(0, 10_000); // hard cap length
}

/** Sanitize an object's string values recursively (max 3 levels deep). */
export function sanitizeObject<T extends Record<string, unknown>>(
  obj: T,
  depth = 0
): T {
  if (depth > 3) return obj;
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === "string") {
      result[key] = sanitizeString(value);
    } else if (value !== null && typeof value === "object" && !Array.isArray(value)) {
      result[key] = sanitizeObject(value as Record<string, unknown>, depth + 1);
    } else if (Array.isArray(value)) {
      result[key] = value.map((v) =>
        typeof v === "string" ? sanitizeString(v) : v
      );
    } else {
      result[key] = value;
    }
  }
  return result as T;
}

/** Validate that a string is a safe UUID (prevents injection via IDs). */
export function isValidUUID(id: unknown): id is string {
  if (typeof id !== "string") return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

/** Validate email format. */
export function isValidEmail(email: unknown): email is string {
  if (typeof email !== "string") return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 320;
}

/** Validate phone number — allows +, digits, spaces, dashes, parens. */
export function isValidPhone(phone: unknown): phone is string {
  if (typeof phone !== "string") return false;
  return /^\+?[\d\s\-().]{7,20}$/.test(phone);
}

/** Extract and validate IP address from request headers. */
export function getClientIP(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    const ip = forwarded.split(",")[0].trim();
    if (/^[\d.]+$/.test(ip) || /^[0-9a-f:]+$/i.test(ip)) return ip;
  }
  return headers.get("x-real-ip") ?? "unknown";
}
