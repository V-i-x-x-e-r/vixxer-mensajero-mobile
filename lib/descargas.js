import { Platform } from "react-native";
import { encodeBase64 } from "tweetnacl-util";
import * as api from "./api";
import { descifrarArchivo } from "./crypto";
import { escribirTemp } from "./archivos";

export async function guardarMedia(media)
{
  if (Platform.OS === "web")
  {
    return "web";
  }
  try
  {
    const MediaLibrary = require("expo-media-library");
    const permiso = await MediaLibrary.requestPermissionsAsync();
    if (!permiso.granted)
    {
      return "sin_permiso";
    }
    const { url } = await api.urlMedia(media.path);
    const resp = await fetch(url);
    const bytes = new Uint8Array(await resp.arrayBuffer());
    const claro = descifrarArchivo(encodeBase64(bytes), media.k, media.n);
    if (!claro)
    {
      return "error";
    }
    const ext = media.t === "video" ? "mp4" : "jpg";
    const archivo = await escribirTemp(claro, ext);
    await MediaLibrary.saveToLibraryAsync(archivo);
    return "ok";
  }
  catch (e)
  {
    return "error";
  }
}
