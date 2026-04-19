import type { VercelRequest, VercelResponse } from '@vercel/node';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue, Timestamp } from 'firebase-admin/firestore';

const serviceAccount = {
  type: 'service_account',
  project_id: process.env.FIREBASE_PROJECT_ID || 'gen-lang-client-0930011385',
  private_key: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
  client_email: process.env.FIREBASE_CLIENT_EMAIL || 'firebase-adminsdk-fbsvc@gen-lang-client-0930011385.iam.gserviceaccount.com',
  token_uri: 'https://oauth2.googleapis.com/token',
};

const DB_ID = process.env.FIREBASE_PROJECT_ID || 'gen-lang-client-0930011385';

let db: ReturnType<typeof getFirestore>;

function initDb() {
  if (!db) {
    if (getApps().length === 0) {
      initializeApp({
        credential: cert(serviceAccount as never),
        databaseURL: `https://${DB_ID}.firebaseio.com`,
        databaseId: DB_ID,
      });
    }
    db = getFirestore();
  }
  return db;
}

const OPENCODE_API_URL = 'https://opencode.ai/zen/v1';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { message, history, apiKey } = req.body;

  if (!message || !apiKey) {
    return res.status(400).json({ error: 'Missing message or apiKey' });
  }

  initDb();

  const messages = (history || []).map((msg: { role: string; content: string }) => ({
    role: msg.role,
    content: msg.content,
  }));

  messages.push({ role: 'user', content: message });

  try {
    const response = await fetch(`${OPENCODE_API_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
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
    if (!reader) {
      throw new Error('No response body');
    }

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
          const choice = parsed.choices?.[0];
          if (choice?.delta?.content) {
            res.write(`data: ${choice.delta.content}\n\n`);
          }
          if (choice?.delta?.tool_calls) {
            for (const toolCall of choice.delta.tool_calls) {
              res.write(`data: [TOOL_CALL]${JSON.stringify(toolCall)}\n\n`);
            }
          }
        } catch {
          // Skip invalid JSON
        }
      }
    }

    res.end();
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}