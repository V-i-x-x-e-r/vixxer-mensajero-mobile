import { useState, useEffect, useCallback } from "react";
import { View, Text, Pressable, FlatList, StyleSheet } from "react-native";
import { Stack } from "expo-router";
import * as api from "../lib/api";
import { useTema } from "../components/tema";
import { fuentes } from "../assets/themes/temas";
import { Avatar } from "../components/Avatar";
import { EstadoLista } from "../components/EstadoLista";

export default function Bloqueados()
{
  const { colores } = useTema();
  const [lista, setLista] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(false);
  const [ocupado, setOcupado] = useState(null);

  const cargar = useCallback(async () =>
  {
    setError(false);
    try
    {
      setLista(await api.bloqueados());
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

  useEffect(() =>
  {
    cargar();
  }, [cargar]);

  async function desbloquear(id)
  {
    setOcupado(id);
    try
    {
      await api.desbloquear(id);
      setLista((prev) => prev.filter((u) => u.id !== id));
    }
    catch (e)
    {
    }
    setOcupado(null);
  }

  return (
    <View style={{ flex: 1, backgroundColor: colores.fondo }}>
      <Stack.Screen options={{ title: "Usuarios bloqueados" }} />
      <FlatList
        data={lista}
        keyExtractor={(u) => u.id}
        contentContainerStyle={estilos.lista}
        ListEmptyComponent={
          <EstadoLista
            cargando={cargando}
            error={error}
            vacio="No tienes a nadie bloqueado."
            onReintentar={() => { setCargando(true); cargar(); }}
          />
        }
        ItemSeparatorComponent={() => <View style={[estilos.sep, { backgroundColor: colores.borde }]} />}
        renderItem={({ item }) => (
          <View style={estilos.fila}>
            <Avatar nombre={item.usuario} uri={item.avatar_url} tamano={42} />
            <Text style={[estilos.nombre, { color: colores.texto }]} numberOfLines={1}>{item.usuario}</Text>
            <Pressable
              onPress={() => desbloquear(item.id)}
              disabled={ocupado === item.id}
              style={({ pressed }) => [estilos.boton, { borderColor: colores.borde }, pressed && estilos.presionado]}
            >
              <Text style={[estilos.botonTxt, { color: colores.texto }]}>{ocupado === item.id ? "…" : "Desbloquear"}</Text>
            </Pressable>
          </View>
        )}
      />
    </View>
  );
}

const estilos = StyleSheet.create({
  lista: { padding: 20, flexGrow: 1 },
  fila: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 10 },
  nombre: { flex: 1, fontSize: 15 },
  boton: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8 },
  botonTxt: { fontSize: 13, fontFamily: fuentes.media },
  sep: { height: 1, marginLeft: 54 },
  presionado: { opacity: 0.6 },
});
