/**
 * COLETOR OFICIAL DE DADOS REAIS DO SOFASCORE (API v1 JSON)
 * - Sem dados fictícios: retorna exclusivamente o que existe na base real do SofaScore.
 * - Endpoints utilizados:
 *   1) /search/all?q={nome}
 *   2) /team/{teamId}/players
 *   3) /player/{playerId}/transfer-history
 *   4) /player/{playerId}/statistics/seasons
 *   5) /player/{playerId}/unique-tournament/{uId}/season/{sId}/statistics/overall
 */

const SOFA_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Accept': 'application/json, text/plain, */*',
    'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8',
    'Origin': 'https://www.sofascore.com',
    'Referer': 'https://www.sofascore.com/'
};

async function fetchSofaJson(endpointPath) {
    const url = `https://api.sofascore.com/api/v1${endpointPath}`;
    const resp = await fetch(url, {
        method: 'GET',
        headers: SOFA_HEADERS,
        signal: AbortSignal.timeout(8000)
    });
    if (!resp.ok) {
        throw new Error(`SofaScore HTTP ${resp.status} em ${endpointPath}`);
    }
    return await resp.json();
}

function traduzirPosicaoSofa(pos) {
    const mapa = {
        'G': 'Goleiro (1)',
        'D': 'Zagueiro / Lateral',
        'M': 'Volante / Meia',
        'F': 'Atacante / Centroavante'
    };
    return mapa[pos] || pos || 'Atleta';
}

function traduzirPeSofa(foot) {
    if (!foot) return 'Destro';
    const f = foot.toLowerCase();
    if (f.includes('left')) return 'Canhoto';
    if (f.includes('both')) return 'Ambidestro';
    return 'Destro';
}

function calcularIdadeTimestamp(ts) {
    if (!ts) return 24;
    const nasc = new Date(ts * 1000);
    const diff = Date.now() - nasc.getTime();
    return Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000));
}

/**
 * 1. Extrai todos os jogadores reais do elenco de um clube no SofaScore
 */
async function extrairElencoClubeSofaScore(nomeClube) {
    const busca = await fetchSofaJson(`/search/all?q=${encodeURIComponent(nomeClube)}`);
    const resultados = busca.results || [];
    const timeItem = resultados.find(r => r.type === 'team');

    if (!timeItem || !timeItem.entity) {
        return {
            sucesso: false,
            mensagem: `Clube "${nomeClube}" não encontrado no SofaScore.`
        };
    }

    const team = timeItem.entity;
    const dadosPlayers = await fetchSofaJson(`/team/${team.id}/players`);
    const listaPlayers = dadosPlayers.players || [];

    const atletasExtraidos = listaPlayers.map(item => {
        const p = item.player;
        return {
            sofa_id: p.id,
            cbf_id: `SOFA-${p.id}`,
            nome: p.name,
            apelido: p.shortName || p.name,
            idade: calcularIdadeTimestamp(p.dateOfBirthTimestamp),
            posicao: traduzirPosicaoSofa(p.position),
            pe_dominante: traduzirPeSofa(p.preferredFoot),
            altura_cm: p.height || null,
            clube_atual: team.name,
            uf_clube: team.country?.alpha2 || 'BR',
            origem_dados: `SofaScore Oficial (${team.name})`
        };
    });

    return {
        sucesso: true,
        clube: team.name,
        sofa_team_id: team.id,
        total: atletasExtraidos.length,
        atletas: atletasExtraidos
    };
}

/**
 * 2. Busca o Histórico Real de Clubes/Estatísticas (incluindo 2025 e 2026) e Transferências de um atleta no SofaScore
 */
