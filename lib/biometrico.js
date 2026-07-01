import * as LocalAuthentication from "expo-local-authentication";
import { leer, guardar, borrar } from "./storage";

const CLAVE = "vixxer_biometrico";

export async function biometricoDisponible()
{
  try
  {
    const hay = await LocalAuthentication.hasHardwareAsync();
    const listo = await LocalAuthentication.isEnrolledAsync();
    return hay && listo;
  }
  catch (e)
  {
    return false;
  }
}

export async function biometricoActivo()
{
  return (await leer(CLAVE)) === "1";
}

export async function activarBiometrico(valor)
{
  if (valor)
  {
    await guardar(CLAVE, "1");
  }
  else
  {
    await borrar(CLAVE);
  }
}

export async function autenticar()
{
  try
  {
    const r = await LocalAuthentication.authenticateAsync({
      promptMessage: "Desbloquear Vixxer",
      cancelLabel: "Usar PIN",
      disableDeviceFallback: true,
    });
    return r.success;
  }
  catch (e)
  {
    return false;
  }
}
