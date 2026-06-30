import { useEffect, useState } from "react";
import { Modal, View, Text, Pressable, FlatList, StyleSheet } from "react-native";
import * as api from "../lib/api";
import { useTema } from "./tema";
import { fuentes } from "../assets/themes/temas";
import { Avatar } from "./Avatar";

export function SelectorContacto({ visible, titulo, onElegir, onCerrar })
{
  const { colores } = useTema();
  const [amigos, setAmigos] = useState([]);

  useEffect(() =>
  {
    if (visible)
    {
      api.amigos().then(setAmigos).catch(() => {});
    }
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onCerrar}>
      <Pressable style={estilos.fondo} onPress={onCerrar}>
        <Pressable style={[estilos.hoja, { backgroundColor: colores.fondo, borderColor: colores.borde }]} onPress={() => {}}>
          <View style={estilos.barra}>
            <Text style={[estilos.titulo, { color: colores.texto }]}>{titulo}</Text>
            <Pressable onPress={onCerrar} hitSlop={8}>
              <Text style={{ color: colores.muted, fontSize: 18 }}>{"✕"}</Text>
            </Pressable>
          </View>
          <FlatList
            data={amigos}
            keyExtractor={(a) => a.id}
            style={estilos.lista}
            renderItem={({ item }) => (
              <Pressable onPress={() => onElegir(item)} style={({ pressed }) => [estilos.fila, pressed && estilos.presionado]}>
                <Avatar nombre={item.usuario} uri={item.avatar_url} tamano={40} />
                <Text style={[estilos.nombre, { color: colores.texto }]}>{item.usuario}</Text>
              </Pressable>
            )}
            ListEmptyComponent={<Text style={[estilos.vacio, { color: colores.muted }]}>No tienes contactos.</Text>}
          />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const estilos = StyleSheet.create({
  fondo: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.35)" },
  hoja: { maxHeight: "70%", borderTopLeftRadius: 20, borderTopRightRadius: 20, borderWidth: 1, paddingBottom: 24 },
  barra: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 16 },
  titulo: { fontSize: 16, fontFamily: fuentes.semibold },
  lista: { paddingHorizontal: 12 },
  fila: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 10, paddingHorizontal: 8 },
  nombre: { fontSize: 16 },
  presionado: { opacity: 0.6 },
  vacio: { textAlign: "center", paddingVertical: 24 },
});
