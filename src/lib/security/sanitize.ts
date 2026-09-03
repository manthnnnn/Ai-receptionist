/**
 * Security Hardening & Data Sanitization Module
 * Enforces E.164 phone normalization, PII redaction for logs, and SQL/XSS input sanitization.
 */

/**
 * Normalizes phone numbers to standard international E.164 format.
 * Defaults to Indian country code +91 if 10-digit mobile number is supplied.
 */
export function normalizePhoneNumber(raw: string): string {
  if (!raw) return '';
  // Remove all non-digits except leading '+'
  let cleaned = raw.trim().replace(/[^\d+]/g, '');

  // If starts with 0 (STD code), strip 0 and prepend +91
  if (cleaned.startsWith('0') && cleaned.length === 11) {
    cleaned = '+91' + cleaned.substring(1);
  } else if (!cleaned.startsWith('+')) {
    if (cleaned.length === 10) {
      cleaned = '+91' + cleaned;
    } else {
      cleaned = '+' + cleaned;
    }
  }

  return cleaned;
}

/**
 * Masks phone numbers to protect patient PII in telemetry, call logs, and public views.
 * Example: "+91 98765 43210" -> "+91 98*** **210"
 */
export function maskPhoneNumber(phone: string): string {
  if (!phone) return '';
  const normalized = phone.trim();
  if (normalized.length < 8) return '****';

  const prefix = normalized.substring(0, 5);
  const suffix = normalized.substring(normalized.length - 3);
  return `${prefix}*** **${suffix}`;
}

/**
 * Masks email addresses to protect user identity in logs.
 * Example: "ashish.verma@apollodental.com" -> "a***a@apollodental.com"
 */
export function maskEmail(email: string): string {
  if (!email || !email.includes('@')) return '';
  const [user, domain] = email.trim().split('@');
  if (user.length <= 2) {
    return `${user[0]}*@${domain}`;
  }
  return `${user[0]}***${user[user.length - 1]}@${domain}`;
}

/**
 * Redacts common PII (phone numbers, email addresses, credit cards) from text.
 */
export function redactPII(text: string): string {
  if (!text) return '';

  // Redact email addresses
  let sanitized = text.replace(
    /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
    (match) => maskEmail(match)
  );

  // Redact 10-12 digit phone numbers
  sanitized = sanitized.replace(
    /(?:\+?(\d{1,3}))?[-. ]?\(?(\d{3})\)?[-. ]?(\d{3})[-. ]?(\d{4})/g,
    (match) => maskPhoneNumber(match)
  );

  return sanitized;
}

/**
 * Sanitizes input strings against cross-site scripting (XSS) and script injection.
 */
export function sanitizeInput(input: string): string {
  if (!input) return '';
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]+>/g, '')
    .trim();
}

/**
 * Detects common malicious SQL injection payloads in user-supplied strings.
 */
export function hasSqlInjectionPayload(input: string): boolean {
  if (!input) return false;
  const sqlPatterns = [
    /(\b(UNION(\s+ALL)?|SELECT|INSERT|DELETE|UPDATE|DROP|ALTER|EXEC|EXECUTE)\b)/i,
    /(--|#|\/\*)/,
    /(\bOR\b\s+['"]?\d+['"]?\s*=\s*['"]?\d+)/i,
    /(\bAND\b\s+['"]?\d+['"]?\s*=\s*['"]?\d+)/i,
    /(';|\";)/,
  ];

  return sqlPatterns.some((pattern) => pattern.test(input));
}
