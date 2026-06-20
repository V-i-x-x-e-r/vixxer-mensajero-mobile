// lib/storage.js — LÓGICA (Paola)
// Guardado seguro en el dispositivo (cifrado del sistema) con expo-secure-store.
// Aquí viven el token de sesión y, sobre todo, la CLAVE PRIVADA: nunca sale del teléfono.

import * as SecureStore from "expo-secure-store";

// Claves de uso común (para no escribir strings sueltos por toda la app)
export const TOKEN = "token";
export const MI_ID = "mi_id";
export const CLAVE_PRIVADA = "clave_privada";
export const CLAVE_PUBLICA = "clave_publica";

export const guardar = (clave, valor) => SecureStore.setItemAsync(clave, valor);
export const leer = (clave) => SecureStore.getItemAsync(clave);
export const borrar = (clave) => SecureStore.deleteItemAsync(clave);

// Cerrar sesión: borra el token y el id (las claves de cifrado se conservan).
export async function cerrarSesion() {
  await borrar(TOKEN);
  await borrar(MI_ID);
}
