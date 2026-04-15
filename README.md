# Titans-Lab

Titans-Lab is a voice-first app builder inspired by emergent.sh: users speak an idea, the platform generates scaffold code, stores projects per user, and lets them export downloadable ZIP artifacts.

## Core capabilities
- Mandatory authentication (email/password + Google).
- Voice input with browser speech recognition.
- AI generation pipeline: Groq primary, Gemini fallback.
- Firestore project storage per user.
- ZIP export for generated apps.
- Deployment strategy UI for free `titans-lab.web.app/<appname>` and optional custom domain.
- Glassmorphism + typography-forward UI.

## Setup
1. Install deps:
   ```bash
   npm install
   npm --prefix functions install
   ```
2. Configure Firebase project:
   ```bash
   firebase use titan-lab
   firebase login
   ```
3. Set function secrets/params:
   ```bash
   firebase functions:secrets:set GROQ_API_KEY
   firebase functions:secrets:set GEMINI_API_KEY
   ```
4. Run locally:
   ```bash
   npm run dev
   firebase emulators:start
   ```

## Deploy
```bash
npm run build
npm --prefix functions run build
firebase deploy --only functions,hosting,firestore:rules
```

## Future upgrades included in product vision
- Real-time collaborative app editing.
- One-click generation for APK/EXE/DMG wrappers via cloud build queues.
- Built-in billing and template marketplace.
- Multilingual voice translation with locale-aware prompt engineering.