async function obterHistoricoRealAtletaSofaScore({ sofaId = null, nomeAtleta = '', clubeAtual = '' }) {
    let playerId = sofaId;

    // Se ainda não temos o ID do SofaScore do atleta (ex: veio do BID ou da API-Sports), pesquisa pelo nome
    if (!playerId && nomeAtleta) {
        const termo = `${nomeAtleta} ${clubeAtual}`.trim();
        let busca = await fetchSofaJson(`/search/all?q=${encodeURIComponent(termo)}`);
        let playerHit = (busca.results || []).find(r => r.type === 'player');

        if (!playerHit) {
            busca = await fetchSofaJson(`/search/all?q=${encodeURIComponent(nomeAtleta)}`);
            playerHit = (busca.results || []).find(r => r.type === 'player');
        }

        if (playerHit && playerHit.entity) {
            playerId = playerHit.entity.id;
        }
    }

    if (!playerId) {
        return {
            sucesso: false,
            mensagem: `Atleta "${nomeAtleta}" não localizado no SofaScore.`
        };
    }

    // Busca Transferências Reais e Temporadas Reais em paralelo
    const [transfData, seasonsData] = await Promise.all([
        fetchSofaJson(`/player/${playerId}/transfer-history`).catch(() => ({ transferHistory: [] })),
        fetchSofaJson(`/player/${playerId}/statistics/seasons`).catch(() => ({ uniqueTournamentSeasons: [] }))
    ]);

    // Formata transferências reais
    const transferenciasReais = (transfData.transferHistory || []).map((t, idx) => {
        const dataFormatada = t.transferDateTimestamp
            ? new Date(t.transferDateTimestamp * 1000).toISOString().split('T')[0]
            : 'N/A';
        const origem = t.transferFrom?.name || t.fromTeamName || 'Origem';
        const destino = t.transferTo?.name || t.toTeamName || 'Destino';
        return {
            data_publicacao: dataFormatada,
            numero_contrato: `SOFA-TRF-${playerId}-${idx + 1}`,
            codigo_inscricao_cbf: `SOFA-${playerId}`,
            clube: `${origem} ➔ ${destino}`,
            uf: 'SOFA',
            tipo_vinculo: t.type === 1 ? 'Empréstimo' : (t.transferFeeDescription || 'Transferência'),
            observacao: `Transferência oficial SofaScore`
        };
    });

    // Coleta as estatísticas reais por campeonato/temporada (focando nas últimas temporadas até 2026)
    const torns = seasonsData.uniqueTournamentSeasons || [];
    const requisicoesStats = [];

    for (const utBlock of torns.slice(0, 6)) {
        const ut = utBlock.uniqueTournament;
        const seasons = (utBlock.seasons || []).slice(0, 3);
        for (const s of seasons) {
            requisicoesStats.push(
                fetchSofaJson(`/player/${playerId}/unique-tournament/${ut.id}/season/${s.id}/statistics/overall`)
                    .then(res => ({
                        ano: s.year || s.name || 'N/A',
                        competicao: ut.name,
                        clube: res.team?.name || clubeAtual,
                        stats: res.statistics || {}
                    }))
                    .catch(() => null)
            );
        }
    }

    const resultadosStats = (await Promise.all(requisicoesStats)).filter(Boolean);

    const historicoReal = resultadosStats
        .filter(r => (r.stats.appearances || 0) > 0)
        .map(r => ({
            temporada: String(r.ano),
            clube: r.clube,
            uf_clube: '',
            competicao: r.competicao,
            jogos: r.stats.appearances || 0,
            titular: r.stats.matchesStarted || 0,
            minutos: r.stats.minutesPlayed || 0,
            gols: r.stats.goals || 0,
            assistencias: r.stats.assists || 0,
            cartoes_amarelos: r.stats.yellowCards || 0,
            cartoes_vermelhos: r.stats.redCards || 0,
            fonte: r.stats.rating ? `SofaScore (Nota ${Number(r.stats.rating).toFixed(2)})` : 'SofaScore Oficial'
        }))
        .sort((a, b) => a.temporada.localeCompare(b.temporada));

    return {
        sucesso: true,
        sofa_id: playerId,
        historico: historicoReal,
        transferencias: transferenciasReais
    };
}

module.exports = {
    extrairElencoClubeSofaScore,
    obterHistoricoRealAtletaSofaScore
};

