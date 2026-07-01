import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ScreenCapture from "expo-screen-capture";

const CLAVE = "vixxer_bloquear_capturas";

export async function capturasBloqueadas()
{
  try
  {
    return (await AsyncStorage.getItem(CLAVE)) === "1";
  }
  catch (e)
  {
    return false;
  }
}

export async function aplicarBloqueoCapturas(valor)
{
  try
  {
    if (valor)
    {
      await ScreenCapture.preventScreenCaptureAsync();
    }
    else
    {
      await ScreenCapture.allowScreenCaptureAsync();
    }
  }
  catch (e)
  {
  }
}

export async function guardarBloqueoCapturas(valor)
{
  try
  {
    if (valor)
    {
      await AsyncStorage.setItem(CLAVE, "1");
    }
    else
    {
      await AsyncStorage.removeItem(CLAVE);
    }
  }
  catch (e)
  {
  }
  await aplicarBloqueoCapturas(valor);
}
