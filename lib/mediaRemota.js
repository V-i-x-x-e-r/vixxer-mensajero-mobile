import { Platform } from "react-native";
import * as FileSystem from "expo-file-system/legacy";
import { encodeBase64, decodeBase64 } from "tweetnacl-util";
import * as api from "./api";
import { descifrarArchivo, abrirTrozoArchivo, medidaMarcoTrozo, MAGIA_TROZOS_B64 } from "./crypto";
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

function pausaCorta()
{
  return new Promise((listo) => setTimeout(listo, 0));
}

async function descifrarTrozosEnMemoria(cifradoBase64, media)
{
  const todos = decodeBase64(cifradoBase64);
  const piezas = [];
  let pos = 6;
  let indice = 0;
  while (pos + 6 <= todos.length)
  {
    const { len, salto } = medidaMarcoTrozo(todos.slice(pos, pos + 6));
    if (len <= 0 || pos + 6 + len > todos.length)
    {
      return null;
    }
    const abierto = abrirTrozoArchivo(encodeBase64(todos.slice(pos + 6, pos + 6 + len)), media.k, media.n, indice);
    if (!abierto)
    {
      return null;
    }
    piezas.push(abierto);
    pos += salto;
    indice++;
    if (indice % 3 === 0)
    {
      await pausaCorta();
    }
  }
  return piezas.join("");
}

async function descifrarDeArchivo(tmp, media, onProgreso)
{
  const b64 = { encoding: FileSystem.EncodingType.Base64 };
  const prefijo = await FileSystem.readAsStringAsync(tmp, { ...b64, position: 0, length: 6 });
  if (prefijo !== MAGIA_TROZOS_B64)
  {
    const cifrado = await FileSystem.readAsStringAsync(tmp, b64);
    return descifrarArchivo(cifrado, media.k, media.n);
  }
  const info = await FileSystem.getInfoAsync(tmp);
  const total = info.size || 0;
  const piezas = [];
  let pos = 6;
  let indice = 0;
  while (pos + 6 <= total)
  {
    const cabecera = decodeBase64(await FileSystem.readAsStringAsync(tmp, { ...b64, position: pos, length: 6 }));
    const { len, salto } = medidaMarcoTrozo(cabecera);
    if (len <= 0 || pos + 6 + len > total)
    {
      return null;
    }
    const sellado = await FileSystem.readAsStringAsync(tmp, { ...b64, position: pos + 6, length: len });
    const abierto = abrirTrozoArchivo(sellado, media.k, media.n, indice);
    if (!abierto)
    {
      return null;
    }
    piezas.push(abierto);
    pos += salto;
    indice++;
    if (onProgreso)
    {
      onProgreso(0.7 + 0.28 * Math.min(1, pos / total));
    }
    if (indice % 3 === 0)
    {
      await pausaCorta();
    }
  }
  return piezas.join("");
}

async function descargar(media, onProgreso)
{
  const { url } = await api.urlMedia(media.path);
  let claro;
  if (Platform.OS === "web")
  {
    const resp = await fetch(url);
    const cifrado = encodeBase64(new Uint8Array(await resp.arrayBuffer()));
    claro = cifrado.startsWith(MAGIA_TROZOS_B64)
      ? await descifrarTrozosEnMemoria(cifrado, media)
      : descifrarArchivo(cifrado, media.k, media.n);
  }
  else
  {
    const tmp = `${FileSystem.cacheDirectory}vxdl-${Date.now()}-${Math.random().toString(36).slice(2, 6)}.bin`;
    const bajada = FileSystem.createDownloadResumable(url, tmp, {}, (p) =>
    {
      if (onProgreso && p.totalBytesExpectedToWrite > 0)
      {
        onProgreso(Math.min(0.7, (p.totalBytesWritten / p.totalBytesExpectedToWrite) * 0.7));
      }
    });
    await bajada.downloadAsync();
    claro = await descifrarDeArchivo(tmp, media, onProgreso);
    FileSystem.deleteAsync(tmp, { idempotent: true }).catch(() => {});
  }
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
