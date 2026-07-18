import { Platform } from "react-native";
import * as FileSystem from "expo-file-system/legacy";
import { encodeBase64, decodeBase64 } from "tweetnacl-util";
import * as api from "./api";
import {
  descifrarArchivo,
  abrirTrozoArchivo,
  medidaMarcoTrozo,
  MAGIA_TROZOS_B64,
  TROZO_ARCHIVO_BYTES,
} from "./crypto";
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

function marcoSeguro(marco)
{
  return marco.cabeceraValida && marco.len >= 16 && marco.len <= TROZO_ARCHIVO_BYTES + 16;
}

function pesoEsperadoValido(media, total)
{
  if (media.peso === undefined || media.peso === null)
  {
    return true;
  }
  const esperado = Number(media.peso);
  return !Number.isFinite(esperado) || esperado < 0 || esperado === total;
}

function rellenoEsCero(bytes, inicio, cantidad)
{
  for (let i = 0; i < cantidad; i++)
  {
    if (bytes[inicio + i] !== 0)
    {
      return false;
    }
  }
  return true;
}

async function descifrarTrozosEnMemoria(cifradoBase64, media)
{
  const todos = decodeBase64(cifradoBase64);
  const piezas = [];
  let pos = 6;
  let indice = 0;
  let usaMarca = null;
  let encontroFinal = false;
  let totalClaro = 0;
  while (pos < todos.length)
  {
    if (pos + 6 > todos.length)
    {
      return null;
    }
    const marco = medidaMarcoTrozo(todos.slice(pos, pos + 6));
    if (!marcoSeguro(marco) || pos + marco.salto > todos.length)
    {
      return null;
    }
    if (usaMarca === null)
    {
      usaMarca = marco.marcado;
    }
    else if (usaMarca !== marco.marcado)
    {
      return null;
    }
    const abierto = abrirTrozoArchivo(
      encodeBase64(todos.slice(pos + 6, pos + 6 + marco.len)),
      media.k,
      media.n,
      indice,
      marco.marcado,
      marco.final,
    );
    if (!abierto)
    {
      return null;
    }
    const pesoTrozo = decodeBase64(abierto).length;
    if (marco.marcado && !marco.final && pesoTrozo !== TROZO_ARCHIVO_BYTES)
    {
      return null;
    }
    const relleno = marco.salto - 6 - marco.len;
    if (!rellenoEsCero(todos, pos + 6 + marco.len, relleno))
    {
      return null;
    }
    piezas.push(abierto);
    totalClaro += pesoTrozo;
    pos += marco.salto;
    indice++;
    if (marco.final)
    {
      if (pos !== todos.length)
      {
        return null;
      }
      encontroFinal = true;
      break;
    }
    if (indice % 3 === 0)
    {
      await pausaCorta();
    }
  }
  if (indice === 0 || pos !== todos.length || (usaMarca && !encontroFinal) || !pesoEsperadoValido(media, totalClaro))
  {
    return null;
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
  let usaMarca = null;
  let encontroFinal = false;
  let totalClaro = 0;
  while (pos < total)
  {
    if (pos + 6 > total)
    {
      return null;
    }
    const cabecera = decodeBase64(await FileSystem.readAsStringAsync(tmp, { ...b64, position: pos, length: 6 }));
    const marco = medidaMarcoTrozo(cabecera);
    if (!marcoSeguro(marco) || pos + marco.salto > total)
    {
      return null;
    }
    if (usaMarca === null)
    {
      usaMarca = marco.marcado;
    }
    else if (usaMarca !== marco.marcado)
    {
      return null;
    }
    const sellado = await FileSystem.readAsStringAsync(tmp, { ...b64, position: pos + 6, length: marco.len });
    const abierto = abrirTrozoArchivo(sellado, media.k, media.n, indice, marco.marcado, marco.final);
    if (!abierto)
    {
      return null;
    }
    const pesoTrozo = decodeBase64(abierto).length;
    if (marco.marcado && !marco.final && pesoTrozo !== TROZO_ARCHIVO_BYTES)
    {
      return null;
    }
    const relleno = marco.salto - 6 - marco.len;
    if (relleno > 0)
    {
      const crudoRelleno = await FileSystem.readAsStringAsync(tmp, {
        ...b64,
        position: pos + 6 + marco.len,
        length: relleno,
      });
      if (!rellenoEsCero(decodeBase64(crudoRelleno), 0, relleno))
      {
        return null;
      }
    }
    piezas.push(abierto);
    totalClaro += pesoTrozo;
    pos += marco.salto;
    indice++;
    if (marco.final)
    {
      if (pos !== total)
      {
        return null;
      }
      encontroFinal = true;
      break;
    }
    if (onProgreso)
    {
      onProgreso(0.7 + 0.28 * Math.min(1, pos / total));
    }
    if (indice % 3 === 0)
    {
      await pausaCorta();
    }
  }
  if (indice === 0 || pos !== total || (usaMarca && !encontroFinal) || !pesoEsperadoValido(media, totalClaro))
  {
    return null;
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
