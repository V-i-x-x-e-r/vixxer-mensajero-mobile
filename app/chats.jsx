// app/chats.jsx — Lista de chats / buscador de contactos.
// LÓGICA (Paola): abre el socket (una sola vez para toda la app), refleja el estado
// de conexión, y busca contactos en el backend. Al tocar uno, navega a la conversación.
// VISUAL (Raúl): la FlatList y el encabezado de abajo son provisionales.
//
// Nota: GET /api/usuarios/buscar lo entrega Ricardo en el Sprint A. Mientras no esté,
// la búsqueda devolverá error de red/404 y la lista quedará vacía (la UI no se rompe).

import { useEffect, useState } from "react";
import { View, Text, TextInput, Pressable, FlatList, StyleSheet } from "react-native";
import { router } from "expo-router";
import * as api from "../lib/api";
import { conectarSocket } from "../lib/socket";
import { leer, cerrarSesion, TOKEN } from "../lib/storage";
import { colores } from "../assets/themes/colores";
import { Boton } from "../components/Boton";
import { Campo } from "../components/Campo";

export default function Chats() {
  const [q, setQ] = useState("");
  const [contactos, setContactos] = useState([]);
  const [estado, setEstado] = useState("conectando…");

  // Conectar el socket al entrar y reflejar el estado en la UI.
  useEffect(() => {
    let socket;
    (async () => {
      const token = await leer(TOKEN);
      if (!token) {
        router.replace("/");
        return;
      }
      socket = conectarSocket(token);
      setEstado(socket.connected ? "conectado" : "conectando…");
      socket.on("connect", () => setEstado("conectado"));
      socket.on("disconnect", () => setEstado("sin conexión"));
      socket.on("connect_error", () => setEstado("sin conexión"));
    })();
    return () => {
      if (socket) {
        socket.off("connect");
        socket.off("disconnect");
        socket.off("connect_error");
      }
    };
  }, []);

  async function buscar(texto) {
    setQ(texto);
    if (texto.trim().length < 1) {
      setContactos([]);
      return;
    }
    try {
      setContactos(await api.buscarUsuarios(texto.trim()));
    } catch (e) {
      setContactos([]); // endpoint aún no listo o sin resultados: no rompemos la UI
    }
  }

  async function salir() {
    await cerrarSesion();
    router.replace("/");
  }

  // ----- VISUAL provisional (Raúl) -----
  return (
    <View style={s.cont}>
      <View style={s.barra}>
        <Text style={s.estado}>● {estado}</Text>
        <Pressable onPress={salir}>
          <Text style={s.link}>Salir</Text>
        </Pressable>
      </View>
      <TextInput
        value={q}
        onChangeText={buscar}
        placeholder="Buscar usuario…"
        placeholderTextColor="#7c8597"
        autoCapitalize="none"
        style={s.campo}
      />
      <FlatList
        data={contactos}
        keyExtractor={(c) => c.id}
        ListEmptyComponent={<Text style={s.vacio}>Busca a alguien para empezar a chatear.</Text>}
        renderItem={({ item }) => (
          <Pressable onPress={() => router.push(`/chat/${item.id}`)} style={s.fila}>
            <Text style={s.nombre}>{item.usuario}</Text>
          </Pressable>
        )}
      />
    </View>
  );
}

// app/chats.jsx (fragmento estilos)
const s = StyleSheet.create({
  cont: { flex: 1, padding: 16, gap: 12, backgroundColor: colores.fondo },
  barra: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  estado: { color: colores.textoSecundario },
  link: { color: colores.azul },
  campo: { 
    backgroundColor: colores.surface,
    borderWidth: 1, 
    borderColor: colores.borde,
    borderRadius: 10, 
    padding: 12, 
    color: colores.texto,
  },
  fila: { 
    padding: 16, 
    borderBottomWidth: 1, 
    borderBottomColor: colores.borde,
    backgroundColor: colores.surface,
    borderRadius: 8,
    marginVertical: 4,
  },
  nombre: { color: colores.texto, fontSize: 16 },
  vacio: { color: colores.textoSecundario, textAlign: "center", marginTop: 32 },
});
