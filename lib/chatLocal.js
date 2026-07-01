import { leer, guardar } from "./storage";

const FIJADOS = "vixxer_fijados";
const SILENCIADOS = "vixxer_silenciados";
const OCULTOS = "vixxer_ocultos";
const ARCHIVADOS = "vixxer_archivados";
const FAVORITOS = "vixxer_favoritos";

async function leerLista(clave)
{
  const crudo = await leer(clave);
  if (!crudo)
  {
    return [];
  }
  try
  {
    return JSON.parse(crudo);
  }
  catch (e)
  {
    return [];
  }
}

async function escribir(clave, lista)
{
  await guardar(clave, JSON.stringify(lista));
}

async function alternar(clave, id)
{
  const lista = await leerLista(clave);
  const nueva = lista.includes(id) ? lista.filter((x) => x !== id) : [...lista, id];
  await escribir(clave, nueva);
  return nueva;
}

export async function leerEstados()
{
  const [fijados, silenciados, ocultos, archivados, favoritos] = await Promise.all([
    leerLista(FIJADOS),
    leerLista(SILENCIADOS),
    leerLista(OCULTOS),
    leerLista(ARCHIVADOS),
    leerLista(FAVORITOS),
  ]);
  return { fijados, silenciados, ocultos, archivados, favoritos };
}

export const alternarFijado = (id) => alternar(FIJADOS, id);
export const alternarSilenciado = (id) => alternar(SILENCIADOS, id);
export const alternarArchivado = (id) => alternar(ARCHIVADOS, id);
export const alternarFavorito = (id) => alternar(FAVORITOS, id);

export async function ocultar(id)
{
  const lista = await leerLista(OCULTOS);
  if (!lista.includes(id))
  {
    await escribir(OCULTOS, [...lista, id]);
  }
}

export async function mostrar(id)
{
  const lista = await leerLista(OCULTOS);
  if (lista.includes(id))
  {
    await escribir(OCULTOS, lista.filter((x) => x !== id));
  }
}
