// Almacenamiento SEGURO (Keychain/Keystore del sistema) para lo sensible:
// el token de sesión y la clave privada E2EE. Nunca en AsyncStorage plano.
import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'vixxer.token';
const SECRET_KEY = 'vixxer.secretKey';
const PUBLIC_KEY = 'vixxer.publicKey';

export const saveToken = (t) => SecureStore.setItemAsync(TOKEN_KEY, t);
export const getToken = () => SecureStore.getItemAsync(TOKEN_KEY);

export const saveKeyPair = async ({ publicKey, secretKey }) => {
  await SecureStore.setItemAsync(SECRET_KEY, secretKey);
  await SecureStore.setItemAsync(PUBLIC_KEY, publicKey);
};
export const getSecretKey = () => SecureStore.getItemAsync(SECRET_KEY);
export const getPublicKey = () => SecureStore.getItemAsync(PUBLIC_KEY);

export const clearAll = async () => {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
  await SecureStore.deleteItemAsync(SECRET_KEY);
  await SecureStore.deleteItemAsync(PUBLIC_KEY);
};
