import { useEffect, useState } from "react";
import { View, Text, Pressable, FlatList, StyleSheet } from "react-native";
import * as api from "../lib/api";
import { useTema } from "../components/tema";
import { fuentes } from "../assets/themes/temas";
import { EstadoLista } from "../components/EstadoLista";

export default function Solicitudes()
{
  const { colores } = useTema();
  const [lista, setLista] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(false);

  async function cargar()
  {
    setError(false);
    try
    {
      setLista(await api.solicitudes());
    }
    catch (e)
    {
      setError(true);
    }
    finally
    {
      setCargando(false);
    }
  }

  useEffect(() =>
  {
    cargar();
  }, []);

  function reintentar()
  {
    setCargando(true);
    cargar();
  }

  async function aceptar(id)
  {
    await api.aceptarSolicitud(id);
    cargar();
  }

  async function rechazar(id)
  {
    await api.rechazarSolicitud(id);
    cargar();
  }

  return (
    <View style={[estilos.pantalla, { backgroundColor: colores.fondo }]}>
      <FlatList
        data={lista}
        keyExtractor={(s) => s.id}
        contentContainerStyle={estilos.lista}
        ListEmptyComponent={
          <EstadoLista
            cargando={cargando}
            error={error}
            vacio="No tienes solicitudes pendientes."
            onReintentar={reintentar}
          />
        }
        renderItem={({ item }) => (
          <View style={[estilos.fila, { borderColor: colores.borde }]}>
            <Text style={[estilos.nombre, { color: colores.texto }]}>{item.usuario}</Text>
            <View style={estilos.acciones}>
              <Pressable onPress={() => rechazar(item.id)} hitSlop={6} style={({ pressed }) => pressed && estilos.presionado}>
                <Text style={{ color: colores.muted, fontSize: 14 }}>Rechazar</Text>
              </Pressable>
              <Pressable onPress={() => aceptar(item.id)} style={({ pressed }) => [estilos.aceptar, { backgroundColor: colores.botonFondo }, pressed && estilos.presionado]}>
                <Text style={{ color: colores.botonTexto, fontFamily: fuentes.semibold, fontSize: 13 }}>Aceptar</Text>
              </Pressable>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const estilos = StyleSheet.create({
  pantalla: { flex: 1 },
  lista: { padding: 16, gap: 8, flexGrow: 1 },
  fila:
  {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  nombre: { fontSize: 16 },
  acciones: { flexDirection: "row", alignItems: "center", gap: 14 },
  aceptar: { borderRadius: 8, paddingHorizontal: 14, paddingVertical: 7 },
  presionado: { opacity: 0.6 },
});
