import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system/legacy";

function clave(chat)
{
  return `vixxer_borrador_${chat}`;
}

export async function leerBorrador(chat)
{
  try
  {
    return JSON.parse((await AsyncStorage.getItem(clave(chat))) || "{}");
  }
  catch (e)
  {
    return {};
  }
}

export async function guardarBorrador(chat, datos)
{
  try
  {
    const limpio = {};
    if (datos.texto)
    {
      limpio.texto = datos.texto;
    }
    if (datos.audio && datos.audio.uri)
    {
      limpio.audio = datos.audio;
    }
    if (Object.keys(limpio).length === 0)
    {
      await AsyncStorage.removeItem(clave(chat));
      return;
    }
    await AsyncStorage.setItem(clave(chat), JSON.stringify(limpio));
  }
  catch (e)
  {
  }
}

export async function limpiarBorrador(chat)
{
  try
  {
    await AsyncStorage.removeItem(clave(chat));
  }
  catch (e)
  {
  }
}

export async function guardarAudioBorrador(chat, uri)
{
  if (!uri)
  {
    return null;
  }
  try
  {
    const destino = `${FileSystem.documentDirectory}vixxer-audio-${String(chat).replace(/[^a-zA-Z0-9]/g, "_")}.m4a`;
    if (uri !== destino)
    {
      await FileSystem.copyAsync({ from: uri, to: destino });
    }
    return destino;
  }
  catch (e)
  {
    return uri;
  }
}
