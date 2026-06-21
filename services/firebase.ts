import AsyncStorage from "@react-native-async-storage/async-storage";
import { getApp, getApps, initializeApp } from "firebase/app";
import * as fbAuth from "firebase/auth";
import {
  createUserWithEmailAndPassword,
  getAuth,
  initializeAuth,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  type Auth,
  type Persistence,
} from "firebase/auth";

// getReactNativePersistence vive en el bundle de React Native de firebase/auth
// (funciona en runtime), pero no está en los tipos por defecto. Lo tomamos con un cast.
const getReactNativePersistence = (
  fbAuth as unknown as {
    getReactNativePersistence: (s: unknown) => Persistence;
  }
).getReactNativePersistence;

/*
  ┌─────────────────────────────────────────────────────────────────────────┐
  │  PEGA AQUÍ la configuración de TU proyecto Firebase.                      │
  │  Consola Firebase → ⚙ Configuración del proyecto → "Tus apps" → SDK web. │
  │  Copia el objeto firebaseConfig completo y reemplaza los valores.         │
  └─────────────────────────────────────────────────────────────────────────┘
*/

const firebaseConfig = {
  apiKey: "AIzaSyDXwUJrkWAx3dQwf4jMMUsIlrFT-y3eSgE",
  authDomain: "dnatural-b73cc.firebaseapp.com",
  projectId: "dnatural-b73cc",
  storageBucket: "dnatural-b73cc.firebasestorage.app",
  messagingSenderId: "492987332385",
  appId: "1:492987332385:web:9f520bb0bf40755e003060",
  measurementId: "G-0CFG0NPDCX",
};

// Inicializar Firebase (sin Analytics: no aplica en React Native).
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// Persistencia con AsyncStorage → la sesión sobrevive aunque cierre la app.
let auth: Auth;
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch {
  // Si ya fue inicializado (recarga en caliente), reusar la instancia existente.
  auth = getAuth(app);
}
export { auth };

// ─── Helpers de autenticación ────────────────────────────────────────────────
export const registrarUsuario = (email: string, password: string) =>
  createUserWithEmailAndPassword(auth, email.trim(), password);

export const iniciarSesion = (email: string, password: string) =>
  signInWithEmailAndPassword(auth, email.trim(), password);

export const cerrarSesion = () => signOut(auth);

export const recuperarPassword = (email: string) =>
  sendPasswordResetEmail(auth, email.trim());

/** Traduce los códigos de error de Firebase a mensajes claros en español. */
export function mensajeError(code: string): string {
  switch (code) {
    case "auth/invalid-email":
      return "El correo no es válido.";
    case "auth/user-not-found":
      return "No existe una cuenta con ese correo.";
    case "auth/wrong-password":
      return "Contraseña incorrecta.";
    case "auth/invalid-credential":
      return "Correo o contraseña incorrectos.";
    case "auth/email-already-in-use":
      return "Ya existe una cuenta con ese correo.";
    case "auth/weak-password":
      return "La contraseña debe tener al menos 6 caracteres.";
    case "auth/too-many-requests":
      return "Demasiados intentos. Espera un momento.";
    case "auth/network-request-failed":
      return "Sin conexión a internet.";
    default:
      return "Ocurrió un error. Intenta de nuevo.";
  }
}
