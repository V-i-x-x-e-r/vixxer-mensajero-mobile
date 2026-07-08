import { Platform } from "react-native";
import * as FileSystem from "expo-file-system/legacy";
import { encodeBase64 } from "tweetnacl-util";
import * as api from "./api";
import { descifrarArchivo } from "./crypto";
import { leerCache, guardarCache, leerDisco, guardarDisco } from "./mediaCache";

const enCurso = new Map();

async function existe(uri)
{
  if (!uri)
  {
    return false;
  }
  if (uri.startsWith("data:"))
  {
    return true;
  }
  try
  {
    const info = await FileSystem.getInfoAsync(uri);
    return !!info.exists;
  }
  catch (e)
  {
    return false;
  }
}

export async function obtenerMedia(media, onProgreso)
{
  const inmediata = media.local || leerCache(media.path);
  if (inmediata && (Platform.OS === "web" || await existe(inmediata)))
  {
    return inmediata;
  }
  const guardada = await leerDisco(media.path, media.mime);
  if (guardada)
  {
    return guardada;
  }
  if (enCurso.has(media.path))
  {
    return enCurso.get(media.path);
  }
  const trabajo = descargar(media, onProgreso).finally(() => enCurso.delete(media.path));
  enCurso.set(media.path, trabajo);
  return trabajo;
}

async function descargar(media, onProgreso)
{
  const { url } = await api.urlMedia(media.path);
  let cifrado;
  if (Platform.OS === "web")
  {
    const resp = await fetch(url);
    cifrado = encodeBase64(new Uint8Array(await resp.arrayBuffer()));
  }
  else
  {
    const tmp = `${FileSystem.cacheDirectory}vxdl-${Date.now()}-${Math.random().toString(36).slice(2, 6)}.bin`;
    const bajada = FileSystem.createDownloadResumable(url, tmp, {}, (p) =>
    {
      if (onProgreso && p.totalBytesExpectedToWrite > 0)
      {
        onProgreso(Math.min(0.92, (p.totalBytesWritten / p.totalBytesExpectedToWrite) * 0.92));
      }
    });
    await bajada.downloadAsync();
    cifrado = await FileSystem.readAsStringAsync(tmp, { encoding: FileSystem.EncodingType.Base64 });
    FileSystem.deleteAsync(tmp, { idempotent: true }).catch(() => {});
  }
  const claro = descifrarArchivo(cifrado, media.k, media.n);
  if (!claro)
  {
    throw new Error("No se pudo descifrar el archivo");
  }
  if (onProgreso)
  {
    onProgreso(1);
  }
  const archivo = await guardarDisco(media.path, claro, media.mime);
  const final = archivo || `data:${media.mime};base64,${claro}`;
  guardarCache(media.path, final);
  return final;
}
