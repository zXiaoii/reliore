import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  Firestore,
} from 'firebase/firestore';

export interface FirebaseConfigParams {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

export const getActiveFirebaseConfig = (): FirebaseConfigParams => {
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem('media_ops_firebase_config_v1');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.projectId && parsed.apiKey) {
          return parsed;
        }
      }
    } catch {}
  }

  return {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
  };
};

export const isFirebaseConfigured = (): boolean => {
  const cfg = getActiveFirebaseConfig();
  return Boolean(
    cfg.projectId &&
      cfg.projectId.trim() !== '' &&
      cfg.apiKey &&
      cfg.apiKey.trim() !== ''
  );
};

let app: FirebaseApp | null = null;
let db: Firestore | null = null;

export const initFirestoreInstance = (): { app: FirebaseApp | null; db: Firestore | null } => {
  if (!isFirebaseConfigured()) {
    return { app: null, db: null };
  }

  const config = getActiveFirebaseConfig();

  try {
    const existingApps = getApps();
    app = existingApps.length > 0 ? getApp() : initializeApp(config);

    if (typeof window !== 'undefined') {
      try {
        db = initializeFirestore(app, {
          localCache: persistentLocalCache({
            tabManager: persistentMultipleTabManager(),
          }),
        });
      } catch {
        db = getFirestore(app);
      }
    } else {
      db = getFirestore(app);
    }
  } catch (error) {
    console.warn('Firebase init:', error);
  }

  return { app, db };
};

// Initial auto-initialization
const initialized = initFirestoreInstance();
app = initialized.app;
db = initialized.db;

export { app, db };
