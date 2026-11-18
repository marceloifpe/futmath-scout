import type { Pagination, Player, PlayerFilters } from "@/src/types/domain"
import { clubs, competitions, players } from "@/src/mocks/data"

type ApiAthlete = {
  id: number | string
  external_id?: string
  nome: string
  apelido?: string
  idade: number
  posicao: string
  clube_atual: string
  uf_clube?: string
  divisao_atual?: string
  tendencia?: string
  origem_dados?: string
  total_jogos?: number
  total_minutos?: number
  total_gols?: number
  total_assistencias?: number
  historico?: Array<{ temporada?: string; jogos?: number; minutos?: number; gols?: number; assistencias?: number; competicao?: string }>
}

type ApiListResponse = { sucesso: boolean; total: number; atletas: ApiAthlete[]; erro?: string }
type ApiDetailResponse = { sucesso: boolean; atleta: ApiAthlete; erro?: string }

const apiPlayerCache = new Map<string, Player>()

const slugify = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")

function normalizePosition(value: string): Player["position"] {
  const position = value.toLocaleLowerCase("pt-BR")
  if (position.includes("goleiro")) return "Goleiro"
  if (position.includes("zagueiro") || position.includes("defensor")) return "Zagueiro"
  if (position.includes("lateral")) return "Lateral"
  if (position.includes("meia") || position.includes("volante")) return "Meio-campista"
  return "Atacante"
}

function toPlayer(athlete: ApiAthlete): Player {
  const history = athlete.historico || []
  const sum = (field: "jogos" | "minutos" | "gols" | "assistencias") => history.reduce((total, item) => total + Number(item[field] || 0), 0)
  const appearances = Number(athlete.total_jogos ?? sum("jogos"))
  const minutes = Number(athlete.total_minutos ?? sum("minutos"))
  const goals = Number(athlete.total_gols ?? sum("gols"))
  const assists = Number(athlete.total_assistencias ?? sum("assistencias"))
  const competitionName = athlete.divisao_atual || history.at(-1)?.competicao || "Competição não informada"
  const season = history.at(-1)?.temporada || new Date().getFullYear().toString()
  const recentChange = athlete.tendencia?.toLocaleLowerCase("pt-BR").includes("alta") ? 0.5 : 0
  const rating = Number(Math.min(10, 6 + ((goals + assists * 0.7) / Math.max(appearances, 1)) * 2).toFixed(1))
  const player: Player = {
    id: String(athlete.id),
    name: athlete.apelido || athlete.nome,
    age: Number(athlete.idade),
    nationality: "Brasil",
    clubId: slugify(athlete.clube_atual),
    clubName: athlete.clube_atual,
    clubState: athlete.uf_clube || "BR",
    competitionId: slugify(competitionName),
    competitionName,
    position: normalizePosition(athlete.posicao),
    appearances,
    minutes,
    goals,
    assists,
    shots: 0,
    rating,
    recentChange,
    season,
    source: {
      sourceName: athlete.origem_dados || "FutMath API",
      sourceId: athlete.external_id || String(athlete.id),
      updatedAt: new Date().toISOString(),
      competitionId: slugify(competitionName),
      season,
      dataQuality: "verified",
    },
  }
  apiPlayerCache.set(player.id, player)
  return player
}

function applyFilters(items: Player[], filters: PlayerFilters) {
  let result = [...items]
  if (filters.search) result = result.filter((player) => `${player.name} ${player.clubName || ""}`.toLocaleLowerCase("pt-BR").includes(filters.search!.toLocaleLowerCase("pt-BR")))
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
  return result
}

function syncApiCatalog(items: Player[]) {
  players.splice(0, players.length, ...items)
  const apiCompetitions = [...new Map(items.map((player) => [player.competitionId, {
    id: player.competitionId,
    name: player.competitionName || "Competição não informada",
    level: "Não informado",
  }])).values()]
  const palette = ["#102a72", "#218756", "#8055b6", "#b47920", "#1c4b9b"]
  const apiClubs = [...new Map(items.map((player, index) => [player.clubId, {
    id: player.clubId,
    name: player.clubName || "Clube não informado",
    state: player.clubState || "BR",
    competitionId: player.competitionId,
    season: player.season,
    color: palette[index % palette.length],
  }])).values()]
  competitions.splice(0, competitions.length, ...apiCompetitions)
  clubs.splice(0, clubs.length, ...apiClubs)
}

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
  private baseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL || "/backend-api").replace(/\/$/, "")

  private async request<T>(path: string): Promise<T> {
    const controller = new AbortController()
    const timeout = window.setTimeout(() => controller.abort(), 10_000)
    try {
      const response = await fetch(`${this.baseUrl}${path}`, { headers: { Accept: "application/json" }, signal: controller.signal })
      const payload = await response.json().catch(() => null)
      if (!response.ok || !payload) throw new Error(payload?.erro || `API indisponível (HTTP ${response.status})`)
      return payload as T
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") throw new Error("A API demorou demais para responder")
      throw error
    } finally {
      window.clearTimeout(timeout)
    }
  }

  async listPlayers(filters: PlayerFilters, pagination: Pagination) {
    const response = await this.request<ApiListResponse>("/atletas")
    const mapped = response.atletas.map(toPlayer)
    syncApiCatalog(mapped)
    const result = applyFilters(mapped, filters)
    const start = (pagination.page - 1) * pagination.pageSize
    return { items: result.slice(start, start + pagination.pageSize), total: result.length }
  }

  async getPlayerById(id: string) {
    const cached = apiPlayerCache.get(id)
    if (cached) return cached
    const response = await this.request<ApiDetailResponse>(`/atletas/${encodeURIComponent(id)}`)
    return toPlayer(response.atleta)
  }

  async comparePlayers(ids: string[], season: string) {
    const result = await Promise.all(ids.map((id) => this.getPlayerById(id)))
    return result.filter((player): player is Player => Boolean(player) && (!season || player.season === season))
  }
}

export const usingApi = process.env.NEXT_PUBLIC_DATA_PROVIDER !== "mock"
export const playerRepository: PlayerRepository = usingApi ? new ApiPlayerRepository() : new MockPlayerRepository()
export const getKnownPlayers = () => usingApi ? [...apiPlayerCache.values()] : players
