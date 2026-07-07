const cache = new Map();
const RE_URL = /(https?:\/\/[^\s]+)/i;

export function extraerUrl(texto)
{
  if (!texto || texto[0] === "{")
  {
    return null;
  }
  const m = String(texto).match(RE_URL);
  return m ? m[1].replace(/[),.;!?]+$/, "") : null;
}

export function dominioDe(url)
{
  const m = String(url).match(/^https?:\/\/([^/]+)/i);
  return m ? m[1].replace(/^www\./, "") : url;
}

function decodificar(t)
{
  return String(t)
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .trim();
}

function meta(html, prop)
{
  const directo = new RegExp(`<meta[^>]+(?:property|name)=["']${prop}["'][^>]*content=["']([^"']+)["']`, "i");
  const invertido = new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]*(?:property|name)=["']${prop}["']`, "i");
  const m = html.match(directo) || html.match(invertido);
  return m ? m[1] : null;
}

export async function obtenerPreview(url)
{
  if (cache.has(url))
  {
    return cache.get(url);
  }
  let salida = null;
  try
  {
    const control = new AbortController();
    const temporizador = setTimeout(() => control.abort(), 4000);
    const r = await fetch(url, { signal: control.signal, headers: { Accept: "text/html" } });
    clearTimeout(temporizador);
    const tipo = r.headers.get("content-type") || "";
    if (tipo.includes("text/html"))
    {
      const html = (await r.text()).slice(0, 150000);
      const titulo = meta(html, "og:title") || html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1] || null;
      if (titulo)
      {
        const desc = meta(html, "og:description") || meta(html, "description");
        salida = {
          url,
          titulo: decodificar(titulo),
          desc: desc ? decodificar(desc) : null,
          imagen: meta(html, "og:image"),
        };
      }
    }
  }
  catch (e)
  {
  }
  cache.set(url, salida);
  return salida;
}
