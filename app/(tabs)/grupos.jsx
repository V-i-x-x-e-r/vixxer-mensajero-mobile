import { useState, useCallback } from "react";
import { View, Text, Pressable, FlatList, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useFocusEffect } from "expo-router";
import * as api from "../../lib/api";
import { useTema } from "../../components/tema";
import { fuentes } from "../../assets/themes/temas";
import { Avatar } from "../../components/Avatar";
import { Presionable } from "../../components/Presionable";
import { Grupos as GruposIcono } from "../../components/Grupos";
import { EstadoLista } from "../../components/EstadoLista";

export default function Grupos()
{
  const { colores } = useTema();
  const insets = useSafeAreaInsets();
  const [grupos, setGrupos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(false);

  const cargar = useCallback(async () =>
  {
    setError(false);
    try
    {
      const data = await api.misGrupos();
      setGrupos(data);
    }
    catch (e)
    {
      setError(true);
    }
    finally
    {
      setCargando(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { cargar(); }, [cargar]));

  return (
    <View style={[estilos.pantalla, { backgroundColor: colores.fondo, paddingTop: insets.top + 12 }]}>
      <View style={estilos.cabecera}>
        <Text style={[estilos.titulo, { color: colores.texto }]}>Grupos</Text>
        <Pressable onPress={() => router.push("/grupo/crear")} hitSlop={8} style={({ pressed }) => [estilos.crear, { backgroundColor: colores.botonFondo }, pressed && estilos.presionado]}>
          <Text style={[estilos.crearTxt, { color: colores.botonTexto }]}>+ Nuevo</Text>
        </Pressable>
      </View>

      <FlatList
        data={grupos}
        keyExtractor={(g) => g.id}
        style={estilos.lista}
        ListEmptyComponent={
          <EstadoLista
            cargando={cargando}
            error={error}
            vacio="Aún no tienes grupos. Crea uno con el botón de arriba."
            onReintentar={() => { setCargando(true); cargar(); }}
          />
        }
        ItemSeparatorComponent={() => <View style={[estilos.sep, { backgroundColor: colores.borde }]} />}
        renderItem={({ item }) => (
          <Presionable
            onPress={() => router.push({ pathname: "/grupo/[id]", params: { id: item.id, nombre: item.nombre } })}
            style={estilos.fila}
          >
            <View style={[estilos.icono, { backgroundColor: colores.surface }]}>
              <GruposIcono color={colores.muted} tamano={22} />
            </View>
            <View style={estilos.centro}>
              <Text style={[estilos.nombre, { color: colores.texto }]} numberOfLines={1}>{item.nombre}</Text>
              <Text style={[estilos.sub, { color: colores.muted }]}>{item.miembros} miembros</Text>
            </View>
          </Presionable>
        )}
      />
    </View>
  );
}

const estilos = StyleSheet.create({
  pantalla: { flex: 1, paddingHorizontal: 20, gap: 12 },
  cabecera: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", minHeight: 34 },
  titulo: { fontSize: 18, fontFamily: fuentes.semibold },
  crear: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  crearTxt: { fontSize: 13, fontFamily: fuentes.semibold },
  lista: { flex: 1 },
  fila: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12, paddingHorizontal: 10, borderRadius: 12 },
  icono: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  centro: { flex: 1, gap: 2 },
  nombre: { fontSize: 16 },
  sub: { fontSize: 13 },
  sep: { height: 1, marginLeft: 66 },
  presionado: { opacity: 0.7 },
});
