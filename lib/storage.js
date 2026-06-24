// lib/storage.js — LÓGICA (Paola)
// Guardado seguro en el dispositivo (cifrado del sistema) con expo-secure-store.
// Aquí viven el token de sesión y, sobre todo, la CLAVE PRIVADA: nunca sale del teléfono.

// lib/storage.js
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// Detectamos si estamos en web (plataforma web, no móvil)
const isWeb = Platform.OS === 'web';

export const TOKEN = 'vixxer_token';
export const MI_ID = 'vixxer_mi_id';

// Guardar: en web usa localStorage, en móvil SecureStore
export const guardar = async (clave, valor) => {
  if (isWeb) {
    localStorage.setItem(clave, valor);
  } else {
    await SecureStore.setItemAsync(clave, valor);
  }
};

// Leer: igual
export const leer = async (clave) => {
  if (isWeb) {
    return localStorage.getItem(clave);
  } else {
    return await SecureStore.getItemAsync(clave);
  }
};

// Borrar: igual
export const borrar = async (clave) => {
  if (isWeb) {
    localStorage.removeItem(clave);
  } else {
    await SecureStore.deleteItemAsync(clave);
  }
};

// Para sesión persistente (usada en index.jsx)
export const cerrarSesion = async () => {
  await borrar(TOKEN);
  await borrar(MI_ID);
};
