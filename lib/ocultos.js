import AsyncStorage from "@react-native-async-storage/async-storage";

function claveDe(chat)
{
  return `vixxer_ocultos_${chat}`;
}

export async function leerOcultos(chat)
{
  try
  {
    const crudo = await AsyncStorage.getItem(claveDe(chat));
    return new Set(crudo ? JSON.parse(crudo) : []);
  }
  catch (e)
  {
    return new Set();
  }
}

export async function ocultarMensaje(chat, id)
{
  const set = await leerOcultos(chat);
  set.add(id);
  try
  {
    await AsyncStorage.setItem(claveDe(chat), JSON.stringify([...set].slice(-500)));
  }
  catch (e)
  {
  }
  return set;
}
