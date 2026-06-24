import { useEffect, useState, useCallback } from "react";
import { View, Text, Pressable, FlatList, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useFocusEffect } from "expo-router";
import * as api from "../lib/api";
import { conectarSocket } from "../lib/socket";
import { leer, TOKEN } from "../lib/storage";
import { useTema } from "../components/tema";
import { fuentes } from "../assets/themes/temas";
import { Logo } from "../components/Logo";
import { Engrane } from "../components/Engrane";

export default function Chats()
{
  const { colores } = useTema();
  const insets = useSafeAreaInsets();
  const [amigos, setAmigos] = useState([]);
  const [estado, setEstado] = useState("conectando…");

  useEffect(() =>
  {
    let socket;
    (async () =>
    {
      const token = await leer(TOKEN);
      if (!token)
      {
        router.replace("/");
        return;
      }
      socket = conectarSocket(token);
      setEstado(socket.connected ? "conectado" : "conectando…");
      socket.on("connect", () => setEstado("conectado"));
      socket.on("disconnect", () => setEstado("sin conexión"));
      socket.on("connect_error", () => setEstado("sin conexión"));
    })();

    return () =>
    {
      if (socket)
      {
        socket.off("connect");
        socket.off("disconnect");
        socket.off("connect_error");
      }
    };
  }, []);

  useFocusEffect(
    useCallback(() =>
    {
      api.amigos().then(setAmigos).catch(() => setAmigos([]));
    }, []),
  );

  const conectado = estado === "conectado";

  return (
    <View style={[estilos.pantalla, { backgroundColor: colores.fondo, paddingTop: insets.top + 12 }]}>
      <View style={estilos.cabecera}>
        <View style={estilos.marca}>
          <Logo alto={24} />
          <Text style={[estilos.titulo, { color: colores.texto }]}>Vixxer</Text>
        </View>
        <Pressable onPress={() => router.push("/ajustes")} hitSlop={8}>
          <Engrane color={colores.texto} />
        </Pressable>
      </View>

      <View style={estilos.estado}>
        <View style={[estilos.punto, { backgroundColor: conectado ? "#22C55E" : colores.muted }]} />
        <Text style={[estilos.estadoTxt, { color: colores.muted }]}>{estado}</Text>
      </View>

      <View style={estilos.acciones}>
        <Pressable onPress={() => router.push("/agregar")} style={[estilos.chip, { borderColor: colores.borde }]}>
          <Text style={[estilos.chipTxt, { color: colores.texto }]}>Agregar por código</Text>
        </Pressable>
        <Pressable onPress={() => router.push("/solicitudes")} style={[estilos.chip, { borderColor: colores.borde }]}>
          <Text style={[estilos.chipTxt, { color: colores.texto }]}>Solicitudes</Text>
        </Pressable>
      </View>

      <FlatList
        data={amigos}
        keyExtractor={(a) => a.id}
        style={estilos.lista}
        ListEmptyComponent={
          <Text style={[estilos.vacio, { color: colores.muted }]}>
            Aún no tienes contactos. Agrega a alguien por su código.
          </Text>
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => router.push({ pathname: "/chat/[id]", params: { id: item.id, usuario: item.usuario } })}
            style={[estilos.fila, { backgroundColor: colores.surface, borderColor: colores.borde }]}
          >
            <Text style={[estilos.nombre, { color: colores.texto }]}>{item.usuario}</Text>
          </Pressable>
        )}
      />
    </View>
  );
}

const estilos = StyleSheet.create({
  pantalla: { flex: 1, paddingHorizontal: 20, gap: 12 },
  cabecera: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  marca: { flexDirection: "row", alignItems: "center", gap: 10 },
  titulo: { fontSize: 18, fontFamily: fuentes.semibold },
  estado: { flexDirection: "row", alignItems: "center", gap: 6 },
  punto: { width: 8, height: 8, borderRadius: 4 },
  estadoTxt: { fontSize: 13 },
  acciones: { flexDirection: "row", gap: 10 },
  chip: { flex: 1, borderWidth: 1, borderRadius: 10, paddingVertical: 12, alignItems: "center" },
  chipTxt: { fontSize: 14 },
  lista: { flex: 1 },
  fila: { padding: 16, borderRadius: 10, borderWidth: 1, marginBottom: 8 },
  nombre: { fontSize: 16 },
  vacio: { textAlign: "center", marginTop: 40, fontSize: 14 },
});
