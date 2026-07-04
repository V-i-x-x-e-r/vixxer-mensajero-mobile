import AsyncStorage from "@react-native-async-storage/async-storage";

const CLAVE = "vixxer_grupos_visto";

export async function leerVistos()
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

export async function marcarVisto(grupoId)
{
  try
  {
    const mapa = await leerVistos();
    mapa[grupoId] = new Date().toISOString();
    await AsyncStorage.setItem(CLAVE, JSON.stringify(mapa));
  }
  catch (e)
  {
  }
}
