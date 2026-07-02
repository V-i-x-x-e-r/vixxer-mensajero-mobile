import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import * as DocumentPicker from "expo-document-picker";
import { leer, guardar, CLAVE_PRIVADA, CODIGO_RECUP } from "./storage";
import { crearRespaldo, generarCodigoRecuperacion } from "./crypto";
import * as api from "./api";
import { marcarRespaldado } from "./respaldoConfig";

async function obtenerCodigo()
{
  let codigo = await leer(CODIGO_RECUP);
  if (!codigo)
  {
    codigo = generarCodigoRecuperacion();
    await guardar(CODIGO_RECUP, codigo);
  }
  return codigo;
}

export async function hacerRespaldo()
{
  const secreta = await leer(CLAVE_PRIVADA);
  if (!secreta)
  {
    return null;
  }
  const codigo = await obtenerCodigo();
  const respaldo = crearRespaldo(secreta, codigo);
  await api.subirRespaldo(respaldo);
  await marcarRespaldado();
  return codigo;
}

export async function hayRespaldoEnNube()
{
  try
  {
    const r = await api.obtenerRespaldo();
    return !!(r && r.cifrado);
  }
  catch (e)
  {
    return false;
  }
}

export async function exportarRespaldoLocal()
{
  const secreta = await leer(CLAVE_PRIVADA);
  if (!secreta)
  {
    return null;
  }
  const codigo = await obtenerCodigo();
  const respaldo = crearRespaldo(secreta, codigo);
  const uri = `${FileSystem.documentDirectory}vixxer-respaldo.json`;
  await FileSystem.writeAsStringAsync(uri, JSON.stringify({ v: 1, ...respaldo }));
  await marcarRespaldado();
  if (await Sharing.isAvailableAsync())
  {
    await Sharing.shareAsync(uri, { mimeType: "application/json", dialogTitle: "Guardar respaldo de Vixxer" });
  }
  return codigo;
}

export async function importarRespaldoArchivo()
{
  const r = await DocumentPicker.getDocumentAsync({ type: "application/json", copyToCacheDirectory: true });
  if (r.canceled || !r.assets || !r.assets[0])
  {
    return null;
  }
  const contenido = await FileSystem.readAsStringAsync(r.assets[0].uri);
  const obj = JSON.parse(contenido);
  if (!obj || !obj.cifrado || !obj.nonce || !obj.salt)
  {
    return null;
  }
  return { cifrado: obj.cifrado, nonce: obj.nonce, salt: obj.salt };
}
