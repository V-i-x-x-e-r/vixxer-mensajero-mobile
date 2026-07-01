import AsyncStorage from "@react-native-async-storage/async-storage";

const PREFIJO = "vixxer_fijado_";

export async function leerFijado(convId)
{
  try
  {
    const crudo = await AsyncStorage.getItem(PREFIJO + convId);
    return crudo ? JSON.parse(crudo) : null;
  }
  catch (e)
  {
    return null;
  }
}

export async function fijarMensaje(convId, mensaje)
{
  try
  {
    const dato = { id: mensaje.id, texto: mensaje.texto, remitente_id: mensaje.remitente_id };
    await AsyncStorage.setItem(PREFIJO + convId, JSON.stringify(dato));
  }
  catch (e)
  {
  }
}

export async function quitarFijado(convId)
{
  try
  {
    await AsyncStorage.removeItem(PREFIJO + convId);
  }
  catch (e)
  {
  }
}
