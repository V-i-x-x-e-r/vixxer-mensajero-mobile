import AsyncStorage from "@react-native-async-storage/async-storage";

const CLAVE = "vixxer_respaldo_config";
const DEFECTO = { frecuencia: "nunca", hora: 3, destino: "nube", ultimo: null };

export const FRECUENCIAS = ["nunca", "diaria", "semanal"];
export const ETIQUETA_FRECUENCIA = { nunca: "Nunca", diaria: "Diaria", semanal: "Semanal" };

export async function leerConfig()
{
  try
  {
    const c = await AsyncStorage.getItem(CLAVE);
    return c ? { ...DEFECTO, ...JSON.parse(c) } : { ...DEFECTO };
  }
  catch (e)
  {
    return { ...DEFECTO };
  }
}

export async function guardarConfig(cfg)
{
  try
  {
    await AsyncStorage.setItem(CLAVE, JSON.stringify(cfg));
  }
  catch (e)
  {
  }
}

export async function marcarRespaldado()
{
  const c = await leerConfig();
  c.ultimo = new Date().toISOString();
  await guardarConfig(c);
}

export async function debeRespaldar()
{
  const c = await leerConfig();
  if (c.frecuencia === "nunca")
  {
    return false;
  }
  if (!c.ultimo)
  {
    return true;
  }
  const dias = c.frecuencia === "diaria" ? 1 : 7;
  return Date.now() - new Date(c.ultimo).getTime() > dias * 86400000;
}
