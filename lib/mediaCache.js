import { Platform } from "react-native";
import * as FileSystem from "expo-file-system/legacy";

const cache = new Map();
const esWeb = Platform.OS === "web";

function extension(mime)
{
  if (!mime)
  {
    return "bin";
  }
  if (mime.includes("video"))
  {
    return "mp4";
  }
  if (mime.includes("audio"))
  {
    return "m4a";
  }
  if (mime.includes("png"))
  {
    return "png";
  }
  return "jpg";
}

function archivoDe(path, mime)
{
  const clave = String(path).replace(/[^a-zA-Z0-9]/g, "_");
  return `${FileSystem.cacheDirectory}vxmedia-${clave}.${extension(mime)}`;
}

export function leerCache(path)
{
  return cache.get(path);
}

export function guardarCache(path, valor)
{
  cache.set(path, valor);
}

export async function leerDisco(path, mime)
{
  if (esWeb)
  {
    return null;
  }
  try
  {
    const uri = archivoDe(path, mime);
    const info = await FileSystem.getInfoAsync(uri);
    if (info.exists)
    {
      cache.set(path, uri);
      return uri;
    }
  }
  catch (e)
  {
  }
  return null;
}

export async function guardarDisco(path, base64, mime)
{
  if (esWeb)
  {
    return null;
  }
  try
  {
    const uri = archivoDe(path, mime);
    await FileSystem.writeAsStringAsync(uri, base64, { encoding: FileSystem.EncodingType.Base64 });
    cache.set(path, uri);
    return uri;
  }
  catch (e)
  {
    return null;
  }
}
