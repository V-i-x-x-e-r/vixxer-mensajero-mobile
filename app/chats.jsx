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
import { EstadoLista } from "../components/EstadoLista";

export default function Chats()
{
  const { colores } = useTema();
  const insets = useSafeAreaInsets();
  const [amigos, setAmigos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(false);
  const [pendientes, setPendientes] = useState(0);
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

  const cargar = useCallback(async () =>
  {
    setError(false);
    try
    {
      const lista = await api.amigos();
      setAmigos(lista);
      const sol = await api.solicitudes();
      setPendientes(sol.length);
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
          {pendientes > 0 ? (
            <View style={[estilos.badge, { backgroundColor: colores.botonFondo }]}>
              <Text style={[estilos.badgeTxt, { color: colores.botonTexto }]}>{pendientes}</Text>
            </View>
          ) : null}
        </Pressable>
      </View>

      <FlatList
        data={amigos}
        keyExtractor={(a) => a.id}
        style={estilos.lista}
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
  chip: { flex: 1, borderWidth: 1, borderRadius: 10, paddingVertical: 12, alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 8 },
  chipTxt: { fontSize: 14 },
  badge: { minWidth: 20, height: 20, borderRadius: 10, paddingHorizontal: 6, alignItems: "center", justifyContent: "center" },
  badgeTxt: { fontSize: 12, fontFamily: fuentes.semibold },
  lista: { flex: 1 },
  fila: { padding: 16, borderRadius: 10, borderWidth: 1, marginBottom: 8 },
  nombre: { fontSize: 16 },
});
