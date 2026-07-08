import { Platform, PermissionsAndroid } from "react-native";
import { encodeBase64, decodeUTF8 } from "tweetnacl-util";

export const SERVICIO_UUID = "6f1d0001-5b3c-4a7e-9f21-7c9a1b2c3d4e";
export const CARACTERISTICA_UUID = "6f1d0002-5b3c-4a7e-9f21-7c9a1b2c3d4e";

const TROZO = 180;

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
  const moderno = Number(Platform.Version) >= 31;
  const requeridos = (moderno
    ? [
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_ADVERTISE,
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      ]
    : [PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION]
  ).filter(Boolean);
  const resultado = await PermissionsAndroid.requestMultiple(requeridos);
  const nombres = {
    "android.permission.BLUETOOTH_SCAN": "Dispositivos cercanos",
    "android.permission.BLUETOOTH_CONNECT": "Dispositivos cercanos",
    "android.permission.BLUETOOTH_ADVERTISE": "Dispositivos cercanos",
    "android.permission.ACCESS_FINE_LOCATION": "Ubicación",
  };
  const negados = [...new Set(Object.entries(resultado)
    .filter(([, v]) => v !== PermissionsAndroid.RESULTS.GRANTED)
    .map(([k]) => nombres[k] || k))];
  return { ok: negados.length === 0, negados, detalle: JSON.stringify(resultado) };
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
    if (!mod)
    {
      return { ok: false, razon: "sin-modulo" };
    }
    const r = mod.iniciar(SERVICIO_UUID, CARACTERISTICA_UUID);
    if (r === true || r === "ok")
    {
      return { ok: true };
    }
    return { ok: false, razon: typeof r === "string" ? r : "bluetooth" };
  }
  catch (e)
  {
    return { ok: false, razon: e?.message || "error" };
  }
}

export function alRecibir(cb)
{
  try
  {
    const mod = modAnuncio();
    if (!mod)
    {
      return () => {};
    }
    const sub = mod.addListener("onMensaje", (e) => cb(e.texto));
    return () => sub.remove();
  }
  catch (e)
  {
    return () => {};
  }
}

export async function conectarYEnviar(deviceId, texto)
{
  const m = obtener();
  let device = null;
  try
  {
    device = await m.connectToDevice(deviceId, { requestMTU: 512 });
    await device.discoverAllServicesAndCharacteristics();
    const bytes = decodeUTF8(texto + "\n");
    for (let i = 0; i < bytes.length; i += TROZO)
    {
      const b64 = encodeBase64(bytes.slice(i, i + TROZO));
      await device.writeCharacteristicWithResponseForService(SERVICIO_UUID, CARACTERISTICA_UUID, b64);
    }
    return true;
  }
  catch (e)
  {
    return false;
  }
  finally
  {
    try
    {
      if (device)
      {
        await m.cancelDeviceConnection(deviceId);
      }
    }
    catch (e)
    {
    }
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
