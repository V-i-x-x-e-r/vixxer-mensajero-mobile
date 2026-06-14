// Variables públicas del cliente. Deben llamarse EXPO_PUBLIC_* para que Expo las exponga.
// En celular físico contra backend local, usa la IP LAN de tu laptop (no localhost).
export const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';
export const SOCKET_URL = process.env.EXPO_PUBLIC_SOCKET_URL || API_URL;
