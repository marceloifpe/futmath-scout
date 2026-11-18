import type { Club, Competition, Player, PlayerPerformanceHistory, Position, Report, User } from "@/src/types/domain"

export const competitions: Competition[] = [
  { id: "serie-d", name: "Campeonato Brasileiro Série D", level: "Nacional" },
  { id: "paulista-a2", name: "Campeonato Paulista A2", level: "Estadual" },
  { id: "mineiro", name: "Campeonato Mineiro", level: "Estadual" },
]
export const clubs: Club[] = [
  { id: "ferroviaria", name: "Ferroviária", state: "SP", competitionId: "serie-d", season: "2025", color: "#E8554E" },
  { id: "maranhao", name: "Maranhão AC", state: "MA", competitionId: "serie-d", season: "2025", color: "#F2B544" },
  { id: "caxias", name: "Caxias", state: "RS", competitionId: "serie-d", season: "2025", color: "#D93E4D" },
  { id: "treze", name: "Treze", state: "PB", competitionId: "serie-d", season: "2025", color: "#E5C94D" },
  { id: "anapolis", name: "Anápolis", state: "GO", competitionId: "serie-d", season: "2025", color: "#E24B44" },
  { id: "sao-bernardo", name: "São Bernardo", state: "SP", competitionId: "paulista-a2", season: "2025", color: "#F0D048" },
  { id: "ituano", name: "Ituano", state: "SP", competitionId: "paulista-a2", season: "2025", color: "#DB4048" },
  { id: "botafogo-sp", name: "Botafogo-SP", state: "SP", competitionId: "paulista-a2", season: "2025", color: "#E7E7E7" },
  { id: "tombense", name: "Tombense", state: "MG", competitionId: "mineiro", season: "2025", color: "#D74C4C" },
  { id: "democrata", name: "Democrata GV", state: "MG", competitionId: "mineiro", season: "2025", color: "#E5D141" },
  { id: "patrocinense", name: "Patrocinense", state: "MG", competitionId: "mineiro", season: "2025", color: "#E34B4B" },
  { id: "portuguesa", name: "Portuguesa", state: "SP", competitionId: "paulista-a2", season: "2025", color: "#36A879" },
]
const first = ["Caio", "Lucas", "Matheus", "Pedro", "Rafael", "Bruno", "Diego", "João", "Gabriel", "Vitor", "André", "Felipe", "Marcos", "Renan", "Thiago", "Daniel", "Igor", "Eduardo", "Gustavo", "Leandro"]
const last = ["Almeida", "Ferreira", "Santos", "Oliveira", "Costa", "Ribeiro", "Lima", "Souza", "Mendes", "Carvalho", "Barbosa", "Azevedo", "Nogueira", "Moura", "Teixeira"]
const positions: Position[] = ["Goleiro", "Zagueiro", "Lateral", "Meio-campista", "Atacante"]
export const players: Player[] = Array.from({ length: 60 }, (_, index) => {
  const club = clubs[index % clubs.length]
  const competition = competitions.find((item) => item.id === club.competitionId)!
  const position = positions[index % positions.length]
  const appearances = 8 + (index * 7) % 23
  const goals = position === "Atacante" ? (index * 3) % 12 : position === "Meio-campista" ? (index * 2) % 7 : position === "Goleiro" ? 0 : index % 4
  const assists = (index * 5) % 9
  return {
    id: `atleta-${index + 1}`, name: `${first[index % first.length]} ${last[(index * 7 + Math.floor(index / 5)) % last.length]}`, age: 18 + (index * 11) % 16,
    nationality: index % 13 === 0 ? "Argentina" : "Brasil", clubId: club.id, competitionId: competition.id, position,
    appearances, minutes: appearances * (65 + (index * 13) % 26), goals, assists, shots: goals * 3 + (index * 5) % 17,
    rating: Number((6.1 + ((index * 17) % 30) / 10).toFixed(1)), recentChange: Number((((index * 13) % 17) - 5) / 10).toFixed(1) as unknown as number,
    season: index % 4 === 0 ? "2024" : "2025", source: { sourceName: "Base demonstrativa FutMath", sourceId: `demo-${index + 1}`, updatedAt: "2025-11-18", competitionId: competition.id, season: index % 4 === 0 ? "2024" : "2025", dataQuality: "demo" },
  }
})
export const userFree: User = { id: "user-free", name: "Mariana Costa", club: "Ferroviária", plan: "Free" }
export const userPremium: User = { ...userFree, id: "user-premium", plan: "Premium" }
export const historyForPlayer = (id: string): PlayerPerformanceHistory[] => {
  const seed = Number(id.split("-").at(-1)) || 1
  return ["Mar", "Abr", "Mai", "Jun", "Jul", "Ago"].map((month, index) => ({ month, rating: Number((6.2 + ((seed + index * 3) % 16) / 10).toFixed(1)), goals: (seed + index * 2) % 4, assists: (seed + index) % 3 }))
}
export const initialReports: Report[] = [
  { id: "relatorio-1", title: "Análise de meio-campo", type: "Comparação", createdAt: "2025-11-16", playerIds: ["atleta-4", "atleta-9", "atleta-14"], season: "2025" },
  { id: "relatorio-2", title: "Opções de ataque — Série D", type: "Comparação", createdAt: "2025-11-12", playerIds: ["atleta-5", "atleta-10"], season: "2025" },
]
