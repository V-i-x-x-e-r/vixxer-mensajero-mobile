import { useEffect, useState } from "react";
import { View, Text, Pressable, FlatList, StyleSheet } from "react-native";
import * as api from "../lib/api";
import { useTema } from "../components/tema";
import { fuentes } from "../assets/themes/temas";

export default function Solicitudes()
{
  const { colores } = useTema();
  const [lista, setLista] = useState([]);

  async function cargar()
  {
    try
    {
      setLista(await api.solicitudes());
    }
    catch (e)
    {
      setLista([]);
    }
  }

  useEffect(() =>
  {
    cargar();
  }, []);

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
          <Text style={[estilos.vacio, { color: colores.muted }]}>No tienes solicitudes pendientes.</Text>
        }
        renderItem={({ item }) => (
          <View style={[estilos.fila, { borderColor: colores.borde }]}>
            <Text style={[estilos.nombre, { color: colores.texto }]}>{item.usuario}</Text>
            <View style={estilos.acciones}>
              <Pressable onPress={() => rechazar(item.id)} hitSlop={6}>
                <Text style={{ color: colores.muted, fontSize: 14 }}>Rechazar</Text>
              </Pressable>
              <Pressable onPress={() => aceptar(item.id)} style={[estilos.aceptar, { backgroundColor: colores.botonFondo }]}>
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
  lista: { padding: 16, gap: 8 },
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
  vacio: { textAlign: "center", marginTop: 40, fontSize: 14 },
});
