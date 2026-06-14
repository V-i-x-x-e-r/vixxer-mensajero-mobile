// Estado global de sesión: token, usuario y claves E2EE.
// Maneja register/login/logout y la conexión del socket.
import { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../services/api.js';
import { generateKeyPair } from '../crypto/e2ee.js';
import { connectSocket, disconnectSocket } from '../services/socket.js';
import * as secure from '../storage/secure.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Al abrir la app: si hay token guardado, restaura la sesión.
  useEffect(() => {
    (async () => {
      try {
        const token = await secure.getToken();
        if (token) {
          const { user: me } = await api.me();
          setUser(me);
          connectSocket(token);
        }
      } catch {
        await secure.clearAll();
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function register(username, password) {
    // 1. Generar claves E2EE en el dispositivo.
    const keyPair = generateKeyPair();
    // 2. Registrar enviando solo la clave PÚBLICA.
    const { token, user: created } = await api.register({
      username,
      password,
      publicKey: keyPair.publicKey,
    });
    // 3. Guardar token y claves de forma segura. La privada nunca sale de aquí.
    await secure.saveToken(token);
    await secure.saveKeyPair(keyPair);
    setUser(created);
    connectSocket(token);
  }

  async function login(username, password) {
    const { token, user: logged } = await api.login({ username, password });
    await secure.saveToken(token);
    setUser(logged);
    connectSocket(token);
    // Nota: si la app se reinstaló, la clave privada se perdió (trade-off del MVP).
  }

  async function logout() {
    disconnectSocket();
    await secure.clearAll();
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, register, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
