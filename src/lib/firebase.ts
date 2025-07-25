
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
let auth: Auth; 

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

  // NOTE: Emulator connection logic is temporarily disabled to resolve connection issues.
  // The application will connect directly to the cloud instances of Firebase services.
  const useEmulators = false; // Set to false to force connection to cloud services
  
  if (process.env.NODE_ENV === 'development' && useEmulators) {
    // This block is currently disabled.
    console.log("Connecting to Firebase Emulators (currently disabled, connecting to cloud)...");
    // To re-enable, set useEmulators to true and ensure Firebase Emulators are running.
    // connectFirestoreEmulator(db, 'localhost', 8080);
    // connectAuthEmulator(auth, "http://localhost:9099");
  } else {
    console.log("Connecting to production Cloud Firestore and Firebase Auth.");
  }
}

export { db, auth, app };
