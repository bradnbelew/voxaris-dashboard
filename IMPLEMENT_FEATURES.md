# Voxaris Dashboard — Feature Implementation Prompt

> **How to use this file:** Hand the entire contents to Claude Code with no additional context. Everything needed to implement all three features is documented here. Work in the directory `voxaris-dashboard`.

---

## Project Overview

**Stack:** Next.js 14 (App Router), TypeScript, Tailwind CSS, Supabase (auth + DB + storage), Vercel deployment  
**Repo:** `voxaris-dashboard`  
**Purpose:** Recruiter dashboard for reviewing AI-screened job candidates. Candidates complete video interviews in a separate "video agent" app. Results flow into this dashboard via webhooks.

### Key files you will need to read before starting:
- `lib/ai-summary.ts` — AI summary generation (Claude / GPT-4o)
- `lib/email.ts` — Resend email helper (already exists, partially built)
- `app/api/webhooks/interview/route.ts` — Webhook handler (main integration point)
- `app/api/interviews/[id]/pipeline/route.ts` — Pipeline status PATCH route
- `app/dashboard/interviews/[id]/page.tsx` — Interview detail page
- `lib/types.ts` — All TypeScript interfaces
- `lib/supabase/server.ts` — Supabase server client helper

### Environment variables (all set in Vercel + `.env.local`):
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
SUPABASE_SERVICE_ROLE_KEY
VOXARIS_WEBHOOK_SECRET
ANTHROPIC_API_KEY          ← needed for AI summaries
RESEND_API_KEY             ← needed for email
EMAIL_FROM                 ← e.g. "Voxaris <noreply@voxaris.io>"
NEXT_PUBLIC_APP_URL        ← e.g. https://app.voxaris.io
AWS_ACCESS_KEY_ID          ← needed for S3 video URLs
AWS_SECRET_ACCESS_KEY
AWS_REGION
AWS_S3_RECORDING_BUCKET
```

### Database — `interviews` table key columns:
```
id, organization_id, candidate_id, conversation_id
applied_role, status, pipeline_status
ai_summary, ai_strengths, ai_concerns, ai_fit_score, ai_recommendation
transcript, transcript_summary, recording_url, recording_s3_key
perception_analysis, perception_signals, engagement_score, professional_score
started_at, completed_at, created_at, updated_at
```

`pipeline_status` enum: `pending_review | reviewed | shortlisted | rejected | hired`  
`ai_recommendation` enum: `strong_yes | yes | maybe | no`

---

## What Already Exists (Do NOT rebuild these)

Before implementing, read these files to understand what's already done:

1. **`lib/ai-summary.ts`** — `generateInterviewSummary()` function exists. Calls Claude (primary) or GPT-4o (fallback). Returns `{ summary, strengths, concerns, fit_score, recommendation, transcript_summary }`. Already wired into the webhook.

2. **`lib/email.ts`** — `sendNewApplicantEmail()` exists. Uses Resend REST API (no npm package). Sends HTML email to org members when a new interview completes. Already called from webhook after AI summary runs.

3. **`app/api/webhooks/interview/route.ts`** — Handles these events: `interview_started`, `objective_completed`, `conversation_ended`, `transcript_ready`, `recording_ready`, `perception_ready`, `guardrail_triggered`. The `conversation_ended` event triggers AI summary + email.

4. **`app/api/interviews/[id]/recording-url/route.ts`** — Route exists but returns 501 (not implemented). Needs S3 signed URL generation.

5. **`app/dashboard/interviews/[id]/page.tsx`** — Interview detail page exists with recording player UI. Player will show if `recording_url` is set.

---

## Feature 1: AI Summaries — Complete & Harden

### Current state
`generateInterviewSummary()` exists and is called from the webhook on `conversation_ended`. However:
- No manual re-run capability if the webhook call failed
- No visible error state if AI summary is missing
- The function model string may need updating to `claude-sonnet-4-6` (check `lib/ai-summary.ts`)

### Tasks

**1a. Update the model ID in `lib/ai-summary.ts`**  
Find the model string and ensure it reads `claude-sonnet-4-6` (not a deprecated version). Also ensure the Anthropic call uses the correct API format:
```typescript
model: 'claude-sonnet-4-6',
max_tokens: 1024,
```

**1b. Add a "Re-run AI Analysis" API route**  
Create `app/api/interviews/[id]/analyze/route.ts`:
- Method: `POST`
- Auth: must be authenticated (use `createClient()` from `lib/supabase/server.ts` and verify session)
- Org check: fetch the interview by ID, confirm `organization_id` matches the user's org
- Fetch the interview row (all fields needed by `generateInterviewSummary`)
- Call `generateInterviewSummary(interview)`
- PATCH the `interviews` row with the result:
  ```typescript
  await supabase.from('interviews').update({
    ai_summary: result.summary,
    ai_strengths: result.strengths,
    ai_concerns: result.concerns,
    ai_fit_score: result.fit_score,
    ai_recommendation: result.recommendation,
    transcript_summary: result.transcript_summary,
  }).eq('id', id)
  ```
- Return `{ success: true }`

**1c. Add "Re-run Analysis" button to interview detail page**  
In `app/dashboard/interviews/[id]/page.tsx`, if `ai_summary` is null or the page is a server component, add a client component button that:
- POSTs to `/api/interviews/${id}/analyze`
- Shows a loading spinner while pending
- Refreshes the page (`router.refresh()`) on success
- Shows an error toast/message on failure

Place the button near the AI summary section, only visible to admins/recruiters (not viewers).

---

## Feature 2: Video Recording — Fix S3 Signed URLs

### Current state
The video agent app sends a `recording_ready` webhook event with `recording_url` (direct URL) and `recording_s3_key` (S3 path). The DB columns exist. The detail page has a player. But `GET /api/interviews/[id]/recording-url` returns 501.

### Tasks

**2a. Install AWS SDK v3 (minimal)**  
Add to `package.json`:
```bash
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```

**2b. Implement `app/api/interviews/[id]/recording-url/route.ts`**  
Replace the 501 stub with:
```typescript
import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: interview } = await supabase
    .from('interviews')
    .select('recording_s3_key, organization_id')
    .eq('id', params.id)
    .single()

  if (!interview?.recording_s3_key) {
    return Response.json({ error: 'No recording' }, { status: 404 })
  }

  const s3 = new S3Client({
    region: process.env.AWS_REGION!,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
  })

  const url = await getSignedUrl(
    s3,
    new GetObjectCommand({
      Bucket: process.env.AWS_S3_RECORDING_BUCKET!,
      Key: interview.recording_s3_key,
    }),
    { expiresIn: 3600 } // 1 hour
  )

  return Response.json({ url })
}
```

**2c. Update the recording player in the interview detail page**  
In `app/dashboard/interviews/[id]/page.tsx`, find where `recording_url` is used. Replace any direct `<video src={recording_url}>` with a client component that:
- On mount, calls `GET /api/interviews/${id}/recording-url`
- Sets the signed URL as the video `src`
- Shows a loading state while fetching
- Shows "Recording unavailable" if fetch fails or no recording exists

This avoids embedding a direct S3 URL that expires or is publicly accessible.

**2d. Fallback: use `recording_url` directly if `recording_s3_key` is null**  
Some recordings may have been stored as a direct public URL (no S3 key). In the recording player component:
```typescript
// If no s3 key, use the direct URL as fallback
if (!recording_s3_key && recording_url) {
  return <video src={recording_url} controls />
}
```

---

## Feature 3: Email Automation — Expand Triggers

### Current state
`sendNewApplicantEmail()` in `lib/email.ts` already exists and sends to org members when an interview completes. It uses Resend REST API.

What's missing:
- Candidate notification when shortlisted
- Candidate notification when rejected
- Better internal email template

### Tasks

**3a. Add `sendCandidateShortlistedEmail()` to `lib/email.ts`**  

Add this function alongside the existing one:
```typescript
export async function sendCandidateShortlistedEmail({
  candidateEmail,
  candidateName,
  role,
  orgName,
}: {
  candidateEmail: string
  candidateName: string
  role: string
  orgName: string
}) {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) return

  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM ?? 'Voxaris <noreply@voxaris.io>',
      to: [candidateEmail],
      subject: `You've been shortlisted for ${role}`,
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px 24px">
          <h2 style="color:#1e1b4b;font-size:22px;margin-bottom:8px">Great news, ${candidateName}!</h2>
          <p style="color:#4b5563;font-size:15px;line-height:1.6">
            We've reviewed your interview for the <strong>${role}</strong> position at 
            <strong>${orgName}</strong> and you've been shortlisted.
          </p>
          <p style="color:#4b5563;font-size:15px;line-height:1.6">
            Our team will be in touch shortly with next steps.
          </p>
          <p style="color:#9ca3af;font-size:13px;margin-top:32px">Powered by Voxaris AI</p>
        </div>
      `,
    }),
  })
}
```

