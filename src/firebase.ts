/**
 * Firebase Client Setup
 * Configures Firebase Auth and Firestore based on local environment.
 */

import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut,
  onAuthStateChanged,
  User
} from "firebase/auth";
import { 
  initializeFirestore, 
  collection, 
  doc, 
  setDoc as firebaseSetDoc, 
  getDoc, 
  addDoc as firebaseAddDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  updateDoc as firebaseUpdateDoc,
  deleteDoc,
  Timestamp
} from "firebase/firestore";

// The config will be loaded dynamically using the keys provided in firebase-applet-config.json
const firebaseConfig = {
  apiKey: "AIzaSyBg7x9ZHzThkJuVP-bA65ds4hqUoqGgF7w",
  authDomain: "gen-lang-client-0047888286.firebaseapp.com",
  projectId: "gen-lang-client-0047888286",
  appId: "1:137229754302:web:8380950d149fa2d9b4e3ef",
  storageBucket: "gen-lang-client-0047888286.firebasestorage.app",
  messagingSenderId: "137229754302",
  projectIdWithDb: "ai-studio-345a1e78-dc13-4023-807b-bada121fd10f" // The Firestore database id customized
};

// Initialize Firebase with the correct databaseId
const app = initializeApp({
  apiKey: firebaseConfig.apiKey,
  authDomain: firebaseConfig.authDomain,
  projectId: firebaseConfig.projectId,
  storageBucket: firebaseConfig.storageBucket,
  messagingSenderId: firebaseConfig.messagingSenderId,
  appId: firebaseConfig.appId
});

// Configure Firestore with custom databaseId and ignore undefined properties
const db = initializeFirestore(app, {
  ignoreUndefinedProperties: true
}, "ai-studio-345a1e78-dc13-4023-807b-bada121fd10f");
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Helper to recursively strip out undefined values so standard setDoc/updateDoc never fails
function cleanUndefined(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) {
    return obj.map(item => cleanUndefined(item));
  }
  if (typeof obj === "object" && !(obj instanceof Timestamp) && !(obj instanceof Date)) {
    const cleaned: any = {};
    for (const key of Object.keys(obj)) {
      if (obj[key] !== undefined) {
        cleaned[key] = cleanUndefined(obj[key]);
      }
    }
    return cleaned;
  }
  return obj;
}

export const setDoc = (reference: any, data: any, options?: any) => {
  return firebaseSetDoc(reference, cleanUndefined(data), options);
};

export const addDoc = (reference: any, data: any) => {
  return firebaseAddDoc(reference, cleanUndefined(data));
};

export const updateDoc = (reference: any, data: any) => {
  return firebaseUpdateDoc(reference, cleanUndefined(data));
};

export { 
  app, 
  db, 
  auth, 
  googleProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  onSnapshot,
  deleteDoc,
  Timestamp
};
