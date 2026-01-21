#!/usr/bin/env node

/**
 * Firebase Configuration Diagnostic Script
 * 
 * Usage: node scripts/diagnose_firebase.js
 * 
 * This script checks:
 * 1. Backend Firebase configuration completeness
 * 2. Frontend Firebase configuration completeness
 * 3. Environment variable validity
 * 4. Common configuration mistakes
 */

const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const BLUE = '\x1b[34m';
const RESET = '\x1b[0m';

function log(color, prefix, message) {
  console.log(`${color}[${prefix}]${RESET} ${message}`);
}

function check(condition, title, successMsg, failureMsg) {
  if (condition) {
    log(GREEN, '✓', `${title}: ${successMsg}`);
    return true;
  } else {
    log(RED, '✗', `${title}: ${failureMsg}`);
    return false;
  }
}

console.log(`\n${BLUE}=== Firebase Configuration Diagnostic ===${RESET}\n`);

let allGood = true;

// === BACKEND DIAGNOSTICS ===
console.log(`${BLUE}1. Backend Configuration (.env)${RESET}\n`);

const backendEnvPath = path.join(__dirname, '../backend/.env');
const backendExamplePath = path.join(__dirname, '../backend/.env.example');

if (fs.existsSync(backendEnvPath)) {
  const backendEnv = dotenv.parse(fs.readFileSync(backendEnvPath, 'utf-8'));

  const projectId = backendEnv.FIREBASE_PROJECT_ID?.trim();
  const clientEmail = backendEnv.FIREBASE_CLIENT_EMAIL?.trim();
  let privateKey = backendEnv.FIREBASE_PRIVATE_KEY?.trim();
  const storageBucket = backendEnv.FIREBASE_STORAGE_BUCKET?.trim();

  // Sanitize private key
  if (privateKey) {
    if (privateKey.startsWith('"')) privateKey = privateKey.slice(1);
    if (privateKey.endsWith('"')) privateKey = privateKey.slice(0, -1);
    privateKey = privateKey.replace(/\\n/g, '\n');
  }

  allGood &= check(!!projectId, 'Project ID', projectId, 'NOT SET');
  allGood &= check(!!clientEmail, 'Client Email', clientEmail?.substring(0, 30) + '...', 'NOT SET');
  allGood &= check(
    !!privateKey && privateKey.includes('BEGIN PRIVATE KEY'),
    'Private Key',
    'Valid private key format',
    'NOT SET or invalid format'
  );
  allGood &= check(!!storageBucket, 'Storage Bucket', storageBucket, 'NOT SET');

  // Additional checks
  if (clientEmail && !clientEmail.includes('iam.gserviceaccount.com')) {
    log(YELLOW, '⚠', 'Client Email: Does not appear to be a service account email');
    allGood = false;
  }

  if (privateKey && !privateKey.includes('END PRIVATE KEY')) {
    log(YELLOW, '⚠', 'Private Key: Incomplete - missing END PRIVATE KEY');
    allGood = false;
  }
} else {
  log(RED, '✗', 'Backend .env file NOT FOUND at', backendEnvPath);
  if (fs.existsSync(backendExamplePath)) {
    log(YELLOW, 'ℹ', `Example template available at ${backendExamplePath}`);
    log(YELLOW, 'ℹ', 'Copy it and fill in your Firebase credentials');
  }
  allGood = false;
}

// === FRONTEND DIAGNOSTICS ===
console.log(`\n${BLUE}2. Frontend Configuration (.env.local)${RESET}\n`);

const frontendEnvPath = path.join(__dirname, '../web/frontend/.env.local');
const frontendExamplePath = path.join(__dirname, '../web/frontend/.env.local.example');

if (fs.existsSync(frontendEnvPath)) {
  const frontendEnv = dotenv.parse(fs.readFileSync(frontendEnvPath, 'utf-8'));

  const apiKey = frontendEnv.NEXT_PUBLIC_FIREBASE_API_KEY?.trim();
  const authDomain = frontendEnv.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN?.trim();
  const projectId = frontendEnv.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.trim();
  const storageBucket = frontendEnv.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET?.trim();
  const messagingSenderId = frontendEnv.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID?.trim();
  const appId = frontendEnv.NEXT_PUBLIC_FIREBASE_APP_ID?.trim();

  allGood &= check(!!apiKey, 'API Key', apiKey?.substring(0, 20) + '...', 'NOT SET');
  allGood &= check(!!authDomain, 'Auth Domain', authDomain, 'NOT SET');
  allGood &= check(!!projectId, 'Project ID', projectId, 'NOT SET');
  allGood &= check(!!storageBucket, 'Storage Bucket', storageBucket, 'NOT SET');
  allGood &= check(!!messagingSenderId, 'Messaging Sender ID', messagingSenderId, 'NOT SET');
  allGood &= check(!!appId, 'App ID', appId, 'NOT SET');

  // Verify prefix
  const requiredPrefix = 'NEXT_PUBLIC_';
  const unprefixedVars = Object.keys(frontendEnv).filter(
    key => key.startsWith('FIREBASE_') && !key.startsWith(requiredPrefix)
  );
  if (unprefixedVars.length > 0) {
    log(YELLOW, '⚠', 'Variables without NEXT_PUBLIC_ prefix:', unprefixedVars.join(', '));
    log(YELLOW, 'ℹ', 'Frontend env vars MUST start with NEXT_PUBLIC_ to be accessible in browser');
    allGood = false;
  }
} else {
  log(RED, '✗', 'Frontend .env.local file NOT FOUND at', frontendEnvPath);
  if (fs.existsSync(frontendExamplePath)) {
    log(YELLOW, 'ℹ', `Example template available at ${frontendExamplePath}`);
  }
  allGood = false;
}

// === ADVICE ===
console.log(`\n${BLUE}3. Next Steps${RESET}\n`);

if (!allGood) {
  log(YELLOW, 'ℹ', 'To fix Firebase configuration:');
  console.log(`
1. Go to ${BLUE}https://console.firebase.google.com/${RESET}
2. Select your project
3. For Backend:
   - Go to Project Settings → Service Accounts
   - Click "Generate New Private Key"
   - Copy the JSON values to backend/.env
4. For Frontend:
   - Go to Project Settings → General
   - Copy config object to web/frontend/.env.local with NEXT_PUBLIC_ prefix
5. Restart both servers:
   ${GREEN}cd backend && npm start${RESET}
   ${GREEN}cd web/frontend && npm run dev${RESET}
  `);
} else {
  log(GREEN, '✓', 'All Firebase configuration looks good!');
  console.log(`
Next steps:
1. Start the backend:  ${GREEN}cd backend && npm start${RESET}
2. Start the frontend: ${GREEN}cd web/frontend && npm run dev${RESET}
3. Test login at http://localhost:3000
  `);
}

console.log(`\n${BLUE}=== End Diagnostic ===${RESET}\n`);

process.exit(allGood ? 0 : 1);
