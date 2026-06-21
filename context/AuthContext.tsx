import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth } from "@/services/firebase";

interface AuthState {
  user: User | null;
  cargando: boolean;
}

const AuthContext = createContext<AuthState>({ user: null, cargando: true });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]         = useState<User | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    // Se dispara al iniciar la app y cada vez que cambia la sesión (login/logout).
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setCargando(false);
    });
    return unsub;
  }, []);

  return (
    <AuthContext.Provider value={{ user, cargando }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
