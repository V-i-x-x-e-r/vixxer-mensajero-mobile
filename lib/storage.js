import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const isWeb = Platform.OS === "web";

export const TOKEN = "vixxer_token";
export const MI_ID = "vixxer_mi_id";
export const CLAVE_PRIVADA = "vixxer_clave_privada";
export const CLAVE_PUBLICA = "vixxer_clave_publica";
export const CLAVE_FIRMA_PRIVADA = "vixxer_clave_firma_privada";
export const CLAVE_FIRMA_PUBLICA = "vixxer_clave_firma_publica";

export const guardar = async (clave, valor) =>
{
  if (isWeb)
  {
    localStorage.setItem(clave, valor);
  }
  else
  {
    await SecureStore.setItemAsync(clave, valor);
  }
};

export const leer = async (clave) =>
{
  if (isWeb)
  {
    return localStorage.getItem(clave);
  }
  return await SecureStore.getItemAsync(clave);
};

export const borrar = async (clave) =>
{
  if (isWeb)
  {
    localStorage.removeItem(clave);
  }
  else
  {
    await SecureStore.deleteItemAsync(clave);
  }
};

export const cerrarSesion = async () =>
{
  await borrar(TOKEN);
  await borrar(MI_ID);
};
