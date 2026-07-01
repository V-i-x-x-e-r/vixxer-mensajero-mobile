import AsyncStorage from "@react-native-async-storage/async-storage";

const PREFIJO = "vixxer_fijado_";

export async function leerFijados(convId)
{
  try
  {
    const crudo = await AsyncStorage.getItem(PREFIJO + convId);
    if (!crudo)
    {
      return [];
    }
    const valor = JSON.parse(crudo);
    if (Array.isArray(valor))
    {
      return valor;
    }
    return valor && valor.id ? [valor] : [];
  }
  catch (e)
  {
    return [];
  }
}

async function escribir(convId, lista)
{
  try
  {
    if (lista.length > 0)
    {
      await AsyncStorage.setItem(PREFIJO + convId, JSON.stringify(lista));
    }
    else
    {
      await AsyncStorage.removeItem(PREFIJO + convId);
    }
  }
  catch (e)
  {
  }
}

export async function alternarFijado(convId, mensaje)
{
  const lista = await leerFijados(convId);
  const existe = lista.some((m) => m.id === mensaje.id);
  const nueva = existe
    ? lista.filter((m) => m.id !== mensaje.id)
    : [...lista, { id: mensaje.id, texto: mensaje.texto, remitente_id: mensaje.remitente_id }];
  await escribir(convId, nueva);
  return nueva;
}

export async function quitarFijado(convId, id)
{
  const lista = await leerFijados(convId);
  const nueva = lista.filter((m) => m.id !== id);
  await escribir(convId, nueva);
  return nueva;
}
