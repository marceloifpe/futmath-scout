# FutMath

MVP demonstrativo de scouting e análise de desempenho no futebol. A interface utiliza dados fictícios e não oferece autenticação ou pagamentos reais.

## Executar

O projeto usa Next.js App Router, React/TypeScript, Tailwind, shadcn/ui, Lucide, Recharts, TanStack Query, React Hook Form e Zod. Dependências instaladas pelo pnpm.

```bash
pnpm install
pnpm dev
```

Acesse `http://localhost:3000`.

## Organização

- `src/types/domain.ts`: contratos TypeScript do domínio.
- `src/mocks/data.ts`: base demonstrativa consistente com 60 jogadores, 12 clubes e 3 competições.
- `src/repositories/player-repository.ts`: interface `PlayerRepository`, implementação `MockPlayerRepository` e estrutura `ApiPlayerRepository`.
- `src/services/demo-services.ts`: serviços simulados de sessão, favoritos, plano/cota e relatórios.
- `src/components/futmath-app.tsx`: telas e fluxos interativos do MVP.
- `app/`: App Router, metadados e estilos globais.

## Integração com a API

O modo padrão usa o backend Node.js deste repositório. O Next.js encaminha `/backend-api/*` para `http://127.0.0.1:3001/api/*`. Para apontar para outra API, defina:

```dotenv
NEXT_PUBLIC_DATA_PROVIDER=api
NEXT_PUBLIC_API_BASE_URL=https://api.exemplo.com/api
```

Use `NEXT_PUBLIC_DATA_PROVIDER=mock` apenas para executar a demonstração sem o backend. O `ApiPlayerRepository` adapta `/api/atletas` e `/api/atletas/:id` ao domínio da interface.

## Funcionalidades disponíveis

Landing page, login demonstrativo com perfil Free/Premium, dashboard, exploração com pesquisa/filtros/ordenação/paginação, perfil do atleta, comparação de até quatro atletas, clubes e perfil de clube, favoritos persistidos no navegador para demonstração, relatórios com impressão/exportação em PDF pelo navegador, plano e configurações. O tema claro/escuro está disponível pelo menu lateral.

## Pendências para produção

- Autenticação e autorização reais; o login atual é apenas simulado.
- Autenticação e persistência de favoritos/relatórios no backend.
- Provedor licenciado e validado de estatísticas esportivas; os dados apresentados são fictícios.
- Persistência no backend e enforcement de cotas no servidor. `localStorage` só é usado para estado de demonstração.
- Geração de PDF server-side/arquivo dedicado, pagamentos e testes automatizados abrangentes.
