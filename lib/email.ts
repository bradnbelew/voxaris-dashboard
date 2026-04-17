const RESEND_API_URL = 'https://api.resend.com/emails'

function getFrom() {
  return process.env.EMAIL_FROM ?? 'Voxaris <noreply@voxaris.io>'
}

export async function sendNewApplicantEmail({
  to,
  candidateName,
  role,
  interviewUrl,
}: {
  to: string[]
  candidateName: string
  role: string
  interviewUrl: string
}) {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.warn('[email] RESEND_API_KEY not set, skipping sendNewApplicantEmail')
    return
  }

  await fetch(RESEND_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: getFrom(),
      to,
      subject: `New applicant interview completed — ${candidateName} for ${role}`,
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px 24px">
          <h2 style="color:#1e1b4b;font-size:22px;margin-bottom:8px">New Interview Completed</h2>
          <p style="color:#4b5563;font-size:15px;line-height:1.6">
            <strong>${candidateName}</strong> just completed their AI pre-screening interview for the
            <strong>${role}</strong> position.
          </p>
          <p style="color:#4b5563;font-size:15px;line-height:1.6">
            An AI summary has been generated and is ready for your review.
          </p>
          <a
            href="${interviewUrl}"
            style="display:inline-block;margin-top:16px;padding:10px 20px;background:#4f46e5;color:#fff;border-radius:6px;text-decoration:none;font-size:14px;font-weight:600"
          >
            Review Interview
          </a>
          <p style="color:#9ca3af;font-size:13px;margin-top:32px">Powered by Voxaris AI</p>
        </div>
      `,
    }),
  })
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

  await fetch(RESEND_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: getFrom(),
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

  await fetch(RESEND_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: getFrom(),
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
