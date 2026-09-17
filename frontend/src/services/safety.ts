// PaperTrail Safety & Redaction Service (FR-3 PII Redaction & FR-4 Prompt Injection Neutralization)
// Scans and scrubs Indian PII (Aadhaar, PAN, Phone, Bank Account, Voter ID, Driving License)
// Neutralizes prompt injection attempts before queries reach external models

export interface SafetyCheckResult {
  cleanedText: string;
  piiRedacted: boolean;
  injectionDetected: boolean;
  counts: {
    aadhaar: number;
    pan: number;
    phone: number;
    bankAccount: number;
    voterId: number;
    drivingLicense: number;
  };
}

// Regex patterns for Indian identity documents & PII
const AADHAAR_REGEX = /\b[2-9]{1}[0-9]{3}\s?[0-9]{4}\s?[0-9]{4}\b/g;
const PAN_REGEX = /\b[A-Z]{5}[0-9]{4}[A-Z]{1}\b/g;
const PHONE_REGEX = /(?:\+?91[\-\s]?)?[6-9]\d{9}\b/g;
const BANK_ACCOUNT_REGEX = /\b\d{9,18}\b/g;
const VOTER_ID_REGEX = /\b[A-Z]{3}[0-9]{7}\b/g;
const DRIVING_LICENSE_REGEX = /\b[A-Z]{2}[0-9]{2}\s?[0-9]{11}\b/g;

// Prompt injection patterns to detect and neutralize
const INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?(previous|prior|above)\s+instructions/i,
  /disregard\s+(all\s+)?(previous|prior|above)\s+instructions/i,
  /you\s+are\s+now\s+(a|an|unconstrained|dan|jailbroken|godmode)/i,
  /system\s*:\s*override/i,
  /system\s*prompt/i,
  /reveal\s+(the\s+)?(system|secret|internal|hidden)\s+prompt/i,
  /bypass\s+(all\s+)?(safety|legal|verification|rules)/i,
  /jailbreak/i,
];

/**
 * Redacts Indian PII from input text before external transmission.
 */
export function redactPII(text: string) {
  let redacted = text;
  let aadhaarCount = 0;
  let panCount = 0;
  let phoneCount = 0;
  let bankCount = 0;
  let voterIdCount = 0;
  let dlCount = 0;

  // Aadhaar: 12 digits
  redacted = redacted.replace(AADHAAR_REGEX, () => {
    aadhaarCount++;
    return '[REDACTED_AADHAAR]';
  });

  // PAN: 5 letters, 4 digits, 1 letter
  redacted = redacted.replace(PAN_REGEX, () => {
    panCount++;
    return '[REDACTED_PAN]';
  });

  // Phone: Indian 10-digit mobile
  redacted = redacted.replace(PHONE_REGEX, () => {
    phoneCount++;
    return '[REDACTED_PHONE]';
  });

  // Bank Account: 9-18 digits (filter short numbers)
  redacted = redacted.replace(BANK_ACCOUNT_REGEX, (match) => {
    if (match.length >= 9 && match.length <= 18) {
      bankCount++;
      return '[REDACTED_BANK_ACCOUNT]';
    }
    return match;
  });

  // Voter ID (EPIC): 3 letters + 7 digits
  redacted = redacted.replace(VOTER_ID_REGEX, () => {
    voterIdCount++;
    return '[REDACTED_VOTER_ID]';
  });

  // Driving License: State code + RTO + serial
  redacted = redacted.replace(DRIVING_LICENSE_REGEX, () => {
    dlCount++;
    return '[REDACTED_DRIVING_LICENSE]';
  });

  const totalRedacted = aadhaarCount + panCount + phoneCount + bankCount + voterIdCount + dlCount;

  return {
    cleanedText: redacted,
    piiRedacted: totalRedacted > 0,
    counts: {
      aadhaar: aadhaarCount,
      pan: panCount,
      phone: phoneCount,
      bankAccount: bankCount,
      voterId: voterIdCount,
      drivingLicense: dlCount,
    },
  };
}

/**
 * Detects whether prompt contains malicious prompt injection patterns.
 */
export function detectInjection(text: string): boolean {
  return INJECTION_PATTERNS.some((p) => p.test(text));
}

/**
 * Performs full input sanitization: injection defanging followed by PII scrubbing.
 */
export function sanitizeInput(rawInput: string): SafetyCheckResult {
  const injectionDetected = detectInjection(rawInput);
  let defanged = rawInput;

  if (injectionDetected) {
    for (const pattern of INJECTION_PATTERNS) {
      defanged = defanged.replace(pattern, '[DEFANGED_INJECTION_ATTEMPT]');
    }
    defanged = defanged
      .replace(/```(system|admin|root)/gi, '```text')
      .replace(/<\|im_start\|>/gi, '')
      .replace(/<\|im_end\|>/gi, '');
  }

  const piiResult = redactPII(defanged);

  return {
    cleanedText: piiResult.cleanedText,
    piiRedacted: piiResult.piiRedacted,
    injectionDetected,
    counts: piiResult.counts,
  };
}
