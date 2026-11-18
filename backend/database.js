const { DatabaseSync } = require('node:sqlite');
const path = require('node:path');

const DB_PATH = path.join(__dirname, 'futmath.db');
const db = new DatabaseSync(DB_PATH);

function inicializarBanco() {
    db.exec(`
        PRAGMA foreign_keys = ON;

        CREATE TABLE IF NOT EXISTS atletas (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            external_id TEXT UNIQUE,
            nome TEXT NOT NULL,
            apelido TEXT,
            idade INTEGER NOT NULL,
            posicao TEXT NOT NULL,
            pe_dominante TEXT DEFAULT 'Destro',
            altura_cm INTEGER,
            clube_atual TEXT NOT NULL,
            uf_clube TEXT DEFAULT 'PE',
            divisao_atual TEXT DEFAULT 'Série D',
            tendencia TEXT DEFAULT 'Em alta',
            origem_dados TEXT DEFAULT 'Web Scraping (oGol / SofaScore)',
            criado_em TEXT DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS historico_estatisticas (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            atleta_id INTEGER NOT NULL,
            temporada TEXT NOT NULL,
            clube TEXT NOT NULL,
            competicao TEXT NOT NULL,
            jogos INTEGER DEFAULT 0,
            minutos INTEGER DEFAULT 0,
            gols INTEGER DEFAULT 0,
            assistencias INTEGER DEFAULT 0,
            fonte TEXT DEFAULT 'oGol / SofaScore',
            FOREIGN KEY (atleta_id) REFERENCES atletas(id) ON DELETE CASCADE
        );
    `);

    const countRow = db.prepare('SELECT COUNT(*) as total FROM atletas').get();
    if (countRow.total < 8) {
        popularDadosIniciais();
    }
}

