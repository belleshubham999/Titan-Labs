import { useEffect, useMemo, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  type User,
} from 'firebase/auth';
import {
  addDoc,
  collection,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  type Timestamp,
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import JSZip from 'jszip';
import { AnimatePresence, motion } from 'framer-motion';
import { Mic, Sparkles, Download, Globe, LogOut } from 'lucide-react';
import { auth, db, functions, googleProvider } from './firebase';
import type { AppRecord, BuildTarget } from './types';

const targets: BuildTarget[] = ['web', 'android', 'ios', 'macos', 'windows', 'linux'];

type SpeechRecognitionConstructor = new () => {
  lang: string;
  interimResults: boolean;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  start: () => void;
};

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

function toIsoString(value: unknown): string {
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object' && 'toDate' in value) {
    return (value as Timestamp).toDate().toISOString();
  }
  return new Date().toISOString();
}

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');

  const [spokenInput, setSpokenInput] = useState('');
  const [prompt, setPrompt] = useState('');
  const [title, setTitle] = useState('');
  const [selectedTargets, setSelectedTargets] = useState<BuildTarget[]>(['web']);
  const [customDomain, setCustomDomain] = useState('');
  const [building, setBuilding] = useState(false);
  const [apps, setApps] = useState<AppRecord[]>([]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      setLoadingUser(false);
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (!user) {
      setApps([]);
      return;
    }

    const q = query(collection(db, 'users', user.uid, 'apps'), orderBy('updatedAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      setApps(
        snap.docs.map((doc) => {
          const data = doc.data() as Omit<AppRecord, 'id'> & {
            createdAt?: Timestamp | string;
            updatedAt?: Timestamp | string;
          };

          return {
            ...data,
            id: doc.id,
            createdAt: toIsoString(data.createdAt),
            updatedAt: toIsoString(data.updatedAt),
          };
        }),
      );
    });

    return unsub;
  }, [user]);

  const canBuild = useMemo(
    () =>
      Boolean(title.trim()) &&
      Boolean(spokenInput.trim() || prompt.trim()) &&
      selectedTargets.length > 0,
    [title, spokenInput, prompt, selectedTargets],
  );

  const handleEmailAuth = async () => {
    setAuthError('');
    try {
      if (authMode === 'signup') {
        await createUserWithEmailAndPassword(auth, email.trim(), password);
      } else {
        await signInWithEmailAndPassword(auth, email.trim(), password);
      }
    } catch (error) {
      setAuthError((error as Error).message);
    }
  };

  const startVoiceInput = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser yet.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = true;
    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map((result) => result[0].transcript)
        .join(' ');
      setSpokenInput(transcript);
    };
    recognition.start();
  };

  const toggleTarget = (target: BuildTarget) => {
    setSelectedTargets((prev) =>
      prev.includes(target) ? prev.filter((item) => item !== target) : [...prev, target],
    );
  };

  const buildApp = async () => {
    if (!user || !canBuild) return;
    setBuilding(true);

    try {
      const generateApp = httpsCallable(functions, 'generateAppBlueprint');
      const response = await generateApp({
        title,
        spokenInput,
        prompt,
        targets: selectedTargets,
        deployPath: `titans-lab.web.app/${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
        customDomain: customDomain.trim() || null,
      });

      const payload = response.data as Omit<AppRecord, 'id' | 'createdAt' | 'updatedAt'>;

      await addDoc(collection(db, 'users', user.uid, 'apps'), {
        ...payload,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      setPrompt('');
      setSpokenInput('');
      setTitle('');
      setCustomDomain('');
      setSelectedTargets(['web']);
    } catch (error) {
      alert((error as Error).message);
    } finally {
      setBuilding(false);
    }
  };

  const exportZip = async (appRecord: AppRecord) => {
    const zip = new JSZip();
    appRecord.files.forEach((file) => zip.file(file.path, file.content));
    zip.file(
      'README.md',
      `# ${appRecord.title}\n\nGenerated by Titans-Lab on ${new Date().toISOString()}\nDeploy path: ${appRecord.deployPath}`,
    );

    const blob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${appRecord.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.zip`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (loadingUser) {
    return <div className="screen-center">Loading Titans-Lab...</div>;
  }

  if (!user) {
    return (
      <main className="screen-center">
        <section className="glass card auth-card">
          <h1>Titans-Lab</h1>
          <p>Turn voice ideas into deployable apps, instantly.</p>
          <div className="auth-switch">
            <button onClick={() => setAuthMode('signup')} className={authMode === 'signup' ? 'active' : ''}>Sign up</button>
            <button onClick={() => setAuthMode('login')} className={authMode === 'login' ? 'active' : ''}>Login</button>
          </div>
          <input placeholder="Email" value={email} onChange={(event) => setEmail(event.target.value)} />
          <input placeholder="Password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
          {authError && <p className="error">{authError}</p>}
          <button onClick={handleEmailAuth}>{authMode === 'signup' ? 'Create account' : 'Sign in'}</button>
          <button
            onClick={async () => {
              try {
                await signInWithPopup(auth, googleProvider);
              } catch (error) {
                setAuthError((error as Error).message);
              }
            }}
          >
            Continue with Google
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="layout">
      <section className="glass card builder-card">
        <header>
          <h1>Titans-Lab Studio</h1>
          <button className="inline" onClick={() => signOut(auth)}>
            <LogOut size={16} /> Logout
          </button>
        </header>

        <label>App title</label>
        <input value={title} placeholder="AI Attendance Tracker" onChange={(event) => setTitle(event.target.value)} />

        <label>Speak your app idea</label>
        <div className="row">
          <textarea
            rows={3}
            value={spokenInput}
            onChange={(event) => setSpokenInput(event.target.value)}
            placeholder="Describe your app with voice or typing..."
          />
          <button className="icon-btn" onClick={startVoiceInput}>
            <Mic size={18} />
          </button>
        </div>

        <label>Extra instructions</label>
        <textarea
          rows={3}
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          placeholder="Stack, style, business logic, integrations..."
        />

        <label>Targets</label>
        <div className="chips">
          {targets.map((target) => (
            <button
              type="button"
              key={target}
              className={selectedTargets.includes(target) ? 'active' : ''}
              onClick={() => toggleTarget(target)}
            >
              {target}
            </button>
          ))}
        </div>

        <label>Custom domain (optional paid deployment)</label>
        <input
          value={customDomain}
          onChange={(event) => setCustomDomain(event.target.value)}
          placeholder="app.yourcompany.com"
        />

        <button className="primary" onClick={buildApp} disabled={!canBuild || building}>
          <Sparkles size={16} /> {building ? 'Building...' : 'Generate App Blueprint'}
        </button>
      </section>

      <section className="glass card list-card">
        <h2>Your generated apps</h2>
        <AnimatePresence>
          {apps.map((appRecord) => (
            <motion.article
              key={appRecord.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="app-item"
            >
              <h3>{appRecord.title}</h3>
              <p>{appRecord.prompt || appRecord.spokenInput}</p>
              <p className="meta">Status: {appRecord.status} · Deploy: {appRecord.deployPath}</p>
              {appRecord.customDomain && (
                <p className="meta">
                  <Globe size={14} /> Custom domain: {appRecord.customDomain}
                </p>
              )}
              <div className="row-inline">
                <button className="inline" onClick={() => exportZip(appRecord)}>
                  <Download size={15} /> Download ZIP
                </button>
              </div>
            </motion.article>
          ))}
        </AnimatePresence>
      </section>
    </main>
  );
}

export default App;
