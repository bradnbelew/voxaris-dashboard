import type { TranscriptMessage, PerceptionAnalysis, PerceptionSignal } from './types'

interface SummaryInput {
  applied_role: string
  transcript: TranscriptMessage[] | null
  perception_analysis: PerceptionAnalysis | null
  perception_signals: PerceptionSignal[]
  work_authorized: boolean | null
  years_experience: string | null
  certifications: string[] | null
  available_evenings: boolean | null
  available_weekends: boolean | null
  disqualified: boolean
  disqualification_reason: string | null
}

interface SummaryOutput {
  summary: string
  strengths: string[]
  concerns: string[]
  fit_score: number
  recommendation: 'strong_yes' | 'yes' | 'maybe' | 'no'
  transcript_summary: string
}

export async function generateInterviewSummary(
  input: SummaryInput
): Promise<SummaryOutput | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY || process.env.OPENAI_API_KEY
  if (!apiKey) {
    console.warn('No AI API key configured, skipping summary generation')
    return null
  }

  const transcriptText = input.transcript
    ?.filter((m) => m.role !== 'system')
    .map((m) => `[${m.role === 'assistant' ? 'Jordan' : 'Candidate'}]: ${m.content}`)
    .join('\n') || 'No transcript available'

  const prompt = `You are a senior recruiter reviewing an AI-conducted pre-screening interview.
Analyze the following interview data and provide a structured assessment.

ROLE APPLIED FOR: ${input.applied_role}
WORK AUTHORIZED: ${input.work_authorized ?? 'Unknown'}
EXPERIENCE: ${input.years_experience ?? 'Unknown'}
CERTIFICATIONS: ${input.certifications?.join(', ') || 'None'}
AVAILABILITY: Evenings: ${input.available_evenings ?? 'Unknown'}, Weekends: ${input.available_weekends ?? 'Unknown'}
DISQUALIFIED: ${input.disqualified}${input.disqualification_reason ? ` (${input.disqualification_reason})` : ''}

PERCEPTION DATA:
${JSON.stringify(input.perception_analysis, null, 2)}

PERCEPTION SIGNALS:
${JSON.stringify(input.perception_signals, null, 2)}

TRANSCRIPT:
${transcriptText}

Respond in this exact JSON format (no markdown, no backticks, pure JSON only):
{
  "summary": "2-3 paragraph recruiter brief about the candidate, their performance, and fit for the role",
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "concerns": ["concern 1"],
  "fit_score": 75,
  "recommendation": "yes",
  "transcript_summary": "1-2 sentence summary of the conversation for list views"
}`

  try {
    if (process.env.ANTHROPIC_API_KEY) {
      return await callAnthropic(prompt)
    } else {
      return await callOpenAI(prompt)
    }
  } catch (err) {
    console.error('AI summary generation failed:', err)
    return null
  }
}

async function callAnthropic(prompt: string): Promise<SummaryOutput> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY!,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  if (!res.ok) {
    throw new Error(`Anthropic API error: ${res.status}`)
  }

  const data = await res.json()
  const text = data.content?.[0]?.text
  return JSON.parse(text)
}

async function callOpenAI(prompt: string): Promise<SummaryOutput> {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
    }),
  })

  if (!res.ok) {
    throw new Error(`OpenAI API error: ${res.status}`)
  }

  const data = await res.json()
  const text = data.choices?.[0]?.message?.content
  return JSON.parse(text)
}
