
import {
  getApps,
  initializeApp,
  type FirebaseApp,
  type FirebaseOptions,
} from 'firebase/app';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getAuth, type Auth } from 'firebase/auth';

const firebaseConfig: FirebaseOptions = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

const requiredConfigKeys: Array<keyof FirebaseOptions> = [
  'apiKey',
  'authDomain',
  'projectId',
  'appId',
];

const hasExplicitConfig = requiredConfigKeys.every((key) => firebaseConfig[key]);

function initializeFirebaseApp(): FirebaseApp {
  const existingApp = getApps()[0];
  if (existingApp) return existingApp;

  try {
    // App Hosting generates Firebase defaults from FIREBASE_WEBAPP_CONFIG.
    return hasExplicitConfig ? initializeApp(firebaseConfig) : initializeApp();
  } catch {
    const missingKeys = requiredConfigKeys.filter((key) => !firebaseConfig[key]);
    throw new Error(
      `Firebase is not configured. Add the required values to .env.local (${missingKeys.join(', ')}) or configure a Firebase App Hosting web app.`
    );
  }
}

const app: FirebaseApp = initializeFirebaseApp();
const db: Firestore = getFirestore(app);
const auth: Auth = getAuth(app);

export { db, auth, app };
