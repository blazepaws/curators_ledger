export const LOCKOUT_OPTIONS = ["Daily", "Weekly", "No lockout", "Only once"] as const

export enum Lockout {
  Daily = "Daily",
  Weekly = "Weekly",
  NoLockout = "No lockout",
  OnlyOnce = "Only once",
}

export type LockoutMode = (typeof LOCKOUT_OPTIONS)[number]

type SupportedRegion = "EU" | "US"

function normalizeRegion(region?: string | null): SupportedRegion {
  return (region || "").toUpperCase() === "US" ? "US" : "EU"
}

function nextDailyUnlock(now: Date, hourUtc: number, minuteUtc = 0) {
  const unlock = new Date(now)
  unlock.setUTCHours(hourUtc, minuteUtc, 0, 0)
  if (unlock <= now) unlock.setUTCDate(unlock.getUTCDate() + 1)
  return unlock
}

function nextWeeklyUnlock(now: Date, dayOfWeekUtc: number, hourUtc: number, minuteUtc = 0) {
  const unlock = new Date(now)
  unlock.setUTCHours(hourUtc, minuteUtc, 0, 0)

  const currentDay = unlock.getUTCDay()
  let delta = dayOfWeekUtc - currentDay
  if (delta < 0) delta += 7
  unlock.setUTCDate(unlock.getUTCDate() + delta)
  if (unlock <= now) unlock.setUTCDate(unlock.getUTCDate() + 7)

  return unlock
}

export function calculateUnlocksAt(mode: LockoutMode, region?: string | null, now = new Date()) {
  const normalizedRegion = normalizeRegion(region)

  if (mode === "No lockout") return null
  if (mode === "Only once") return null

  if (mode === "Daily") {
    return normalizedRegion === "US"
      ? nextDailyUnlock(now, 15, 0)
      : nextDailyUnlock(now, 4, 0)
  }

  if (mode === "Weekly") {
    return normalizedRegion === "US"
      ? nextWeeklyUnlock(now, 2, 15, 0)
      : nextWeeklyUnlock(now, 3, 4, 0)
  }

  return null
}

export function shouldDeleteOnComplete(mode: LockoutMode) {
  return mode === "Only once"
}

export function isLockedForNow(unlocksAt?: string | Date | null, now = new Date()) {
  if (!unlocksAt) return false
  const parsed = unlocksAt instanceof Date ? unlocksAt : new Date(unlocksAt)
  if (Number.isNaN(parsed.getTime())) return false
  return parsed > now
}
