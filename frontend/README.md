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

## Alternar mock e API

O modo padrão é `mock` e funciona sem backend. Para documentar a configuração local, defina:

```dotenv
NEXT_PUBLIC_DATA_PROVIDER=mock
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
```

A implementação `ApiPlayerRepository` existe como ponto de extensão e deliberadamente informa que a API ainda não está configurada. Nenhum endpoint foi inventado. Quando o backend Spring Boot estiver definido, implemente os métodos do repositório, o adaptador de respostas externas e os contratos/erros reais. Para selecionar `api`, use `NEXT_PUBLIC_DATA_PROVIDER=api` após configurar esses métodos.

## Funcionalidades disponíveis

Landing page, login demonstrativo com perfil Free/Premium, dashboard, exploração com pesquisa/filtros/ordenação/paginação, perfil do atleta, comparação de até quatro atletas, clubes e perfil de clube, favoritos persistidos no navegador para demonstração, relatórios com impressão/exportação em PDF pelo navegador, plano e configurações. O tema claro/escuro está disponível pelo menu lateral.

## Pendências para produção

- Autenticação e autorização reais; o login atual é apenas simulado.
- API REST e adaptadores para os contratos do backend.
- Provedor licenciado e validado de estatísticas esportivas; os dados apresentados são fictícios.
- Persistência no backend e enforcement de cotas no servidor. `localStorage` só é usado para estado de demonstração.
- Geração de PDF server-side/arquivo dedicado, pagamentos e testes automatizados abrangentes.
