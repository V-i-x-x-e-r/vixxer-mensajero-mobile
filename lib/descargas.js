import { Platform } from "react-native";
import { obtenerMedia } from "./mediaRemota";

export async function guardarMedia(media)
{
  if (Platform.OS === "web")
  {
    return "web";
  }
  try
  {
    const MediaLibrary = require("expo-media-library");
    const permiso = await MediaLibrary.requestPermissionsAsync(true);
    const archivo = await obtenerMedia(media).catch(() => null);
    if (!archivo || archivo.startsWith("data:"))
    {
      return "error";
    }
    try
    {
      await MediaLibrary.saveToLibraryAsync(archivo);
      return "ok";
    }
    catch (e)
    {
      return permiso.granted ? "error" : "sin_permiso";
    }
  }
  catch (e)
  {
    return "error";
  }
}
