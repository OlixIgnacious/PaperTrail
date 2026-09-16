// PaperTrail Edge Function: Audit Logger (FR-18)
// Computes SHA-256 hashes of input and output, logs to audit_log table

export async function sha256Hex(message: string): Promise<string> {
  const msgUint8 = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export interface AuditLogEntry {
  input_hash: string;
  vertical: string;
  retrieved_rule_ids: string[];
  requested_language: string;
  verifier_state: 'verified' | 'repaired' | 'unverified';
  output_hash: string;
}

export async function recordAuditLog(
  supabaseClient: any,
  entry: AuditLogEntry
): Promise<void> {
  if (!supabaseClient) return;

  try {
    const { error } = await supabaseClient.from('audit_log').insert([entry]);
    if (error) {
      console.error('Failed to write audit_log:', error);
    }
  } catch (err) {
    console.error('Exception writing audit log:', err);
  }
}
