#!/usr/bin/env node

const API_BASE = 'https://ciphertheai.vercel.app/api';
const CREDENTIALS_FILE = `${process.env.HOME || process.env.USERPROFILE}/.cipher/credentials`;
const fs = require('fs');
const path = require('path');

function ensureDir() {
  const dir = path.dirname(CREDENTIALS_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function saveCredentials(uid, apiKey) {
  try {
    ensureDir();
    fs.writeFileSync(CREDENTIALS_FILE, JSON.stringify({ uid, apiKey }));
    console.log('✅ Credentials saved.');
  } catch (e) {
    console.error('Failed to save credentials:', e.message);
  }
}

function readCredentials() {
  try {
    if (fs.existsSync(CREDENTIALS_FILE)) {
      const data = JSON.parse(fs.readFileSync(CREDENTIALS_FILE, 'utf-8'));
      return data.uid && data.apiKey ? data : null;
    }
  } catch (e) {}
  return null;
}

function generateCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = 'CIPH-';
  for (let i = 0; i < 4; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

async function pollVerification(code) {
  let attempts = 0;
  while (true) {
    try {
      const response = await fetch(`${API_BASE}/auth/verify?code=${code}`);
      const data = await response.json();

      if (data.status === 'verified' && data.uid && data.apiKey) {
        return { uid: data.uid, apiKey: data.apiKey };
      }
      if (data.status === 'expired') {
        console.log('\n❌ Code expired. Try again.');
        return null;
      }
      
      attempts++;
      if (attempts % 3 === 0) process.stdout.write('.');
    } catch (error) {
      console.error('\nPolling error:', error.message);
    }
    await new Promise(r => setTimeout(r, 2000));
  }
}

async function chat(message, apiKey) {
  const response = await fetch(`${API_BASE}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, history: [], apiKey }),
  });

  if (!response.ok) {
    throw new Error(`Chat error: ${response.status}`);
  }

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
        process.stdout.write(data);
      }
    }
  }
  console.log();
}

async function main() {
  const args = process.argv.slice(2);
  const creds = readCredentials();

  if (args[0] === 'login') {
    console.log('Generating verification code...');
    const code = generateCode();
    console.log(`\n🔗 Your link code: ${code}`);
    console.log(`\n📱 Visit: https://ciphertheai.vercel.app/auth?code=${code}`);
    console.log('\n⏳ Waiting for verification...\n');
    
    const result = await pollVerification(code);
    if (result) {
      console.log('\n✅ Verified!');
      console.log(`UID: ${result.uid}`);
      saveCredentials(result.uid, result.apiKey);
    }
    return;
  }

  if (args[0] === 'verify' || args[0] === 'v') {
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
    }
    return;
  }

  if (args[0] === 'chat' || args[0] === 'c') {
    const apiKey = creds?.apiKey;
    if (!apiKey) {
      console.log('❌ Not logged in. Run: cipher login');
      process.exit(1);
    }
    const message = args.slice(1).join(' ');
    if (!message) {
      console.log('Usage: cipher chat <message>');
      process.exit(1);
    }
    await chat(message, apiKey);
    return;
  }

  if (args[0] === 'whoami') {
    if (!creds) {
      console.log('Not logged in. Run: cipher login');
    } else {
      console.log(`UID: ${creds.uid}`);
    }
    return;
  }

  if (args[0] === 'logout') {
    if (fs.existsSync(CREDENTIALS_FILE)) {
      fs.unlinkSync(CREDENTIALS_FILE);
      console.log('Logged out.');
    } else {
      console.log('Not logged in.');
    }
    return;
  }

  console.log(`
🤖 Cipher CLI - Neural Synthesis

Usage:
  cipher login         Link your account
  cipher verify <code>  Verify a code
  cipher chat <msg>   Send a message
  cipher whoami       Show current user
  cipher logout       Log out
`);
}

main().catch(console.error);
