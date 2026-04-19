#!/usr/bin/env node

import { fetch } from 'undici';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';
import { createInterface } from 'readline';

const API_BASE = process.env.CIPHER_API_URL || 'http://localhost:3000/api';
const CREDENTIALS_FILE = join(homedir(), '.cipher', 'credentials');

function ensureDir() {
  mkdirSync(join(homedir(), '.cipher'), { recursive: true });
}

function saveCredentials(uid: string, apiKey: string): void {
  try {
    ensureDir();
    writeFileSync(CREDENTIALS_FILE, JSON.stringify({ uid, apiKey }), { flag: 'w' });
  } catch (e) {
    console.error('Failed to save credentials:', e);
  }
}

function readCredentials(): { uid: string; apiKey: string } | null {
  try {
    if (existsSync(CREDENTIALS_FILE)) {
      const data = JSON.parse(readFileSync(CREDENTIALS_FILE, 'utf-8'));
      return data.uid && data.apiKey ? data : null;
    }
  } catch (e) {
    // ignore
  }
  return null;
}

interface AuthResponse {
  code?: string;
  status?: string;
  uid?: string;
  apiKey?: string;
  expiresAt?: string;
}

async function generateCode(): Promise<string> {
  const response = await fetch(`${API_BASE}/auth/verify`, { method: 'GET' });
  const data: AuthResponse = await response.json();
  return data.code!;
}

async function pollVerification(code: string): Promise<{ uid: string; apiKey: string } | null> {
  let attempts = 0;
  while (true) {
    try {
      const response = await fetch(`${API_BASE}/auth/verify?code=${code}`, { method: 'GET' });
      const data: AuthResponse = await response.json();

      if (data.status === 'verified' && data.uid && data.apiKey) {
        return { uid: data.uid, apiKey: data.apiKey };
      }
      if (data.status === 'expired') {
        console.log('Code expired. Please regenerate.');
        return null;
      }
      
      attempts++;
      if (attempts % 3 === 0) {
        process.stdout.write('.');
      }
    } catch (error) {
      console.error('Polling error:', error);
    }
    await new Promise((r) => setTimeout(r, 2000));
  }
}

async function chat(message: string, apiKey: string): Promise<string> {
  const response = await fetch(`${API_BASE}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, history: [], apiKey }),
  });

  if (!response.ok) {
    throw new Error(`Chat error: ${response.status}`);
  }

  let fullContent = '';
  const reader = response.body?.getReader();
  if (!reader) throw new Error('No response body');

  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6);
        if (data === '[DONE]') break;
        fullContent += data;
        process.stdout.write(data);
      }
    }
  }
  console.log();
  return fullContent;
}

async function interactiveChat(apiKey: string) {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const history: { role: string; content: string }[] = [];

  console.log('Cipher Interactive Mode. Type "exit" to quit.\n');

  const ask = () => {
    rl.question('You: ', async (input) => {
      if (input.toLowerCase() === 'exit') {
        rl.close();
        return;
      }

      history.push({ role: 'user', content: input });
      
      try {
        const response = await fetch(`${API_BASE}/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: input, history, apiKey }),
        });

        if (!response.ok) {
          throw new Error(`Chat error: ${response.status}`);
        }

        const reader = response.body?.getReader();
        if (!reader) throw new Error('No response body');

        const decoder = new TextDecoder();
        let buffer = '';
        let assistantMsg = '';

        process.stdout.write('Cipher: ');
        
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') break;
              assistantMsg += data;
              process.stdout.write(data);
            }
          }
        }
        console.log();
        history.push({ role: 'assistant', content: assistantMsg });
      } catch (e) {
        console.error('Error:', e);
      }

      ask();
    });
  };

  ask();
}

async function main() {
  const args = process.argv.slice(2);
  const creds = readCredentials();

  if (args[0] === 'verify' || args[0] === 'v') {
    // Quick verify without web - just pass code as argument
    const code = args[1];
    if (!code) {
      console.log('Usage: cipher verify CIPH-XXXX');
      return;
    }
    const result = await pollVerification(code);
    if (result) {
      console.log('\n✅ Verified!');
      console.log(`UID: ${result.uid}`);
      saveCredentials(result.uid, result.apiKey);
      console.log('Credentials saved.\n');
    }
    return;
  }

  if (args[0] === 'setup' || args[0] === 'test') {
    console.log(`🔗 Testing connection to ${API_BASE}...`);
    try {
      const response = await fetch(`${API_BASE}/auth/verify`, { method: 'GET' });
      if (response.ok) {
        console.log('✅ Connection successful!\n');
        console.log('Now run: cipher login');
      } else {
        console.log('❌ Connection failed:', response.status);
      }
    } catch (e) {
      console.log('❌ Connection failed. Is the server running?');
    }
    return;
  }

  if (args[0] === 'login') {
    console.log('Generating verification code...');
    const code = await generateCode();
    console.log(`\n🔗 Your link code: ${code}`);
    console.log(`\n📱 Visit: http://localhost:5173/auth?code=${code}`);
    console.log('   Or check the web app and enter this code.');
    console.log('\n⏳ Waiting for verification... (Press Ctrl+C to cancel)\n');
    
    // Poll for 2 minutes max
    const result = await pollVerification(code);
    if (result) {
      console.log('\n✅ Verified!');
      console.log(`UID: ${result.uid}`);
      saveCredentials(result.uid, result.apiKey);
      console.log('Credentials saved.\n');
    } else {
      console.log('\n❌ Verification timed out. Try again.');
    }
    return;
  }

  if (args[0] === 'chat') {
    const apiKey = process.env.OPENCODE_API_KEY || creds?.apiKey;
    if (!apiKey) {
      console.error('❌ No API key. Run "cipher login" first.');
      process.exit(1);
    }
    const message = args.slice(1).join(' ');
    if (!message) {
      console.error('Usage: cipher chat <message>');
      process.exit(1);
    }
    await chat(message, apiKey);
    return;
  }

  if (args[0] === 'interactive' || args[0] === 'i') {
    const apiKey = process.env.OPENCODE_API_KEY || creds?.apiKey;
    if (!apiKey) {
      console.error('❌ No API key. Run "cipher login" first.');
      process.exit(1);
    }
    await interactiveChat(apiKey);
    return;
  }

  if (args[0] === 'whoami') {
    if (!creds) {
      console.log('Not logged in. Run "cipher login".');
    } else {
      console.log(`UID: ${creds.uid}`);
    }
    return;
  }

  if (args[0] === 'logout') {
    if (existsSync(CREDENTIALS_FILE)) {
      readFileSync(CREDENTIALS_FILE, 'utf-8');
      writeFileSync(CREDENTIALS_FILE, '', { flag: 'w' });
      console.log('Logged out.');
    } else {
      console.log('Not logged in.');
    }
    return;
  }

  console.log(`
🤖 Cipher CLI - Neural Synthesis

Usage:
  cipher setup        Test connection & get started
  cipher login        Link your account
  cipher chat <msg>   Send a message
  cipher i, interactive  Interactive chat mode
  cipher whoami       Show current user
  cipher logout      Log out
`);
}

main().catch(console.error);