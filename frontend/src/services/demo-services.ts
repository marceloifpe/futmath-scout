import type { Report, Subscription, UsageQuota, User } from "@/src/types/domain"

const USAGE_KEY = "futmath-demo-usage"
const FAVORITES_KEY = "futmath-demo-favorites"
export interface AuthService { signIn(profile: "Free" | "Premium"): Promise<User>; signOut(): Promise<void> }
export class MockAuthService implements AuthService {
  async signIn(profile: "Free" | "Premium") { const { userFree, userPremium } = await import("@/src/mocks/data"); return profile === "Premium" ? userPremium : userFree }
  async signOut() { return }
}
export const authService: AuthService = new MockAuthService()
export const subscriptionService = {
  getCurrentPlan(plan: User["plan"]): Subscription { return { plan, price: plan === "Premium" ? 97 : 0 } },
  getUsageQuota(plan: User["plan"]): UsageQuota {
    if (typeof window === "undefined") return { used: 0, limit: plan === "Free" ? 100 : null, renewsAt: new Date().toISOString() }
    return { used: Number(window.localStorage.getItem(USAGE_KEY) || 14), limit: plan === "Free" ? 100 : null, renewsAt: new Date().toISOString() }
  },
  consumeQuery(plan: User["plan"]) {
    const quota = this.getUsageQuota(plan)
    if (plan === "Free" && quota.limit !== null && quota.used >= quota.limit) return false
    if (typeof window !== "undefined") window.localStorage.setItem(USAGE_KEY, String(quota.used + 1))
    return true
  },
}
export const favoritesService = {
  get(): string[] { if (typeof window === "undefined") return []; try { return JSON.parse(window.localStorage.getItem(FAVORITES_KEY) || "[]") } catch { return [] } },
  toggle(id: string): string[] { const next = this.get().includes(id) ? this.get().filter((item) => item !== id) : [...this.get(), id]; if (typeof window !== "undefined") window.localStorage.setItem(FAVORITES_KEY, JSON.stringify(next)); return next },
}
export const reportsService = {
  get(): Report[] { if (typeof window === "undefined") return []; try { return JSON.parse(window.localStorage.getItem("futmath-demo-reports") || "null") || [] } catch { return [] } },
  save(report: Report) { const next = [report, ...this.get()]; if (typeof window !== "undefined") window.localStorage.setItem("futmath-demo-reports", JSON.stringify(next)); return next },
  remove(id: string) { const next = this.get().filter((report) => report.id !== id); if (typeof window !== "undefined") window.localStorage.setItem("futmath-demo-reports", JSON.stringify(next)); return next },
}
