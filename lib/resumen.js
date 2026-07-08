export function resumenMensaje(texto)
{
  if (!texto)
  {
    return "Mensaje";
  }
  if (texto[0] !== "{")
  {
    return texto;
  }
  try
  {
    const o = JSON.parse(texto);
    if (o.t === "img")
    {
      return o.cap ? `Foto · ${o.cap}` : "Foto";
    }
    if (o.t === "video")
    {
      return o.cap ? `Video · ${o.cap}` : "Video";
    }
    if (o.t === "audio")
    {
      return "Nota de voz";
    }
    if (o.t === "sticker")
    {
      return "Sticker";
    }
    if (o.t === "file")
    {
      return o.nombre || "Documento";
    }
    if (o.t === "tmp")
    {
      return o.m;
    }
    if (o.t === "tmpaviso")
    {
      return "Mensajes temporales";
    }
  }
  catch (e)
  {
  }
  return texto;
}
