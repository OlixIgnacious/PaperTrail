# PaperTrail — Hack2Skill PromptWars 2026
## 3-to-5 Minute Interactive Demo Video Recording Script

> **Judge & Evaluator Context:** This interactive prototype walkthrough demonstrates full compliance with RFS/TRD specifications, strict adherence to zero-persistence architecture (NFR-1), dual-track grounding, two-layer verification, and 15-language accessibility.

---

### ⏱️ Video Timeline Overview (Total: ~4 mins)

| Time | Scene / Feature | Key Message / Action |
|---|---|---|
| **0:00 - 0:30** | Introduction & Problem Framing | Legal contracts are unreadable for ordinary citizens. PaperTrail gives precise, cited answers with zero document persistence. |
| **0:30 - 1:15** | Hero Q&A & Jump-to-Source | Ask notice period question. Click citation pill. Show pixel-perfect yellow canvas highlight. |
| **1:15 - 1:45** | Ungrounded Question Fallback | Ask exotic pet question. Show exact required verbatim fallback string without hallucination. |
| **1:45 - 2:30** | Multilingual & Voice Accessibility | Switch to Hindi/Tamil. Speak via STT mic. Play audio read-aloud via TTS button. |
| **2:30 - 3:00** | Document Health & Risk Report | Show 0–100 risk score, statutory conflict audit against 25 curated Indian legal rules. |
| **3:00 - 3:30** | Legal Aid Navigator (DLSA) | Section 12 criteria assessment, NALSA 24x7 Helpline 15100, district DLSA search. |
| **3:30 - 4:00** | Notice Drafter & WhatsApp Sandbox | Template notice customized, RPAD postal guidance, WhatsApp Cloud API sandbox webhook. |

---

### 🎬 Scene-by-Scene Walkthrough Script

#### Scene 1: Introduction & Zero-Persistence Architecture (0:00 - 0:30)
* **Screen**: Main hero view (`http://localhost:5173/`).
* **Visual**: Show the split-screen layout: Targeted Q&A panel on the left, PDF Document Viewer on the right.
* **Voiceover**:
  > *"Welcome to PaperTrail, an AI-powered legal document assistant designed for Indian citizens facing everyday contracts in rental, employment, gig work, consumer purchases, and traffic challans. Unlike generic chatbots, PaperTrail never stores your documents. Under our Zero-Persistence guarantee, all uploaded contracts are processed strictly in-memory and are never written to any database."*

#### Scene 2: Targeted Q&A with Pixel-Perfect Jump-to-Source (0:30 - 1:15)
* **Screen**: Targeted Q&A tab.
* **Action**:
  1. Click quick suggestion: *"What is the notice period for terminating this contract?"*
  2. Click **Send** (or press Enter).
  3. Wait ~1s for verified answer to appear.
  4. Point to the **Verified (Mistral AI Cross-Checked)** badge.
  5. Click the citation pill: `Clause CL_2 (Page 1)`.
* **Visual**: The PDF viewer scrolls immediately and highlights Section 1 (*"1. TERM & NOTICE PERIOD"*) with a glowing yellow box fitted to the exact canvas dimensions.
* **Voiceover**:
  > *"Notice how the answer is directly grounded: 'Either party may terminate by providing a minimum of 30 days written notice.' When we click the citation pill, PaperTrail scrolls instantly to Page 1 and highlights the exact clause coordinates on the document canvas."*

#### Scene 3: Strict Ungrounded Fallback Demonstration (1:15 - 1:45)
* **Screen**: Search Input.
* **Action**:
  1. Type: *"Can I keep a tiger or an exotic crocodile inside this apartment?"*
  2. Click **Send**.
* **Visual**: Verified answer card displays with 100% confidence and zero citations:
  > *"This cannot be determined from the information you provided."*
* **Voiceover**:
  > *"One of the biggest hazards in legal AI is hallucination. When we ask a completely ungrounded question—such as keeping an exotic crocodile—PaperTrail refuses to guess and returns the exact required fallback string: 'This cannot be determined from the information you provided.'"*

#### Scene 4: Multilingual Translation & Voice Accessibility (1:45 - 2:30)
* **Screen**: Top navigation bar controls.
* **Action**:
  1. Open the Language selector and choose **Hindi (हिन्दी)** or **Tamil (தமிழ்)**.
  2. Click the **Microphone (STT)** icon beside the question box to demonstrate voice dictation.
  3. Click the **Listen (TTS)** button on the translated answer card to demonstrate speech synthesis.
* **Visual**: Answer displays in native script alongside the English answer, and browser audio speaks the legal rights aloud.
* **Voiceover**:
  > *"To ensure justice is accessible to all citizens, PaperTrail supports 15 scheduled Indian languages. Users can speak their questions using voice input, view answers translated into native regional scripts, and listen to the explanation read aloud using text-to-speech accessibility controls."*

#### Scene 5: Document Health Report & Compare Mode (2:30 - 3:00)
* **Screen**: Switch to **Health Report** tab, then **Compare** tab.
* **Action**:
  1. Click **Health Report** tab.
  2. Highlight the **Statutory Risk Score (0-100)** and identified legal issues (e.g. excessive security deposit demands violating the Model Tenancy Act).
  3. Switch to **Compare** tab to show multi-revision rights-shift indicators.
* **Voiceover**:
  > *"In the Health Report view, PaperTrail automatically audits extracted clauses against our 25 curated statutory rules, scoring legal risks from 0 to 100. In Compare mode, tenants and employees can compare new contract drafts against prior agreements to detect disadvantageous clause modifications."*

#### Scene 6: Legal Aid Navigator & Notice Drafter (3:00 - 3:30)
* **Screen**: Switch to **Legal Aid (DLSA)** tab, then **Notice Drafter** tab.
* **Action**:
  1. Click **Legal Aid (DLSA)** tab.
  2. Check the **Woman or child** or **Industrial workman** checkbox under Section 12. Show the *"Statutorily Eligible for Free Legal Aid"* banner.
  3. Type *"Bengaluru"* in the DLSA directory search to reveal the City Civil Court DLSA contact.
  4. Switch to **Notice Drafter** tab. Select *"Tenancy: Demand for Refund of Security Deposit"*. Customize sender name and show the live legal notice draft.
* **Voiceover**:
  > *"If a dispute arises, the Legal Aid Navigator helps eligible citizens access free court-appointed counsel under Section 12 of the Legal Services Authorities Act, backed by the 24x7 NALSA Helpline 15100. Users can also generate formal statutory legal demand notices, complete with registered post (RPAD) dispatch instructions."*

#### Scene 7: Conclusion & WhatsApp Webhook (3:30 - 4:00)
* **Visual**: Show the terminal with all 44 Python tests and 11 Playwright E2E tests passing, and the WhatsApp sandbox webhook payload handling.
* **Voiceover**:
  > *"PaperTrail also provides an automated WhatsApp Cloud API sandbox webhook for mobile delivery. With 44 Python backend tests and 11 Playwright end-to-end browser tests passing with 100% success, PaperTrail delivers grounded, verifiable, and responsible legal empowerment for India."*
