import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';

// Resolve configuration from environment variables (for GitHub Actions/public production pipelines) 
// or fallback to the auto-generated workspace configuration json for AI Studio developer environment.
const metaEnv = (import.meta as any).env || {};

// Safely resolve the gitignored firebase-applet-config.json using a glob pattern to prevent
// compilation/bundling errors when built in pipelines (like GitHub Actions) where the file is absent.
const firebaseConfigGlob = (import.meta as any).glob('../firebase-applet-config.json', { eager: true });
const globKeys = Object.keys(firebaseConfigGlob);
const firebaseConfig = globKeys.length > 0 ? (firebaseConfigGlob[globKeys[0]]?.default || {}) : {};

const resolvedConfig = {
  apiKey: metaEnv.VITE_FIREBASE_API_KEY || firebaseConfig.apiKey || '',
  authDomain: metaEnv.VITE_FIREBASE_AUTH_DOMAIN || firebaseConfig.authDomain || '',
  projectId: metaEnv.VITE_FIREBASE_PROJECT_ID || firebaseConfig.projectId || '',
  appId: metaEnv.VITE_FIREBASE_APP_ID || firebaseConfig.appId || '',
  storageBucket: metaEnv.VITE_FIREBASE_STORAGE_BUCKET || firebaseConfig.storageBucket || '',
  messagingSenderId: metaEnv.VITE_FIREBASE_MESSAGING_SENDER_ID || firebaseConfig.messagingSenderId || '',
  firestoreDatabaseId: metaEnv.VITE_FIREBASE_DATABASE_ID || firebaseConfig.firestoreDatabaseId || (firebaseConfig as any).firestoreDatabaseId || '',
};

// Complete diagnostic report for debugging configuration mismatches or missing fields
export const configDiagnostics = {
  hasApiKey: !!resolvedConfig.apiKey,
  apiKeyValid: !!(resolvedConfig.apiKey && resolvedConfig.apiKey.startsWith('AIzaSy')),
  hasProjectId: !!resolvedConfig.projectId,
  hasAppId: !!resolvedConfig.appId,
  hasAuthDomain: !!resolvedConfig.authDomain,
  projectId: resolvedConfig.projectId || 'Missing (.env ya Settings UI me setup karein)',
  databaseId: resolvedConfig.firestoreDatabaseId || 'ai-studio-c9c4c65e-bdeb-4367-bdd3-1fb95afc7fb0 (Default AI Studio DB)',
  appId: resolvedConfig.appId || 'Missing (.env ya Settings UI me setup karein)',
  authDomain: resolvedConfig.authDomain || 'Missing (.env ya Settings UI me setup karein)',
  isUsingFallback: false
};

// Check if we have a robust and valid core configuration
const isValidConfig = !!(
  resolvedConfig.apiKey && 
  resolvedConfig.apiKey.startsWith('AIzaSy') && 
  resolvedConfig.projectId && 
  resolvedConfig.appId
);

configDiagnostics.isUsingFallback = !isValidConfig;

console.group("🔍 Firebase Config Diagnostics Report");
console.log("- API Key Present:", configDiagnostics.hasApiKey ? "✅ Yes" : "❌ No");
console.log("- API Key Valid (starts with AIzaSy):", configDiagnostics.apiKeyValid ? "✅ Yes" : "❌ No/Invalid");
console.log("- Project ID:", configDiagnostics.projectId);
console.log("- App ID:", configDiagnostics.appId);
console.log("- Auth Domain:", configDiagnostics.authDomain);
console.log("- Firestore Database ID:", configDiagnostics.databaseId);
console.log("- Running Mode:", isValidConfig ? "🚀 Production Firebase Client" : "⚠️ Standalone/Local Demo Fallback Client");
console.groupEnd();

let appInstance: any;
let dbInstance: any;
let authInstance: any;

if (isValidConfig) {
  try {
    appInstance = initializeApp(resolvedConfig);
    // AI Studio Starter Tier uses a custom Firestore Database ID: 'ai-studio-c9c4c65e-bdeb-4367-bdd3-1fb95afc7fb0'.
    // Standard Firebase snippet doesn't supply VITE_FIREBASE_DATABASE_ID in the UI copy box, so we automatically
    // fallback to our custom database ID unless the user overrides it on purpose (e.g., with '(default)').
    const dbId = resolvedConfig.firestoreDatabaseId || 'ai-studio-c9c4c65e-bdeb-4367-bdd3-1fb95afc7fb0';
    dbInstance = (dbId && dbId !== '(default)')
      ? getFirestore(appInstance, dbId)
      : getFirestore(appInstance);
    authInstance = getAuth(appInstance);
  } catch (err) {
    console.warn("Failed to initialize Firebase with environment config, using fallback client:", err);
    setupFallback();
  }
} else {
  console.info("Missing or incomplete Firebase configuration. Running watch app in demo fallback/offline mode.");
  setupFallback();
}

function setupFallback() {
  // Use a syntactically valid dummy config to allow high-level Firestore SDK methods (doc, collection, etc.)
  // to evaluate successfully without throwing fatal initialization exceptions.
  const fallbackConfig = {
    apiKey: "AIzaSyDUMMY_KEY_FOR_STANDALONE_BUILD_ONLY_XYZ",
    authDomain: "dummy-project.firebaseapp.com",
    projectId: "dummy-project",
    appId: "1:123456789012:web:1234567890abcdef123456",
  };
  try {
    appInstance = initializeApp(fallbackConfig);
    dbInstance = getFirestore(appInstance);
  } catch (e) {
    dbInstance = {} as any;
  }
  authInstance = { currentUser: null };
}

export const db = dbInstance; /* CRITICAL: The app will break without this line */
export const auth = authInstance;


// CRITICAL CONSTRAINT: Test connection on boot
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration.");
    }
  }
}
testConnection();

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
  const errMessage = error instanceof Error ? error.message : String(error);
  const errInfo: FirestoreErrorInfo = {
    error: errMessage,
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
  
  // Only throw if it is a permissions/rules issue.
  // This satisfies system diagnostics for rule fixes, but prevents standard network/offline errors from halting the UI.
  const isPermissionError = errMessage.toLowerCase().includes('permission') || 
                            errMessage.toLowerCase().includes('authorized') ||
                            errMessage.toLowerCase().includes('denied');
                            
  if (isPermissionError) {
    throw new Error(JSON.stringify(errInfo));
  }
}
