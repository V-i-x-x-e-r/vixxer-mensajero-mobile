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
  if (corriendo)
  {
    return { ok: true };
  }
  if (!cercaniaSoportada())
  {
    return { ok: false, razon: "Tu app no trae el módulo Bluetooth (build viejo)" };
  }
  const permiso = await pedirPermisos();
  if (!permiso.ok)
  {
    return { ok: false, razon: "Faltan permisos de Bluetooth/ubicación" };
  }
  const anuncio = anunciar();
  if (!anuncio.ok)
  {
    const razones = {
      "bt-apagado": "Enciende el Bluetooth e inténtalo de nuevo",
      "sin-bluetooth": "Este teléfono no tiene Bluetooth disponible",
      "sin-anunciante": "Enciende el Bluetooth (o tu teléfono no soporta anunciar BLE)",
      "sin-modulo": "Tu app no trae el módulo Bluetooth (build viejo)",
      bluetooth: "Enciende el Bluetooth e inténtalo de nuevo",
    };
    return { ok: false, razon: razones[anuncio.razon] || anuncio.razon };
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
  return { ok: true };
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
  return { ok: false };
}

export async function arrancarSiActivo()
{
  if (await modoGuardado())
  {
    await iniciarCercania();
  }
}
