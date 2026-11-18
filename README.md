# futmath-scout
# ⚽ FutMath — Inteligência de Mercado e Scouting Esportivo

> **"A inteligência de mercado que cabe no orçamento da base."**



O **FutMath** é uma plataforma web de análise de desempenho e scouting desenvolvida especificamente para clubes de pequeno e médio porte (foco nas **Séries C, D e Campeonatos Estaduais/Regionais**)[cite: 13, 31, 48].

Enquanto as ferramentas tradicionais do mercado possuem custos proibitivos e as APIs gratuitas apresentam dados defasados para divisões de acesso, o FutMath utiliza um motor próprio de **Web Scraping** (em Python e Node.js) para extrair, cruzar e padronizar estatísticas reais de múltiplas fontes abertas (**oGol, SofaScore e Transfermarkt**), operando de forma **100% independente da CBF**.

---

## 🎯 O Problema vs. A Solução

* **O Problema:** Em 2026, apenas a Série D conta com **96 clubes** (e 116 somando Séries C e D)[cite: 31, 47]. Com orçamentos curtos, uma contratação errada compromete toda a temporada[cite: 31, 47]. Sem acesso financeiro às plataformas de elite, esses clubes tomam decisões baseadas em indicações informais de empresários, intuição e vídeos curtos[cite: 31, 47].
* **A Solução (FutMath):** Reduzir a barreira financeira de acesso aos dados esportivos por meio de três pilares[cite: 31, 48, 51]:
  1. **01. Pesquisar:** Filtros diretos por posição, idade, campeonato e desempenho[cite: 31, 48].
  2. **02. Comparar:** Comparação visual lado a lado de métricas-chave (Ex: *Everaldo [Santa Cruz FC]* vs. *Adriano Napão [Belo Jardim FC]*)[cite: 21, 31, 50].
  3. **03. Justificar:** Relatórios objetivos para embasar a decisão da diretoria e comissão técnica com dados reais[cite: 31, 48].

---

## 🏗️ Arquitetura em Camadas

O sistema foi projetado utilizando uma **Arquitetura em Camadas (Layered Architecture)** desacoplada via API REST, permitindo que o mesmo Back-End atenda a interface Web atual e futuras aplicações em **React (Vite)** e **React Native (Mobile)**:

1. **Camada de Apresentação (Front-End / Raiz):** Interface responsiva (`index.html` + `app.js`) na raiz do projeto para deploy direto na Vercel, pronta para evolução em componentes **React** e **React Native**.
2. **Camada de Controle / API Gateway (`server.js`):** Servidor em **Node.js** que gerencia as rotas REST (`/api/atletas`, `/api/scraper/python`), aplica o controle de cota diária (**Rate Limit de 100 requisições/dia no Plano Grátis**) e serve os dados em JSON[cite: 18, 31].
3. **Camada de Serviço e Coleta (Workers de Web Scraping):** Scripts automatizados em **Python** (`ogol_transfermarkt.py`) e **Node.js** (`scraper_sofascore.js`) que mineram e cruzam estatísticas de jogos, minutagem, gols e assistências em múltiplas bases abertas[cite: 17, 49, 50].
4. **Camada de Persistência (`database.js` + `futmath.db`):** Banco de dados relacional em **SQLite** para armazenamento estruturado do histórico de carreira dos atletas e cache local das consultas[cite: 12, 18, 20].

## Executar a aplicação integrada

Requisitos: Node.js 22+ e npm. Na raiz do projeto:

```bash
npm --prefix frontend install
npm run dev
```

O comando inicia a API em `http://localhost:3001` e o frontend Next.js em `http://localhost:3000`. Use `GET /api/health` para verificar a API. Para executar o frontend com a base fictícia, defina `NEXT_PUBLIC_DATA_PROVIDER=mock`.

