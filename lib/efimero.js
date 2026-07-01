import AsyncStorage from "@react-native-async-storage/async-storage";

const PREFIJO = "vixxer_efimero_";

export const OPCIONES = [
  { valor: 0, etiqueta: "Desactivado" },
  { valor: 60, etiqueta: "1 minuto" },
  { valor: 3600, etiqueta: "1 hora" },
  { valor: 86400, etiqueta: "1 día" },
];

export async function leerTemporizador(convId)
{
  try
  {
    const crudo = await AsyncStorage.getItem(PREFIJO + convId);
    return crudo ? Number(crudo) : 0;
  }
  catch (e)
  {
    return 0;
  }
}

export async function guardarTemporizador(convId, segundos)
{
  try
  {
    if (segundos > 0)
    {
      await AsyncStorage.setItem(PREFIJO + convId, String(segundos));
    }
    else
    {
      await AsyncStorage.removeItem(PREFIJO + convId);
    }
  }
  catch (e)
  {
  }
}

export function envolver(texto, segundos)
{
  return JSON.stringify({ t: "tmp", d: segundos, m: texto });
}

export function leerEfimero(texto)
{
  if (!texto || texto[0] !== "{")
  {
    return null;
  }
  try
  {
    const obj = JSON.parse(texto);
    return obj && obj.t === "tmp" ? obj : null;
  }
  catch (e)
  {
    return null;
  }
}

export function expiraEn(item)
{
  const ef = leerEfimero(item.texto);
  if (!ef || !item.enviado_en)
  {
    return null;
  }
  return new Date(item.enviado_en).getTime() + ef.d * 1000;
}

export function etiquetaDuracion(segundos)
{
  const o = OPCIONES.find((x) => x.valor === segundos);
  return o ? o.etiqueta : `${segundos}s`;
}
