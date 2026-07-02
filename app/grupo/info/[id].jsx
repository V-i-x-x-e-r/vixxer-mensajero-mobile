import { useState, useEffect } from "react";
import { View, Text, Pressable, FlatList, StyleSheet } from "react-native";
import { Stack, useLocalSearchParams, router } from "expo-router";
import * as api from "../../../lib/api";
import { leer, MI_ID } from "../../../lib/storage";
import { useTema } from "../../../components/tema";
import { fuentes } from "../../../assets/themes/temas";
import { Avatar } from "../../../components/Avatar";
import { Grupos as GruposIcono } from "../../../components/Grupos";
import { Confirmacion } from "../../../components/Confirmacion";

export default function InfoGrupo()
{
  const { colores } = useTema();
  const { id, nombre } = useLocalSearchParams();
  const [grupo, setGrupo] = useState(null);
  const [miId, setMiId] = useState(null);
  const [confirmar, setConfirmar] = useState(false);

  useEffect(() =>
  {
    leer(MI_ID).then(setMiId);
    api.infoGrupo(id).then(setGrupo).catch(() => {});
  }, [id]);

  async function salir()
  {
    setConfirmar(false);
    try
    {
      await api.salirGrupo(id);
    }
    catch (e)
    {
    }
    router.replace("/grupos");
  }

  const miembros = grupo?.miembros || [];

  return (
    <View style={{ flex: 1, backgroundColor: colores.fondo }}>
      <Stack.Screen options={{ title: "Info del grupo" }} />
      <View style={estilos.cabecera}>
        <View style={[estilos.icono, { backgroundColor: colores.surface }]}>
          <GruposIcono color={colores.muted} tamano={40} />
        </View>
        <Text style={[estilos.nombre, { color: colores.texto }]}>{grupo?.nombre || nombre}</Text>
        <Text style={[estilos.sub, { color: colores.muted }]}>{miembros.length} miembros</Text>
      </View>

      <Text style={[estilos.seccion, { color: colores.muted }]}>INTEGRANTES</Text>
      <FlatList
        data={miembros}
        keyExtractor={(m) => m.id}
        style={estilos.lista}
        renderItem={({ item }) => (
          <View style={estilos.fila}>
            <Avatar nombre={item.usuario} uri={item.avatar_url} tamano={42} />
            <Text style={[estilos.usuario, { color: colores.texto }]} numberOfLines={1}>
              {item.usuario}{item.id === miId ? " (tú)" : ""}{grupo && item.id === grupo.creador_id ? " · creador" : ""}
            </Text>
          </View>
        )}
      />

      <Pressable onPress={() => setConfirmar(true)} style={({ pressed }) => [estilos.salir, { borderColor: colores.borde }, pressed && { opacity: 0.6 }]}>
        <Text style={[estilos.salirTxt, { color: colores.error }]}>Salir del grupo</Text>
      </Pressable>

      <Confirmacion
        visible={confirmar}
        titulo="Salir del grupo"
        mensaje="Dejarás de recibir sus mensajes. Podrán volver a agregarte más adelante."
        textoConfirmar="Salir"
        destructivo
        onConfirmar={salir}
        onCancelar={() => setConfirmar(false)}
      />
    </View>
  );
}

const estilos = StyleSheet.create({
  cabecera: { alignItems: "center", gap: 8, paddingTop: 28, paddingBottom: 24 },
  icono: { width: 84, height: 84, borderRadius: 42, alignItems: "center", justifyContent: "center" },
  nombre: { fontSize: 22, fontFamily: fuentes.semibold },
  sub: { fontSize: 13 },
  seccion: { fontSize: 12, fontWeight: "600", letterSpacing: 1, paddingHorizontal: 20, marginBottom: 6 },
  lista: { flex: 1 },
  fila: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 10, paddingHorizontal: 20 },
  usuario: { fontSize: 15, flex: 1 },
  salir: { borderWidth: 1, borderRadius: 12, paddingVertical: 14, alignItems: "center", margin: 20 },
  salirTxt: { fontSize: 15, fontFamily: fuentes.semibold },
});
