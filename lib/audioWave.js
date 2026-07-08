const BARRAS = 36;

export function normalizarMuestras(muestras, n = BARRAS)
{
  if (!muestras || muestras.length === 0)
  {
    return null;
  }
  const paso = muestras.length / n;
  const crudos = [];
  for (let i = 0; i < n; i += 1)
  {
    const trozo = muestras.slice(Math.floor(i * paso), Math.max(Math.floor((i + 1) * paso), Math.floor(i * paso) + 1));
    const pico = Math.max(...trozo);
    crudos.push(Math.min(-2, Math.max(-55, pico)));
  }
  const suaves = crudos.map((v, i) =>
  {
    const izq = crudos[i - 1] ?? v;
    const der = crudos[i + 1] ?? v;
    return izq * 0.25 + v * 0.5 + der * 0.25;
  });
  const min = Math.min(...suaves);
  const max = Math.max(...suaves);
  if (!(max - min > 3))
  {
    return null;
  }
  return suaves.map((v) => Math.round((0.08 + 0.92 * Math.pow((v - min) / (max - min), 0.85)) * 100) / 100);
}

export function barrasDeterministas(semilla, n = BARRAS)
{
  const texto = String(semilla || "vx");
  const salida = [];
  let h = 2166136261;
  for (let i = 0; i < n; i += 1)
  {
    h ^= texto.charCodeAt(i % texto.length) + i;
    h = Math.imul(h, 16777619) >>> 0;
    salida.push(0.15 + (h % 1000) / 1250);
  }
  return salida;
}
