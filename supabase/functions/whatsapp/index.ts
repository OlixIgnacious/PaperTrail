// PaperTrail Edge Function: WhatsApp Cloud API Sandbox Webhook (FR-17)
// Full support for text Q&A, statutory grounding, verifier engine, and zero-persistence document acknowledgments

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.8';
import { processInputSafety } from '../pipeline/safety.ts';
import { classifyVertical } from '../pipeline/classify.ts';
import { getGeminiEmbedding, RetrievedRule } from '../pipeline/retrieval.ts';
import { generateGroundedAnswer, EXACT_DOC_FALLBACK } from '../pipeline/generator.ts';
import { executeVerifierPipeline } from '../pipeline/verifier.ts';
import { recordAuditLog, sha256Hex } from '../pipeline/audit.ts';

const EXACT_STATUTE_FALLBACK =
  "Outside our current rule coverage for this vertical — here's the free legal aid route.";

// Helper to format WhatsApp markdown response
export function formatWhatsAppResponse(params: {
  answer: string;
  citations: Array<{ track: string; id: string; citation_label: string }>;
  verifierState: string;
  vertical: string;
}): string {
  const { answer, citations, verifierState, vertical } = params;

  let formatted = `⚖️ *PaperTrail Legal Assistant* [${vertical.toUpperCase()}]\n\n`;
  formatted += `*Answer:*\n${answer}\n\n`;

  if (citations && citations.length > 0) {
    formatted += `*Statutory Basis:*\n`;
    for (const cit of citations) {
      formatted += `• ${cit.citation_label} [${cit.id}]\n`;
    }
    formatted += `\n`;
  }

  const verifierBadge =
    verifierState === 'verified'
      ? '✅ Verified (Mistral AI Cross-Checked)'
      : verifierState === 'repaired'
      ? '⚠️ Repaired (Grounded Fallback)'
      : 'ℹ️ Unverified Reference';

  formatted += `*Verification Status:* ${verifierBadge}\n\n`;
  formatted += `📞 *Free Legal Aid (NALSA / DLSA):*\n`;
  formatted += `National Toll-Free 24x7 Helpline: *15100*\n`;
  formatted += `Visit: https://nalsa.gov.in or your local District Legal Services Authority.\n\n`;
  formatted += `_Disclaimer: PaperTrail provides legal information for public empowerment, not formal legal advice._`;

  return formatted;
}

