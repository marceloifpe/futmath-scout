const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { URL } = require('node:url');
const { execFile } = require('node:child_process');

const {
    inicializarBanco,
    listarAtletas,
    obterAtletaDetalhado,
    criarAtletaCompleto
} = require('./backend/database');

const {
    extrairElencoClubeSofaScore,
    obterHistoricoRealAtletaSofaScore
} = require('./backend/scraper_sofascore');

const PORT = process.env.PORT || 3000;
let requisicoesDiariasUsadas = 14;
const LIMITE_PLANO_GRATIS = 100;

inicializarBanco();

function responderJson(res, statusCode, payload) {
    res.writeHead(statusCode, {
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Cache-Control': 'no-store'
    });
    res.end(JSON.stringify(payload));
}

function lerBodyJson(req) {
    return new Promise((resolve, reject) => {
        let body = '';
        req.on('data', chunk => { body += chunk.toString('utf-8'); });
        req.on('end', () => {
            if (!body) return resolve({});
            try { resolve(JSON.parse(body)); }
            catch (e) { reject(new Error('JSON inválido no corpo da requisição')); }
        });
        req.on('error', reject);
    });
}

const server = http.createServer(async (req, res) => {
    if (req.method === 'OPTIONS') {
        return responderJson(res, 200, { ok: true });
    }

    const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const pathname = parsedUrl.pathname;

    try {
        // 1. Servir Frontend da Raiz (index.html e app.js)
        if (req.method === 'GET' && pathname === '/app.js') {
            const conteudo = fs.readFileSync(path.join(__dirname, 'app.js'), 'utf-8');
            res.writeHead(200, { 'Content-Type': 'application/javascript; charset=utf-8' });
            return res.end(conteudo);
        }

        if (req.method === 'GET' && (pathname === '/' || pathname === '/index.html')) {
            const conteudo = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf-8');
            res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
            return res.end(conteudo);
        }

        // 2. Rota de Web Scraping via Python (oGol / SofaScore / Transfermarkt)
        if (req.method === 'POST' && pathname === '/api/scraper/python') {
            if (requisicoesDiariasUsadas >= LIMITE_PLANO_GRATIS) {
                return responderJson(res, 429, {
                    sucesso: false,
                    erro: 'Limite diário de 100 requisições atingido no Plano Grátis.'
                });
            }
            requisicoesDiariasUsadas++;
            const body = await lerBodyJson(req);
            const termo = body.termo || 'todos';
            const scriptPath = path.join(__dirname, 'backend', 'scrapers', 'ogol_transfermarkt.py');

            execFile('python3', [scriptPath, termo], (error, stdout) => {
                if (error) {
                    return responderJson(res, 500, { sucesso: false, erro: 'Erro ao executar motor Python' });
                }
                const dados = JSON.parse(stdout);
                return responderJson(res, 200, {
                    ...dados,
                    cota_usada: requisicoesDiariasUsadas,
                    cota_limite: LIMITE_PLANO_GRATIS
                });
            });
            return;
        }

        // 3. Listar Atletas com Filtros (GET /api/atletas)
        if (req.method === 'GET' && pathname === '/api/atletas') {
            const filtros = {
                busca: parsedUrl.searchParams.get('busca') || '',
                posicao: parsedUrl.searchParams.get('posicao') || '',
                divisao: parsedUrl.searchParams.get('divisao') || '',
                idade_max: parsedUrl.searchParams.get('idade_max') || ''
            };
            const atletas = listarAtletas(filtros);
            return responderJson(res, 200, { sucesso: true, total: atletas.length, atletas });
        }

        // 4. Obter Ficha Completa do Atleta (GET /api/atletas/:id)
        const matchDetalhe = pathname.match(/^\/api\/atletas\/(\d+)$/);
        if (req.method === 'GET' && matchDetalhe) {
            const atleta = obterAtletaDetalhado(matchDetalhe[1]);
            if (!atleta) return responderJson(res, 404, { sucesso: false, erro: 'Atleta não encontrado' });
            return responderJson(res, 200, { sucesso: true, atleta });
        }

        // 5. Cadastrar Novo Atleta (POST /api/atletas)
        if (req.method === 'POST' && pathname === '/api/atletas') {
            const body = await lerBodyJson(req);
            const novoAtleta = criarAtletaCompleto(body);
            return responderJson(res, 201, { sucesso: true, atleta: novoAtleta });
        }

        // 6. Rotas SofaScore em Node.js
        if (req.method === 'POST' && pathname === '/api/sofascore/clube') {
            const body = await lerBodyJson(req);
            const resultado = await extrairElencoClubeSofaScore(body.clube || 'Belo Jardim');
            return responderJson(res, 200, resultado);
        }

        if (req.method === 'POST' && pathname === '/api/sofascore/atleta') {
            const body = await lerBodyJson(req);
            const resultado = await obterHistoricoRealAtletaSofaScore({
                sofaId: body.sofaId || null,
                nomeAtleta: body.nome || '',
                clubeAtual: body.clube || ''
            });
            return responderJson(res, 200, resultado);
        }

        return responderJson(res, 404, { sucesso: false, erro: 'Rota não encontrada' });
    } catch (erro) {
        return responderJson(res, 500, { sucesso: false, erro: erro.message });
    }
});

if (require.main === module) {
    server.listen(PORT, () => {
        console.log(`⚽ FutMath rodando em: http://localhost:${PORT}`);
    });
}

module.exports = server;