**3b. Add `sendCandidateRejectedEmail()` to `lib/email.ts`**  

```typescript
export async function sendCandidateRejectedEmail({
  candidateEmail,
  candidateName,
  role,
  orgName,
}: {
  candidateEmail: string
  candidateName: string
  role: string
  orgName: string
}) {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) return

  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM ?? 'Voxaris <noreply@voxaris.io>',
      to: [candidateEmail],
      subject: `Your application for ${role}`,
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px 24px">
          <h2 style="color:#1e1b4b;font-size:22px;margin-bottom:8px">Thank you, ${candidateName}</h2>
          <p style="color:#4b5563;font-size:15px;line-height:1.6">
            Thank you for taking the time to interview for the <strong>${role}</strong> position at 
            <strong>${orgName}</strong>.
          </p>
          <p style="color:#4b5563;font-size:15px;line-height:1.6">
            After careful review, we've decided to move forward with other candidates at this time. 
            We appreciate your interest and wish you the best in your search.
          </p>
          <p style="color:#9ca3af;font-size:13px;margin-top:32px">Powered by Voxaris AI</p>
        </div>
      `,
    }),
  })
}
```

**3c. Hook candidate emails into the pipeline PATCH route**  

In `app/api/interviews/[id]/pipeline/route.ts`, after a successful DB update:
1. If the new status is `shortlisted` — fetch candidate email, name, org name and call `sendCandidateShortlistedEmail()`
2. If the new status is `rejected` — call `sendCandidateRejectedEmail()`
3. Only send if the previous status was NOT already that value (avoid re-sending on duplicate PATCHes)

To get candidate info, join in the existing query:
```typescript
const { data: interview } = await supabase
  .from('interviews')
  .select(`
    id, pipeline_status, applied_role, organization_id, email,
    organizations!inner(name)
  `)
  .eq('id', params.id)
  .single()
