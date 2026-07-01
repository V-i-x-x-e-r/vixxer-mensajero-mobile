import AsyncStorage from "@react-native-async-storage/async-storage";

const CLAVE = "vixxer_alias";

export async function leerAlias()
{
  try
  {
    const crudo = await AsyncStorage.getItem(CLAVE);
    return crudo ? JSON.parse(crudo) : {};
  }
  catch (e)
  {
    return {};
  }
}

export async function aliasDe(convId)
{
  const mapa = await leerAlias();
  return mapa[convId] || null;
}

export async function guardarAlias(convId, nombre)
{
  try
  {
    const mapa = await leerAlias();
    const limpio = (nombre || "").trim();
    if (limpio)
    {
      mapa[convId] = limpio;
    }
    else
    {
      delete mapa[convId];
    }
    await AsyncStorage.setItem(CLAVE, JSON.stringify(mapa));
  }
  catch (e)
  {
  }
}
