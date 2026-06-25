import { useState, useCallback } from "react";
import { View, Text, Pressable, FlatList, RefreshControl, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useFocusEffect } from "expo-router";
import * as api from "../../lib/api";
import { useTema } from "../../components/tema";
import { fuentes } from "../../assets/themes/temas";
import { Engrane } from "../../components/Engrane";
import { Avatar } from "../../components/Avatar";
import { Badge } from "../../components/Badge";
import { EstadoLista } from "../../components/EstadoLista";
import { useSolicitudes } from "../../components/Solicitudes";

export default function AmigosPantalla()
{
  const { colores } = useTema();
  const insets = useSafeAreaInsets();
  const { pendientes, refrescar } = useSolicitudes();
  const [lista, setLista] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);
  const [error, setError] = useState(false);

  const cargar = useCallback(async () =>
  {
    setError(false);
    try
    {
      setLista(await api.amigos());
      refrescar();
    }
    catch (e)
    {
      setError(true);
    }
    finally
    {
      setCargando(false);
    }
  }, [refrescar]);

  useFocusEffect(
    useCallback(() =>
    {
      cargar();
    }, [cargar]),
  );

  function reintentar()
  {
    setCargando(true);
    cargar();
  }

  async function alRefrescar()
  {
    setRefrescando(true);
    await cargar();
    setRefrescando(false);
  }

  return (
    <View style={[estilos.pantalla, { backgroundColor: colores.fondo, paddingTop: insets.top + 12 }]}>
      <View style={estilos.cabecera}>
        <Text style={[estilos.titulo, { color: colores.texto }]}>Amigos</Text>
        <Pressable onPress={() => router.push("/ajustes")} hitSlop={8} style={({ pressed }) => pressed && estilos.presionado}>
          <Engrane color={colores.texto} />
        </Pressable>
      </View>

      <FlatList
        data={lista}
        keyExtractor={(a) => a.id}
        style={estilos.lista}
        refreshControl={
          <RefreshControl refreshing={refrescando} onRefresh={alRefrescar} tintColor={colores.muted} colors={[colores.texto]} />
        }
        ListHeaderComponent={
          <View style={estilos.acciones}>
            <Pressable
              onPress={() => router.push("/agregar")}
              style={({ pressed }) => [estilos.accion, { backgroundColor: colores.surface, borderColor: colores.borde }, pressed && estilos.presionado]}
            >
              <Text style={[estilos.accionTxt, { color: colores.texto }]}>Agregar por código</Text>
              <Text style={[estilos.flecha, { color: colores.muted }]}>{"›"}</Text>
            </Pressable>
            <Pressable
              onPress={() => router.push("/solicitudes")}
              style={({ pressed }) => [estilos.accion, { backgroundColor: colores.surface, borderColor: colores.borde }, pressed && estilos.presionado]}
            >
              <Text style={[estilos.accionTxt, { color: colores.texto }]}>Solicitudes</Text>
              <View style={estilos.derechaAccion}>
                <Badge cantidad={pendientes} />
                <Text style={[estilos.flecha, { color: colores.muted }]}>{"›"}</Text>
              </View>
            </Pressable>
            <Text style={[estilos.seccion, { color: colores.muted }]}>TUS CONTACTOS</Text>
          </View>
        }
        ListEmptyComponent={
          <EstadoLista
            cargando={cargando}
            error={error}
            vacio="Aún no tienes contactos. Agrega a alguien por su código."
            onReintentar={reintentar}
          />
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => router.push({ pathname: "/chat/[id]", params: { id: item.id, usuario: item.usuario, avatar: item.avatar_url || "" } })}
            style={({ pressed }) => [estilos.fila, { backgroundColor: colores.surface, borderColor: colores.borde }, pressed && estilos.presionado]}
          >
            <Avatar nombre={item.usuario} uri={item.avatar_url} tamano={44} />
            <Text style={[estilos.nombre, { color: colores.texto }]} numberOfLines={1}>{item.usuario}</Text>
          </Pressable>
        )}
      />
    </View>
  );
}

const estilos = StyleSheet.create({
  pantalla: { flex: 1, paddingHorizontal: 20, gap: 12 },
  cabecera: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  titulo: { fontSize: 18, fontFamily: fuentes.semibold },
  lista: { flex: 1 },
  acciones: { gap: 8, marginBottom: 4 },
  accion: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderWidth: 1, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 14 },
  accionTxt: { fontSize: 15 },
  derechaAccion: { flexDirection: "row", alignItems: "center", gap: 8 },
  flecha: { fontSize: 20 },
  seccion: { fontSize: 12, fontWeight: "600", letterSpacing: 1, marginTop: 16, marginBottom: 4 },
  fila: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: 10, borderWidth: 1, marginBottom: 8 },
  nombre: { fontSize: 16, flex: 1 },
  presionado: { opacity: 0.6 },
});
