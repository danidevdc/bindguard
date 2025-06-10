
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

let app: FirebaseApp;
let db: Firestore;

// Check if all necessary Firebase config keys are present
const आवश्यकConfigKeys = ['apiKey', 'authDomain', 'projectId', 'appId'];
const faltantesKeys = आवश्यकConfigKeys.filter(key => !(firebaseConfig as any)[key]);

if (faltantesKeys.length > 0) {
  console.error(`Firebase initialization failed: Missing config values for ${faltantesKeys.join(', ')}. Check your .env.local file.`);
  // Si las claves críticas faltan, no intentamos inicializar.
  // db y app permanecerán undefined.
} else {
  if (!getApps().length) {
    try {
      app = initializeApp(firebaseConfig);
      console.log("Firebase initialized successfully.");
      db = getFirestore(app);
    } catch (error: any) {
      console.error("Firebase initialization error:", error.message, error.code);
      // db y app podrían quedar undefined si hay un error aquí.
    }
  } else {
    app = getApps()[0];
    console.log("Firebase app already initialized.");
    db = getFirestore(app); // Asegúrate de que db se asigne también en este caso.
  }
}

export { db, app };
