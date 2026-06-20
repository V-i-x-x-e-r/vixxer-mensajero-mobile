// lib/config.js — LÓGICA (Paola)
// La dirección del backend vive en .env (variables EXPO_PUBLIC_*), nunca escrita
// a mano en el código. Así cambiamos entre backend local y Railway sin tocar código.

export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:8000";

// El socket es la MISMA app que la API (mismo host). Si no se define, usa la de la API.
export const SOCKET_URL = process.env.EXPO_PUBLIC_SOCKET_URL ?? API_URL;
