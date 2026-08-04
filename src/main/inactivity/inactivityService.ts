import { Notification } from 'electron'
import { settingsRepo } from '../db/repositories/settings.repo'
import { timeEntriesRepo } from '../db/repositories/timeEntries.repo'

class InactivityService {
  private intervalId: ReturnType<typeof setInterval> | null = null
  private lastActiveAt: number = Date.now()
  private notificationSent: boolean = false

  start(): void {
    if (this.intervalId) return
    this.intervalId = setInterval(() => this.check(), 60_000)
  }

  /** Call whenever the user starts or stops a timer */
  recordActivity(): void {
    this.lastActiveAt = Date.now()
    this.notificationSent = false
  }

  private check(): void {
    const settings = settingsRepo.getAll()
    if (settings.inactivityReminderMinutes <= 0) return

    // Check day of week (0=Sun, 1=Mon … 6=Sat)
    const now = new Date()
    if (!settings.workdayDays.includes(now.getDay())) return

    // Check working hours
    const [startH, startM] = settings.workdayStart.split(':').map(Number)
    const [endH, endM] = settings.workdayEnd.split(':').map(Number)
    const currentMinutes = now.getHours() * 60 + now.getMinutes()
    if (currentMinutes < startH * 60 + startM || currentMinutes >= endH * 60 + endM) return

    // If timer is running → user is active, reset state
    const activeEntry = timeEntriesRepo.getActive()
    if (activeEntry) {
      this.lastActiveAt = Date.now()
      this.notificationSent = false
      return
    }

    // Already notified this inactivity period → wait for timer to start again
    if (this.notificationSent) return

    const thresholdMs = settings.inactivityReminderMinutes * 60_000
    if (Date.now() - this.lastActiveAt >= thresholdMs) {
      this.notify(settings.inactivityReminderMinutes, settings.language)
      this.notificationSent = true
    }
  }

  private notify(minutes: number, lang: string): void {
    const isCzech = lang === 'cs'
    new Notification({
      title: 'AmirTime',
      body: isCzech
        ? `Žádný časovač neběží již ${minutes} minut. Nezapomněl jsi spustit sledování?`
        : `No timer running for ${minutes} minutes. Did you forget to start tracking?`
    }).show()
  }

  dispose(): void {
    if (this.intervalId) clearInterval(this.intervalId)
    this.intervalId = null
  }
}

export const inactivityService = new InactivityService()
