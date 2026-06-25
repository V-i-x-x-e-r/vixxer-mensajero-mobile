import { createContext, useContext, useState, useCallback } from "react";
import * as api from "../lib/api";

const Contexto = createContext({ pendientes: 0, refrescar: () => {} });

export function ProveedorSolicitudes({ children })
{
  const [pendientes, setPendientes] = useState(0);

  const refrescar = useCallback(async () =>
  {
    try
    {
      const lista = await api.solicitudes();
      setPendientes(lista.length);
    }
    catch (e)
    {
    }
  }, []);

  return (
    <Contexto.Provider value={{ pendientes, refrescar }}>
      {children}
    </Contexto.Provider>
  );
}

export function useSolicitudes()
{
  return useContext(Contexto);
}
