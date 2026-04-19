import express from 'express';

const app = express();
app.use(express.json());

const OPENCODE_API_KEY = 'sk-jLHTSQp8VGF9nN7oRAFlqyrfCxB8moyPIDtS0S1V1MCaFrV9LVR3KBtQVmxqk6PY';

const authCodes = new Map();

function generateCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = 'CIPH-';
  for (let i = 0; i < 4; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

app.get('/api/auth/verify', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const { code } = req.query;

  if (!code) {
    const newCode = generateCode();
    const expiresAt = Date.now() + 5 * 60 * 1000;
    authCodes.set(newCode, { status: 'pending', uid: null, apiKey: null, expiresAt });
    return res.json({ code: newCode, expiresAt: new Date(expiresAt).toISOString() });
  }

  const data = authCodes.get(code);

  if (!data) return res.status(404).json({ error: 'Code not found' });

  if (data.status === 'verified' && data.uid && data.apiKey) {
    return res.json({ status: 'verified', uid: data.uid, apiKey: data.apiKey });
  }

  if (data.status === 'expired' || data.expiresAt < Date.now()) {
    return res.json({ status: 'expired' });
  }

  return res.json({ status: 'pending' });
});

app.post('/api/auth/verify', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const { code, uid } = req.body;

  if (!code || !uid) {
    return res.status(400).json({ error: 'Missing code or uid' });
  }

  if (!authCodes.has(code)) {
    authCodes.set(code, { status: 'pending', uid: null, apiKey: null });
  }

  authCodes.set(code, { status: 'verified', uid, apiKey: OPENCODE_API_KEY });
  res.json({ success: true });
});

app.post('/api/chat', async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'text/event-stream');

  const { message, history, apiKey } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Missing message' });
  }

  const messages = (history || []).map((m) => ({ role: m.role, content: m.content }));
  messages.push({ role: 'user', content: message });

  try {
    const response = await fetch('https://opencode.ai/zen/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey || OPENCODE_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'opencode/zen',
        messages,
        stream: true,
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error('No response body');

    const decoder = new TextDecoder();
    let buffer = '';

    res.write('data: \n\n');

    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        res.write('data: [DONE]\n\n');
        break;
      }

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const data = line.slice(6);
        if (data === '[DONE]') {
          res.write('data: [DONE]\n\n');
          break;
        }
        try {
          const parsed = JSON.parse(data);
          if (parsed.choices?.[0]?.delta?.content) {
            res.write(`data: ${parsed.choices[0].delta.content}\n\n`);
          }
        } catch {}
      }
    }

    res.end();
  } catch (error) {
    console.error('Chat error:', error.message || error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`
🤖 Cipher Server running on http://localhost:${PORT}

API Key: ${OPENCODE_API_KEY.substring(0, 15)}...
`));