import * as ImageManipulator from "expo-image-manipulator";

const MAX_ANCHO = 248;
const MAX_ALTO = 320;

export function ajustarMedida(w, h, maxAncho = MAX_ANCHO, maxAlto = MAX_ALTO)
{
  if (!w || !h)
  {
    return null;
  }
  const escala = Math.min(maxAncho / w, maxAlto / h, 1);
  return { width: Math.round(w * escala), height: Math.round(h * escala) };
}

export function duracionCorta(segundos)
{
  if (!segundos && segundos !== 0)
  {
    return null;
  }
  const s = Math.max(0, Math.round(segundos));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

async function miniatura(uri)
{
  const r = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: 36 } }],
    { compress: 0.3, format: ImageManipulator.SaveFormat.JPEG, base64: true },
  );
  return `data:image/jpeg;base64,${r.base64}`;
}

export async function generarPreview(actual)
{
  try
  {
    if (actual.tipo === "audio" || actual.tipo === "file")
    {
      return {};
    }
    if (actual.tipo === "video")
    {
      const VideoThumbnails = require("expo-video-thumbnails");
      const t = await VideoThumbnails.getThumbnailAsync(actual.uri, { time: 0, quality: 0.5 });
      return { prev: await miniatura(t.uri), w: actual.ancho || t.width, h: actual.alto || t.height };
    }
    return { prev: await miniatura(actual.uri), w: actual.ancho, h: actual.alto };
  }
  catch (e)
  {
    return {};
  }
}