function popularDadosIniciais() {
    const checkAtleta = db.prepare('SELECT id FROM atletas WHERE external_id = ?');
    const insertAtleta = db.prepare(`
        INSERT INTO atletas (
            external_id, nome, apelido, idade, posicao, pe_dominante,
            altura_cm, clube_atual, uf_clube, divisao_atual, tendencia, origem_dados
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertHist = db.prepare(`
        INSERT INTO historico_estatisticas (
            atleta_id, temporada, clube, competicao, jogos, minutos, gols, assistencias, fonte
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const iniciais = [
        ['OGOL-NAPAO-2026', 'Adriano Brandão Valcácer de Lima', 'Adriano Napão', 26, 'Centroavante (9)', 'Destro', 185, 'Belo Jardim FC', 'PE', 'Série D / Estadual', 'Em alta', 'oGol / Transfermarkt (Web Scraping)', '2026', 32, 2024, 4, 2, 'www.ogol.com.br'],
        ['OGOL-EVERALDO-2026', 'Everaldo Stum', 'Everaldo', 32, 'Atacante', 'Destro', 181, 'Santa Cruz FC', 'PE', 'Série D', 'Estável', 'oGol / SofaScore (Web Scraping)', '2026', 21, 1413, 1, 3, 'www.ogol.com.br'],
        ['OGOL-FELIPE-CLEMENTE-2026', 'Felipe Clemente', 'Felipe Clemente', 25, 'Atacante', 'Destro', 179, 'Gama', 'DF', 'Série D 2026', 'Em alta', 'oGol Artilharia Série D 2026', '2026', 18, 1520, 11, 3, 'www.ogol.com.br'],
        ['OGOL-RIAN-SANTANA-2026', 'Rian Santana', 'Rian Santana', 23, 'Atacante', 'Destro', 182, 'CSA', 'AL', 'Série D 2026', 'Em alta', 'oGol Artilharia Série D 2026', '2026', 19, 1610, 11, 2, 'www.ogol.com.br'],
        ['OGOL-KAUA-MARANHAO-2026', 'Kauã Maranhão', 'Kauã Maranhão', 22, 'Atacante', 'Destro', 177, 'Piauí', 'PI', 'Série D 2026', 'Em alta', 'oGol Artilharia Série D 2026', '2026', 17, 1440, 10, 4, 'www.ogol.com.br'],
        ['OGOL-MATHEUS-LIMA-2026', 'Matheus Lima', 'Matheus Lima', 26, 'Atacante', 'Destro', 180, 'Iguatu', 'CE', 'Série D 2026', 'Em alta', 'oGol Artilharia Série D 2026', '2026', 18, 1490, 10, 1, 'www.ogol.com.br'],
        ['OGOL-LUCAS-PEIXE-2026', 'Lucas Gabriel Lima Dias', 'Lucas Peixe', 29, 'Goleiro', 'Destro', 190, 'Belo Jardim FC', 'PE', 'Pernambucano', 'Estável', 'oGol / Transfermarkt', '2026', 19, 1710, 0, 0, 'www.ogol.com.br'],
        ['OGOL-EDUARDO-BRITO-2026', 'José Eduardo de Brito Silva', 'Eduardo Brito', 29, 'Zagueiro', 'Destro', 187, 'Belo Jardim FC', 'PE', 'Pernambucano', 'Em alta', 'oGol / Transfermarkt', '2026', 22, 1980, 3, 0, 'www.ogol.com.br']
    ];

    for (const item of iniciais) {
        const existente = checkAtleta.get(item[0]);
        if (!existente) {
            const id = insertAtleta.run(...item.slice(0, 12)).lastInsertRowid;
            insertHist.run(id, item[12], item[7], item[9], item[13], item[14], item[15], item[16], item[17]);
        }
    }
}

function listarAtletas(filtros = {}) {
    let sql = `
        SELECT
            a.*,
            COALESCE(SUM(h.jogos), 0) AS total_jogos,
            COALESCE(SUM(h.minutos), 0) AS total_minutos,
            COALESCE(SUM(h.gols), 0) AS total_gols,
            COALESCE(SUM(h.assistencias), 0) AS total_assistencias
        FROM atletas a
        LEFT JOIN historico_estatisticas h ON h.atleta_id = a.id
        WHERE 1=1
    `;
    const params = [];

    if (filtros.busca) {
        sql += ` AND (LOWER(a.nome) LIKE ? OR LOWER(a.apelido) LIKE ? OR LOWER(a.clube_atual) LIKE ?)`;
        const t = `%${filtros.busca.toLowerCase()}%`;
        params.push(t, t, t);
    }
    if (filtros.posicao) {
        sql += ` AND a.posicao LIKE ?`;
        params.push(`%${filtros.posicao}%`);
    }
    if (filtros.divisao) {
        sql += ` AND a.divisao_atual = ?`;
        params.push(filtros.divisao);
    }
    if (filtros.idade_max) {
        sql += ` AND a.idade <= ?`;
        params.push(Number(filtros.idade_max));
    }

    sql += ` GROUP BY a.id ORDER BY a.id ASC`;
    return db.prepare(sql).all(...params);
}

function obterAtletaDetalhado(id) {
    const atleta = db.prepare(`SELECT * FROM atletas WHERE id = ?`).get(Number(id));
    if (!atleta) return null;
    const historico = db.prepare(`SELECT * FROM historico_estatisticas WHERE atleta_id = ?`).all(Number(id));
    return { ...atleta, historico };
}

function criarAtletaCompleto(dados) {
    const res = db.prepare(`
        INSERT INTO atletas (external_id, nome, apelido, idade, posicao, clube_atual, uf_clube, divisao_atual)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
        `EXT-${Date.now()}`, dados.nome, dados.apelido || dados.nome,
        Number(dados.idade) || 24, dados.posicao, dados.clube_atual,
        dados.uf_clube || 'PE', dados.divisao_atual || 'Série D'
    );
    return obterAtletaDetalhado(Number(res.lastInsertRowid));
}

module.exports = {
    db,
    inicializarBanco,
    listarAtletas,
    obterAtletaDetalhado,
    criarAtletaCompleto
};
