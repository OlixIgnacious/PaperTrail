// PaperTrail Edge Function: Input Safety (FR-3 PII Redaction & FR-4 Prompt Injection Defanging)

export interface SafetyResult {
  cleanedText: string;
  piiRedacted: boolean;
  injectionDetected: boolean;
  redactedCount: {
    aadhaar: number;
    pan: number;
    phone: number;
    bankAccount: number;
  };
}

// Regex patterns for Indian PII
const AADHAAR_REGEX = /\b[2-9]{1}[0-9]{3}\s?[0-9]{4}\s?[0-9]{4}\b/g;
const PAN_REGEX = /\b[A-Z]{5}[0-9]{4}[A-Z]{1}\b/g;
const PHONE_REGEX = /(?:\+?91[\-\s]?)?[6-9]\d{9}\b/g;
const BANK_ACCOUNT_REGEX = /\b\d{9,18}\b/g; // 9 to 18 digit bank account numbers

// Prompt injection patterns to detect and neutralize
const INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?(previous|prior|above)\s+instructions/i,
  /disregard\s+(all\s+)?(previous|prior|above)\s+instructions/i,
  /you\s+are\s+now\s+(unconstrained|dan|jailbroken|godmode)/i,
  /system\s*:\s*override/i,
  /system\s*prompt/i,
  /reveal\s+(the\s+)?(system|hidden|internal)\s+prompt/i,
  /bypass\s+(safety|legal|verification)\s+rules/i,
];

export function redactPII(text: string): { sanitized: string; count: SafetyResult['redactedCount'] } {
  let sanitized = text;
  let aadhaarCount = 0;
  let panCount = 0;
  let phoneCount = 0;
  let bankCount = 0;

  sanitized = sanitized.replace(AADHAAR_REGEX, () => {
    aadhaarCount++;
    return '[REDACTED_AADHAAR]';
  });

  sanitized = sanitized.replace(PAN_REGEX, () => {
    panCount++;
    return '[REDACTED_PAN]';
  });

  sanitized = sanitized.replace(PHONE_REGEX, () => {
    phoneCount++;
    return '[REDACTED_PHONE]';
  });

  sanitized = sanitized.replace(BANK_ACCOUNT_REGEX, (match) => {
    // Avoid redacting 4-digit years or tiny numbers, only 9-18 digits
    if (match.length >= 9 && match.length <= 18) {
      bankCount++;
      return '[REDACTED_BANK_ACCOUNT]';
    }
    return match;
  });

  return {
    sanitized,
    count: {
      aadhaar: aadhaarCount,
      pan: panCount,
      phone: phoneCount,
      bankAccount: bankCount,
    },
  };
}

export function detectAndDefangPromptInjection(text: string): { neutralizedText: string; detected: boolean } {
  let detected = false;
  let neutralizedText = text;

  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(neutralizedText)) {
      detected = true;
      neutralizedText = neutralizedText.replace(pattern, '[DEFANGED_INJECTION_ATTEMPT]');
    }
  }

  // Remove delimiter manipulation attacks (like fake markdown or system role injections)
  neutralizedText = neutralizedText
    .replace(/```(system|admin|root)/gi, '```text')
    .replace(/<\|im_start\|>/gi, '')
    .replace(/<\|im_end\|>/gi, '');

  return { neutralizedText, detected };
}

export function processInputSafety(rawInput: string): SafetyResult {
  const { neutralizedText, detected: injectionDetected } = detectAndDefangPromptInjection(rawInput);
  const { sanitized, count: redactedCount } = redactPII(neutralizedText);

  const piiRedacted =
    redactedCount.aadhaar > 0 ||
    redactedCount.pan > 0 ||
    redactedCount.phone > 0 ||
    redactedCount.bankAccount > 0;

  return {
    cleanedText: sanitized,
    piiRedacted,
    injectionDetected,
    redactedCount,
  };
}
