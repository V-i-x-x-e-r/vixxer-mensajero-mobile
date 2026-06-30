import { Platform, PermissionsAndroid } from "react-native";

export const SERVICIO_UUID = "6f1d0001-5b3c-4a7e-9f21-7c9a1b2c3d4e";
export const CARACTERISTICA_UUID = "6f1d0002-5b3c-4a7e-9f21-7c9a1b2c3d4e";

let manager = null;

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
    return true;
  }
  const requeridos = [
    PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
    PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
    PermissionsAndroid.PERMISSIONS.BLUETOOTH_ADVERTISE,
    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
  ].filter(Boolean);
  const resultado = await PermissionsAndroid.requestMultiple(requeridos);
  return Object.values(resultado).every((v) => v === PermissionsAndroid.RESULTS.GRANTED);
}

export function escanear(alEncontrar)
{
  const m = obtener();
  m.startDeviceScan(null, { allowDuplicates: false }, (error, device) =>
  {
    if (error || !device)
    {
      return;
    }
    alEncontrar(device);
  });
  return () => m.stopDeviceScan();
}
