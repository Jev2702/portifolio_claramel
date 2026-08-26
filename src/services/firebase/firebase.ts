import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { FIREBASE_PUBLIC_CONFIG } from '../../config/firebase-public'

export const firebaseApp = initializeApp({ ...FIREBASE_PUBLIC_CONFIG })
export const auth = getAuth(firebaseApp)
export const db = getFirestore(firebaseApp)