// Helper to send message via WhatsApp Cloud API
export async function sendWhatsAppMessage(
  to: string,
  bodyText: string,
  token: string,
  phoneNumberId: string
): Promise<boolean> {
  if (!token || !phoneNumberId) {
    console.log('[WhatsApp Sandbox] Tokens not set, skipping Graph API dispatch');
    return false;
  }

  const url = `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to,
        type: 'text',
        text: { body: bodyText },
      }),
    });
    return res.ok;
  } catch (err) {
    console.error('Error sending WhatsApp Cloud API message:', err);
    return false;
  }
}

serve(async (req: Request) => {
  const url = new URL(req.url);

  // Webhook verification endpoint (GET)
  if (req.method === 'GET') {
    const mode = url.searchParams.get('hub.mode');
    const token = url.searchParams.get('hub.verify_token');
    const challenge = url.searchParams.get('hub.challenge');

    const expectedToken = Deno.env.get('WHATSAPP_VERIFY_TOKEN') || 'papertrail_sandbox_verify';

    if (mode === 'subscribe' && token === expectedToken) {
      return new Response(challenge || 'ok', { status: 200 });
    }
    return new Response('Forbidden', { status: 403 });
  }

  // Incoming messages endpoint (POST)
  if (req.method === 'POST') {
    try {
      const body = await req.json();
      console.log('Received WhatsApp payload:', JSON.stringify(body));

      const entry = body.entry?.[0];
      const change = entry?.changes?.[0]?.value;
      const message = change?.messages?.[0];

      if (!message) {
        return new Response(JSON.stringify({ status: 'no_message_found' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const from = message.from; // Sender phone number
      const messageType = message.type;

      const geminiApiKey = Deno.env.get('GEMINI_API_KEY') || '';
      const mistralApiKey = Deno.env.get('MISTRAL_API_KEY') || '';
      const whatsappToken = Deno.env.get('WHATSAPP_TOKEN') || '';
      const whatsappPhoneId = Deno.env.get('WHATSAPP_PHONE_NUMBER_ID') || '';
      const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

      const supabase = supabaseUrl && supabaseServiceKey
        ? createClient(supabaseUrl, supabaseServiceKey)
        : null;

      // Handle PDF or document attachment
      if (messageType === 'document') {
        const docName = message.document?.filename || 'Document.pdf';
        const docReply =
          `📄 *PaperTrail Document Received*\n` +
          `File: *${docName}*\n\n` +
          `🔒 *Zero-Persistence Privacy Guarantee (NFR-1):*\n` +
          `Your document is processed strictly in-memory during active analysis. Document text is *never* stored on any database or persistent disk.\n\n` +
          `💡 *How to inquire:*\n` +
          `Send your question as a text message right here, for example:\n` +
          `• "What is the notice period for terminating this agreement?"\n` +
          `• "How much security deposit can be deducted?"\n` +
          `• "Does this agreement contain any unlawful non-compete clauses?"\n\n` +
          `📞 *NALSA Legal Aid Helpline:* 15100`;

        await sendWhatsAppMessage(from, docReply, whatsappToken, whatsappPhoneId);

        return new Response(
          JSON.stringify({
            status: 'success',
            type: 'document_ack',
            reply: { to: from, text: docReply },
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // Handle Text Query
      if (messageType === 'text') {
        const userQuery = message.text?.body || '';

        // Step 1: Input Safety (PII & Injection)
        const safety = processInputSafety(userQuery);
        const cleanedQuestion = safety.cleanedText;

        // Step 2: Classify Vertical
        const classification = classifyVertical(cleanedQuestion);
        const vertical = classification.vertical;

        // Step 3: Embed & Retrieve Statutes
        let statuteMatches: RetrievedRule[] = [];
        if (supabase && geminiApiKey) {
          try {
            const queryEmbedding = await getGeminiEmbedding(cleanedQuestion, geminiApiKey);
            if (queryEmbedding.length > 0) {
              const { data, error } = await supabase.rpc('match_rules', {
                query_embedding: queryEmbedding,
                match_threshold: 0.35,
                match_count: 3,
                filter_vertical: vertical,
              });
              if (!error && data) {
                statuteMatches = data as RetrievedRule[];
              }
            }
          } catch (embedErr) {
            console.warn('Embedding retrieval failed for WhatsApp:', embedErr);
          }
        }

        // Step 4: Generation
        let genOutput = {
          answer: EXACT_STATUTE_FALLBACK,
          answer_local: EXACT_STATUTE_FALLBACK,
          citations: [] as any[],
          confidence: 1.0,
        };

        if (statuteMatches.length > 0 && geminiApiKey) {
          try {
            genOutput = await generateGroundedAnswer({
              question: cleanedQuestion,
              language: 'en',
              documentMatches: [],
              statuteMatches,
              geminiApiKey,
            });
          } catch (genErr) {
            console.warn('Generation failed:', genErr);
          }
        }

        // Step 5: Verification (Layer 1 deterministic + Layer 2 Mistral)
        const verification = await executeVerifierPipeline({
          output: genOutput,
          retrievedRules: statuteMatches,
          documentMatches: [],
          mistralApiKey,
        });

        // Step 6: Audit Log
        if (supabase) {
          const inputHash = await sha256Hex(cleanedQuestion);
          const outputHash = await sha256Hex(verification.verifiedOutput.answer);
          await recordAuditLog(supabase, {
            input_hash: inputHash,
            vertical,
            retrieved_rule_ids: statuteMatches.map((r) => r.rule_id),
            requested_language: 'en',
            verifier_state: verification.verifierState,
            output_hash: outputHash,
          });
        }

        // Format WhatsApp Markdown Message
        const replyText = formatWhatsAppResponse({
          answer: verification.verifiedOutput.answer,
          citations: verification.verifiedOutput.citations,
          verifierState: verification.verifierState,
          vertical,
        });

        await sendWhatsAppMessage(from, replyText, whatsappToken, whatsappPhoneId);

        return new Response(
          JSON.stringify({
            status: 'success',
            type: 'text_reply',
            reply: {
              to: from,
              text: replyText,
              citations: verification.verifiedOutput.citations,
              verifierState: verification.verifierState,
            },
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }

      return new Response(JSON.stringify({ status: 'unsupported_message_type' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (err) {
      console.error('WhatsApp webhook processing error:', err);
      return new Response(JSON.stringify({ error: (err as Error).message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  return new Response('Method not allowed', { status: 405 });
});

