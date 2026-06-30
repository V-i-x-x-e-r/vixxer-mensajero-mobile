export function crearSobre({ remitenteId, destinatarioId, contenidoCifrado, nonce }, ttl = 5)
{
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
    remitenteId,
    destinatarioId,
    contenidoCifrado,
    nonce,
    ttl,
  };
}

export function crearVistos(max = 500)
{
  const set = new Set();
  const orden = [];
  return {
    visto: (id) => set.has(id),
    marcar: (id) =>
    {
      if (set.has(id))
      {
        return;
      }
      set.add(id);
      orden.push(id);
      if (orden.length > max)
      {
        set.delete(orden.shift());
      }
    },
  };
}

export function procesar(sobre, miId, vistos)
{
  if (!sobre || !sobre.id || vistos.visto(sobre.id))
  {
    return { accion: "descartar" };
  }
  vistos.marcar(sobre.id);
  if (sobre.destinatarioId === miId)
  {
    return { accion: "entregar" };
  }
  if (sobre.ttl <= 1)
  {
    return { accion: "descartar" };
  }
  return { accion: "reenviar", sobre: { ...sobre, ttl: sobre.ttl - 1 } };
}
