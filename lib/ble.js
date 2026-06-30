import { Platform, PermissionsAndroid } from "react-native";

export const SERVICIO_UUID = "6f1d0001-5b3c-4a7e-9f21-7c9a1b2c3d4e";
export const CARACTERISTICA_UUID = "6f1d0002-5b3c-4a7e-9f21-7c9a1b2c3d4e";

let manager = null;

export function disponible()
{
  try
  {
    require("react-native-ble-plx");
    return true;
  }
  catch (e)
  {
    return false;
  }
}

function obtener()
{
  if (!manager)
  {
    const { BleManager } = require("react-native-ble-plx");
    manager = new BleManager();
  }
  return manager;
}

export async function pedirPermisos()
{
  if (Platform.OS !== "android")
  {
    return { ok: true, detalle: "no-android" };
  }
  const requeridos = [
    PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
    PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
    PermissionsAndroid.PERMISSIONS.BLUETOOTH_ADVERTISE,
    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
  ].filter(Boolean);
  const resultado = await PermissionsAndroid.requestMultiple(requeridos);
  const ok = Object.values(resultado).every((v) => v === PermissionsAndroid.RESULTS.GRANTED);
  return { ok, detalle: JSON.stringify(resultado) };
}

let anuncioMod = null;

function modAnuncio()
{
  if (!anuncioMod)
  {
    anuncioMod = require("../modules/ble-anuncio").default;
  }
  return anuncioMod;
}

export function anuncioDisponible()
{
  try
  {
    return !!modAnuncio();
  }
  catch (e)
  {
    return false;
  }
}

export function anunciar()
{
  try
  {
    const mod = modAnuncio();
    return mod ? mod.iniciar(SERVICIO_UUID) : false;
  }
  catch (e)
  {
    return false;
  }
}

export function detenerAnuncio()
{
  try
  {
    const mod = modAnuncio();
    return mod ? mod.detener() : false;
  }
  catch (e)
  {
    return false;
  }
}

export function escanear(alEncontrar, onEstado, soloVixxer = false)
{
  const m = obtener();
  const servicios = soloVixxer ? [SERVICIO_UUID] : null;
  const sub = m.onStateChange((estado) =>
  {
    onEstado && onEstado(estado);
    if (estado === "PoweredOn")
    {
      m.startDeviceScan(servicios, { allowDuplicates: false }, (error, device) =>
      {
        if (error)
        {
          onEstado && onEstado("error: " + error.message);
          return;
        }
        if (device)
        {
          alEncontrar(device);
        }
      });
    }
  }, true);
  return () =>
  {
    sub.remove();
    m.stopDeviceScan();
  };
}
