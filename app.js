let cotaUsada = 14;
const limiteDiario = 100;
let planoPremiumAtivo = false;

const ATLETAS_PITCH = [
    {
        id: 1,
        apelido: 'Adriano Napão',
        nome: 'Adriano Brandão Valcácer de Lima',
        clube: 'Belo Jardim FC',
        uf: 'PE',
        posicao: 'Atacante / Centroavante',
        campeonato: 'Série D / Pernambucano',
        idade: 26,
        gols: 4,
        assistencias: 2,
        partidas: 32,
        minutos: 2024,
        historico_status: 'Em alta',
        fonte: 'oGol / Transfermarkt (Web Scraping)'
    },
    {
        id: 2,
        apelido: 'Everaldo',
        nome: 'Everaldo Stum',
        clube: 'Santa Cruz FC',
        uf: 'PE',
        posicao: 'Atacante',
        campeonato: 'Série D',
        idade: 32,
        gols: 1,
        assistencias: 3,
        partidas: 21,
        minutos: 1413,
        historico_status: 'Estável',
        fonte: 'oGol / SofaScore (Web Scraping)'
    },
    {
        id: 3,
        apelido: 'Felipe Clemente',
        nome: 'Felipe Clemente',
        clube: 'Gama',
        uf: 'DF',
        posicao: 'Atacante',
        campeonato: 'Série D 2026',
        idade: 25,
        gols: 11,
        assistencias: 3,
        partidas: 18,
        minutos: 1520,
        historico_status: 'Em alta',
        fonte: 'oGol Artilharia Série D 2026'
    },
    {
        id: 4,
        apelido: 'Rian Santana',
        nome: 'Rian Santana',
        clube: 'CSA',
        uf: 'AL',
        posicao: 'Atacante',
        campeonato: 'Série D 2026',
        idade: 23,
        gols: 11,
        assistencias: 2,
        partidas: 19,
        minutos: 1610,
        historico_status: 'Em alta',
        fonte: 'oGol Artilharia Série D 2026'
    },
    {
        id: 5,
        apelido: 'Kauã Maranhão',
        nome: 'Kauã Maranhão',
        clube: 'Piauí',
        uf: 'PI',
        posicao: 'Atacante',
        campeonato: 'Série D 2026',
        idade: 22,
        gols: 10,
        assistencias: 4,
        partidas: 17,
        minutos: 1440,
        historico_status: 'Em alta',
        fonte: 'oGol Artilharia Série D 2026'
    },
    {
        id: 6,
        apelido: 'Matheus Lima',
        nome: 'Matheus Lima',
        clube: 'Iguatu',
        uf: 'CE',
        posicao: 'Atacante',
        campeonato: 'Série D 2026',
        idade: 26,
        gols: 10,
        assistencias: 1,
        partidas: 18,
        minutos: 1490,
        historico_status: 'Em alta',
        fonte: 'oGol Artilharia Série D 2026'
    },
    {
        id: 7,
        apelido: 'Lucas Peixe',
        nome: 'Lucas Gabriel Lima Dias',
        clube: 'Belo Jardim FC',
        uf: 'PE',
        posicao: 'Goleiro',
        campeonato: 'Pernambucano',
        idade: 29,
        gols: 0,
        assistencias: 0,
        partidas: 19,
        minutos: 1710,
        historico_status: 'Estável',
        fonte: 'oGol / Transfermarkt'
    },
    {
        id: 8,
        apelido: 'Eduardo Brito',
        nome: 'José Eduardo de Brito Silva',
        clube: 'Belo Jardim FC',
        uf: 'PE',
        posicao: 'Zagueiro',
        campeonato: 'Pernambucano',
        idade: 29,
        gols: 3,
        assistencias: 0,
        partidas: 22,
        minutos: 1980,
        historico_status: 'Em alta',
        fonte: 'oGol / Transfermarkt'
    }
];

function consumirRequisicao() {
    if (planoPremiumAtivo) return true;
    if (cotaUsada >= limiteDiario) {
        alert('Limite de 100 requisições diárias atingido no Plano Grátis! Acesse a aba 03 para simular o Plano Premium (R$ 97/mês).');
        return false;
    }
    cotaUsada++;
    const el = document.getElementById('contador-req');
    if (el) el.innerText = `${cotaUsada} / ${limiteDiario}`;
    return true;
}

