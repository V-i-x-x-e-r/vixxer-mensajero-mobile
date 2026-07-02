import { leer, CLAVE_PRIVADA } from "./storage";
import { crearRespaldo, generarCodigoRecuperacion } from "./crypto";
import * as api from "./api";
import { marcarRespaldado } from "./respaldoConfig";

export async function hacerRespaldo()
{
  const secreta = await leer(CLAVE_PRIVADA);
  if (!secreta)
  {
    return null;
  }
  const codigo = generarCodigoRecuperacion();
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
