import type { Pagination, Player, PlayerFilters } from "@/src/types/domain"
import { players } from "@/src/mocks/data"

export interface PlayerRepository {
  listPlayers(filters: PlayerFilters, pagination: Pagination): Promise<{ items: Player[]; total: number }>
  getPlayerById(id: string): Promise<Player | undefined>
  comparePlayers(ids: string[], season: string): Promise<Player[]>
}

export class MockPlayerRepository implements PlayerRepository {
  async listPlayers(filters: PlayerFilters, pagination: Pagination) {
    let result = [...players]
    if (filters.search) result = result.filter((player) => player.name.toLocaleLowerCase("pt-BR").includes(filters.search!.toLocaleLowerCase("pt-BR")))
    if (filters.position && filters.position !== "Todas") result = result.filter((player) => player.position === filters.position)
    if (filters.clubId) result = result.filter((player) => player.clubId === filters.clubId)
    if (filters.competitionId) result = result.filter((player) => player.competitionId === filters.competitionId)
    if (filters.minAge) result = result.filter((player) => player.age >= filters.minAge!)
    if (filters.maxAge) result = result.filter((player) => player.age <= filters.maxAge!)
    if (filters.minMinutes) result = result.filter((player) => player.minutes >= filters.minMinutes!)
    if (filters.minGoals) result = result.filter((player) => player.goals >= filters.minGoals!)
    if (filters.minAssists) result = result.filter((player) => player.assists >= filters.minAssists!)
    const key = filters.sortBy || "rating"
    result.sort((a, b) => {
      const av = a[key], bv = b[key]
      const delta = typeof av === "number" && typeof bv === "number" ? av - bv : String(av).localeCompare(String(bv))
      return filters.sortDirection === "asc" ? delta : -delta
    })
    const start = (pagination.page - 1) * pagination.pageSize
    return { items: result.slice(start, start + pagination.pageSize), total: result.length }
  }
  async getPlayerById(id: string) { return players.find((player) => player.id === id) }
  async comparePlayers(ids: string[], season: string) { return players.filter((player) => ids.includes(player.id) && player.season === season) }
}

export class ApiPlayerRepository implements PlayerRepository {
  private baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL
  private notConfigured(): never { throw new Error(`API REST ainda não configurada. Defina NEXT_PUBLIC_API_BASE_URL (atual: ${this.baseUrl || "não definido"}).`) }
  async listPlayers() { return this.notConfigured() }
  async getPlayerById() { return this.notConfigured() }
  async comparePlayers() { return this.notConfigured() }
}

export const playerRepository: PlayerRepository = process.env.NEXT_PUBLIC_DATA_PROVIDER === "api" ? new ApiPlayerRepository() : new MockPlayerRepository()
