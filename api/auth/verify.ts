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

function generateCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = 'CIPH-';
  for (let i = 0; i < 4; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  initDb();

  if (req.method === 'POST') {
    const { code, uid } = req.body;

    if (!code || !uid) {
      return res.status(400).json({ error: 'Missing code or uid' });
    }

    const apiKey = process.env.OPENCODE_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: 'OPENCODE_API_KEY not configured' });
    }

    try {
      const authRef = db.doc(`auth_requests/${code}`);
      await authRef.set({
        status: 'verified',
        uid,
        apiKey,
        updatedAt: FieldValue.serverTimestamp(),
      }, { merge: true });

      return res.status(200).json({ success: true });
    } catch (error) {
      console.error('Verification error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  if (req.method === 'GET') {
    const { code } = req.query;

    if (!code || typeof code !== 'string') {
      const newCode = generateCode();
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

      await db.doc(`auth_requests/${newCode}`).set({
        code: newCode,
        status: 'pending',
        uid: null,
        apiKey: null,
        createdAt: FieldValue.serverTimestamp(),
        expiresAt: Timestamp.fromDate(expiresAt),
        TTL: expiresAt.getTime(),
      });

      return res.status(200).json({ code: newCode, expiresAt: expiresAt.toISOString() });
    }

    try {
      const authDoc = await db.doc(`auth_requests/${code}`).get();
      const data = authDoc.data();

      if (!data) {
        return res.status(404).json({ error: 'Code not found' });
      }

      if (data.status === 'verified' && data.uid && data.apiKey) {
        return res.status(200).json({
          status: 'verified',
          uid: data.uid,
          apiKey: data.apiKey,
        });
      }

      if (data.status === 'expired' || (data.TTL && data.TTL < Date.now())) {
        return res.status(200).json({ status: 'expired' });
      }

      return res.status(200).json({ status: 'pending' });
    } catch (error) {
      console.error('Poll error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}