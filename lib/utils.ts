import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { formatDistanceToNow, format, isToday, isThisWeek, isThisMonth } from 'date-fns'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatRelativeDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return formatDistanceToNow(d, { addSuffix: true })
}

export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return format(d, 'MMM d, yyyy')
}

export function formatDateTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return format(d, 'MMM d, yyyy h:mm a')
}

export function getDateCounts(dates: string[]): { today: number; week: number; month: number } {
  let today = 0
  let week = 0
  let month = 0
  for (const d of dates) {
    const date = new Date(d)
    if (isToday(date)) today++
    if (isThisWeek(date)) week++
    if (isThisMonth(date)) month++
  }
  return { today, week, month }
}

export function getFitScoreColor(score: number | null): string {
  if (score === null) return 'text-muted'
  if (score >= 80) return 'text-success'
  if (score >= 60) return 'text-warning'
  return 'text-destructive'
}

export function getEngagementLabel(score: number | null): string {
  if (score === null) return 'N/A'
  if (score >= 75) return 'High'
  if (score >= 50) return 'Medium'
  return 'Low'
}

export function getRecommendationLabel(rec: string | null): string {
  switch (rec) {
    case 'strong_yes': return 'Strong Yes'
    case 'yes': return 'Yes'
    case 'maybe': return 'Maybe'
    case 'no': return 'No'
    default: return 'Pending'
  }
}

export function getRecommendationColor(rec: string | null): string {
  switch (rec) {
    case 'strong_yes': return 'bg-success/10 text-success'
    case 'yes': return 'bg-success/10 text-success'
    case 'maybe': return 'bg-warning/10 text-warning'
    case 'no': return 'bg-destructive/10 text-destructive'
    default: return 'bg-muted/10 text-muted'
  }
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'completed': return 'bg-success/10 text-success'
    case 'active': return 'bg-accent/10 text-accent'
    case 'disqualified': return 'bg-destructive/10 text-destructive'
    case 'ended': return 'bg-muted/10 text-muted'
    case 'error': return 'bg-destructive/10 text-destructive'
    default: return 'bg-muted/10 text-muted'
  }
}

export function getPipelineColor(status: string): string {
  switch (status) {
    case 'pending_review': return 'bg-warning/10 text-warning'
    case 'reviewed': return 'bg-accent/10 text-accent'
    case 'shortlisted': return 'bg-success/10 text-success'
    case 'rejected': return 'bg-destructive/10 text-destructive'
    case 'hired': return 'bg-success/10 text-success'
    default: return 'bg-muted/10 text-muted'
  }
}

export function getPipelineLabel(status: string): string {
  switch (status) {
    case 'pending_review': return 'Pending Review'
    case 'reviewed': return 'Reviewed'
    case 'shortlisted': return 'Shortlisted'
    case 'rejected': return 'Rejected'
    case 'hired': return 'Hired'
    default: return status
  }
}

export const OBJECTIVE_LABELS: Record<string, string> = {
  candidate_ready: 'Candidate Ready',
  get_candidate_info: 'Candidate Info',
  work_authorization: 'Work Authorization',
  get_experience: 'Experience',
  get_certifications: 'Certifications',
  get_availability: 'Availability',
  physical_requirements: 'Physical Requirements',
  candidate_questions: 'Candidate Questions',
  closing_confirmed: 'Closing',
}

export const OBJECTIVE_ORDER = [
  'candidate_ready',
  'get_candidate_info',
  'work_authorization',
  'get_experience',
  'get_certifications',
  'get_availability',
  'physical_requirements',
  'candidate_questions',
  'closing_confirmed',
]
