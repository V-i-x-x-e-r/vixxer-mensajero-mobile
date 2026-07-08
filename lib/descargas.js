import { Platform } from "react-native";
import * as FileSystem from "expo-file-system/legacy";
import { obtenerMedia } from "./mediaRemota";

async function aArchivo(uri, mime)
{
  if (!uri.startsWith("data:"))
  {
    return uri;
  }
  const ext = mime && mime.includes("video") ? "mp4" : mime && mime.includes("png") ? "png" : "jpg";
  const destino = `${FileSystem.cacheDirectory}vxsave-${Date.now()}.${ext}`;
  const base64 = uri.slice(uri.indexOf(",") + 1);
  await FileSystem.writeAsStringAsync(destino, base64, { encoding: FileSystem.EncodingType.Base64 });
  return destino;
}

export async function guardarMedia(media)
{
  if (Platform.OS === "web")
  {
    return { estado: "web" };
  }
  try
  {
    const MediaLibrary = require("expo-media-library");
    const permiso = await MediaLibrary.requestPermissionsAsync(true);
    const crudo = await obtenerMedia(media).catch(() => null);
    if (!crudo)
    {
      return { estado: "error", detalle: "no se pudo descargar el archivo" };
    }
    const archivo = await aArchivo(crudo, media.mime);
    try
    {
      await MediaLibrary.saveToLibraryAsync(archivo);
      return { estado: "ok" };
    }
    catch (e1)
    {
      try
      {
        await MediaLibrary.createAssetAsync(archivo);
        return { estado: "ok" };
      }
      catch (e2)
      {
        if (!permiso.granted)
        {
          return { estado: "sin_permiso" };
        }
        try
        {
          const Sharing = require("expo-sharing");
          await Sharing.shareAsync(archivo, { mimeType: media.mime || "image/jpeg" });
          return { estado: "compartido" };
        }
        catch (e3)
        {
          return { estado: "error", detalle: String(e2?.message || e1?.message || "desconocido").slice(0, 80) };
        }
      }
    }
  }
  catch (e)
  {
    return { estado: "error", detalle: String(e?.message || "desconocido").slice(0, 80) };
  }
}
