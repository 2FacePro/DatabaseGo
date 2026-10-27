import { getApp, getApps, initializeApp } from 'firebase/app'
import { getDatabase } from 'firebase/database'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

let db = null

if (firebaseConfig.apiKey && firebaseConfig.databaseURL) {
  try {
    const app = getApps().length ? getApp() : initializeApp(firebaseConfig)
    db = getDatabase(app)
  } catch (err) {
    console.error('Inisialisasi Firebase gagal:', err)
  }
} else {
  console.warn('Konfigurasi Firebase (.env) belum lengkap. Data hanya disimpan di browser.')
}

export { db }
