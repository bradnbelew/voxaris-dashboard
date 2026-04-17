import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

/**
 * POST /api/demo/automotive/setup
 * One-time setup: creates the Prestige Auto Group demo org, demo user, and seeds
 * all candidate/interview data. Protected by DEMO_SETUP_SECRET env var.
 *
 * Usage:
 *   curl -X POST https://your-domain.com/api/demo/automotive/setup \
 *     -H "x-setup-secret: YOUR_DEMO_SETUP_SECRET"
 */

const DEMO_ORG_ID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'

export async function POST(request: Request) {
  const secret = request.headers.get('x-setup-secret')
  if (!secret || secret !== process.env.DEMO_SETUP_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const email = process.env.DEMO_EMAIL
  const password = process.env.DEMO_PASSWORD

  if (!email || !password) {
    return NextResponse.json(
      { error: 'DEMO_EMAIL and DEMO_PASSWORD must be set in environment variables' },
      { status: 400 }
    )
  }

  const supabase = createAdminClient()

  try {
    // 1. Create or ensure the demo organization exists
    const { error: orgError } = await supabase.from('organizations').upsert(
      {
        id: DEMO_ORG_ID,
        name: 'Prestige Auto Group',
        slug: 'prestige-auto-demo',
        logo_url: null,
      },
      { onConflict: 'id' }
    )
    if (orgError) throw new Error(`Org upsert failed: ${orgError.message}`)

    // 2. Create demo auth user
    let demoUserId: string
    const { data: existingUsers } = await supabase.auth.admin.listUsers()
    const existing = existingUsers?.users?.find((u) => u.email === email)

    if (existing) {
      demoUserId = existing.id
    } else {
      const { data: newUser, error: userError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      })
      if (userError) throw new Error(`User creation failed: ${userError.message}`)
      demoUserId = newUser.user.id
    }

    // 3. Ensure profile exists for demo user
    await supabase.from('profiles').upsert(
      {
        id: demoUserId,
        organization_id: DEMO_ORG_ID,
        full_name: 'Demo Viewer',
        role: 'viewer',
      },
      { onConflict: 'id' }
    )

    // 4. Seed candidates
    const candidates = [
      { id: 'b1000000-0000-0000-0000-000000000001', full_name: 'Marcus Williams', email: 'marcus.williams.demo@example.com', phone: '(407) 555-0101', resume_text: MARCUS_RESUME },
      { id: 'b1000000-0000-0000-0000-000000000002', full_name: 'Brittany Chen', email: 'brittany.chen.demo@example.com', phone: '(407) 555-0102', resume_text: BRITTANY_RESUME },
      { id: 'b1000000-0000-0000-0000-000000000003', full_name: 'Jordan Martinez', email: 'jordan.martinez.demo@example.com', phone: '(407) 555-0103', resume_text: null },
      { id: 'b1000000-0000-0000-0000-000000000004', full_name: 'Rachel Thompson', email: 'rachel.thompson.demo@example.com', phone: '(813) 555-0104', resume_text: RACHEL_RESUME },
      { id: 'b1000000-0000-0000-0000-000000000005', full_name: 'Derek Okafor', email: 'derek.okafor.demo@example.com', phone: '(813) 555-0105', resume_text: null },
      { id: 'b1000000-0000-0000-0000-000000000006', full_name: 'Sandra Mills', email: 'sandra.mills.demo@example.com', phone: '(954) 555-0106', resume_text: SANDRA_RESUME },
      { id: 'b1000000-0000-0000-0000-000000000007', full_name: 'Tyler Johnson', email: 'tyler.johnson.demo@example.com', phone: '(407) 555-0107', resume_text: null },
      { id: 'b1000000-0000-0000-0000-000000000008', full_name: 'Ashley Rivera', email: 'ashley.rivera.demo@example.com', phone: '(305) 555-0108', resume_text: null },
      { id: 'b1000000-0000-0000-0000-000000000009', full_name: 'Kevin Park', email: 'kevin.park.demo@example.com', phone: '(407) 555-0109', resume_text: null },
      { id: 'b1000000-0000-0000-0000-000000000010', full_name: 'Brandon Lopez', email: 'brandon.lopez.demo@example.com', phone: '(786) 555-0110', resume_text: null },
    ]

    for (const c of candidates) {
      await supabase.from('candidates').upsert(
        { ...c, organization_id: DEMO_ORG_ID },
        { onConflict: 'id' }
      )
    }

    // 5. Seed interviews
    const now = new Date()
    const interviews = getDemoInterviews(now)
    for (const iv of interviews) {
      await supabase.from('interviews').upsert(iv, { onConflict: 'id' })
    }

    return NextResponse.json({
      ok: true,
      message: 'Demo setup complete',
      org_id: DEMO_ORG_ID,
      demo_email: email,
      interviews_seeded: interviews.length,
    })
  } catch (err) {
    console.error('[demo/setup] Error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

function daysAgo(d: Date, days: number, hours = 10): string {
  const dt = new Date(d)
  dt.setDate(dt.getDate() - days)
  dt.setHours(hours, 0, 0, 0)
  return dt.toISOString()
}

function getDemoInterviews(now: Date) {
  return [
    // ── Marcus Williams — Sales Consultant — Shortlisted ──
    {
      id: 'c1000000-0000-0000-0000-000000000001',
      organization_id: DEMO_ORG_ID,
      candidate_id: 'b1000000-0000-0000-0000-000000000001',
      conversation_id: 'demo-conv-0001',
      applied_role: 'Sales Consultant',
      source: 'video_interview',
      status: 'completed',
      pipeline_status: 'shortlisted',
      disqualified: false,
      disqualification_reason: null,
      work_authorized: true,
      years_experience: '5-10',
      most_recent_employer: 'Group 1 Honda',
      venue_type: 'dealership',
      has_certification: true,
      certifications: ['Honda Product Specialist', 'F&I Basics'],
      available_evenings: true,
      available_weekends: true,
      earliest_start_date: '2026-05-01',
      confirmed_physical: true,
      candidate_questions: ['What is the average monthly unit count on the floor?', 'Does Prestige offer a demo vehicle program?'],
      recruiter_call_scheduled: true,
      preferred_callback_time: 'Tuesday 10am–12pm',
      consent_given: true,
      consent_timestamp: daysAgo(now, 5, 14),
      objectives_completed: ['consent_given', 'candidate_intro', 'work_authorization', 'experience_validated', 'certifications', 'availability', 'closing_confirmed'],
      last_objective: 'closing_confirmed',
      engagement_score: 88,
      professional_score: 91,
      eye_contact_pct: 84,
      ai_fit_score: 87,
      ai_recommendation: 'strong_yes',
      ai_summary: 'Marcus Williams brings over eight years of automotive retail experience, having held floor sales roles at AutoNation Chevrolet and Group 1 Honda. He demonstrated strong product knowledge across domestic and import brands, articulating clear value propositions and the ability to walk customers through the full purchase journey. His communication style is polished and confident — he instinctively addressed objections before they were raised, which scored him highly on proactive engagement.\n\nDuring the interview, Marcus outlined a structured follow-up approach that has driven a consistent 23% close rate on floor ups, significantly above industry average. He emphasized relationship-based selling over high-pressure tactics, which aligns with Prestige\'s customer satisfaction culture. He is fully work-authorized, available for all shifts including weekends, and expressed genuine enthusiasm for the brand portfolio.\n\nOne minor consideration: Marcus mentioned a recent role transition attributed to "management restructuring." A brief follow-up during the recruiter call to confirm timeline and circumstances is recommended. Overall, he represents a high-value addition to the sales floor and is cleared to move to offer stage.',
      ai_strengths: ['8+ years of automotive retail experience at major dealer groups', 'Documented 23% close rate on floor traffic', 'Strong objection-handling and product knowledge across multiple brands', 'Relationship-focused selling approach aligned with Prestige values', 'Available all shifts including evenings and weekends'],
      ai_concerns: ['Voluntary departure from previous role warrants brief follow-up during recruiter call'],
      transcript_summary: 'Marcus discussed his 8-year automotive career, 23% close rate, and relationship-first sales philosophy; showed strong Honda product knowledge and enthusiasm for Prestige\'s inventory mix.',
      transcript: MARCUS_TRANSCRIPT,
      recording_url: null,
      guardrail_events: [],
      started_at: daysAgo(now, 5, 14),
      completed_at: daysAgo(now, 5, 14),
      ended_at: daysAgo(now, 5, 14),
      reviewed_at: daysAgo(now, 4, 9),
      perception_analysis: { professional_presentation: 91, eye_contact_percentage: 84, engagement_trajectory: 'increased', alone_during_interview: true },
      perception_signals: [{ type: 'candidate_strong_signal', standout_moment: '7:32', observation: 'Candidate provided unprompted closing ratio data with specifics — strong indicator of performance-oriented mindset.' }],
    },

    // ── Brittany Chen — Sales Consultant — Reviewed ──
    {
      id: 'c1000000-0000-0000-0000-000000000002',
      organization_id: DEMO_ORG_ID,
      candidate_id: 'b1000000-0000-0000-0000-000000000002',
      conversation_id: 'demo-conv-0002',
      applied_role: 'Sales Consultant',
      source: 'video_interview',
      status: 'completed',
      pipeline_status: 'reviewed',
      disqualified: false,
      disqualification_reason: null,
      work_authorized: true,
      years_experience: '1-3',
      most_recent_employer: 'Hendrick Honda',
      venue_type: 'dealership',
      has_certification: false,
      certifications: [],
      available_evenings: true,
      available_weekends: true,
      earliest_start_date: '2026-04-21',
      confirmed_physical: true,
      candidate_questions: ['Is there a structured training program for new hires?', 'What CRM does Prestige use?'],
      recruiter_call_scheduled: false,
      preferred_callback_time: null,
      consent_given: true,
      consent_timestamp: daysAgo(now, 7, 11),
      objectives_completed: ['consent_given', 'candidate_intro', 'work_authorization', 'experience_validated', 'availability', 'warm_close'],
      last_objective: 'warm_close',
      engagement_score: 74,
      professional_score: 79,
      eye_contact_pct: 72,
      ai_fit_score: 74,
      ai_recommendation: 'yes',
      ai_summary: 'Brittany Chen brings three years of Honda dealership experience, primarily at Hendrick Honda where she developed strong product knowledge for Japanese import brands. She presents with good energy and demonstrated genuine curiosity about Prestige\'s inventory, asking about training programs and CRM tools — a sign of a growth-oriented mindset.\n\nHer performance metrics are developing: she referenced a close rate around 14–16% on floor traffic, which is below senior performer benchmarks but appropriate for her experience level. She expressed strong interest in advancing toward a finance role within three to five years, suggesting she is thinking long-term about her career at the store level.\n\nOne area to probe: Brittany\'s tenure at her previous position was approximately 18 months. A brief conversation about her departure and career goals is advisable before moving to offer. She is authorized to work, available full-time including Saturdays, and presents professionally. A strong "Yes" candidate who would benefit from a structured onboarding track.',
      ai_strengths: ['3 years of automotive dealership sales experience', 'Strong Honda brand and import product knowledge', 'Coachable, growth-oriented attitude', 'Available full schedule including weekends'],
      ai_concerns: ['Close rate below senior performer benchmarks (14–16% vs. 20%+ target)', '18-month tenure at previous role — confirm departure reason'],
      transcript_summary: 'Brittany discussed her Honda experience, demonstrated product enthusiasm, and asked thoughtful questions about training and CRM; showed strong willingness to grow.',
      transcript: BRITTANY_TRANSCRIPT,
      recording_url: null,
      guardrail_events: [],
      started_at: daysAgo(now, 7, 11),
      completed_at: daysAgo(now, 7, 11),
      ended_at: daysAgo(now, 7, 11),
      reviewed_at: daysAgo(now, 6, 10),
      perception_analysis: { professional_presentation: 79, eye_contact_percentage: 72, engagement_trajectory: 'flat', alone_during_interview: true },
      perception_signals: [],
    },

    // ── Jordan Martinez — Sales Consultant — Pending Review ──
    {
      id: 'c1000000-0000-0000-0000-000000000003',
      organization_id: DEMO_ORG_ID,
      candidate_id: 'b1000000-0000-0000-0000-000000000003',
      conversation_id: 'demo-conv-0003',
      applied_role: 'Sales Consultant',
      source: 'video_interview',
      status: 'completed',
      pipeline_status: 'pending_review',
      disqualified: false,
      disqualification_reason: null,
      work_authorized: true,
      years_experience: '0-1',
      most_recent_employer: 'Best Buy',
      venue_type: 'retail',
      has_certification: false,
      certifications: [],
      available_evenings: false,
      available_weekends: true,
      earliest_start_date: '2026-05-15',
      confirmed_physical: true,
      candidate_questions: ['Is weekend availability mandatory every week?'],
      recruiter_call_scheduled: false,
      preferred_callback_time: null,
      consent_given: true,
      consent_timestamp: daysAgo(now, 1, 15),
      objectives_completed: ['consent_given', 'candidate_intro', 'work_authorization', 'experience_validated', 'availability', 'warm_close'],
      last_objective: 'warm_close',
      engagement_score: 61,
      professional_score: 67,
      eye_contact_pct: 59,
      ai_fit_score: 58,
      ai_recommendation: 'maybe',
      ai_summary: 'Jordan Martinez is an entry-level candidate with approximately eight months of consumer electronics retail experience at Best Buy, where he worked in the connected devices and mobile accessories section. He has no direct automotive sales experience but demonstrated some transferable skills in consultative selling and handling customer questions in a product-heavy environment.\n\nJordan was forthcoming about being new to automotive and expressed motivation driven largely by income potential rather than brand or product enthusiasm, which may be a concern for long-term retention. He noted unavailability on weekday evenings due to current coursework, which limits scheduling flexibility.\n\nHis demeanor was pleasant but energy levels were inconsistent through the interview. He is a "Maybe" — potentially suitable as an entry-level hire if the store has a structured green pea program and if the manager is prepared to invest in development. Would not recommend for an immediate high-volume floor position.',
      ai_strengths: ['Demonstrates coachable and honest self-awareness about experience gap', 'Prior consultative retail selling experience', 'Available weekends'],
      ai_concerns: ['No automotive experience — requires significant onboarding investment', 'Motivation appears income-driven rather than product/brand aligned', 'Limited weekday evening availability due to coursework'],
      transcript_summary: 'Jordan discussed his Best Buy background, expressed interest in automotive for income potential, and asked about weekend scheduling flexibility.',
      transcript: [],
      recording_url: null,
      guardrail_events: [],
      started_at: daysAgo(now, 1, 15),
      completed_at: daysAgo(now, 1, 15),
      ended_at: daysAgo(now, 1, 15),
      reviewed_at: null,
      perception_analysis: { professional_presentation: 67, eye_contact_percentage: 59, engagement_trajectory: 'flat', alone_during_interview: true },
      perception_signals: [],
    },

    // ── Rachel Thompson — Service Advisor — Shortlisted ──
    {
      id: 'c1000000-0000-0000-0000-000000000004',
      organization_id: DEMO_ORG_ID,
      candidate_id: 'b1000000-0000-0000-0000-000000000004',
      conversation_id: 'demo-conv-0004',
      applied_role: 'Service Advisor',
      source: 'video_interview',
      status: 'completed',
      pipeline_status: 'shortlisted',
      disqualified: false,
      disqualification_reason: null,
      work_authorized: true,
      years_experience: '5-10',
      most_recent_employer: 'Coggin Ford',
      venue_type: 'dealership',
      has_certification: true,
      certifications: ['ASE Service Advisor (C1)', 'Reynolds & Reynolds Certified', 'CDK Global Certified'],
      available_evenings: false,
      available_weekends: true,
      earliest_start_date: '2026-04-28',
      confirmed_physical: true,
      candidate_questions: ['What is the average RO count per advisor per day?', 'Does Prestige have a structured CSI incentive program?'],
      recruiter_call_scheduled: true,
      preferred_callback_time: 'Wednesday 9am–11am',
      consent_given: true,
      consent_timestamp: daysAgo(now, 3, 9),
      objectives_completed: ['consent_given', 'candidate_intro', 'work_authorization', 'experience_validated', 'certifications', 'availability', 'closing_confirmed'],
      last_objective: 'closing_confirmed',
      engagement_score: 92,
      professional_score: 94,
      eye_contact_pct: 89,
      ai_fit_score: 91,
      ai_recommendation: 'strong_yes',
      ai_summary: 'Rachel Thompson is one of the most compelling service advisor candidates we\'ve evaluated. With six years in the drive — including four at Coggin Ford, a high-volume OEM store — she has direct experience managing 18–22 repair orders per day, coordinating complex diagnostics with technicians, and systematically upselling maintenance packages. Her average RO value at Coggin was $445, which is well above the national average for franchise stores.\n\nHer customer communication approach stood out immediately: she frames every recommendation in terms of the customer\'s benefit rather than the store\'s margin, and described her practice of proactively calling customers before they call her. She is ASE C1 certified, current on both Reynolds & Reynolds and CDK, and noted she trains new advisors at her current store — suggesting she has leadership potential beyond the front-line role.\n\nRachel is available for opening shifts, fully flexible on Saturdays, and has no conflicts with the expected on-call rotation. She would require virtually no DMS ramp-up time and could be productive within the first few days. This is a hire — move to offer stage immediately.',
      ai_strengths: ['Six years of high-volume service advisor experience at OEM franchise store', 'ASE C1 certified, current on Reynolds & Reynolds and CDK DMS', 'Strong RO upsell performance ($445 avg vs. ~$350 industry benchmark)', 'Proactive customer communication style and peer training experience', 'Available opening shift and Saturdays'],
      ai_concerns: ['Salary expectations may trend toward the top of the posted range given experience level'],
      transcript_summary: 'Rachel discussed her Coggin Ford background, shared CSI and RO upsell metrics, and asked thoughtful questions about Prestige\'s advisor structure and CSI incentive programs.',
      transcript: RACHEL_TRANSCRIPT,
      recording_url: null,
      guardrail_events: [],
      started_at: daysAgo(now, 3, 9),
      completed_at: daysAgo(now, 3, 9),
      ended_at: daysAgo(now, 3, 9),
      reviewed_at: daysAgo(now, 2, 11),
      perception_analysis: { professional_presentation: 94, eye_contact_percentage: 89, engagement_trajectory: 'increased', alone_during_interview: true },
      perception_signals: [{ type: 'candidate_strong_signal', standout_moment: '5:14', observation: 'Candidate voluntarily cited specific RO value metrics — strong performance evidence without being prompted.' }],
    },

    // ── Derek Okafor — Service Advisor — Reviewed ──
    {
      id: 'c1000000-0000-0000-0000-000000000005',
      organization_id: DEMO_ORG_ID,
      candidate_id: 'b1000000-0000-0000-0000-000000000005',
      conversation_id: 'demo-conv-0005',
      applied_role: 'Service Advisor',
      source: 'video_interview',
      status: 'completed',
      pipeline_status: 'reviewed',
      disqualified: false,
      disqualification_reason: null,
      work_authorized: true,
      years_experience: '1-3',
      most_recent_employer: 'Firestone Complete Auto Care',
      venue_type: 'service_center',
      has_certification: false,
      certifications: [],
      available_evenings: true,
      available_weekends: true,
      earliest_start_date: '2026-04-21',
      confirmed_physical: true,
      candidate_questions: ['Do advisors here specialize by brand or handle all makes?'],
      recruiter_call_scheduled: false,
      preferred_callback_time: null,
      consent_given: true,
      consent_timestamp: daysAgo(now, 9, 13),
      objectives_completed: ['consent_given', 'candidate_intro', 'work_authorization', 'experience_validated', 'availability', 'warm_close'],
      last_objective: 'warm_close',
      engagement_score: 71,
      professional_score: 74,
      eye_contact_pct: 68,
      ai_fit_score: 71,
      ai_recommendation: 'yes',
      ai_summary: 'Derek Okafor has two years of service experience at Firestone Complete Auto Care, where he developed solid fundamentals in write-up, customer communication, and basic service upsell. He is comfortable with quick-lane volume and understands the basics of service flow, though his background is in the aftermarket rather than OEM franchise environment.\n\nDerek is personable and showed a clear desire to grow — he specifically said he wants to move into a dealership environment to build toward a career in parts or service management. He is not ASE certified but expressed interest in pursuing certification. His availability is strong: he is open to any shift and flexible on weekends.\n\nThe gap to watch is the franchise DMS learning curve — Derek has not used Reynolds or CDK and will need structured onboarding. If Prestige has a junior advisor track or is willing to invest two to three weeks of supervised onboarding, Derek is a solid hire for a secondary position.',
      ai_strengths: ['2 years of service write-up and customer communication experience', 'Strong availability — open to any shift including evenings', 'Career-motivated and expressed goal of advancing in service management', 'Personable demeanor with solid basic service knowledge'],
      ai_concerns: ['No OEM franchise experience — dealership DMS and process ramp-up needed', 'Not currently ASE certified'],
      transcript_summary: 'Derek discussed his Firestone background, expressed strong motivation to move into a dealership, and asked about brand specialization within the service drive.',
      transcript: [],
      recording_url: null,
      guardrail_events: [],
      started_at: daysAgo(now, 9, 13),
      completed_at: daysAgo(now, 9, 13),
      ended_at: daysAgo(now, 9, 13),
      reviewed_at: daysAgo(now, 8, 10),
      perception_analysis: { professional_presentation: 74, eye_contact_percentage: 68, engagement_trajectory: 'flat', alone_during_interview: true },
      perception_signals: [],
    },

    // ── Sandra Mills — F&I Manager — Hired ──
    {
      id: 'c1000000-0000-0000-0000-000000000006',
      organization_id: DEMO_ORG_ID,
      candidate_id: 'b1000000-0000-0000-0000-000000000006',
      conversation_id: 'demo-conv-0006',
      applied_role: 'Finance & Insurance Manager',
      source: 'video_interview',
      status: 'completed',
      pipeline_status: 'hired',
      disqualified: false,
      disqualification_reason: null,
      work_authorized: true,
      years_experience: '10+',
      most_recent_employer: 'AutoNation Toyota',
      venue_type: 'dealership',
      has_certification: true,
      certifications: ['JM&A F&I Certified', 'Zurich Insurance Certified', 'FL Dealer License (Active)', 'AFIP Certified'],
      available_evenings: false,
      available_weekends: true,
      earliest_start_date: '2026-04-15',
      confirmed_physical: true,
      candidate_questions: ['What is the current product penetration rate on VSCs?', 'Does Prestige use a digital menu system or paper?'],
      recruiter_call_scheduled: true,
      preferred_callback_time: 'Friday 2pm–4pm',
      consent_given: true,
      consent_timestamp: daysAgo(now, 12, 10),
      objectives_completed: ['consent_given', 'candidate_intro', 'work_authorization', 'experience_validated', 'certifications', 'availability', 'closing_confirmed'],
      last_objective: 'closing_confirmed',
      engagement_score: 95,
      professional_score: 97,
      eye_contact_pct: 93,
      ai_fit_score: 94,
      ai_recommendation: 'strong_yes',
      ai_summary: 'Sandra Mills is an exceptional Finance & Insurance manager with twelve years of experience desking deals and managing the finance office across three major dealer groups, including AutoNation and Hendrick Automotive. Her performance metrics are outstanding: she consistently achieves 135–150% of per-copy F&I objectives, with VSC penetration exceeding 70% and GAP penetration over 60% — both among the top performance benchmarks in the industry.\n\nSandra\'s compliance fluency was immediately evident throughout the interview. She correctly referenced CFPB guidelines on dealer markup, discussed OFAC check requirements unprompted, and articulated her menu selling discipline with precision. She described presenting every product to every customer on every deal as a non-negotiable personal standard — exactly the compliance culture Prestige works to maintain.\n\nShe is currently licensed in Florida, holds JM&A and Zurich certifications, and is AFIP certified. She has trained junior finance associates at her previous store and described implementing a product training curriculum for new sales staff. Sandra is available immediately. This candidate was made an offer and has accepted. Start date confirmed for April 15.',
      ai_strengths: ['12 years F&I experience at top national dealer groups (AutoNation, Hendrick)', 'Consistent 135–150% per-copy objective performance', 'Fully licensed (FL), JM&A and Zurich certified, AFIP certified', 'Deep CFPB compliance knowledge and strict menu-selling discipline', 'Track record of training and developing finance office staff'],
      ai_concerns: [],
      transcript_summary: 'Sandra walked through her F&I career history, cited specific VSC and GAP penetration rates, and demonstrated deep CFPB compliance and menu-selling knowledge; asked about current product penetration benchmarks at Prestige.',
      transcript: SANDRA_TRANSCRIPT,
      recording_url: null,
      guardrail_events: [],
      started_at: daysAgo(now, 12, 10),
      completed_at: daysAgo(now, 12, 10),
      ended_at: daysAgo(now, 12, 10),
      reviewed_at: daysAgo(now, 11, 9),
      perception_analysis: { professional_presentation: 97, eye_contact_percentage: 93, engagement_trajectory: 'increased', alone_during_interview: true },
      perception_signals: [{ type: 'candidate_strong_signal', standout_moment: '4:50', observation: 'Candidate cited CFPB compliance requirements unprompted — rare indicator of genuine compliance culture internalization.' }, { type: 'candidate_strong_signal', standout_moment: '8:22', observation: 'Detailed VSC penetration rate data provided without prompting; figures are consistent with top-quartile F&I performance.' }],
    },

    // ── Tyler Johnson — Parts Counter — Reviewed ──
    {
      id: 'c1000000-0000-0000-0000-000000000007',
      organization_id: DEMO_ORG_ID,
      candidate_id: 'b1000000-0000-0000-0000-000000000007',
      conversation_id: 'demo-conv-0007',
      applied_role: 'Parts Counter Specialist',
      source: 'video_interview',
      status: 'completed',
      pipeline_status: 'reviewed',
      disqualified: false,
      disqualification_reason: null,
      work_authorized: true,
      years_experience: '3-5',
      most_recent_employer: 'O\'Reilly Auto Parts',
      venue_type: 'parts_retail',
      has_certification: false,
      certifications: [],
      available_evenings: true,
      available_weekends: true,
      earliest_start_date: '2026-04-28',
      confirmed_physical: true,
      candidate_questions: ['Does Prestige use CDK or DealerSocket for parts inventory?'],
      recruiter_call_scheduled: false,
      preferred_callback_time: null,
      consent_given: true,
      consent_timestamp: daysAgo(now, 6, 14),
      objectives_completed: ['consent_given', 'candidate_intro', 'work_authorization', 'experience_validated', 'availability', 'warm_close'],
      last_objective: 'warm_close',
      engagement_score: 76,
      professional_score: 78,
      eye_contact_pct: 73,
      ai_fit_score: 76,
      ai_recommendation: 'yes',
      ai_summary: 'Tyler Johnson has four years of parts counter experience, with two years at O\'Reilly Auto Parts and two years at an independent garage. He is proficient in parts lookup, counter sales, and inventory management, and has a good working knowledge of OEM versus aftermarket part comparisons. He asked specifically about CDK vs. DealerSocket — indicating awareness of dealership DMS environments.\n\nTyler presents professionally, is reliable on availability, and has a solid foundational understanding of the parts operation. He would need to learn the OEM parts catalog for the specific brand(s) Prestige carries but this is standard onboarding for any counter hire transitioning from retail.\n\nOverall a solid hire for a parts counter role with expected four to six week onboarding to full productivity.',
      ai_strengths: ['4 years of parts counter and inventory management experience', 'Familiar with DMS lookup tools and OEM vs. aftermarket trade-offs', 'Full availability including evenings and weekends', 'Professional presentation and reliable demeanor'],
      ai_concerns: ['Background is retail/independent — OEM franchise parts catalog onboarding required'],
      transcript_summary: 'Tyler discussed his parts counter background, demonstrated knowledge of DMS systems, and asked about Prestige\'s specific inventory platform.',
      transcript: [],
      recording_url: null,
      guardrail_events: [],
      started_at: daysAgo(now, 6, 14),
      completed_at: daysAgo(now, 6, 14),
      ended_at: daysAgo(now, 6, 14),
      reviewed_at: daysAgo(now, 5, 11),
      perception_analysis: { professional_presentation: 78, eye_contact_percentage: 73, engagement_trajectory: 'flat', alone_during_interview: true },
      perception_signals: [],
    },

    // ── Ashley Rivera — BDC Representative — Pending Review ──
    {
      id: 'c1000000-0000-0000-0000-000000000008',
      organization_id: DEMO_ORG_ID,
      candidate_id: 'b1000000-0000-0000-0000-000000000008',
      conversation_id: 'demo-conv-0008',
      applied_role: 'BDC Representative',
      source: 'video_interview',
      status: 'completed',
      pipeline_status: 'pending_review',
      disqualified: false,
      disqualification_reason: null,
      work_authorized: true,
      years_experience: '1-3',
      most_recent_employer: 'NextGear Capital',
      venue_type: 'office',
      has_certification: false,
      certifications: [],
      available_evenings: true,
      available_weekends: false,
      earliest_start_date: '2026-04-21',
      confirmed_physical: false,
      candidate_questions: ['Is the BDC role inbound only or do you do outbound follow-up calls too?'],
      recruiter_call_scheduled: false,
      preferred_callback_time: null,
      consent_given: true,
      consent_timestamp: daysAgo(now, 2, 10),
      objectives_completed: ['consent_given', 'candidate_intro', 'work_authorization', 'experience_validated', 'availability', 'warm_close'],
      last_objective: 'warm_close',
      engagement_score: 65,
      professional_score: 71,
      eye_contact_pct: 62,
      ai_fit_score: 62,
      ai_recommendation: 'maybe',
      ai_summary: 'Ashley Rivera has approximately eighteen months of phone-based customer contact experience from her role at NextGear Capital, where she handled inbound financing inquiries from dealerships. The role gave her a good grounding in professional phone etiquette and financial services vocabulary, though it differs meaningfully from a dealership BDC context.\n\nAshley is personable and showed good listening skills during the interview. She asked a smart question about inbound vs. outbound call structure, which shows she has thought about the role. Her concern about weekend availability is a potential scheduling constraint in a BDC environment where Saturday coverage is typically required.\n\nShe is a "Maybe" — worth a recruiter conversation to discuss weekend scheduling flexibility and to assess her phone presentation more directly. If scheduling can be worked out, she has the raw communication skills to be developed into a strong BDC rep.',
      ai_strengths: ['18 months of professional inbound phone contact experience', 'Strong phone etiquette and professional vocabulary', 'Thoughtful questions about role structure', 'Available weekday evenings for late-shift coverage'],
      ai_concerns: ['Not available weekends — potential scheduling gap for BDC Saturday coverage', 'No direct dealership or BDC experience'],
      transcript_summary: 'Ashley discussed her NextGear Capital phone role, showed strong communication skills, and asked about inbound vs. outbound BDC structure.',
      transcript: [],
      recording_url: null,
      guardrail_events: [],
      started_at: daysAgo(now, 2, 10),
      completed_at: daysAgo(now, 2, 10),
      ended_at: daysAgo(now, 2, 10),
      reviewed_at: null,
      perception_analysis: { professional_presentation: 71, eye_contact_percentage: 62, engagement_trajectory: 'flat', alone_during_interview: true },
      perception_signals: [],
    },

    // ── Kevin Park — F&I Manager — Reviewed ──
    {
      id: 'c1000000-0000-0000-0000-000000000009',
      organization_id: DEMO_ORG_ID,
      candidate_id: 'b1000000-0000-0000-0000-000000000009',
      conversation_id: 'demo-conv-0009',
      applied_role: 'Finance & Insurance Manager',
      source: 'video_interview',
      status: 'completed',
      pipeline_status: 'reviewed',
      disqualified: false,
      disqualification_reason: null,
      work_authorized: true,
      years_experience: '5-10',
      most_recent_employer: 'Autonation Nissan',
      venue_type: 'dealership',
      has_certification: true,
      certifications: ['Zurich Insurance Certified', 'FL Dealer License (Active)'],
      available_evenings: false,
      available_weekends: true,
      earliest_start_date: '2026-05-05',
      confirmed_physical: true,
      candidate_questions: ['What lender mix does Prestige currently work with?'],
      recruiter_call_scheduled: false,
      preferred_callback_time: null,
      consent_given: true,
      consent_timestamp: daysAgo(now, 10, 11),
      objectives_completed: ['consent_given', 'candidate_intro', 'work_authorization', 'experience_validated', 'certifications', 'availability', 'warm_close'],
      last_objective: 'warm_close',
      engagement_score: 79,
      professional_score: 83,
      eye_contact_pct: 77,
      ai_fit_score: 79,
      ai_recommendation: 'yes',
      ai_summary: 'Kevin Park brings five years of F&I experience at Autonation Nissan, where he managed a mixed new and used finance office. His compliance knowledge is solid — he was aware of CFPB markup guidelines and described using a fixed markup policy — though his articulation was less fluent than top-tier F&I candidates. His Zurich certification is current and he holds an active Florida dealer license.\n\nKevin\'s product performance is good: he cited VSC penetration around 55–60% and GAP around 45%, which are respectable but below the benchmarks set by Sandra Mills. He is available for weekends and is not opposed to covering split days. He asked a smart question about lender mix, showing awareness of how a deal flow differences between high-volume and luxury brand franchises.\n\nA solid hire for a backup or junior F&I role. If the position is for a primary finance office lead, Sandra Mills is the stronger candidate. If capacity requires a second finance office or Kevin can be evaluated for a junior finance associate track, he is worth a recruiter call.',
      ai_strengths: ['5 years of F&I experience at a major dealer group franchise', 'Florida dealer license active', 'Zurich certified, solid compliance awareness', 'Good availability including weekends'],
      ai_concerns: ['VSC and GAP penetration below top-performer benchmarks', 'Compliance articulation less fluent than tier-one candidates — would benefit from ongoing training'],
      transcript_summary: 'Kevin discussed his Autonation F&I background, shared product penetration metrics, and asked about the lender mix at Prestige.',
      transcript: [],
      recording_url: null,
      guardrail_events: [],
      started_at: daysAgo(now, 10, 11),
      completed_at: daysAgo(now, 10, 11),
      ended_at: daysAgo(now, 10, 11),
      reviewed_at: daysAgo(now, 9, 10),
      perception_analysis: { professional_presentation: 83, eye_contact_percentage: 77, engagement_trajectory: 'flat', alone_during_interview: true },
      perception_signals: [],
    },

    // ── Brandon Lopez — Sales Consultant — Rejected (Not Work Authorized) ──
    {
      id: 'c1000000-0000-0000-0000-000000000010',
      organization_id: DEMO_ORG_ID,
      candidate_id: 'b1000000-0000-0000-0000-000000000010',
      conversation_id: 'demo-conv-0010',
      applied_role: 'Sales Consultant',
      source: 'video_interview',
      status: 'disqualified',
      pipeline_status: 'rejected',
      disqualified: true,
      disqualification_reason: 'Candidate is not currently authorized to work in the United States. Application automatically disqualified during work authorization screening.',
      work_authorized: false,
      years_experience: '1-3',
      most_recent_employer: null,
      venue_type: null,
      has_certification: false,
      certifications: [],
      available_evenings: null,
      available_weekends: null,
      earliest_start_date: null,
      confirmed_physical: false,
      candidate_questions: [],
      recruiter_call_scheduled: false,
      preferred_callback_time: null,
      consent_given: true,
      consent_timestamp: daysAgo(now, 4, 16),
      objectives_completed: ['consent_given', 'candidate_intro', 'work_authorization', 'end_screening_ineligible'],
      last_objective: 'end_screening_ineligible',
      engagement_score: null,
      professional_score: null,
      eye_contact_pct: null,
      ai_fit_score: null,
      ai_recommendation: 'no',
      ai_summary: 'Brandon Lopez was unable to clear the work authorization screening. He indicated that he does not currently hold work authorization in the United States and is in the process of exploring visa sponsorship options. As a result, this application was automatically disqualified during the screening interview and will not advance in the pipeline. No further recruiter action is required for this application.',
      ai_strengths: [],
      ai_concerns: ['Candidate does not have current U.S. work authorization — application automatically disqualified'],
      transcript_summary: 'Interview ended early after work authorization screening indicated candidate is not currently authorized to work in the U.S.',
      transcript: [],
      recording_url: null,
      guardrail_events: [],
      started_at: daysAgo(now, 4, 16),
      completed_at: daysAgo(now, 4, 16),
      ended_at: daysAgo(now, 4, 16),
      reviewed_at: daysAgo(now, 4, 16),
      perception_analysis: null,
      perception_signals: [],
    },
  ]
}

// ─── Sample transcripts for key candidates ────────────────────────────────────

const MARCUS_TRANSCRIPT = [
  { role: 'assistant', content: "Hi Marcus, I'm Jordan with Prestige Auto Group. Thanks for taking a few minutes today — I'm going to ask you some questions to learn more about your background and see if this role could be a great fit. Sound good?" },
  { role: 'user', content: "Absolutely, Jordan. Happy to be here." },
  { role: 'assistant', content: "Great. Can you walk me through your most recent position in automotive sales?" },
  { role: 'user', content: "Sure. I wrapped up three years at Group 1 Honda and before that I was at AutoNation Chevrolet for about five years. So eight years total in the dealership environment." },
  { role: 'assistant', content: "That's solid tenure. What's your average monthly unit count been?" },
  { role: 'user', content: "I typically run 18 to 22 units on a good month. My annual average last year was 19.4 units per month. I focus heavily on floor traffic and referrals from my existing book of business — about 30% of my deals come from repeat or referral customers." },
  { role: 'assistant', content: "That referral percentage is impressive. What does your follow-up process look like after a visit that doesn't turn into a sale?" },
  { role: 'user', content: "I run a three-touch follow-up within the first week. Day one I send a thank you text and confirm I've got their trade-in value locked in. Day three I'll reach out if there's any movement on the vehicle they were looking at — price or availability. Day seven I check in personally and ask if anything's changed on their end. After that I move them into my monthly nurture sequence." },
  { role: 'assistant', content: "Are you comfortable handling finance conversation with customers or do you leave that entirely to the F&I office?" },
  { role: 'user', content: "I set up the deal properly — I know what rates to expect for different credit profiles, and I won't promise anything the F&I office can't deliver. But I don't get in their lane. My job is to get the customer excited about the car and confident in the price, and then hand off cleanly so the F&I manager has a good customer to work with." },
]

const RACHEL_TRANSCRIPT = [
  { role: 'assistant', content: "Hi Rachel, I'm Jordan with Prestige Auto Group. Thanks for joining me today. I'm going to ask you about your service advisory background and get a sense of fit for the role. Ready to get started?" },
  { role: 'user', content: "Absolutely, let's do it." },
  { role: 'assistant', content: "Tell me about your current role and what a typical day looks like for you." },
  { role: 'user', content: "I'm a service advisor at Coggin Ford in Jacksonville. On a typical day I'm managing somewhere between 18 and 22 repair orders. I do all of my own write-ups, coordinate with the techs on diagnostic findings, and handle all the customer communication — I try to call every customer before their car is done rather than waiting for them to call me." },
  { role: 'assistant', content: "What's your average repair order value?" },
  { role: 'user', content: "It runs about $445 at Coggin. We have a pretty strong maintenance upsell program — I present the multi-point findings on every visit and I do a lot of deferred service follow-up. I keep a log of customers who passed on services last visit and reach out proactively when it's time." },
  { role: 'assistant', content: "What DMS platforms are you certified on?" },
  { role: 'user', content: "Reynolds and Reynolds and CDK Global. I'm certified on both. Coggin is on R&R but I trained on CDK at my previous store, so I'm comfortable either way." },
  { role: 'assistant', content: "Is there anything about service advisory work that you think you could do better, or an area you're actively working to improve?" },
  { role: 'user', content: "Honestly, I want to get better at the first visit — diagnosing the customer's communication preference within the first minute of their arrival, so I know immediately whether they want the full explanation or just the bottom line. I've gotten good at it but it's still something I think about." },
]

const SANDRA_TRANSCRIPT = [
  { role: 'assistant', content: "Hi Sandra, I'm Jordan with Prestige Auto Group. I'll be asking you about your Finance & Insurance background today. Thanks for your time." },
  { role: 'user', content: "Of course, happy to be here." },
  { role: 'assistant', content: "Can you describe your current finance office setup and what your per-copy performance looks like?" },
  { role: 'user', content: "I'm currently at AutoNation Toyota managing a finance office that runs about 80 to 90 units per month between new and certified. My per-copy is running around $1,640 right now, which is roughly 140% of objective. VSC penetration is at 72%, GAP is at 63%. We use a digital menu system which I actually helped implement — it was a manual menu before I got there." },
  { role: 'assistant', content: "How do you approach compliance, specifically around dealer markup?" },
  { role: 'user', content: "We operate on a fixed markup policy — I think it's the only defensible approach given CFPB scrutiny. Every customer gets the same rate markup regardless of who they are, and I document everything. I pull OFAC on every deal before we finalize. We also do 100% menu presentation — every product on every deal, no exceptions, documented with a signed menu on file. That's non-negotiable for me." },
  { role: 'assistant', content: "Have you trained or developed other finance staff?" },
  { role: 'user', content: "Yes — at my previous store at Hendrick I built a finance fundamentals curriculum for the sales team. A lot of the salespeople were setting up deals that were going to be a nightmare to desk, so I put together a two-hour training on deal structure, lender expectations, and what not to promise customers before they get to the F&I office. It made a real difference in the quality of the deals coming through the door." },
]

const BRITTANY_TRANSCRIPT = [
  { role: 'assistant', content: "Hi Brittany, I'm Jordan with Prestige Auto Group. Thanks for taking a few minutes with me today. I'll be asking about your sales background. Ready?" },
  { role: 'user', content: "Yes, definitely ready!" },
  { role: 'assistant', content: "Walk me through your sales experience so far." },
  { role: 'user', content: "I've been in automotive for about three years, all at Hendrick Honda. I sell across the whole Honda lineup — Civics, Accords, Pilots, we get a lot of Odyssey buyers too. Before that I had a summer in retail during college but automotive is where I really found my footing." },
  { role: 'assistant', content: "What's your close rate been recently?" },
  { role: 'user', content: "Honestly about 15% on floor traffic, which I know isn't top of the board. I'm still building my phone skills and my follow-up has gotten better since we switched to a new CRM, but I think there's room to grow. I tend to do better with customers who've already done their research — they just need someone to make them comfortable." },
  { role: 'assistant', content: "What would you want to be doing in three to five years?" },
  { role: 'user', content: "Longer term I'd love to learn the finance side. I'm always curious when I watch the F&I managers work — I want to understand the whole deal from start to finish. But right now I just want to get better on the floor and build a real book of business." },
]

// ─── Sample resumes ────────────────────────────────────────────────────────────

const MARCUS_RESUME = `MARCUS WILLIAMS
Orlando, FL 32801 | (407) 555-0101 | m.williams.auto@email.com

PROFESSIONAL SUMMARY
Results-driven automotive sales professional with 8+ years of franchise dealership experience. Consistent top-10 performer in multi-store dealer groups. Expertise in new and CPO vehicle sales, customer relationship management, and structured follow-up systems. Average 19.4 units/month with 30% referral and repeat business rate.

EXPERIENCE

Sales Consultant — Group 1 Honda, Orlando FL | 2023–2026
• Averaged 19–22 units/month; recognized as Top 5 Sales Consultant Q2 and Q3 2024
• Maintained 23% close rate on floor traffic through structured 3-touch follow-up system
• Built and managed portfolio of 340+ active referral customers
• Achieved 4.9/5.0 Google review average across all personal transactions

Sales Consultant — AutoNation Chevrolet, Orlando FL | 2018–2023
• Averaged 16–18 units/month; earned AutoNation Customer First Award 2021, 2022
• Specialized in truck and commercial vehicle sales; top truck sales performer in 2020
• Completed AutoNation Sales Excellence certification program

CERTIFICATIONS
• Honda Product Specialist (current)
• F&I Fundamentals — NADA Academy
• AutoNation Sales Excellence Certificate

EDUCATION
B.S. Business Administration — University of Central Florida, 2017`

const BRITTANY_RESUME = `BRITTANY CHEN
Tampa, FL 33602 | (407) 555-0102 | brittany.chen.work@email.com

EXPERIENCE

Sales Consultant — Hendrick Honda, Tampa FL | 2023–Present
• New and certified pre-owned Honda sales across full model lineup
• Average 12–15 units/month; CRM-based follow-up and pipeline management
• Participated in Honda University product training program

Retail Associate — Apple Store, Tampa FL | Summer 2022
• Product demonstrations, consultative selling, customer education

EDUCATION
B.A. Communications — University of South Florida, 2022`

const RACHEL_RESUME = `RACHEL THOMPSON
Jacksonville, FL 32202 | (813) 555-0104 | rthompson.serviceadvisor@email.com

PROFESSIONAL SUMMARY
ASE-certified service advisor with 6 years of high-volume OEM franchise experience. Expertise in repair order management, customer communication, maintenance upsell, and DMS operations (R&R, CDK). Consistent $440–$460 average RO value. Committed to proactive customer contact and first-call-resolution standards.

EXPERIENCE

Service Advisor — Coggin Ford, Jacksonville FL | 2022–Present
• Manage 18–22 ROs/day on a team of 6 advisors
• Average RO value: $445 (store average: $390)
• CSI score: 94.2% (top 3 in district)
• Certified on Reynolds & Reynolds DMS
• Trained 2 junior advisors in write-up and DMS procedures

Service Advisor — Jiffy Lube Service Centers, Tampa FL | 2020–2022
• Quick-lane write-up, fluid services upsell, customer communication
• Transitioned to dealership environment to develop diagnostic advisory skills

CERTIFICATIONS
• ASE Service Advisor Certification (C1) — Current
• Reynolds & Reynolds Certified User
• CDK Global Certified User

EDUCATION
A.S. Automotive Technology — Florida State College at Jacksonville, 2019`

const SANDRA_RESUME = `SANDRA MILLS, AFIP
Ft. Lauderdale, FL 33301 | (954) 555-0106 | sandra.mills.fi@email.com

PROFESSIONAL SUMMARY
12-year Finance & Insurance professional with consistent top-tier per-copy performance at high-volume franchise dealerships. AFIP certified. JM&A and Zurich certified. Florida Dealer License active. Expert in menu selling, lender relationship management, CFPB compliance, and F&I staff development.

EXPERIENCE

Finance Manager — AutoNation Toyota, Ft. Lauderdale FL | 2021–Present
• Finance office: 80–90 units/month (new + CPO)
• Per-copy performance: $1,580–$1,680 (135–148% of objective)
• VSC penetration: 70–74% | GAP penetration: 61–65%
• Implemented digital menu system; reduced compliance exceptions to zero
• OFAC and Red Flags compliance 100% documented

Finance Manager — Hendrick Automotive Group, Charlotte NC | 2017–2021
• Managed finance office at Hendrick Toyota South Charlotte (110+ units/month)
• Per-copy avg: $1,520 | VSC: 68% | GAP: 58%
• Developed and delivered F&I fundamentals training for sales staff
• Managed relationships with 14 active lending partners

Finance Associate — Southeast Toyota Distributors, Miami FL | 2014–2017
• Junior F&I support role; trained under senior finance manager
• Lender submission, deal structuring, compliance documentation

CERTIFICATIONS & LICENSES
• AFIP Certified (current)
• JM&A F&I Master Certified
• Zurich Insurance Products Certified
• Florida Motor Vehicle Dealer License — Active
• CFPB Compliance Training (annual, current)

EDUCATION
B.S. Finance — Florida International University, 2013`
