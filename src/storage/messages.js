// Caché local de mensajes YA descifrados, por conversación (AsyncStorage).
// Permite ver el historial offline. El texto plano solo vive en el dispositivo.
import AsyncStorage from '@react-native-async-storage/async-storage';

const key = (peerId) => `vixxer.chat.${peerId}`;

export async function loadMessages(peerId) {
  const raw = await AsyncStorage.getItem(key(peerId));
  return raw ? JSON.parse(raw) : [];
}

export async function appendMessage(peerId, message) {
  const list = await loadMessages(peerId);
  list.push(message);
  await AsyncStorage.setItem(key(peerId), JSON.stringify(list));
  return list;
}

// Caché de claves públicas de otros usuarios (no es sensible: son públicas).
const PUBKEY_PREFIX = 'vixxer.pubkey.';
export const cachePublicKey = (userId, pk) =>
  AsyncStorage.setItem(PUBKEY_PREFIX + userId, pk);
export const getCachedPublicKey = (userId) =>
  AsyncStorage.getItem(PUBKEY_PREFIX + userId);