```

Note: the `email` column may be on the `interviews` table directly or on a joined `candidates` table. Read the existing PATCH route first to see what it already fetches, then add the minimal join needed.

Fire the email send with `await` inside a try/catch so a Resend failure never blocks the pipeline update.

**3d. Verify the existing `sendNewApplicantEmail` is working**  
- Check `lib/email.ts` to confirm it references `RESEND_API_KEY`
- Confirm `RESEND_API_KEY` is set in Vercel environment variables
- Confirm `EMAIL_FROM` is set and uses a domain verified in Resend
- Confirm `NEXT_PUBLIC_APP_URL` is set (used for the CTA link in the email)

If RESEND_API_KEY is missing from Vercel, the `lib/email.ts` function has a silent fallback (just logs), so no errors will appear but emails won't send.

---

## Testing Checklist

After implementing all three features, verify:

### AI Summaries
- [ ] `lib/ai-summary.ts` uses `claude-sonnet-4-6`
- [ ] `ANTHROPIC_API_KEY` is set in Vercel environment variables
- [ ] `POST /api/interviews/[id]/analyze` returns 200 and updates DB
- [ ] "Re-run Analysis" button appears on interview detail for an interview missing `ai_summary`
- [ ] Button triggers re-analysis and page refreshes with updated content

### Video Recording
- [ ] `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `AWS_S3_RECORDING_BUCKET` are all set in Vercel
- [ ] `GET /api/interviews/[id]/recording-url` returns a signed URL (not 501)
- [ ] For an interview with `recording_s3_key`, the detail page video player loads and plays
- [ ] Signed URL expires after 1 hour (check the `expiresIn` value)

### Email Automation
- [ ] `RESEND_API_KEY` is set in Vercel environment variables
- [ ] `EMAIL_FROM` uses a Resend-verified domain
- [ ] Moving a candidate to "shortlisted" in the Review page sends candidate a shortlist email
- [ ] Moving a candidate to "rejected" sends candidate a rejection email
- [ ] When a new interview completes via webhook, org members receive a notification email
- [ ] Check Resend dashboard logs to confirm emails are delivered, not bouncing

---

## Implementation Order

1. **Feature 1 first** — AI summaries need `ANTHROPIC_API_KEY` set. Check env vars before writing code.
2. **Feature 3 second** — Email requires `RESEND_API_KEY` and a verified sending domain. If the domain isn't verified, emails will silently fail.
3. **Feature 2 last** — S3 signed URLs require AWS credentials. The feature degrades gracefully (falls back to direct URL) so it's safe to do last.

---

## Common Mistakes to Avoid

- Do NOT rebuild `lib/email.ts` or `lib/ai-summary.ts` from scratch — they exist, read them first
- Do NOT change the webhook handler's event processing logic — it already calls AI summary and email
- Do NOT use `@aws-sdk/client-s3` v2 syntax — use v3 (modular imports as shown above)
- Do NOT commit API keys — they must live in `.env.local` (local) and Vercel dashboard (production)
- The Supabase admin client (`lib/supabase/admin.ts`) uses the service role key — use it only in server-side routes, never in client components
- When fetching an interview from an API route, always verify `organization_id` matches the authenticated user's org to prevent cross-org data access
