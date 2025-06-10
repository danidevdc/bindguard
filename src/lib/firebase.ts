
import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getFirestore, type Firestore } from 'firebase/firestore';

// Ensure environment variables are being loaded. You might need to restart your dev server
// if you've recently created or modified the .env.local file.
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID, // Optional
};

let app: FirebaseApp | undefined = undefined;
let db: Firestore | undefined = undefined;

// Check if all critical Firebase config keys are present
const requiredConfigKeys = ['apiKey', 'authDomain', 'projectId', 'appId'];
const missingKeys = requiredConfigKeys.filter(key => !(firebaseConfig as any)[key]);

if (missingKeys.length > 0) {
  console.error(`Firebase initialization failed: Missing config values for ${missingKeys.join(', ')}. Please check your .env.local file.`);
  // If critical keys are missing, we do not attempt to initialize.
  // db and app will remain undefined.
} else {
  if (!getApps().length) {
    try {
      app = initializeApp(firebaseConfig);
      console.log("Firebase app initialized successfully.");
      db = getFirestore(app);
      console.log("Firestore instance initialized successfully.");
    } catch (error: any) {
      console.error("Firebase initialization error:", error.message, error.code);
      // app and db might remain undefined if an error occurs here.
    }
  } else {
    app = getApps()[0];
    console.log("Firebase app already initialized.");
    try {
      db = getFirestore(app); // Ensure db is assigned in this case as well.
      console.log("Firestore instance obtained successfully for already initialized app.");
    } catch (error: any) {
      console.error("Firestore instance initialization error for existing app:", error.message, error.code);
      // db might remain undefined.
    }
  }
}

export { db, app };
