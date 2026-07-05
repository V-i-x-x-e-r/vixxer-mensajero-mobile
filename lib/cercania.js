import AsyncStorage from "@react-native-async-storage/async-storage";
import { disponible, anuncioDisponible, pedirPermisos, anunciar, detenerAnuncio, escanear } from "./ble";
import { registrarPeer, olvidarPeers, peersConocidos, iniciarPuente, detenerPuente } from "./bleMensajeria";

const CLAVE = "vixxer_modo_cercania";

let corriendo = false;
let detenerEscaneo = null;
const oyentes = new Set();
const cercanos = new Map();

export function listaPeers()
{
  return [...cercanos.values()];
}

export function cercaniaSoportada()
{
  return disponible() && anuncioDisponible();
}

export async function modoGuardado()
{
  try
  {
    return (await AsyncStorage.getItem(CLAVE)) === "1";
  }
  catch (e)
  {
    return false;
  }
}

async function guardarModo(valor)
{
  try
  {
    if (valor)
    {
      await AsyncStorage.setItem(CLAVE, "1");
    }
    else
    {
      await AsyncStorage.removeItem(CLAVE);
    }
  }
  catch (e)
  {
  }
}

export function estadoCercania()
{
  return { activo: corriendo, cerca: peersConocidos() };
}

export function alCambio(cb)
{
  oyentes.add(cb);
  return () => oyentes.delete(cb);
}

function avisar()
{
  const estado = estadoCercania();
  for (const cb of oyentes)
  {
    cb(estado);
  }
}

export async function iniciarCercania()
{
  if (corriendo || !cercaniaSoportada())
  {
    return corriendo;
  }
  const permiso = await pedirPermisos();
  if (!permiso.ok)
  {
    return false;
  }
  if (!anunciar())
  {
    return false;
  }
  await iniciarPuente();
  detenerEscaneo = escanear((device) =>
  {
    registrarPeer(device.id);
    cercanos.set(device.id, { id: device.id, rssi: device.rssi ?? -70, visto: Date.now() });
    avisar();
  }, null, true);
  corriendo = true;
  avisar();
  return true;
}

export function detenerCercania()
{
  if (detenerEscaneo)
  {
    detenerEscaneo();
    detenerEscaneo = null;
  }
  detenerAnuncio();
  detenerPuente();
  olvidarPeers();
  cercanos.clear();
  corriendo = false;
  avisar();
}

export async function activarModo(valor)
{
  await guardarModo(valor);
  if (valor)
  {
    return iniciarCercania();
  }
  detenerCercania();
  return false;
}

export async function arrancarSiActivo()
{
  if (await modoGuardado())
  {
    await iniciarCercania();
  }
}
