/**
 * Email notifications via Resend REST API (no npm package required).
 * Set RESEND_API_KEY and EMAIL_FROM in environment variables.
 * If RESEND_API_KEY is absent, notifications are logged but not sent.
 */

interface InterviewEmailData {
  candidateName: string
  appliedRole: string
  fitScore: number | null
  recommendation: string | null
  summaryExcerpt: string | null
  interviewId: string
  organizationName?: string
}

export async function sendNewApplicantEmail(
  toAddresses: string[],
  data: InterviewEmailData
): Promise<void> {
  if (!toAddresses.length) return

  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.EMAIL_FROM || 'Voxaris <notifications@voxaris.io>'
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://app.voxaris.com'

  const interviewUrl = `${appUrl}/dashboard/interviews/${data.interviewId}`
  const roleLabel = data.appliedRole
    ? data.appliedRole.charAt(0).toUpperCase() + data.appliedRole.slice(1).replace(/_/g, ' ')
    : 'General'

  const fitColor =
    data.fitScore === null ? '#6b7280'
    : data.fitScore >= 80 ? '#16a34a'
    : data.fitScore >= 60 ? '#d97706'
    : '#dc2626'

  const recLabel =
    data.recommendation === 'strong_yes' ? '⭐ Strong Yes'
    : data.recommendation === 'yes' ? '✅ Yes'
    : data.recommendation === 'maybe' ? '🤔 Maybe'
    : data.recommendation === 'no' ? '❌ No'
    : '—'

  const html = `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width,initial-scale=1" /></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;border:1px solid #e5e7eb;overflow:hidden;max-width:600px;">

        <!-- Header -->
        <tr>
          <td style="background:#0f172a;padding:24px 32px;">
            <p style="margin:0;font-size:13px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:#94a3b8;">Voxaris</p>
            <p style="margin:6px 0 0;font-size:20px;font-weight:700;color:#f8fafc;">New Interview Completed</p>
          </td>
        </tr>

        <!-- Candidate info -->
        <tr>
          <td style="padding:28px 32px 0;">
            <p style="margin:0;font-size:24px;font-weight:700;color:#0f172a;">${escapeHtml(data.candidateName)}</p>
            <p style="margin:4px 0 0;font-size:15px;color:#64748b;">Applied for: <strong style="color:#334155;">${escapeHtml(roleLabel)}</strong></p>
          </td>
        </tr>

        <!-- Score row -->
        <tr>
          <td style="padding:20px 32px;">
            <table cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding-right:24px;">
                  <p style="margin:0;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.07em;color:#94a3b8;">AI Fit Score</p>
                  <p style="margin:4px 0 0;font-size:28px;font-weight:800;color:${fitColor};">${data.fitScore !== null ? data.fitScore + '/100' : '—'}</p>
                </td>
                <td>
                  <p style="margin:0;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.07em;color:#94a3b8;">Recommendation</p>
                  <p style="margin:4px 0 0;font-size:16px;font-weight:700;color:#334155;">${recLabel}</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        ${data.summaryExcerpt ? `
        <!-- Summary excerpt -->
        <tr>
          <td style="padding:0 32px 24px;">
            <div style="background:#f8fafc;border-left:3px solid #6366f1;border-radius:0 8px 8px 0;padding:14px 16px;">
              <p style="margin:0;font-size:13px;line-height:1.6;color:#475569;">${escapeHtml(data.summaryExcerpt.slice(0, 280))}${data.summaryExcerpt.length > 280 ? '…' : ''}</p>
            </div>
          </td>
        </tr>` : ''}

        <!-- CTA -->
        <tr>
          <td style="padding:0 32px 32px;">
            <a href="${interviewUrl}" style="display:inline-block;background:#6366f1;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;padding:12px 24px;border-radius:8px;letter-spacing:0.02em;">
              View Full Interview →
            </a>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f8fafc;padding:16px 32px;border-top:1px solid #e5e7eb;">
            <p style="margin:0;font-size:12px;color:#94a3b8;">You're receiving this because you're a team member on this Voxaris account. <a href="${appUrl}/dashboard/settings" style="color:#6366f1;text-decoration:none;">Manage notifications</a></p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`

  const subject = `New applicant: ${data.candidateName} — ${roleLabel}${data.fitScore !== null ? ` (${data.fitScore}/100)` : ''}`

  if (!apiKey) {
    console.log(`[email] RESEND_API_KEY not set — would send "${subject}" to: ${toAddresses.join(', ')}`)
    return
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ from, to: toAddresses, subject, html }),
    })

    if (!res.ok) {
      const err = await res.text()
      console.error('[email] Resend error:', res.status, err)
    }
  } catch (err) {
    console.error('[email] Failed to send notification:', err)
  }
}

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
          <h2 style="color:#1e1b4b;font-size:22px;margin-bottom:8px">Great news, ${escapeHtml(candidateName)}!</h2>
          <p style="color:#4b5563;font-size:15px;line-height:1.6">
            We've reviewed your interview for the <strong>${escapeHtml(role)}</strong> position at
            <strong>${escapeHtml(orgName)}</strong> and you've been shortlisted.
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
          <h2 style="color:#1e1b4b;font-size:22px;margin-bottom:8px">Thank you, ${escapeHtml(candidateName)}</h2>
          <p style="color:#4b5563;font-size:15px;line-height:1.6">
            Thank you for taking the time to interview for the <strong>${escapeHtml(role)}</strong> position at
            <strong>${escapeHtml(orgName)}</strong>.
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

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
