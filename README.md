# Mancala Native

Refatoracao do projeto Mancala para uma base React Native usando Expo.

## Visao geral

- UI migrada de HTML/CSS para componentes nativos com StyleSheet
- Logica de jogo preservada (semeadura, captura, jogada extra e fim de partida)
- Fluxo inicial com nomes dos jogadores e painel de regras mantidos
- Layout preparado para celular e tablet, com rolagem horizontal no tabuleiro

## Pre-requisitos

- Node.js 18+
- npm
- Expo Go (opcional para rodar no celular)

## Instalacao

1. Instale as dependencias:

```bash
npm install
```

2. Instale as dependencias do backend de IA:

```bash
npm --prefix backend install
```

3. Inicie tudo junto (backend + app) em um unico comando:

```bash
npm run dev
```

## Modo solo com Groq

- Na tela inicial, use o botao `Jogar sozinho` para jogar contra a IA.
- O app chama um backend local (`/api/ai/move`) e esse backend consulta a Groq.
- Sem backend/chave valida, o jogo continua em modo solo usando uma estrategia local de fallback.

Exemplo de configuracao no PowerShell (sessao atual):

```powershell
$env:EXPO_PUBLIC_AI_API_URL = "http://localhost:8787"
npm run dev
```

Arquivo de ambiente do backend (`backend/.env`):

```properties
PORT=8787
GROQ_API_KEY=sua_chave_groq_aqui
GROQ_MODEL=llama-3.1-8b-instant
CORS_ORIGIN=*
```

## Scripts

```bash
npm run dev      # Backend + Expo juntos (recomendado)
npm start        # Expo dev server
npm run server   # Apenas backend IA
npm run android  # Abre no Android
npm run ios      # Abre no iOS (macOS)
npm run web      # Abre no navegador via react-native-web
```

## Estrutura

```text
.
├── App.jsx
├── app.json
├── backend
│   ├── .env.example
│   ├── package.json
│   └── server.js
├── package.json
└── src
    ├── MancalaGame.jsx
    └── img
        └── LogoMancala.jpg
```

## Regras resumidas

1. Cada uma das 12 casas comeca com 4 sementes.
2. Cada jogador joga apenas nas 6 casas do proprio lado.
3. A semeadura segue no sentido anti-horario e pula o Mancala adversario.
4. Se a ultima semente cair em casa vazia do proprio lado, ha captura.
5. O jogo termina quando um dos lados fica sem sementes.

## Licenca

MIT. Consulte o arquivo LICENSE.