import AsyncStorage from "@react-native-async-storage/async-storage";

const PREFIJO = "vixxer_chat_";
const LISTA = "vixxer_lista_chats";
const TOPE = 50;

export async function leerCacheChat(otroId)
{
  try
  {
    const crudo = await AsyncStorage.getItem(PREFIJO + otroId);
    return crudo ? JSON.parse(crudo) : null;
  }
  catch (e)
  {
    return null;
  }
}

export async function guardarCacheChat(otroId, mensajes)
{
  try
  {
    const limpios = mensajes
      .filter((m) => !String(m.id).startsWith("local-"))
      .slice(-TOPE);
    await AsyncStorage.setItem(PREFIJO + otroId, JSON.stringify(limpios));
  }
  catch (e)
  {
  }
}

export async function borrarCacheChat(otroId)
{
  try
  {
    await AsyncStorage.removeItem(PREFIJO + otroId);
  }
  catch (e)
  {
  }
}

export async function leerCacheLista()
{
  try
  {
    const crudo = await AsyncStorage.getItem(LISTA);
    return crudo ? JSON.parse(crudo) : null;
  }
  catch (e)
  {
    return null;
  }
}

export async function guardarCacheLista(datos)
{
  try
  {
    await AsyncStorage.setItem(LISTA, JSON.stringify(datos));
  }
  catch (e)
  {
  }
}
