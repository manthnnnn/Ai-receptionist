import crypto from 'crypto';
import { NextRequest } from 'next/server';

/**
 * Validates the cryptographic X-Twilio-Signature on incoming webhook requests.
 * Standard Twilio Security Algorithm:
 * 1. Takes the full request URL
 * 2. Sorts POST parameters alphabetically by key
 * 3. Appends each key and value to the URL string
 * 4. Signs with HMAC-SHA1 using TWILIO_AUTH_TOKEN
 * 5. Compares with X-Twilio-Signature using constant-time timingSafeEqual
 */
export function validateTwilioSignature(
  url: string,
  params: Record<string, string>,
  signature: string,
  authToken: string
): boolean {
  if (!authToken || !signature) {
    return false;
  }

  // 1. Sort parameters alphabetically by key
  const sortedKeys = Object.keys(params).sort();

  // 2. Concatenate key + value to the URL
  let data = url;
  for (const key of sortedKeys) {
    data += key + params[key];
  }

  // 3. Compute HMAC-SHA1 digest
  const hmac = crypto.createHmac('sha1', authToken);
  hmac.update(data, 'utf-8');
  const expectedSignature = hmac.digest('base64');

  // 4. Timing-safe comparison to prevent timing attacks
  const expectedBuffer = Buffer.from(expectedSignature);
  const actualBuffer = Buffer.from(signature);

  if (expectedBuffer.length !== actualBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(expectedBuffer, actualBuffer);
}

/**
 * Convenience helper to validate NextRequest from Twilio webhook
 */
export async function validateTwilioRequest(
  req: NextRequest,
  parsedBody?: Record<string, string>
): Promise<{ isValid: boolean; isBypassed: boolean; reason?: string }> {
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const signature = req.headers.get('x-twilio-signature');

  // If Twilio auth token is not configured or in test mode, allow development bypass
  const isDevOrUnconfigured =
    !authToken ||
    authToken.includes('your-') ||
    process.env.NODE_ENV === 'development' ||
    process.env.SKIP_TWILIO_VALIDATION === 'true';

  if (!signature) {
    if (isDevOrUnconfigured) {
      return { isValid: true, isBypassed: true, reason: 'Development/Simulator mode: No X-Twilio-Signature header present' };
    }
    return { isValid: false, isBypassed: false, reason: 'Missing X-Twilio-Signature header' };
  }

  if (isDevOrUnconfigured) {
    return { isValid: true, isBypassed: true, reason: 'Development mode bypass' };
  }

  const url = req.url;
  let params: Record<string, string> = parsedBody || {};

  if (!parsedBody) {
    try {
      const clonedReq = req.clone();
      const formData = await clonedReq.formData();
      formData.forEach((value, key) => {
        params[key] = String(value);
      });
    } catch {
      // Body might be json or empty
    }
  }

  const isValid = validateTwilioSignature(url, params, signature, authToken);
  return {
    isValid,
    isBypassed: false,
    reason: isValid ? undefined : 'Cryptographic signature mismatch',
  };
}