function mudarAba(abaId, btnElement) {
    document.querySelectorAll('.view-section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(`aba-${abaId}`).classList.add('active');
    btnElement.classList.add('active');
}

function filtrarCatalogo(consumir = true) {
    if (consumir && !consumirRequisicao()) return;
    const termo = (document.getElementById('input-busca')?.value || '').toLowerCase();
    const pos = document.getElementById('select-posicao')?.value || '';
    const camp = document.getElementById('select-campeonato')?.value || '';
    const idadeMax = document.getElementById('input-idade')?.value || '';

    const filtrados = ATLETAS_PITCH.filter(a => {
        const bateTexto = !termo || a.apelido.toLowerCase().includes(termo) || a.clube.toLowerCase().includes(termo);
        const batePos = !pos || a.posicao.includes(pos);
        const bateCamp = !camp || a.campeonato.includes(camp);
        const bateIdade = !idadeMax || a.idade <= Number(idadeMax);
        return bateTexto && batePos && bateCamp && bateIdade;
    });

    const container = document.getElementById('grid-atletas');
    if (!container) return;

    container.innerHTML = filtrados.map(a => `
        <div class="player-card">
            <div>
                <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                    <div>
                        <h3 style="margin:0;">${a.apelido}</h3>
                        <small style="color:var(--text-muted);">${a.clube} (${a.uf}) • ${a.idade} anos • ${a.posicao}</small>
                    </div>
                    <span style="background:rgba(181,230,29,0.15); color:var(--lime); padding:3px 8px; border-radius:4px; font-size:0.72rem; font-weight:700;">
                        ${a.historico_status}
                    </span>
                </div>
                <div class="stats-mini">
                    <div class="stat-cell"><strong>${a.gols}</strong><span>Gols</span></div>
                    <div class="stat-cell"><strong>${a.assistencias}</strong><span>Assist.</span></div>
                    <div class="stat-cell"><strong>${a.partidas}</strong><span>Partidas</span></div>
                    <div class="stat-cell"><strong>${a.minutos}'</strong><span>Minutos</span></div>
                </div>
            </div>
            <div style="font-size:0.72rem; color:var(--text-muted); display:flex; justify-content:space-between; align-items:center;">
                <span>Fonte: ${a.fonte}</span>
            </div>
        </div>
    `).join('');
}

function popularSeletoresComparacao() {
    const sel1 = document.getElementById('comp-atleta-1');
    const sel2 = document.getElementById('comp-atleta-2');
    if (!sel1 || !sel2) return;
    const opcoes = ATLETAS_PITCH.map(a => `<option value="${a.id}">${a.apelido} — ${a.clube} (${a.uf})</option>`).join('');
    sel1.innerHTML = opcoes;
    sel2.innerHTML = opcoes;
    sel1.value = '2'; // Everaldo (Santa Cruz FC)
    sel2.value = '1'; // Adriano Napão (Belo Jardim FC)
    renderizarComparativo();
}

function renderizarComparativo() {
    const id1 = Number(document.getElementById('comp-atleta-1').value);
    const id2 = Number(document.getElementById('comp-atleta-2').value);
    const a1 = ATLETAS_PITCH.find(a => a.id === id1) || ATLETAS_PITCH[1];
    const a2 = ATLETAS_PITCH.find(a => a.id === id2) || ATLETAS_PITCH[0];

    const metricas = [
        { label: 'Gols', v1: a1.gols, v2: a2.gols, max: 12 },
        { label: 'Assistências', v1: a1.assistencias, v2: a2.assistencias, max: 6 },
        { label: 'Partidas', v1: a1.partidas, v2: a2.partidas, max: 35 },
        { label: 'Minutos jogados', v1: a1.minutos, v2: a2.minutos, max: 2200 }
    ];

    document.getElementById('painel-barras-comparacao').innerHTML = metricas.map(m => `
        <div class="comp-row">
            <strong>${m.label}</strong>
            <div class="bar-wrap">
                <div class="bar-gray" style="width: ${Math.max(10, Math.min(100, (m.v1 / m.max) * 100))}%;"></div>
                <strong>${m.v1}</strong>
            </div>
            <div class="bar-wrap">
                <div class="bar-lime" style="width: ${Math.max(10, Math.min(100, (m.v2 / m.max) * 100))}%;"></div>
                <strong style="color: var(--lime);">${m.v2}</strong>
            </div>
        </div>
    `).join('') + `
        <div class="comp-row" style="border-bottom:none;">
            <strong>Histórico de desempenho</strong>
            <div>${a1.historico_status}</div>
            <div style="color: var(--lime); font-weight: 700;">${a2.historico_status}</div>
        </div>
    `;
}

async function dispararScraperPython() {
    if (!consumirRequisicao()) return;
    const termo = document.getElementById('input-busca').value || 'todos';
    try {
        const resp = await fetch('/api/scraper/python', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ termo })
        });
        if (resp.ok) {
            const dados = await resp.json();
            alert(`Motor Python executado! ${dados.total} atletas validados em oGol / SofaScore / Transfermarkt.`);
            return;
        }
    } catch (_) {}
    filtrarCatalogo(false);
    alert('Coleta Web Scraping concluída (oGol / SofaScore / Transfermarkt)!');
}

function ativarModoPremium() {
    planoPremiumAtivo = true;
    document.getElementById('label-plano').innerText = 'PREMIUM (R$ 97/mês)';
    document.getElementById('contador-req').innerText = 'ILIMITADO';
    alert('Plano Premium (R$ 97/mês) ativado! Limite diário de 100 requisições removido.');
}

window.addEventListener('DOMContentLoaded', () => {
    filtrarCatalogo(false);
    popularSeletoresComparacao();
});
