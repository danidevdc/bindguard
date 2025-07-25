import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getFirestore, type Firestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getAuth, type Auth, connectAuthEmulator } from 'firebase/auth'; // Import Auth

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
let auth: Auth; // Declare auth variable

// Check if all necessary Firebase config keys are present
const requiredConfigKeys: (keyof typeof firebaseConfig)[] = ['apiKey', 'authDomain', 'projectId', 'appId'];
const missingKeys = requiredConfigKeys.filter(key => !firebaseConfig[key]);

if (missingKeys.length > 0) {
  console.error(`Firebase initialization failed: Missing config values for ${missingKeys.join(', ')}. Please check your .env.local file or Firebase setup.`);
  // We don't initialize app, db, or auth if config is missing to prevent further errors.
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
  // Get Auth instance
  auth = getAuth(app);

  // Connect to Emulators if in development and the flag is set
  if (process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === 'true') {
    // Connect to Firestore Emulator
    if (!(global as any)._firestoreEmulatorConnected) {
      console.log("Connecting to Firebase Firestore Emulator at localhost:8080...");
      try {
        connectFirestoreEmulator(db, 'localhost', 8080);
        (global as any)._firestoreEmulatorConnected = true;
        console.log("Successfully connected to Firestore Emulator.");
      } catch (e: any) {
         if (e.code === 'failed-precondition') {
          console.warn("Firestore Emulator connection may have already been established.");
        } else {
          console.error("An error occurred while connecting to the Firestore Emulator:", e);
        }
      }
    }
    
    // Connect to Auth Emulator
    if (!(global as any)._authEmulatorConnected) {
       console.log("Connecting to Firebase Auth Emulator at http://localhost:9099...");
       try {
        connectAuthEmulator(auth, "http://localhost:9099");
        (global as any)._authEmulatorConnected = true;
        console.log("Successfully connected to Auth Emulator.");
       } catch (e: any) {
         if (e.code === 'auth/emulator-config-failed') {
          console.warn("Auth Emulator connection may have already been established.");
        } else {
          console.error("An error occurred while connecting to the Auth Emulator:", e);
        }
       }
    }
  } else {
    console.log("Connecting to production Cloud Firestore and Firebase Auth.");
  }
}

export { db, auth, app };
