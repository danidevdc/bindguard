import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getFirestore, type Firestore, connectFirestoreEmulator } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

function initializeFirebase() {
  const requiredConfigKeys: (keyof typeof firebaseConfig)[] = ['apiKey', 'authDomain', 'projectId', 'appId'];
  const missingKeys = requiredConfigKeys.filter(key => !firebaseConfig[key]);

  if (missingKeys.length > 0) {
    console.error(`Firebase initialization failed: Missing config values for ${missingKeys.join(', ')}. Please check your .env.local file.`);
    return { app: null, db: null };
  }

  let app: FirebaseApp;
  let db: Firestore;

  if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
    console.log("Firebase App Initialized.");
  } else {
    app = getApps()[0];
    console.log("Firebase App already exists. Getting instance.");
  }

  db = getFirestore(app);
  console.log("Firestore instance obtained.");

  // This block connects to the emulator if the environment variable is set.
  // This is a common pattern for local development to avoid issues with production data or expired security rules.
  if (process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === 'true') {
    try {
      // It's important to only connect to the emulator once.
      // The Firestore SDK manages the connection state internally.
      // We check a global flag to prevent re-connection attempts on hot reloads.
      if (!(global as any)._firestoreEmulatorConnected) {
        console.log("Connecting to Firebase Emulator at localhost:8080...");
        connectFirestoreEmulator(db, 'localhost', 8080);
        (global as any)._firestoreEmulatorConnected = true;
        console.log("Successfully connected to Firebase Emulator.");
      }
    } catch (e: any) {
        // This might happen if you try to connect after data has been read, which is a Firestore limitation.
        if (e.code === 'failed-precondition') {
            console.warn("Firestore Emulator already running or failed to connect. This is usually fine during hot-reloads.");
        } else {
            console.error("An error occurred while connecting to the Firebase Emulator:", e);
        }
    }
  }

  return { app, db };
}

const { app, db } = initializeFirebase();

export { db, app };
