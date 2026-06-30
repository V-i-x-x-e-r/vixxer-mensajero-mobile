import AsyncStorage from "@react-native-async-storage/async-storage";

const PREFIJO = "vixxer_outbox_";

export async function leerOutbox(destId)
{
  try
  {
    const crudo = await AsyncStorage.getItem(PREFIJO + destId);
    return crudo ? JSON.parse(crudo) : [];
  }
  catch (e)
  {
    return [];
  }
}

async function escribir(destId, items)
{
  try
  {
    await AsyncStorage.setItem(PREFIJO + destId, JSON.stringify(items));
  }
  catch (e)
  {
  }
}

export async function agregarOutbox(destId, item)
{
  const items = await leerOutbox(destId);
  items.push(item);
  await escribir(destId, items);
}

export async function quitarOutbox(destId, localId)
{
  const items = await leerOutbox(destId);
  await escribir(destId, items.filter((i) => i.localId !== localId));
}
