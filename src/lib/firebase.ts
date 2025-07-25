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

let app: FirebaseApp;
let db: Firestore;

// Check if all necessary Firebase config keys are present
const requiredConfigKeys: (keyof typeof firebaseConfig)[] = ['apiKey', 'authDomain', 'projectId', 'appId'];
const missingKeys = requiredConfigKeys.filter(key => !firebaseConfig[key]);

if (missingKeys.length > 0) {
  console.error(`Firebase initialization failed: Missing config values for ${missingKeys.join(', ')}. Please check your .env.local file or Firebase setup.`);
  // We don't initialize app or db if config is missing to prevent further errors.
} else {
  // Initialize Firebase App
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
    console.log("Firebase App Initialized successfully.");
  } else {
    app = getApps()[0];
    console.log("Firebase App already initialized. Getting instance.");
  }

  // Get Firestore instance
  db = getFirestore(app);

  // Connect to Firestore Emulator if in development and the flag is set
  // This check prevents re-connecting on hot reloads
  if (process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === 'true') {
    if (!(global as any)._firestoreEmulatorConnected) {
      console.log("Connecting to Firebase Emulator at localhost:8080...");
      try {
        connectFirestoreEmulator(db, 'localhost', 8080);
        (global as any)._firestoreEmulatorConnected = true;
        console.log("Successfully connected to Firestore Emulator.");
      } catch (e: any) {
        if (e.code === 'failed-precondition') {
          console.warn("Firestore Emulator connection failed (failed-precondition). This can happen on hot reloads if the connection is attempted after operations have started. The app should still work if already connected.");
        } else {
          console.error("An error occurred while connecting to the Firebase Emulator:", e);
        }
      }
    }
  } else {
    console.log("Connecting to production Cloud Firestore.");
  }
}

export { db, app };
