import { useRef } from "react";
import { leerBase64 } from "../../lib/archivos";
import { cifrarArchivoTrozos } from "../../lib/crypto";
import { guardarCache } from "../../lib/mediaCache";
import { generarPreview } from "../../lib/mediaPreview";
import { publicarProgreso, limpiarProgreso } from "../../lib/progresoMedia";
import * as api from "../../lib/api";

export function useEnvioMedia({ miId, setMensajes, enviarPlano, alPersistir })
{
  const pendientes = useRef({});

  function optimista(actual)
  {
    const localId = `local-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const texto = JSON.stringify({
      t: actual.tipo,
      local: actual.uri,
      mime: actual.mime,
      w: actual.ancho,
      h: actual.alto,
      dur: actual.dur,
      cap: actual.cap,
      wf: actual.wf,
      nombre: actual.nombre,
      peso: actual.peso,
      pid: localId,
    });
    pendientes.current[localId] = actual;
    setMensajes((prev) => [
      ...prev,
      { id: localId, remitente_id: miId(), texto, enviado_en: new Date().toISOString(), estado: "enviando" },
    ]);
    return localId;
  }

  async function subir(actual, localId)
  {
    try
    {
      publicarProgreso(localId, 0);
      const extra = await generarPreview(actual);
      const base64 = await leerBase64(actual.uri);
      const cif = await cifrarArchivoTrozos(base64, (p) => publicarProgreso(localId, p * 0.2));
      const { path } = await api.subirMediaConProgreso(cif.datos, (p) => publicarProgreso(localId, 0.2 + p * 0.75));
      guardarCache(path, actual.uri);
      const plano = JSON.stringify({
        t: actual.tipo,
        path,
        mime: actual.mime,
        k: cif.clave,
        n: cif.nonce,
        w: actual.ancho || extra.w,
        h: actual.alto || extra.h,
        dur: actual.dur,
        cap: actual.cap,
        wf: actual.wf,
        nombre: actual.nombre,
        peso: actual.peso,
        prev: extra.prev,
      });
      const r = await enviarPlano(plano, localId);
      if (r && r.ok)
      {
        delete pendientes.current[localId];
        limpiarProgreso(localId);
        setMensajes((prev) =>
        {
          const lista = prev.map((m) => (m.id === localId ? { ...m, id: r.id, texto: plano, estado: "enviado" } : m));
          alPersistir && alPersistir(lista);
          return lista;
        });
      }
      else
      {
        publicarProgreso(localId, null);
        setMensajes((prev) => prev.map((m) => (m.id === localId ? { ...m, estado: "fallido" } : m)));
      }
    }
    catch (e)
    {
      publicarProgreso(localId, null);
      setMensajes((prev) => prev.map((m) => (m.id === localId ? { ...m, estado: "fallido" } : m)));
    }
  }

  function enviarMedia(actual)
  {
    const localId = optimista(actual);
    return subir(actual, localId);
  }

  function reintentarMedia(id)
  {
    const pend = pendientes.current[id];
    if (!pend)
    {
      return false;
    }
    setMensajes((prev) => prev.map((m) => (m.id === id ? { ...m, estado: "enviando" } : m)));
    subir(pend, id);
    return true;
  }

  return { enviarMedia, reintentarMedia };
}
