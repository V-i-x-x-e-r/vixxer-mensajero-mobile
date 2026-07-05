import { Platform } from "react-native";
import { encodeBase64 } from "tweetnacl-util";
import * as api from "./api";
import { descifrarArchivo } from "./crypto";
import { escribirTemp } from "./archivos";
import { leerDisco } from "./mediaCache";

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
    let archivo = media.local || null;
    if (!archivo && media.path)
    {
      archivo = await leerDisco(media.path, media.mime);
    }
    if (!archivo)
    {
      const { url } = await api.urlMedia(media.path);
      const resp = await fetch(url);
      const bytes = new Uint8Array(await resp.arrayBuffer());
      const claro = descifrarArchivo(encodeBase64(bytes), media.k, media.n);
      if (!claro)
      {
        return "error";
      }
      const ext = media.t === "video" ? "mp4" : media.t === "sticker" ? "png" : "jpg";
      archivo = await escribirTemp(claro, ext);
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
