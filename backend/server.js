const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const port = Number(process.env.PORT || 8787);
const allowedOrigin = process.env.CORS_ORIGIN || '*';

app.use(cors({ origin: allowedOrigin }));
app.use(express.json());

const normalizeModelContent = (content) => {
  if (!content) return '';
  return content.replace(/```json/gi, '').replace(/```/g, '').trim();
};

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'mancala-ai-backend' });
});

app.post('/api/ai/move', async (req, res) => {
  const { board, currentPlayer, availableMoves } = req.body || {};

  if (!Array.isArray(board) || board.length !== 14) {
    return res.status(400).json({ error: 'Invalid board payload.' });
  }

  if (currentPlayer !== 2) {
    return res.status(400).json({ error: 'This endpoint currently supports only player 2 AI turns.' });
  }

  if (!Array.isArray(availableMoves) || availableMoves.length === 0) {
    return res.status(400).json({ error: 'No available moves provided.' });
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return res.status(503).json({ error: 'GROQ_API_KEY is not configured in backend environment.' });
  }

  const payload = {
    model: process.env.GROQ_MODEL || 'llama-3.1-8b-instant',
    temperature: 0,
    max_tokens: 60,
    messages: [
      {
        role: 'system',
        content:
          'Voce e uma IA de Mancala e deve responder somente JSON valido no formato {"pitIndex": numero}. Nao inclua explicacoes.',
      },
      {
        role: 'user',
        content: `Escolha a melhor jogada para o Jogador 2 no tabuleiro ${JSON.stringify(
          board
        )}. Casas validas para jogar: ${JSON.stringify(availableMoves)}.`,
      },
    ],
  };

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(502).json({
        error: 'Groq request failed.',
        providerStatus: response.status,
        providerBody: errorText,
      });
    }

    const data = await response.json();
    const rawContent = data?.choices?.[0]?.message?.content;
    const cleanContent = normalizeModelContent(rawContent);

    let suggestedIndex = null;
    try {
      const parsed = JSON.parse(cleanContent);
      suggestedIndex = Number(parsed?.pitIndex);
    } catch (_error) {
      const matchedNumber = cleanContent.match(/\d+/);
      suggestedIndex = matchedNumber ? Number(matchedNumber[0]) : null;
    }

    if (!Number.isInteger(suggestedIndex) || !availableMoves.includes(suggestedIndex)) {
      return res.status(422).json({ error: 'Model did not return a valid pitIndex.', rawContent });
    }

    return res.json({ pitIndex: suggestedIndex });
  } catch (error) {
    return res.status(500).json({ error: 'Unexpected backend error while requesting Groq.', details: String(error) });
  }
});

app.listen(port, () => {
  console.log(`Mancala AI backend running on http://localhost:${port}`);
});
