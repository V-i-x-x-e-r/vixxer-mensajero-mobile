export function aFecha(iso)
{
  return iso ? new Date(iso) : new Date();
}

export function mismoDia(a, b)
{
  return aFecha(a).toDateString() === aFecha(b).toDateString();
}

export function etiquetaDia(iso)
{
  const f = aFecha(iso);
  const hoy = new Date();
  const ayer = new Date();
  ayer.setDate(hoy.getDate() - 1);
  if (f.toDateString() === hoy.toDateString())
  {
    return "Hoy";
  }
  if (f.toDateString() === ayer.toDateString())
  {
    return "Ayer";
  }
  return f.toLocaleDateString();
}

export function hora(iso)
{
  const f = aFecha(iso);
  return `${String(f.getHours()).padStart(2, "0")}:${String(f.getMinutes()).padStart(2, "0")}`;
}
