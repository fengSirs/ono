# ONO! para FinClip

Miniapp nativo em WXML/WXSS/JS para a campanha de Natal da ONO, com backend independente em Node.js 22 + `node:sqlite`. O projeto tem 9 páginas: lobby, convite, sala, partida, criação de perus, tarefas, resgate, regras e ranking semanal.

## Estado atual

- Backend implantado em `https://ono.phizminiapp.com/`; health check, configuração e campanha respondem.
- Produção está em `AUTH_MODE=pending`: login, partidas, ranking e recompensas permanecem fechados por proteção.
- O `.fap` nativo ainda não foi compilado/publicado no Phiz; login real, cartões de convite e teste em aparelho físico ainda não foram validados.

## Rodar localmente

```sh
cp .env.example .env
npm run config:local
node scripts/start.mjs
```

O backend fica em `http://127.0.0.1:4390`. Para visualizar o miniapp, importe a pasta `miniapp/` no FinClip Studio. O idioma padrão é português do Brasil; inglês e chinês também estão disponíveis.

Para build e testes:

```sh
npm ci
npm run verify
```

## Configuração

`miniapp/config.js` é gerado a partir de um template e não entra no Git.

```sh
npm run config:local   # 127.0.0.1 + modo visitante
npm run config:prod    # https://ono.phizminiapp.com + finclip
```

Para publicar, use `npm run config:prod` e siga o `handoff.md`. Não use o modo visitante em produção.

## Regras da campanha

- Salas apenas com amigos reais e rodada completa: +10/+20/+30 por pessoa em salas de 2/3/4 jogadores; vencedor recebe +5; limite de 100 pontos por dia.
- 10 pontos = 1 porção de ração; 100 porções concluem o crescimento.
- Ranking semanal: segunda-feira 00:00 a domingo 23:59:59.999, horário de Brasília.
- Os primeiros 100 que completarem o crescimento na semana podem solicitar o prêmio; cada pessoa pode ganhar no máximo uma vez em toda a campanha.
- O resgate passa por análise manual; não usar estoque real em ambiente de teste.

Detalhes em `README.md`, `docs/api.md` e `docs/weekly-leaderboard.md`.

## Segurança

Não versionar `.env`, `miniapp/config.js`, banco SQLite, logs, chaves ou dados reais. Chaves de produção ficam somente nas variáveis de ambiente do servidor. Veja `SECURITY.md`.
